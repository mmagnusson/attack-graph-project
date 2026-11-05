// ─── useEnvironmentProfile — profile wizard state + KB assessment ────────────

import { useMemo, useState } from 'react';
import type { AttackChain, CoverageKB, EnvironmentProfile, FrameworkConfig, Technique, TechniqueAssessment } from '../types';
import { actorWeightsFor, assessEnvironment, assessmentToModelInputs } from '../engine/exposureEngine';
import { STORAGE_PREFIX, usePersistentState } from './usePersistentState';

const isProfile = (v: unknown) => v === null || (!!v && typeof v === 'object' && Array.isArray((v as EnvironmentProfile).infrastructure));

export function useEnvironmentProfile(cfg: FrameworkConfig, coverageKB: CoverageKB, techniques: Technique[], chains: AttackChain[]) {
  const [environmentProfile, setEnvironmentProfile] = usePersistentState<EnvironmentProfile | null>(
    STORAGE_PREFIX + 'envProfile.' + cfg.id, null, isProfile,
  );
  const [showProfileWizard, setShowProfileWizard] = useState(false);

  const hasSelections = !!environmentProfile &&
    ((environmentProfile.infrastructure?.length ?? 0) > 0 || (environmentProfile.securityTools?.length ?? 0) > 0);

  const assessment: Record<string, TechniqueAssessment> | null = useMemo(
    () => (hasSelections ? assessEnvironment(environmentProfile!, coverageKB, techniques) : null),
    [hasSelections, environmentProfile, coverageKB, techniques],
  );
  const modelInputs = useMemo(
    () => assessmentToModelInputs(assessment, (environmentProfile?.infrastructure?.length ?? 0) > 0),
    [assessment, environmentProfile],
  );
  const actorWeights = useMemo(() => actorWeightsFor(environmentProfile, chains), [environmentProfile, chains]);

  const exposureSummary = useMemo(() => {
    if (!assessment) return null;
    const entries = techniques.filter(t => !t.parentId).map(t => assessment[t.id]).filter(Boolean);
    if (entries.length === 0) return null;
    const covered = entries.filter(a => a.sources.length > 0).length;
    const avg = (f: (a: TechniqueAssessment) => number) => entries.reduce((s, a) => s + f(a), 0) / entries.length;
    return {
      techniques: entries.length,
      covered,
      avgDetect: avg(a => a.detect),
      avgPrevent: avg(a => a.prevent),
      avgExposure: avg(a => a.baseExposure),
    };
  }, [assessment, techniques]);

  return {
    environmentProfile, setEnvironmentProfile,
    showProfileWizard, setShowProfileWizard,
    assessment, modelInputs, actorWeights, exposureSummary,
  };
}
