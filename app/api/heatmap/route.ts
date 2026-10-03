import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHeatmapScore, ScoringAnchor } from "@/lib/safetyScorer";
import { getCached, setCached } from "@/lib/upstash";
import { fetchNearbyPlaces } from "@/lib/google-maps";
import { PlaceCategory } from "@/types/place";

// =======================================================================
// GET /api/heatmap
// Generates a grid of heatmap score points for the visible map viewport.
//
// The grid covers the requested bounding box at ~500m spacing,
// producing a smooth heatmap across any Delhi NCR neighbourhood.
//
// Results are cached in Upstash Redis with a 15-min TTL keyed to the
// 2-decimal-place bucket (≈1.1 km grid cell) of the viewport centre.
//
// Query params:
//   north, south, east, west — viewport bounds (degrees)
//
// Response:
//   { points: { lat, lng, weight }[] }
//   weight is normalised 0–1 (0 = red / unsafe, 1 = green / safe)
// =======================================================================

export const dynamic = "force-dynamic";

/** Degree step for the heatmap grid (~500 m at Delhi latitude) */
const GRID_STEP_DEG = 0.005; // ≈ 555 m lat, ≈ 435 m lng at 28°N

/** Cap the grid to avoid runaway responses at extreme zoom levels */
const MAX_GRID_POINTS = 200;

/** Place types that act as safety anchors in the WSI formula */
const ANCHOR_TYPES: string[] = ["police", "hospital", "subway_station", "pharmacy"];

/** PlaceCategory mapping for the scoring engine */
const TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  police:          "POLICE_STATION",
  hospital:        "HOSPITAL_247",
  subway_station:  "METRO_STATION",
  pharmacy:        "SAFE_HAVEN_STORE",
  bus_station:     "METRO_STATION",
};

