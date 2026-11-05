// ─── PlanPanel — budgeted investment plan + efficiency frontier ─────────────

import { useState } from 'react';
import type { CatalogItem, VocabularyId } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { ORG_SIZES, type OrgSize } from '../../engine/portfolioOptimizer';
import { fmtPct, fmtUsd } from '../../engine/displayMetrics';
import { ENCODING } from '../../data/constants';
import { FrontierChart } from '../Charts';
import { EditableCost, KindBadge, PanelTitle, SmallButton, VocabularySwitch } from '../ui';
import { linkButton } from '../styles';
import { theme } from '../../theme';

interface PlanPanelProps {
  rm: RiskModelView;
  budget: number;
  setBudget: (v: number) => void;
  orgSize: OrgSize;
  setOrgSize: (v: OrgSize) => void;
  fullCostOf: (itemId: string) => number;
  onSetCost: (itemId: string, cost: number) => void;
  hasCostOverrides: boolean;
  onResetCosts: () => void;
  previewPlan: boolean;
  setPreviewPlan: (v: boolean) => void;
  onMarkInPlace: (items: CatalogItem[]) => void;
  onHoverItem: (item: CatalogItem | null) => void;
  onExportPlan: () => void;
  onExportBoard: () => void;
  onOpenModel: () => void;
  postureEmpty: boolean;
  onOpenDefenses: () => void;
  vocabulary: VocabularyId;
  setVocabulary: (v: VocabularyId) => void;
  /** Names of D3FEND countermeasures that implement an ATT&CK mitigation (empty otherwise) */
  implementedBy: (itemId: string) => string[];
}

const BUDGET_PRESETS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000];

