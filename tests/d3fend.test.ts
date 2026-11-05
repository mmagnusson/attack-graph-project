import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { d3fendVocabulary, translateAttackPosture, attackVocabulary, d3fendLinks, d3fendBorrowedFrom } from '../src/engine/defenseVocabulary';
import { compileModel, evaluateModel, DEFAULT_MODEL_PARAMS } from '../src/engine/riskModel';
import { buildCatalog, optimizePortfolio } from '../src/engine/portfolioOptimizer';
import { getFrameworkConfig } from '../src/data/frameworkConfig';
import { D3FEND_BORROWED_LINKS, D3FEND_DATA_URL, D3FEND_SCHEMA_VERSION, D3FEND_TACTIC_ROLES, D3FEND_TIERS, D3FEND_VERSION, TELEMETRY_TO_D3FEND } from '../src/data/d3fendConfig';
import type { AttackDataset, D3fendDataset, DefensePosture } from '../src/types';

const tech = (id: string, tactic = 'TA0002') => ({ id, name: id, tactic, tactics: [tactic], platforms: [] });
const dataset: AttackDataset = {
  schemaVersion: 2, framework: 'enterprise', sourceLabel: 'test',
  techniques: [tech('T0001'), tech('T0002'), tech('T0003')],
  chains: [], mitigations: [], mitigationNotes: {}, detections: {}, dataComponents: [], usageNotes: {},
};
const t = (name: string, base: string, tactic: string) => ({ name, base, tactic, definition: '', iri: name.replace(/\s/g, '') });
const d3: D3fendDataset = {
  schemaVersion: 1, version: 'test', releaseDate: '2026-01-01',
  tactics: Object.entries(D3FEND_TACTIC_ROLES).map(([name, role]) => ({ name, role })),
  bases: [
    { id: 'D3-PH', name: 'Platform Hardening', tactic: 'Harden', definition: '', techniques: ['D3-PH', 'D3-SB'] },
    { id: 'D3-PM', name: 'Platform Monitoring', tactic: 'Detect', definition: '', techniques: ['D3-PM', 'D3-FIM', 'D3-OSM'] },
    { id: 'D3-PE', name: 'Process Eviction', tactic: 'Evict', definition: '', techniques: ['D3-PE'] },
    { id: 'D3-AI', name: 'Asset Inventory', tactic: 'Model', definition: '', techniques: ['D3-AI'] },
  ],
  techniques: {
    'D3-PH': t('Platform Hardening', 'D3-PH', 'Harden'), 'D3-SB': t('Secure Boot', 'D3-PH', 'Harden'),
    'D3-PM': t('Platform Monitoring', 'D3-PM', 'Detect'), 'D3-FIM': t('File Integrity Monitoring', 'D3-PM', 'Detect'), 'D3-OSM': t('OS Monitoring', 'D3-PM', 'Detect'),
    'D3-PE': t('Process Eviction', 'D3-PE', 'Evict'), 'D3-AI': t('Asset Inventory', 'D3-AI', 'Model'),
  },
  attack: {
    T0001: [['D3-SB', 'modifies', 'Boot Sector', 'verifies', 'Boot Sector'], ['D3-FIM', 'executes', 'Script', 'analyzes', 'File'], ['D3-OSM', 'x', 'y', 'monitors', 'OS']],
    T0002: [['D3-PE', 'creates', 'Process', 'terminates', 'Process'], ['D3-AI', 'x', 'y', 'inventories', 'Asset']],
    T9999: [['D3-SB', 'x', 'y', 'z', 'w']],
  },
  mitigations: { M1049: ['D3-SB', 'D3-FIM'] },
};

