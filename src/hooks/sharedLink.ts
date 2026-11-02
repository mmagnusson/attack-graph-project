// ─── Shared links → persisted state ──────────────────────────────────────────
// A shared URL describes a complete view. Before the app renders, its hash is
// decoded, validated, and written into the same storage keys the hooks read on
// mount — so every piece of state initializes from the link without effects.

import type { FrameworkId, ModelParams } from '../types';
import { decodeHashToState, encodeStateToHash, type ShareableState } from './useUrlState';
import { readStored, writeStored, STORAGE_PREFIX } from './usePersistentState';
import { DEFAULT_MODEL_PARAMS } from '../engine/riskModel';
import { getFrameworkConfig } from '../data/frameworkConfig';
import type { StoredPosture } from './useDefenses';

export const KEYS = {
  framework: STORAGE_PREFIX + 'framework',
  budget: STORAGE_PREFIX + 'budget',
  orgSize: STORAGE_PREFIX + 'orgSize',
  costs: STORAGE_PREFIX + 'costs',
  params: STORAGE_PREFIX + 'params',
  gates: STORAGE_PREFIX + 'gates',
  software: STORAGE_PREFIX + 'software',
  campaigns: STORAGE_PREFIX + 'campaigns',
  sector: STORAGE_PREFIX + 'sector',
  envPreset: STORAGE_PREFIX + 'envPreset',
  exposure: STORAGE_PREFIX + 'exposure',
  platforms: STORAGE_PREFIX + 'platforms',
  highlighted: STORAGE_PREFIX + 'highlighted',
  sidebar: STORAGE_PREFIX + 'sidebar',
  bottomTab: STORAGE_PREFIX + 'bottomTab',
  headerCollapsed: STORAGE_PREFIX + 'headerCollapsed',
  postures: STORAGE_PREFIX + 'postures',
} as const;

export const DEFAULT_BUDGET = 500_000;

export interface Highlight { id: string; color: number }

/** Apply a shared link (if any) to storage and strip it from the address bar */
export function applySharedLinkToStorage(): boolean {
  const s = decodeHashToState(window.location.hash);
  if (!s) return false;
  const fw: FrameworkId = s.framework ?? 'enterprise';
  const cfg = getFrameworkConfig(fw);
  writeStored(KEYS.framework, fw);
  writeStored(KEYS.sector, s.sector ?? 'all');
  writeStored(KEYS.budget, s.budget ?? DEFAULT_BUDGET);
  writeStored(KEYS.orgSize, s.orgSize ?? 'medium');
  writeStored(KEYS.envPreset, s.envPreset ?? 'default');
  writeStored(KEYS.params, s.params ?? DEFAULT_MODEL_PARAMS);
  writeStored(KEYS.software, s.includeSoftware ?? true);
  writeStored(KEYS.campaigns, s.includeCampaigns ?? false);
  writeStored(KEYS.platforms, s.platforms && s.platforms.length > 0 ? s.platforms.filter(p => cfg.allPlatforms.includes(p)) : null);
  writeStored(KEYS.highlighted, (s.chains ?? []).map((id, i): Highlight => ({ id, color: i })));
  const gates = readStored<Partial<Record<FrameworkId, string[]>>>(KEYS.gates, {});
  const validGates = (s.gates ?? []).filter(g => cfg.gateOptions.some(o => o.id === g));
  writeStored(KEYS.gates, { ...gates, [fw]: validGates.length > 0 ? validGates : cfg.defaultGates });
  const postures = readStored<Partial<Record<FrameworkId, StoredPosture>>>(KEYS.postures, {});
  writeStored(KEYS.postures, { ...postures, [fw]: { mitigations: s.mitigations ?? [], dataComponents: s.dataComponents ?? [], blocked: s.blocked ?? [] } });
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return true;
}

export function shareUrl(state: ShareableState): string {
  const hash = encodeStateToHash(state);
  return window.location.origin + window.location.pathname + (hash ? '#' + hash : '');
}

export const isParams = (v: unknown): boolean => {
  const p = v as ModelParams | null;
  return !!p && (Object.keys(DEFAULT_MODEL_PARAMS) as (keyof ModelParams)[]).every(k => typeof p[k] === 'number' && p[k] >= 0 && p[k] <= 1);
};
