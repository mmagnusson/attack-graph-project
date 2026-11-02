// ─── Display Metrics — model state rolled up onto the displayed graph nodes ──
// With sub-techniques hidden, a parent node stands for its whole family:
// activity is summed, success and detection are activity-weighted, and the
// actor count is the number of actors using any family member.

import type { CompiledModel, ModelState } from './riskModel';
import { rollupId } from './graphModel';

export interface NodeMetrics {
  /** Residual success chance after prevention (activity-weighted over the family) */
  success: number;
  /** Detection coverage 0..1 before the effectiveness factor (activity-weighted) */
  detection: number;
  /** Expected share of residual attacker activity (summed over the family) */
  activity: number;
  /** Modeled actors using this technique or any displayed-family member */
  actors: number;
  /** Implemented mitigations applying to the node's own technique */
  mitigations: number;
  blocked: boolean;
}

export function rollupMetrics(
  model: CompiledModel, state: ModelState, activity: Float64Array, display: ReadonlySet<string>,
): Record<string, NodeMetrics> {
  const acc = new Map<string, { act: number; ps: number; ds: number; pOwn: number; dOwn: number; actors: Set<number>; mit: number; blocked: boolean }>();
  model.techIds.forEach((tid, i) => {
    const id = rollupId(tid, display);
    if (!id) return;
    let a = acc.get(id);
    if (!a) acc.set(id, a = { act: 0, ps: 0, ds: 0, pOwn: NaN, dOwn: NaN, actors: new Set(), mit: 0, blocked: false });
    const det = 1 - (1 - state.telemetry[i]) * (1 - model.toolDetect[i]);
    a.act += activity[i];
    a.ps += activity[i] * state.p[i];
    a.ds += activity[i] * det;
    for (const ai of model.techActors[i]) a.actors.add(ai);
    if (tid === id) {
      a.pOwn = state.p[i];
      a.dOwn = det;
      a.mit = state.mitCount[i];
      a.blocked = state.blocked[i] === 1;
    }
  });
  const out: Record<string, NodeMetrics> = {};
  for (const [id, a] of acc) {
    out[id] = {
      success: a.act > 0 ? a.ps / a.act : (Number.isNaN(a.pOwn) ? 0 : a.pOwn),
      detection: a.act > 0 ? a.ds / a.act : (Number.isNaN(a.dOwn) ? 0 : a.dOwn),
      activity: a.act,
      actors: a.actors.size,
      mitigations: a.mit,
      blocked: a.blocked,
    };
  }
  return out;
}

/** Techniques (rolled up to displayed IDs) a defense would change */
export function defenseFootprint(
  model: CompiledModel, display: ReadonlySet<string>, mitigationIds: readonly string[], dataComponentIds: readonly string[],
): Set<string> {
  const out = new Set<string>();
  const add = (i: number) => {
    const id = rollupId(model.techIds[i], display);
    if (id) out.add(id);
  };
  for (const m of mitigationIds) {
    const mi = model.mitigationIndex.get(m);
    if (mi !== undefined) model.mitigationTechs[mi].forEach(add);
  }
  for (const d of dataComponentIds) {
    const di = model.dcIndex.get(d);
    if (di !== undefined) model.dcTechs[di].forEach(add);
  }
  return out;
}

export interface NodeDefenses {
  /** MITRE mitigations mapped to the technique family (parent mappings included) */
  mitigations: string[];
  /** Platform-filtered analytics with at least one data component */
  analytics: number;
  /** Data components those analytics need */
  dataComponents: string[];
}

/** What MITRE offers against each displayed node (aggregated over its sub-techniques) */
export function nodeDefenses(model: CompiledModel, display: ReadonlySet<string>): Record<string, NodeDefenses> {
  const mitsOf: Set<string>[] = model.techIds.map(() => new Set());
  model.mitigationTechs.forEach((techs, mi) => techs.forEach(t => mitsOf[t].add(model.mitigationIds[mi])));
  const acc = new Map<string, { m: Set<string>; a: number; d: Set<string> }>();
  model.techIds.forEach((tid, i) => {
    const id = rollupId(tid, display);
    if (!id) return;
    let x = acc.get(id);
    if (!x) acc.set(id, x = { m: new Set(), a: 0, d: new Set() });
    mitsOf[i].forEach(m => x!.m.add(m));
    x.a += model.techAnalytics[i].length;
    for (const an of model.techAnalytics[i]) for (const dc of an) x.d.add(model.dcIds[dc]);
  });
  const out: Record<string, NodeDefenses> = {};
  for (const [id, x] of acc) out[id] = { mitigations: [...x.m].sort(), analytics: x.a, dataComponents: [...x.d].sort() };
  return out;
}

export interface BlindSpot {
  techniqueId: string;
  /** Share of total residual activity carried by this node */
  share: number;
  prevention: 'none' | 'available';
  detection: 'no-guidance' | 'dark';
  mitigations: string[];
  missingDataComponents: string[];
}

/**
 * Displayed techniques in a required stage that carry at least `minShare` of
 * residual activity with no mitigation in place AND no collected telemetry for
 * their analytics. Techniques outside the required stages cannot change any
 * actor's viability, so they are not reported.
 */
export function findBlindSpots(
  techniques: { id: string; tactics: string[] }[], gateTactics: ReadonlySet<string>,
  metrics: Record<string, NodeMetrics>, defenses: Record<string, NodeDefenses>,
  posture: { mitigations: ReadonlySet<string>; dataComponents: ReadonlySet<string> }, minShare = 0.002,
): BlindSpot[] {
  const total = Object.values(metrics).reduce((s, m) => s + m.activity, 0) || 1;
  const out: BlindSpot[] = [];
  for (const t of techniques) {
    if (!t.tactics.some(x => gateTactics.has(x))) continue;
    const id = t.id;
    const m = metrics[id], d = defenses[id];
    if (!m || !d || m.blocked) continue;
    const share = m.activity / total;
    if (share < minShare || d.mitigations.some(x => posture.mitigations.has(x))) continue;
    const missing = d.dataComponents.filter(x => !posture.dataComponents.has(x));
    if (d.analytics > 0 && missing.length < d.dataComponents.length) continue;
    out.push({
      techniqueId: id, share,
      prevention: d.mitigations.length > 0 ? 'available' : 'none',
      detection: d.analytics === 0 ? 'no-guidance' : 'dark',
      mitigations: d.mitigations, missingDataComponents: missing,
    });
  }
  return out.sort((a, b) => b.share - a.share);
}

export const fmtPct = (x: number, digits = 0) => (x * 100).toFixed(digits) + '%';

export function fmtUsd(x: number): string {
  if (x >= 1_000_000) return '$' + (x / 1_000_000).toFixed(x >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (x >= 1_000) return '$' + Math.round(x / 1_000) + 'K';
  return '$' + Math.round(x);
}
