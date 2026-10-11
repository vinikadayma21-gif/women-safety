import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBoundingBox } from "@/lib/haversine";
import {
  computeSafetyScore,
  ScoringAnchor,
  ScoringHazard,
} from "@/lib/safetyScorer";
import { PlaceCategory } from "@/types/place";
import { fetchNearbyPlaces } from "@/lib/google-maps";
import { getLightingScore, getCCTVScore, overpassCacheKey } from "@/lib/overpass";
import { fetchWeather, weatherCacheKey } from "@/lib/openweather";
import { scoreToTier } from "@/types/safety";
import {
  getCached,
  setCached,
  safetyScoreCacheKey,
} from "@/lib/upstash";

// =======================================================================
// GET /api/safety-score — WSI 2.0 (PLANv2 Phase 4)
//
// Upgraded from Phase 1 stub.  Fan-out parallel fetch:
//   1. Google Places nearby (police, hospital, metro, pharmacy) → anchors
//   2. OSM Overpass street-lamp count                          → lightingScore
//   3. OSM Overpass CCTV count                                 → cctvScore
//   4. OpenWeatherMap current conditions                       → weatherMultiplier
//   5. Neon activeHazards query                                → hazard penalties
//
// Result is cached in Upstash Redis (15-min TTL per lat/lng/hour).
// Individual Overpass and weather results are also separately cached.
//
// Response fields added in WSI 2.0:
//   weatherCondition  — human-readable OWM condition, e.g. "Rain"
//   weatherMultiplier — 0.80–1.00 multiplier applied to raw score
//   lightingScore     — 0.0–1.5 pts from OSM street lamps
//   cctvScore         — 0.0–0.5 pts from OSM CCTV nodes
// =======================================================================

export const dynamic = "force-dynamic";

/** Map Google Places types → internal PlaceCategory for the scoring engine */
const TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  police:         "POLICE_STATION",
  hospital:       "HOSPITAL_247",
  subway_station: "METRO_STATION",
  bus_station:    "METRO_STATION",
  pharmacy:       "SAFE_HAVEN_STORE",
  convenience_store: "SAFE_HAVEN_STORE",
};

