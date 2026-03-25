// ─── DetailPanel — Node detail with exposure controls, mitigations, threat context ──

import React, { useMemo, useState, useCallback } from 'react';
import { CHAIN_COLORS, CONTROL_CATEGORIES } from '../../data/constants';
import { MetricBox, PopoutButton } from '../Analysis';

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

  // Reset expanded state when selected tech changes
  const prevTechRef = React.useRef(selectedTech);
  if (prevTechRef.current !== selectedTech) {
    prevTechRef.current = selectedTech;
    if (expandedExamples) setExpandedExamples(false);
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
      <div style={{ color: "#475569", fontSize: "11px", paddingTop: "40px", textAlign: "center" }}>
        Click a node to inspect
      </div>
    );
  }

  return (
    <>
      <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
        Node Detail: {selectedTechData.id}
        {!popoutDetail && <PopoutButton onClick={() => setPopoutDetail(true)} title="Pop out Detail" />}
      </h3>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{selectedTechData.name}</div>
        <div style={{ fontSize: "9px", color: selectedTactic?.color, marginTop: "2px" }}>
          {selectedTactic?.name} ({selectedTactic?.id})
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <MetricBox label="Betweenness" value={((betweenness[selectedTech!] ?? 0) * 100).toFixed(1)} unit="%" color="#3b82f6" />
        <MetricBox label="Chain Count" value={chainCoverage[selectedTech!] ?? 0} unit={"/" + filteredChains.length} color="#6366f1" />
        <MetricBox label="Exposure" value={((effectiveExposures[selectedTech!] ?? 1) * 100).toFixed(0)} unit="%" color={
          (effectiveExposures[selectedTech!] ?? 1) > 0.7 ? "#ef4444" : (effectiveExposures[selectedTech!] ?? 1) > 0.4 ? "#f59e0b" : "#22c55e"
        } />
        <MetricBox label="Priority Score" value={(
          (betweenness[selectedTech!] ?? 0) * (effectiveExposures[selectedTech!] ?? 1) * (chainCoverage[selectedTech!] ?? 0) / Math.max(filteredChains.length, 1) * 100
        ).toFixed(1)} unit="pts" color="#f59e0b" />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "9px", color: "#64748b", display: "block", marginBottom: "4px" }}>
          Adjust Exposure ({selectedTech})
        </label>
        <input type="range" min={0} max={100} value={((exposures[selectedTech!] ?? 1) * 100)}
          onChange={e => handleExposureChange(selectedTech!, (e.target as any).value / 100)}
          style={{ width: "100%", accentColor: "#f59e0b" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#475569" }}>
          <span>Fully Mitigated</span><span>Fully Exposed</span>
        </div>
        {deployedControls.size > 0 && (exposures[selectedTech!] ?? 1) !== (effectiveExposures[selectedTech!] ?? 1) && (
          <div style={{ fontSize: "8px", color: "#14b8a6", marginTop: "2px" }}>
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
          <div style={{ marginBottom: "12px", padding: "8px", background: "#14b8a608", border: "1px solid #14b8a620", borderRadius: "4px" }}>
            <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Applied Controls</div>
            {applied.map((ctrl: any) => {
              const cat = CONTROL_CATEGORIES.find((c: any) => c.id === ctrl.category);
              return (
                <div key={ctrl.id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <span style={{
                    fontSize: "7px", padding: "1px 4px", borderRadius: "2px",
                    background: (cat?.color || "#64748b") + "20", color: cat?.color || "#64748b",
                  }}>{cat?.name?.split(" / ")[0] || ctrl.category}</span>
                  <span style={{ fontSize: "9px", color: "#e2e8f0", flex: 1 }}>{ctrl.name}</span>
                  <span style={{ fontSize: "9px", color: "#14b8a6", fontWeight: 700 }}>
                    {(ctrl.coverage[selectedTech!] * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div style={{ fontSize: "8px", color: "#14b8a6", marginTop: "4px", borderTop: "1px solid #14b8a615", paddingTop: "4px" }}>
              Net reduction: {netReduction}% (multiplicative)
            </div>
          </div>
        );
      })()}

      {/* Environment Profile Coverage Sources */}
      {profileExposures && profileExposures[selectedTech!] && profileExposures[selectedTech!].coverageSources.length > 0 && (
        <div style={{ marginBottom: "12px", padding: "8px", background: "#3b82f608", border: "1px solid #3b82f620", borderRadius: "4px" }}>
          <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
            Environment Coverage Sources
          </div>
          {profileExposures[selectedTech!].coverageSources.map((src: any) => (
            <div key={src.toolId} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <span style={{ fontSize: "9px", color: "#e2e8f0", flex: 1 }}>{src.name}</span>
              <span style={{ fontSize: "8px", color: "#3b82f6" }}>
                Detect: {(src.detect * 100).toFixed(0)}%
              </span>
              {src.prevent > 0 && (
                <span style={{ fontSize: "8px", color: "#22c55e" }}>
                  Prevent: {(src.prevent * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
          <div style={{ fontSize: "8px", color: "#3b82f6", marginTop: "4px", borderTop: "1px solid #3b82f615", paddingTop: "4px" }}>
            Combined coverage: {(profileExposures[selectedTech!].coverageReduction * 100).toFixed(0)}%
            {profileExposures[selectedTech!].actorWeight > 1 && (
              <span style={{ color: "#f59e0b", marginLeft: "8px" }}>
                Threat actor weight: {profileExposures[selectedTech!].actorWeight.toFixed(2)}x
              </span>
            )}
          </div>
        </div>
      )}

      <button onClick={() => toggleRemediate(selectedTech!)}
        style={{
          width: "100%", padding: "8px",
          background: remediated.has(selectedTech!) ? "#22c55e20" : "#f59e0b",
          color: remediated.has(selectedTech!) ? "#22c55e" : "#0a0f1a",
          border: remediated.has(selectedTech!) ? "1px solid #22c55e" : "none",
          borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
        {remediated.has(selectedTech!) ? "\u2713 REMEDIATED \u2014 UNDO" : "MARK AS REMEDIATED"}
      </button>

      <div style={{ marginTop: "12px" }}>
        <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "4px" }}>Appears in chains:</div>
        {filteredChains.filter((c: any) => c.path.includes(selectedTech)).map((c: any, i: number) => (
          <div key={i} style={{
            fontSize: "9px", color: "#94a3b8", padding: "2px 0",
            cursor: "pointer", textDecoration: chainStatus[filteredChains.indexOf(c)]?.broken ? "line-through" : "none",
            opacity: chainStatus[filteredChains.indexOf(c)]?.broken ? 0.5 : 1,
          }} onClick={() => toggleHighlightedChain(c)}>
            {"\u2192"} {c.name}
          </div>
        ))}
      </div>

      {/* Contextual Technique Examples */}
      <div style={{ marginTop: "16px" }}>
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
                <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Threat Actor Context</div>
                {chainsWithTech.map((c: any, i: number) => {
                  const colorIdx = highlightedChains.indexOf(c);
                  const chainColor = CHAIN_COLORS[colorIdx % CHAIN_COLORS.length].color;
                  const ctx = getChainTechContext(c.name, selectedTech!);
                  return (
                    <div key={i} style={{
                      borderLeft: "2px solid " + chainColor,
                      paddingLeft: "8px",
                      marginBottom: "8px",
                    }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: chainColor, marginBottom: "2px" }}>{c.name}</div>
                      <div style={{ fontSize: "9px", color: ctx ? "#cbd5e1" : "#475569", fontStyle: ctx ? "normal" : "italic", lineHeight: "1.4" }}>
                        {ctx ? truncate(ctx) : "No specific context available for this technique"}
                      </div>
                    </div>
                  );
                })}
                {techExamples && (
                  <div style={{ marginTop: "8px", opacity: 0.5 }}>
                    <div style={{ fontSize: "8px", color: "#64748b", marginBottom: "2px" }}>General usage:</div>
                    <div style={{ fontSize: "8px", color: "#94a3b8", lineHeight: "1.4" }}>{truncate(techExamples.summary)}</div>
                  </div>
                )}
                {anyLong && (
                  <div style={{ marginTop: "4px", textAlign: "right" }}>
                    <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                      fontSize: "8px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                    }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                  </div>
                )}
              </>
            );
          }
          if (techExamples) {
            return (
              <>
                <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Real-World Usage</div>
                <div style={{ fontSize: "9px", color: "#cbd5e1", lineHeight: "1.4", marginBottom: "6px" }}>{truncate(techExamples.summary)}</div>
                {(expandedExamples || techExamples.summary.length <= TRUNC) && techExamples.examples.length > 0 && (
                  <ul style={{ margin: "0", paddingLeft: "14px" }}>
                    {techExamples.examples.map((ex: string, i: number) => (
                      <li key={i} style={{ fontSize: "8px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "2px" }}>{ex}</li>
                    ))}
                  </ul>
                )}
                {anyLong && (
                  <div style={{ marginTop: "4px", textAlign: "right" }}>
                    <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                      fontSize: "8px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                    }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                  </div>
                )}
              </>
            );
          }
          return (
            <div style={{ fontSize: "9px", color: "#475569", fontStyle: "italic" }}>No usage examples available for this technique</div>
          );
        })()}
      </div>

      {/* MITRE Mitigations */}
      {(() => {
        const mits = activeMitigations[selectedTech!];
        if (!mits || mits.length === 0) return null;
        return (
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>MITRE Mitigations</div>
            {mits.map((m: any, i: number) => {
              const mappedCtrl = fwConfig.mitigationControlMap[m.name];
              const isDeployed = mappedCtrl && deployedControls.has(mappedCtrl);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <span style={{ fontSize: "10px", color: isDeployed ? "#22c55e" : "#64748b" }}>{isDeployed ? "\u2713" : "\u25CB"}</span>
                  <span style={{ fontSize: "8px", color: "#475569", minWidth: "38px" }}>{m.mitreId}</span>
                  <span style={{ fontSize: "9px", color: isDeployed ? "#22c55e" : "#e2e8f0" }}>{m.name}</span>
                  {mappedCtrl && (
                    <span style={{ fontSize: "7px", color: isDeployed ? "#22c55e" : "#f59e0b", marginLeft: "auto" }}>
                      {isDeployed ? "deployed" : "available"}
                    </span>
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
