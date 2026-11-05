// ─── useRiskModel — compile, evaluate, optimize (memoized) ──────────────────
// Compilation depends on the dataset, actor set, gates and environment; the
// cheaper evaluate/optimize steps re-run on posture, cost and parameter
// changes. Parameters are deferred so slider drags stay responsive.

import { useDeferredValue, useMemo } from 'react';
import type {
  AttackChain, AttackDataset, CatalogItem, DefensePosture, DefenseVocabulary, GateDef, ModelParams, PlanResult, ToolCoverage,
} from '../types';
import { compileModel, evaluateModel, techniqueActivity, SENSITIVITY_BOUNDS } from '../engine/riskModel';
import { buildCatalog, evaluateItems, marginalValues, optimizePortfolio, withItems, type CostModel } from '../engine/portfolioOptimizer';
import { rollupMetrics, type NodeMetrics } from '../engine/displayMetrics';

interface UseRiskModelArgs {
  dataset: AttackDataset | null;
  vocabulary: DefenseVocabulary | null;
  chains: AttackChain[];
  gates: GateDef[];
  includeSoftware: boolean;
  platforms: ReadonlySet<string> | null;
  exposure?: Record<string, number>;
  toolCoverage?: Record<string, ToolCoverage>;
  actorWeights: Record<string, number>;
  params: ModelParams;
  posture: DefensePosture;
  costModel: CostModel;
  budget: number;
  previewPlan: boolean;
  displaySet: ReadonlySet<string>;
}

const EMPTY_METRICS: Record<string, NodeMetrics> = {};

export function useRiskModel(a: UseRiskModelArgs) {
  const params = useDeferredValue(a.params);
  const { dataset, vocabulary, chains, gates, includeSoftware, platforms, exposure, toolCoverage, actorWeights, posture, costModel, budget, previewPlan, displaySet } = a;

  const model = useMemo(() => (dataset && vocabulary
    ? compileModel({ dataset, vocabulary, chains, gates, includeSoftware, platforms, exposure, toolCoverage, actorWeights })
    : null), [dataset, vocabulary, chains, gates, includeSoftware, platforms, exposure, toolCoverage, actorWeights]);

  const baseState = useMemo(() => (model ? evaluateModel(model, params, posture) : null), [model, params, posture]);

  const catalog: CatalogItem[] = useMemo(
    () => (vocabulary ? buildCatalog(vocabulary, posture, costModel) : []),
    [vocabulary, posture, costModel],
  );

  const plan: PlanResult | null = useMemo(
    () => (model ? optimizePortfolio(model, params, posture, catalog, { budget }) : null),
    [model, params, posture, catalog, budget],
  );
  const frontier: PlanResult | null = useMemo(
    () => (model ? optimizePortfolio(model, params, posture, catalog, { budget: null, maxSteps: 30 }) : null),
    [model, params, posture, catalog],
  );

  const sensitivity = useMemo(() => {
    if (!model || !plan || plan.steps.length === 0) return null;
    const items = plan.steps.map(s => s.item);
    const red = (r: { before: number; after: number }) => (r.before > 0 ? 1 - r.after / r.before : 0);
    return {
      low: red(evaluateItems(model, SENSITIVITY_BOUNDS.low, posture, items)),
      high: red(evaluateItems(model, SENSITIVITY_BOUNDS.high, posture, items)),
    };
  }, [model, plan, posture]);

  const marginal = useMemo(
    () => (model && baseState ? marginalValues(model, params, baseState, catalog) : new Map<string, number>()),
    [model, params, baseState, catalog],
  );

  const planItems = useMemo(() => plan?.steps.map(s => s.item) ?? [], [plan]);
  const shownPosture = useMemo(
    () => (previewPlan && planItems.length > 0 ? withItems(posture, planItems) : posture),
    [previewPlan, planItems, posture],
  );
  const state = useMemo(
    () => (model ? (shownPosture === posture ? baseState : evaluateModel(model, params, shownPosture)) : null),
    [model, params, shownPosture, posture, baseState],
  );

  const activity = useMemo(() => (model && state ? techniqueActivity(model, params, state) : null), [model, params, state]);
  const metrics = useMemo(
    () => (model && state && activity ? rollupMetrics(model, state, activity, displaySet) : EMPTY_METRICS),
    [model, state, activity, displaySet],
  );

  const viabilityById = useMemo(() => {
    const m = new Map<string, number>();
    if (model && state) model.actors.forEach((act, i) => m.set(act.chain.id, state.viability[i]));
    return m;
  }, [model, state]);

  const totalWeight = model?.totalWeight ?? 0;
  const share = (r: number | undefined) => (totalWeight > 0 && r !== undefined ? r / totalWeight : 0);

  return {
    model, baseState, state, catalog, plan, frontier, sensitivity, marginal, activity, metrics, viabilityById,
    shownPosture, params, totalWeight,
    currentResidual: share(baseState?.risk),
    shownResidual: share(state?.risk),
    planResidual: share(plan?.finalRisk),
  };
}

export type RiskModelView = ReturnType<typeof useRiskModel>;
