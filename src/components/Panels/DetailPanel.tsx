// ─── DetailPanel — Node detail with exposure controls, mitigations, threat context ──

import React, { useMemo, useState, useCallback } from 'react';
import { CHAIN_COLORS, CONTROL_CATEGORIES } from '../../data/constants';
import { MITIGATION_DESCRIPTIONS } from '../../data/techniqueMetadata';
import { MetricBox, PopoutButton } from '../Analysis';
import { theme } from '../../theme';

interface DetailPanelProps {
  selectedTech: string | null;
  selectedTechData: any;
  selectedTactic: any;
  betweenness: Record<string, number>;
  chainCoverage: Record<string, number>;
  effectiveExposures: Record<string, number>;
  exposures: Record<string, number>;
  handleExposureChange: (techId: string, value: number) => void;
  remediated: Set<string>;
  toggleRemediate: (techId: string) => void;
  deployedControls: Set<string>;
  filteredChains: any[];
  chainStatus: any[];
  highlightedChains: any[];
  toggleHighlightedChain: (chain: any) => void;
  fwConfig: any;
  profileExposures: Record<string, any> | null;
  activeTechDescriptions: Record<string, any>;
  activeChainTechContext: Record<string, any>;
  activeMitigations: Record<string, any>;
  popoutDetail: boolean;
  setPopoutDetail: (v: boolean) => void;
}

