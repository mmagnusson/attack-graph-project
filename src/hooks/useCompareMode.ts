// ─── useCompareMode — side-by-side framework comparison ──────────────────────

import { useState, useEffect, useMemo } from 'react';
import type { AttackDataset, FrameworkId, Technique } from '../types';
import { getFrameworkConfig } from '../data/frameworkConfig';
import { loadAttackData } from '../data/loadAttackData';
import { layoutNodes, buildCooccurrenceEdges, rollupId } from '../engine/graphModel';
import type { NodeMetrics } from '../engine/displayMetrics';

interface UseCompareModeArgs {
  framework: FrameworkId;
  activeTechniques: Technique[];
}

export function useCompareMode({ framework, activeTechniques }: UseCompareModeArgs) {
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<{ fw: FrameworkId; data: AttackDataset } | null>(null);

  const otherFramework: FrameworkId = framework === "enterprise" ? "ics" : "enterprise";
  const otherFwConfig = useMemo(() => getFrameworkConfig(otherFramework), [otherFramework]);

  useEffect(() => {
    if (!compareMode) return;
    const controller = new AbortController();
    loadAttackData(controller.signal, otherFwConfig)
      .then(data => { if (!controller.signal.aborted) setCompareData({ fw: otherFwConfig.id, data }); })
      .catch(() => { /* the read-only pane simply stays empty */ });
    return () => controller.abort();
  }, [compareMode, otherFwConfig]);

  const data = compareMode && compareData?.fw === otherFramework ? compareData.data : null;
  const compareLoading = compareMode && !data;

  // Read-only pane: node size by actor count, no defenses applied
  const compareLayout = useMemo(() => {
    if (!data) return null;
    const techs = data.techniques.filter(t => !t.parentId);
    const display = new Set(techs.map(t => t.id));
    const layout = layoutNodes(techs, otherFwConfig.tactics);
    const groups = data.chains.filter(c => c.kind === 'group');
    const counts: Record<string, Set<string>> = {};
    for (const c of groups) for (const t of c.path) {
      const id = rollupId(t, display);
      if (id) (counts[id] ||= new Set()).add(c.id);
    }
    const maxCount = Math.max(1, ...Object.values(counts).map(s => s.size));
    const metrics: Record<string, NodeMetrics> = {};
    for (const t of techs) {
      const n = counts[t.id]?.size ?? 0;
      metrics[t.id] = { success: 1, detection: 0, activity: n / maxCount, actors: n, mitigations: 0, blocked: false };
    }
    return {
      techniques: techs, edges: buildCooccurrenceEdges(groups, display, otherFwConfig.tacticPhase, 200),
      positions: layout.positions, viewHeight: layout.viewHeight, viewWidth: layout.viewWidth,
      phaseCenters: layout.phaseCenters, metrics,
    };
  }, [data, otherFwConfig]);

  // Shared vs unique technique IDs (potential IT↔OT pivot points)
  const compareAnalysis = useMemo(() => {
    if (!data) return null;
    const currentIds = new Set(activeTechniques.filter(t => !t.parentId).map(t => t.id));
    const otherIds = new Set(data.techniques.filter(t => !t.parentId).map(t => t.id));
    const shared = new Set([...currentIds].filter(id => otherIds.has(id)));
    return {
      currentCount: currentIds.size, otherCount: otherIds.size, shared,
      uniqueCurrent: currentIds.size - shared.size, uniqueOther: otherIds.size - shared.size,
    };
  }, [data, activeTechniques]);

  const resetCompare = () => setCompareMode(false);

  return {
    compareMode, setCompareMode, compareLoading,
    otherFramework, otherFwConfig,
    compareLayout, compareAnalysis,
    resetCompare,
  };
}
