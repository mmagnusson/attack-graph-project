import React from 'react';
import { TACTICS } from '../../data/constants';
import { PopoutButton } from '../Analysis/PopoutButton';
import { theme } from '../../theme';
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
  const riskColor = riskScore > 70 ? theme.colors.red : riskScore > 40 ? theme.colors.orange : theme.colors.green;

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

  const sectionStyle = { background: theme.colors.bgCard, border: "1px solid " + theme.colors.borderSubtle, borderRadius: 8, padding: "18px 22px", marginBottom: 14 };
  const labelStyle: React.CSSProperties = { ...theme.sectionLabel, marginBottom: 10 };

  return (
    <>
      <h3 style={{ fontSize: theme.fontSizes.medium, color: theme.colors.cyan, margin: "0 0 16px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
        EXECUTIVE SUMMARY
        {!popout && onPopout && <PopoutButton onClick={onPopout} title="Pop out Executive Summary" />}
      </h3>

      <div style={{ ...sectionStyle, textAlign: "center" }}>
        <div style={labelStyle}>Overall Risk Score</div>
        <div style={{ fontSize: theme.fontSizes.hero, fontWeight: 700, color: riskColor, lineHeight: 1.1 }}>{riskScore}</div>
        <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.textMuted, marginTop: 6 }}>
          {riskScore > 70 ? "Critical — Immediate action required" : riskScore > 40 ? "Moderate — Improvements recommended" : "Good — Maintain current posture"}
        </div>
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Key Metrics</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: theme.spacing.xl }}>
          {[
            { label: "Techniques", value: techniques.length, color: theme.colors.indigo },
            { label: "Attack Chains", value: filteredChains.length, color: theme.colors.violet },
            { label: "Disruption Rate", value: (disruptionRate * 100).toFixed(0) + "%", color: disruptionRate > 0.7 ? theme.colors.green : theme.colors.orange },
            { label: "Avg Exposure", value: (avgExposure * 100).toFixed(0) + "%", color: avgExposure > 0.6 ? theme.colors.red : theme.colors.orange },
            { label: "Remediated", value: remediated.size, color: theme.colors.green },
            { label: "Controls Deployed", value: deployedControls.size, color: theme.colors.teal },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: theme.fontSizes.display, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Top 5 Risks</div>
        {topRisks.map((t, i) => {
          const tactic = tacticsArr.find(ta => ta.id === t.tactic);
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 4 ? "1px solid " + theme.colors.borderSubtle : "none" }}>
              <span style={{ fontSize: theme.fontSizes.medium, color: theme.colors.textFaint, width: 24, fontWeight: 700 }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: theme.fontSizes.body, fontWeight: 600, color: theme.colors.textPrimary }}>{t.id} — {t.name}</div>
                <div style={{ fontSize: theme.fontSizes.small, color: tactic?.color }}>{tactic?.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: theme.fontSizes.medium, fontWeight: 700, color: t.exposure > 0.7 ? theme.colors.red : theme.colors.orange }}>{(t.exposure * 100).toFixed(0)}%</div>
                <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint }}>exposure</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Coverage Gaps (Highest Exposure Tactics)</div>
        {coverageGaps.map((tac, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: theme.fontSizes.base, marginBottom: 3 }}>
              <span style={{ color: tac.color }}>{tac.name}</span>
              <span style={{ color: tac.avg > 0.7 ? theme.colors.red : theme.colors.orange }}>{(tac.avg * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: 8, background: theme.colors.bgSurface, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (tac.avg * 100) + "%", background: tac.color, borderRadius: 4, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Recommended Actions</div>
        <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, marginBottom: 10 }}>Top remediation targets:</div>
        {optimal.selected.slice(0, 3).map((id, i) => {
          const t = techniques.find(t => t.id === id);
          return (
            <div key={id} style={{ fontSize: theme.fontSizes.base, color: theme.colors.orange, padding: "4px 0" }}>
              {i + 1}. Remediate <strong>{id}</strong>{t ? " (" + t.name + ")" : ""}
            </div>
          );
        })}
        {topUndeployedControls.length > 0 && (
          <>
            <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, marginTop: 12, marginBottom: 6 }}>Top undeployed controls:</div>
            {topUndeployedControls.map((c, i) => (
              <div key={c.id} style={{ fontSize: theme.fontSizes.base, color: theme.colors.teal, padding: "4px 0" }}>
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
            <div key={tac.id} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: theme.fontSizes.tiny, marginBottom: 2 }}>
                <span style={{ color: tac.color }}>{tac.name}</span>
                <span style={{ color: theme.colors.textMuted }}>{(info.avg * 100).toFixed(0)}% ({info.count})</span>
              </div>
              <div style={{ height: 10, background: theme.colors.bgSurface, borderRadius: 5, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: (info.avg * 100) + "%", borderRadius: 5,
                  background: info.avg > 0.7 ? theme.colors.red : info.avg > 0.4 ? theme.colors.orange : theme.colors.green,
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
