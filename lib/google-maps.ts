// =======================================================================
// lib/google-maps.ts — Server-side Google Maps API client (PLANv2 Phase 1)
// Uses GOOGLE_MAPS_SERVER_KEY — NEVER import in client components.
//
// Functions:
//   fetchNearbyPlaces()  — Google Places API (New) nearby search
//   getWalkingTime()     — Distance Matrix API walking duration
// =======================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single place returned from the Google Places API (New) */
export interface GooglePlace {
  placeId: string;
  name: string;
  /** Primary place type from the Places API */
  type: string;
  latitude: number;
  longitude: number;
  /** Formatted address if available */
  address: string;
  /** Whether the place is currently open (null if unknown) */
  isOpen: boolean | null;
  /** Google Maps rating 1–5 (null if unrated) */
  rating: number | null;
}

/** Result from the Distance Matrix API */
export interface WalkTimeResult {
  /** e.g. "320 m" */
  distanceText: string;
  /** e.g. "4 mins" */
  durationText: string;
  /** Distance in metres */
  distanceMetres: number;
  /** Duration in seconds */
  durationSeconds: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getServerKey(): string {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key || key === "AIza...") {
    throw new Error(
      "[google-maps] GOOGLE_MAPS_SERVER_KEY is not configured. " +
        "Add it to .env and restart the dev server."
    );
  }
  return key;
}

// Map our internal type strings to Google Places API (New) includedTypes
const TYPE_MAP: Record<string, string> = {
  police: "police",
  hospital: "hospital",
  subway_station: "subway_station",
  pharmacy: "pharmacy",
  bus_station: "bus_station",
  atm: "atm",
  convenience_store: "convenience_store",
};

// ---------------------------------------------------------------------------
// fetchNearbyPlaces — Google Places API (New) Nearby Search
// ---------------------------------------------------------------------------

interface PlacesApiResponse {
  places?: {
    id: string;
    displayName?: { text: string };
    types?: string[];
    location?: { latitude: number; longitude: number };
    formattedAddress?: string;
    currentOpeningHours?: { openNow: boolean };
    rating?: number;
  }[];
}

/**
 * Fetch nearby places of a given type using Google Places API (New).
 *
 * @param lat       Centre latitude
 * @param lng       Centre longitude
 * @param type      Place type key — one of: "police" | "hospital" | "subway_station" | "pharmacy"
 * @param radius    Search radius in metres (default 2000)
 * @param maxResults Maximum number of results to return (default 10)
 */
export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radius = 2000,
  maxResults = 10
): Promise<GooglePlace[]> {
  const apiKey = getServerKey();
  const includedType = TYPE_MAP[type] ?? type;

  const body = {
    includedTypes: [includedType],
    maxResultCount: maxResults,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
  };

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // Field mask — only request the fields we use to minimise billing
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.types",
          "places.location",
          "places.formattedAddress",
          "places.currentOpeningHours.openNow",
          "places.rating",
        ].join(","),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    console.error(`[google-maps] Places API ${res.status}: ${text}`);
    return [];
  }

  const data: PlacesApiResponse = await res.json();

  return (data.places ?? []).map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "Unknown",
    type: p.types?.[0] ?? type,
    latitude: p.location?.latitude ?? lat,
    longitude: p.location?.longitude ?? lng,
    address: p.formattedAddress ?? "",
    isOpen: p.currentOpeningHours?.openNow ?? null,
    rating: p.rating ?? null,
  }));
}

// ---------------------------------------------------------------------------
// getWalkingTime — Distance Matrix API
// ---------------------------------------------------------------------------

interface DistanceMatrixResponse {
  rows?: {
    elements?: {
      status: string;
      distance?: { text: string; value: number };
      duration?: { text: string; value: number };
    }[];
  }[];
}

/**
 * Get walking time and distance between two coordinates via Google
 * Distance Matrix API.
 *
 * @param fromLat  Origin latitude
 * @param fromLng  Origin longitude
 * @param toLat    Destination latitude
 * @param toLng    Destination longitude
 */
export async function getWalkingTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkTimeResult | null> {
  const apiKey = getServerKey();

  const params = new URLSearchParams({
    origins: `${fromLat},${fromLng}`,
    destinations: `${toLat},${toLng}`,
    mode: "walking",
    units: "metric",
    key: apiKey,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`,
    {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600 }, // Cache walk times for 1 hour in Next.js
    }
  );

  if (!res.ok) {
    console.warn(`[google-maps] Distance Matrix HTTP ${res.status}`);
    return null;
  }

  const data: DistanceMatrixResponse = await res.json();
  const element = data.rows?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    console.warn("[google-maps] Distance Matrix element status:", element?.status);
    return null;
  }

  return {
    distanceText: element.distance?.text ?? "—",
    durationText: element.duration?.text ?? "—",
    distanceMetres: element.distance?.value ?? 0,
    durationSeconds: element.duration?.value ?? 0,
  };
}
