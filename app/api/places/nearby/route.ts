import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBoundingBox, haversineDistance } from "@/lib/haversine";
import { PlaceCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/places/nearby
 * Returns verified Delhi NCR safe infrastructure POIs (Pink Booths, Police, Metro, Hospitals, Safe Havens)
 * ordered by distance from requested coordinates.
 *
 * Query params:
 * - lat: latitude (default: 28.6139 - New Delhi)
 * - lng: longitude (default: 77.2090)
 * - radius: search radius in km (default: 5.0, max: 50.0)
 * - category: optional filter (comma-separated or single PlaceCategory)
 * - limit: max results to return (default: 60)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get("lat") || "28.6139");
    const lng = parseFloat(searchParams.get("lng") || "77.2090");
    const rawRadius = parseFloat(searchParams.get("radius") || "5.0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100);
    const categoryParam = searchParams.get("category");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates provided." },
        { status: 400 }
      );
    }

    // Clamp radius between 0.5 km and 50 km
    const radiusKm = Math.max(0.5, Math.min(rawRadius, 50.0));

    // Calculate bounding box for fast DB index range query
    const bbox = calculateBoundingBox(lat, lng, radiusKm);

    // Build category filter condition
    let categoryFilter: PlaceCategory[] | undefined = undefined;
    if (categoryParam && categoryParam !== "ALL") {
      const requestedCategories = categoryParam
        .split(",")
        .map((c) => c.trim().toUpperCase());

      const validCategories = Object.values(PlaceCategory);
      const filtered = requestedCategories.filter((c): c is PlaceCategory =>
        validCategories.includes(c as PlaceCategory)
      );

      if (filtered.length > 0) {
        categoryFilter = filtered;
      }
    }

    // Query Neon PostgreSQL database
    const places = await prisma.safetyPlace.findMany({
      where: {
        latitude: {
          gte: bbox.minLat,
          lte: bbox.maxLat,
        },
        longitude: {
          gte: bbox.minLng,
          lte: bbox.maxLng,
        },
        ...(categoryFilter ? { category: { in: categoryFilter } } : {}),
      },
      select: {
        id: true,
        name: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        contactNumber: true,
        landmark: true,
        is24x7: true,
        region: true,
        createdAt: true,
      },
    });

    // Calculate exact Haversine distance and sort nearest first
    const placesWithDistance = places
      .map((place) => {
        const distanceKm = haversineDistance(
          lat,
          lng,
          place.latitude,
          place.longitude
        );
        return {
          ...place,
          distanceKm: parseFloat(distanceKm.toFixed(3)),
        };
      })
      .filter((place) => place.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: placesWithDistance.length,
      userLocation: { lat, lng },
      radiusKm,
      places: placesWithDistance,
      data: placesWithDistance,
    });
  } catch (error) {
    console.error("❌ [API] Failed to fetch nearby safety places:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching nearby places." },
      { status: 500 }
    );
  }
}
