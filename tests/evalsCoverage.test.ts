import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeEvalsIntoKb, scoreEvalsRound, type RawRound, type RawSubstep } from '../src/engine/evalsCoverage';
import { assessEnvironment } from '../src/engine/exposureEngine';
import { EVALS_COVERAGE_URL, EVALS_DETECTED_TYPES, EVALS_SCHEMA_VERSION, EVALS_TO_KB } from '../src/data/evalsConfig';
import { COVERAGE_KB } from '../src/data/coverageKb';
import type { EvalsCoverage } from '../src/types';

const sub = (tech: string, types: (string | [string, string])[], extra: Partial<RawSubstep> = {}): RawSubstep => ({
  Is_Setup: false, Noise_Category: '',
  Technique: { Technique_Id: tech.split('.')[0] },
  Subtechnique: tech.includes('.') ? { Subtechnique_Id: tech } : null,
  Detections: types.map(t => (Array.isArray(t) ? { Detection_Type: t[0], Execution_Run_Name: t[1] } : { Detection_Type: t, Execution_Run_Name: 'Initial Run' })),
  ...extra,
});
const round = (substeps: RawSubstep[]): RawRound => ({
  Adversary_Name: 'er7', Display_Name: 'Enterprise 2025', Evaluation_Year: 2025,
  Detections_By_Step: { Scenario_1: { Steps: [{ Substeps: substeps }] } },
});
const opts = { detectedTypes: EVALS_DETECTED_TYPES, shrinkage: 2 };

describe('scoreEvalsRound', () => {
  const r = scoreEvalsRound('acme', 'Acme', round([
    sub('T1059.001', ['Technique']),
    sub('T1059.003', ['General']),
    sub('T1059.003', ['None']),
    sub('T1003', ['Telemetry']),                                   // telemetry alone is not an alert
    sub('T1003', [['Technique', 'Configuration Change Run']]),     // only after a config change: missed
    sub('T1105', ['Not reported']),                                // not scored
    sub('T1105', ['N/A']),
    sub('T1105', []),
    sub('T1566.001', ['Technique'], { Is_Setup: true }),
    sub('T1078', ['Technique'], { Noise_Category: 'SYSTEM_ADMINISTRATION' }),
    { Technique: { Technique_Id: 'T1486' } },                      // protection test: no detections
  ]), opts)!;

  it('counts only scored substeps, with first-run Technique/Tactic/General detections as hits', () => {
    expect(r.substeps).toBe(5);
    expect(r.detected).toBe(2);
    expect(Object.keys(r.techniques).sort()).toEqual(['T1003', 'T1059', 'T1059.001', 'T1059.003']);
  });

  it('rolls sub-techniques up into the parent and shrinks toward the overall rate', () => {
    const overall = 2 / 5;
    expect(r.techniques.T1059).toMatchObject({ n: 3, hits: 2 });
    expect(r.techniques.T1059.detect).toBeCloseTo((2 + 2 * overall) / 5, 3);
    expect(r.techniques['T1059.001'].detect).toBeCloseTo((1 + 2 * overall) / 3, 3);
    expect(r.techniques.T1003).toMatchObject({ n: 2, hits: 0 });
  });

  it('maps revoked techniques to their replacements, including a new parent', () => {
    const remap = (id: string) => ({ 'T1070.001': 'T1685.005', 'T1562.004': 'T1686' }[id] ?? id);
    const v = scoreEvalsRound('acme', 'Acme', round([sub('T1070.001', ['Technique']), sub('T1562.004', ['None'])]), { ...opts, remap })!;
    expect(Object.keys(v.techniques).sort()).toEqual(['T1685', 'T1685.005', 'T1686']);
  });

  it('returns null when the vendor was not scored at all', () => {
    expect(scoreEvalsRound('acme', 'Acme', round([sub('T1105', ['N/A'])]), opts)).toBeNull();
  });
});

