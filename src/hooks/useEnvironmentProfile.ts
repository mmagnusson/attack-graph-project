// ─── useEnvironmentProfile — environment profiling, exposure scoring ─────────

import { useState, useEffect, useMemo, useCallback } from 'react';
import { computeExposureScores, buildActorTechMap } from '../engine/exposureEngine';

interface UseEnvironmentProfileArgs {
  fwConfig: any;
  displayTechniques: any[];
  activeChains: any[];
  betweenness: Record<string, number>;
  chainCoverage: Record<string, number>;
  setExposures: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useEnvironmentProfile({
  fwConfig, displayTechniques, activeChains,
  betweenness, chainCoverage, setExposures,
}: UseEnvironmentProfileArgs) {
  const [environmentProfile, setEnvironmentProfile] = useState<any>(() => {
    try {
      const s = localStorage.getItem("attackBreaker_envProfile");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [profileExposures, setProfileExposures] = useState<Record<string, any> | null>(null);

  const actorTechMap = useMemo(() => buildActorTechMap(activeChains), [activeChains]);

  // Compute exposure scores when profile changes
  useEffect(() => {
    if (!environmentProfile) { setProfileExposures(null); return; }
    const hasSelections = (environmentProfile.infrastructure?.length > 0) || (environmentProfile.securityTools?.length > 0);
    if (!hasSelections) { setProfileExposures(null); return; }
    const scores = computeExposureScores(environmentProfile, fwConfig.coverageKB, displayTechniques, actorTechMap);
    setProfileExposures(scores);
    const newExposures: Record<string, number> = {};
    for (const [tid, data] of Object.entries(scores) as [string, any][]) {
      newExposures[tid] = data.finalExposure;
    }
    setExposures((prev: Record<string, number>) => {
      const merged = { ...prev };
      for (const [tid, val] of Object.entries(newExposures)) {
        merged[tid] = val;
      }
      return merged;
    });
  }, [environmentProfile, fwConfig, displayTechniques, actorTechMap, setExposures]);

  // Persist environment profile to localStorage
  useEffect(() => {
    if (environmentProfile) {
      localStorage.setItem("attackBreaker_envProfile", JSON.stringify(environmentProfile));
    } else {
      localStorage.removeItem("attackBreaker_envProfile");
    }
  }, [environmentProfile]);

  // Exposure summary computed from profile exposures
  const exposureSummary = useMemo(() => {
    if (!profileExposures) return null;
    const entries = Object.entries(profileExposures);
    if (entries.length === 0) return null;
    const highExposed = entries.filter(([, pe]: [string, any]) => pe.finalExposure > 0.7);
    const wellCovered = entries.filter(([, pe]: [string, any]) => pe.finalExposure < 0.3);
    const totalCoverage = entries.reduce((s: number, [, pe]: [string, any]) => s + pe.coverageReduction, 0) / entries.length;
    const avgExposure = entries.reduce((s: number, [, pe]: [string, any]) => s + pe.finalExposure, 0) / entries.length;
    const uncoveredChokepoints = entries
      .map(([tid, pe]: [string, any]) => ({ tid, exposure: pe.finalExposure, bc: betweenness[tid] ?? 0, cc: chainCoverage[tid] ?? 0 }))
      .filter((x: any) => x.exposure > 0.5)
      .sort((a: any, b: any) => (b.bc * b.exposure) - (a.bc * a.exposure))
      .slice(0, 5);
    return { highExposed: highExposed.length, wellCovered: wellCovered.length, totalCoverage, avgExposure, uncoveredChokepoints, totalTechniques: entries.length };
  }, [profileExposures, betweenness, chainCoverage]);

  const resetProfile = useCallback(() => {
    setEnvironmentProfile(null);
    setProfileExposures(null);
    setShowProfileWizard(false);
  }, []);

  return {
    environmentProfile, setEnvironmentProfile,
    showProfileWizard, setShowProfileWizard,
    profileExposures, setProfileExposures,
    actorTechMap, exposureSummary, resetProfile,
  };
}