/** Place types to query for WSI anchor scoring */
const ANCHOR_TYPES = ["police", "hospital", "subway_station", "pharmacy"] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    // ── Validate coordinates ────────────────────────────────────────────────
    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: "Missing required query parameters: lat, lng" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng must be valid numbers" },
        { status: 400 }
      );
    }

    // NCR bounding box guard
    if (lat < 27.0 || lat > 30.0 || lng < 76.0 || lng > 78.5) {
      return NextResponse.json(
        { error: "Coordinates are outside the supported NCR region" },
        { status: 400 }
      );
    }

    // ── Upstash Redis: serve from cache if fresh ────────────────────────────
    const cacheKey = safetyScoreCacheKey(lat, lng);
    const cached = await getCached<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=900" },
      });
    }

    // ── Fan-out parallel fetch (Promise.allSettled — no single failure kills the score) ──
    const hazardBox = calculateBoundingBox(lat, lng, 1.5);

    const [
      placesResults,
      lightingResult,
      cctvResult,
      weatherResult,
      hazardResult,
    ] = await Promise.allSettled([

      // 1. Google Places anchors — fan out all 4 types in parallel
      Promise.allSettled(
        ANCHOR_TYPES.map((type) =>
          fetchNearbyPlaces(lat, lng, type, 2000, 15)
        )
      ),

      // 2. OSM Overpass — street lighting score (cached per 500m grid cell, 1h TTL)
      (async () => {
        const lKey = overpassCacheKey("lighting", lat, lng);
        const c = await getCached<{ count: number; score: number }>(lKey);
        if (c) return c;
        const r = await getLightingScore(lat, lng);
        await setCached(lKey, r, 3600); // 1-hour TTL (OSM rarely changes)
        return r;
      })(),

      // 3. OSM Overpass — CCTV score (cached per 500m grid cell, 1h TTL)
      (async () => {
        const cKey = overpassCacheKey("cctv", lat, lng);
        const c = await getCached<{ count: number; score: number }>(cKey);
        if (c) return c;
        const r = await getCCTVScore(lat, lng);
        await setCached(cKey, r, 3600);
        return r;
      })(),

      // 4. OpenWeatherMap current conditions (cached per 0.1° bucket, 15-min TTL)
      (async () => {
        const wKey = weatherCacheKey(lat, lng);
        const c = await getCached<{ condition: string; icon: string; visibilityMetres: number; multiplier: number }>(wKey);
        if (c) return c;
        const r = await fetchWeather(lat, lng);
        await setCached(wKey, r, 900); // 15-min TTL
        return r;
      })(),

      // 5. Neon DB — active community hazard notes within 1.5 km
      prisma.locationNote.findMany({
        where: {
          noteType: "COMMUNITY_ALERT",
          status: "ACTIVE",
          latitude:  { gte: hazardBox.minLat, lte: hazardBox.maxLat },
          longitude: { gte: hazardBox.minLng, lte: hazardBox.maxLng },
          hazardCategory: { in: ["POOR_LIGHTING", "DESERTED_AREA", "HARASSMENT_SPOT"] },
        },
        select: {
          id: true, hazardCategory: true,
          latitude: true, longitude: true,
          upvotesCount: true, downvotesCount: true,
        },
      }),
    ]);

    // ── Resolve anchor results ───────────────────────────────────────────────
    const anchors: ScoringAnchor[] = [];
    if (placesResults.status === "fulfilled") {
      const seen = new Set<string>();
      for (const result of placesResults.value) {
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
    }

    // ── Resolve lighting / CCTV scores ──────────────────────────────────────
    const lightingScore = lightingResult.status === "fulfilled"
      ? lightingResult.value.score
      : 0;
    const cctvScore = cctvResult.status === "fulfilled"
      ? cctvResult.value.score
      : 0;

    // ── Resolve weather ──────────────────────────────────────────────────────
    const weather = weatherResult.status === "fulfilled"
      ? weatherResult.value
      : { condition: "Unknown", icon: "01d", visibilityMetres: 10_000, multiplier: 1.0 };

    // ── Resolve community hazards ────────────────────────────────────────────
    const hazards: ScoringHazard[] = hazardResult.status === "fulfilled"
      ? hazardResult.value.map((n) => ({
          noteId:        n.id,
          hazardCategory: n.hazardCategory,
          latitude:      n.latitude,
          longitude:     n.longitude,
          upvotesCount:  n.upvotesCount,
          downvotesCount: n.downvotesCount,
        }))
      : [];

    // ── Compute base WSI score (anchors + hazard penalties + time multiplier) ─
    // Also inject lighting and CCTV as pseudo-anchors by bumping anchor score
    // directly — cleaner than modifying the scorer, preserves breakdown detail.
    const lightingAnchor: ScoringAnchor | null =
      lightingScore > 0
        ? {
            placeId:   "osm-lighting",
            placeName: "Street Lighting (OSM)",
            category:  "SAFE_HAVEN_STORE" as PlaceCategory,
            latitude:  lat,
            longitude: lng,
          }
        : null;

    const cctvAnchor: ScoringAnchor | null =
      cctvScore > 0
        ? {
            placeId:   "osm-cctv",
            placeName: "Surveillance Cameras (OSM)",
            category:  "SAFE_HAVEN_STORE" as PlaceCategory,
            latitude:  lat,
            longitude: lng,
          }
        : null;

    const allAnchors = [
      ...anchors,
      ...(lightingAnchor ? [lightingAnchor] : []),
      ...(cctvAnchor ? [cctvAnchor] : []),
    ];

    const baseScore = computeSafetyScore(lat, lng, allAnchors, hazards);

    // ── Apply weather multiplier on top ──────────────────────────────────────
    const rawFinal = baseScore.score * weather.multiplier;
    const finalScore = Math.round(Math.min(10, Math.max(0, rawFinal)) * 10) / 10;

    // Recompute tier and label for the weather-adjusted score
    const tier = scoreToTier(finalScore);
    const tierLabel: Record<string, string> = {
      HIGH:   "High Safety",
      MEDIUM: "Moderate Safety",
      LOW:    "Low Safety",
    };

    // ── Build enriched response (WSI 2.0) ────────────────────────────────────
    const enrichedScore = {
      ...baseScore,
      // Override with weather-adjusted values
      score:  finalScore,
      tier,
      label: `${finalScore.toFixed(1)} / 10 — ${tierLabel[tier]}`,

      // New WSI 2.0 fields
      weatherCondition:  weather.condition,
      weatherIcon:       weather.icon,
      weatherMultiplier: weather.multiplier,
      lightingScore:     Math.round(lightingScore * 100) / 100,
      cctvScore:         Math.round(cctvScore * 100) / 100,
      lightingCount:     lightingResult.status === "fulfilled" ? lightingResult.value.count : 0,
      cctvCount:         cctvResult.status === "fulfilled" ? cctvResult.value.count : 0,
    };

    // ── Cache enriched result for 15 minutes in Upstash ─────────────────────
    await setCached(cacheKey, enrichedScore, 900);

    return NextResponse.json(enrichedScore, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=900" },
    });
  } catch (error) {
    console.error("[safety-score] Error computing WSI 2.0 score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
