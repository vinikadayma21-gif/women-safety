"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LatLng, DELHI_NCR_MAP_CONFIG } from "@/types/map";

export interface GeolocationState {
  location: LatLng;
  rawLocation: LatLng | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: "prompt" | "granted" | "denied" | "unsupported";
  isSimulated: boolean;
  requestLocation: () => void;
}

/** Fallback center shown only while GPS is loading — never used as a real position */
const DEFAULT_COORDINATES: LatLng = DELHI_NCR_MAP_CONFIG.center;

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<LatLng>(DEFAULT_COORDINATES);
  const [rawLocation, setRawLocation] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "unsupported"
  >("prompt");
  // true only while we haven't received a real GPS fix yet
  const [isSimulated, setIsSimulated] = useState<boolean>(true);

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const coords: LatLng = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    // Always use whatever the GPS returns — no bounds filtering, no fallback
    setLocation(coords);
    setRawLocation(coords);
    setAccuracy(pos.coords.accuracy);
    setHeading(pos.coords.heading);
    setSpeed(pos.coords.speed);
    setIsLoading(false);
    setError(null);
    setIsSimulated(false);          // real GPS fix received
    setPermissionStatus("granted");
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message = "Unable to retrieve your location.";
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message =
          "Location permission denied. Please allow location access in your browser settings.";
        setPermissionStatus("denied");
        break;
      case err.POSITION_UNAVAILABLE:
        message = "Location signal unavailable. Please check your device GPS.";
        break;
      case err.TIMEOUT:
        message = "Location request timed out. Retrying…";
        break;
    }
    setError(message);
    setIsLoading(false);
    // Do NOT overwrite location with a fake default — keep last known real
    // position (or the loading placeholder) so we never silently lie.
  }, []);

  const startTracking = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setPermissionStatus("unsupported");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true, // forces GPS chip over IP/WiFi estimation
      timeout: 15000,
      maximumAge: 0,            // never serve a cached/IP-based position
    };

    // One-shot for immediate first fix
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Clear any previous continuous watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Continuous watcher for live updates
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (e) {
      console.warn("[useGeolocation] Could not start watchPosition:", e);
    }
  }, [handleSuccess, handleError]);

  useEffect(() => {
    startTracking();

    // React to permission changes (e.g. user grants after initial denial)
    if (
      typeof window !== "undefined" &&
      navigator.permissions &&
      navigator.permissions.query
    ) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permission) => {
          setPermissionStatus(
            permission.state as "prompt" | "granted" | "denied"
          );
          permission.onchange = () => {
            setPermissionStatus(
              permission.state as "prompt" | "granted" | "denied"
            );
            if (permission.state === "granted") {
              startTracking();
            }
          };
        })
        .catch(() => {
          // Permissions API not available in all environments — ignore
        });
    }

    return () => {
      if (
        watchIdRef.current !== null &&
        typeof window !== "undefined" &&
        "geolocation" in navigator
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startTracking]);

  return {
    location,
    rawLocation,
    accuracy,
    heading,
    speed,
    isLoading,
    error,
    permissionStatus,
    isSimulated,
    requestLocation: startTracking,
  };
}
