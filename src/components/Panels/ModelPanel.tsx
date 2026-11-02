// ─── ModelPanel — assumptions, required gates, actor set, sensitivity ───────

import type { FrameworkConfig, FrameworkId, ModelParams } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { DEFAULT_MODEL_PARAMS } from '../../engine/riskModel';
import { fmtPct } from '../../engine/displayMetrics';
import { PanelTitle, SmallButton } from '../ui';
import { theme } from '../../theme';

interface CompareAnalysis {
  currentCount: number;
  otherCount: number;
  shared: Set<string>;
  uniqueCurrent: number;
  uniqueOther: number;
}

interface ModelPanelProps {
  cfg: FrameworkConfig;
  rm: RiskModelView;
  params: ModelParams;
  setParams: (p: ModelParams) => void;
  gates: string[];
  setGates: (g: string[]) => void;
  includeSoftware: boolean;
  setIncludeSoftware: (v: boolean) => void;
  includeCampaigns: boolean;
  setIncludeCampaigns: (v: boolean) => void;
  compareAnalysis: CompareAnalysis | null;
  otherFramework: FrameworkId;
}

const SLIDERS: { key: keyof ModelParams; label: string; help: string }[] = [
  { key: 'mitigationEffectiveness', label: 'Mitigation effectiveness', help: "How much one implemented mitigation cuts a technique's success chance. Each additional mitigation on the same technique counts half as much as the one before (overlapping controls are correlated)." },
  { key: 'detectionEffectiveness', label: 'Detection effectiveness', help: 'Chance that an attempt on a technique whose MITRE analytics are fully fed with telemetry raises an actionable alert (tuned, triaged, not lost in noise).' },
  { key: 'responseEffectiveness', label: 'Response effectiveness', help: 'Chance an alerted intrusion is contained before its objective. Applied once per intrusion: detection alone can never remove more than this share of an actor\'s viability.' },
  { key: 'substitutionRate', label: 'Substitution rate', help: "Chance an actor gets through a stage with a technique MITRE hasn't recorded for it. Sets a floor: no stage can be closed completely." },
  { key: 'adversaryAdaptiveness', label: 'Adversary adaptiveness', help: '0% = actors pick techniques blind to your detections. 100% = they always use your least-covered option, so detection needs breadth too.' },
];

