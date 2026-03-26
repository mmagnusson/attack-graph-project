// ─── ExposureSummaryPanel — Environment coverage summary with metrics ──

// ExposureSummaryPanel
import { theme } from '../../theme';

interface ExposureSummaryPanelProps {
  exposureSummary: {
    avgExposure: number;
    totalCoverage: number;
    highExposed: number;
    wellCovered: number;
    uncoveredChokepoints: any[];
    totalTechniques: number;
  };
  environmentProfile: any;
  displayTechniques: any[];
  setSelectedTech: (v: string | null) => void;
  exportCoverageCSV: () => void;
  setEnvironmentProfile: (v: any) => void;
  setProfileExposures: (v: any) => void;
}

export function ExposureSummaryPanel({
  exposureSummary, environmentProfile, displayTechniques,
  setSelectedTech, exportCoverageCSV,
  setEnvironmentProfile, setProfileExposures,
}: ExposureSummaryPanelProps) {
  return (
    <div style={{
      borderTop: "1px solid " + theme.colors.borderSubtle, padding: theme.spacing.xl + " " + theme.spacing.xxl,
      background: theme.colors.bgPanel, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: theme.fontSizes.body, color: theme.colors.violet, margin: 0, letterSpacing: "0.5px" }}>
          ENVIRONMENT COVERAGE SUMMARY
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportCoverageCSV} style={{
            background: "transparent", color: theme.colors.violet, border: "1px solid " + theme.colors.violet, borderRadius: theme.radii.sm,
            padding: theme.spacing.sm + " " + theme.spacing.lg, fontSize: theme.fontSizes.small, cursor: "pointer", fontFamily: "inherit",
          }}>EXPORT CSV</button>
          <button onClick={() => { setEnvironmentProfile(null); setProfileExposures(null); }} style={{
            background: "transparent", color: theme.colors.textMuted, border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
            padding: theme.spacing.sm + " " + theme.spacing.lg, fontSize: theme.fontSizes.small, cursor: "pointer", fontFamily: "inherit",
          }}>CLEAR</button>
        </div>
      </div>

      {/* Metric cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: theme.spacing.lg, marginBottom: 12 }}>
        <div style={{ background: theme.colors.bgCard, borderRadius: theme.radii.sm, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center", border: "1px solid " + theme.colors.borderSubtle }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: exposureSummary.avgExposure > 0.6 ? theme.colors.red : exposureSummary.avgExposure > 0.35 ? theme.colors.orange : theme.colors.green }}>
            {(exposureSummary.avgExposure * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: 4 }}>Avg Exposure</div>
        </div>
        <div style={{ background: theme.colors.bgCard, borderRadius: theme.radii.sm, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center", border: "1px solid " + theme.colors.borderSubtle }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: theme.colors.green }}>
            {(exposureSummary.totalCoverage * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: 4 }}>Avg Coverage</div>
        </div>
        <div style={{ background: theme.colors.bgCard, borderRadius: theme.radii.sm, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center", border: "1px solid " + theme.colors.red + "20" }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: theme.colors.red }}>
            {exposureSummary.highExposed}
          </div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: 4 }}>Exposed ({">"}70%)</div>
        </div>
        <div style={{ background: theme.colors.bgCard, borderRadius: theme.radii.sm, padding: theme.spacing.lg + " " + theme.spacing.xl, textAlign: "center", border: "1px solid " + theme.colors.green + "20" }}>
          <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: theme.colors.green }}>
            {exposureSummary.wellCovered}
          </div>
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: 4 }}>Covered ({"<"}30%)</div>
        </div>
      </div>

      {/* Top uncovered chokepoints */}
      {exposureSummary.uncoveredChokepoints.length > 0 && (
        <div style={{ background: theme.colors.bgCard, borderRadius: theme.radii.sm, padding: theme.spacing.lg, border: "1px solid " + theme.colors.borderSubtle }}>
          <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>
            Top Uncovered Chokepoints
          </div>
          {exposureSummary.uncoveredChokepoints.map((cp: any) => {
            const tech = displayTechniques.find((t: any) => t.id === cp.tid);
            return (
              <div key={cp.tid} style={{ display: "flex", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.xs, cursor: "pointer" }}
                onClick={() => setSelectedTech(cp.tid)}>
                <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.red, fontWeight: 700, width: 70, flexShrink: 0, fontFamily: '"JetBrains Mono", monospace' }}>{cp.tid}</span>
                <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tech?.name || cp.tid}
                </span>
                <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.red }}>{(cp.exposure * 100).toFixed(0)}% exp</span>
                <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.orange }}>{(cp.bc * 100).toFixed(0)}% bc</span>
                <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>{cp.cc} chains</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint, marginTop: theme.spacing.md }}>
        {exposureSummary.totalTechniques} techniques analyzed
        {environmentProfile.securityTools && <span> | {environmentProfile.securityTools.length} tools</span>}
        {environmentProfile.infrastructure && <span> | {environmentProfile.infrastructure.length} infra</span>}
      </div>
    </div>
  );
}
