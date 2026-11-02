// ─── useDefenses — current defense posture (per framework, persisted) ────────

import { useCallback, useMemo } from 'react';
import type { CatalogItem, DefensePosture, FrameworkConfig, FrameworkId } from '../types';
import { STORAGE_PREFIX, usePersistentState } from './usePersistentState';

export interface StoredPosture {
  mitigations: string[];
  dataComponents: string[];
  blocked: string[];
}

const EMPTY: StoredPosture = { mitigations: [], dataComponents: [], blocked: [] };
const isStoredPostures = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);

const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

export function useDefenses(cfg: FrameworkConfig) {
  const [postures, setPostures] = usePersistentState<Partial<Record<FrameworkId, StoredPosture>>>(
    STORAGE_PREFIX + 'postures', {}, isStoredPostures,
  );
  const stored = postures[cfg.id] ?? EMPTY;

  const posture: DefensePosture = useMemo(() => ({
    mitigations: new Set(stored.mitigations),
    dataComponents: new Set(stored.dataComponents),
    blocked: new Set(stored.blocked),
  }), [stored]);

  const update = useCallback((fn: (p: StoredPosture) => StoredPosture) => {
    setPostures(prev => ({ ...prev, [cfg.id]: fn(prev[cfg.id] ?? EMPTY) }));
  }, [cfg.id, setPostures]);

  const toggleMitigation = useCallback((id: string) => update(p => ({ ...p, mitigations: toggle(p.mitigations, id) })), [update]);
  const toggleBlocked = useCallback((id: string) => update(p => ({ ...p, blocked: toggle(p.blocked, id) })), [update]);

  /** Collect (on) or stop collecting (off) a set of data components */
  const setDataComponents = useCallback((ids: string[], on: boolean) => update(p => {
    const s = new Set(p.dataComponents);
    ids.forEach(id => (on ? s.add(id) : s.delete(id)));
    return { ...p, dataComponents: [...s] };
  }), [update]);

  const addItems = useCallback((items: CatalogItem[]) => update(p => ({
    ...p,
    mitigations: [...new Set([...p.mitigations, ...items.flatMap(i => i.mitigationIds)])],
    dataComponents: [...new Set([...p.dataComponents, ...items.flatMap(i => i.dataComponentIds)])],
  })), [update]);

  const applyPreset = useCallback((key: string) => {
    const preset = cfg.posturePresets[key];
    if (!preset) return;
    const dcs = preset.telemetry.flatMap(t => cfg.telemetrySources.find(s => s.id === t)?.dataComponents ?? []);
    update(p => ({ ...p, mitigations: [...preset.mitigations], dataComponents: [...new Set(dcs)] }));
  }, [cfg, update]);

  const replace = useCallback((next: StoredPosture) => update(() => next), [update]);
  const clear = useCallback(() => setPostures({}), [setPostures]);

  return { posture, stored, toggleMitigation, toggleBlocked, setDataComponents, addItems, applyPreset, replace, clear };
}
