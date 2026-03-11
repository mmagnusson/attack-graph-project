// ─── Exposure Weighting Engine (Environment Profiling — Phase 3) ─────────────
// Computes per-technique exposure scores from an environment profile + coverage KB.
// Profile shape: { infrastructure: string[], securityTools: string[], threatActors?: string[] }
// Returns: Record of techniqueId → TechniqueExposure

import type {
  EnvironmentProfile,
  CoverageKB,
  CoverageTool,
  InfrastructureItem,
  Technique,
  AttackChain,
  CoverageSource,
  TechniqueExposure,
  ToolCategory,
  InfraCategory,
} from '../types';

/** Actor name → Set of technique IDs used by that actor */
export type ActorTechMap = Record<string, Set<string>>;

/** Tool entry enriched with its KB key */
export interface GroupedTool extends CoverageTool {
  id: string;
}

/** Infrastructure entry enriched with its KB key */
export interface GroupedInfra extends InfrastructureItem {
  id: string;
}

/** Tool category with resolved tool entries */
export interface GroupedToolCategory extends ToolCategory {
  tools: GroupedTool[];
}

/** Infrastructure category with resolved infra entries */
export interface GroupedInfraCategory extends InfraCategory {
  items: GroupedInfra[];
}

export function computeExposureScores(
  profile: EnvironmentProfile,
  coverageKB: CoverageKB,
  techniques: Technique[],
  actorTechMap: ActorTechMap | null,
): Record<string, TechniqueExposure> {
  const results: Record<string, TechniqueExposure> = {};
  const techIds = techniques.map(t => t.id);

  // Step 1: Base exposure from infrastructure
  const baseExposure: Record<string, number> = {};
  for (const tid of techIds) {
    let maxExposure = 0.3; // default for platform-relevant techniques
    for (const infraId of (profile.infrastructure || [])) {
      const infra = coverageKB.infrastructure[infraId];
      if (infra && infra.exposes[tid] !== undefined) {
        maxExposure = Math.max(maxExposure, infra.exposes[tid]);
      }
    }
    baseExposure[tid] = maxExposure;
  }

  // Step 2: Coverage reduction from security tools (complementary product)
  const coverage: Record<string, number> = {};
  const coverageSources: Record<string, CoverageSource[]> = {};
  for (const tid of techIds) {
    let missProduct = 1.0; // product of (1 - detect) for each tool
    const sources: CoverageSource[] = [];
    for (const toolId of (profile.securityTools || [])) {
      const tool = coverageKB.tools[toolId];
      if (tool && tool.techniques[tid]) {
        const det = tool.techniques[tid].detect || 0;
        missProduct *= (1 - det);
        sources.push({
          toolId,
          name: tool.display_name,
          detect: det,
          prevent: tool.techniques[tid].prevent || 0,
        });
      }
    }
    coverage[tid] = 1 - missProduct;
    coverageSources[tid] = sources;
  }

  // Step 3: Threat actor overlay (optional)
  const actorWeight: Record<string, number> = {};
  if (profile.threatActors && profile.threatActors.length > 0 && actorTechMap) {
    const totalActors = profile.threatActors.length;
    for (const tid of techIds) {
      let count = 0;
      for (const actorId of profile.threatActors) {
        if (actorTechMap[actorId] && actorTechMap[actorId].has(tid)) count++;
      }
      actorWeight[tid] = 1.0 + (0.5 * count / totalActors);
    }
  }

  // Step 4: Final exposure = base * (1 - coverage) * actorWeight
  for (const tid of techIds) {
    const base = baseExposure[tid];
    const cov = coverage[tid] || 0;
    const aw = actorWeight[tid] || 1.0;
    const finalExposure = Math.min(1.0, base * (1 - cov) * aw);
    results[tid] = {
      baseExposure: base,
      coverageReduction: cov,
      actorWeight: aw,
      finalExposure,
      coverageSources: coverageSources[tid] || [],
    };
  }

  return results;
}

/** Build actor -> technique set map from attack chain data */
export function buildActorTechMap(chains: AttackChain[]): ActorTechMap {
  const m: ActorTechMap = {};
  for (const chain of chains) {
    const actorId = chain.name;
    if (!m[actorId]) m[actorId] = new Set();
    for (const tid of chain.path) m[actorId].add(tid);
  }
  return m;
}

/** Get all tool IDs from KB grouped by category */
export function getKBToolsByCategory(coverageKB: CoverageKB): Record<string, GroupedToolCategory> {
  const grouped: Record<string, GroupedToolCategory> = {};
  for (const cat of coverageKB.toolCategories) {
    grouped[cat.id] = { ...cat, tools: [] };
  }
  for (const [id, tool] of Object.entries(coverageKB.tools)) {
    const cat = tool.category;
    if (grouped[cat]) {
      grouped[cat].tools.push({ id, ...tool });
    } else {
      grouped[cat] = { id: cat, name: cat, icon: '?', tools: [{ id, ...tool }] };
    }
  }
  return grouped;
}

/** Get all infra IDs from KB grouped by category */
export function getKBInfraByCategory(coverageKB: CoverageKB): Record<string, GroupedInfraCategory> {
  const grouped: Record<string, GroupedInfraCategory> = {};
  for (const cat of coverageKB.infraCategories) {
    grouped[cat.id] = { ...cat, items: [] };
  }
  for (const [id, infra] of Object.entries(coverageKB.infrastructure)) {
    const cat = infra.category;
    if (grouped[cat]) {
      grouped[cat].items.push({ id, ...infra });
    } else {
      grouped[cat] = { id: cat, name: cat, icon: '?', items: [{ id, ...infra }] };
    }
  }
  return grouped;
}
