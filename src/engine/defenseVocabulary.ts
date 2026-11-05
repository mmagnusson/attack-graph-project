// ─── Defense Vocabularies — the catalog the model and optimizer work in ─────
//
// The risk model needs two things from a defense catalog:
//   preventions  items that lower a technique's success when implemented
//   detection    per technique, a list of rules (analytics) that each need some
//                components to be in place; coverage = share of rules satisfied
// Two vocabularies provide them:
//   attack   MITRE mitigations · MITRE detection strategies → analytics → data
//            components, purchased as telemetry-source bundles
//   d3fend   D3FEND Harden/Isolate/Evict base techniques · D3FEND Detect/Deceive
//            countermeasures inferred for each technique, purchased by base technique
//            (ICS techniques D3FEND hasn't mapped yet borrow an Enterprise equivalent's)
// Each vocabulary keeps its own posture, so one capability is never counted twice.

import type {
  AttackDataset, CostTier, D3fendDataset, D3fendLink, D3fendRole, DefenseVocabulary, DetectionRule, FrameworkConfig,
} from '../types';
import { D3FEND_BORROWED_LINKS, D3FEND_TACTIC_ROLES, D3FEND_TIERS, TELEMETRY_TO_D3FEND } from '../data/d3fendConfig';

export function attackVocabulary(dataset: AttackDataset, cfg: FrameworkConfig): DefenseVocabulary {
  const rules: Record<string, DetectionRule[]> = {};
  for (const [tid, strat] of Object.entries(dataset.detections)) {
    rules[tid] = strat.analytics.map(a => ({ id: a.id, platforms: a.platforms, components: a.dataComponents }));
  }
  return {
    id: 'attack',
    label: 'ATT&CK mitigations + telemetry',
    preventions: dataset.mitigations.map(m => ({ id: m.id, name: m.name, description: m.description, techniques: m.techniques, actionable: m.actionable })),
    components: dataset.dataComponents.map(d => ({ id: d.id, name: d.name })),
    rules,
    bundles: cfg.telemetrySources.map(ts => ({ id: ts.id, name: ts.name, description: ts.description, components: ts.dataComponents, tier: ts.tier })),
    tiers: cfg.mitigationTiers,
  };
}

export const d3fendRole = (tactic: string): D3fendRole => D3FEND_TACTIC_ROLES[tactic] ?? 'foundation';

/** The Enterprise technique whose D3FEND links `tid` borrows (D3FEND_BORROWED_LINKS), if any */
export function d3fendBorrowedFrom(d3: D3fendDataset, tid: string): string | undefined {
  const src = D3FEND_BORROWED_LINKS[tid];
  return src && !d3.attack[tid] && d3.attack[src] ? src : undefined;
}

const linksCache = new WeakMap<D3fendDataset, Record<string, D3fendLink[]>>();

/** ATT&CK technique → D3FEND links, D3FEND's own plus borrowed ones */
export function d3fendLinks(d3: D3fendDataset): Record<string, D3fendLink[]> {
  let out = linksCache.get(d3);
  if (!out) {
    out = { ...d3.attack };
    for (const tid of Object.keys(D3FEND_BORROWED_LINKS)) {
      const src = d3fendBorrowedFrom(d3, tid);
      if (src) out[tid] = d3.attack[src];
    }
    linksCache.set(d3, out);
  }
  return out;
}

export function d3fendVocabulary(dataset: AttackDataset, d3: D3fendDataset): DefenseVocabulary {
  const known = new Set(dataset.techniques.map(t => t.id));
  const roleOf = (d3id: string) => d3fendRole(d3.techniques[d3id]?.tactic ?? '');

  // Prevention: a base technique applies to an ATT&CK technique if any of its countermeasures is mapped to it
  const preventTechs = new Map<string, Set<string>>();
  const rules: Record<string, DetectionRule[]> = {};
  for (const [tid, links] of Object.entries(d3fendLinks(d3))) {
    if (!known.has(tid)) continue;
    for (const [d3id] of links) {
      const role = roleOf(d3id);
      if (role === 'prevent') {
        const base = d3.techniques[d3id].base;
        let s = preventTechs.get(base);
        if (!s) preventTechs.set(base, s = new Set());
        s.add(tid);
      } else if (role === 'detect') {
        // Each mapped detection countermeasure is one rule, satisfied by deploying that countermeasure
        (rules[tid] ||= []).push({ id: d3id, platforms: [], components: [d3id] });
      }
    }
  }

  const tiers: Record<string, CostTier> = {};
  const preventions = d3.bases
    .filter(b => d3fendRole(b.tactic) === 'prevent')
    .map(b => {
      tiers[b.id] = D3FEND_TIERS[b.id] ?? 2;
      return { id: b.id, name: b.name, description: b.definition, techniques: [...(preventTechs.get(b.id) ?? [])].sort(), actionable: true, group: b.tactic };
    });
  const detectBases = d3.bases.filter(b => d3fendRole(b.tactic) === 'detect');
  return {
    id: 'd3fend',
    label: 'D3FEND countermeasures',
    preventions,
    components: detectBases.flatMap(b => b.techniques.map(id => ({ id, name: d3.techniques[id]?.name ?? id }))),
    rules,
    bundles: detectBases.map(b => ({
      id: b.id, name: b.name, description: b.definition, components: b.techniques, tier: D3FEND_TIERS[b.id] ?? 2, group: b.tactic,
    })),
    tiers,
  };
}

/**
 * Carry an ATT&CK-vocabulary posture over to D3FEND: mitigations through the
 * ontology's mitigation → countermeasure links, telemetry sources through
 * TELEMETRY_TO_D3FEND (a source counts once at least half of it is collected).
 */
export function translateAttackPosture(
  attack: { prevent: Iterable<string>; detect: Iterable<string> }, cfg: FrameworkConfig, d3: D3fendDataset,
): { prevent: string[]; detect: string[] } {
  const prevent = new Set<string>(), detect = new Set<string>();
  const baseOf = new Map(d3.bases.map(b => [b.id, b]));
  const addDetectBase = (baseId: string) => baseOf.get(baseId)?.techniques.forEach(t => detect.add(t));
  for (const m of attack.prevent) {
    for (const d3id of d3.mitigations[m] ?? []) {
      const t = d3.techniques[d3id];
      if (!t) continue;
      const role = d3fendRole(t.tactic);
      if (role === 'prevent') prevent.add(t.base);
      else if (role === 'detect') detect.add(d3id);
    }
  }
  const collected = new Set(attack.detect);
  for (const ts of cfg.telemetrySources) {
    const have = ts.dataComponents.filter(d => collected.has(d)).length;
    if (have > 0 && have >= ts.dataComponents.length / 2) (TELEMETRY_TO_D3FEND[ts.id] ?? []).forEach(addDetectBase);
  }
  return { prevent: [...prevent].sort(), detect: [...detect].sort() };
}
