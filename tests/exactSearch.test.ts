import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileModel, evaluateModel, DEFAULT_MODEL_PARAMS } from '../src/engine/riskModel';
import { buildCatalog, optimizePortfolio, marginalValues } from '../src/engine/portfolioOptimizer';
import { IncrementalEvaluator, checkOptimality, choosePool, exhaustiveSearch, improveBySwaps } from '../src/engine/exactSearch';
import { withItems } from '../src/engine/posture';
import { attackVocabulary } from '../src/engine/defenseVocabulary';
import { getFrameworkConfig } from '../src/data/frameworkConfig';
import type { AttackChain, AttackDataset, CatalogItem, DefensePosture, ModelParams } from '../src/types';

const none: DefensePosture = { prevent: new Set(), detect: new Set(), blocked: new Set() };
const params: ModelParams = { mitigationEffectiveness: 0.5, detectionEffectiveness: 0.5, responseEffectiveness: 1, substitutionRate: 0.1, adversaryAdaptiveness: 0 };
const actor = (id: string, path: string[]): AttackChain => ({ id, name: id, kind: 'group', description: '', path, viaSoftware: [], sectors: [], aliases: [] });
const tech = (id: string) => ({ id, name: id, tactic: 'TA0001', tactics: ['TA0001'], platforms: [] });

// Same shape as the optimizer tests: greedy strands the budget on cheap items
const small: AttackDataset = {
  schemaVersion: 2, framework: 'enterprise', sourceLabel: 'test',
  techniques: [tech('T000A'), tech('T00B1'), tech('T00B2')], chains: [],
  mitigations: [
    { id: 'MX', name: 'MX', description: '', techniques: ['T000A'], actionable: true },
    { id: 'MY', name: 'MY', description: '', techniques: ['T00B1', 'T00B2'], actionable: true },
    { id: 'MZ', name: 'MZ', description: '', techniques: ['T00B1'], actionable: true },
  ],
  mitigationNotes: {}, detections: {}, dataComponents: [], usageNotes: {},
};
const smallModel = compileModel({
  dataset: small, vocabulary: attackVocabulary(small, getFrameworkConfig('enterprise')),
  chains: [actor('A1', ['T000A']), actor('A2', ['T00B1', 'T00B2'])],
  gates: [{ id: 'ia', label: 'IA', tactics: ['TA0001'] }], includeSoftware: true, platforms: null,
});
const item = (id: string, cost: number): CatalogItem => ({ id, kind: 'prevent', name: id, cost, preventIds: [id], detectIds: [] });
const catalog = [item('MX', 100), item('MY', 1), item('MZ', 1)];

function bruteForce(budget: number): number {
  let best = Infinity;
  for (let mask = 0; mask < 1 << catalog.length; mask++) {
    const pick = catalog.filter((_, i) => mask & (1 << i));
    if (pick.reduce((s, x) => s + x.cost, 0) > budget) continue;
    best = Math.min(best, evaluateModel(smallModel, params, withItems(none, pick)).risk);
  }
  return best;
}

describe('exhaustiveSearch', () => {
  for (const budget of [1, 2, 50, 100, 101, 102]) {
    it('matches brute force at budget ' + budget, () => {
      const r = exhaustiveSearch(smallModel, params, none, catalog, budget);
      expect(r.complete).toBe(true);
      expect(r.risk).toBeCloseTo(bruteForce(budget), 12);
      expect(r.items.reduce((s, x) => s + x.cost, 0)).toBeLessThanOrEqual(budget);
    });
  }

  it('starts from an incumbent and keeps it when nothing beats it', () => {
    const r = exhaustiveSearch(smallModel, params, none, catalog, 101, { incumbent: [catalog[0], catalog[1]] });
    expect(r.items.map(x => x.id).sort()).toEqual(['MX', 'MY']);
    expect(r.risk).toBeCloseTo(bruteForce(101), 12);
  });
});

describe('improveBySwaps', () => {
  it('fixes a stranded greedy plan', () => {
    const r = improveBySwaps(smallModel, params, none, catalog, [catalog[1], catalog[2]], 101);
    expect(r.items.map(x => x.id).sort()).toEqual(['MX', 'MY']);
    expect(r.moves).toBe(1);
  });

  it('never makes a plan worse', () => {
    const r = improveBySwaps(smallModel, params, none, catalog, [catalog[0]], 100);
    expect(r.risk).toBeLessThanOrEqual(evaluateModel(smallModel, params, withItems(none, [catalog[0]])).risk + 1e-12);
  });
});

