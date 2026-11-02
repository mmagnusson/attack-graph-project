// A hand-built STIX bundle exercising every parser path: multi-tactic and
// sub-techniques, revoked objects, direct vs software-mediated use, campaigns,
// non-actionable mitigations, and the v18+ detection model.

import type { StixBundle } from '../../src/engine/stixParser';

const ref = (id: string, src = 'mitre-attack') => [{ source_name: src, external_id: id }];
const phases = (...names: string[]) => names.map(n => ({ kill_chain_name: 'mitre-attack', phase_name: n }));
let rel = 0;
const r = (type: string, source: string, target: string, description?: string) =>
  ({ type: 'relationship', id: 'relationship--' + (++rel), relationship_type: type, source_ref: source, target_ref: target, description });

export const MINI_BUNDLE: StixBundle = {
  objects: [
    { type: 'attack-pattern', id: 'ap--phish', name: 'Phishing', external_references: ref('T1566'), kill_chain_phases: phases('initial-access'), x_mitre_platforms: ['Windows'] },
    { type: 'attack-pattern', id: 'ap--exploit', name: 'Exploit Public-Facing Application', external_references: ref('T1190'), kill_chain_phases: phases('initial-access') },
    { type: 'attack-pattern', id: 'ap--valid', name: 'Valid Accounts', external_references: ref('T1078'), kill_chain_phases: phases('stealth', 'persistence', 'privilege-escalation', 'initial-access') },
    { type: 'attack-pattern', id: 'ap--csi', name: 'Command and Scripting Interpreter', external_references: ref('T1059'), kill_chain_phases: phases('execution'),
      description: 'Adversaries may abuse <code>cmd</code> interpreters.(Citation: Some Report) See [PowerShell](https://attack.mitre.org/techniques/T1059/001).' },
    { type: 'attack-pattern', id: 'ap--ps', name: 'PowerShell', external_references: ref('T1059.001'), kill_chain_phases: phases('execution'), x_mitre_platforms: ['Windows'] },
    { type: 'attack-pattern', id: 'ap--user', name: 'User Execution', external_references: ref('T1204'), kill_chain_phases: phases('execution') },
    { type: 'attack-pattern', id: 'ap--alp', name: 'Application Layer Protocol', external_references: ref('T1071'), kill_chain_phases: phases('command-and-control') },
    { type: 'attack-pattern', id: 'ap--itt', name: 'Ingress Tool Transfer', external_references: ref('T1105'), kill_chain_phases: phases('command-and-control') },
    { type: 'attack-pattern', id: 'ap--exfil', name: 'Exfiltration Over C2 Channel', external_references: ref('T1041'), kill_chain_phases: phases('exfiltration') },
    { type: 'attack-pattern', id: 'ap--revoked', name: 'Old Technique', revoked: true, external_references: ref('T9999'), kill_chain_phases: phases('execution') },

    { type: 'intrusion-set', id: 'is--alpha', name: 'Alpha Group', aliases: ['Alpha Group', 'AlphaCat'], first_seen: '2015-01-01T00:00:00Z',
      external_references: ref('G0001'),
      description: 'Alpha Group is a Chinese state-sponsored espionage group that has targeted government and financial organizations.' },
    { type: 'intrusion-set', id: 'is--beta', name: 'Beta', external_references: ref('G0002'), description: 'A small group.' },
    { type: 'campaign', id: 'campaign--gamma', name: 'Operation Gamma', external_references: ref('C0001'), description: 'A campaign against energy utilities.' },
    { type: 'malware', id: 'malware--s1', name: 'AlphaRAT', external_references: ref('S0001') },
    { type: 'malware', id: 'malware--dead', name: 'DeadRAT', revoked: true, external_references: ref('S0002') },

    r('uses', 'is--alpha', 'ap--phish', 'Alpha Group sent spearphishing emails.(Citation: X)'),
    r('uses', 'is--alpha', 'ap--ps'),
    r('uses', 'is--alpha', 'ap--alp'),
    r('uses', 'is--alpha', 'ap--exfil'),
    r('uses', 'is--alpha', 'malware--s1'),
    r('uses', 'is--alpha', 'malware--dead'),
    r('uses', 'malware--s1', 'ap--itt'),
    r('uses', 'malware--s1', 'ap--user'),
    r('uses', 'malware--dead', 'ap--valid'),
    r('uses', 'is--beta', 'ap--phish'),
    r('uses', 'is--beta', 'ap--csi'),
    r('uses', 'campaign--gamma', 'ap--exploit'),
    r('uses', 'campaign--gamma', 'ap--csi'),
    r('uses', 'campaign--gamma', 'ap--itt'),
    r('uses', 'campaign--gamma', 'ap--exfil'),
    r('attributed-to', 'campaign--gamma', 'is--alpha'),

    { type: 'course-of-action', id: 'coa--av', name: 'Antivirus/Antimalware', external_references: ref('M1049') },
    { type: 'course-of-action', id: 'coa--nips', name: 'Network Intrusion Prevention', external_references: ref('M1031') },
    { type: 'course-of-action', id: 'coa--pre', name: 'Pre-compromise', external_references: ref('M1056') },
    { type: 'course-of-action', id: 'coa--old', name: 'Old Mitigation', revoked: true, external_references: ref('M1099') },
    { type: 'course-of-action', id: 'coa--legacy', name: 'T1059 legacy mitigation', external_references: ref('T1059') },
    r('mitigates', 'coa--av', 'ap--csi', 'Scan scripts before execution.'),
    r('mitigates', 'coa--nips', 'ap--alp'),
    r('mitigates', 'coa--nips', 'ap--itt'),
    r('mitigates', 'coa--pre', 'ap--phish'),
    r('mitigates', 'coa--old', 'ap--exfil'),

    { type: 'x-mitre-data-component', id: 'dc--proc', name: 'Process Creation', external_references: ref('DC0032') },
    { type: 'x-mitre-data-component', id: 'dc--flow', name: 'Network Traffic Flow', external_references: ref('DC0078') },
    { type: 'x-mitre-data-component', id: 'dc--content', name: 'Network Traffic Content', external_references: ref('DC0085') },
    { type: 'x-mitre-analytic', id: 'an--1', name: 'Analytic 1', external_references: ref('AN0001'), x_mitre_platforms: ['Windows'],
      x_mitre_log_source_references: [{ x_mitre_data_component_ref: 'dc--proc', name: 'WinEventLog:Security' }] },
    { type: 'x-mitre-analytic', id: 'an--2', name: 'Analytic 2', external_references: ref('AN0002'), x_mitre_platforms: ['Linux'],
      x_mitre_log_source_references: [{ x_mitre_data_component_ref: 'dc--proc' }, { x_mitre_data_component_ref: 'dc--flow' }, { x_mitre_data_component_ref: 'dc--flow' }] },
    { type: 'x-mitre-analytic', id: 'an--3', name: 'Analytic 3', external_references: ref('AN0003'),
      x_mitre_log_source_references: [{ x_mitre_data_component_ref: 'dc--content' }] },
    { type: 'x-mitre-detection-strategy', id: 'det--ps', name: 'Detect PowerShell', external_references: ref('DET0001'), x_mitre_analytic_refs: ['an--1', 'an--2'] },
    { type: 'x-mitre-detection-strategy', id: 'det--alp', name: 'Detect C2 protocols', external_references: ref('DET0002'), x_mitre_analytic_refs: ['an--3'] },
    r('detects', 'det--ps', 'ap--ps'),
    r('detects', 'det--alp', 'ap--alp'),
  ],
};
