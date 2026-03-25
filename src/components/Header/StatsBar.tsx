// ─── StatsBar — Stat indicators + action buttons toolbar ──

import React, { useState, useEffect, useRef } from 'react';
import { Stat } from '../Analysis';

interface StatsBarProps {
  framework: string;
  filteredChains: any[];
  totalDisrupted: number;
  remediated: Set<string>;
  optimal: { selected: string[]; chainsDisrupted: number; chainsTotal: number };
  applyOptimal: () => void;
  exportCSV: () => void;
  navFileInputRef: React.RefObject<HTMLInputElement | null>;
  exportNavigatorLayer: () => void;
  showControls: boolean;
  setShowControls: (v: boolean) => void;
  setPopoutControls: (v: boolean) => void;
  dataSource: string;
  fwConfig: any;
  showSubTechniques: boolean;
  setShowSubTechniques: (fn: (prev: boolean) => boolean) => void;
  chainBuilderMode: boolean;
  setChainBuilderMode: (fn: (prev: boolean) => boolean) => void;
  setChainBuilderPath: (v: string[]) => void;
  setChainBuilderName: (v: string) => void;
  phaseWeighting: boolean;
  setPhaseWeighting: (fn: (prev: boolean) => boolean) => void;
  showGapAnalysis: boolean;
  setShowGapAnalysis: (fn: (prev: boolean) => boolean) => void;
  setPopoutGapAnalysis: (v: boolean) => void;
  gapAnalysis: { gaps: any[] };
  compareMode: boolean;
  setCompareMode: (fn: (prev: boolean) => boolean) => void;
  environmentProfile: any;
  setShowProfileWizard: (v: boolean) => void;
  showExecutiveSummary: boolean;
  setShowExecutiveSummary: (fn: (prev: boolean) => boolean) => void;
  setPopoutExecutive: (v: boolean) => void;
  showBottomPanels: boolean;
  setShowBottomPanels: (fn: (prev: boolean) => boolean) => void;
  highlightedChains: any[];
  isolateChain: boolean;
  setIsolateChain: (fn: (prev: boolean) => boolean) => void;
  customPositions: Record<string, any>;
  setCustomPositions: (v: Record<string, any>) => void;
  handleShare: () => void;
  shareConfirm: boolean;
  resetAll: () => void;
  showSaved: boolean;
  showAnalysis: boolean;
  setShowAnalysis: (fn: (prev: boolean) => boolean) => void;
  setPopoutAnalysis: (v: boolean) => void;
}

