// ─── GapAnalysisPanel — Control gap analysis grid ──

import { PopoutButton } from '../Analysis';
import { theme } from '../../theme';

interface GapAnalysisPanelProps {
  gapAnalysis: { gaps: any[]; noCoverageCount: number; notDeployedCount: number };
  fwConfig: any;
  setSelectedTech: (v: string | null) => void;
  exportRemediationPlan: () => void;
  popoutGapAnalysis: boolean;
  setPopoutGapAnalysis: (v: boolean) => void;
}

export function GapAnalysisPanel({
  gapAnalysis, fwConfig, setSelectedTech, exportRemediationPlan,
  popoutGapAnalysis, setPopoutGapAnalysis,
}: GapAnalysisPanelProps) {
  return (
    <>
      <h3 style={{ fontSize: theme.fontSizes.body, color: theme.colors.red, margin: "0 0 14px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: theme.spacing.lg }}>
        CONTROL GAP ANALYSIS
        {!popoutGapAnalysis && <PopoutButton onClick={() => setPopoutGapAnalysis(true)} title="Pop out Gap Analysis" />}
        <button onClick={exportRemediationPlan} disabled={gapAnalysis.gaps.length === 0} style={{
          background: "transparent", color: gapAnalysis.gaps.length === 0 ? theme.colors.textFaint : theme.colors.red,
          border: "1px solid " + (gapAnalysis.gaps.length === 0 ? theme.colors.border : theme.colors.red),
          borderRadius: theme.radii.sm, padding: theme.spacing.sm + " " + theme.spacing.lg, fontSize: theme.fontSizes.small, fontWeight: 700,
          cursor: gapAnalysis.gaps.length === 0 ? "default" : "pointer", fontFamily: "inherit",
          marginLeft: "auto", opacity: gapAnalysis.gaps.length === 0 ? 0.4 : 1,
        }}>EXPORT PLAN</button>
      </h3>
      <div style={{ display: "flex", gap: theme.spacing.xl, marginBottom: theme.spacing.xl, flexWrap: "wrap" }}>
        <div style={{ background: theme.colors.red + "15", border: "1px solid #ef444433", borderRadius: theme.radii.md, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center" }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: theme.colors.red }}>{gapAnalysis.noCoverageCount}</div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.red, textTransform: "uppercase", letterSpacing: "0.5px" }}>No Coverage</div>
        </div>
        <div style={{ background: theme.colors.orange + "15", border: "1px solid #f59e0b33", borderRadius: theme.radii.md, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center" }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: theme.colors.orange }}>{gapAnalysis.notDeployedCount}</div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.orange, textTransform: "uppercase", letterSpacing: "0.5px" }}>Not Deployed</div>
        </div>
        <div style={{ background: theme.colors.bgSurface, border: "1px solid " + theme.colors.border, borderRadius: theme.radii.md, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center" }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: theme.colors.textBody }}>{gapAnalysis.gaps.length}</div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Gaps</div>
        </div>
        {gapAnalysis.gaps.length > 0 && (() => {
          const tiers: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
          gapAnalysis.gaps.forEach((g: any) => {
            const s = g.riskScore;
            if (s > 0.5) tiers.Critical++;
            else if (s > 0.2) tiers.High++;
            else if (s > 0.05) tiers.Medium++;
            else tiers.Low++;
          });
          const tierColors: Record<string, string> = { Critical: theme.colors.red, High: "#f97316", Medium: theme.colors.orange, Low: theme.colors.textMuted };
          return Object.entries(tiers).filter(([, n]) => n > 0).map(([tier, n]) => (
            <div key={tier} style={{ background: tierColors[tier] + "15", border: "1px solid " + tierColors[tier] + "33", borderRadius: theme.radii.md, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center" }}>
              <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: tierColors[tier] }}>{n}</div>
              <div style={{ fontSize: theme.fontSizes.tiny, color: tierColors[tier], textTransform: "uppercase", letterSpacing: "0.5px" }}>{tier}</div>
            </div>
          ));
        })()}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: theme.spacing.lg }}>
        {gapAnalysis.gaps.map((gap: any) => {
          const tactic = fwConfig.tactics.find((ta: any) => ta.id === gap.tactic);
          const isNoCoverage = gap.gapType === "no-coverage";
          return (
            <div key={gap.id} onClick={() => setSelectedTech(gap.id)} style={{
              background: theme.colors.bg, border: "1px solid " + (isNoCoverage ? theme.colors.red + "33" : theme.colors.orange + "33"),
              borderRadius: theme.radii.md, padding: theme.spacing.lg + " " + theme.spacing.xl, cursor: "pointer",
              borderLeft: "3px solid " + (isNoCoverage ? theme.colors.red : theme.colors.orange),
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.md }}>
                <div>
                  <div style={{ fontSize: theme.fontSizes.body, fontWeight: 600, color: theme.colors.textPrimary }}>
                    {gap.id} — {gap.name}
                  </div>
                  <div style={{ fontSize: theme.fontSizes.small, color: tactic?.color, marginTop: "2px" }}>{tactic?.name}</div>
                </div>
                <span style={{
                  fontSize: theme.fontSizes.micro, fontWeight: 700, padding: "3px 8px", borderRadius: theme.radii.pill,
                  background: isNoCoverage ? theme.colors.red + "25" : theme.colors.orange + "25",
                  color: isNoCoverage ? theme.colors.red : theme.colors.orange,
                  whiteSpace: "nowrap",
                }}>
                  {isNoCoverage ? "NO COVERAGE" : "NOT DEPLOYED"}
                </span>
              </div>
              <div style={{ display: "flex", gap: theme.spacing.lg, fontSize: theme.fontSizes.small, marginBottom: theme.spacing.md }}>
                <span style={{ color: gap.exposure > 0.7 ? theme.colors.red : gap.exposure > 0.4 ? theme.colors.orange : theme.colors.green }}>
                  Exp: {(gap.exposure * 100).toFixed(0)}%
                </span>
                <span style={{ color: theme.colors.blue }}>BC: {(gap.bc * 100).toFixed(1)}%</span>
                <span style={{ color: theme.colors.indigo }}>Chains: {gap.cc}</span>
              </div>
              {gap.availableControls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.xs }}>
                  {gap.availableControls.map((ctrl: any) => (
                    <span key={ctrl.id} style={{
                      fontSize: theme.fontSizes.micro, padding: "2px 6px", borderRadius: theme.radii.sm,
                      background: theme.colors.bgSurface, color: theme.colors.textSecondary,
                    }}>
                      {ctrl.name} ({ctrl.cost})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {gapAnalysis.gaps.length === 0 && (
        <div style={{ textAlign: "center", color: theme.colors.green, fontSize: theme.fontSizes.body, padding: "24px" }}>
          All techniques have at least one deployed control.
        </div>
      )}
    </>
  );
}
