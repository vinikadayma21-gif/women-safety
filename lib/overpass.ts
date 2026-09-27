// =======================================================================
// lib/overpass.ts — OSM Overpass API query builder (PLANv2 Phase 1)
// Fetches street lamp and CCTV counts via the free Overpass API.
// No API key required. Calls are cached in Upstash by the safety-score
// route (15-min TTL).
//
// Score contributions:
//   getLightingScore  → 0.0 – 1.5 pts  (≥15 lamps = max)
//   getCCTVScore      → 0.0 – 0.5 pts  (≥5  cameras = max)
// =======================================================================

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/** Result shape returned by both scoring functions. */
export interface OverpassScoreResult {
  /** Count of matching OSM nodes found within the query radius */
  count: number;
  /** Normalised partial score contribution (NOT the full WSI score) */
  score: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a bounding box string from a centre point and radius in metres.
 * Overpass uses (south,west,north,east) order.
 */
function bbox(lat: number, lng: number, radiusMetres: number): string {
  // 1° latitude ≈ 111 320 m; 1° longitude ≈ 111 320 * cos(lat) m
  const deltaLat = radiusMetres / 111_320;
  const deltaLng = radiusMetres / (111_320 * Math.cos((lat * Math.PI) / 180));
  const south = lat - deltaLat;
  const north = lat + deltaLat;
  const west = lng - deltaLng;
  const east = lng + deltaLng;
  return `${south},${west},${north},${east}`;
}

/**
 * Execute an Overpass QL query and return the number of matching elements.
 * Returns 0 on any network or parse error (silent-fail).
 */
async function countNodes(query: string): Promise<number> {
  try {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(8_000), // 8-second hard timeout
    });

    if (!res.ok) {
      console.warn(`[overpass] HTTP ${res.status}`);
      return 0;
    }

    const data: { elements: unknown[] } = await res.json();
    return Array.isArray(data.elements) ? data.elements.length : 0;
  } catch (err) {
    console.warn("[overpass] query failed silently:", err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Count street lamps within `radiusMetres` (default 400 m) of the coordinate
 * and convert to a 0.0–1.5 point contribution to the WSI score.
 *
 * OSM tags queried:
 *   highway=street_lamp
 *   amenity=street_lamp
 *   light:type=*  (newer tagging scheme)
 *
 * Scoring scale:
 *   0 lamps → 0.0 pts
 *   1–4     → 0.3 pts
 *   5–9     → 0.7 pts
 *   10–14   → 1.1 pts
 *   ≥15     → 1.5 pts (max)
 */
export async function getLightingScore(
  lat: number,
  lng: number,
  radiusMetres = 400
): Promise<OverpassScoreResult> {
  const box = bbox(lat, lng, radiusMetres);

  // Combined query — union of the two most common OSM lamp tag conventions
  const query = `
[out:json][timeout:8];
(
  node["highway"="street_lamp"](${box});
  node["amenity"="street_lamp"](${box});
);
out count;
`.trim();

  const count = await countNodes(query);

  let score: number;
  if (count === 0) score = 0.0;
  else if (count < 5) score = 0.3;
  else if (count < 10) score = 0.7;
  else if (count < 15) score = 1.1;
  else score = 1.5;

  return { count, score };
}

/**
 * Count surveillance cameras within `radiusMetres` (default 300 m) and
 * convert to a 0.0–0.5 point contribution to the WSI score.
 *
 * OSM tags queried:
 *   man_made=surveillance
 *   surveillance:type=camera  (more specific)
 *
 * Scoring scale:
 *   0 cameras → 0.0 pts
 *   1–2       → 0.2 pts
 *   3–4       → 0.35 pts
 *   ≥5        → 0.5 pts (max)
 *
 * Note: OSM CCTV coverage is sparse in India — expect low counts in most
 * areas. The score adds a small positive signal only when data exists.
 */
export async function getCCTVScore(
  lat: number,
  lng: number,
  radiusMetres = 300
): Promise<OverpassScoreResult> {
  const box = bbox(lat, lng, radiusMetres);

  const query = `
[out:json][timeout:8];
(
  node["man_made"="surveillance"](${box});
  node["surveillance:type"="camera"](${box});
);
out count;
`.trim();

  const count = await countNodes(query);

  let score: number;
  if (count === 0) score = 0.0;
  else if (count < 3) score = 0.2;
  else if (count < 5) score = 0.35;
  else score = 0.5;

  return { count, score };
}

/**
 * Cache key helper for Upstash — buckets to a 500 m grid cell.
 * OSM data changes rarely; 1-hour TTL is safe.
 */
export function overpassCacheKey(
  type: "lighting" | "cctv",
  lat: number,
  lng: number
): string {
  const latR = Math.round(lat * 200) / 200; // 0.005° ≈ 556 m grid
  const lngR = Math.round(lng * 200) / 200;
  return `overpass:${type}:${latR}:${lngR}`;
}
