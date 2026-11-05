// ─── MITRE ATT&CK Evaluations → per-technique detection rates ───────────────
//
// scoreEvalsRound runs at build time (scripts/build-evals-coverage.ts) on one
// vendor's results for one round; mergeEvalsIntoKb runs in the app.
//
// Scoring, per substep of the vendor's results:
//   • skipped  setup substeps, false-positive (noise) tests, and substeps the
//              vendor wasn't scored on (N/A, Not reported, nothing recorded)
//   • detected the Initial Run has a Technique, Tactic or General detection
//              (detections after a configuration change don't count)
//   • missed   otherwise (None, Telemetry only, or only after a config change)
// A technique's rate is shrunk toward the vendor's overall rate, since many
// techniques are tested only once or twice:
//   detect = (hits + k·overall) / (n + k)
// Sub-technique substeps also count toward their parent technique. Technique
// IDs that ATT&CK has since revoked are mapped to their replacements (`remap`).

import type { CoverageKB, CoverageTool, EvalsCoverage, EvalsTechniqueScore, EvalsVendor, ToolTechniqueScore } from '../types';
import { EVALS_TO_KB } from '../data/evalsConfig';

/** The parts of an evals.mitre.org results substep this uses */
export interface RawSubstep {
  Is_Setup?: boolean;
  Noise_Category?: string;
  Technique?: { Technique_Id?: string } | null;
  Subtechnique?: { Subtechnique_Id?: string } | null;
  Detections?: { Detection_Type?: string; Execution_Run_Name?: string }[];
}
export interface RawRound {
  Adversary_Name: string;
  Display_Name: string;
  Evaluation_Year: number;
  Detections_By_Step: Record<string, { Steps?: { Substeps?: RawSubstep[] }[] }>;
}

const INITIAL = 'Initial Run';
const isInitial = (run: string | undefined) => !run || run === INITIAL;

export function scoreEvalsRound(
  participant: string, name: string, round: RawRound,
  opts: { detectedTypes: string[]; shrinkage: number; remap?: (techniqueId: string) => string },
): EvalsVendor | null {
  const detectedTypes = new Set(opts.detectedTypes);
  const remap = opts.remap ?? (id => id);
  const scored: { ids: string[]; hit: boolean }[] = [];

  for (const scenario of Object.values(round.Detections_By_Step ?? {})) {
    for (const step of scenario.Steps ?? []) {
      for (const ss of step.Substeps ?? []) {
        // Protection-test substeps carry Protections instead of Detections
        if (ss.Is_Setup || ss.Noise_Category || !ss.Detections) continue;
        const tech = ss.Technique?.Technique_Id, sub = ss.Subtechnique?.Subtechnique_Id;
        if (!tech) continue;
        const all = ss.Detections.map(d => d.Detection_Type ?? '');
        if (all.length === 0 || all.every(t => t === 'N/A' || t === 'Not reported' || t === '')) continue;
        const initial = ss.Detections.filter(d => isInitial(d.Execution_Run_Name)).map(d => d.Detection_Type ?? '');
        const id = remap(sub && sub !== tech ? sub : tech);
        const parent = id.split('.')[0];
        scored.push({ ids: parent !== id ? [parent, id] : [id], hit: initial.some(t => detectedTypes.has(t)) });
      }
    }
  }
  if (scored.length === 0) return null;

  const detected = scored.filter(s => s.hit).length;
  const overall = detected / scored.length;
  const tally = new Map<string, { n: number; hits: number }>();
  for (const s of scored) for (const id of s.ids) {
    const t = tally.get(id) ?? { n: 0, hits: 0 };
    t.n++; if (s.hit) t.hits++;
    tally.set(id, t);
  }
  const k = opts.shrinkage;
  const techniques: Record<string, EvalsTechniqueScore> = {};
  for (const id of [...tally.keys()].sort()) {
    const { n, hits } = tally.get(id)!;
    techniques[id] = { detect: Math.round(((hits + k * overall) / (n + k)) * 1000) / 1000, n, hits };
  }
  return {
    participant, name, round: round.Adversary_Name, roundName: round.Display_Name, year: round.Evaluation_Year,
    substeps: scored.length, detected,
    techniques,
  };
}

/**
 * Coverage KB with measured detection: products the KB already has keep their
 * estimated prevention, and their detection is replaced wherever MITRE tested the
 * technique (or its parent); other evaluated vendors are added as EDR/XDR with
 * detection only.
 */
export function mergeEvalsIntoKb(kb: CoverageKB, evals: EvalsCoverage): CoverageKB {
  const tools: Record<string, CoverageTool> = { ...kb.tools };
  for (const v of Object.values(evals.vendors)) {
    const id = EVALS_TO_KB[v.participant] ?? 'evals-' + v.participant;
    const base = kb.tools[id];
    const techniques: Record<string, ToolTechniqueScore> = { ...(base?.techniques ?? {}) };
    for (const [tid, s] of Object.entries(v.techniques)) {
      techniques[tid] = { detect: s.detect, prevent: base?.techniques[tid]?.prevent ?? 0, source: 'evals', n: s.n };
    }
    // An estimated sub-technique would shadow its measured parent: use the parent's measurement
    for (const [tid, s] of Object.entries(techniques)) {
      const parent = v.techniques[tid.split('.')[0]];
      if (s.source !== 'evals' && tid.includes('.') && parent) techniques[tid] = { ...s, detect: parent.detect, source: 'evals', n: parent.n };
    }
    const { participant, round, roundName, year, substeps } = v;
    tools[id] = {
      display_name: base?.display_name ?? v.name,
      category: base?.category ?? 'edr',
      data_source: 'measured',
      techniques,
      measured: { participant, round, roundName, year, substeps },
    };
  }
  return {
    ...kb,
    metadata: { ...kb.metadata, sources: [...kb.metadata.sources, evals.notice] },
    tools,
  };
}
