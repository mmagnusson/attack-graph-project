// ─── useExportHandlers — CSV, Navigator layer, plan, board report ───────────

import { useCallback } from 'react';
import type {
  AttackDataset, DefensePosture, DefenseVocabulary, FrameworkConfig, GateDef, ModelParams, PlanResult, TechniqueAssessment,
} from '../types';
import { evaluateModel, type CompiledModel, type ModelState } from '../engine/riskModel';
import { withItems } from '../engine/portfolioOptimizer';
import { buildBoardReport } from '../engine/boardReport';
import { csvRow, downloadFile, today } from '../engine/csv';
import { SECTORS } from '../engine/actorTags';
import { EVALS_NOTICE } from '../data/evalsConfig';

interface UseExportHandlersArgs {
  cfg: FrameworkConfig;
  dataset: AttackDataset | null;
  vocabulary: DefenseVocabulary | null;
  /** ATT&CK mitigation ID → names of D3FEND countermeasures that implement it */
  implementedBy: (itemId: string) => string[];
  model: CompiledModel | null;
  state: ModelState | null;
  activity: Float64Array | null;
  params: ModelParams;
  plan: PlanResult | null;
  frontier: PlanResult | null;
  sensitivity: { low: number; high: number } | null;
  posture: DefensePosture;
  budget: number;
  sector: string;
  gates: GateDef[];
  includeSoftware: boolean;
  includeCampaigns: boolean;
  assessment: Record<string, TechniqueAssessment> | null;
}

/** Tools that contributed coverage anywhere in the assessment, with the Evals round when measured */
function toolsInProfile(assessment: Record<string, TechniqueAssessment> | null): { name: string; measured: string | null }[] {
  const tools = new Map<string, { name: string; measured: string | null }>();
  for (const a of Object.values(assessment ?? {})) for (const s of a.sources) {
    const t = tools.get(s.toolId) ?? { name: s.name, measured: null };
    if (s.measured) t.measured = s.measured.roundName;
    tools.set(s.toolId, t);
  }
  return [...tools.values()];
}

