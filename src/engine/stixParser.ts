// ─── STIX Parser & Framework Detection ────────────────────────────────────────
// Turns a MITRE ATT&CK STIX 2.1 bundle into an AttackDataset: techniques (with
// every tactic they serve), adversaries (groups and campaigns, including the
// techniques they use through their software), mitigations, and the v18+
// detection model (strategies → analytics → data components).
//
// Runs at build time (scripts/build-attack-data.ts) for the bundled data, and
// in the browser for user uploads. Bump PARSER_VERSION whenever the output
// shape or semantics change — it is part of every cache key.

import type {
  AttackChain,
  AttackDataset,
  DataComponentDef,
  DetectionStrategyDef,
  FrameworkConfig,
  FrameworkId,
  MitigationDef,
  Technique,
} from '../types';
import { tagCountry, tagSectors } from './actorTags';

export const PARSER_VERSION = 2;

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

interface StixLogSourceRef {
  x_mitre_data_component_ref: string;
  name?: string;
  channel?: string;
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
  x_mitre_analytic_refs?: string[];
  x_mitre_log_source_references?: StixLogSourceRef[];
}

export interface StixBundle {
  objects: StixObject[];
}

/** The slice of FrameworkConfig the parser depends on */
export type ParserConfig = Pick<FrameworkConfig,
  'id' | 'tactics' | 'stixTacticMap' | 'tacticPhase' | 'killChainName' | 'stixSourceName' | 'nonActionableMitigations'
>;

// ─── Text cleanup ─────────────────────────────────────────────────────────────

