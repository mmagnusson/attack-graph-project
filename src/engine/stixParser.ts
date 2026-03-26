// ─── STIX Parser & Framework Detection ────────────────────────────────────────

import type {
  FrameworkConfig,
  FrameworkId,
  Technique,
  Edge,
  AttackChain,
  Mitigation,
  ChainProfile,
} from '../types';

// ─── STIX Bundle Types (used only by the parser) ─────────────────────────────

interface StixExternalReference {
  source_name: string;
  external_id?: string;
  url?: string;
}

interface StixKillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

interface StixObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  revoked?: boolean;
  x_mitre_deprecated?: boolean;
  x_mitre_platforms?: string[];
  external_references?: StixExternalReference[];
  kill_chain_phases?: StixKillChainPhase[];
  relationship_type?: string;
  source_ref?: string;
  target_ref?: string;
  aliases?: string[];
  first_seen?: string;
  last_seen?: string;
}

export interface StixBundle {
  objects: StixObject[];
}

// ─── Parsed Result Type ──────────────────────────────────────────────────────

export interface ParsedStixData {
  techniques: Technique[];
  edges: Edge[];
  chains: AttackChain[];
  techniqueDescriptions: Record<string, string>;
  chainTechContext: Record<string, Record<string, string>>;
  techniquePlatforms: Record<string, string[]>;
  mitigations: Record<string, Mitigation[]>;
  groupProfiles: Record<string, ChainProfile>;
}

// ─── Framework Auto-Detection ─────────────────────────────────────────────────

/** Detects "enterprise" or "ics" from a STIX bundle by inspecting kill chain phases */
export function detectFramework(bundle: StixBundle): FrameworkId | null {
  if (!bundle || !bundle.objects) return null;
  for (const obj of bundle.objects) {
    if (obj.type !== 'attack-pattern' || obj.revoked || obj.x_mitre_deprecated) continue;
    const phases = obj.kill_chain_phases || [];
    for (const p of phases) {
      if (p.kill_chain_name === 'mitre-ics-attack') return 'ics';
    }
  }
  // Check if any enterprise kill chain found
  for (const obj of bundle.objects) {
    if (obj.type !== 'attack-pattern' || obj.revoked || obj.x_mitre_deprecated) continue;
    const phases = obj.kill_chain_phases || [];
    for (const p of phases) {
      if (p.kill_chain_name === 'mitre-attack') return 'enterprise';
    }
  }
  return null;
}

// ─── STIX Bundle Parser ──────────────────────────────────────────────────────