describe('d3fendVocabulary', () => {
  const v = d3fendVocabulary(dataset, d3);

  it('turns Harden/Isolate bases into preventions mapped through their countermeasures', () => {
    expect(v.preventions.map(p => p.id)).toEqual(['D3-PH']);
    expect(v.preventions[0].techniques).toEqual(['T0001']); // T9999 is not in the dataset
    expect(v.tiers['D3-PH']).toBe(D3FEND_TIERS['D3-PH']);
  });

  it('turns each mapped Detect/Deceive countermeasure into a detection rule', () => {
    expect(v.rules.T0001.map(r => r.components)).toEqual([['D3-FIM'], ['D3-OSM']]);
    expect(v.bundles.map(b => [b.id, b.components])).toEqual([['D3-PM', ['D3-PM', 'D3-FIM', 'D3-OSM']]]);
  });

  it('does not score Evict (response), Model (foundation) or Restore (recovery)', () => {
    expect(v.rules.T0002).toBeUndefined();
    expect(v.preventions.some(p => p.id === 'D3-PE' || p.id === 'D3-AI')).toBe(false);
  });

  it('feeds the risk model: detection share counts deployed countermeasures', () => {
    const model = compileModel({ dataset, vocabulary: v, chains: [], gates: [], includeSoftware: true, platforms: null });
    const s = evaluateModel(model, DEFAULT_MODEL_PARAMS, { prevent: new Set(['D3-PH']), detect: new Set(['D3-FIM']), blocked: new Set() });
    expect(s.ruleCoverage[model.techIndex.get('T0001')!]).toBeCloseTo(0.5, 12);
    expect(s.preventCount[model.techIndex.get('T0001')!]).toBe(1);
  });
});

describe('borrowed D3FEND links', () => {
  const link = (id: string): [string, string, string, string, string] => [id, 'x', 'y', 'z', 'w'];
  const withLinks = (attack: D3fendDataset['attack']): D3fendDataset => ({ ...d3, attack });

  it('fills an unmapped technique from its Enterprise equivalent', () => {
    const ds = withLinks({ 'T1059.001': [link('D3-FIM')] });
    expect(d3fendBorrowedFrom(ds, 'T1701.001')).toBe('T1059.001');
    expect(d3fendLinks(ds)['T1701.001']).toEqual([link('D3-FIM')]);
    expect(d3fendLinks(ds)['T1059.001']).toEqual([link('D3-FIM')]);
  });

  it("never overrides D3FEND's own links, and needs a mapped source", () => {
    const own = withLinks({ 'T1059.001': [link('D3-FIM')], 'T1701.001': [link('D3-OSM')] });
    expect(d3fendBorrowedFrom(own, 'T1701.001')).toBeUndefined();
    expect(d3fendLinks(own)['T1701.001']).toEqual([link('D3-OSM')]);
    expect(d3fendBorrowedFrom(withLinks({}), 'T1701.001')).toBeUndefined();
    expect(d3fendBorrowedFrom(withLinks({ 'T1059.001': [link('D3-FIM')] }), 'T1059.001')).toBeUndefined();
  });
});

describe('translateAttackPosture', () => {
  const cfg = getFrameworkConfig('enterprise');
  it('maps mitigations through the D3FEND crosswalk and telemetry through TELEMETRY_TO_D3FEND', () => {
    const half = cfg.telemetrySources.find(s => s.id === 'ts-netflow')!.dataComponents.slice(0, 2);
    const out = translateAttackPosture({ prevent: ['M1049'], detect: half }, cfg, {
      ...d3, bases: [...d3.bases, { id: 'D3-NTA', name: 'NTA', tactic: 'Detect', definition: '', techniques: ['D3-NTA', 'D3-PCA'] }],
    });
    expect(out.prevent).toEqual(['D3-PH']);                        // Secure Boot → its Harden base
    expect(out.detect).toEqual(['D3-FIM', 'D3-NTA', 'D3-PCA']);   // FIM directly; netflow ≥ half collected → NTA
  });

  it('ignores telemetry sources that are mostly missing', () => {
    const one = cfg.telemetrySources.find(s => s.id === 'ts-endpoint-exec')!.dataComponents.slice(0, 1);
    expect(translateAttackPosture({ prevent: [], detect: one }, cfg, d3).detect).toEqual([]);
  });
});

