/**
 * SafetyPlace types — represents verified safety infrastructure
 * in Delhi NCR (Pink Booths, Police, Metro, Hospitals).
 */

/** Categories of safe locations sourced from official Delhi infrastructure */
export type PlaceCategory =
  | "PINK_BOOTH"        // Delhi Police Pink Booth (women's help point)
  | "POLICE_STATION"    // Full police station
  | "METRO_STATION"     // DMRC metro station (well-lit, CCTV, guards)
  | "HOSPITAL_247"      // 24/7 operational hospital / emergency room
  | "SAFE_HAVEN_STORE"; // 24/7 verified commercial safe spot

/** Administrative region within Delhi NCR */
export type NCRRegion = "Delhi" | "Gurugram" | "Noida" | "Faridabad" | "Ghaziabad";

/**
 * A verified safe location — stored in Neon PostgreSQL,
 * seeded from official Delhi Police / DMRC / hospital sources.
 */
export interface SafetyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string | null;
  contactNumber?: string | null;
  is24x7: boolean;
  region: NCRRegion | string;
  createdAt: Date;
  /** Distance in km from user — populated by API */
  distanceKm?: number;
}

/** Display metadata for each place category */
export interface PlaceCategoryMeta {
  label: string;
  color: string;         // CSS custom property value
  markerSvg: string;     // Path to SVG marker in /public/markers/
  emergencyNumber?: string;
}

export const PLACE_CATEGORY_META: Record<PlaceCategory, PlaceCategoryMeta> = {
  PINK_BOOTH: {
    label: "Pink Booth",
    color: "#ec4899",
    markerSvg: "/markers/marker-pink-booth.svg",
    emergencyNumber: "1091",
  },
  POLICE_STATION: {
    label: "Police Station",
    color: "#6366f1",
    markerSvg: "/markers/marker-police.svg",
    emergencyNumber: "112",
  },
  METRO_STATION: {
    label: "Metro Station",
    color: "#10b981",
    markerSvg: "/markers/marker-metro.svg",
    emergencyNumber: "155370",
  },
  HOSPITAL_247: {
    label: "24/7 Hospital",
    color: "#ef4444",
    markerSvg: "/markers/marker-hospital.svg",
    emergencyNumber: "102",
  },
  SAFE_HAVEN_STORE: {
    label: "Safe Haven",
    color: "#f59e0b",
    markerSvg: "/markers/marker-pink-booth.svg",
  },
};

/** API response shape for nearby places endpoint */
export interface NearbyPlacesResponse {
  places: SafetyPlace[];
  userLocation: { lat: number; lng: number };
  radiusKm: number;
}