function heatmapCacheKey(
  north: number,
  south: number,
  east: number,
  west: number
): string {
  // Bucket to 2 decimal places (~1.1 km) so nearby viewports share cache
  const snap = (v: number) => Math.round(v * 100) / 100;
  const hour = Math.floor(Date.now() / 3_600_000);
  return `heatmap:${snap(north)}:${snap(south)}:${snap(east)}:${snap(west)}:${hour}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const north = parseFloat(searchParams.get("north") ?? searchParams.get("maxLat") ?? "");
    const south = parseFloat(searchParams.get("south") ?? searchParams.get("minLat") ?? "");
    const east  = parseFloat(searchParams.get("east")  ?? searchParams.get("maxLng") ?? "");
    const west  = parseFloat(searchParams.get("west")  ?? searchParams.get("minLng") ?? "");

    if ([north, south, east, west].some(isNaN)) {
      return NextResponse.json(
        { error: "Missing or invalid bounds: north, south, east, west required" },
        { status: 400 }
      );
    }

    // ── Cache check ──────────────────────────────────────────────────────────
    const cacheKey = heatmapCacheKey(north, south, east, west);
    const cached = await getCached<{ lat: number; lng: number; weight: number }[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ points: cached, cached: true });
    }

    // ── Build grid of lat/lng points ─────────────────────────────────────────
    const gridPoints: { lat: number; lng: number }[] = [];
    let step = GRID_STEP_DEG;

    // Widen step if the viewport is large (zoomed out) to stay under MAX_GRID_POINTS
    const latSpan = north - south;
    const lngSpan = east  - west;
    const estCount = Math.ceil(latSpan / step) * Math.ceil(lngSpan / step);
    if (estCount > MAX_GRID_POINTS) {
      const scale = Math.sqrt(estCount / MAX_GRID_POINTS);
      step = GRID_STEP_DEG * scale;
    }

    for (let lat = south; lat <= north; lat += step) {
      for (let lng = west; lng <= east; lng += step) {
        gridPoints.push({ lat, lng });
        if (gridPoints.length >= MAX_GRID_POINTS) break;
      }
      if (gridPoints.length >= MAX_GRID_POINTS) break;
    }

    if (gridPoints.length === 0) {
      return NextResponse.json({ points: [] });
    }

    // ── Fetch safety anchors once for the entire viewport ────────────────────
    // Centre of the viewport is good enough for the Places API query
    const centLat = (north + south) / 2;
    const centLng = (east  + west)  / 2;
    // Radius = half-diagonal of the viewport in metres (rough)
    const latMetres = (north - south) * 111_000;
    const lngMetres = (east  - west)  * 111_000 * Math.cos(centLat * (Math.PI / 180));
    const radiusM   = Math.min(Math.round(Math.hypot(latMetres, lngMetres) / 2), 5000);

    const anchorResults = await Promise.allSettled(
      ANCHOR_TYPES.map((type) => fetchNearbyPlaces(centLat, centLng, type, radiusM, 20))
    );

    const seen = new Set<string>();
    const anchors: ScoringAnchor[] = [];
    for (const result of anchorResults) {
      if (result.status !== "fulfilled") continue;
      for (const place of result.value) {
        if (seen.has(place.placeId)) continue;
        seen.add(place.placeId);
        anchors.push({
          placeId:   place.placeId,
          placeName: place.name,
          category:  TYPE_TO_CATEGORY[place.type] ?? "SAFE_HAVEN_STORE",
          latitude:  place.latitude,
          longitude: place.longitude,
        });
      }
    }

    // ── Fetch active community hazard notes for the viewport ─────────────────
    const activeHazards = await prisma.locationNote.findMany({
      where: {
        noteType: "COMMUNITY_ALERT",
        status:   "ACTIVE",
        latitude:  { gte: south, lte: north },
        longitude: { gte: west,  lte: east  },
        hazardCategory: { in: ["POOR_LIGHTING", "DESERTED_AREA", "HARASSMENT_SPOT"] },
      },
      select: {
        id: true, hazardCategory: true,
        latitude: true, longitude: true,
        upvotesCount: true, downvotesCount: true,
      },
    });

    // ── Score every grid point ────────────────────────────────────────────────
    // computeHeatmapScore uses anchors only (fast); we apply a simplified
    // hazard proximity penalty inline for the visual quality.
    const HAZARD_PENALTY: Record<string, number> = {
      HARASSMENT_SPOT: -3.0,
      DESERTED_AREA:   -2.0,
      POOR_LIGHTING:   -1.5,
    };
    const HAZARD_RADIUS_KM = 0.4; // tighter than scoring engine for visual sharpness

    const now = new Date();
    const points = gridPoints.map(({ lat, lng }) => {
      let score = computeHeatmapScore(lat, lng, anchors, now);

      // Inline hazard overlay
      for (const hazard of activeHazards) {
        const dLat = (lat - hazard.latitude) * 111;
        const dLng = (lng - hazard.longitude) * 111 * Math.cos(lat * (Math.PI / 180));
        const distKm = Math.hypot(dLat, dLng);
        if (distKm > HAZARD_RADIUS_KM * 2) continue;
        const basePenalty = HAZARD_PENALTY[hazard.hazardCategory] ?? 0;
        const net = hazard.upvotesCount - hazard.downvotesCount;
        const credibility = Math.min(1.5, 0.5 + net * 0.1);
        const decay = Math.exp(-distKm / HAZARD_RADIUS_KM);
        score = Math.max(0, score + basePenalty * credibility * decay);
      }

      // Normalise to [0, 1]: 0 = red (unsafe), 1 = green (safe)
      const weight = Math.round((score / 10) * 1000) / 1000;
      return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000, weight };
    });

    // ── Cache for 15 minutes ─────────────────────────────────────────────────
    await setCached(cacheKey, points, 900);

    return NextResponse.json({ points, cached: false }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=900" },
    });
  } catch (error) {
    console.error("[heatmap] Error generating heatmap grid:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
