// ─── Portfolio Optimizer — which defenses buy the most risk reduction per $ ──
//
// Candidates are MITRE mitigations and telemetry sources (bundles of data
// components). Selection is greedy on risk removed per dollar, re-evaluated
// after every pick, with the standard safeguard for budgeted greedy: if the
// single best affordable item beats the greedy bundle, take it instead.
// The objective is not submodular (closing the last open option at a gate is
// worth more than the first), so the result is a strong heuristic, not a
// proven optimum.

import type {
  AttackDataset,
  CatalogItem,
  CostTier,
  DefensePosture,
  FrameworkConfig,
  ModelParams,
  PlanResult,
  PlanStep,
} from '../types';
import { applyAddition, evaluateModel, simulateAddition, type CompiledModel, type ModelState } from './riskModel';

// ─── Costs ────────────────────────────────────────────────────────────────────

/** Default annual cost per tier for a mid-size organization (placeholder estimates, user-editable) */
export const TIER_COSTS: Record<CostTier, number> = { 1: 15_000, 2: 50_000, 3: 150_000, 4: 400_000 };

export const ORG_SIZES = {
  small: { label: "Small (<500 staff)", multiplier: 0.4 },
  medium: { label: "Mid-size (500–5,000)", multiplier: 1 },
  large: { label: "Large (5,000+)", multiplier: 2.5 },
} as const;
export type OrgSize = keyof typeof ORG_SIZES;

export interface CostModel {
  orgSize: OrgSize;
  /** itemId → user-entered annual cost (full deployment) */
  overrides: Record<string, number>;
}

/** Full-deployment cost estimate for a catalog item id */
export function defaultCost(cfg: FrameworkConfig, itemId: string, orgSize: OrgSize): number {
  const ts = cfg.telemetrySources.find(t => t.id === itemId);
  const tier: CostTier = ts ? ts.tier : (cfg.mitigationTiers[itemId] ?? 2);
  return Math.round(TIER_COSTS[tier] * ORG_SIZES[orgSize].multiplier / 1000) * 1000;
}

export function fullCost(cfg: FrameworkConfig, itemId: string, costs: CostModel): number {
  const o = costs.overrides[itemId];
  return o !== undefined && o >= 0 ? o : defaultCost(cfg, itemId, costs.orgSize);
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

/**
 * Everything not yet deployed that could be bought. A telemetry source that is
 * partly collected is offered for its missing data components at a
 * proportional cost.
 */
export function buildCatalog(cfg: FrameworkConfig, dataset: AttackDataset, posture: DefensePosture, costs: CostModel): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const m of dataset.mitigations) {
    if (!m.actionable || posture.mitigations.has(m.id)) continue;
    items.push({ id: m.id, kind: 'mitigation', name: m.name, cost: fullCost(cfg, m.id, costs), mitigationIds: [m.id], dataComponentIds: [] });
  }
  const known = new Set(dataset.dataComponents.map(d => d.id));
  for (const ts of cfg.telemetrySources) {
    const dcs = ts.dataComponents.filter(d => known.has(d));
    const missing = dcs.filter(d => !posture.dataComponents.has(d));
    if (dcs.length === 0 || missing.length === 0) continue;
    items.push({
      id: ts.id, kind: 'telemetry', name: ts.name,
      cost: Math.round(fullCost(cfg, ts.id, costs) * missing.length / dcs.length),
      mitigationIds: [], dataComponentIds: missing,
    });
  }
  return items;
}

const additionOf = (item: CatalogItem) => ({ mitigations: item.mitigationIds, dataComponents: item.dataComponentIds });

/** Risk removed by each catalog item if added alone to the current state */
export function marginalValues(model: CompiledModel, params: ModelParams, state: ModelState, catalog: CatalogItem[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const item of catalog) out.set(item.id, state.risk - simulateAddition(model, params, state, additionOf(item)));
  return out;
}

// ─── Optimizer ────────────────────────────────────────────────────────────────

export interface OptimizeOptions {
  /** Spend cap in USD; null = rank everything (the efficiency frontier) */
  budget: number | null;
  maxSteps?: number;
  /** Stop once a step removes less than this share of the starting risk */
  minRelativeGain?: number;
}

export function optimizePortfolio(
  model: CompiledModel, params: ModelParams, posture: DefensePosture, catalog: CatalogItem[], opts: OptimizeOptions,
): PlanResult {
  const maxSteps = opts.maxSteps ?? 40;
  const start = evaluateModel(model, params, posture);
  const minGain = Math.max(1e-9, (opts.minRelativeGain ?? 0.001) * start.risk);
  const budget = opts.budget;

  let state = start;
  let spent = 0;
  const steps: PlanStep[] = [];
  const remaining = new Set(catalog);

  while (steps.length < maxSteps && remaining.size > 0) {
    let best: CatalogItem | null = null;
    let bestRatio = -1;
    let bestRisk = state.risk;
    for (const item of remaining) {
      if (budget !== null && spent + item.cost > budget) continue;
      const r = simulateAddition(model, params, state, additionOf(item));
      const gain = state.risk - r;
      if (gain < minGain) continue;
      const ratio = gain / Math.max(item.cost, 1);
      if (ratio > bestRatio || (ratio === bestRatio && best && item.id < best.id)) {
        best = item; bestRatio = ratio; bestRisk = r;
      }
    }
    if (!best) break;
    remaining.delete(best);
    const delta = state.risk - bestRisk;
    state = applyAddition(model, params, state, additionOf(best));
    spent += best.cost;
    steps.push({ item: best, cumulativeCost: spent, risk: state.risk, delta });
  }

  // Budgeted greedy safeguard: compare against the best single affordable item
  if (budget !== null) {
    let single: CatalogItem | null = null;
    let singleRisk = state.risk;
    for (const item of catalog) {
      if (item.cost > budget) continue;
      const r = simulateAddition(model, params, start, additionOf(item));
      if (r < singleRisk - 1e-9) { single = item; singleRisk = r; }
    }
    if (single) {
      return {
        baselineRisk: start.risk, totalWeight: model.totalWeight,
        steps: [{ item: single, cumulativeCost: single.cost, risk: singleRisk, delta: start.risk - singleRisk }],
        totalCost: single.cost, finalRisk: singleRisk,
      };
    }
  }

  return { baselineRisk: start.risk, totalWeight: model.totalWeight, steps, totalCost: spent, finalRisk: state.risk };
}

/** Residual risk if a fixed set of items were deployed — used for sensitivity bands */
export function evaluateItems(model: CompiledModel, params: ModelParams, posture: DefensePosture, items: CatalogItem[]): { before: number; after: number } {
  const before = evaluateModel(model, params, posture);
  const after = evaluateModel(model, params, withItems(posture, items));
  return { before: before.risk, after: after.risk };
}

export function withItems(posture: DefensePosture, items: CatalogItem[]): DefensePosture {
  const mitigations = new Set(posture.mitigations);
  const dataComponents = new Set(posture.dataComponents);
  for (const it of items) {
    it.mitigationIds.forEach(m => mitigations.add(m));
    it.dataComponentIds.forEach(d => dataComponents.add(d));
  }
  return { mitigations, dataComponents, blocked: posture.blocked };
}
