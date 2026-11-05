// ─── Environment Assessment (profile × coverage KB) ──────────────────────────
// Turns the ProfileWizard selections into model inputs:
//   • base exposure per technique from infrastructure (only when infra is selected)
//   • estimated tool detection and prevention per technique (complementary product)
//   • actor weights for threat actors of concern
// Parent-technique scores apply to sub-techniques that have no score of their own.

import type {
  AttackChain,
  CoverageKB,
  CoverageSource,
  CoverageTool,
  EnvironmentProfile,
  InfraCategory,
  InfrastructureItem,
  Technique,
  TechniqueAssessment,
  ToolCategory,
  ToolCoverage,
} from '../types';

/** Weight multiplier for threat actors the user marked as being of particular concern */
export const ACTOR_OF_CONCERN_WEIGHT = 3;

/** Base exposure for techniques none of the selected infrastructure exposes */
const DEFAULT_INFRA_EXPOSURE = 0.3;

export function assessEnvironment(
  profile: EnvironmentProfile,
  kb: CoverageKB,
  techniques: Technique[],
): Record<string, TechniqueAssessment> {
  const infra = (profile.infrastructure || []).map(id => kb.infrastructure[id]).filter(Boolean);
  const tools = (profile.securityTools || []).map(id => [id, kb.tools[id]] as const).filter(([, t]) => !!t);
  const out: Record<string, TechniqueAssessment> = {};

  for (const t of techniques) {
    const keys = t.parentId ? [t.id, t.parentId] : [t.id];
    const lookup = <V,>(rec: Record<string, V>): V | undefined => {
      for (const k of keys) if (rec[k] !== undefined) return rec[k];
      return undefined;
    };

    let baseExposure = 1;
    if (infra.length > 0) {
      baseExposure = DEFAULT_INFRA_EXPOSURE;
      for (const item of infra) baseExposure = Math.max(baseExposure, lookup(item.exposes) ?? 0);
    }

    let missDetect = 1;
    let missPrevent = 1;
    const sources: CoverageSource[] = [];
    for (const [toolId, tool] of tools) {
      const s = lookup(tool.techniques);
      if (!s) continue;
      missDetect *= 1 - (s.detect || 0);
      missPrevent *= 1 - (s.prevent || 0);
      const measured = s.source === 'evals' && tool.measured
        ? { roundName: tool.measured.roundName, year: tool.measured.year, substeps: s.n ?? 0 }
        : undefined;
      sources.push({ toolId, name: tool.display_name, detect: s.detect || 0, prevent: s.prevent || 0, measured });
    }
    out[t.id] = { baseExposure, detect: 1 - missDetect, prevent: 1 - missPrevent, sources };
  }
  return out;
}

/** Split an assessment into the risk model's exposure and tool-coverage inputs */
export function assessmentToModelInputs(assessment: Record<string, TechniqueAssessment> | null, hasInfra: boolean): {
  exposure?: Record<string, number>;
  toolCoverage?: Record<string, ToolCoverage>;
} {
  if (!assessment) return {};
  const toolCoverage: Record<string, ToolCoverage> = {};
  const exposure: Record<string, number> = {};
  for (const [tid, a] of Object.entries(assessment)) {
    if (a.sources.length > 0) toolCoverage[tid] = { detect: a.detect, prevent: a.prevent };
    exposure[tid] = a.baseExposure;
  }
  return { exposure: hasInfra ? exposure : undefined, toolCoverage };
}

/** chainId → weight; actors of concern (matched by name) are weighted up */
export function actorWeightsFor(profile: EnvironmentProfile | null, chains: AttackChain[]): Record<string, number> {
  const concern = new Set(profile?.threatActors || []);
  const w: Record<string, number> = {};
  for (const c of chains) w[c.id] = concern.has(c.name) ? ACTOR_OF_CONCERN_WEIGHT : 1;
  return w;
}

// ─── Wizard helpers ───────────────────────────────────────────────────────────

export interface GroupedTool extends CoverageTool { id: string }
export interface GroupedInfra extends InfrastructureItem { id: string }
export interface GroupedToolCategory extends ToolCategory { tools: GroupedTool[] }
export interface GroupedInfraCategory extends InfraCategory { items: GroupedInfra[] }

/** Get all tool IDs from KB grouped by category */
export function getKBToolsByCategory(coverageKB: CoverageKB): Record<string, GroupedToolCategory> {
  const grouped: Record<string, GroupedToolCategory> = {};
  for (const cat of coverageKB.toolCategories) grouped[cat.id] = { ...cat, tools: [] };
  for (const [id, tool] of Object.entries(coverageKB.tools)) {
    const cat = tool.category;
    if (!grouped[cat]) grouped[cat] = { id: cat, name: cat, icon: '?', tools: [] };
    grouped[cat].tools.push({ id, ...tool });
  }
  return grouped;
}

/** Get all infra IDs from KB grouped by category */
export function getKBInfraByCategory(coverageKB: CoverageKB): Record<string, GroupedInfraCategory> {
  const grouped: Record<string, GroupedInfraCategory> = {};
  for (const cat of coverageKB.infraCategories) grouped[cat.id] = { ...cat, items: [] };
  for (const [id, infra] of Object.entries(coverageKB.infrastructure)) {
    const cat = infra.category;
    if (!grouped[cat]) grouped[cat] = { id: cat, name: cat, icon: '?', items: [] };
    grouped[cat].items.push({ id, ...infra });
  }
  return grouped;
}
