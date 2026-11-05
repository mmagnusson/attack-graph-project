import { describe, expect, it } from 'vitest';
import {
  actorBreakdown, compileModel, evaluateModel, gateValue, simulateAddition, techniqueActivity, applyAddition, stackedMitigation,
  type CompileInputs,
} from '../src/engine/riskModel';
import type { AttackChain, AttackDataset, DefensePosture, GateDef, ModelParams } from '../src/types';
import { attackVocabulary } from '../src/engine/defenseVocabulary';
import { getFrameworkConfig } from '../src/data/frameworkConfig';

// Two Initial Access options (A, B), one Execution option (C, plus sub-technique C.001), one C2 option (D)
const dataset: AttackDataset = {
  schemaVersion: 2, framework: 'enterprise', sourceLabel: 'test',
  techniques: [
    { id: 'T0001', name: 'A', tactic: 'TA0001', tactics: ['TA0001'], platforms: [] },
    { id: 'T0002', name: 'B', tactic: 'TA0001', tactics: ['TA0001'], platforms: [] },
    { id: 'T0003', name: 'C', tactic: 'TA0002', tactics: ['TA0002'], platforms: [] },
    { id: 'T0003.001', name: 'C sub', tactic: 'TA0002', tactics: ['TA0002'], parentId: 'T0003', platforms: [] },
    { id: 'T0004', name: 'D', tactic: 'TA0011', tactics: ['TA0011'], platforms: [] },
  ],
  chains: [],
  mitigations: [
    { id: 'M0A', name: 'Mit A', description: '', techniques: ['T0001'], actionable: true },
    { id: 'M0B', name: 'Mit B', description: '', techniques: ['T0002'], actionable: true },
    { id: 'M0C', name: 'Mit C (parent)', description: '', techniques: ['T0003'], actionable: true },
  ],
  mitigationNotes: {},
  detections: {
    T0003: { id: 'DET1', name: 'det C', analytics: [{ id: 'AN1', platforms: ['Windows'], dataComponents: ['DC1'], description: '' }] },
    T0004: { id: 'DET2', name: 'det D', analytics: [{ id: 'AN2', platforms: ['Linux'], dataComponents: ['DC1', 'DC2'], description: '' }] },
  },
  dataComponents: [
    { id: 'DC1', name: 'one', description: '' },
    { id: 'DC2', name: 'two', description: '' },
  ],
  usageNotes: {},
};
const gates: GateDef[] = [
  { id: 'ia', label: 'Initial Access', tactics: ['TA0001'] },
  { id: 'ex', label: 'Execution', tactics: ['TA0002'] },
  { id: 'c2', label: 'C2', tactics: ['TA0011'] },
];
const actor = (id: string, path: string[], viaSoftware: string[] = []): AttackChain =>
  ({ id, name: id, kind: 'group', description: '', path, viaSoftware, sectors: [], aliases: [] });

// α = 0 (blind attacker) and ρ = 1 (every alert contained) reduce viability to Π S·E,
// which keeps the closed forms below easy to check by hand
const params: ModelParams = { mitigationEffectiveness: 0.5, detectionEffectiveness: 0.5, responseEffectiveness: 1, substitutionRate: 0.1, adversaryAdaptiveness: 0 };
const none: DefensePosture = { prevent: new Set(), detect: new Set(), blocked: new Set() };
const posture = (p: Partial<{ prevent: string[]; detect: string[]; blocked: string[] }>): DefensePosture => ({
  prevent: new Set(p.prevent), detect: new Set(p.detect), blocked: new Set(p.blocked),
});
const vocabulary = attackVocabulary(dataset, getFrameworkConfig('enterprise'));
const inputs = (over: Partial<CompileInputs> = {}): CompileInputs => ({
  dataset, vocabulary, chains: [actor('X', ['T0001', 'T0002', 'T0003', 'T0004'])], gates, includeSoftware: true, platforms: null, ...over,
});
const risk = (p: DefensePosture, over: Partial<CompileInputs> = {}, prm = params) =>
  evaluateModel(compileModel(inputs(over)), prm, p).risk;

