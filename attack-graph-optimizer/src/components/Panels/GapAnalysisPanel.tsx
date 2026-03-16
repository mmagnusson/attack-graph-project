// ─── GapAnalysisPanel — Control gap analysis grid ──

import { PopoutButton } from '../Analysis';

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
      <h3 style={{ fontSize: "11px", color: "#ef4444", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
        CONTROL GAP ANALYSIS
        {!popoutGapAnalysis && <PopoutButton onClick={() => setPopoutGapAnalysis(true)} title="Pop out Gap Analysis" />}
        <button onClick={exportRemediationPlan} disabled={gapAnalysis.gaps.length === 0} style={{
          background: "transparent", color: gapAnalysis.gaps.length === 0 ? "#475569" : "#ef4444",
          border: "1px solid " + (gapAnalysis.gaps.length === 0 ? "#334155" : "#ef4444"),
          borderRadius: "4px", padding: "3px 10px", fontSize: "9px", fontWeight: 700,
          cursor: gapAnalysis.gaps.length === 0 ? "default" : "pointer", fontFamily: "inherit",
          marginLeft: "auto", opacity: gapAnalysis.gaps.length === 0 ? 0.4 : 1,
        }}>EXPORT PLAN</button>
      </h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ background: "#ef444415", border: "1px solid #ef444433", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444" }}>{gapAnalysis.noCoverageCount}</div>
          <div style={{ fontSize: "8px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>No Coverage</div>
        </div>
        <div style={{ background: "#f59e0b15", border: "1px solid #f59e0b33", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b" }}>{gapAnalysis.notDeployedCount}</div>
          <div style={{ fontSize: "8px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Not Deployed</div>
        </div>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#e2e8f0" }}>{gapAnalysis.gaps.length}</div>
          <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Gaps</div>
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
          const tierColors: Record<string, string> = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#64748b" };
          return Object.entries(tiers).filter(([, n]) => n > 0).map(([tier, n]) => (
            <div key={tier} style={{ background: tierColors[tier] + "15", border: "1px solid " + tierColors[tier] + "33", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: tierColors[tier] }}>{n}</div>
              <div style={{ fontSize: "8px", color: tierColors[tier], textTransform: "uppercase", letterSpacing: "0.5px" }}>{tier}</div>
            </div>
          ));
        })()}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
        {gapAnalysis.gaps.map((gap: any) => {
          const tactic = fwConfig.tactics.find((ta: any) => ta.id === gap.tactic);
          const isNoCoverage = gap.gapType === "no-coverage";
          return (
            <div key={gap.id} onClick={() => setSelectedTech(gap.id)} style={{
              background: "#0a0f1a", border: "1px solid " + (isNoCoverage ? "#ef444433" : "#f59e0b33"),
              borderRadius: 6, padding: "10px 12px", cursor: "pointer",
              borderLeft: "3px solid " + (isNoCoverage ? "#ef4444" : "#f59e0b"),
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>
                    {gap.id} — {gap.name}
                  </div>
                  <div style={{ fontSize: "9px", color: tactic?.color, marginTop: "1px" }}>{tactic?.name}</div>
                </div>
                <span style={{
                  fontSize: "7px", fontWeight: 700, padding: "2px 6px", borderRadius: "8px",
                  background: isNoCoverage ? "#ef444425" : "#f59e0b25",
                  color: isNoCoverage ? "#ef4444" : "#f59e0b",
                  whiteSpace: "nowrap",
                }}>
                  {isNoCoverage ? "NO COVERAGE" : "NOT DEPLOYED"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", fontSize: "9px", marginBottom: "6px" }}>
                <span style={{ color: gap.exposure > 0.7 ? "#ef4444" : gap.exposure > 0.4 ? "#f59e0b" : "#22c55e" }}>
                  Exp: {(gap.exposure * 100).toFixed(0)}%
                </span>
                <span style={{ color: "#3b82f6" }}>BC: {(gap.bc * 100).toFixed(1)}%</span>
                <span style={{ color: "#6366f1" }}>Chains: {gap.cc}</span>
              </div>
              {gap.availableControls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                  {gap.availableControls.map((ctrl: any) => (
                    <span key={ctrl.id} style={{
                      fontSize: "7px", padding: "1px 4px", borderRadius: 2,
                      background: "#1e293b", color: "#94a3b8",
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
        <div style={{ textAlign: "center", color: "#22c55e", fontSize: "11px", padding: "20px" }}>
          All techniques have at least one deployed control.
        </div>
      )}
    </>
  );
}