/** Parses a STIX bundle into techniques, edges, chains, platforms, mitigations, and group profiles */
export function parseStixBundle(bundle: StixBundle, fwConfig: FrameworkConfig): ParsedStixData {
  if (!bundle || !bundle.objects) throw new Error('Invalid STIX bundle: missing objects array');
  if (!Array.isArray(bundle.objects)) throw new Error('Invalid STIX bundle: objects is not an array');
  if (bundle.objects.length > 200000) throw new Error('STIX bundle too large: ' + bundle.objects.length + ' objects (max 200,000)');

  const techniques: Technique[] = [];
  const techById: Record<string, string> = {};
  const techniqueDescriptions: Record<string, string> = {};
  const techniquePlatforms: Record<string, string[]> = {};
  const stixObjById: Record<string, StixObject> = {};

  bundle.objects.forEach(o => {
    if (o.type === 'course-of-action' && !o.revoked) stixObjById[o.id] = o;
    if (o.type !== 'attack-pattern') return;
    if (o.revoked || o.x_mitre_deprecated) return;
    const extRefs = o.external_references || [];
    const mitreRef = extRefs.find(r => r.source_name === fwConfig.stixSourceName);
    if (!mitreRef || !mitreRef.external_id) return;
    const techId = mitreRef.external_id;
    const parentId = techId.includes('.') ? techId.split('.')[0] : undefined;
    const phases = o.kill_chain_phases || [];
    const phase = phases.find(p => p.kill_chain_name === fwConfig.killChainName);
    if (!phase) return;
    const tacticId = fwConfig.stixTacticMap[phase.phase_name];
    if (!tacticId) return;
    techniques.push({ id: techId, name: o.name || techId, tactic: tacticId, baseCriticality: 0.5, parentId });
    techById[o.id] = techId;
    stixObjById[o.id] = o;

    // F2: extract platforms, normalize cloud variants to "Cloud" (enterprise only)
    if (o.x_mitre_platforms && o.x_mitre_platforms.length > 0) {
      if (fwConfig.killChainName === 'mitre-attack') {
        const cloudNames = new Set(['IaaS', 'Azure AD', 'Office 365', 'Google Workspace', 'SaaS']);
        const normalized = [...new Set(o.x_mitre_platforms.map(p => cloudNames.has(p) ? (p === 'SaaS' ? 'SaaS' : 'Cloud') : p))];
        techniquePlatforms[techId] = normalized;
      } else {
        techniquePlatforms[techId] = [...o.x_mitre_platforms];
      }
    }
    if (o.description) {
      const cleaned = o.description.replace(/\(Citation:[^)]+\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      techniqueDescriptions[techId] = cleaned;
    }
  });

  if (techniques.length === 0) throw new Error('No valid techniques found in STIX bundle');

  const groupTechniques: Record<string, string[]> = {};
  const groupNames: Record<string, string> = {};
  const groupProfiles: Record<string, ChainProfile> = {};

  bundle.objects.forEach(o => {
    if (o.type === 'intrusion-set' && !o.revoked) {
      const name = o.name || o.id;
      groupNames[o.id] = name;
      groupProfiles[name] = {
        country: '',
        aliases: o.aliases || [],
        firstSeen: o.first_seen ? o.first_seen.slice(0, 4) : '',
        lastSeen: o.last_seen ? o.last_seen.slice(0, 4) : '',
        sectors: [],
        description: o.description
          ? o.description.replace(/\(Citation:[^)]+\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim().slice(0, 300)
          : '',
      };
    }
  });

  const chainTechContext: Record<string, Record<string, string>> = {};
  bundle.objects.forEach(o => {
    if (o.type !== 'relationship' || o.relationship_type !== 'uses') return;
    if (o.revoked) return;
    if (!o.source_ref || !o.target_ref) return;
    if (!groupNames[o.source_ref] || !techById[o.target_ref]) return;
    if (!groupTechniques[o.source_ref]) groupTechniques[o.source_ref] = [];
    groupTechniques[o.source_ref].push(techById[o.target_ref]);
    if (o.description) {
      const gn = groupNames[o.source_ref];
      const tid = techById[o.target_ref];
      if (!chainTechContext[gn]) chainTechContext[gn] = {};
      const cleaned = o.description.replace(/\(Citation:[^)]+\)/g, '').trim();
      chainTechContext[gn][tid] = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
  });

  // F3: Parse mitigations from course-of-action + mitigates relationships
  const mitigationMap: Record<string, Mitigation[]> = {};
  bundle.objects.forEach(o => {
    if (o.type !== 'relationship' || o.relationship_type !== 'mitigates') return;
    if (o.revoked) return;
    if (!o.source_ref || !o.target_ref) return;
    const coaObj = stixObjById[o.source_ref];
    const techStixId = techById[o.target_ref];
    if (!coaObj || !techStixId) return;
    const coaRefs = coaObj.external_references || [];
    const coaMitre = coaRefs.find(r => r.source_name === fwConfig.stixSourceName);
    if (!mitigationMap[techStixId]) mitigationMap[techStixId] = [];
    const relDesc = o.description
      ? o.description.replace(/\(Citation:[^)]+\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
      : null;
    const coaDesc = coaObj.description
      ? coaObj.description.replace(/\(Citation:[^)]+\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
      : null;
    mitigationMap[techStixId].push({
      mitreId: coaMitre?.external_id || coaObj.id,
      name: coaObj.name || coaObj.id,
      description: relDesc || coaDesc || undefined,
    });
  });

  const usageCount: Record<string, number> = {};
  techniques.forEach(t => { usageCount[t.id] = 0; });
  Object.values(groupTechniques).forEach(techs => {
    techs.forEach(tid => { if (usageCount[tid] !== undefined) usageCount[tid]++; });
  });
  const maxUsage = Math.max(...Object.values(usageCount), 1);
  techniques.forEach(t => {
    t.baseCriticality = Math.max(0.1, (usageCount[t.id] || 0) / maxUsage);
  });

  const techPhase: Record<string, number> = {};
  techniques.forEach(t => { techPhase[t.id] = fwConfig.tacticPhase[t.tactic] ?? 99; });
  const techSet = new Set(techniques.map(t => t.id));
  const chains: AttackChain[] = [];
  Object.entries(groupTechniques).forEach(([groupId, techs]) => {
    const uniqueTechs = [...new Set(techs)].filter(t => techSet.has(t));
    const sorted = uniqueTechs.sort((a, b) => (techPhase[a] ?? 99) - (techPhase[b] ?? 99));
    const phases = new Set(sorted.map(t => techPhase[t]));
    if (sorted.length >= 4 && phases.size >= 3) {
      const sev = Math.min(1, sorted.length / 15 + phases.size / 12);
      chains.push({
        name: groupNames[groupId] || groupId,
        description: 'Threat actor with ' + sorted.length + ' techniques across ' + phases.size + ' phases',
        sector: 'all',
        path: sorted,
        severity: Math.round(sev * 100) / 100,
      });
    }
  });

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];
  chains.forEach(chain => {
    for (let i = 0; i < chain.path.length - 1; i++) {
      const key = chain.path[i] + '->' + chain.path[i + 1];
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ from: chain.path[i], to: chain.path[i + 1] });
      }
    }
  });

  return { techniques, edges, chains, techniqueDescriptions, chainTechContext, techniquePlatforms, mitigations: mitigationMap, groupProfiles };
}
