// ─── Portfolio Optimizer — which defenses buy the most risk reduction per $ ──
//
// Candidates come from the active defense vocabulary: MITRE mitigations and
// telemetry sources (bundles of data components), or D3FEND prevention and
// detection base techniques. Selection is greedy on risk removed per dollar, re-evaluated
// after every pick, with the standard safeguard for budgeted greedy: if the
// single best affordable item beats the greedy bundle, take it instead.
// The objective is not submodular (closing the last open option at a gate is
// worth more than the first), so the result is a strong heuristic, not a
// proven optimum.

import type {
  CatalogItem,
  CostTier,
  DefensePosture,
  DefenseVocabulary,
  ModelParams,
  PlanResult,
  PlanStep,
} from '../types';
import { applyAddition, evaluateModel, simulateAddition, type CompiledModel, type ModelState } from './riskModel';
import { additionOf, withItems } from './posture';
import { improveBySwaps } from './exactSearch';

export { additionOf, withItems };

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
export function defaultCost(vocab: DefenseVocabulary, itemId: string, orgSize: OrgSize): number {
  const bundle = vocab.bundles.find(b => b.id === itemId);
  const tier: CostTier = bundle ? bundle.tier : (vocab.tiers[itemId] ?? 2);
  return Math.round(TIER_COSTS[tier] * ORG_SIZES[orgSize].multiplier / 1000) * 1000;
}

export function fullCost(vocab: DefenseVocabulary, itemId: string, costs: CostModel): number {
  const o = costs.overrides[itemId];
  return o !== undefined && o >= 0 ? o : defaultCost(vocab, itemId, costs.orgSize);
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

/**
 * Everything not yet deployed that could be bought. A detection bundle that is
 * partly deployed is offered for its missing components at a proportional cost.
 */
export function buildCatalog(vocab: DefenseVocabulary, posture: DefensePosture, costs: CostModel): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const m of vocab.preventions) {
    if (!m.actionable || m.techniques.length === 0 || posture.prevent.has(m.id)) continue;
    items.push({ id: m.id, kind: 'prevent', name: m.name, cost: fullCost(vocab, m.id, costs), preventIds: [m.id], detectIds: [], group: m.group });
  }
  const known = new Set(vocab.components.map(d => d.id));
  for (const b of vocab.bundles) {
    const comps = b.components.filter(d => known.has(d));
    const missing = comps.filter(d => !posture.detect.has(d));
    if (comps.length === 0 || missing.length === 0) continue;
    items.push({
      id: b.id, kind: 'detect', name: b.name,
      cost: Math.round(fullCost(vocab, b.id, costs) * missing.length / comps.length),
      preventIds: [], detectIds: missing, group: b.group,
    });
  }
  return items;
}


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
  /** Budgeted plans only: refine the greedy result with single swaps (default true) */
  refine?: boolean;
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

  if (budget !== null) {
    // Budgeted greedy safeguard: compare against the best single affordable item
    let items = steps.map(s => s.item);
    let itemsRisk = state.risk;
    for (const item of catalog) {
      if (item.cost > budget) continue;
      const r = simulateAddition(model, params, start, additionOf(item));
      if (r < itemsRisk - 1e-9) { items = [item]; itemsRisk = r; }
    }
    // Then single swaps/additions while they help (see exactSearch.ts)
    const refined = opts.refine === false ? { items, risk: itemsRisk, moves: 0 } : improveBySwaps(model, params, posture, catalog, items, budget);
    const changed = refined.items.length !== steps.length || refined.items.some((x, i) => steps[i]?.item !== x);
    if (changed) return { ...sequence(model, params, start, refined.items), refinements: refined.moves };
  }

  return { baselineRisk: start.risk, totalWeight: model.totalWeight, steps, totalCost: spent, finalRisk: state.risk };
}

/** Order a fixed set of items the way greedy would (best risk removed per dollar first) */
function sequence(model: CompiledModel, params: ModelParams, start: ModelState, items: CatalogItem[]): PlanResult {
  let state = start;
  let spent = 0;
  const steps: PlanStep[] = [];
  const left = new Set(items);
  while (left.size > 0) {
    let best: CatalogItem | null = null, bestRatio = -Infinity, bestRisk = state.risk;
    for (const item of left) {
      const r = simulateAddition(model, params, state, additionOf(item));
      const ratio = (state.risk - r) / Math.max(item.cost, 1);
      if (ratio > bestRatio) { best = item; bestRatio = ratio; bestRisk = r; }
    }
    left.delete(best!);
    const delta = state.risk - bestRisk;
    state = applyAddition(model, params, state, additionOf(best!));
    spent += best!.cost;
    steps.push({ item: best!, cumulativeCost: spent, risk: state.risk, delta });
  }
  return { baselineRisk: start.risk, totalWeight: model.totalWeight, steps, totalCost: spent, finalRisk: state.risk };
}

/** Residual risk if a fixed set of items were deployed — used for sensitivity bands */
export function evaluateItems(model: CompiledModel, params: ModelParams, posture: DefensePosture, items: CatalogItem[]): { before: number; after: number } {
  const before = evaluateModel(model, params, posture);
  const after = evaluateModel(model, params, withItems(posture, items));
  return { before: before.risk, after: after.risk };
}
