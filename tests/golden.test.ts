// Golden tests against the bundled ATT&CK datasets in public/data.
// They pin data integrity (counts, catalog coverage) and guard the model
// against regressing to "one technique breaks the chain" optimism.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getFrameworkConfig } from '../src/data/frameworkConfig';
import { compileModel, evaluateModel, simulateAddition, DEFAULT_MODEL_PARAMS } from '../src/engine/riskModel';
import { buildCatalog, optimizePortfolio } from '../src/engine/portfolioOptimizer';
import { isCurrentDataset } from '../src/data/loadAttackData';
import { attackVocabulary } from '../src/engine/defenseVocabulary';
import type { AttackDataset, DefensePosture, FrameworkId } from '../src/types';

const load = (fw: FrameworkId) => {
  const cfg = getFrameworkConfig(fw);
  const ds = JSON.parse(readFileSync('public' + cfg.dataUrl, 'utf8')) as AttackDataset;
  return { cfg, ds };
};
const none: DefensePosture = { prevent: new Set(), detect: new Set(), blocked: new Set() };

describe.each(['enterprise', 'ics'] as FrameworkId[])('%s bundled dataset', fw => {
  const { cfg, ds } = load(fw);

  it('matches the current parser version', () => {
    expect(isCurrentDataset(ds, cfg)).toBe(true);
  });

  it('assigns every data component to exactly one telemetry source, with no unknown IDs', () => {
    const owners = new Map<string, string[]>();
    for (const ts of cfg.telemetrySources) for (const dc of ts.dataComponents) owners.set(dc, [...(owners.get(dc) || []), ts.id]);
    const known = new Set(ds.dataComponents.map(d => d.id));
    for (const dc of known) expect(owners.get(dc), dc).toHaveLength(1);
    for (const dc of owners.keys()) expect(known.has(dc), dc + ' is not in the dataset').toBe(true);
  });

  it('has a cost tier for every actionable mitigation and no stray tiers', () => {
    const actionable = ds.mitigations.filter(m => m.actionable).map(m => m.id);
    for (const id of actionable) expect(cfg.mitigationTiers[id], id).toBeDefined();
    const ids = new Set(ds.mitigations.map(m => m.id));
    for (const id of Object.keys(cfg.mitigationTiers)) expect(ids.has(id), id).toBe(true);
  });

  it('only references real mitigations and telemetry in posture presets', () => {
    const mids = new Set(ds.mitigations.filter(m => m.actionable).map(m => m.id));
    const tids = new Set(cfg.telemetrySources.map(t => t.id));
    for (const p of Object.values(cfg.posturePresets)) {
      p.mitigations.forEach(m => expect(mids.has(m), p.name + ': ' + m).toBe(true));
      p.telemetry.forEach(t => expect(tids.has(t), p.name + ': ' + t).toBe(true));
    }
  });

  it('only references current techniques in the coverage KB and environment presets', () => {
    // Revoked or deprecated IDs are silently ignored by the model; map them to their replacements
    const ids = new Set(ds.techniques.map(t => t.id));
    for (const [id, tool] of Object.entries(cfg.coverageKB.tools)) Object.keys(tool.techniques).forEach(t => expect(ids.has(t), id + ': ' + t).toBe(true));
    for (const [id, infra] of Object.entries(cfg.coverageKB.infrastructure)) Object.keys(infra.exposes).forEach(t => expect(ids.has(t), id + ': ' + t).toBe(true));
    for (const [id, p] of Object.entries(cfg.envPresets)) Object.keys(p.overrides ?? {}).forEach(t => expect(ids.has(t), id + ': ' + t).toBe(true));
  });

  it('lists every platform the techniques and analytics use', () => {
    const used = new Set([...ds.techniques.flatMap(t => t.platforms), ...Object.values(ds.detections).flatMap(d => d.analytics.flatMap(a => a.platforms))]);
    expect([...used].sort()).toEqual([...cfg.allPlatforms].sort());
  });

  it('shows sub-techniques when the dataset has them', () => {
    expect(cfg.hasSubTechniques).toBe(ds.techniques.some(t => t.parentId));
  });

  it('produces a monotone frontier and a plan that fits the budget', () => {
    const gates = cfg.gateOptions.filter(g => cfg.defaultGates.includes(g.id));
    const vocabulary = attackVocabulary(ds, cfg);
    const model = compileModel({ dataset: ds, vocabulary, chains: ds.chains.filter(c => c.kind === 'group'), gates, includeSoftware: true, platforms: null });
    const catalog = buildCatalog(vocabulary, none, { orgSize: 'medium', overrides: {} });
    const frontier = optimizePortfolio(model, DEFAULT_MODEL_PARAMS, none, catalog, { budget: null, maxSteps: 25 });
    expect(frontier.steps.length).toBeGreaterThan(5);
    frontier.steps.forEach((s, i) => {
      expect(s.risk).toBeLessThanOrEqual(i === 0 ? frontier.baselineRisk : frontier.steps[i - 1].risk);
      expect(s.delta).toBeGreaterThan(0);
    });
    const plan = optimizePortfolio(model, DEFAULT_MODEL_PARAMS, none, catalog, { budget: 500_000 });
    expect(plan.totalCost).toBeLessThanOrEqual(500_000);
    expect(plan.finalRisk).toBeLessThan(plan.baselineRisk);
  });
});

