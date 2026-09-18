"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";

interface SafetyHeatmapLayerProps {
  /** Verified safe-place anchors to draw green influence circles around */
  places: SafetyPlace[];
  /** Active community hazard notes to draw red/amber warning circles around */
  hazardNotes?: LocationNote[];
  /** Whether the heatmap overlay is currently visible */
  visible: boolean;
}

/** Visual radius (meters on map) and color per place category */
const ANCHOR_DISPLAY: Record<
  string,
  { radius: number; color: string; fillOpacity: number }
> = {
  PINK_BOOTH:       { radius: 350, color: "#ec4899", fillOpacity: 0.08 },
  POLICE_STATION:   { radius: 450, color: "#6366f1", fillOpacity: 0.07 },
  METRO_STATION:    { radius: 280, color: "#10b981", fillOpacity: 0.07 },
  HOSPITAL_247:     { radius: 500, color: "#ef4444", fillOpacity: 0.05 },
  SAFE_HAVEN_STORE: { radius: 150, color: "#f59e0b", fillOpacity: 0.08 },
};

/** Visual radius and color per hazard category */
const HAZARD_DISPLAY: Record<
  string,
  { radius: number; color: string; fillOpacity: number }
> = {
  HARASSMENT_SPOT: { radius: 300, color: "#ef4444", fillOpacity: 0.14 },
  DESERTED_AREA:   { radius: 350, color: "#f97316", fillOpacity: 0.10 },
  POOR_LIGHTING:   { radius: 200, color: "#f59e0b", fillOpacity: 0.10 },
};

/**
 * SafetyHeatmapLayer renders semi-transparent influence circles on the Leaflet
 * canvas, visualising safe corridors (green/purple radiance around verified
 * infrastructure) and danger zones (red/amber radiance around hazard reports).
 *
 * Must be placed inside a react-leaflet <MapContainer>.
 */
export default function SafetyHeatmapLayer({
  places,
  hazardNotes = [],
  visible,
}: SafetyHeatmapLayerProps) {
  // We use Leaflet's native layer group to batch-add/remove circles so
  // react-leaflet's reconciler doesn't have to diff hundreds of child nodes.
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const map = useMap();

  useEffect(() => {
    // Remove old layer group if it exists
    if (layerGroupRef.current) {
      layerGroupRef.current.remove();
      layerGroupRef.current = null;
    }

    if (!visible) return;

    const group = L.layerGroup();

    // ── 1. Anchor circles (soft glow from safety infrastructure) ──────────
    for (const place of places) {
      const display = ANCHOR_DISPLAY[place.category];
      if (!display) continue;

      // Outer glow ring (large, very transparent)
      L.circle([place.latitude, place.longitude], {
        radius: display.radius * 1.8,
        color: display.color,
        weight: 0,
        fillColor: display.color,
        fillOpacity: display.fillOpacity * 0.4,
        interactive: false,
        className: "safecity-heatmap-outer",
      }).addTo(group);

      // Inner core ring (smaller, more saturated)
      L.circle([place.latitude, place.longitude], {
        radius: display.radius,
        color: display.color,
        weight: 1,
        opacity: 0.25,
        fillColor: display.color,
        fillOpacity: display.fillOpacity,
        interactive: false,
        className: "safecity-heatmap-inner",
        dashArray: "4 6",
      }).addTo(group);
    }

    // ── 2. Hazard circles (warning pulse around community alerts) ──────────
    for (const note of hazardNotes) {
      if (note.noteType !== "COMMUNITY_ALERT") continue;
      const display = HAZARD_DISPLAY[note.hazardCategory] ?? HAZARD_DISPLAY.POOR_LIGHTING;

      // Amplify radius slightly based on net upvote credibility
      const credibilityBoost = Math.min(1.5, 1 + (note.upvotesCount / 10));
      const radius = display.radius * credibilityBoost;

      L.circle([note.latitude, note.longitude], {
        radius: radius * 1.5,
        color: display.color,
        weight: 0,
        fillColor: display.color,
        fillOpacity: display.fillOpacity * 0.35,
        interactive: false,
        className: "safecity-hazard-outer",
      }).addTo(group);

      L.circle([note.latitude, note.longitude], {
        radius,
        color: display.color,
        weight: 1.5,
        opacity: 0.5,
        fillColor: display.color,
        fillOpacity: display.fillOpacity,
        interactive: false,
        className: "safecity-hazard-inner",
        dashArray: "3 5",
      }).addTo(group);
    }

    group.addTo(map);
    layerGroupRef.current = group;

    return () => {
      group.remove();
      layerGroupRef.current = null;
    };
  }, [places, hazardNotes, visible, map]);

  // This component manages Leaflet layers imperatively — no JSX output needed
  return null;
}