describe('bundled D3FEND dataset', () => {
  const ds = JSON.parse(readFileSync('public' + D3FEND_DATA_URL, 'utf8')) as D3fendDataset;
  const ent = JSON.parse(readFileSync('public' + getFrameworkConfig('enterprise').dataUrl, 'utf8')) as AttackDataset;

  it('matches the pinned version and schema', () => {
    expect(ds.version).toBe(D3FEND_VERSION);
    expect(ds.schemaVersion).toBe(D3FEND_SCHEMA_VERSION);
    expect(ds.bases).toHaveLength(30);
  });

  it('is internally consistent', () => {
    for (const b of ds.bases) {
      expect(D3FEND_TACTIC_ROLES[b.tactic], b.tactic).toBeDefined();
      b.techniques.forEach(id => expect(ds.techniques[id]?.base, id).toBe(b.id));
    }
    for (const links of Object.values(ds.attack)) links.forEach(([id]) => expect(ds.techniques[id], id).toBeDefined());
    for (const ids of Object.values(ds.mitigations)) ids.forEach(id => expect(ds.techniques[id], id).toBeDefined());
    for (const t of Object.values(ds.techniques)) expect(t.iri).not.toBe('');
  });

  it('stores the tactic roles the model uses', () => {
    expect(ds.tactics).toEqual(Object.entries(D3FEND_TACTIC_ROLES).map(([name, role]) => ({ name, role })));
  });

  it('borrows only for same-named ICS techniques that D3FEND has not mapped', () => {
    // Fails once D3FEND maps one of them itself: drop that entry from D3FEND_BORROWED_LINKS
    const ics = JSON.parse(readFileSync('public' + getFrameworkConfig('ics').dataUrl, 'utf8')) as AttackDataset;
    const icsName = new Map(ics.techniques.map(t => [t.id, t.name])), entName = new Map(ent.techniques.map(t => [t.id, t.name]));
    for (const [tid, src] of Object.entries(D3FEND_BORROWED_LINKS)) {
      expect(icsName.get(tid), tid).toBeDefined();
      expect(icsName.get(tid), tid).toBe(entName.get(src));
      expect(ds.attack[tid], tid + ' is now mapped by D3FEND').toBeUndefined();
      expect(ds.attack[src]?.length, src).toBeGreaterThan(0);
      expect(d3fendBorrowedFrom(ds, tid)).toBe(src);
    }
    const v = d3fendVocabulary(ics, ds);
    expect(v.rules['T1701.001']?.length).toBeGreaterThan(0);
    expect(v.preventions.some(p => p.techniques.includes('T1701.001'))).toBe(true);
    expect(d3fendVocabulary(ent, ds).rules['T1701.001']).toBeUndefined();
  });

  it('has a cost tier for exactly the scored bases', () => {
    const scored = ds.bases.filter(b => ['prevent', 'detect'].includes(D3FEND_TACTIC_ROLES[b.tactic])).map(b => b.id).sort();
    expect(Object.keys(D3FEND_TIERS).sort()).toEqual(scored);
  });

  it('translates every telemetry source to real D3FEND detection bases', () => {
    const detectBases = new Set(ds.bases.filter(b => D3FEND_TACTIC_ROLES[b.tactic] === 'detect').map(b => b.id));
    for (const fw of ['enterprise', 'ics'] as const) {
      for (const ts of getFrameworkConfig(fw).telemetrySources) {
        expect(TELEMETRY_TO_D3FEND[ts.id], ts.id).toBeDefined();
        TELEMETRY_TO_D3FEND[ts.id].forEach(b => expect(detectBases.has(b), ts.id + ' → ' + b).toBe(true));
      }
    }
  });

  it('contains known mappings', () => {
    expect(ds.attack['T1059.001'].map(l => l[0])).toContain('D3-FIM');
    expect(ds.mitigations.M1031).toEqual(['D3-ITF', 'D3-NTA', 'D3-OTF']);
    expect(ds.mitigations.M1032).toEqual(['D3-MFA']);
  });

  it('gives plans in the same range as the ATT&CK vocabulary', () => {
    const cfg = getFrameworkConfig('enterprise');
    const gates = cfg.gateOptions.filter(g => cfg.defaultGates.includes(g.id));
    const chains = ent.chains.filter(c => c.kind === 'group');
    const none: DefensePosture = { prevent: new Set(), detect: new Set(), blocked: new Set() };
    const residual = (vocab: ReturnType<typeof attackVocabulary>) => {
      const m = compileModel({ dataset: ent, vocabulary: vocab, chains, gates, includeSoftware: true, platforms: null });
      const plan = optimizePortfolio(m, DEFAULT_MODEL_PARAMS, none, buildCatalog(vocab, none, { orgSize: 'medium', overrides: {} }), { budget: 500_000 });
      plan.steps.forEach((s, i) => expect(s.risk).toBeLessThanOrEqual(i === 0 ? plan.baselineRisk : plan.steps[i - 1].risk));
      return plan.finalRisk / plan.totalWeight;
    };
    const a = residual(attackVocabulary(ent, cfg)), d = residual(d3fendVocabulary(ent, ds));
    expect(Math.abs(a - d)).toBeLessThan(0.15);
  });
});
