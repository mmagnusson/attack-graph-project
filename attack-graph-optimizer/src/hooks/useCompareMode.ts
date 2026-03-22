// ─── useCompareMode — side-by-side framework comparison ──────────────────────

import { useState, useEffect, useMemo } from 'react';
import { getFrameworkConfig } from '../data/frameworkConfig';
import { loadStixData } from '../data/loadAttackData';
import {
  computeBetweenness,
  computeChainCoverage,
  layoutNodes,
} from '../engine/graphModel';

interface UseCompareModeArgs {
  framework: string;
  activeTechniques: any[];
}

export function useCompareMode({ framework, activeTechniques }: UseCompareModeArgs) {
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const otherFramework = framework === "enterprise" ? "ics" : "enterprise";
  const otherFwConfig = useMemo(() => getFrameworkConfig(otherFramework), [otherFramework]);

  // Load other framework STIX data when compare mode is enabled
  useEffect(() => {
    if (!compareMode) { setCompareData(null); return; }
    const controller = new AbortController();
    setCompareLoading(true);
    loadStixData(controller.signal, otherFwConfig as any).then((data: any) => {
      if (controller.signal.aborted) return;
      setCompareData(data);
      setCompareLoading(false);
    }).catch(() => {
      if (controller.signal.aborted) return;
      setCompareLoading(false);
    });
    return () => controller.abort();
  }, [compareMode, otherFwConfig]);

  // Compare layout computation
  const compareLayout = useMemo(() => {
    if (!compareMode || !compareData) return null;
    const techs = compareData.techniques.filter((t: any) => !t.parentId);
    const layout = layoutNodes(techs, otherFwConfig.tactics);
    const edges = (() => {
      const techSet = new Set(techs.map((t: any) => t.id));
      return compareData.edges.filter((e: any) => techSet.has(e.from) && techSet.has(e.to));
    })();
    const bc = computeBetweenness(techs, edges);
    const cc = computeChainCoverage(techs, compareData.chains || []);
    return {
      techniques: techs, edges, positions: layout.positions,
      viewHeight: layout.viewHeight, viewWidth: layout.viewWidth,
      phaseCenters: layout.phaseCenters, betweenness: bc,
      chainCoverage: cc, chains: compareData.chains || [],
    };
  }, [compareMode, compareData, otherFwConfig]);

  // Compare analysis: shared vs unique techniques
  const compareAnalysis = useMemo(() => {
    if (!compareMode || !compareData) return null;
    const currentIds = new Set<string>(activeTechniques.filter((t: any) => !t.parentId).map((t: any) => t.id));
    const otherIds = new Set<string>((compareData.techniques || []).filter((t: any) => !t.parentId).map((t: any) => t.id));
    const shared = new Set<string>(Array.from(currentIds).filter((id: string) => otherIds.has(id)));
    const uniqueCurrent = new Set<string>(Array.from(currentIds).filter((id: string) => !otherIds.has(id)));
    const uniqueOther = new Set<string>(Array.from(otherIds).filter((id: string) => !currentIds.has(id)));
    return { currentCount: currentIds.size, otherCount: otherIds.size, shared, uniqueCurrent, uniqueOther };
  }, [compareMode, compareData, activeTechniques]);

  const resetCompare = () => {
    setCompareMode(false);
    setCompareData(null);
  };

  return {
    compareMode, setCompareMode,
    compareData, compareLoading,
    otherFramework, otherFwConfig,
    compareLayout, compareAnalysis,
    resetCompare,
  };
}
