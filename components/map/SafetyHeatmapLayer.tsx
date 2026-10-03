"use client";

// =======================================================================
// SafetyHeatmapLayer.tsx — Phase 3 (PLANv2)
// Replaces the Phase 1 no-op stub.
//
// Renders a google.maps.visualization.HeatmapLayer on top of the Google
// Map. The layer uses weighted LatLng points from useHeatmapGrid() which
// fetches /api/heatmap on every map idle event.
//
// Gradient: red (weight=0, unsafe) → amber → green (weight=1, safe).
//
// NOTE: HeatmapLayer is an imperative Google Maps API — it cannot be
// declared as JSX. We manage its lifecycle via useMapsLibrary() +
// useEffect. The APIProvider must include libraries={["visualization"]}
// (already set in MapContainer.tsx).
//
// The @types/google.maps stub for HeatmapLayer only exposes constructor().
// We cast to VisualizationHeatmapLayer (internal interface below) to gain
// access to setMap / setData / setOptions without losing type safety.
// =======================================================================

import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";
import { useHeatmapGrid } from "@/hooks/useHeatmapGrid";

interface SafetyHeatmapLayerProps {
  places: SafetyPlace[];
  hazardNotes?: LocationNote[];
  visible: boolean;
}

// ── Internal type for the full HeatmapLayer API (not fully typed in @types) ──
interface VisualizationHeatmapLayer {
  setMap(map: google.maps.Map | null): void;
  setData(data: { location: google.maps.LatLng; weight: number }[]): void;
  setOptions(opts: {
    gradient?: string[];
    radius?: number;
    opacity?: number;
    dissipating?: boolean;
    maxIntensity?: number;
  }): void;
}

// ── Colour gradient: red (unsafe) → amber → yellow → green (safe) ────────────
// Index positions correspond to weight values 0.0 → 1.0
const SAFETY_GRADIENT = [
  "rgba(220,  38,  38, 0)",    // 0.0 — transparent edge (avoids hard boundary)
  "rgba(220,  38,  38, 0.9)",  // 0.1
  "rgba(239,  68,  68, 0.9)",  // 0.2
  "rgba(249, 115,  22, 0.85)", // 0.3
  "rgba(245, 158,  11, 0.85)", // 0.4
  "rgba(234, 179,   8, 0.8)",  // 0.5
  "rgba(163, 230,  53, 0.8)",  // 0.6
  "rgba( 74, 222, 128, 0.8)",  // 0.7
  "rgba( 16, 185, 129, 0.75)", // 0.8
  "rgba(  5, 150, 105, 0.75)", // 0.9
  "rgba(  4, 120,  87, 0.7)",  // 1.0 — safest (deep green)
];

export default function SafetyHeatmapLayer({
  visible,
}: SafetyHeatmapLayerProps) {
  const map = useMap();

  // useMapsLibrary triggers an async load of the visualization library and
  // returns the library object once available. This is the correct pattern
  // for lazily loaded Google Maps libraries.
  const visualizationLib = useMapsLibrary("visualization");

  const heatmapRef = useRef<VisualizationHeatmapLayer | null>(null);

  // Fetch heatmap points from /api/heatmap on map idle
  const { heatmapPoints } = useHeatmapGrid(visible);

  // ── Create / destroy HeatmapLayer when visualization library loads ────────
  useEffect(() => {
    if (!map || !visible || !visualizationLib) return;

    // The library object has HeatmapLayer as a constructor on it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const HeatmapLayerCtor = (visualizationLib as any).HeatmapLayer as new (opts?: object) => VisualizationHeatmapLayer;

    const layer = new HeatmapLayerCtor();
    layer.setOptions({
      gradient:    SAFETY_GRADIENT,
      radius:      80,
      opacity:     0.7,
      dissipating: true,
      maxIntensity: 1,
    });
    layer.setMap(map);
    heatmapRef.current = layer;

    return () => {
      layer.setMap(null);
      heatmapRef.current = null;
    };
  // Recreate when visualization library, map instance, or visibility changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible, visualizationLib]);

  // ── Sync visibility toggle ────────────────────────────────────────────────
  useEffect(() => {
    const layer = heatmapRef.current;
    if (!layer) return;
    layer.setMap(visible ? (map ?? null) : null);
  }, [map, visible]);

  // ── Update data points whenever heatmapPoints changes ────────────────────
  useEffect(() => {
    const layer = heatmapRef.current;
    if (!layer || !visible || heatmapPoints.length === 0) return;

    const weighted = heatmapPoints.map(({ lat, lng, weight }) => ({
      location: new google.maps.LatLng(lat, lng),
      weight,
    }));

    layer.setData(weighted);
  }, [heatmapPoints, visible]);

  // Fully imperative component — no JSX output
  return null;
}
