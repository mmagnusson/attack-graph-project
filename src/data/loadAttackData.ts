// ─── Dataset Loader (same-origin JSON + IndexedDB cache) ─────────────────────
//
// The ATT&CK bundles are preprocessed at build time (scripts/build-attack-data.ts)
// into public/data/*.json, so the browser fetches a compact dataset from the
// app's own origin instead of ~47 MB of STIX from GitHub. The IndexedDB cache
// key includes PARSER_VERSION, so a parser change can never be masked by stale
// cached output.

import type { AttackDataset, FrameworkConfig } from '../types';
import { PARSER_VERSION } from '../engine/stixParser';

const DB_NAME = 'attackbreaker-data';
const DB_VERSION = 1;
const STORE_NAME = 'datasets';

function openCache(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCached(key: string): Promise<AttackDataset | null> {
  const db = await openCache();
  return new Promise<AttackDataset | null>((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as AttackDataset | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function setCached(key: string, data: AttackDataset): Promise<void> {
  const db = await openCache();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function isCurrentDataset(d: unknown, cfg: FrameworkConfig): d is AttackDataset {
  const ds = d as AttackDataset | null;
  return !!ds && ds.schemaVersion === PARSER_VERSION && ds.framework === cfg.id && Array.isArray(ds.techniques) && Array.isArray(ds.chains);
}

/** Loads the bundled dataset for a framework, from IndexedDB when available */
export async function loadAttackData(signal: AbortSignal | undefined, cfg: FrameworkConfig): Promise<AttackDataset> {
  const cached = await getCached(cfg.dataCacheKey).catch(() => null);
  if (isCurrentDataset(cached, cfg)) return cached;

  const resp = await fetch(cfg.dataUrl, signal ? { signal } : undefined);
  if (!resp.ok) throw new Error('Failed to load ATT&CK data: HTTP ' + resp.status);
  const data: unknown = await resp.json();
  if (!isCurrentDataset(data, cfg)) {
    throw new Error('Bundled ATT&CK data is out of date for this build — run `npm run data`');
  }
  await setCached(cfg.dataCacheKey, data).catch(() => {});
  return data;
}
