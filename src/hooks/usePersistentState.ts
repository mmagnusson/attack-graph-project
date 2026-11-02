// ─── usePersistentState — useState backed by localStorage ────────────────────
// Reads once on mount, writes on change. Storage can be unavailable (private
// windows, blocked site data), so every access is guarded and the app keeps
// working with in-memory state.

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function readStored<T>(key: string, fallback: T, validate?: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const v: unknown = JSON.parse(raw);
    return validate && !validate(v) ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked — state still lives in memory
  }
}

export function usePersistentState<T>(
  key: string, initial: T | (() => T), validate?: (v: unknown) => boolean,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    return readStored(key, fallback, validate);
  });
  useEffect(() => { writeStored(key, value); }, [key, value]);
  return [value, setValue];
}

export const STORAGE_PREFIX = 'attackBreaker.v2.';
