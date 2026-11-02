// ─── ExecutiveSummary — leadership view of residual risk and the plan ───────

import { useMemo } from 'react';
import type { AttackDataset, DefensePosture } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { actorBreakdown } from '../../engine/riskModel';
import { fmtPct, fmtUsd } from '../../engine/displayMetrics';
import { ENCODING } from '../../data/constants';
import { PopoutButton } from '../Analysis/PopoutButton';
import { KindBadge, Meter, SmallButton } from '../ui';
import { theme } from '../../theme';

interface ExecutiveSummaryProps {
  rm: RiskModelView;
  dataset: AttackDataset;
  posture: DefensePosture;
  budget: number;
  onExportBoard: () => void;
  popout?: boolean;
  onPopout?: () => void;
}

export function ExecutiveSummary({ rm, dataset, posture, budget, onExportBoard, popout, onPopout }: ExecutiveSummaryProps) {
  const { model, baseState, plan } = rm;

  // Average chance actors get through each required stage (weighted by actor weight)
  const stages = useMemo(() => {
    if (!model || !baseState) return [];
    const acc = new Map<string, { label: string; sum: number; w: number }>();
    model.actors.forEach((a, i) => {
      for (const g of actorBreakdown(model, rm.params, baseState, i)) {
        const x = acc.get(g.gateId) ?? { label: g.label, sum: 0, w: 0 };
        x.sum += a.weight * g.value;
        x.w += a.weight;
        acc.set(g.gateId, x);
      }
    });
    return [...acc.values()].map(x => ({ label: x.label, value: x.w > 0 ? x.sum / x.w : 0 }));
  }, [model, baseState, rm.params]);

  const topActors = useMemo(() => {
    if (!model || !baseState) return [];
    return model.actors.map((a, i) => ({ name: a.chain.name, v: baseState.viability[i] })).sort((a, b) => b.v - a.v).slice(0, 5);
  }, [model, baseState]);

  if (!model || !plan) return <div style={{ color: theme.colors.textMuted }}>Loading…</div>;
  const w = plan.totalWeight || 1;
  const reduction = plan.baselineRisk > 0 ? 1 - plan.finalRisk / plan.baselineRisk : 0;
  const section = { background: theme.colors.bgCard, border: "1px solid " + theme.colors.borderSubtle, borderRadius: 8, padding: "16px 20px", marginBottom: 14 };
  const label = { ...theme.sectionLabel, marginBottom: 10 };
  const actionable = dataset.mitigations.filter(m => m.actionable).length;

  return (
    <>
      <h3 style={{ fontSize: theme.fontSizes.medium, color: theme.colors.cyan, margin: "0 0 16px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 8 }}>
        EXECUTIVE SUMMARY
        {!popout && onPopout && <PopoutButton onClick={onPopout} title="Pop out Executive Summary" />}
        <span style={{ marginLeft: "auto" }}><SmallButton onClick={onExportBoard} color={theme.colors.cyan}>BOARD REPORT</SmallButton></span>
      </h3>

      <div style={{ ...section, textAlign: "center" }}>
        <div style={label}>Residual risk today</div>
        <div style={{ fontSize: theme.fontSizes.hero, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.1 }}>{fmtPct(rm.currentResidual)}</div>
        <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
          Expected share of {model.actors.length} modeled threat actors that could complete every required stage of an intrusion without being contained.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { l: "With the plan", v: fmtPct(plan.finalRisk / w) },
          { l: "Plan cost / yr", v: fmtUsd(plan.totalCost) },
          { l: "Risk reduction", v: "−" + fmtPct(reduction) },
        ].map(s => (
          <div key={s.l} style={{ ...section, marginBottom: 0, padding: "12px 14px" }}>
            <div style={{ fontSize: theme.fontSizes.display, fontWeight: 600, color: theme.colors.textPrimary }}>{s.v}</div>
            <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>{s.l}</div>
          </div>
        ))}
      </div>
      {rm.sensitivity && (
        <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, margin: "-6px 0 14px" }}>
          Reduction ranges from {fmtPct(rm.sensitivity.low)} to {fmtPct(rm.sensitivity.high)} under pessimistic and optimistic assumptions. Budget {fmtUsd(budget)}; costs are estimates unless edited.
        </div>
      )}

      <div style={section}>
        <div style={label}>Recommended next investments</div>
        {plan.steps.slice(0, 6).map((s, i) => (
          <div key={s.item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? "1px solid " + theme.colors.borderSubtle : "none" }}>
            <span style={{ color: theme.colors.textFaint, width: 16, fontSize: theme.fontSizes.small }}>{i + 1}</span>
            <KindBadge kind={s.item.kind} />
            <span style={{ flex: 1, fontSize: theme.fontSizes.small, color: theme.colors.textPrimary }}>{s.item.name}</span>
            <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, fontVariantNumeric: "tabular-nums" }}>{fmtUsd(s.item.cost)} · −{(s.delta / w * 100).toFixed(1)} pts</span>
          </div>
        ))}
        {plan.steps.length === 0 && <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>No affordable defense reduces risk further.</div>}
      </div>

      <div style={section}>
        <div style={label}>How often actors get through each stage</div>
        {stages.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ width: 150, flexShrink: 0, fontSize: theme.fontSizes.small, color: theme.colors.textBody }}>{s.label}</span>
            <span style={{ flex: 1, minWidth: 0, display: "flex" }}><Meter value={s.value} color={ENCODING.success} width="100%" height={8} label={s.label} /></span>
            <span style={{ width: 40, textAlign: "right", fontSize: theme.fontSizes.small, color: theme.colors.textBody, fontVariantNumeric: "tabular-nums" }}>{fmtPct(s.value)}</span>
          </div>
        ))}
        <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>Lower is better. The weakest stage is where the next dollar usually goes furthest.</div>
      </div>

      <div style={section}>
        <div style={label}>Most viable actors</div>
        {topActors.map(a => (
          <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, fontSize: theme.fontSizes.small, color: theme.colors.textBody }}>
            <span style={{ flex: 1 }}>{a.name}</span>
            <Meter value={a.v} color={ENCODING.success} width={80} label={"Viability of " + a.name} />
            <span style={{ width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtPct(a.v)}</span>
          </div>
        ))}
      </div>

      <div style={{ ...section, fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
        <div style={label}>Current posture</div>
        {posture.mitigations.size} of {actionable} MITRE mitigations in place · {posture.dataComponents.size} of {dataset.dataComponents.length} data components collected
        {posture.blocked.size > 0 && <> · {posture.blocked.size} techniques assumed blocked</>}
      </div>
    </>
  );
}
