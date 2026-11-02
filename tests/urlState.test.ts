import { describe, expect, it } from 'vitest';
import { decodeHashToState, encodeStateToHash, type ShareableState } from '../src/hooks/useUrlState';
import { buildBoardReport, esc } from '../src/engine/boardReport';
import { DEFAULT_MODEL_PARAMS } from '../src/engine/riskModel';

describe('URL state', () => {
  it('round-trips a full state', () => {
    const s: ShareableState = {
      framework: 'ics', sector: 'energy', budget: 750000, orgSize: 'large', envPreset: 'legacy-scada',
      mitigations: ['M0930', 'M0937'], dataComponents: ['DC0078', 'DC0085'], blocked: ['T0866'],
      chains: ['G1000', 'C0028'], platforms: ['Windows'],
      params: { mitigationEffectiveness: 0.4, detectionEffectiveness: 0.3, responseEffectiveness: 0.7, substitutionRate: 0.2, adversaryAdaptiveness: 0.6 },
      gates: ['TA0108', 'objective'], includeSoftware: false, includeCampaigns: true,
    };
    expect(decodeHashToState('#' + encodeStateToHash(s))).toEqual(s);
  });

  it('omits defaults to keep links short', () => {
    expect(encodeStateToHash({ framework: 'enterprise', sector: 'all', orgSize: 'medium', includeSoftware: true })).toBe('');
  });

  it('drops malformed values instead of trusting them', () => {
    const s = decodeHashToState('#fw=evil&sec=<script>&bud=-5&org=huge&mit=M1031,DROP,M10&dc=DC0001,xx&blk=T1059.001,T1&ch=G0007|<img>&p=0.5,2,0.1,0.5,0.5&sw=maybe');
    expect(s).toEqual({ mitigations: ['M1031'], dataComponents: ['DC0001'], blocked: ['T1059.001'], chains: ['G0007'] });
    expect(decodeHashToState('#')).toBeNull();
    expect(decodeHashToState('#%E0%A4%A')).toBeNull();
  });
});

describe('board report', () => {
  it('escapes every interpolated string', () => {
    expect(esc(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
    const html = buildBoardReport({
      generatedAt: '2026-11-02', frameworkLabel: 'Enterprise', attackVersion: '19.0', dataLabel: '<script>alert(1)</script>',
      scope: { actors: 3, sector: 'all', gates: ['Initial Access'], includeSoftware: true, includeCampaigns: false },
      posture: { mitigations: 1, dataComponents: 2, totalDataComponents: 106 },
      currentResidual: 0.8, planResidual: 0.4, budget: 100000, spend: 90000, sensitivity: { low: 0.3, high: 0.6 },
      plan: [{ id: 'M1031', name: 'Evil <b>name</b>', kind: 'mitigation', cost: 90000, removed: 0.4, residualAfter: 0.4 }],
      frontier: [{ cost: 0, residual: 0.8 }, { cost: 90000, residual: 0.4 }],
      topActors: [{ name: '<img src=x onerror=alert(1)>', kind: 'group', viability: 0.5, sectors: [] }],
      params: DEFAULT_MODEL_PARAMS,
    });
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>name</b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('−50%');
  });
});
