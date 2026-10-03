"use client";

// =======================================================================
// hooks/useHeatmapGrid.ts — Phase 3 (PLANv2)
//
// Listens to the Google Maps "idle" event via map.addListener() and
// fetches /api/heatmap with the current viewport bounds on each pan/zoom.
//
// Returns:
//   heatmapPoints — array of { lat, lng, weight } for HeatmapLayer
//   isLoading     — true while fetching
// =======================================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { MapBounds } from "./useLocationNotes";

export interface HeatmapPoint {
  lat: number;
  lng: number;
  /** Normalised safety weight 0 (unsafe/red) → 1 (safe/green) */
  weight: number;
}

interface UseHeatmapGridReturn {
  heatmapPoints: HeatmapPoint[];
  isLoading: boolean;
}

/** Minimum ms between fetches — prevents hammering during rapid panning */
const DEBOUNCE_MS = 600;

/** Minimum viewport change (degrees) required to trigger a refetch */
const MIN_DELTA_DEG = 0.01; // ~1.1 km

export function useHeatmapGrid(enabled = true): UseHeatmapGridReturn {
  const map = useMap();
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const lastBounds  = useRef<MapBounds | null>(null);
  // Store the Maps API listener so we can remove it on cleanup
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const fetchGrid = useCallback(async (bounds: MapBounds) => {
    // Skip if bounds haven't moved enough to warrant a fresh fetch
    if (lastBounds.current) {
      const prev = lastBounds.current;
      const moved =
        Math.abs(bounds.minLat - prev.minLat) > MIN_DELTA_DEG ||
        Math.abs(bounds.maxLat - prev.maxLat) > MIN_DELTA_DEG ||
        Math.abs(bounds.minLng - prev.minLng) > MIN_DELTA_DEG ||
        Math.abs(bounds.maxLng - prev.maxLng) > MIN_DELTA_DEG;
      if (!moved) return;
    }
    lastBounds.current = bounds;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        north: bounds.maxLat.toString(),
        south: bounds.minLat.toString(),
        east:  bounds.maxLng.toString(),
        west:  bounds.minLng.toString(),
      });

      const res = await fetch(`/api/heatmap?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { points: HeatmapPoint[] } = await res.json();
      setHeatmapPoints(data.points ?? []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.warn("[useHeatmapGrid] Fetch failed:", err);
      // Silently keep previous points — heatmap stays visible
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced idle handler — reads current bounds from the map instance
  const handleIdle = useCallback(() => {
    if (!enabled || !map) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const b = map.getBounds();
      if (!b) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      fetchGrid({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLng: sw.lng(),
        maxLng: ne.lng(),
      });
    }, DEBOUNCE_MS);
  }, [enabled, map, fetchGrid]);

  // Subscribe to "idle" on the underlying google.maps.Map instance
  useEffect(() => {
    if (!map || !enabled) return;

    // Attach listener
    listenerRef.current = map.addListener("idle", handleIdle);

    // Fire immediately so the heatmap appears without waiting for a pan
    handleIdle();

    return () => {
      listenerRef.current?.remove();
      listenerRef.current = null;
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, enabled, handleIdle]);

  return { heatmapPoints, isLoading };
}
