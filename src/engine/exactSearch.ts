// ─── Exact search — how close is the greedy plan to the best plan? ──────────
//
// The model's objective (product of stage probabilities with a detection blend)
// is not linear or submodular, so there is no cheap certificate of optimality.
// Instead we offer two things:
//   • improveBySwaps   a local search run on every budgeted plan: swap or add
//                      single items while it helps and the budget allows
//   • exhaustiveSearch the best within-budget subset of a candidate pool (the
//                      plan plus the most promising other items): branch and
//                      bound over subsets with an apply/undo evaluator, so each
//                      step re-scores only the affected actors
// The exhaustive result is exact *over the pool*; items outside the pool are
// not considered, and the UI says so.

import type { CatalogItem, DefensePosture, ModelParams } from '../types';
import { evaluateModel, gateValue, rulesCovered, stackedMitigation, type CompiledModel, type ModelState } from './riskModel';
import { withItems } from './posture';

interface ResolvedItem { prevent: number[]; components: number[] }
interface Undo {
  techs: number[]; p: number[]; q: number[]; prevent: number[]; coverage: number[];
  components: number[]; actors: number[]; viability: number[]; risk: number;
}

/** Mutable model state supporting apply(item) / undo() in stack order */
export class IncrementalEvaluator {
  readonly model: CompiledModel;
  readonly params: ModelParams;
  risk: number;
  private s: ModelState;
  private stack: Undo[] = [];
  private seenTech: Int32Array;
  private seenActor: Int32Array;
  private stamp = 0;

  constructor(model: CompiledModel, params: ModelParams, posture: DefensePosture) {
    this.model = model;
    this.params = params;
    this.s = evaluateModel(model, params, posture);
    this.risk = this.s.risk;
    this.seenTech = new Int32Array(model.techIds.length);
    this.seenActor = new Int32Array(model.actors.length);
  }

  resolve(item: CatalogItem): ResolvedItem {
    return {
      prevent: item.preventIds.map(id => this.model.preventionIndex.get(id)).filter((x): x is number => x !== undefined),
      components: item.detectIds.map(id => this.model.componentIndex.get(id)).filter((x): x is number => x !== undefined),
    };
  }

  apply(item: ResolvedItem): void {
    const { model, params, s } = this;
    const stamp = ++this.stamp;
    const u: Undo = { techs: [], p: [], q: [], prevent: [], coverage: [], components: [], actors: [], viability: [], risk: this.risk };
    const touch = (t: number) => {
      if (this.seenTech[t] === stamp) return;
      this.seenTech[t] = stamp;
      u.techs.push(t); u.p.push(s.p[t]); u.q.push(s.q[t]); u.prevent.push(s.preventCount[t]); u.coverage.push(s.ruleCoverage[t]);
    };
    for (const m of item.prevent) for (const t of model.preventionTechs[m]) { touch(t); s.preventCount[t]++; }
    for (const c of item.components) {
      if (s.collected[c]) continue;
      s.collected[c] = 1;
      u.components.push(c);
      for (const t of model.componentTechs[c]) touch(t);
    }
    if (u.components.length > 0) for (const t of u.techs) s.ruleCoverage[t] = rulesCovered(model.techRules[t], s.collected);
    for (const t of u.techs) {
      s.p[t] = s.blocked[t] ? 0 : model.basePrevent[t] * stackedMitigation(params.mitigationEffectiveness, s.preventCount[t]);
      s.q[t] = params.detectionEffectiveness * (1 - (1 - s.ruleCoverage[t]) * (1 - model.toolDetect[t]));
    }
    for (const t of u.techs) for (const a of model.techActors[t]) {
      if (this.seenActor[a] === stamp) continue;
      this.seenActor[a] = stamp;
      const actor = model.actors[a];
      let pass = 1, unalerted = 1;
      for (const g of actor.gates) {
        const v = gateValue(g.options, s.p, s.q, params.substitutionRate, params.adversaryAdaptiveness);
        pass *= v.pass; unalerted *= v.evade;
      }
      const v = pass * (1 - params.responseEffectiveness * (1 - unalerted));
      u.actors.push(a); u.viability.push(s.viability[a]);
      this.risk += actor.weight * (v - s.viability[a]);
      s.viability[a] = v;
    }
    this.stack.push(u);
  }

