import { NextRequest, NextResponse } from "next/server";
import { getWalkingTime } from "@/lib/google-maps";
import { getCached, setCached } from "@/lib/upstash";

// =======================================================================
// GET /api/walk-time — Google Distance Matrix walking duration (Phase 5)
//
// Returns walking distance text and duration text for the route from the
// user's current location to a selected safe-place destination.
//
// Results are cached in Upstash Redis with a 1-hour TTL —  walking times
// between fixed points are stable enough to cache aggressively.
//
// Query params:
//   fromLat, fromLng — origin (user location)
//   toLat,   toLng   — destination (selected place)
//
// Response:
//   { distanceText: "320 m", durationText: "4 mins",
//     distanceMetres: 320, durationSeconds: 240 }
// =======================================================================

export const dynamic = "force-dynamic";

/** Round coordinates to 3 decimal places (~111 m grid) for cache key */
function snap(v: number) {
  return Math.round(v * 1000) / 1000;
}

function walkTimeCacheKey(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `walk-time:${snap(fromLat)}:${snap(fromLng)}:${snap(toLat)}:${snap(toLng)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const fromLat = parseFloat(searchParams.get("fromLat") ?? "");
    const fromLng = parseFloat(searchParams.get("fromLng") ?? "");
    const toLat   = parseFloat(searchParams.get("toLat")   ?? "");
    const toLng   = parseFloat(searchParams.get("toLng")   ?? "");

    // ── Validate ────────────────────────────────────────────────────────────
    if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
      return NextResponse.json(
        { error: "Missing or invalid params: fromLat, fromLng, toLat, toLng required" },
        { status: 400 }
      );
    }

    // NCR sanity bounds
    for (const [lat, lng] of [[fromLat, fromLng], [toLat, toLng]]) {
      if (lat < 27.0 || lat > 30.0 || lng < 76.0 || lng > 78.5) {
        return NextResponse.json(
          { error: "Coordinates outside the supported NCR region" },
          { status: 400 }
        );
      }
    }

    // ── Upstash cache ───────────────────────────────────────────────────────
    const cacheKey = walkTimeCacheKey(fromLat, fromLng, toLat, toLng);
    const cached = await getCached<{
      distanceText: string;
      durationText: string;
      distanceMetres: number;
      durationSeconds: number;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // ── Fetch from Distance Matrix API ──────────────────────────────────────
    const result = await getWalkingTime(fromLat, fromLng, toLat, toLng);

    if (!result) {
      return NextResponse.json(
        { error: "Could not calculate walking time for this route" },
        { status: 502 }
      );
    }

    // Cache for 1 hour — walking routes between fixed POIs don't change
    await setCached(cacheKey, result, 3600);

    return NextResponse.json(
      { ...result, cached: false },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("[walk-time] Error fetching walking time:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
