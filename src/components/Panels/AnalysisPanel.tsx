// ─── AnalysisPanel — Optimization analysis cards ──

// AnalysisPanel
import { AnalysisCard, PopoutButton } from '../Analysis';

interface AnalysisPanelProps {
  remediationBudget: number;
  optimal: { selected: string[]; chainsDisrupted: number; chainsTotal: number };
  activeTechniques: any[];
  betweenness: Record<string, number>;
  remediated: Set<string>;
  effectiveExposures: Record<string, number>;
  filteredChains: any[];
  totalDisrupted: number;
  compareMode: boolean;
  compareAnalysis: any;
  framework: string;
  otherFramework: string;
  popoutAnalysis: boolean;
  setPopoutAnalysis: (v: boolean) => void;
}

export function AnalysisPanel({
  remediationBudget, optimal, activeTechniques, betweenness, remediated,
  effectiveExposures, filteredChains, totalDisrupted,
  compareMode, compareAnalysis, framework, otherFramework,
  popoutAnalysis, setPopoutAnalysis,
}: AnalysisPanelProps) {
  return (
    <>
      <h3 style={{ fontSize: "11px", color: "#f59e0b", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
        OPTIMIZATION ANALYSIS
        {!popoutAnalysis && <PopoutButton onClick={() => setPopoutAnalysis(true)} title="Pop out Analysis" />}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <AnalysisCard title="Greedy Set Cover Result">
          <p>With a budget of <strong style={{ color: "#f59e0b" }}>{remediationBudget}</strong> remediations,
          the optimal selection disrupts <strong style={{ color: "#22c55e" }}>{optimal.chainsDisrupted}/{optimal.chainsTotal}</strong> attack chains.</p>
          <p style={{ marginTop: "6px" }}>Optimal targets: {optimal.selected.map((id: string) => {
            const t = activeTechniques.find((t: any) => t.id === id);
            return t ? id + " (" + t.name + ")" : id;
          }).join(", ")}</p>
          <p style={{ marginTop: "6px", color: "#64748b" }}>
            Algorithm: Greedy weighted maximum coverage. Each iteration selects the technique
            that covers the most remaining unchained paths, weighted by severity x exposure.
            Guaranteed {"\u2265"}63% of optimal (1 - 1/e approximation bound).
          </p>
        </AnalysisCard>
        <AnalysisCard title="Chokepoint Analysis">
          <p>Highest betweenness centrality nodes (most paths flow through):</p>
          {activeTechniques
            .map((t: any) => ({ ...t, bc: betweenness[t.id] ?? 0 }))
            .sort((a: any, b: any) => b.bc - a.bc)
            .slice(0, 5)
            .map((t: any, i: number) => (
              <div key={i} style={{ fontSize: "10px", marginTop: "4px" }}>
                <span style={{ color: "#f59e0b" }}>{t.id}</span> {t.name} — centrality: {(t.bc * 100).toFixed(1)}%
                {remediated.has(t.id) && <span style={{ color: "#22c55e" }}> {"\u2713"}</span>}
              </div>
            ))
          }
        </AnalysisCard>
        <AnalysisCard title="Risk Posture Summary">
          {(() => {
            const avgExposure = activeTechniques.reduce((s: number, t: any) => s + (effectiveExposures[t.id] ?? 1), 0) / activeTechniques.length;
            const highExposed = activeTechniques.filter((t: any) => (effectiveExposures[t.id] ?? 1) > 0.7).length;
            const disruptionRate = totalDisrupted / Math.max(filteredChains.length, 1);
            return (
              <>
                <p>Average node exposure: <strong style={{
                  color: avgExposure > 0.6 ? "#ef4444" : avgExposure > 0.3 ? "#f59e0b" : "#22c55e"
                }}>{(avgExposure * 100).toFixed(0)}%</strong></p>
                <p>High-exposure nodes ({">"}70%): <strong style={{ color: "#ef4444" }}>{highExposed}</strong> of {activeTechniques.length}</p>
                <p>Chain disruption rate: <strong style={{
                  color: disruptionRate > 0.8 ? "#22c55e" : disruptionRate > 0.5 ? "#f59e0b" : "#ef4444"
                }}>{(disruptionRate * 100).toFixed(0)}%</strong></p>
                <p style={{ marginTop: "6px", color: "#64748b" }}>
                  {disruptionRate === 1 ? "All known attack chains have at least one broken link." :
                    disruptionRate > 0.7 ? "Good coverage but some chains remain viable." :
                      disruptionRate > 0.4 ? "Moderate risk \u2014 several attack paths remain open." :
                        "Critical risk \u2014 majority of attack paths are unimpeded."}
                </p>
              </>
            );
          })()}
        </AnalysisCard>
        {compareMode && compareAnalysis && (
          <AnalysisCard title="IT/OT Convergence Analysis">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
              <div>
                <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>{framework === "ics" ? "ICS/OT" : "Enterprise"}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: framework === "ics" ? "#a855f7" : "#3b82f6" }}>{compareAnalysis.currentCount}</div>
                <div style={{ fontSize: "8px", color: "#64748b" }}>techniques</div>
              </div>
              <div>
                <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>{otherFramework === "ics" ? "ICS/OT" : "Enterprise"}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: otherFramework === "ics" ? "#a855f7" : "#3b82f6" }}>{compareAnalysis.otherCount}</div>
                <div style={{ fontSize: "8px", color: "#64748b" }}>techniques</div>
              </div>
            </div>
            <div style={{ padding: "6px 8px", background: "#06b6d410", borderRadius: "4px", marginBottom: "6px" }}>
              <span style={{ fontSize: "9px", color: "#06b6d4", fontWeight: 700 }}>{compareAnalysis.shared.size}</span>
              <span style={{ fontSize: "9px", color: "#94a3b8" }}> shared technique IDs (potential IT{"\u2194"}OT pivot points)</span>
            </div>
            <div style={{ fontSize: "9px", color: "#94a3b8" }}>
              Unique to {framework === "ics" ? "ICS" : "Enterprise"}: <strong style={{ color: "#f59e0b" }}>{compareAnalysis.uniqueCurrent.size}</strong>
              {" \u00B7 "}
              Unique to {otherFramework === "ics" ? "ICS" : "Enterprise"}: <strong style={{ color: "#f59e0b" }}>{compareAnalysis.uniqueOther.size}</strong>
            </div>
            {compareAnalysis.shared.size > 0 && (
              <div style={{ marginTop: "6px", fontSize: "8px", color: "#64748b" }}>
                Shared IDs: {[...compareAnalysis.shared].slice(0, 10).join(", ")}{compareAnalysis.shared.size > 10 ? " ..." : ""}
              </div>
            )}
          </AnalysisCard>
        )}
      </div>
    </>
  );
}
