"use client";

/**
 * useOfflineSync
 * Monitors browser online/offline state, caches the Delhi NCR helpline
 * directory into IndexedDB on first load, and surfaces a network status flag
 * to the rest of the app.
 */

import { useState, useEffect, useCallback } from "react";
import { ALL_HELPLINES } from "@/lib/delhiHelplines";
import {
  cacheHelplines,
  isHelplinesCargoFresh,
} from "@/lib/offlineStorage";

export interface OfflineSyncState {
  /** true when the browser reports an active internet connection */
  isOnline: boolean;
  /** true while the first cache write is in progress */
  isCaching: boolean;
  /** true once the helpline directory is successfully written to IndexedDB */
  isCached: boolean;
  /** Any error string if caching failed */
  cacheError: string | null;
}

export function useOfflineSync(): OfflineSyncState {
  // Always initialise to `true` so the server render and the first client
  // render agree (avoids hydration mismatch). The real value is synced
  // inside useEffect once the browser environment is available.
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cacheError, setCacheError] = useState<string | null>(null);

  const seedCache = useCallback(async () => {
    try {
      const fresh = await isHelplinesCargoFresh();
      if (fresh) {
        setIsCached(true);
        return;
      }
      setIsCaching(true);
      await cacheHelplines(ALL_HELPLINES);
      setIsCached(true);
    } catch (err) {
      setCacheError(
        err instanceof Error ? err.message : "Failed to cache helplines."
      );
    } finally {
      setIsCaching(false);
    }
  }, []);

  useEffect(() => {
    // Sync the real online state now that we are in the browser
    setIsOnline(navigator.onLine);

    // Seed IndexedDB cache on mount
    seedCache();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [seedCache]);

  return { isOnline, isCaching, isCached, cacheError };
}
