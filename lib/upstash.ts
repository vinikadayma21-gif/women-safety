// =======================================================================
// lib/upstash.ts — Upstash Redis cache wrapper (PLANv2 Phase 1)
// Uses @upstash/redis REST client with silent-fail error handling.
// getCached / setCached are fire-and-forget; a Redis outage NEVER
// crashes the app — it just falls through to the live API call.
// =======================================================================

import { Redis } from "@upstash/redis";

// Build the client lazily so missing env vars only throw at call-time,
// not at module load time (important for next.js edge/server components).
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (
    !url ||
    !token ||
    url === "https://..." ||
    token === "AXxx..."
  ) {
    // Keys not yet configured — silently skip caching
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

/**
 * Read a cached value. Returns null on cache miss OR any error.
 * @param key — fully qualified cache key, e.g. "safety-score:28.6139:77.2090:14"
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (err) {
    console.warn("[upstash] getCached failed silently:", err);
    return null;
  }
}

/**
 * Write a value to cache with a TTL in seconds. Fire-and-forget.
 * @param key — fully qualified cache key
 * @param value — JSON-serialisable value
 * @param ttlSeconds — expiry time in seconds (default: 15 minutes)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds = 900
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn("[upstash] setCached failed silently:", err);
  }
}

/**
 * Delete a cached key (cache invalidation helper).
 * Silent-fail on any error.
 */
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    console.warn("[upstash] invalidateCache failed silently:", err);
  }
}

/**
 * Build consistent cache keys for the safety-score endpoint.
 * Buckets time into 1-hour windows so score refreshes at the top of each hour.
 */
export function safetyScoreCacheKey(lat: number, lng: number): string {
  const hour = Math.floor(Date.now() / 3_600_000); // floor to current hour
  const latR = Math.round(lat * 1000) / 1000; // 3 decimal places ≈ 111 m
  const lngR = Math.round(lng * 1000) / 1000;
  return `safety-score:${latR}:${lngR}:${hour}`;
}

/**
 * Build consistent cache keys for the nearby-places endpoint.
 * Places are stable — cache for 6 hours.
 */
export function placesCacheKey(lat: number, lng: number, type: string): string {
  const latR = Math.round(lat * 100) / 100; // 2 decimal places ≈ 1.1 km grid
  const lngR = Math.round(lng * 100) / 100;
  return `places:${type}:${latR}:${lngR}`;
}