describe('choosePool', () => {
  it('keeps every plan item and adds the most promising affordable extras', () => {
    const mv = new Map([['MX', 0.45], ['MY', 0.225], ['MZ', 0]]);
    expect(choosePool(catalog, [catalog[1]], mv, 50, 5).map(x => x.id)).toEqual(['MY']); // MX unaffordable, MZ no value alone
    expect(choosePool(catalog, [catalog[1]], mv, 100, 5).map(x => x.id)).toEqual(['MY', 'MX']);
  });
});

describe('on bundled data', () => {
  const cfg = getFrameworkConfig('enterprise');
  const ds = JSON.parse(readFileSync('public' + cfg.dataUrl, 'utf8')) as AttackDataset;
  const vocabulary = attackVocabulary(ds, cfg);
  const model = compileModel({
    dataset: ds, vocabulary, chains: ds.chains.filter(c => c.kind === 'group'),
    gates: cfg.gateOptions.filter(g => cfg.defaultGates.includes(g.id)), includeSoftware: true, platforms: null,
  });
  const cat = buildCatalog(vocabulary, none, { orgSize: 'medium', overrides: {} });

  it('apply/undo agrees with full re-evaluation', () => {
    const ev = new IncrementalEvaluator(model, DEFAULT_MODEL_PARAMS, none);
    const picks = [cat[0], cat[5], cat.find(c => c.kind === 'detect')!, cat[12]];
    picks.forEach(p => ev.apply(ev.resolve(p)));
    expect(ev.risk).toBeCloseTo(evaluateModel(model, DEFAULT_MODEL_PARAMS, withItems(none, picks)).risk, 9);
    ev.undo(); ev.undo();
    expect(ev.risk).toBeCloseTo(evaluateModel(model, DEFAULT_MODEL_PARAMS, withItems(none, picks.slice(0, 2))).risk, 9);
  });

  it('finds a plan at least as good as greedy over a pool containing it', () => {
    const budget = 250_000;
    const plan = optimizePortfolio(model, DEFAULT_MODEL_PARAMS, none, cat, { budget, refine: false });
    const mv = marginalValues(model, DEFAULT_MODEL_PARAMS, evaluateModel(model, DEFAULT_MODEL_PARAMS, none), cat);
    const items = plan.steps.map(s => s.item);
    const ex = exhaustiveSearch(model, DEFAULT_MODEL_PARAMS, none, choosePool(cat, items, mv, budget, 6), budget, { deadlineMs: 20_000 });
    expect(ex.complete).toBe(true);
    expect(ex.risk).toBeLessThanOrEqual(plan.finalRisk + 1e-9);
  });

  it('checkOptimality grows the pool and reports what it proved', () => {
    const budget = 250_000;
    const plan = optimizePortfolio(model, DEFAULT_MODEL_PARAMS, none, cat, { budget });
    const mv = marginalValues(model, DEFAULT_MODEL_PARAMS, evaluateModel(model, DEFAULT_MODEL_PARAMS, none), cat);
    const items = plan.steps.map(s => s.item);
    const pools: number[] = [];
    const r = checkOptimality(model, DEFAULT_MODEL_PARAMS, none, cat, items, mv, budget, {
      deadlineMs: 2_000, onProgress: p => { if (pools.at(-1) !== p.pool) pools.push(p.pool); },
    });
    expect(r.planRisk).toBeCloseTo(plan.finalRisk, 9);
    expect(r.risk).toBeLessThanOrEqual(r.planRisk);
    expect(r.items.reduce((s, x) => s + x.cost, 0)).toBeLessThanOrEqual(budget);
    expect(r.provenPool).toBeGreaterThanOrEqual(items.length + 8);
    expect(pools[0]).toBe(items.length + 8);
  }, 15_000);

  it('checkOptimality stops at the deadline with nothing proven', () => {
    let t = 0;
    const budget = 1_000_000;
    const plan = optimizePortfolio(model, DEFAULT_MODEL_PARAMS, none, cat, { budget });
    const mv = marginalValues(model, DEFAULT_MODEL_PARAMS, evaluateModel(model, DEFAULT_MODEL_PARAMS, none), cat);
    const r = checkOptimality(model, DEFAULT_MODEL_PARAMS, none, cat, plan.steps.map(s => s.item), mv, budget, { deadlineMs: 5, now: () => (t += 1) });
    expect(r.provenPool).toBe(0);
    expect(r.coversAll).toBe(false);
    expect(r.risk).toBeLessThanOrEqual(r.planRisk);
  });
});
