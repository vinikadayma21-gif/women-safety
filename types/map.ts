/**
 * Geographic coordinate types for the SafeCity map system.
 * Covers Delhi NCR bounds: lat 28.4–28.9, lng 76.8–77.6
 */

/** A simple geographic coordinate pair */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Bounding box for map viewport queries */
export interface LatLngBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Map zoom level — valid range 1–18 */
export type ZoomLevel = number;

/** Leaflet tile layer configuration */
export interface TileLayerConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

/** SafeCity default map configuration for Delhi NCR */
export const DELHI_NCR_MAP_CONFIG = {
  center: { lat: 28.6139, lng: 77.209 } as LatLng,
  defaultZoom: 13 as ZoomLevel,
  minZoom: 10,
  maxZoom: 18,
  /** CartoDB Dark Matter tile URL */
  tileLayer: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: ["a", "b", "c", "d"],
  } as TileLayerConfig,
} as const;

/** Filter categories for the top filter chip bar */
export type MapFilterCategory =
  | "ALL"
  | "PINK_BOOTH"
  | "POLICE_STATION"
  | "METRO_STATION"
  | "HOSPITAL_247"
  | "SAFE_HAVEN_STORE"
  | "COMMUNITY_ALERT";
