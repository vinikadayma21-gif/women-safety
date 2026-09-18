/**
 * IndexedDB helper for caching Delhi NCR helplines and safety data offline.
 * Uses the Web Storage / IDB pattern for resilient offline-first PWA behaviour.
 */

const DB_NAME = "safecity-delhi-offline";
const DB_VERSION = 1;

// ── Store names ──────────────────────────────────────────────────────────────
const STORES = {
  HELPLINES: "helplines",
  TILES: "map-tiles",
  META: "meta",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

// ── Internal DB open helper ──────────────────────────────────────────────────

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Helplines store — keyed by helpline id
      if (!db.objectStoreNames.contains(STORES.HELPLINES)) {
        db.createObjectStore(STORES.HELPLINES, { keyPath: "id" });
      }

      // Generic meta / config store
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return _dbPromise;
}

// ── Generic CRUD helpers ─────────────────────────────────────────────────────

function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbPut<T>(store: StoreName, value: T, key?: IDBValidKey): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        const req = key
          ? tx.objectStore(store).put(value, key)
          : tx.objectStore(store).put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      })
  );
}

function idbClear(store: StoreName): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        const req = tx.objectStore(store).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

// ── Public Helplines API ─────────────────────────────────────────────────────

const HELPLINES_META_KEY = "helplines_cached_at";

/**
 * Writes all helplines to IndexedDB.
 * Call this once on app load to seed the offline cache.
 */
export async function cacheHelplines<T extends { id: string }>(
  helplines: T[]
): Promise<void> {
  await idbClear(STORES.HELPLINES);
  await Promise.all(helplines.map((h) => idbPut(STORES.HELPLINES, h)));
  await idbPut(STORES.META, Date.now(), HELPLINES_META_KEY);
}

/**
 * Returns all cached helplines from IndexedDB.
 * Returns an empty array if cache is empty.
 */
export async function getCachedHelplines<T>(): Promise<T[]> {
  return idbGetAll<T>(STORES.HELPLINES);
}

/**
 * Returns the timestamp (ms since epoch) when helplines were last cached,
 * or null if the cache is empty.
 */
export async function getHelplinesLastCached(): Promise<number | null> {
  const ts = await idbGet<number>(STORES.META, HELPLINES_META_KEY);
  return ts ?? null;
}

/**
 * Returns true if helplines are cached and the cache is less than `maxAgeMs` old.
 */
export async function isHelplinesCargoFresh(
  maxAgeMs = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<boolean> {
  const lastCached = await getHelplinesLastCached();
  if (lastCached === null) return false;
  return Date.now() - lastCached < maxAgeMs;
}

// ── Generic Meta Store ───────────────────────────────────────────────────────

export async function setMeta<T>(key: string, value: T): Promise<void> {
  return idbPut(STORES.META, value, key);
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return idbGet<T>(STORES.META, key);
}
