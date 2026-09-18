"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SafetyScore } from "@/types/safety";

interface UseSafetyScoreParams {
  lat: number;
  lng: number;
  /** Set to false to disable fetching (e.g. location not yet acquired) */
  enabled?: boolean;
  /** Minimum distance (km) the user must move before re-fetching. Default: 0.1km */
  refetchThresholdKm?: number;
}

interface UseSafetyScoreReturn {
  score: SafetyScore | null;
  isLoading: boolean;
  error: string | null;
  /** Manually trigger a re-fetch */
  refresh: () => void;
}

const MIN_FETCH_INTERVAL_MS = 30_000; // 30 seconds minimum between fetches

/** Rough km distance between two lat/lng pairs (quick approximation) */
function quickDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = (lat2 - lat1) * 111;
  const dLng = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Fetches the WSI (Women's Safety Index) score for the user's current location.
 * Auto-refetches when the user moves more than `refetchThresholdKm`.
 */
export function useSafetyScore({
  lat,
  lng,
  enabled = true,
  refetchThresholdKm = 0.1,
}: UseSafetyScoreParams): UseSafetyScoreReturn {
  const [score, setScore] = useState<SafetyScore | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track last fetched position to avoid redundant requests
  const lastFetchedPos = useRef<{ lat: number; lng: number } | null>(null);
  const lastFetchTime = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchScore = useCallback(
    async (fetchLat: number, fetchLng: number) => {
      // Cancel any pending in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/safety-score?lat=${fetchLat.toFixed(6)}&lng=${fetchLng.toFixed(6)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data: SafetyScore = await res.json();
        setScore(data);
        lastFetchedPos.current = { lat: fetchLat, lng: fetchLng };
        lastFetchTime.current = Date.now();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return; // Cancelled — not an error
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        console.error("[useSafetyScore] Fetch error:", msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Effect: fetch when location changes beyond threshold
  useEffect(() => {
    if (!enabled || !lat || !lng) return;

    const now = Date.now();
    const timeSinceLast = now - lastFetchTime.current;
    const lastPos = lastFetchedPos.current;

    // Rate-limit: skip if fetched recently AND user hasn't moved significantly
    if (lastPos && timeSinceLast < MIN_FETCH_INTERVAL_MS) {
      const moved = quickDistanceKm(lastPos.lat, lastPos.lng, lat, lng);
      if (moved < refetchThresholdKm) return;
    }

    fetchScore(lat, lng);
  }, [lat, lng, enabled, refetchThresholdKm, fetchScore]);

  // Cleanup: cancel any in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(() => {
    lastFetchTime.current = 0; // Force immediate refetch
    fetchScore(lat, lng);
  }, [lat, lng, fetchScore]);

  return { score, isLoading, error, refresh };
}