export function DetailPanel({
  selectedTech, selectedTechData, selectedTactic,
  betweenness, chainCoverage, effectiveExposures, exposures,
  handleExposureChange, remediated, toggleRemediate,
  deployedControls, filteredChains, chainStatus,
  highlightedChains, toggleHighlightedChain,
  fwConfig, profileExposures,
  activeTechDescriptions, activeChainTechContext, activeMitigations,
  popoutDetail, setPopoutDetail,
}: DetailPanelProps) {
  const [expandedExamples, setExpandedExamples] = useState(false);
  const [expandedMitigation, setExpandedMitigation] = useState<string | null>(null);

  // Reset expanded state when selected tech changes
  const prevTechRef = React.useRef(selectedTech);
  if (prevTechRef.current !== selectedTech) {
    prevTechRef.current = selectedTech;
    if (expandedExamples) setExpandedExamples(false);
    if (expandedMitigation) setExpandedMitigation(null);
  }

  const techExamples = useMemo(() => {
    if (!selectedTech) return null;
    const raw = activeTechDescriptions[selectedTech];
    if (!raw) return null;
    return typeof raw === 'string' ? { summary: raw, examples: [] } : raw;
  }, [selectedTech, activeTechDescriptions]);

  const getChainTechContext = useCallback((chainName: string, techId: string) => {
    const descs = activeChainTechContext[chainName];
    if (!descs) return null;
    if (descs[techId]) return descs[techId];
    const subs = Object.entries(descs)
      .filter(([k]: [string, any]) => k.startsWith(techId + '.'))
      .map(([, v]: [string, any]) => v);
    return subs.length > 0 ? subs[0] : null;
  }, [activeChainTechContext]);

  if (!selectedTechData) {
    return (
      <div style={{ paddingTop: "48px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>⬡</div>
        <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.body, fontWeight: 500, marginBottom: "6px" }}>
          No node selected
        </div>
        <div style={{ color: theme.colors.textFaint, fontSize: theme.fontSizes.small, lineHeight: 1.6 }}>
          Click a technique node in the graph to view<br />
          exposure, mitigations, and attack chain context
        </div>
        <div style={{
          marginTop: "20px", padding: "8px 14px", display: "inline-block",
          background: theme.colors.bgSurface, borderRadius: theme.radii.md,
          border: "1px solid " + theme.colors.borderSubtle,
        }}>
          <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint }}>
            Tip: Press <kbd style={{ background: theme.colors.bgCard, padding: "1px 5px", borderRadius: 3, border: "1px solid " + theme.colors.border, fontSize: theme.fontSizes.tiny }}>3</kbd> to switch to this tab
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <h3 style={{ ...theme.panelHeading }}>
        Node Detail: {selectedTechData.id}
        {!popoutDetail && <PopoutButton onClick={() => setPopoutDetail(true)} title="Pop out Detail" />}
      </h3>
      <div style={{ marginBottom: theme.spacing.xl }}>
        <div style={{ fontSize: theme.fontSizes.large, fontWeight: 700, color: theme.colors.textPrimary }}>{selectedTechData.name}</div>
        <div style={{ fontSize: theme.fontSizes.small, color: selectedTactic?.color, marginTop: theme.spacing.xs }}>
          {selectedTactic?.name} ({selectedTactic?.id})
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <MetricBox label="Betweenness" value={((betweenness[selectedTech!] ?? 0) * 100).toFixed(1)} unit="%" color={theme.colors.blue} />
        <MetricBox label="Chain Count" value={chainCoverage[selectedTech!] ?? 0} unit={"/" + filteredChains.length} color={theme.colors.indigo} />
        <MetricBox label="Exposure" value={((effectiveExposures[selectedTech!] ?? 1) * 100).toFixed(0)} unit="%" color={
          (effectiveExposures[selectedTech!] ?? 1) > 0.7 ? theme.colors.red : (effectiveExposures[selectedTech!] ?? 1) > 0.4 ? theme.colors.orange : theme.colors.green
        } />
        <MetricBox label="Priority Score" value={(
          (betweenness[selectedTech!] ?? 0) * (effectiveExposures[selectedTech!] ?? 1) * (chainCoverage[selectedTech!] ?? 0) / Math.max(filteredChains.length, 1) * 100
        ).toFixed(1)} unit="pts" color={theme.colors.orange} />
      </div>

      <div style={{ marginBottom: theme.spacing.xl }}>
        <label style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted, display: "block", marginBottom: theme.spacing.sm }}>
          Adjust Exposure ({selectedTech})
        </label>
        <input type="range" min={0} max={100} value={((exposures[selectedTech!] ?? 1) * 100)}
          onChange={e => handleExposureChange(selectedTech!, (e.target as any).value / 100)}
          style={{ width: "100%", accentColor: theme.colors.orange }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint }}>
          <span>Fully Mitigated</span><span>Fully Exposed</span>
        </div>
        {deployedControls.size > 0 && (exposures[selectedTech!] ?? 1) !== (effectiveExposures[selectedTech!] ?? 1) && (
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.teal, marginTop: theme.spacing.xs }}>
            Control-adjusted: {((effectiveExposures[selectedTech!] ?? 1) * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Control Impact Breakdown */}
      {(() => {
        const applied = fwConfig.securityControls.filter((c: any) => deployedControls.has(c.id) && c.coverage[selectedTech!]);
        if (applied.length === 0) return null;
        const baseExp = exposures[selectedTech!] ?? 1;
        const effExp = effectiveExposures[selectedTech!] ?? 1;
        const netReduction = baseExp > 0 ? ((1 - effExp / baseExp) * 100).toFixed(0) : 0;
        return (
          <div style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg, background: "#14b8a608", border: "1px solid #14b8a620", borderRadius: theme.radii.sm }}>
            <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>Applied Controls</div>
            {applied.map((ctrl: any) => {
              const cat = CONTROL_CATEGORIES.find((c: any) => c.id === ctrl.category);
              return (
                <div key={ctrl.id} style={{ display: "flex", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.xs }}>
                  <span style={{
                    fontSize: theme.fontSizes.micro, padding: "2px 6px", borderRadius: theme.radii.sm,
                    background: (cat?.color || theme.colors.textMuted) + "20", color: cat?.color || theme.colors.textMuted,
                  }}>{cat?.name?.split(" / ")[0] || ctrl.category}</span>
                  <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, flex: 1 }}>{ctrl.name}</span>
                  <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.teal, fontWeight: 700 }}>
                    {(ctrl.coverage[selectedTech!] * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.teal, marginTop: theme.spacing.sm, borderTop: "1px solid #14b8a615", paddingTop: theme.spacing.sm }}>
              Net reduction: {netReduction}% (multiplicative)
            </div>
          </div>
        );
      })()}

      {/* Environment Profile Coverage Sources */}
      {profileExposures && profileExposures[selectedTech!] && profileExposures[selectedTech!].coverageSources.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg, background: "#3b82f608", border: "1px solid #3b82f620", borderRadius: theme.radii.sm }}>
          <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>
            Environment Coverage Sources
          </div>
          {profileExposures[selectedTech!].coverageSources.map((src: any) => (
            <div key={src.toolId} style={{ display: "flex", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.xs }}>
              <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, flex: 1 }}>{src.name}</span>
              <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.blue }}>
                Detect: {(src.detect * 100).toFixed(0)}%
              </span>
              {src.prevent > 0 && (
                <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.green }}>
                  Prevent: {(src.prevent * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.blue, marginTop: theme.spacing.sm, borderTop: "1px solid #3b82f615", paddingTop: theme.spacing.sm }}>
            Combined coverage: {(profileExposures[selectedTech!].coverageReduction * 100).toFixed(0)}%
            {profileExposures[selectedTech!].actorWeight > 1 && (
              <span style={{ color: theme.colors.orange, marginLeft: theme.spacing.lg }}>
                Threat actor weight: {profileExposures[selectedTech!].actorWeight.toFixed(2)}x
              </span>
            )}
          </div>
        </div>
      )}

      <button onClick={() => toggleRemediate(selectedTech!)}
        style={{
          width: "100%", padding: "10px",
          background: remediated.has(selectedTech!) ? "#22c55e20" : theme.colors.orange,
          color: remediated.has(selectedTech!) ? theme.colors.green : theme.colors.bg,
          border: remediated.has(selectedTech!) ? "1px solid " + theme.colors.green : "none",
          borderRadius: theme.radii.sm, fontSize: theme.fontSizes.body, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
        {remediated.has(selectedTech!) ? "\u2713 REMEDIATED \u2014 UNDO" : "MARK AS REMEDIATED"}
      </button>

      <div style={{ marginTop: theme.spacing.xl }}>
        <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>Appears in chains:</div>
        {filteredChains.filter((c: any) => c.path.includes(selectedTech)).map((c: any, i: number) => (
          <div key={i} style={{
            fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, padding: "4px 0",
            cursor: "pointer", textDecoration: chainStatus[filteredChains.indexOf(c)]?.broken ? "line-through" : "none",
            opacity: chainStatus[filteredChains.indexOf(c)]?.broken ? 0.5 : 1,
          }} onClick={() => toggleHighlightedChain(c)}>
            {"\u2192"} {c.name}
          </div>
        ))}
      </div>

      {/* Contextual Technique Examples */}
      <div style={{ marginTop: theme.spacing.xxl }}>
        {(() => {
          const TRUNC = 150;
          const truncate = (text: string) => {
            if (!text || text.length <= TRUNC || expandedExamples) return text;
            return text.slice(0, text.lastIndexOf(' ', TRUNC) || TRUNC) + '...';
          };
          const chainsWithTech = highlightedChains.filter((c: any) => c.path.includes(selectedTech));
          const anyLong = (() => {
            if (chainsWithTech.length > 0) {
              for (const c of chainsWithTech) {
                const ctx = getChainTechContext(c.name, selectedTech!);
                if (ctx && ctx.length > TRUNC) return true;
              }
              if (techExamples?.summary?.length > TRUNC) return true;
              return false;
            }
            return techExamples?.summary?.length > TRUNC;
          })();
          if (chainsWithTech.length > 0) {
            return (
              <>
                <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>Threat Actor Context</div>
                {chainsWithTech.map((c: any, i: number) => {
                  const colorIdx = highlightedChains.indexOf(c);
                  const chainColor = CHAIN_COLORS[colorIdx % CHAIN_COLORS.length].color;
                  const ctx = getChainTechContext(c.name, selectedTech!);
                  return (
                    <div key={i} style={{
                      borderLeft: "3px solid " + chainColor,
                      paddingLeft: theme.spacing.lg,
                      marginBottom: theme.spacing.lg,
                    }}>
                      <div style={{ fontSize: theme.fontSizes.small, fontWeight: 700, color: chainColor, marginBottom: theme.spacing.xs }}>{c.name}</div>
                      <div style={{ fontSize: theme.fontSizes.small, color: ctx ? "#cbd5e1" : theme.colors.textFaint, fontStyle: ctx ? "normal" : "italic", lineHeight: "1.5" }}>
                        {ctx ? truncate(ctx) : "No specific context available for this technique"}
                      </div>
                    </div>
                  );
                })}
                {techExamples && (
                  <div style={{ marginTop: theme.spacing.lg, opacity: 0.5 }}>
                    <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>General usage:</div>
                    <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, lineHeight: "1.5" }}>{truncate(techExamples.summary)}</div>
                  </div>
                )}
                {anyLong && (
                  <div style={{ marginTop: theme.spacing.sm, textAlign: "right" }}>
                    <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                      fontSize: theme.fontSizes.tiny, color: theme.colors.blue, cursor: "pointer", userSelect: "none",
                    }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                  </div>
                )}
              </>
            );
          }
          if (techExamples) {
            return (
              <>
                <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>Real-World Usage</div>
                <div style={{ fontSize: theme.fontSizes.small, color: "#cbd5e1", lineHeight: "1.5", marginBottom: theme.spacing.md }}>{truncate(techExamples.summary)}</div>
                {(expandedExamples || techExamples.summary.length <= TRUNC) && techExamples.examples.length > 0 && (
                  <ul style={{ margin: "0", paddingLeft: "16px" }}>
                    {techExamples.examples.map((ex: string, i: number) => (
                      <li key={i} style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, lineHeight: "1.6", marginBottom: theme.spacing.xs }}>{ex}</li>
                    ))}
                  </ul>
                )}
                {anyLong && (
                  <div style={{ marginTop: theme.spacing.sm, textAlign: "right" }}>
                    <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                      fontSize: theme.fontSizes.tiny, color: theme.colors.blue, cursor: "pointer", userSelect: "none",
                    }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                  </div>
                )}
              </>
            );
          }
          return (
            <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textFaint, fontStyle: "italic" }}>No usage examples available for this technique</div>
          );
        })()}
      </div>

      {/* MITRE Mitigations */}
      {(() => {
        const mits = activeMitigations[selectedTech!];
        if (!mits || mits.length === 0) return null;
        return (
          <div style={{ marginTop: theme.spacing.xxl }}>
            <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>MITRE Mitigations</div>
            {mits.map((m: any, i: number) => {
              const mappedCtrl = fwConfig.mitigationControlMap[m.name];
              const isDeployed = mappedCtrl && deployedControls.has(mappedCtrl);
              const desc = m.description || MITIGATION_DESCRIPTIONS[m.mitreId];
              const isExpanded = expandedMitigation === m.mitreId;
              return (
                <div key={i} style={{ marginBottom: theme.spacing.sm }}>
                  <div
                    onClick={() => desc && setExpandedMitigation(isExpanded ? null : m.mitreId)}
                    style={{
                      display: "flex", alignItems: "center", gap: theme.spacing.md,
                      cursor: desc ? "pointer" : "default",
                      padding: "4px 0",
                    }}>
                    <span style={{ fontSize: theme.fontSizes.base, color: isDeployed ? theme.colors.green : theme.colors.textMuted }}>{isDeployed ? "\u2713" : "\u25CB"}</span>
                    <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint, minWidth: "42px", fontFamily: '"JetBrains Mono", monospace' }}>{m.mitreId}</span>
                    <span style={{ fontSize: theme.fontSizes.small, color: isDeployed ? theme.colors.green : theme.colors.textBody }}>{m.name}</span>
                    {desc && (
                      <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, marginLeft: 4 }}>
                        {isExpanded ? "\u25B2" : "\u25BC"}
                      </span>
                    )}
                    {mappedCtrl && (
                      <span style={{ fontSize: theme.fontSizes.micro, color: isDeployed ? theme.colors.green : theme.colors.orange, marginLeft: "auto" }}>
                        {isDeployed ? "deployed" : "available"}
                      </span>
                    )}
                  </div>
                  {isExpanded && desc && (
                    <div style={{
                      marginLeft: "34px", marginTop: theme.spacing.xs, padding: theme.spacing.lg,
                      background: theme.colors.bgCard, border: "1px solid " + theme.colors.borderSubtle,
                      borderRadius: theme.radii.sm, fontSize: theme.fontSizes.small,
                      color: theme.colors.textSecondary, lineHeight: "1.6",
                    }}>
                      {desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </>
  );
}
