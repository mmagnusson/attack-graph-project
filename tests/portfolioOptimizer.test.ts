import { describe, expect, it } from 'vitest';
import { compileModel, evaluateModel } from '../src/engine/riskModel';
import { buildCatalog, defaultCost, optimizePortfolio, marginalValues, withItems, evaluateItems, type CostModel } from '../src/engine/portfolioOptimizer';
import { getFrameworkConfig } from '../src/data/frameworkConfig';
import { attackVocabulary } from '../src/engine/defenseVocabulary';
import type { AttackChain, AttackDataset, CatalogItem, DefensePosture, ModelParams } from '../src/types';

const params: ModelParams = { mitigationEffectiveness: 0.5, detectionEffectiveness: 0.5, responseEffectiveness: 1, substitutionRate: 0.1, adversaryAdaptiveness: 0 };
const none: DefensePosture = { prevent: new Set(), detect: new Set(), blocked: new Set() };
const actor = (id: string, path: string[]): AttackChain =>
  ({ id, name: id, kind: 'group', description: '', path, viaSoftware: [], sectors: [], aliases: [] });
const tech = (id: string) => ({ id, name: id, tactic: 'TA0001', tactics: ['TA0001'], platforms: [] });

// Actor 1 has a single Initial Access option (A); actor 2 has two (B1, B2).
const dataset: AttackDataset = {
  schemaVersion: 2, framework: 'enterprise', sourceLabel: 'test',
  techniques: [tech('T000A'), tech('T00B1'), tech('T00B2')],
  chains: [],
  mitigations: [
    { id: 'MX', name: 'Expensive, closes actor 1', description: '', techniques: ['T000A'], actionable: true },
    { id: 'MY', name: 'Cheap, narrows actor 2', description: '', techniques: ['T00B1', 'T00B2'], actionable: true },
    { id: 'MZ', name: 'Useless alone', description: '', techniques: ['T00B1'], actionable: true },
  ],
  mitigationNotes: {}, detections: {}, dataComponents: [], usageNotes: {},
};
const model = compileModel({
  dataset, vocabulary: attackVocabulary(dataset, getFrameworkConfig('enterprise')), chains: [actor('A1', ['T000A']), actor('A2', ['T00B1', 'T00B2'])],
  gates: [{ id: 'ia', label: 'IA', tactics: ['TA0001'] }], includeSoftware: true, platforms: null,
});
const item = (id: string, cost: number): CatalogItem => ({ id, kind: 'prevent', name: id, cost, preventIds: [id], detectIds: [] });
const catalog = [item('MX', 100), item('MY', 1), item('MZ', 1)];

describe('optimizePortfolio', () => {
  it('ranks by risk removed per dollar on the unconstrained frontier', () => {
    const plan = optimizePortfolio(model, params, none, catalog, { budget: null });
    // MZ is worthless alone but worth buying once MY has narrowed the same gate
    expect(plan.steps.map(s => s.item.id)).toEqual(['MY', 'MZ', 'MX']);
    expect(plan.steps[0].delta).toBeCloseTo(0.225, 10);  // gate 1 → 1 − 0.9·0.5·0.5
    expect(plan.steps[1].delta).toBeCloseTo(0.05625, 10); // 2nd mitigation on B1 counts half: p 0.5 → 0.375
    expect(plan.steps[2].delta).toBeCloseTo(0.45, 10);   // actor 1 → 1 − 0.9·0.5
    for (let i = 1; i < plan.steps.length; i++) expect(plan.steps[i].risk).toBeLessThanOrEqual(plan.steps[i - 1].risk);
  });

  it('never exceeds the budget', () => {
    const plan = optimizePortfolio(model, params, none, catalog, { budget: 50 });
    expect(plan.totalCost).toBeLessThanOrEqual(50);
    expect(plan.steps.map(s => s.item.id)).toEqual(['MY', 'MZ']);
  });

  it('falls back to the best single affordable item when greedy strands the budget', () => {
    // Greedy buys MY and MZ for $2, then MX ($100) no longer fits in $100.
    const plan = optimizePortfolio(model, params, none, catalog, { budget: 100 });
    expect(plan.steps.map(s => s.item.id)).toEqual(['MX']);
    expect(plan.finalRisk).toBeCloseTo(2 - 0.45, 10);
  });

  it('skips items that add nothing on their own', () => {
    const plan = optimizePortfolio(model, params, none, [item('MZ', 1)], { budget: null });
    expect(plan.steps).toHaveLength(0);
  });

  it('reports marginal values consistent with re-evaluation', () => {
    const state = evaluateModel(model, params, none);
    const mv = marginalValues(model, params, state, catalog);
    for (const it of catalog) {
      const { after } = evaluateItems(model, params, none, [it]);
      expect(mv.get(it.id)!).toBeCloseTo(state.risk - after, 12);
    }
  });
});

describe('buildCatalog', () => {
  const cfg = getFrameworkConfig('enterprise');
  const costs: CostModel = { orgSize: 'medium', overrides: {} };
  const vocabOf = (ds: AttackDataset) => attackVocabulary(ds, cfg);
  const ds: AttackDataset = {
    ...dataset,
    mitigations: [
      { id: 'M1031', name: 'NIPS', description: '', techniques: ['T000A'], actionable: true },
      { id: 'M1056', name: 'Pre-compromise', description: '', techniques: ['T000A'], actionable: false },
      { id: 'M1017', name: 'User Training', description: '', techniques: ['T000A'], actionable: true },
    ],
    dataComponents: [{ id: 'DC0078', name: 'flow', description: '' }, { id: 'DC0082', name: 'conn', description: '' }, { id: 'DC0102', name: 'share', description: '' }],
  };

  it('offers actionable, not-yet-implemented mitigations at tier cost', () => {
    const cat = buildCatalog(vocabOf(ds), { ...none, prevent: new Set(['M1017']) }, costs);
    expect(cat.filter(c => c.kind === 'prevent').map(c => c.id)).toEqual(['M1031']);
    expect(cat.find(c => c.id === 'M1031')!.cost).toBe(150_000);
  });

  it('prices partly collected telemetry for its missing data components only', () => {
    const cat = buildCatalog(vocabOf(ds), { ...none, detect: new Set(['DC0078']) }, costs);
    const flow = cat.find(c => c.id === 'ts-netflow')!;
    expect(flow.detectIds).toEqual(['DC0082', 'DC0102']);
    expect(flow.cost).toBe(Math.round(defaultCost(vocabOf(ds), 'ts-netflow', 'medium') * 2 / 3));
  });

  it('honors cost overrides and org size', () => {
    const cat = buildCatalog(vocabOf(ds), none, { orgSize: 'small', overrides: { M1017: 1234 } });
    expect(cat.find(c => c.id === 'M1017')!.cost).toBe(1234);
    expect(cat.find(c => c.id === 'M1031')!.cost).toBe(60_000);
  });

  it('merges items into a posture without mutating it', () => {
    const merged = withItems(none, [item('MX', 1)]);
    expect([...merged.prevent]).toEqual(['MX']);
    expect(none.prevent.size).toBe(0);
  });
});