export function ModelPanel(p: ModelPanelProps) {
  const { cfg, rm, params } = p;
  const isDefault = SLIDERS.every(s => Math.abs(params[s.key] - DEFAULT_MODEL_PARAMS[s.key]) < 1e-9);
  const toggleGate = (id: string) => p.setGates(p.gates.includes(id) ? p.gates.filter(g => g !== id) : [...p.gates, id]);

  return (
    <>
      <PanelTitle color={theme.colors.blue} right={!isDefault && <SmallButton onClick={() => p.setParams(DEFAULT_MODEL_PARAMS)}>RESET DEFAULTS</SmallButton>}>
        MODEL & ASSUMPTIONS
      </PanelTitle>
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.65, marginBottom: theme.spacing.xl }}>
        An intrusion has to pass every <strong style={{ color: theme.colors.textPrimary }}>required stage</strong> below. At each stage the actor
        can use <em>any</em> technique MITRE has recorded for it, so a stage only closes when all of the actor's options are covered.
        Mitigations lower each technique's chance of working; telemetry lets MITRE's analytics raise an alert, and your response
        contains an alerted intrusion with some probability. An actor's <strong style={{ color: theme.colors.textPrimary }}>viability</strong> is the chance it
        gets through every stage and is not contained; residual risk is the average viability across modeled actors.
      </div>

      {SLIDERS.map(s => (
        <div key={s.key} style={{ marginBottom: theme.spacing.lg }}>
          <label style={{ display: "flex", justifyContent: "space-between", fontSize: theme.fontSizes.small, color: theme.colors.textBody, marginBottom: 2 }}>
            <span>{s.label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtPct(params[s.key])}</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(params[s.key] * 100)} aria-label={s.label}
            onChange={e => p.setParams({ ...params, [s.key]: Number(e.target.value) / 100 })}
            style={{ width: "100%", accentColor: theme.colors.blue }} />
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, lineHeight: 1.5 }}>{s.help}</div>
        </div>
      ))}

      <div style={{ ...theme.sectionLabel, margin: "20px 0 8px" }}>Required stages</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 4 }}>
        {cfg.gateOptions.map(g => (
          <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, cursor: "pointer" }}>
            <input type="checkbox" checked={p.gates.includes(g.id)} onChange={() => toggleGate(g.id)} disabled={p.gates.length === 1 && p.gates.includes(g.id)} />
            {g.label}
          </label>
        ))}
      </div>
      <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: 6, lineHeight: 1.5 }}>
        More stages means more chances to stop an actor. Defaults: {cfg.gateOptions.filter(g => cfg.defaultGates.includes(g.id)).map(g => g.label).join(', ')}.
        {" "}{p.gates.join() !== cfg.defaultGates.join() && <button onClick={() => p.setGates(cfg.defaultGates)} style={{ background: "transparent", border: "none", color: theme.colors.blue, cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit" }}>Restore defaults</button>}
      </div>

      <div style={{ ...theme.sectionLabel, margin: "20px 0 8px" }}>Actors</div>
      <label style={{ display: "flex", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, marginBottom: 6, cursor: "pointer" }}>
        <input type="checkbox" checked={p.includeSoftware} onChange={e => p.setIncludeSoftware(e.target.checked)} />
        <span>Count techniques used through an actor's malware and tools <span style={{ color: theme.colors.textMuted }}>(roughly triples the median actor's options)</span></span>
      </label>
      <label style={{ display: "flex", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, cursor: "pointer" }}>
        <input type="checkbox" checked={p.includeCampaigns} onChange={e => p.setIncludeCampaigns(e.target.checked)} />
        <span>Model campaigns alongside groups <span style={{ color: theme.colors.textMuted }}>(campaigns attributed to a group overlap with it)</span></span>
      </label>

      {rm.sensitivity && (
        <div style={{ marginTop: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bgCard, border: "1px solid " + theme.colors.borderSubtle, borderRadius: theme.radii.md }}>
          <div style={{ ...theme.sectionLabel, marginBottom: 6 }}>Sensitivity of the current plan</div>
          <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, lineHeight: 1.6 }}>
            Risk reduction <strong>{fmtPct(rm.plan && rm.plan.baselineRisk > 0 ? 1 - rm.plan.finalRisk / rm.plan.baselineRisk : 0)}</strong> at these settings;
            {" "}{fmtPct(rm.sensitivity.low)} with pessimistic and {fmtPct(rm.sensitivity.high)} with optimistic assumptions
            (effectiveness and response ±20 pts, substitution 25%/5%, adaptiveness 80%/20%).
          </div>
        </div>
      )}

      {p.compareAnalysis && (
        <div style={{ marginTop: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bgCard, border: "1px solid " + theme.colors.borderSubtle, borderRadius: theme.radii.md }}>
          <div style={{ ...theme.sectionLabel, marginBottom: 6 }}>IT/OT convergence</div>
          <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, lineHeight: 1.6 }}>
            {p.compareAnalysis.currentCount} {cfg.label} vs {p.compareAnalysis.otherCount} {p.otherFramework === 'ics' ? 'ICS/OT' : 'Enterprise'} parent techniques;
            {" "}<strong>{p.compareAnalysis.shared.size}</strong> shared IDs (potential pivot points).
            {p.compareAnalysis.shared.size > 0 && <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.tiny }}>{[...p.compareAnalysis.shared].slice(0, 12).join(', ')}</div>}
          </div>
        </div>
      )}
    </>
  );
}
