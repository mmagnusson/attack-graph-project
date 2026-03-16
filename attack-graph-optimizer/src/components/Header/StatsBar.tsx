// ─── StatsBar — Stat indicators + action buttons toolbar ──

import React from 'react';
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
      <button onClick={applyOptimal} style={{
        background: "#f59e0b", color: "#0a0f1a", border: "none", borderRadius: "4px",
        padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        letterSpacing: "0.5px",
      }}>APPLY OPTIMAL</button>
      <button onClick={exportCSV} style={btnStyle(false, "#3b82f6")}>EXPORT CSV</button>
      <button onClick={() => navFileInputRef.current?.click()} style={btnStyle(false, "#f97316")}>IMPORT NAV</button>
      <button onClick={exportNavigatorLayer} style={btnStyle(false, "#f97316")}>EXPORT NAV</button>
      <button onClick={() => { const next = !showControls; setShowControls(next); if (!next) setPopoutControls(false); }}
        style={btnStyle(showControls, "#14b8a6")}>CONTROLS</button>
      {dataSource === "stix" && fwConfig.hasSubTechniques && (
        <button onClick={() => setShowSubTechniques(prev => !prev)}
          style={btnStyle(showSubTechniques, "#8b5cf6")}>
          {showSubTechniques ? "HIDE" : "SHOW"} SUB-TECH
        </button>
      )}
      <button onClick={() => { setChainBuilderMode(prev => !prev); if (chainBuilderMode) { setChainBuilderPath([]); setChainBuilderName(""); } }}
        style={btnStyle(chainBuilderMode, "#a855f7")}>
        {chainBuilderMode ? "EXIT BUILDER" : "BUILD CHAIN"}
      </button>
      <button onClick={() => setPhaseWeighting(prev => !prev)}
        style={btnStyle(phaseWeighting, "#f97316")}>PHASE WEIGHT</button>
      <button onClick={() => { const next = !showGapAnalysis; setShowGapAnalysis(() => next); if (!next) setPopoutGapAnalysis(false); }}
        style={{ ...btnStyle(showGapAnalysis, "#ef4444"), position: "relative" as const }}>
        GAP ANALYSIS
        {gapAnalysis.gaps.length > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "#ef4444", color: "#fff", fontSize: "8px", fontWeight: 700,
            borderRadius: "8px", padding: "1px 5px", minWidth: 16, textAlign: "center",
          }}>{gapAnalysis.gaps.length}</span>
        )}
      </button>
      <button onClick={() => setCompareMode(prev => !prev)}
        style={btnStyle(compareMode, "#06b6d4")}>
        {compareMode ? "EXIT COMPARE" : "COMPARE IT/OT"}
      </button>
      <button onClick={() => setShowProfileWizard(true)}
        style={btnStyle(!!environmentProfile, "#8b5cf6")}>
        {environmentProfile ? "EDIT PROFILE" : "ENV PROFILE"}
      </button>
      <button onClick={() => { const next = !showExecutiveSummary; setShowExecutiveSummary(() => next); if (!next) setPopoutExecutive(false); }}
        style={btnStyle(showExecutiveSummary, "#06b6d4")}>EXECUTIVE</button>
      <button onClick={() => setShowBottomPanels(prev => !prev)}
        style={btnStyle(showBottomPanels, "#64748b")}>PANELS</button>
      {highlightedChains.length > 0 && (
        <button onClick={() => setIsolateChain(prev => !prev)}
          style={btnStyle(isolateChain, "#ec4899")}>
          {isolateChain ? "SHOW ALL" : "ISOLATE"}
        </button>
      )}
      {Object.keys(customPositions).length > 0 && (
        <button onClick={() => setCustomPositions({})} style={btnStyle(false, "#8b5cf6")}>AUTO-SPACE</button>
      )}
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
    </div>
  );
}
