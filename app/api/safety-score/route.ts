import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBoundingBox } from "@/lib/haversine";
import {
  computeSafetyScore,
  ScoringAnchor,
  ScoringHazard,
} from "@/lib/safetyScorer";
// PlaceCategory import removed — SafetyPlace DB model dropped in PLANv2 Phase 1.
// Scoring anchors will be sourced from Google Places API in Phase 4.

// Public endpoint — no auth required (see middleware.ts)
// GET /api/safety-score?lat=28.61&lng=77.20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    // ── Validate coordinates ──────────────────────────────────────────────
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

    // NCR bounding box — covers Delhi, Gurgaon, Noida, Faridabad, Ghaziabad
    // Gurgaon ~28.46°N 77.03°E  |  Noida ~28.54°N 77.39°E
    // Faridabad ~28.41°N 77.31°E | Ghaziabad ~28.67°N 77.44°E
    if (lat < 27.0 || lat > 30.0 || lng < 76.0 || lng > 78.5) {
      return NextResponse.json(
        {
          error:
            "Coordinates are outside the supported NCR region (Delhi, Gurgaon, Noida, Faridabad, Ghaziabad)",
        },
        { status: 400 }
      );
    }

    // ── Safety anchors — Phase 1 stub ─────────────────────────────────────
    // SafetyPlace DB table removed in PLANv2 Phase 1 (POIs come from Google
    // Places API in Phase 4). For now, pass empty anchors so WSI scoring
    // still runs and returns a community-hazard-only score.
    const anchors: ScoringAnchor[] = [];

    // ── Fetch active community hazard notes (within 1.5km bounding box) ─
    const hazardBox = calculateBoundingBox(lat, lng, 1.5);
    const activeHazards = await prisma.locationNote.findMany({
      where: {
        noteType: "COMMUNITY_ALERT",
        status: "ACTIVE",
        latitude: { gte: hazardBox.minLat, lte: hazardBox.maxLat },
        longitude: { gte: hazardBox.minLng, lte: hazardBox.maxLng },
        hazardCategory: {
          in: ["POOR_LIGHTING", "DESERTED_AREA", "HARASSMENT_SPOT"],
        },
      },
      select: {
        id: true,
        hazardCategory: true,
        latitude: true,
        longitude: true,
        upvotesCount: true,
        downvotesCount: true,
      },
    });

    const hazards: ScoringHazard[] = activeHazards.map((n) => ({
      noteId: n.id,
      hazardCategory: n.hazardCategory,
      latitude: n.latitude,
      longitude: n.longitude,
      upvotesCount: n.upvotesCount,
      downvotesCount: n.downvotesCount,
    }));

    // ── Compute WSI score ─────────────────────────────────────────────────
    const safetyScore = computeSafetyScore(lat, lng, anchors, hazards);

    // Cache for 30 seconds (score changes with time and new reports)
    return NextResponse.json(safetyScore, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[safety-score] Error computing safety score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
