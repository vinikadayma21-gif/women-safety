import { NextResponse } from "next/server";
import { haversineDistance } from "@/lib/haversine";
import { fetchNearbyPlaces, GooglePlace } from "@/lib/google-maps";
import { getCached, setCached, placesCacheKey } from "@/lib/upstash";

export const dynamic = "force-dynamic";

// Map old filter category params → Google Places types
// Kept for backwards compatibility with existing hook/UI query params
const CATEGORY_TO_TYPES: Record<string, string[]> = {
  POLICE_STATION: ["police"],
  PINK_BOOTH: ["police"],
  METRO_STATION: ["subway_station", "bus_station"],
  HOSPITAL_247: ["hospital"],
  SAFE_HAVEN_STORE: ["pharmacy", "convenience_store"],
  ALL: ["police", "hospital", "subway_station", "pharmacy"],
};

/**
 * GET /api/places/nearby
 * Returns nearby safe infrastructure POIs from Google Places API.
 * Results are cached in Upstash Redis (6-hour TTL).
 *
 * Query params:
 * - lat: latitude (default: 28.6139)
 * - lng: longitude (default: 77.2090)
 * - radius: search radius in metres (default: 2000, max: 5000)
 * - category: optional filter (PlaceCategory string or "ALL")
 * - limit: max results to return (default: 60)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get("lat") || "28.6139");
    const lng = parseFloat(searchParams.get("lng") || "77.2090");
    const rawRadius = parseFloat(searchParams.get("radius") || "2000");
    const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10), 100);
    const categoryParam = searchParams.get("category") || "ALL";

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates provided." },
        { status: 400 }
      );
    }

    const radiusMetres = Math.max(500, Math.min(rawRadius, 5000));
    const types = CATEGORY_TO_TYPES[categoryParam.toUpperCase()] ??
      CATEGORY_TO_TYPES["ALL"];

    // Attempt to serve from Upstash cache
    const cacheKey = placesCacheKey(lat, lng, categoryParam);
    const cached = await getCached<GooglePlace[]>(cacheKey);

    let places: GooglePlace[];

    if (cached) {
      places = cached;
    } else {
      // Fan-out parallel requests for each place type
      const results = await Promise.allSettled(
        types.map((type) => fetchNearbyPlaces(lat, lng, type, radiusMetres, 20))
      );

      // Merge all fulfilled results, deduplicate by placeId
      const seen = new Set<string>();
      places = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          for (const place of result.value) {
            if (!seen.has(place.placeId)) {
              seen.add(place.placeId);
              places.push(place);
            }
          }
        }
      }

      // Cache for 6 hours (places are stable)
      await setCached(cacheKey, places, 6 * 3600);
    }

    // Attach exact Haversine distance and sort nearest first
    const placesWithDistance = places
      .map((place) => ({
        ...place,
        distanceKm: parseFloat(
          haversineDistance(lat, lng, place.latitude, place.longitude).toFixed(3)
        ),
        // Map Google Place fields to shape expected by existing UI components
        category: place.type.toUpperCase(),
        address: place.address,
        contactNumber: null,
        landmark: null,
        is24x7: place.isOpen ?? true,
        region: "Delhi NCR",
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: placesWithDistance.length,
      userLocation: { lat, lng },
      radiusKm: radiusMetres / 1000,
      places: placesWithDistance,
      data: placesWithDistance,
    });
  } catch (error) {
    console.error("❌ [API] Failed to fetch nearby places:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching nearby places." },
      { status: 500 }
    );
  }
}
