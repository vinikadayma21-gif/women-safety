/**
 * Mathematical calculations for geographic distances and bounding boxes.
 * Uses the Haversine formula assuming Earth radius = 6371 km.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two points on the Earth surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Computes a rough latitude / longitude bounding box for a given center coordinate and radius.
 * Used for fast DB index filtering before calculating exact Haversine distances.
 *
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusKm Radius in kilometers
 */
export function calculateBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  // 1 degree of latitude is approximately 111 km
  const latDelta = radiusKm / 111;
  // 1 degree of longitude varies by latitude: 111 * cos(lat)
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - Math.abs(lngDelta),
    maxLng: lng + Math.abs(lngDelta),
  };
}

/**
 * Formats distance in km to user-friendly human-readable string.
 * e.g., 0.25 km -> "250 m", 2.34 km -> "2.3 km"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