describe('mergeEvalsIntoKb', () => {
  const evals: EvalsCoverage = {
    schemaVersion: EVALS_SCHEMA_VERSION, generated: '2026-11-02', notice: 'NOTICE',
    method: { detectedTypes: EVALS_DETECTED_TYPES, run: 'Initial Run', shrinkage: 2, minYear: 2023 },
    vendors: {
      crowdstrike: { participant: 'crowdstrike', name: 'CrowdStrike', round: 'er7', roundName: 'Enterprise 2025', year: 2025, substeps: 10, detected: 9,
        techniques: { T1059: { detect: 0.9, n: 3, hits: 3 }, T1105: { detect: 0.8, n: 1, hits: 1 } } },
      acme: { participant: 'acme', name: 'Acme', round: 'er6', roundName: 'Enterprise 2024', year: 2024, substeps: 4, detected: 2,
        techniques: { T1059: { detect: 0.5, n: 2, hits: 1 } } },
    },
  };
  const kb = mergeEvalsIntoKb(COVERAGE_KB, evals);
  const cs = kb.tools[EVALS_TO_KB.crowdstrike];

  it('replaces detection where tested and keeps estimated prevention', () => {
    expect(cs.data_source).toBe('measured');
    expect(cs.measured?.roundName).toBe('Enterprise 2025');
    expect(cs.techniques.T1059).toEqual({ detect: 0.9, prevent: COVERAGE_KB.tools['crowdstrike-falcon'].techniques.T1059.prevent, source: 'evals', n: 3 });
    expect(cs.techniques.T1105).toMatchObject({ detect: 0.8, prevent: 0, source: 'evals' });
    expect(cs.techniques.T1486).toEqual(COVERAGE_KB.tools['crowdstrike-falcon'].techniques.T1486); // untested: estimate
  });

  it('lets a measured parent override an estimated sub-technique', () => {
    const est = COVERAGE_KB.tools['crowdstrike-falcon'].techniques['T1059.001'];
    expect(cs.techniques['T1059.001']).toEqual({ detect: 0.9, prevent: est.prevent, source: 'evals', n: 3 });
  });

  it('adds evaluated vendors the KB lacks as detection-only EDR', () => {
    expect(kb.tools['evals-acme']).toMatchObject({ display_name: 'Acme', category: 'edr', techniques: { T1059: { detect: 0.5, prevent: 0 } } });
    expect(kb.metadata.sources).toContain('NOTICE');
    expect(COVERAGE_KB.tools['evals-acme']).toBeUndefined(); // input untouched
  });

  it('marks measured sources in the environment assessment', () => {
    const a = assessEnvironment({ infrastructure: [], securityTools: ['crowdstrike-falcon'] }, kb,
      [{ id: 'T1059.001', name: 'PowerShell', tactic: 'TA0002', tactics: ['TA0002'], platforms: [], parentId: 'T1059' }]);
    expect(a['T1059.001'].sources[0].measured).toEqual({ roundName: 'Enterprise 2025', year: 2025, substeps: 3 });
  });
});

const built = 'public' + EVALS_COVERAGE_URL;
describe.skipIf(!existsSync(built))('generated evals-coverage.json', () => {
  const data = existsSync(built) ? JSON.parse(readFileSync(built, 'utf8')) as EvalsCoverage : null;
  const ent = JSON.parse(readFileSync('public/data/enterprise-attack-19.0.json', 'utf8')) as { techniques: { id: string }[] };

  it('is current and only uses ATT&CK v19 technique IDs', () => {
    expect(data!.schemaVersion).toBe(EVALS_SCHEMA_VERSION);
    const ids = new Set(ent.techniques.map(t => t.id));
    for (const v of Object.values(data!.vendors)) {
      expect(v.year).toBeGreaterThanOrEqual(data!.method.minYear);
      for (const [tid, s] of Object.entries(v.techniques)) {
        expect(ids.has(tid), v.participant + ' ' + tid).toBe(true);
        expect(s.detect).toBeGreaterThanOrEqual(0); expect(s.detect).toBeLessThanOrEqual(1);
        expect(s.hits).toBeLessThanOrEqual(s.n);
      }
    }
  });
});