export function useExportHandlers(a: UseExportHandlersArgs) {
  const { cfg, dataset, vocabulary, implementedBy, model, state, activity, params, plan, frontier, sensitivity, posture, budget, sector, gates, includeSoftware, includeCampaigns, assessment } = a;

  const exportCSV = useCallback(() => {
    if (!dataset || !model || !state || !activity) return;
    const tacticName = (id: string) => cfg.tactics.find(t => t.id === id)?.name ?? id;
    const totalAct = activity.reduce((s, x) => s + x, 0) || 1;
    let csv = csvRow(['Technique ID', 'Name', 'Tactics', 'Actors', 'Residual success %', 'Detection coverage %', 'Activity share %', 'Preventions in place', 'Assumed blocked', 'Detection strategy']);
    dataset.techniques.forEach(t => {
      const i = model.techIndex.get(t.id)!;
      const det = 1 - (1 - state.ruleCoverage[i]) * (1 - model.toolDetect[i]);
      csv += csvRow([t.id, t.name, t.tactics.map(tacticName).join('; '), model.techActors[i].length,
        +(state.p[i] * 100).toFixed(1), +(det * 100).toFixed(1), +(activity[i] / totalAct * 100).toFixed(2),
        state.preventCount[i], state.blocked[i] ? 'Y' : 'N', dataset.detections[t.id]?.id ?? '']);
    });
    csv += '\n' + csvRow(['Actor ID', 'Name', 'Kind', 'Viability %', 'Weight', 'Sectors', 'Techniques']);
    model.actors.forEach((act, i) => {
      csv += csvRow([act.chain.id, act.chain.name, act.chain.kind, +(state.viability[i] * 100).toFixed(1), act.weight, act.chain.sectors.join('; '), act.chain.path.length]);
    });
    downloadFile(csv, 'attackbreaker-analysis-' + today() + '.csv', 'text/csv');
  }, [cfg, dataset, model, state, activity]);

  const exportPlanCSV = useCallback(() => {
    if (!plan) return;
    const w = plan.totalWeight || 1;
    let csv = csvRow(['Step', 'Defense ID', 'Defense', 'Type', 'Est. annual cost (USD)', 'Cumulative cost', 'Risk removed (pts)', 'Residual risk %']);
    plan.steps.forEach((s, i) => {
      csv += csvRow([i + 1, s.item.id, s.item.name, s.item.kind, s.item.cost, s.cumulativeCost, +(s.delta / w * 100).toFixed(2), +(s.risk / w * 100).toFixed(1)]);
    });
    csv += '\n' + csvRow(['Budget', budget]) + csvRow(['Baseline residual %', +(plan.baselineRisk / w * 100).toFixed(1)]) + csvRow(['Final residual %', +(plan.finalRisk / w * 100).toFixed(1)]);
    csv += csvRow(['Note', 'Costs are placeholder estimates unless edited in AttackBreaker'] );
    downloadFile(csv, 'attackbreaker-plan-' + today() + '.csv', 'text/csv');
  }, [plan, budget]);

  const exportNavigatorLayer = useCallback(() => {
    if (!dataset || !model || !state) return;
    const techniques = dataset.techniques.map(t => {
      const i = model.techIndex.get(t.id)!;
      const det = 1 - (1 - state.ruleCoverage[i]) * (1 - model.toolDetect[i]);
      return {
        techniqueID: t.id,
        tactic: cfg.tacticToPhase[t.tactic] || "",
        score: Math.round(state.p[i] * 100),
        comment: [
          state.blocked[i] ? 'Assumed blocked' : 'Residual success ' + Math.round(state.p[i] * 100) + '%',
          'Detection coverage ' + Math.round(det * 100) + '%',
          'Actors ' + model.techActors[i].length,
          'Preventions in place ' + state.preventCount[i],
        ].join(' | '),
        enabled: !state.blocked[i],
      };
    });
    const layer = {
      name: "AttackBreaker — residual technique success",
      domain: cfg.navigatorDomain,
      versions: { attack: cfg.attackVersion.split('.')[0], navigator: "4.9.1", layer: "4.5" },
      techniques,
      gradient: { colors: ["#fcfcfb", "#d95926"], minValue: 0, maxValue: 100 },
      description: "Residual chance each technique succeeds after modeled mitigations. Exported " + today(),
    };
    downloadFile(JSON.stringify(layer, null, 2), 'attackbreaker-navigator-' + today() + '.json', 'application/json');
  }, [cfg, dataset, model, state]);

  const exportCoverageCSV = useCallback(() => {
    if (!dataset || !assessment) return;
    let csv = csvRow(['Technique ID', 'Name', 'Base exposure %', 'Detect %', 'Prevent %', 'Tools (d = detect, p = prevent; "evals" = detection measured in MITRE ATT&CK Evaluations, otherwise estimates)']);
    dataset.techniques.forEach(t => {
      const x = assessment[t.id];
      if (!x) return;
      csv += csvRow([t.id, t.name, +(x.baseExposure * 100).toFixed(0), +(x.detect * 100).toFixed(0), +(x.prevent * 100).toFixed(0),
        x.sources.map(s => s.name + ' (d' + Math.round(s.detect * 100) + (s.measured ? ' evals ' + s.measured.year : '') + '/p' + Math.round(s.prevent * 100) + ')').join('; ') || 'None']);
    });
    downloadFile(csv, 'attackbreaker-coverage-' + today() + '.csv', 'text/csv');
  }, [dataset, assessment]);

  const exportBoardReport = useCallback(() => {
    if (!dataset || !vocabulary || !model || !plan || !frontier) return;
    const w = model.totalWeight || 1;
    const afterPlan = evaluateModel(model, params, withItems(posture, plan.steps.map(s => s.item)));
    const frontierPts = [{ cost: 0, residual: frontier.baselineRisk / w }, ...frontier.steps.map(s => ({ cost: s.cumulativeCost, residual: s.risk / w }))];
    const html = buildBoardReport({
      generatedAt: today(),
      frameworkLabel: cfg.label + ' ATT&CK',
      attackVersion: cfg.attackVersion,
      dataLabel: dataset.sourceLabel,
      scope: {
        actors: model.actors.length,
        sector: sector === 'all' ? 'all' : (SECTORS.find(s => s.id === sector)?.label ?? sector),
        gates: gates.map(g => g.label), includeSoftware, includeCampaigns,
      },
      posture: { vocabulary: vocabulary.label, prevent: posture.prevent.size, totalPrevent: vocabulary.preventions.filter(m => m.actionable).length, detect: posture.detect.size, totalDetect: vocabulary.components.length },
      currentResidual: plan.baselineRisk / w,
      planResidual: plan.finalRisk / w,
      budget, spend: plan.totalCost,
      sensitivity: sensitivity ?? { low: 0, high: 0 },
      plan: plan.steps.map(s => ({ id: s.item.id, name: s.item.name, kind: s.item.kind, cost: s.item.cost, removed: s.delta / w, residualAfter: s.risk / w, implementedBy: implementedBy(s.item.id) })),
      frontier: frontierPts,
      topActors: model.actors
        .map((act, i) => ({ name: act.chain.name, kind: act.chain.kind, viability: afterPlan.viability[i], sectors: act.chain.sectors }))
        .sort((x, y) => y.viability - x.viability)
        .slice(0, 8),
      params,
      tools: toolsInProfile(assessment),
      evalsNotice: EVALS_NOTICE,
    });
    downloadFile(html, 'attackbreaker-board-report-' + today() + '.html', 'text/html');
  }, [cfg, dataset, vocabulary, implementedBy, model, plan, frontier, sensitivity, posture, budget, sector, gates, includeSoftware, includeCampaigns, params, assessment]);

  return { exportCSV, exportPlanCSV, exportNavigatorLayer, exportCoverageCSV, exportBoardReport };
}
