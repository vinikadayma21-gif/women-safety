"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SafetyPlace } from "@/types/place";

interface UseNearbyPlacesProps {
  lat: number;
  lng: number;
  radiusKm?: number;
  category?: string;
  enabled?: boolean;
}

interface UseNearbyPlacesReturn {
  places: SafetyPlace[];
  nearestPlace: SafetyPlace | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// In-memory cache keyed by "lat,lng,radius,category"
const placesCache = new Map<string, { timestamp: number; data: SafetyPlace[] }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function useNearbyPlaces({
  lat,
  lng,
  radiusKm = 5.0,
  category = "ALL",
  enabled = true,
}: UseNearbyPlacesProps): UseNearbyPlacesReturn {
  const [places, setPlaces] = useState<SafetyPlace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Round coordinates to 3 decimals (~100m precision) for cache key stability
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  const cacheKey = `${roundedLat}_${roundedLng}_${radiusKm}_${category}`;

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPlaces = useCallback(async () => {
    if (!enabled) return;

    // Check cache
    const cached = placesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setPlaces(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radiusKm.toString(),
      });

      if (category && category !== "ALL") {
        queryParams.set("category", category);
      }

      const res = await fetch(`/api/places/nearby?${queryParams.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch places: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.places)) {
        setPlaces(data.places);
        placesCache.set(cacheKey, {
          timestamp: Date.now(),
          data: data.places,
        });
      } else {
        throw new Error(data.error || "Malformed response from places API");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was cancelled, ignore
      }
      console.error("Error fetching nearby places:", err);
      setError(err instanceof Error ? err.message : "Error fetching nearby places");
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng, radiusKm, category, enabled, cacheKey]);

  useEffect(() => {
    fetchPlaces();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPlaces]);

  const nearestPlace = places.length > 0 ? places[0] : null;

  return {
    places,
    nearestPlace,
    isLoading,
    error,
    refetch: fetchPlaces,
  };
}
