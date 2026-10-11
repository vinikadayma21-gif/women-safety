"use client";

// =======================================================================
// SafetyHeatmapLayer.tsx — Phase 3 (PLANv2)
//
// Renders the multi-factor WSI safety overlay on Google Maps.
// Note: Google Maps v3.65+ deprecated and removed the legacy HeatmapLayer
// in the visualization library. To ensure 100% stability across all
// browsers and Google Maps versions, this layer renders smooth, semi-transparent
// safety radius circles (red → amber → green) using core google.maps.Circle.
//
// Fed live by useHeatmapGrid() from /api/heatmap on map idle.
// =======================================================================

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";
import { useHeatmapGrid } from "@/hooks/useHeatmapGrid";

interface SafetyHeatmapLayerProps {
  places: SafetyPlace[];
  hazardNotes?: LocationNote[];
  visible: boolean;
}

/**
 * Maps a safety weight (0.0 to 1.0) to a rich neon-accented hex color
 */
function getSafetyColor(weight: number): string {
  if (weight >= 0.75) return "#10b981"; // Safe (emerald green)
  if (weight >= 0.55) return "#84cc16"; // Moderate-safe (lime)
  if (weight >= 0.40) return "#f59e0b"; // Caution (amber)
  if (weight >= 0.25) return "#f97316"; // Elevated risk (orange)
  return "#ef4444";                     // High risk / deserted (coral red)
}

export default function SafetyHeatmapLayer({
  visible,
}: SafetyHeatmapLayerProps) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  // Fetch dynamic heatmap grid points from /api/heatmap on map idle
  const { heatmapPoints } = useHeatmapGrid(visible);

  // ── Sync Circles with heatmapPoints ──────────────────────────────────────
  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;

    // Clear existing circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (!visible || heatmapPoints.length === 0) return;

    try {
      const newCircles: google.maps.Circle[] = [];

      for (const pt of heatmapPoints) {
        const color = getSafetyColor(pt.weight);
        const circle = new google.maps.Circle({
          center: { lat: pt.lat, lng: pt.lng },
          radius: 380, // Metres radius for smooth contiguous coverage
          fillColor: color,
          fillOpacity: 0.16 + pt.weight * 0.08,
          strokeColor: color,
          strokeOpacity: 0.25,
          strokeWeight: 1,
          map: visible ? map : null,
          clickable: false,
          zIndex: 50,
        });
        newCircles.push(circle);
      }

      circlesRef.current = newCircles;
    } catch (err) {
      console.warn("[SafetyHeatmapLayer] Error rendering safety circles:", err);
    }

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, heatmapPoints, visible]);

  // ── Sync visibility toggle ────────────────────────────────────────────────
  useEffect(() => {
    if (!circlesRef.current.length) return;
    const targetMap = visible ? map : null;
    circlesRef.current.forEach((circle) => {
      circle.setMap(targetMap);
    });
  }, [map, visible]);

  return null;
}