export function StatsBar(props: StatsBarProps) {
  const {
    framework, filteredChains, totalDisrupted, remediated, optimal,
    applyOptimal, exportCSV, navFileInputRef, exportNavigatorLayer,
    showControls, setShowControls, setPopoutControls,
    dataSource, fwConfig,
    showSubTechniques, setShowSubTechniques,
    chainBuilderMode, setChainBuilderMode, setChainBuilderPath, setChainBuilderName,
    phaseWeighting, setPhaseWeighting,
    showGapAnalysis, setShowGapAnalysis, setPopoutGapAnalysis, gapAnalysis,
    compareMode, setCompareMode,
    environmentProfile, setShowProfileWizard,
    showExecutiveSummary, setShowExecutiveSummary, setPopoutExecutive,
    showBottomPanels, setShowBottomPanels,
    highlightedChains, isolateChain, setIsolateChain,
    customPositions, setCustomPositions,
    handleShare, shareConfirm, resetAll, showSaved,
    showAnalysis, setShowAnalysis, setPopoutAnalysis,
  } = props;

  // "More" dropdown state
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", escHandler); };
  }, [moreMenuOpen]);

  const btnStyle = (active: boolean, color: string) => ({
    background: active ? color : "transparent",
    color: active ? (color === "#64748b" || color === "#f59e0b" || color === "#14b8a6" ? "#0a0f1a" : "#fff") : color,
    border: "1px solid " + color,
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "10px",
    fontWeight: 700 as const,
    cursor: "pointer" as const,
    fontFamily: "inherit",
  });

  const menuItemStyle = (active: boolean, color: string) => ({
    display: "flex" as const, alignItems: "center" as const, gap: 8, width: "100%", textAlign: "left" as const,
    background: "transparent", border: "none", color: active ? color : "#cbd5e1",
    padding: "6px 12px", fontSize: "10px", fontWeight: 600 as const, cursor: "pointer" as const, fontFamily: "inherit",
  });

  const dot = (active: boolean, color: string) => ({
    width: 6, height: 6, borderRadius: "50%", background: active ? color : "#334155", flexShrink: 0 as const,
  });

  const anyAdvancedActive = showGapAnalysis || phaseWeighting || compareMode || environmentProfile || showExecutiveSummary || chainBuilderMode || showSubTechniques;

  return (
    <div style={{
      display: "flex", gap: "16px", padding: "10px 24px", borderBottom: "1px solid #1e293b",
      alignItems: "center", flexWrap: "wrap", flexShrink: 0,
    }}>
      <span style={{
        fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px",
        background: framework === "ics" ? "#a855f720" : "#3b82f620",
        color: framework === "ics" ? "#a855f7" : "#3b82f6",
        border: "1px solid " + (framework === "ics" ? "#a855f740" : "#3b82f640"),
      }}>
        {framework === "ics" ? "ICS/OT" : "Enterprise"}
      </span>
      <Stat label="Attack Chains" value={filteredChains.length} color="#6366f1" />
      <Stat label="Disrupted" value={totalDisrupted + "/" + filteredChains.length}
        color={totalDisrupted === filteredChains.length ? "#22c55e" : "#f59e0b"} />
      <Stat label="Remediated Nodes" value={remediated.size} color="#22c55e" />
      <Stat label="Optimal Covers" value={optimal.chainsDisrupted + " chains in " + optimal.selected.length + " nodes"} color="#f59e0b" />

      {/* Primary buttons */}
      <button onClick={applyOptimal} style={{
        background: "#f59e0b", color: "#0a0f1a", border: "none", borderRadius: "4px",
        padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        letterSpacing: "0.5px",
      }}>APPLY OPTIMAL</button>
      <button onClick={() => { const next = !showControls; setShowControls(next); if (!next) setPopoutControls(false); }}
        style={btnStyle(showControls, "#14b8a6")}>CONTROLS</button>
      <button onClick={handleShare} style={btnStyle(false, "#06b6d4")}>SHARE</button>
      {shareConfirm && (
        <span style={{ fontSize: "9px", color: "#06b6d4", opacity: 0.9 }}>URL copied!</span>
      )}
      <button onClick={resetAll} style={{
        background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: "4px",
        padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
      }}>RESET</button>
      {showSaved && (
        <span style={{ fontSize: "9px", color: "#22c55e", opacity: 0.8, transition: "opacity 0.3s" }}>Saved</span>
      )}
      <button onClick={() => { const next = !showAnalysis; setShowAnalysis(() => next); if (!next) setPopoutAnalysis(false); }}
        style={{
          background: showAnalysis ? "#3b82f6" : "transparent", color: showAnalysis ? "#fff" : "#64748b",
          border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
        {showAnalysis ? "HIDE" : "SHOW"} ANALYSIS
      </button>

      {/* ── More dropdown menu ── */}
      <div ref={moreMenuRef} style={{ position: "relative" }}>
        <button onClick={() => setMoreMenuOpen(prev => !prev)} style={{
          background: moreMenuOpen ? "#475569" : "transparent", color: moreMenuOpen ? "#fff" : "#94a3b8",
          border: "1px solid #475569", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          position: "relative",
        }}>
          MORE {moreMenuOpen ? "\u25B4" : "\u25BE"}
          {anyAdvancedActive && (
            <span style={{
              position: "absolute", top: -3, right: -3, width: 7, height: 7,
              background: "#22c55e", borderRadius: "50%", border: "1px solid #0a0f1a",
            }} />
          )}
        </button>
        {moreMenuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 1000,
            background: "#1e293b", border: "1px solid #334155", borderRadius: "6px",
            padding: "6px 0", minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {/* ── View ── */}
            <div style={{ padding: "4px 12px 2px", fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>View</div>
            {dataSource === "stix" && fwConfig.hasSubTechniques && (
              <button onClick={() => setShowSubTechniques(prev => !prev)} style={menuItemStyle(showSubTechniques, "#8b5cf6")}>
                <span style={dot(showSubTechniques, "#8b5cf6")} />
                {showSubTechniques ? "HIDE" : "SHOW"} SUB-TECH
              </button>
            )}
            <button onClick={() => setShowBottomPanels(prev => !prev)} style={menuItemStyle(showBottomPanels, "#64748b")}>
              <span style={dot(showBottomPanels, "#64748b")} />
              PANELS
            </button>
            <button onClick={() => setPhaseWeighting(prev => !prev)} style={menuItemStyle(phaseWeighting, "#f97316")}>
              <span style={dot(phaseWeighting, "#f97316")} />
              PHASE WEIGHT
            </button>
            {highlightedChains.length > 0 && (
              <button onClick={() => setIsolateChain(prev => !prev)} style={menuItemStyle(isolateChain, "#ec4899")}>
                <span style={dot(isolateChain, "#ec4899")} />
                {isolateChain ? "SHOW ALL" : "ISOLATE"}
              </button>
            )}
            {Object.keys(customPositions).length > 0 && (
              <button onClick={() => { setCustomPositions({}); setMoreMenuOpen(false); }} style={menuItemStyle(false, "#8b5cf6")}>
                <span style={dot(false, "#8b5cf6")} />
                AUTO-SPACE
              </button>
            )}

            {/* ── Analysis ── */}
            <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
            <div style={{ padding: "4px 12px 2px", fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Analysis</div>
            <button onClick={() => { const next = !showGapAnalysis; setShowGapAnalysis(() => next); if (!next) setPopoutGapAnalysis(false); }}
              style={menuItemStyle(showGapAnalysis, "#ef4444")}>
              <span style={dot(showGapAnalysis, "#ef4444")} />
              GAP ANALYSIS
              {gapAnalysis.gaps.length > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", fontSize: "8px", fontWeight: 700,
                  borderRadius: "8px", padding: "1px 5px", minWidth: 16, textAlign: "center", marginLeft: "auto",
                }}>{gapAnalysis.gaps.length}</span>
              )}
            </button>
            <button onClick={() => setShowProfileWizard(true)} style={menuItemStyle(!!environmentProfile, "#8b5cf6")}>
              <span style={dot(!!environmentProfile, "#8b5cf6")} />
              {environmentProfile ? "EDIT PROFILE" : "ENV PROFILE"}
            </button>
            <button onClick={() => { const next = !showExecutiveSummary; setShowExecutiveSummary(() => next); if (!next) setPopoutExecutive(false); }}
              style={menuItemStyle(showExecutiveSummary, "#06b6d4")}>
              <span style={dot(showExecutiveSummary, "#06b6d4")} />
              EXECUTIVE
            </button>
            <button onClick={() => setCompareMode(prev => !prev)} style={menuItemStyle(compareMode, "#06b6d4")}>
              <span style={dot(compareMode, "#06b6d4")} />
              {compareMode ? "EXIT COMPARE" : "COMPARE IT/OT"}
            </button>
            <button onClick={() => { setChainBuilderMode(prev => !prev); if (chainBuilderMode) { setChainBuilderPath([]); setChainBuilderName(""); } }}
              style={menuItemStyle(chainBuilderMode, "#a855f7")}>
              <span style={dot(chainBuilderMode, "#a855f7")} />
              {chainBuilderMode ? "EXIT BUILDER" : "BUILD CHAIN"}
            </button>

            {/* ── Export / Import ── */}
            <div style={{ borderTop: "1px solid #334155", margin: "4px 0" }} />
            <div style={{ padding: "4px 12px 2px", fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Export / Import</div>
            <button onClick={() => { exportCSV(); setMoreMenuOpen(false); }} style={menuItemStyle(false, "#3b82f6")}>
              <span style={dot(false, "#3b82f6")} />
              EXPORT CSV
            </button>
            <button onClick={() => { navFileInputRef.current?.click(); setMoreMenuOpen(false); }} style={menuItemStyle(false, "#f97316")}>
              <span style={dot(false, "#f97316")} />
              IMPORT NAV
            </button>
            <button onClick={() => { exportNavigatorLayer(); setMoreMenuOpen(false); }} style={menuItemStyle(false, "#f97316")}>
              <span style={dot(false, "#f97316")} />
              EXPORT NAV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