describe('gate formula', () => {
  it('matches the closed form', () => {
    const v = gateValue(Int32Array.from([0, 1]), Float64Array.from([0.5, 0.5]), Float64Array.from([0, 0.5]), 0.1, 0);
    expect(v.pass).toBeCloseTo(1 - 0.9 * 0.25, 10);
    expect(v.evade).toBeCloseTo(1 - (0.5 * 0.5) / 1.1, 10);
    expect(v.value).toBeCloseTo(v.pass * v.evade, 12);
  });

  it('lets a fully adaptive attacker route around partial detection', () => {
    const p = Float64Array.from([0.5, 0.5]);
    // One option undetected → an adaptive attacker evades for certain
    expect(gateValue(Int32Array.from([0, 1]), p, Float64Array.from([0, 0.5]), 0.1, 1).evade).toBe(1);
    // Every option covered → it must take the least-covered one
    expect(gateValue(Int32Array.from([0, 1]), p, Float64Array.from([0.3, 0.5]), 0.1, 1).evade).toBeCloseTo(0.7, 12);
    // Blocked options (p = 0) are not candidates
    expect(gateValue(Int32Array.from([0, 1]), Float64Array.from([0, 0.5]), Float64Array.from([0, 0.5]), 0.1, 1).evade).toBeCloseTo(0.5, 12);
    // Halfway blends the two
    const blind = gateValue(Int32Array.from([0, 1]), p, Float64Array.from([0.3, 0.5]), 0.1, 0).evade;
    expect(gateValue(Int32Array.from([0, 1]), p, Float64Array.from([0.3, 0.5]), 0.1, 0.5).evade).toBeCloseTo((blind + 0.7) / 2, 12);
  });
});

describe('evaluateModel', () => {
  it('is fully viable with no defenses and full exposure', () => {
    expect(risk(none)).toBeCloseTo(1, 12);
  });

  it('does nothing when one option at a gate stays open (prevention needs breadth)', () => {
    expect(risk(posture({ prevent: ['M0A'] }))).toBeCloseTo(1, 12);
  });

  it('narrows the gate once every option is mitigated', () => {
    expect(risk(posture({ prevent: ['M0A', 'M0B'] }))).toBeCloseTo(1 - 0.9 * 0.5 * 0.5, 12);
  });

  it('gives overlapping mitigations on one technique diminishing returns', () => {
    expect(stackedMitigation(0.5, 0)).toBe(1);
    expect(stackedMitigation(0.5, 1)).toBeCloseTo(0.5, 12);
    expect(stackedMitigation(0.5, 2)).toBeCloseTo(0.5 * 0.75, 12);
    expect(stackedMitigation(0.5, 3)).toBeCloseTo(0.5 * 0.75 * 0.875, 12);
    expect(stackedMitigation(0.5, 30)).toBeGreaterThan(0.28); // floors near 0.29, never reaches 0
  });

  it('applies a parent-technique mitigation to sub-techniques', () => {
    const m = compileModel(inputs({ chains: [actor('X', ['T0001', 'T0003.001', 'T0004'])] }));
    const s = evaluateModel(m, params, posture({ prevent: ['M0C'] }));
    expect(s.p[m.techIndex.get('T0003.001')!]).toBeCloseTo(0.5, 12);
    expect(s.p[m.techIndex.get('T0003')!]).toBeCloseTo(0.5, 12);
  });

  it('gives detection partial credit through the evade term', () => {
    // Execution gate {C}: telemetry 1 → q = 0.5; evade = 1 − 0.5/(1 + 0.1)
    expect(risk(posture({ detect: ['DC1'] }))).toBeCloseTo((1 - 0.5 / 1.1) * (1 - 0.25 / 1.1), 10);
  });

  it('caps detection at response effectiveness, applied once per intrusion', () => {
    // Execution gate unalerted 1 − 0.5/1.1, C2 gate unalerted 1 − 0.25/1.1; every gate passes
    const unalerted = (1 - 0.5 / 1.1) * (1 - 0.25 / 1.1);
    const r = risk(posture({ detect: ['DC1'] }), {}, { ...params, responseEffectiveness: 0.6 });
    expect(r).toBeCloseTo(1 - 0.6 * (1 - unalerted), 10);
    // Even perfect detection cannot remove more than ρ of an actor's viability
    const perfect = risk(posture({ detect: ['DC1', 'DC2'] }), {}, { ...params, detectionEffectiveness: 1, responseEffectiveness: 0.6 });
    expect(perfect).toBeGreaterThanOrEqual(0.4 - 1e-12);
  });

  it('scores analytics by the share of their data components collected', () => {
    const m = compileModel(inputs());
    const s = evaluateModel(m, params, posture({ detect: ['DC2'] }));
    expect(s.ruleCoverage[m.techIndex.get('T0004')!]).toBeCloseTo(0.5, 12);
  });

  it('filters analytics by platform', () => {
    const m = compileModel(inputs({ platforms: new Set(['Windows']) }));
    const s = evaluateModel(m, params, posture({ detect: ['DC1', 'DC2'] }));
    expect(s.ruleCoverage[m.techIndex.get('T0003')!]).toBe(1);
    expect(s.ruleCoverage[m.techIndex.get('T0004')!]).toBe(0); // Linux-only analytic filtered out
  });

  it('treats blocked parents as blocking sub-techniques, leaving only substitution', () => {
    const m = compileModel(inputs({ chains: [actor('X', ['T0001', 'T0003.001', 'T0004'])] }));
    const s = evaluateModel(m, params, posture({ blocked: ['T0003'] }));
    expect(s.p[m.techIndex.get('T0003.001')!]).toBe(0);
    expect(s.risk).toBeCloseTo(0.1, 12);
  });

  it('inherits exposure and tool coverage from parent techniques', () => {
    const m = compileModel(inputs({
      exposure: { T0003: 0.4 }, toolCoverage: { T0003: { detect: 0.5, prevent: 0.5 } },
    }));
    const sub = m.techIndex.get('T0003.001')!;
    expect(m.basePrevent[sub]).toBeCloseTo(0.2, 12);
    expect(m.toolDetect[sub]).toBeCloseTo(0.5, 12);
  });

  it('skips gates the actor has no known technique for, and weights actors', () => {
    const m = compileModel(inputs({
      chains: [actor('X', ['T0001', 'T0004']), actor('Y', ['T0001', 'T0002', 'T0003', 'T0004'])],
      actorWeights: { X: 3 },
    }));
    expect(m.actors[0].gates.map(g => g.gate.id)).toEqual(['ia', 'c2']);
    expect(m.totalWeight).toBe(4);
    expect(evaluateModel(m, params, posture({ blocked: ['T0004'] })).risk).toBeCloseTo(3 * 0.1 + 0.1, 12);
  });

  it('can exclude software-only techniques', () => {
    const chains = [actor('X', ['T0001', 'T0002', 'T0003', 'T0004'], ['T0002'])];
    expect(risk(posture({ prevent: ['M0A'] }), { chains, includeSoftware: false })).toBeCloseTo(1 - 0.9 * 0.5, 12);
    expect(risk(posture({ prevent: ['M0A'] }), { chains, includeSoftware: true })).toBeCloseTo(1, 12);
  });
});

