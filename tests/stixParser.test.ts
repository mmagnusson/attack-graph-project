import { describe, expect, it } from 'vitest';
import { cleanDescription, detectFramework, parseStixBundle, PARSER_VERSION } from '../src/engine/stixParser';
import { tagCountry, tagSectors } from '../src/engine/actorTags';
import { getFrameworkConfig } from '../src/data/frameworkConfig';
import { MINI_BUNDLE } from './fixtures/miniBundle';

const cfg = getFrameworkConfig('enterprise');
const ds = parseStixBundle(MINI_BUNDLE, cfg, 'test');
const tech = (id: string) => ds.techniques.find(t => t.id === id)!;
const chain = (id: string) => ds.chains.find(c => c.id === id);

describe('parseStixBundle — techniques', () => {
  it('skips revoked techniques and stamps the parser version', () => {
    expect(ds.techniques.map(t => t.id)).not.toContain('T9999');
    expect(ds.techniques).toHaveLength(9);
    expect(ds.schemaVersion).toBe(PARSER_VERSION);
  });

  it('keeps every tactic of a multi-tactic technique, primary = earliest phase', () => {
    const valid = tech('T1078');
    expect(valid.tactic).toBe('TA0001');
    expect(valid.tactics).toEqual(['TA0001', 'TA0003', 'TA0004', 'TA0005']);
  });

  it('links sub-techniques to parents and keeps platforms', () => {
    expect(tech('T1059.001').parentId).toBe('T1059');
    expect(tech('T1059').parentId).toBeUndefined();
    expect(tech('T1059.001').platforms).toEqual(['Windows']);
  });

  it('cleans citations, markdown links and inline HTML from descriptions', () => {
    expect(tech('T1059').description).toBe('Adversaries may abuse cmd interpreters. See PowerShell.');
    expect(cleanDescription('a '.repeat(50), 20).endsWith('…')).toBe(true);
  });
});

describe('parseStixBundle — adversaries', () => {
  it('adds techniques used through live software and marks them', () => {
    const alpha = chain('G0001')!;
    expect(alpha.path).toEqual(['T1566', 'T1059.001', 'T1204', 'T1071', 'T1105', 'T1041']);
    expect(alpha.viaSoftware).toEqual(['T1204', 'T1105']);
    // Valid Accounts only reachable through revoked software → excluded
    expect(alpha.path).not.toContain('T1078');
  });

  it('drops actors with fewer than 4 techniques or 3 phases', () => {
    expect(chain('G0002')).toBeUndefined();
  });

  it('includes campaigns with attribution', () => {
    const gamma = chain('C0001')!;
    expect(gamma.kind).toBe('campaign');
    expect(gamma.attributedTo).toBe('Alpha Group');
    expect(gamma.sectors).toContain('energy');
  });

  it('derives sectors, attribution, aliases and dates', () => {
    const alpha = chain('G0001')!;
    expect(alpha.sectors).toEqual(expect.arrayContaining(['government', 'financial']));
    expect(alpha.country).toBe('China');
    expect(alpha.aliases).toEqual(['AlphaCat']);
    expect(alpha.firstSeen).toBe('2015');
  });

  it('records procedure notes only for kept actors', () => {
    expect(ds.usageNotes.G0001.T1566).toBe('Alpha Group sent spearphishing emails.');
    expect(ds.usageNotes.G0002).toBeUndefined();
  });
});

describe('parseStixBundle — mitigations and detection', () => {
  it('parses M-series mitigations and flags non-actionable ones', () => {
    expect(ds.mitigations.map(m => m.id)).toEqual(['M1031', 'M1049', 'M1056']);
    expect(ds.mitigations.find(m => m.id === 'M1056')!.actionable).toBe(false);
    expect(ds.mitigations.find(m => m.id === 'M1031')!.techniques).toEqual(['T1071', 'T1105']);
    expect(ds.mitigationNotes.T1059.M1049).toBe('Scan scripts before execution.');
  });

  it('resolves detection strategies to analytics and data component IDs', () => {
    const det = ds.detections['T1059.001'];
    expect(det.id).toBe('DET0001');
    expect(det.analytics.map(a => a.id)).toEqual(['AN0001', 'AN0002']);
    expect(det.analytics[1].dataComponents).toEqual(['DC0032', 'DC0078']);
    expect(det.analytics[1].platforms).toEqual(['Linux']);
    expect(ds.dataComponents.map(d => d.id).sort()).toEqual(['DC0032', 'DC0078', 'DC0085']);
  });
});

describe('detectFramework', () => {
  it('detects enterprise, ics, or neither', () => {
    expect(detectFramework(MINI_BUNDLE)).toBe('enterprise');
    expect(detectFramework({ objects: [{ type: 'attack-pattern', id: 'x', kill_chain_phases: [{ kill_chain_name: 'mitre-ics-attack', phase_name: 'impact' }] }] })).toBe('ics');
    expect(detectFramework({ objects: [] })).toBeNull();
  });

  it('rejects malformed bundles', () => {
    expect(() => parseStixBundle({} as never, cfg)).toThrow(/missing objects/);
    expect(() => parseStixBundle({ objects: [] }, cfg)).toThrow(/No valid techniques/);
  });
});

describe('actor tags', () => {
  it('tags sectors from prose', () => {
    expect(tagSectors('has targeted hospitals and banks')).toEqual(['financial', 'healthcare']);
    expect(tagSectors('')).toEqual([]);
  });

  it('only attributes on strong phrasing, never on a bare target country', () => {
    expect(tagCountry('APT41 is a threat group that researchers have assessed as Chinese state-sponsored espionage group')).toBe('China');
    expect(tagCountry("Kimsuky is a Democratic People's Republic of Korea (DPRK)-based cyber espionage group")).toBe('North Korea');
    expect(tagCountry('Wizard Spider is a Russia-based financially motivated threat group')).toBe('Russia');
    expect(tagCountry('This group has targeted organizations in China and Russia.')).toBeUndefined();
  });
});
