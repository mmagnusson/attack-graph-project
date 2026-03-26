// ─── AnalysisPanel — Optimization analysis cards ──

// AnalysisPanel
import { AnalysisCard, PopoutButton } from '../Analysis';
import { theme } from '../../theme';

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
      <h3 style={{ fontSize: theme.fontSizes.body, color: theme.colors.orange, margin: "0 0 14px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
        OPTIMIZATION ANALYSIS
        {!popoutAnalysis && <PopoutButton onClick={() => setPopoutAnalysis(true)} title="Pop out Analysis" />}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: theme.spacing.xl }}>
        <AnalysisCard title="Greedy Set Cover Result">
          <p>With a budget of <strong style={{ color: theme.colors.orange }}>{remediationBudget}</strong> remediations,
          the optimal selection disrupts <strong style={{ color: theme.colors.green }}>{optimal.chainsDisrupted}/{optimal.chainsTotal}</strong> attack chains.</p>
          <p style={{ marginTop: theme.spacing.md }}>Optimal targets: {optimal.selected.map((id: string) => {
            const t = activeTechniques.find((t: any) => t.id === id);
            return t ? id + " (" + t.name + ")" : id;
          }).join(", ")}</p>
          <p style={{ marginTop: theme.spacing.md, color: theme.colors.textMuted }}>
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
              <div key={i} style={{ fontSize: theme.fontSizes.base, marginTop: theme.spacing.sm }}>
                <span style={{ color: theme.colors.orange }}>{t.id}</span> {t.name} — centrality: {(t.bc * 100).toFixed(1)}%
                {remediated.has(t.id) && <span style={{ color: theme.colors.green }}> {"\u2713"}</span>}
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
                  color: avgExposure > 0.6 ? theme.colors.red : avgExposure > 0.3 ? theme.colors.orange : theme.colors.green
                }}>{(avgExposure * 100).toFixed(0)}%</strong></p>
                <p>High-exposure nodes ({">"}70%): <strong style={{ color: theme.colors.red }}>{highExposed}</strong> of {activeTechniques.length}</p>
                <p>Chain disruption rate: <strong style={{
                  color: disruptionRate > 0.8 ? theme.colors.green : disruptionRate > 0.5 ? theme.colors.orange : theme.colors.red
                }}>{(disruptionRate * 100).toFixed(0)}%</strong></p>
                <p style={{ marginTop: theme.spacing.md, color: theme.colors.textMuted }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
              <div>
                <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, textTransform: "uppercase" }}>{framework === "ics" ? "ICS/OT" : "Enterprise"}</div>
                <div style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: framework === "ics" ? theme.colors.purple : theme.colors.blue }}>{compareAnalysis.currentCount}</div>
                <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>techniques</div>
              </div>
              <div>
                <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, textTransform: "uppercase" }}>{otherFramework === "ics" ? "ICS/OT" : "Enterprise"}</div>
                <div style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: otherFramework === "ics" ? theme.colors.purple : theme.colors.blue }}>{compareAnalysis.otherCount}</div>
                <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>techniques</div>
              </div>
            </div>
            <div style={{ padding: "8px 10px", background: "#06b6d410", borderRadius: theme.radii.sm, marginBottom: theme.spacing.md }}>
              <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.cyan, fontWeight: 700 }}>{compareAnalysis.shared.size}</span>
              <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}> shared technique IDs (potential IT{"\u2194"}OT pivot points)</span>
            </div>
            <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
              Unique to {framework === "ics" ? "ICS" : "Enterprise"}: <strong style={{ color: theme.colors.orange }}>{compareAnalysis.uniqueCurrent.size}</strong>
              {" \u00B7 "}
              Unique to {otherFramework === "ics" ? "ICS" : "Enterprise"}: <strong style={{ color: theme.colors.orange }}>{compareAnalysis.uniqueOther.size}</strong>
            </div>
            {compareAnalysis.shared.size > 0 && (
              <div style={{ marginTop: theme.spacing.md, fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>
                Shared IDs: {[...compareAnalysis.shared].slice(0, 10).join(", ")}{compareAnalysis.shared.size > 10 ? " ..." : ""}
              </div>
            )}
          </AnalysisCard>
        )}
      </div>
    </>
  );
}
