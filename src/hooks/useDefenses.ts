// ─── useDefenses — current defense posture (per framework × vocabulary) ──────
// Each vocabulary keeps its own posture so a capability is never counted twice;
// "assume blocked" what-ifs are per framework and shared by both vocabularies.

import { useCallback, useMemo } from 'react';
import type { CatalogItem, D3fendDataset, DefensePosture, FrameworkConfig, FrameworkId, VocabularyId } from '../types';
import { translateAttackPosture } from '../engine/defenseVocabulary';
import { readStored, usePersistentState } from './usePersistentState';
import { KEYS } from './storageKeys';

export interface StoredPosture {
  prevent: string[];
  detect: string[];
}

type Postures = Record<string, StoredPosture>;
const EMPTY: StoredPosture = { prevent: [], detect: [] };
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
export const postureKey = (fw: FrameworkId, vocab: VocabularyId) => fw + ':' + vocab;

/** Postures saved by v2.0 lived under KEYS.legacyPostures as { [fw]: { mitigations, dataComponents, blocked } } */
function migrateLegacy(): { postures: Postures; blocked: Partial<Record<FrameworkId, string[]>> } {
  const legacy = readStored<Record<string, { mitigations?: string[]; dataComponents?: string[]; blocked?: string[] }>>(KEYS.legacyPostures, {}, isObj);
  const postures: Postures = {};
  const blocked: Partial<Record<FrameworkId, string[]>> = {};
  for (const fw of ['enterprise', 'ics'] as FrameworkId[]) {
    const p = legacy[fw];
    if (!p) continue;
    postures[postureKey(fw, 'attack')] = { prevent: p.mitigations ?? [], detect: p.dataComponents ?? [] };
    if (p.blocked?.length) blocked[fw] = p.blocked;
  }
  return { postures, blocked };
}

const NONE: string[] = [];
const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

export function useDefenses(cfg: FrameworkConfig, vocab: VocabularyId, d3fend: D3fendDataset | null) {
  const [postures, setPostures] = usePersistentState<Postures>(KEYS.defenses, () => migrateLegacy().postures, isObj);
  const [blockedByFw, setBlockedByFw] = usePersistentState<Partial<Record<FrameworkId, string[]>>>(KEYS.blocked, () => migrateLegacy().blocked, isObj);
  const key = postureKey(cfg.id, vocab);
  const stored = postures[key] ?? EMPTY;
  const blocked = blockedByFw[cfg.id] ?? NONE;

  const posture: DefensePosture = useMemo(() => ({
    prevent: new Set(stored.prevent),
    detect: new Set(stored.detect),
    blocked: new Set(blocked),
  }), [stored, blocked]);

  const update = useCallback((fn: (p: StoredPosture) => StoredPosture) => {
    setPostures(prev => ({ ...prev, [key]: fn(prev[key] ?? EMPTY) }));
  }, [key, setPostures]);

  const togglePrevent = useCallback((id: string) => update(p => ({ ...p, prevent: toggle(p.prevent, id) })), [update]);
  const setDetect = useCallback((ids: string[], on: boolean) => update(p => {
    const s = new Set(p.detect);
    ids.forEach(id => (on ? s.add(id) : s.delete(id)));
    return { ...p, detect: [...s] };
  }), [update]);
  const addItems = useCallback((items: CatalogItem[]) => update(p => ({
    prevent: [...new Set([...p.prevent, ...items.flatMap(i => i.preventIds)])],
    detect: [...new Set([...p.detect, ...items.flatMap(i => i.detectIds)])],
  })), [update]);
  const replace = useCallback((next: StoredPosture) => update(() => next), [update]);
  const clear = useCallback(() => update(() => EMPTY), [update]);

  const toggleBlocked = useCallback((id: string) => {
    setBlockedByFw(prev => ({ ...prev, [cfg.id]: toggle(prev[cfg.id] ?? [], id) }));
  }, [cfg.id, setBlockedByFw]);
  const addBlocked = useCallback((ids: string[]) => {
    setBlockedByFw(prev => ({ ...prev, [cfg.id]: [...new Set([...(prev[cfg.id] ?? []), ...ids])] }));
  }, [cfg.id, setBlockedByFw]);

  /** An ATT&CK-vocabulary posture for a preset (presets are defined in ATT&CK terms) */
  const attackPreset = useCallback((presetKey: string): StoredPosture | null => {
    const preset = cfg.posturePresets[presetKey];
    if (!preset) return null;
    const dcs = preset.telemetry.flatMap(t => cfg.telemetrySources.find(s => s.id === t)?.dataComponents ?? []);
    return { prevent: [...preset.mitigations], detect: [...new Set(dcs)] };
  }, [cfg]);

  const applyPreset = useCallback((presetKey: string) => {
    const p = attackPreset(presetKey);
    if (!p) return;
    if (vocab === 'attack') replace(p);
    else if (d3fend) replace(translateAttackPosture(p, cfg, d3fend));
  }, [attackPreset, vocab, d3fend, cfg, replace]);

  /** D3FEND vocabulary: start from the ATT&CK posture recorded for this framework */
  const importFromAttack = useCallback(() => {
    if (!d3fend) return;
    replace(translateAttackPosture(postures[postureKey(cfg.id, 'attack')] ?? EMPTY, cfg, d3fend));
  }, [d3fend, postures, cfg, replace]);
  const attackPostureSize = (postures[postureKey(cfg.id, 'attack')]?.prevent.length ?? 0) + (postures[postureKey(cfg.id, 'attack')]?.detect.length ?? 0);

  const resetAll = useCallback(() => { setPostures({}); setBlockedByFw({}); }, [setPostures, setBlockedByFw]);

  return {
    posture, stored, blocked,
    togglePrevent, setDetect, addItems, replace, clear,
    toggleBlocked, addBlocked,
    applyPreset, importFromAttack, attackPostureSize, resetAll,
  };
}
