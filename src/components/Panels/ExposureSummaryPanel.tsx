// ─── ExposureSummaryPanel — Environment coverage summary with metrics ──

// ExposureSummaryPanel

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
      borderTop: "1px solid #1e293b", padding: "12px 24px",
      background: "#0d1321", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontSize: "11px", color: "#8b5cf6", margin: 0, letterSpacing: "0.5px" }}>
          ENVIRONMENT COVERAGE SUMMARY
        </h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={exportCoverageCSV} style={{
            background: "transparent", color: "#8b5cf6", border: "1px solid #8b5cf6", borderRadius: 3,
            padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit",
          }}>EXPORT CSV</button>
          <button onClick={() => { setEnvironmentProfile(null); setProfileExposures(null); }} style={{
            background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 3,
            padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit",
          }}>CLEAR</button>
        </div>
      </div>

      {/* Metric cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
        <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #1e293b" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: exposureSummary.avgExposure > 0.6 ? "#ef4444" : exposureSummary.avgExposure > 0.35 ? "#f59e0b" : "#22c55e" }}>
            {(exposureSummary.avgExposure * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Avg Exposure</div>
        </div>
        <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #1e293b" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
            {(exposureSummary.totalCoverage * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Avg Coverage</div>
        </div>
        <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #ef444420" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>
            {exposureSummary.highExposed}
          </div>
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Exposed ({">"}70%)</div>
        </div>
        <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #22c55e20" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
            {exposureSummary.wellCovered}
          </div>
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Covered ({"<"}30%)</div>
        </div>
      </div>

      {/* Top uncovered chokepoints */}
      {exposureSummary.uncoveredChokepoints.length > 0 && (
        <div style={{ background: "#111827", borderRadius: 4, padding: 8, border: "1px solid #1e293b" }}>
          <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            Top Uncovered Chokepoints
          </div>
          {exposureSummary.uncoveredChokepoints.map((cp: any) => {
            const tech = displayTechniques.find((t: any) => t.id === cp.tid);
            return (
              <div key={cp.tid} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, cursor: "pointer" }}
                onClick={() => setSelectedTech(cp.tid)}>
                <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, width: 65, flexShrink: 0 }}>{cp.tid}</span>
                <span style={{ fontSize: 9, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tech?.name || cp.tid}
                </span>
                <span style={{ fontSize: 8, color: "#ef4444" }}>{(cp.exposure * 100).toFixed(0)}% exp</span>
                <span style={{ fontSize: 8, color: "#f59e0b" }}>{(cp.bc * 100).toFixed(0)}% bc</span>
                <span style={{ fontSize: 8, color: "#64748b" }}>{cp.cc} chains</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 8, color: "#475569", marginTop: 6 }}>
        {exposureSummary.totalTechniques} techniques analyzed
        {environmentProfile.securityTools && <span> | {environmentProfile.securityTools.length} tools</span>}
        {environmentProfile.infrastructure && <span> | {environmentProfile.infrastructure.length} infra</span>}
      </div>
    </div>
  );
}