/** Strip citations, markdown links, and inline HTML from a MITRE description */
export function cleanDescription(text: string | undefined, maxLen: number): string {
  if (!text) return '';
  let s = text
    .replace(/\(Citation:[^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  if (s.length > maxLen) {
    const cut = s.lastIndexOf(' ', maxLen);
    s = s.slice(0, cut > maxLen * 0.6 ? cut : maxLen).trimEnd() + '…';
  }
  return s;
}

// ─── Framework Auto-Detection ─────────────────────────────────────────────────

/** Detects "enterprise" or "ics" from a STIX bundle by inspecting kill chain phases */
export function detectFramework(bundle: StixBundle): FrameworkId | null {
  if (!bundle || !Array.isArray(bundle.objects)) return null;
  let enterprise = false;
  for (const obj of bundle.objects) {
    if (obj.type !== 'attack-pattern' || obj.revoked || obj.x_mitre_deprecated) continue;
    for (const p of obj.kill_chain_phases || []) {
      if (p.kill_chain_name === 'mitre-ics-attack') return 'ics';
      if (p.kill_chain_name === 'mitre-attack') enterprise = true;
    }
  }
  return enterprise ? 'enterprise' : null;
}

// ─── STIX Bundle Parser ──────────────────────────────────────────────────────

const isLive = (o: StixObject) => !o.revoked && !o.x_mitre_deprecated;

/** Parses a STIX bundle into an AttackDataset */
export function parseStixBundle(bundle: StixBundle, cfg: ParserConfig, sourceLabel = 'Uploaded STIX bundle'): AttackDataset {
  if (!bundle || !bundle.objects) throw new Error('Invalid STIX bundle: missing objects array');
  if (!Array.isArray(bundle.objects)) throw new Error('Invalid STIX bundle: objects is not an array');
  if (bundle.objects.length > 200000) throw new Error('STIX bundle too large: ' + bundle.objects.length + ' objects (max 200,000)');

  const byId = new Map<string, StixObject>();
  for (const o of bundle.objects) if (o && typeof o.id === 'string') byId.set(o.id, o);

  const extId = (o: StixObject): string | undefined =>
    (o.external_references || []).find(r => r.source_name === cfg.stixSourceName)?.external_id;

  const tacticOrder = new Map(cfg.tactics.map((t, i) => [t.id, i]));
  const phaseOf = (tacticId: string) => cfg.tacticPhase[tacticId] ?? 99;

  // ── Techniques ──
  const techniques: Technique[] = [];
  const techByStix = new Map<string, string>();
  for (const o of bundle.objects) {
    if (o.type !== 'attack-pattern' || !isLive(o)) continue;
    const id = extId(o);
    if (!id) continue;
    const tactics: string[] = [];
    for (const p of o.kill_chain_phases || []) {
      if (p.kill_chain_name !== cfg.killChainName) continue;
      const t = cfg.stixTacticMap[p.phase_name];
      if (t && !tactics.includes(t)) tactics.push(t);
    }
    if (tactics.length === 0) continue;
    tactics.sort((a, b) => phaseOf(a) - phaseOf(b) || (tacticOrder.get(a) ?? 99) - (tacticOrder.get(b) ?? 99));
    techniques.push({
      id,
      name: o.name || id,
      tactic: tactics[0],
      tactics,
      parentId: id.includes('.') ? id.split('.')[0] : undefined,
      platforms: (o.x_mitre_platforms || []).filter(p => p !== 'None'),
      description: cleanDescription(o.description, 1200),
    });
    techByStix.set(o.id, id);
  }
  if (techniques.length === 0) throw new Error('No valid techniques found in STIX bundle');

  const techPhase = new Map(techniques.map(t => [t.id, phaseOf(t.tactic)]));
  const techTacticRank = new Map(techniques.map(t => [t.id, tacticOrder.get(t.tactic) ?? 99]));
  const byPhase = (a: string, b: string) =>
    (techPhase.get(a)! - techPhase.get(b)!) || (techTacticRank.get(a)! - techTacticRank.get(b)!) || (a < b ? -1 : a > b ? 1 : 0);

  // ── Relationships ──
  const directUses = new Map<string, Set<string>>();     // actor stix id → technique ids
  const softwareUses = new Map<string, Set<string>>();   // actor stix id → software stix ids
  const softwareTechs = new Map<string, Set<string>>();  // software stix id → technique ids
  const usageNotes: Record<string, Record<string, string>> = {};
  const mitigatesRel: StixObject[] = [];
  const detectsRel: StixObject[] = [];
  const attributedTo = new Map<string, string>();        // campaign stix id → group stix id

  const isActor = (o: StixObject | undefined) => !!o && (o.type === 'intrusion-set' || o.type === 'campaign') && isLive(o);
  const isSoftware = (o: StixObject | undefined) => !!o && (o.type === 'malware' || o.type === 'tool') && isLive(o);
  const add = (m: Map<string, Set<string>>, k: string, v: string) => {
    let s = m.get(k);
    if (!s) m.set(k, s = new Set());
    s.add(v);
  };

  for (const r of bundle.objects) {
    if (r.type !== 'relationship' || !isLive(r) || !r.source_ref || !r.target_ref) continue;
    const src = byId.get(r.source_ref);
    const tgt = byId.get(r.target_ref);
    if (r.relationship_type === 'uses') {
      const tid = techByStix.get(r.target_ref);
      if (isActor(src) && tid) {
        add(directUses, r.source_ref, tid);
        const actorId = extId(src!);
        if (actorId && r.description) {
          (usageNotes[actorId] ||= {})[tid] = cleanDescription(r.description, 400);
        }
      } else if (isActor(src) && isSoftware(tgt)) {
        add(softwareUses, r.source_ref, r.target_ref);
      } else if (isSoftware(src) && tid) {
        add(softwareTechs, r.source_ref, tid);
      }
    } else if (r.relationship_type === 'mitigates') {
      mitigatesRel.push(r);
    } else if (r.relationship_type === 'detects') {
      detectsRel.push(r);
    } else if (r.relationship_type === 'attributed-to' && src?.type === 'campaign' && tgt?.type === 'intrusion-set') {
      attributedTo.set(r.source_ref, r.target_ref);
    }
  }

  // ── Adversaries (groups + campaigns) ──
  const chains: AttackChain[] = [];
  for (const o of bundle.objects) {
    if (!isActor(o)) continue;
    const id = extId(o);
    if (!id) continue;
    const direct = directUses.get(o.id) || new Set<string>();
    const all = new Set(direct);
    for (const sw of softwareUses.get(o.id) || []) {
      for (const t of softwareTechs.get(sw) || []) all.add(t);
    }
    const path = [...all].sort(byPhase);
    const phases = new Set(path.map(t => techPhase.get(t)));
    if (path.length < 4 || phases.size < 3) continue;
    const description = cleanDescription(o.description, 600);
    const group = attributedTo.get(o.id);
    chains.push({
      id,
      name: o.name || id,
      kind: o.type === 'campaign' ? 'campaign' : 'group',
      description,
      path,
      viaSoftware: path.filter(t => !direct.has(t)),
      sectors: tagSectors(o.description || ''),
      country: tagCountry(o.description || ''),
      aliases: (o.aliases || []).filter(a => a !== o.name),
      firstSeen: o.first_seen ? o.first_seen.slice(0, 4) : undefined,
      lastSeen: o.last_seen ? o.last_seen.slice(0, 4) : undefined,
      attributedTo: group ? byId.get(group)?.name : undefined,
    });
  }
  chains.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'group' ? -1 : 1));
  const keptActors = new Set(chains.map(c => c.id));
  for (const actorId of Object.keys(usageNotes)) if (!keptActors.has(actorId)) delete usageNotes[actorId];

  // ── Mitigations ──
  const nonActionable = new Set(cfg.nonActionableMitigations);
  const mitById = new Map<string, MitigationDef>();
  for (const o of bundle.objects) {
    if (o.type !== 'course-of-action' || !isLive(o)) continue;
    const id = extId(o);
    if (!id || !/^M\d{4}$/.test(id)) continue;
    mitById.set(o.id, { id, name: o.name || id, description: cleanDescription(o.description, 700), techniques: [], actionable: !nonActionable.has(id) });
  }
  const mitigationNotes: Record<string, Record<string, string>> = {};
  for (const r of mitigatesRel) {
    const m = mitById.get(r.source_ref!);
    const tid = techByStix.get(r.target_ref!);
    if (!m || !tid) continue;
    if (!m.techniques.includes(tid)) m.techniques.push(tid);
    if (r.description) (mitigationNotes[tid] ||= {})[m.id] = cleanDescription(r.description, 500);
  }
  const mitigations = [...mitById.values()]
    .map(m => ({ ...m, techniques: m.techniques.sort(), actionable: m.actionable && m.techniques.length > 0 }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // ── Detection: data components, analytics, strategies ──
  const dataComponents: DataComponentDef[] = [];
  const dcByStix = new Map<string, string>();
  for (const o of bundle.objects) {
    if (o.type !== 'x-mitre-data-component' || !isLive(o)) continue;
    const id = extId(o);
    if (!id) continue;
    dcByStix.set(o.id, id);
    dataComponents.push({ id, name: o.name || id, description: cleanDescription(o.description, 300) });
  }
  dataComponents.sort((a, b) => a.name.localeCompare(b.name));

  const strategies = new Map<string, DetectionStrategyDef>();
  for (const o of bundle.objects) {
    if (o.type !== 'x-mitre-detection-strategy' || !isLive(o)) continue;
    const id = extId(o);
    if (!id) continue;
    const analytics = (o.x_mitre_analytic_refs || [])
      .map(ref => byId.get(ref))
      .filter((a): a is StixObject => !!a && isLive(a))
      .map(a => ({
        id: extId(a) || a.id,
        platforms: (a.x_mitre_platforms || []).filter(p => p !== 'None'),
        dataComponents: [...new Set((a.x_mitre_log_source_references || [])
          .map(l => dcByStix.get(l.x_mitre_data_component_ref))
          .filter((d): d is string => !!d))].sort(),
        description: cleanDescription(a.description, 300),
      }));
    strategies.set(o.id, { id, name: o.name || id, analytics });
  }
  const detections: Record<string, DetectionStrategyDef> = {};
  for (const r of detectsRel) {
    const s = strategies.get(r.source_ref!);
    const tid = techByStix.get(r.target_ref!);
    if (!s || !tid) continue;
    const existing = detections[tid];
    detections[tid] = existing
      ? { ...existing, analytics: [...existing.analytics, ...s.analytics.filter(a => !existing.analytics.some(e => e.id === a.id))] }
      : s;
  }

  return {
    schemaVersion: PARSER_VERSION,
    framework: cfg.id,
    sourceLabel,
    techniques: techniques.sort((a, b) => a.id.localeCompare(b.id)),
    chains,
    mitigations,
    mitigationNotes,
    detections,
    dataComponents,
    usageNotes,
  };
}
