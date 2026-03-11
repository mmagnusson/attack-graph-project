import React from 'react';
import { TACTICS } from '../../data/constants';
import { PopoutButton } from '../Analysis/PopoutButton';
import type { Technique, Tactic, SecurityControl } from '../../types';

interface ChainStatus {
  broken: boolean;
}

interface OptimalResult {
  selected: string[];
}

interface ExecutiveSummaryProps {
  techniques: Technique[];
  exposures: Record<string, number>;
  betweenness: Record<string, number>;
  chainCoverage: Record<string, number>;
  filteredChains: any[];
  chainStatus: ChainStatus[];
  remediated: Set<string>;
  optimal: OptimalResult;
  deployedControls: Set<string>;
  popout?: boolean;
  onPopout?: () => void;
  tactics?: Tactic[];
  securityControls?: SecurityControl[];
}

export function ExecutiveSummary({ techniques, exposures, betweenness, chainCoverage, filteredChains,
  chainStatus, remediated, optimal, deployedControls, popout, onPopout, tactics: tacticsProp, securityControls: secControlsProp }: ExecutiveSummaryProps) {
  const tacticsArr = tacticsProp || TACTICS;
  const controlsArr = secControlsProp || [];
  const avgExposure = techniques.reduce((s, t) => s + (exposures[t.id] ?? 1), 0) / Math.max(techniques.length, 1);
  const highExposed = techniques.filter(t => (exposures[t.id] ?? 1) > 0.7).length;
  const totalDisrupted = chainStatus.filter(c => c.broken).length;
  const disruptionRate = totalDisrupted / Math.max(filteredChains.length, 1);
  const riskScore = Math.round(Math.min(100, (avgExposure * 40 + (1 - disruptionRate) * 35 + (highExposed / Math.max(techniques.length, 1)) * 25)));
  const riskColor = riskScore > 70 ? "#ef4444" : riskScore > 40 ? "#f59e0b" : "#22c55e";

  const topRisks = techniques
    .map(t => ({ ...t, exposure: exposures[t.id] ?? 1, bc: betweenness[t.id] ?? 0, cc: chainCoverage[t.id] ?? 0 }))
    .sort((a, b) => (b.exposure * b.bc) - (a.exposure * a.bc))
    .filter(t => !remediated.has(t.id))
    .slice(0, 5);

  const tacticExposures: Record<string, { avg: number; count: number; name: string; color: string }> = {};
  tacticsArr.forEach(tac => {
    const tacTechs = techniques.filter(t => t.tactic === tac.id);
    if (tacTechs.length === 0) return;
    const avg = tacTechs.reduce((s, t) => s + (exposures[t.id] ?? 1), 0) / tacTechs.length;
    tacticExposures[tac.id] = { avg, count: tacTechs.length, name: tac.name, color: tac.color || '#6366f1' };
  });
  const coverageGaps = Object.values(tacticExposures).sort((a, b) => b.avg - a.avg).slice(0, 5);

  const topUndeployedControls = controlsArr
    .filter(c => !deployedControls.has(c.id))
    .map(c => {
      const totalReduction = Object.values(c.coverage).reduce((s: number, v: any) => s + Math.abs(v as number), 0);
      return { ...c, impact: totalReduction };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const sectionStyle = { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "16px 20px", marginBottom: 12 };
  const labelStyle: React.CSSProperties = { fontSize: "9px", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 8 };

  return (
    <>
      <h3 style={{ fontSize: "12px", color: "#06b6d4", margin: "0 0 14px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
        EXECUTIVE SUMMARY
        {!popout && onPopout && <PopoutButton onClick={onPopout} title="Pop out Executive Summary" />}
      </h3>

      <div style={{ ...sectionStyle, textAlign: "center" }}>
        <div style={labelStyle}>Overall Risk Score</div>
        <div style={{ fontSize: "48px", fontWeight: 700, color: riskColor, lineHeight: 1.1 }}>{riskScore}</div>
        <div style={{ fontSize: "10px", color: "#64748b", marginTop: 4 }}>
          {riskScore > 70 ? "Critical — Immediate action required" : riskScore > 40 ? "Moderate — Improvements recommended" : "Good — Maintain current posture"}
        </div>
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Key Metrics</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { label: "Techniques", value: techniques.length, color: "#6366f1" },
            { label: "Attack Chains", value: filteredChains.length, color: "#8b5cf6" },
            { label: "Disruption Rate", value: (disruptionRate * 100).toFixed(0) + "%", color: disruptionRate > 0.7 ? "#22c55e" : "#f59e0b" },
            { label: "Avg Exposure", value: (avgExposure * 100).toFixed(0) + "%", color: avgExposure > 0.6 ? "#ef4444" : "#f59e0b" },
            { label: "Remediated", value: remediated.size, color: "#22c55e" },
            { label: "Controls Deployed", value: deployedControls.size, color: "#14b8a6" },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: "8px", color: "#64748b" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Top 5 Risks</div>
        {topRisks.map((t, i) => {
          const tactic = tacticsArr.find(ta => ta.id === t.tactic);
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? "1px solid #1e293b" : "none" }}>
              <span style={{ fontSize: "12px", color: "#475569", width: 20, fontWeight: 700 }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>{t.id} — {t.name}</div>
                <div style={{ fontSize: "9px", color: tactic?.color }}>{tactic?.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: t.exposure > 0.7 ? "#ef4444" : "#f59e0b" }}>{(t.exposure * 100).toFixed(0)}%</div>
                <div style={{ fontSize: "8px", color: "#475569" }}>exposure</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Coverage Gaps (Highest Exposure Tactics)</div>
        {coverageGaps.map((tac, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: 2 }}>
              <span style={{ color: tac.color }}>{tac.name}</span>
              <span style={{ color: tac.avg > 0.7 ? "#ef4444" : "#f59e0b" }}>{(tac.avg * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (tac.avg * 100) + "%", background: tac.color, borderRadius: 3, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Recommended Actions</div>
        <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: 8 }}>Top remediation targets:</div>
        {optimal.selected.slice(0, 3).map((id, i) => {
          const t = techniques.find(t => t.id === id);
          return (
            <div key={id} style={{ fontSize: "10px", color: "#f59e0b", padding: "3px 0" }}>
              {i + 1}. Remediate <strong>{id}</strong>{t ? " (" + t.name + ")" : ""}
            </div>
          );
        })}
        {topUndeployedControls.length > 0 && (
          <>
            <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: 10, marginBottom: 4 }}>Top undeployed controls:</div>
            {topUndeployedControls.map((c, i) => (
              <div key={c.id} style={{ fontSize: "10px", color: "#14b8a6", padding: "3px 0" }}>
                {i + 1}. Deploy <strong>{c.name}</strong> ({c.cost})
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Tactic Exposure Heatmap</div>
        {tacticsArr.map(tac => {
          const info = tacticExposures[tac.id];
          if (!info) return null;
          return (
            <div key={tac.id} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: 1 }}>
                <span style={{ color: tac.color }}>{tac.name}</span>
                <span style={{ color: "#64748b" }}>{(info.avg * 100).toFixed(0)}% ({info.count})</span>
              </div>
              <div style={{ height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: (info.avg * 100) + "%", borderRadius: 4,
                  background: info.avg > 0.7 ? "#ef4444" : info.avg > 0.4 ? "#f59e0b" : "#22c55e",
                  opacity: 0.8,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
