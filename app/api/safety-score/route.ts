import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBoundingBox } from "@/lib/haversine";
import {
  computeSafetyScore,
  ScoringAnchor,
  ScoringHazard,
} from "@/lib/safetyScorer";
import { PlaceCategory } from "@/types/place";

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

    // Rough Delhi NCR bounds check (approx)
    if (lat < 27.5 || lat > 29.5 || lng < 76.5 || lng > 78.0) {
      return NextResponse.json(
        { error: "Coordinates are outside the supported Delhi NCR region" },
        { status: 400 }
      );
    }

    // ── Fetch nearby SafetyPlaces (within 2.5km bounding box) ───────────
    const anchorBox = calculateBoundingBox(lat, lng, 2.5);
    const nearbyPlaces = await prisma.safetyPlace.findMany({
      where: {
        latitude: { gte: anchorBox.minLat, lte: anchorBox.maxLat },
        longitude: { gte: anchorBox.minLng, lte: anchorBox.maxLng },
      },
      select: {
        id: true,
        name: true,
        category: true,
        latitude: true,
        longitude: true,
      },
    });

    const anchors: ScoringAnchor[] = nearbyPlaces.map((p) => ({
      placeId: p.id,
      placeName: p.name,
      category: p.category as PlaceCategory,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

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