describe('incremental what-ifs', () => {
  const m = compileModel(inputs({ chains: [actor('X', ['T0001', 'T0002', 'T0003', 'T0004']), actor('Y', ['T0001', 'T0003.001', 'T0004'])] }));
  const base = evaluateModel(m, params, none);
  const cases = [
    { prevent: ['M0A'] }, { prevent: ['M0A', 'M0B'] }, { prevent: ['M0C'] },
    { detect: ['DC1'] }, { detect: ['DC2'] }, { blocked: ['T0003'] },
  ];
  for (const add of cases) {
    it('simulateAddition matches a full re-evaluation for ' + JSON.stringify(add), () => {
      const full = evaluateModel(m, params, posture(add)).risk;
      expect(simulateAddition(m, params, base, add)).toBeCloseTo(full, 12);
      expect(applyAddition(m, params, base, add).risk).toBeCloseTo(full, 12);
    });
  }
});

describe('read-outs', () => {
  it('breaks an actor down gate by gate', () => {
    const m = compileModel(inputs());
    const s = evaluateModel(m, params, posture({ prevent: ['M0A', 'M0B'] }));
    const gatesOut = actorBreakdown(m, params, s, 0);
    expect(gatesOut.map(g => g.gateId)).toEqual(['ia', 'ex', 'c2']);
    expect(gatesOut[0].pass).toBeCloseTo(0.775, 12);
    expect(gatesOut[0].options.map(o => o.techniqueId)).toEqual(['T0001', 'T0002']);
  });

  it('shifts attacker activity to alternatives when a technique is blocked', () => {
    const m = compileModel(inputs());
    const a = m.techIndex.get('T0001')!, b = m.techIndex.get('T0002')!;
    const before = techniqueActivity(m, params, evaluateModel(m, params, none));
    const after = techniqueActivity(m, params, evaluateModel(m, params, posture({ blocked: ['T0001'] })));
    expect(before[a]).toBeCloseTo(before[b], 12);
    expect(after[a]).toBe(0);
    expect(after[b]).toBeGreaterThan(before[b]);
  });
});