  undo(): void {
    const u = this.stack.pop();
    if (!u) return;
    const s = this.s;
    for (let i = u.actors.length - 1; i >= 0; i--) s.viability[u.actors[i]] = u.viability[i];
    for (let i = 0; i < u.techs.length; i++) {
      const t = u.techs[i];
      s.p[t] = u.p[i]; s.q[t] = u.q[i]; s.preventCount[t] = u.prevent[i]; s.ruleCoverage[t] = u.coverage[i];
    }
    for (const c of u.components) s.collected[c] = 0;
    this.risk = u.risk;
  }
}

// ─── Local search ─────────────────────────────────────────────────────────────

/**
 * Improve a within-budget plan by single swaps (drop one item, add another)
 * and single additions, taking the best improving move until none helps.
 */
export function improveBySwaps(
  model: CompiledModel, params: ModelParams, posture: DefensePosture,
  catalog: CatalogItem[], plan: CatalogItem[], budget: number, maxRounds = 25,
): { items: CatalogItem[]; risk: number; moves: number } {
  let items = [...plan];
  const riskOf = (xs: CatalogItem[]) => evaluateModel(model, params, withItems(posture, xs)).risk;
  let risk = riskOf(items);
  let moves = 0;
  const eps = 1e-9 * Math.max(1, model.totalWeight);
  for (let round = 0; round < maxRounds; round++) {
    const spent = items.reduce((s, x) => s + x.cost, 0);
    const outside = catalog.filter(c => !items.includes(c));
    let best: { items: CatalogItem[]; risk: number } | null = null;
    // Additions
    const ev = new IncrementalEvaluator(model, params, withItems(posture, items));
    for (const c of outside) {
      if (spent + c.cost > budget) continue;
      ev.apply(ev.resolve(c));
      if (ev.risk < (best?.risk ?? risk) - eps) best = { items: [...items, c], risk: ev.risk };
      ev.undo();
    }
    // Swaps. Risk only falls as defenses are added, so an item that also fits
    // as a plain addition can't do better as a swap: only try the ones that don't
    const swapIns = outside.filter(c => spent + c.cost > budget);
    for (const drop of items) {
      const rest = items.filter(x => x !== drop);
      const restCost = spent - drop.cost;
      const fits = swapIns.filter(c => restCost + c.cost <= budget);
      if (fits.length === 0) continue;
      const ev2 = new IncrementalEvaluator(model, params, withItems(posture, rest));
      for (const c of fits) {
        ev2.apply(ev2.resolve(c));
        if (ev2.risk < (best?.risk ?? risk) - eps) best = { items: [...rest, c], risk: ev2.risk };
        ev2.undo();
      }
    }
    if (!best) break;
    items = best.items;
    risk = best.risk;
    moves++;
  }
  return { items, risk, moves };
}

// ─── Exhaustive search over a candidate pool ─────────────────────────────────

/**
 * The search pool: every item in the plan, plus the `extra` most promising
 * affordable items outside it (by risk removed per dollar on their own).
 */
export function choosePool(catalog: CatalogItem[], planItems: CatalogItem[], marginal: Map<string, number>, budget: number, extra: number): CatalogItem[] {
  const pool = [...planItems];
  const outside = catalog
    .filter(c => c.cost <= budget && !pool.includes(c) && (marginal.get(c.id) ?? 0) > 0)
    .sort((a, b) => (marginal.get(b.id) ?? 0) / Math.max(b.cost, 1) - (marginal.get(a.id) ?? 0) / Math.max(a.cost, 1));
  return [...pool, ...outside.slice(0, extra)];
}

export interface ExhaustiveResult {
  items: CatalogItem[];
  risk: number;
  baselineRisk: number;
  explored: number;
  complete: boolean;
  elapsedMs: number;
}