describe('enterprise data shape', () => {
  const { ds } = load('enterprise');

  it('has the v20.1 catalog sizes', () => {
    expect(ds.techniques).toHaveLength(706);
    expect(ds.mitigations).toHaveLength(44);
    expect(ds.mitigations.filter(m => !m.actionable).map(m => m.id)).toEqual(['M1055', 'M1056']);
    expect(Object.keys(ds.detections)).toHaveLength(706);
    expect(ds.dataComponents).toHaveLength(106);
    expect(ds.chains.filter(c => c.kind === 'group').length).toBeGreaterThanOrEqual(150);
    expect(ds.chains.filter(c => c.kind === 'campaign').length).toBeGreaterThan(30);
  });

  it('keeps all four tactics of Valid Accounts', () => {
    const t = ds.techniques.find(x => x.id === 'T1078')!;
    expect(t.tactics).toEqual(expect.arrayContaining(['TA0001', 'TA0003', 'TA0004', 'TA0005']));
    expect(t.tactic).toBe('TA0001');
  });

  it('counts sub-technique use toward the parent family', () => {
    const groups = ds.chains.filter(c => c.kind === 'group');
    const family = groups.filter(c => c.path.some(t => t === 'T1059' || t.startsWith('T1059.'))).length;
    const exact = groups.filter(c => c.path.includes('T1059')).length;
    expect(family).toBeGreaterThan(100);
    expect(family).toBeGreaterThan(exact * 2);
  });
});

describe('model realism guard', () => {
  const { cfg, ds } = load('enterprise');
  const gates = cfg.gateOptions.filter(g => cfg.defaultGates.includes(g.id));
  const vocabulary = attackVocabulary(ds, cfg);
  const model = compileModel({ dataset: ds, vocabulary, chains: ds.chains.filter(c => c.kind === 'group'), gates, includeSoftware: true, platforms: null });
  const base = evaluateModel(model, DEFAULT_MODEL_PARAMS, none);

  it('does not let blocking one popular technique remove most of the risk', () => {
    // The pre-2026-11 model reported 57% of actors "disrupted" by blocking T1105 alone.
    for (const t of ['T1105', 'T1059', 'T1566', 'T1071', 'T1204']) {
      const r = simulateAddition(model, DEFAULT_MODEL_PARAMS, base, { blocked: [t] });
      expect(1 - r / base.risk, t).toBeLessThan(0.25);
    }
  });

  it('evaluates quickly enough for interactive use', () => {
    const catalog = buildCatalog(vocabulary, none, { orgSize: 'medium', overrides: {} });
    const t0 = performance.now();
    optimizePortfolio(model, DEFAULT_MODEL_PARAMS, none, catalog, { budget: null, maxSteps: 25 });
    expect(performance.now() - t0).toBeLessThan(3000);
  });
});
