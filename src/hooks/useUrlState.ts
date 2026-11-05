// ─── URL State Encoding / Decoding ───────────────────────────────────────────
// Pure functions for sharing app state through the URL hash. Every decoded
// value is format-validated; anything malformed is dropped silently and the
// app falls back to defaults.

import type { FrameworkId, ModelParams, VocabularyId } from '../types';
import { ORG_SIZES, type OrgSize } from '../engine/portfolioOptimizer';
import { SECTORS } from '../engine/actorTags';

export interface ShareableState {
  framework?: FrameworkId;
  sector?: string;
  budget?: number;
  orgSize?: OrgSize;
  envPreset?: string;
  vocabulary?: VocabularyId;
  /** Posture in the link's vocabulary: M#### / D3-* prevention IDs, DC#### / D3-* detection IDs */
  prevent?: string[];
  detect?: string[];
  blocked?: string[];
  chains?: string[];
  platforms?: string[];
  params?: ModelParams;
  gates?: string[];
  includeSoftware?: boolean;
  includeCampaigns?: boolean;
}

const VALID_FW = new Set<string>(['enterprise', 'ics']);
const VALID_SECTOR = new Set<string>(['all', ...SECTORS.map(s => s.id)]);
const RE_PREVENT = /^(M\d{4}|D3-[A-Z0-9]{1,12})$/;
const RE_DETECT = /^(DC\d{4}|D3-[A-Z0-9]{1,12})$/;
const RE_TECH = /^T\d{4}(\.\d{3})?$/;
const RE_CHAIN = /^[A-Za-z0-9-]{1,48}$/;
const RE_WORD = /^[A-Za-z0-9 -]{1,32}$/;
const MAX_LIST = 400;

const list = (v: string | null, sep: string, re: RegExp) =>
  (v ?? '').split(sep).filter(x => re.test(x)).slice(0, MAX_LIST);

/** Encodes application state into a URL-safe hash string (without the leading `#`) */
export function encodeStateToHash(s: ShareableState): string {
  const p = new URLSearchParams();
  if (s.framework && s.framework !== 'enterprise') p.set('fw', s.framework);
  if (s.sector && s.sector !== 'all') p.set('sec', s.sector);
  if (s.budget !== undefined) p.set('bud', String(Math.round(s.budget)));
  if (s.orgSize && s.orgSize !== 'medium') p.set('org', s.orgSize);
  if (s.envPreset && s.envPreset !== 'default') p.set('env', s.envPreset);
  if (s.vocabulary && s.vocabulary !== 'attack') p.set('voc', s.vocabulary);
  if (s.prevent?.length) p.set('pv', s.prevent.join(','));
  if (s.detect?.length) p.set('dt', s.detect.join(','));
  if (s.blocked?.length) p.set('blk', s.blocked.join(','));
  if (s.chains?.length) p.set('ch', s.chains.join('|'));
  if (s.platforms?.length) p.set('plat', s.platforms.join(','));
  if (s.params) {
    const { mitigationEffectiveness: m, detectionEffectiveness: d, responseEffectiveness: r, substitutionRate: f, adversaryAdaptiveness: a } = s.params;
    p.set('p', [m, d, r, f, a].map(x => x.toFixed(2)).join(','));
  }
  if (s.gates?.length) p.set('g', s.gates.join(','));
  if (s.includeSoftware === false) p.set('sw', '0');
  if (s.includeCampaigns) p.set('camp', '1');
  return p.toString();
}

/** Decodes a URL hash back into a partial, validated ShareableState (null if nothing usable) */
export function decodeHashToState(hash: string): ShareableState | null {
  if (!hash || hash.length < 2) return null;
  try {
    const p = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const s: ShareableState = {};
    const fw = p.get('fw');
    if (fw && VALID_FW.has(fw)) s.framework = fw as FrameworkId;
    const sec = p.get('sec');
    if (sec && VALID_SECTOR.has(sec)) s.sector = sec;
    if (p.has('bud')) {
      const b = Number(p.get('bud'));
      if (Number.isFinite(b) && b >= 0 && b <= 1e10) s.budget = b;
    }
    const org = p.get('org');
    if (org && org in ORG_SIZES) s.orgSize = org as OrgSize;
    const env = p.get('env');
    if (env && RE_WORD.test(env)) s.envPreset = env;
    const voc = p.get('voc');
    if (voc === 'd3fend') s.vocabulary = 'd3fend';
    // 'mit'/'dc' are the v2.0 parameter names (ATT&CK vocabulary)
    if (p.has('pv') || p.has('mit')) s.prevent = list(p.get('pv') ?? p.get('mit'), ',', RE_PREVENT);
    if (p.has('dt') || p.has('dc')) s.detect = list(p.get('dt') ?? p.get('dc'), ',', RE_DETECT);
    if (p.has('blk')) s.blocked = list(p.get('blk'), ',', RE_TECH);
    if (p.has('ch')) s.chains = list(p.get('ch'), '|', RE_CHAIN).slice(0, 3);
    if (p.has('plat')) s.platforms = list(p.get('plat'), ',', RE_WORD);
    if (p.has('p')) {
      const v = (p.get('p') ?? '').split(',').map(Number);
      if (v.length === 5 && v.every(x => Number.isFinite(x) && x >= 0 && x <= 1)) {
        s.params = { mitigationEffectiveness: v[0], detectionEffectiveness: v[1], responseEffectiveness: v[2], substitutionRate: v[3], adversaryAdaptiveness: v[4] };
      }
    }
    if (p.has('g')) s.gates = list(p.get('g'), ',', /^[A-Za-z0-9]{1,16}$/);
    if (p.get('sw') === '0') s.includeSoftware = false;
    if (p.get('camp') === '1') s.includeCampaigns = true;
    return Object.keys(s).length > 0 ? s : null;
  } catch {
    return null;
  }
}