export function exhaustiveSearch(
  model: CompiledModel, params: ModelParams, posture: DefensePosture, pool: CatalogItem[], budget: number,
  opts: { deadlineMs?: number; onProgress?: (explored: number) => void; now?: () => number; incumbent?: CatalogItem[] } = {},
): ExhaustiveResult {
  const now = opts.now ?? (() => Date.now());
  const start = now();
  const deadline = start + (opts.deadlineMs ?? 20_000);
  const ev = new IncrementalEvaluator(model, params, posture);
  const baselineRisk = ev.risk;
  // Expensive items first: budget prunes the tree early
  const order = [...pool].sort((a, b) => b.cost - a.cost);
  const resolved = order.map(c => ev.resolve(c));
  const chosen: number[] = [];
  let best = { idx: [] as number[], risk: baselineRisk };
  if (opts.incumbent) {
    const idx = opts.incumbent.map(c => order.indexOf(c)).filter(i => i >= 0);
    idx.forEach(i => ev.apply(resolved[i]));
    best = { idx, risk: ev.risk };
    idx.forEach(() => ev.undo());
  }
  let explored = 0;
  let complete = true;
  const eps = 1e-12 * Math.max(1, model.totalWeight);

  // Branch and bound. Risk only falls as defenses are added, so the risk with
  // every remaining affordable item added is a lower bound for this branch —
  // and when those items all fit at once, it is the branch's exact best.
  const dfs = (k: number, spent: number): void => {
    if (++explored % 256 === 0) {
      opts.onProgress?.(explored);
      if (now() > deadline) { complete = false; return; }
    }
    if (ev.risk < best.risk - eps) best = { idx: [...chosen], risk: ev.risk };
    const fits: number[] = [];
    let fitsCost = 0;
    for (let i = k; i < order.length; i++) if (spent + order[i].cost <= budget) { fits.push(i); fitsCost += order[i].cost; }
    if (fits.length === 0) return;
    fits.forEach(i => ev.apply(resolved[i]));
    const bound = ev.risk;
    fits.forEach(() => ev.undo());
    if (bound >= best.risk - eps) return;
    if (spent + fitsCost <= budget) { best = { idx: [...chosen, ...fits], risk: bound }; return; }
    for (const i of fits) {
      ev.apply(resolved[i]);
      chosen.push(i);
      dfs(i + 1, spent + order[i].cost);
      chosen.pop();
      ev.undo();
      if (!complete) return;
    }
  };
  dfs(0, 0);
  opts.onProgress?.(explored);
  return { items: best.idx.map(i => order[i]), risk: best.risk, baselineRisk, explored, complete, elapsedMs: now() - start };
}

export interface OptimalityCheck {
  /** Best plan found and its residual risk */
  items: CatalogItem[];
  risk: number;
  baselineRisk: number;
  planRisk: number;
  /** Largest pool searched to completion (0 if none finished in time) */
  provenPool: number;
  /** Plan items plus every affordable item that removes risk on its own */
  candidates: number;
  /** The proven pool covered every candidate */
  coversAll: boolean;
  explored: number;
  elapsedMs: number;
}

export interface CheckProgress { pool: number; candidates: number; explored: number }

/**
 * Exact search with a growing pool (the plan plus 8, 16, 24 … of the most
 * promising other items) until it covers every candidate or time runs out.
 * Each round starts from the best plan found so far, which tightens pruning.
 */
export function checkOptimality(
  model: CompiledModel, params: ModelParams, posture: DefensePosture, catalog: CatalogItem[],
  planItems: CatalogItem[], marginal: Map<string, number>, budget: number,
  opts: { deadlineMs?: number; onProgress?: (p: CheckProgress) => void; now?: () => number } = {},
): OptimalityCheck {
  const now = opts.now ?? (() => Date.now());
  const start = now();
  const deadline = start + (opts.deadlineMs ?? 30_000);
  const all = choosePool(catalog, planItems, marginal, budget, Infinity);
  const planRisk = evaluateModel(model, params, withItems(posture, planItems)).risk;
  let best = { items: planItems, risk: planRisk };
  let baselineRisk = planRisk, provenPool = 0, explored = 0;
  for (let extra = 8; ; extra += 8) {
    const pool = all.slice(0, Math.min(all.length, planItems.length + extra));
    const r = exhaustiveSearch(model, params, posture, pool, budget, {
      deadlineMs: deadline - now(), now, incumbent: best.items,
      onProgress: n => opts.onProgress?.({ pool: pool.length, candidates: all.length, explored: explored + n }),
    });
    explored += r.explored;
    baselineRisk = r.baselineRisk;
    if (r.risk < best.risk) best = { items: r.items, risk: r.risk };
    if (!r.complete) break;
    provenPool = pool.length;
    if (pool.length === all.length) break;
  }
  return {
    ...best, baselineRisk, planRisk, provenPool, candidates: all.length,
    coversAll: provenPool === all.length, explored, elapsedMs: now() - start,
  };
}