export function PlanPanel(p: PlanPanelProps) {
  const { rm, budget } = p;
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null);
  const plan = rm.plan, frontier = rm.frontier;
  if (!plan || !frontier) return <div style={{ color: theme.colors.textMuted }}>Loading model…</div>;

  const w = plan.totalWeight || 1;
  const reduction = plan.baselineRisk > 0 ? 1 - plan.finalRisk / plan.baselineRisk : 0;
  const inPlan = new Set(plan.steps.map(s => s.item.id));
  const beyond = frontier.steps.filter(s => !inPlan.has(s.item.id)).slice(0, 4);

  const commitBudget = () => {
    if (budgetDraft === null) return;
    const m = budgetDraft.toLowerCase().replace(/[$,\s]/g, '').match(/^(\d+(?:\.\d+)?)([km]?)$/);
    if (m) p.setBudget(Math.round(parseFloat(m[1]) * (m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1)));
    setBudgetDraft(null);
  };

  return (
    <>
      <PanelTitle color={ENCODING.success} right={<>
        <SmallButton onClick={p.onExportPlan} title="Download the plan as CSV">CSV</SmallButton>
        <SmallButton onClick={p.onExportBoard} color={theme.colors.cyan} title="Download a printable one-page report">BOARD REPORT</SmallButton>
      </>}>
        INVESTMENT PLAN
      </PanelTitle>

      <div style={{ marginBottom: theme.spacing.lg }}><VocabularySwitch value={p.vocabulary} onChange={p.setVocabulary} /></div>

      {/* Budget & org size */}
      <div style={{ display: "flex", gap: theme.spacing.lg, flexWrap: "wrap", alignItems: "flex-end", marginBottom: theme.spacing.xl }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={theme.fieldLabel}>Annual budget</span>
          <input value={budgetDraft ?? budget.toLocaleString('en-US')} onChange={e => setBudgetDraft(e.target.value)}
            onFocus={() => setBudgetDraft(String(budget))} onBlur={commitBudget}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            style={{ ...theme.inputBase, width: 120, fontVariantNumeric: "tabular-nums" }} aria-label="Annual budget in USD" />
        </label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {BUDGET_PRESETS.map(b => (
            <button key={b} onClick={() => p.setBudget(b)} style={{
              ...theme.buttonBase, padding: "5px 8px", fontSize: theme.fontSizes.tiny,
              background: b === budget ? theme.colors.bgSurface : "transparent",
              color: b === budget ? theme.colors.textPrimary : theme.colors.textMuted,
              border: "1px solid " + (b === budget ? theme.colors.textMuted : theme.colors.border),
            }}>{fmtUsd(b)}</button>
          ))}
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={theme.fieldLabel}>Org size (scales default costs)</span>
          <select value={p.orgSize} onChange={e => p.setOrgSize(e.target.value as OrgSize)} style={theme.inputBase}>
            {Object.entries(ORG_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", gap: theme.spacing.xxl, flexWrap: "wrap", padding: "14px 0", borderTop: "1px solid " + theme.colors.borderSubtle, borderBottom: "1px solid " + theme.colors.borderSubtle, marginBottom: theme.spacing.lg }}>
        <div>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 600, color: theme.colors.textPrimary }}>
            {fmtPct(plan.baselineRisk / w)} <span style={{ color: theme.colors.textMuted, fontWeight: 400 }}>→</span> {fmtPct(plan.finalRisk / w)}
          </div>
          <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>Residual risk, today → with plan</div>
        </div>
        <div>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 600, color: theme.colors.textPrimary }}>{fmtUsd(plan.totalCost)}</div>
          <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>{plan.steps.length} defenses · of {fmtUsd(budget)}</div>
        </div>
      </div>
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: theme.spacing.lg }}>
        Removes <strong style={{ color: theme.colors.textPrimary }}>{fmtPct(reduction)}</strong> of the modeled risk
        {rm.sensitivity && <> — between <strong style={{ color: theme.colors.textPrimary }}>{fmtPct(rm.sensitivity.low)}</strong> and <strong style={{ color: theme.colors.textPrimary }}>{fmtPct(rm.sensitivity.high)}</strong> under pessimistic and optimistic assumptions</>}.
        {" "}Residual risk is the expected share of {rm.model?.actors.length ?? 0} modeled actors that could complete every required stage without being contained.
      </div>

      {p.postureEmpty && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", marginBottom: theme.spacing.lg, background: theme.colors.bgSurface, borderRadius: theme.radii.md, fontSize: theme.fontSizes.small, color: theme.colors.textBody, lineHeight: 1.55 }}>
          <span aria-hidden style={{ color: "#fab219" }}>{"\u24D8"}</span>
          <span style={{ flex: 1 }}>
            No defenses recorded yet, so "today" assumes nothing is in place. Record what you already run — or apply a
            starting posture such as basic hygiene or NIST CSF — for a realistic baseline and a plan that builds on it.
          </span>
          <SmallButton onClick={p.onOpenDefenses} color={ENCODING.prevention}>RECORD DEFENSES</SmallButton>
        </div>
      )}

      <FrontierChart frontier={frontier} plan={plan} budget={budget} onHoverItem={p.onHoverItem} />

      <div style={{ display: "flex", gap: theme.spacing.lg, alignItems: "center", flexWrap: "wrap", margin: "12px 0 16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, cursor: "pointer" }}>
          <input type="checkbox" checked={p.previewPlan} onChange={e => p.setPreviewPlan(e.target.checked)} />
          Preview plan on the graph
        </label>
        <SmallButton onClick={() => p.onMarkInPlace(plan.steps.map(s => s.item))} disabled={plan.steps.length === 0} color={ENCODING.prevention}
          title="Record every recommended defense as already in place">MARK ALL IN PLACE</SmallButton>
      </div>

      {/* Plan table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.fontSizes.small }}>
        <thead>
          <tr style={{ color: theme.colors.textMuted, textAlign: "left" }}>
            <th style={th}>#</th><th style={th}>Defense</th><th style={{ ...th, textAlign: "right" }}>Est. cost / yr</th>
            <th style={{ ...th, textAlign: "right" }}>Removes (pts)</th><th style={{ ...th, textAlign: "right" }}>Residual</th><th style={th} />
          </tr>
        </thead>
        <tbody>
          {plan.steps.map((s, i) => (
            <tr key={s.item.id} onMouseEnter={() => p.onHoverItem(s.item)} onMouseLeave={() => p.onHoverItem(null)}
              style={{ borderTop: "1px solid " + theme.colors.borderSubtle }}>
              <td style={{ ...td, color: theme.colors.textMuted }}>{i + 1}</td>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <KindBadge kind={s.item.kind} />
                  <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>{s.item.name}</span>
                </div>
                <div style={{ color: theme.colors.textFaint, fontSize: theme.fontSizes.micro, marginTop: 2 }}>
                  {s.item.id}{s.item.group ? ' · D3FEND ' + s.item.group : ''}
                  {s.item.kind === 'detect' ? ' · ' + s.item.detectIds.length + (p.vocabulary === 'd3fend' ? ' countermeasures' : ' data components') + ' to add' : ''}
                </div>
                {p.implementedBy(s.item.id).length > 0 && (
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.micro, marginTop: 2 }}>
                    D3FEND: {p.implementedBy(s.item.id).join(', ')}
                  </div>
                )}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <EditableCost value={s.item.cost} onChange={v => p.onSetCost(s.item.id, v)}
                  title={s.item.kind === 'detect' ? 'Edit full-deployment cost (' + fmtUsd(p.fullCostOf(s.item.id)) + ')' : undefined} />
              </td>
              <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>−{(s.delta / w * 100).toFixed(1)}</td>
              <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtPct(s.risk / w, 1)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <SmallButton onClick={() => p.onMarkInPlace([s.item])} title="Record as already in place">IN PLACE</SmallButton>
              </td>
            </tr>
          ))}
          {plan.steps.length === 0 && (
            <tr><td colSpan={6} style={{ ...td, color: theme.colors.textMuted }}>Nothing affordable reduces risk further. Raise the budget or edit costs.</td></tr>
          )}
        </tbody>
      </table>

      {beyond.length > 0 && (
        <div style={{ marginTop: theme.spacing.xl }}>
          <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.sm }}>Next on the frontier (over budget)</div>
          {beyond.map(s => (
            <div key={s.item.id} onMouseEnter={() => p.onHoverItem(s.item)} onMouseLeave={() => p.onHoverItem(null)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
              <KindBadge kind={s.item.kind} />
              <span style={{ flex: 1 }}>{s.item.name}</span>
              <EditableCost value={s.item.cost} onChange={v => p.onSetCost(s.item.id, v)} />
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: theme.spacing.xl, fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, lineHeight: 1.6 }}>
        Costs are <strong>placeholder estimates</strong> by cost tier — click any cost to enter a real quote.
        {p.hasCostOverrides && <> <button onClick={p.onResetCosts} style={{ ...linkButton, color: theme.colors.blue }}>Reset edited costs</button>.</>}
        {" "}Each step adds the defense with the most risk removed per dollar at that point (a greedy heuristic, not a proven optimum).
        {p.vocabulary === 'd3fend'
          ? " D3FEND coverage follows D3FEND's inferred countermeasure links; costs are per base technique."
          : " Telemetry assumes you also run MITRE's analytics on it and respond to alerts."}
        {" "}<button onClick={p.onOpenModel} style={{ ...linkButton, color: theme.colors.blue }}>Model assumptions →</button>
      </div>
    </>
  );
}

const th = { padding: "6px 6px", fontWeight: 600, fontSize: "11px" } as const;
const td = { padding: "8px 6px", verticalAlign: "top" } as const;
