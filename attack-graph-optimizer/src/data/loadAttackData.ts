// ─── IndexedDB STIX Cache & Data Loader ──────────────────────────────────────
//
// Extracted from attack-path-optimizer.html (lines ~2040-2249).
// Handles IndexedDB caching of STIX bundles with a 7-day TTL and the main
// data-loading function that fetches from the MITRE GitHub URL.

import type { FrameworkConfig, ParsedStixData } from '../types';
import { parseStixBundle } from '../engine/stixParser';

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = 'attack-stix-cache';
const DB_VERSION = 1;
const STORE_NAME = 'bundles';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Cache entry stored in IndexedDB ──────────────────────────────────────────

interface CacheEntry {
  data: ParsedStixData;
  timestamp: number;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

/** Opens (or creates) the IndexedDB database used for STIX bundle caching. */
function openStixCache(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Retrieves a cached STIX parse result by cache key, returning null if missing or expired. */
export function getCachedStix(key: string): Promise<ParsedStixData | null> {
  return openStixCache().then(
    (db) =>
      new Promise<ParsedStixData | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => {
          const entry: CacheEntry | undefined = req.result;
          if (!entry) return resolve(null);
          if (Date.now() - entry.timestamp > CACHE_TTL_MS) return resolve(null);
          resolve(entry.data);
        };
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Stores a parsed STIX result in IndexedDB under the given cache key. */
export function setCachedStix(key: string, data: ParsedStixData): Promise<void> {
  return openStixCache().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(
          { data, timestamp: Date.now() } satisfies CacheEntry,
          key,
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

// ─── Main data loader ─────────────────────────────────────────────────────────

/**
 * Fetches STIX data from the MITRE GitHub URL specified in `fwConfig.stixUrl`,
 * caches the parsed result in IndexedDB (keyed by `fwConfig.stixCacheKey`),
 * and returns the parsed data.
 *
 * If a valid (non-expired) cached entry exists it is returned immediately
 * without making a network request.
 *
 * @param signal  Optional `AbortSignal` to cancel the fetch.
 * @param fwConfig  Framework configuration providing the STIX URL and cache key.
 */
export async function loadStixData(
  signal: AbortSignal | undefined,
  fwConfig: FrameworkConfig,
): Promise<ParsedStixData> {
  const version = fwConfig.stixCacheKey;

  // Try cache first
  const cached = await getCachedStix(version).catch(() => null);
  if (cached) return cached;

  // Fetch from MITRE GitHub
  const resp = await fetch(fwConfig.stixUrl, signal ? { signal } : undefined);
  if (!resp.ok) throw new Error('Failed to fetch STIX data: ' + resp.status);
  const bundle = await resp.json();

  // Parse and cache
  const result = parseStixBundle(bundle, fwConfig);
  await setCachedStix(version, result).catch(() => {});
  return result;
}
