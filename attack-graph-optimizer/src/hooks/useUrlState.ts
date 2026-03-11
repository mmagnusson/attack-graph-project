// ─── URL State Encoding / Decoding & CSV Sanitisation ─────────────────────────
//
// Extracted from attack-path-optimizer.html (lines ~3182-3229).
// Pure utility functions for encoding/decoding shareable app state to/from
// URL hash parameters, plus a CSV injection prevention helper.

import type { FrameworkId, DataSourceId, SectorFilter } from '../types';

// ─── Shareable state shape (matches the URL hash params) ──────────────────────

export interface ShareableState {
  framework?: FrameworkId;
  dataSource?: DataSourceId;
  envPreset?: string;
  sectorFilter?: SectorFilter;
  remediationBudget?: number;
  remediated?: string[];
  deployedControls?: string[];
  chains?: string[];
  phaseWeighting?: boolean;
  selectedPlatforms?: string[];
  controlPreset?: string;
}

// ─── Validation sets ──────────────────────────────────────────────────────────

const VALID_FW: ReadonlySet<string> = new Set<FrameworkId>(['enterprise', 'ics']);
const VALID_DS: ReadonlySet<string> = new Set<DataSourceId>(['stix', 'builtin']);
const VALID_SECTOR: ReadonlySet<string> = new Set<SectorFilter>(['all', 'government', 'financial']);

// NOTE: sanitizeCSVCell already lives in ../engine/graphModel.ts — import from there.

// ─── Encode ───────────────────────────────────────────────────────────────────

/**
 * Encodes application state into a URL-safe hash string (without the leading `#`).
 * Only non-default values are included to keep the URL compact.
 */
export function encodeStateToHash(state: ShareableState): string {
  const p = new URLSearchParams();

  if (state.framework && state.framework !== 'enterprise') p.set('fw', state.framework);
  if (state.dataSource && state.dataSource !== 'stix') p.set('ds', state.dataSource);
  if (state.envPreset && state.envPreset !== 'government') p.set('env', state.envPreset);
  if (state.sectorFilter && state.sectorFilter !== 'all') p.set('sec', state.sectorFilter);
  if (state.remediationBudget !== undefined && state.remediationBudget !== 5) {
    p.set('budget', String(state.remediationBudget));
  }
  if (state.remediated && state.remediated.length > 0) p.set('rem', state.remediated.join(','));
  if (state.deployedControls && state.deployedControls.length > 0) {
    p.set('ctrl', state.deployedControls.join(','));
  }
  if (state.chains && state.chains.length > 0) p.set('chains', state.chains.join('|'));
  if (state.phaseWeighting) p.set('pw', '1');
  if (state.selectedPlatforms && state.selectedPlatforms.length > 0) {
    p.set('plat', state.selectedPlatforms.join(','));
  }
  if (state.controlPreset && state.controlPreset !== 'none') p.set('cp', state.controlPreset);

  return p.toString();
}

// ─── Decode ───────────────────────────────────────────────────────────────────

/**
 * Decodes a URL hash string (with or without the leading `#`) back into a
 * partial `ShareableState`. Returns `null` when the hash is empty or contains
 * no recognised parameters.
 *
 * All values are validated / sanitised before being included in the result.
 */
export function decodeHashToState(hash: string): ShareableState | null {
  if (!hash || hash.length < 2) return null;
  try {
    const p = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const state: ShareableState = {};

    if (p.has('fw')) {
      const v = p.get('fw')!;
      if (VALID_FW.has(v)) state.framework = v as FrameworkId;
    }
    if (p.has('ds')) {
      const v = p.get('ds')!;
      if (VALID_DS.has(v)) state.dataSource = v as DataSourceId;
    }
    if (p.has('env')) {
      const v = p.get('env')!;
      if (v) state.envPreset = v;
    }
    if (p.has('sec')) {
      const v = p.get('sec')!;
      if (VALID_SECTOR.has(v)) state.sectorFilter = v as SectorFilter;
    }
    if (p.has('budget')) {
      const v = parseInt(p.get('budget')!, 10);
      if (v >= 1 && v <= 10) state.remediationBudget = v;
    }
    if (p.has('rem')) {
      state.remediated = p.get('rem')!.split(',').filter(Boolean);
    }
    if (p.has('ctrl')) {
      state.deployedControls = p.get('ctrl')!.split(',').filter(Boolean);
    }
    if (p.has('chains')) {
      state.chains = p.get('chains')!.split('|').filter(Boolean);
    }
    if (p.has('pw')) {
      state.phaseWeighting = true;
    }
    if (p.has('plat')) {
      const v = p.get('plat')!.split(',').filter(Boolean);
      if (v.length > 0) state.selectedPlatforms = v;
    }
    if (p.has('cp')) {
      const v = p.get('cp')!;
      if (v) state.controlPreset = v;
    }

    return Object.keys(state).length > 0 ? state : null;
  } catch {
    return null;
  }
}
