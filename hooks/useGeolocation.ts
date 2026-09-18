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
  const [isSimulated, setIsSimulated] = useState<boolean>(true);

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const coords: LatLng = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    setLocation(coords);
    setRawLocation(coords);
    setAccuracy(pos.coords.accuracy);
    setHeading(pos.coords.heading);
    setSpeed(pos.coords.speed);
    setIsLoading(false);
    setError(null);
    setIsSimulated(false);
    setPermissionStatus("granted");
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message = "Unable to retrieve GPS location.";
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = "Location permission was denied. Defaulting to New Delhi center.";
        setPermissionStatus("denied");
        break;
      case err.POSITION_UNAVAILABLE:
        message = "Location information is unavailable. Using default coordinates.";
        break;
      case err.TIMEOUT:
        message = "Location request timed out. Using default coordinates.";
        break;
    }
    setError(message);
    setIsLoading(false);
    // Keep default Delhi coordinates
    setLocation(DEFAULT_COORDINATES);
    setIsSimulated(true);
  }, []);

  const startTracking = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setPermissionStatus("unsupported");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    // First do a quick one-shot get position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Clear any previous watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Set continuous watcher
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (e) {
      console.warn("Could not start watchPosition:", e);
    }
  }, [handleSuccess, handleError]);

  useEffect(() => {
    startTracking();

    // Check navigator.permissions if available
    if (typeof window !== "undefined" && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permission) => {
          setPermissionStatus(permission.state as "prompt" | "granted" | "denied");
          permission.onchange = () => {
            setPermissionStatus(permission.state as "prompt" | "granted" | "denied");
            if (permission.state === "granted") {
              startTracking();
            }
          };
        })
        .catch(() => {
          // Permissions API might not support geolocation in some environments
        });
    }

    return () => {
      if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
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
