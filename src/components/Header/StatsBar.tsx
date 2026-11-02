// ─── StatsBar — headline numbers, panel launchers, actions ──

import { useState, useEffect, useRef } from 'react';
import { Stat } from '../Analysis';
import { fmtPct, fmtUsd } from '../../engine/displayMetrics';
import { theme } from '../../theme';
import { SIDEBAR_TABS, type SidebarPanel } from './sidebarTabs';

interface StatsBarProps {
  shownResidual: number;
  currentResidual: number;
  planResidual: number;
  planCost: number;
  budget: number;
  actorCount: number;
  previewPlan: boolean;
  setPreviewPlan: (v: boolean) => void;
  sidebarPanel: SidebarPanel | null;
  setSidebarPanel: (v: SidebarPanel | null) => void;
  hasSubTechniques: boolean;
  showSubTechniques: boolean;
  setShowSubTechniques: (fn: (prev: boolean) => boolean) => void;
  showBottomPanels: boolean;
  setShowBottomPanels: (fn: (prev: boolean) => boolean) => void;
  highlightedCount: number;
  isolateChain: boolean;
  setIsolateChain: (fn: (prev: boolean) => boolean) => void;
  hasCustomPositions: boolean;
  resetPositions: () => void;
  hasProfile: boolean;
  openProfileWizard: () => void;
  compareMode: boolean;
  setCompareMode: (fn: (prev: boolean) => boolean) => void;
  chainBuilderMode: boolean;
  toggleChainBuilder: () => void;
  exportCSV: () => void;
  openNavImport: () => void;
  exportNavigatorLayer: () => void;
  exportPlanCSV: () => void;
  exportBoardReport: () => void;
  handleShare: () => void;
  shareConfirm: boolean;
  resetAll: () => void;
  onShowHelp: () => void;
}

export function StatsBar(p: StatsBarProps) {
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

  const menuItemStyle = (active: boolean) => ({
    display: "flex" as const, alignItems: "center" as const, gap: 10, width: "100%", textAlign: "left" as const,
    background: "transparent", border: "none", color: active ? theme.colors.textPrimary : theme.colors.textBody,
    padding: "8px 14px", fontSize: theme.fontSizes.small, fontWeight: 600 as const, cursor: "pointer" as const, fontFamily: "inherit",
  });
  const dot = (active: boolean, color: string) => ({
    width: 8, height: 8, borderRadius: theme.radii.round, background: active ? color : theme.colors.border, flexShrink: 0 as const,
  });
  const close = (fn: () => void) => () => { fn(); setMoreMenuOpen(false); };
  const anyAdvancedActive = p.compareMode || p.hasProfile || p.chainBuilderMode || p.showSubTechniques;
  const reduction = p.currentResidual > 0 ? 1 - p.planResidual / p.currentResidual : 0;

  return (
    <div style={{
      display: "flex", gap: theme.spacing.xl, padding: "10px 24px", borderBottom: "1px solid " + theme.colors.borderSubtle,
      alignItems: "center", flexWrap: "wrap", flexShrink: 0,
    }}>
      <Stat label={p.previewPlan ? "residual risk (plan preview)" : "residual risk"} value={fmtPct(p.shownResidual)} color={theme.colors.textPrimary} />
      <Stat label={"plan: " + fmtUsd(p.planCost) + " of " + fmtUsd(p.budget)} value={"−" + fmtPct(reduction)} color={theme.colors.textPrimary} />
      <Stat label="actors modeled" value={p.actorCount} color={theme.colors.textPrimary} />

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.fontSizes.small, color: theme.colors.textBody, cursor: "pointer" }}
        title="Show the graph as if the recommended plan were in place">
        <input type="checkbox" checked={p.previewPlan} onChange={e => p.setPreviewPlan(e.target.checked)} />
        Preview plan
      </label>

      <div style={{ display: "flex", gap: 4, background: theme.colors.bgCard, borderRadius: theme.radii.md, padding: 3, border: "1px solid " + theme.colors.borderSubtle }}>
        {SIDEBAR_TABS.map(tab => (
          <button key={tab.id} onClick={() => p.setSidebarPanel(p.sidebarPanel === tab.id ? null : tab.id)} title={tab.label + " (" + tab.key + ")"}
            aria-pressed={p.sidebarPanel === tab.id}
            style={{
              background: p.sidebarPanel === tab.id ? tab.color + "22" : "transparent",
              color: p.sidebarPanel === tab.id ? theme.colors.textPrimary : theme.colors.textMuted,
              border: p.sidebarPanel === tab.id ? "1px solid " + tab.color + "66" : "1px solid transparent",
              borderRadius: theme.radii.sm, padding: "5px 10px", fontSize: theme.fontSizes.small, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <button onClick={p.handleShare} style={{ ...theme.buttonBase, padding: "7px 12px", background: "transparent", color: theme.colors.cyan, border: "1px solid " + theme.colors.cyan }}>SHARE</button>
      {p.shareConfirm && <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody }}>{"✓"} Link copied</span>}
      <button onClick={p.resetAll} style={{ ...theme.buttonBase, padding: "7px 12px", background: "transparent", color: theme.colors.textMuted, border: "1px solid " + theme.colors.border, fontWeight: 400 }}>RESET</button>

      <div ref={moreMenuRef} style={{ position: "relative" }}>
        <button onClick={() => setMoreMenuOpen(prev => !prev)} aria-expanded={moreMenuOpen} style={{
          ...theme.buttonBase, padding: "7px 12px",
          background: moreMenuOpen ? theme.colors.textFaint : "transparent", color: moreMenuOpen ? "#fff" : theme.colors.textSecondary,
          border: "1px solid " + theme.colors.textFaint, position: "relative",
        }}>
          MORE {moreMenuOpen ? "▴" : "▾"}
          {anyAdvancedActive && (
            <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: theme.colors.green, borderRadius: theme.radii.round, border: "1px solid " + theme.colors.bg }} />
          )}
        </button>
        {moreMenuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 1000,
            background: theme.colors.bgSurface, border: "1px solid " + theme.colors.border, borderRadius: theme.radii.md,
            padding: "8px 0", minWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            <button onClick={close(p.onShowHelp)} style={menuItemStyle(false)}><span style={dot(false, "#22d3ee")} />HELP / GUIDE</button>
            <div style={{ borderTop: "1px solid " + theme.colors.border, margin: "6px 0" }} />
            <div style={{ padding: "6px 14px 4px", ...theme.sectionLabel, fontSize: theme.fontSizes.tiny }}>View</div>
            {p.hasSubTechniques && (
              <button onClick={() => p.setShowSubTechniques(prev => !prev)} style={menuItemStyle(p.showSubTechniques)}>
                <span style={dot(p.showSubTechniques, "#8b5cf6")} />{p.showSubTechniques ? "HIDE" : "SHOW"} SUB-TECHNIQUES
              </button>
            )}
            <button onClick={() => p.setShowBottomPanels(prev => !prev)} style={menuItemStyle(p.showBottomPanels)}>
              <span style={dot(p.showBottomPanels, "#64748b")} />BOTTOM PANELS
            </button>
            {p.highlightedCount > 0 && (
              <button onClick={() => p.setIsolateChain(prev => !prev)} style={menuItemStyle(p.isolateChain)}>
                <span style={dot(p.isolateChain, "#ec4899")} />{p.isolateChain ? "SHOW ALL NODES" : "ISOLATE HIGHLIGHTED"}
              </button>
            )}
            {p.hasCustomPositions && (
              <button onClick={close(p.resetPositions)} style={menuItemStyle(false)}><span style={dot(false, "#8b5cf6")} />AUTO-SPACE</button>
            )}
            <div style={{ borderTop: "1px solid " + theme.colors.border, margin: "6px 0" }} />
            <div style={{ padding: "6px 14px 4px", ...theme.sectionLabel, fontSize: theme.fontSizes.tiny }}>Tools</div>
            <button onClick={close(p.openProfileWizard)} style={menuItemStyle(p.hasProfile)}>
              <span style={dot(p.hasProfile, "#8b5cf6")} />{p.hasProfile ? "EDIT ENVIRONMENT PROFILE" : "ENVIRONMENT PROFILE"}
            </button>
            <button onClick={() => p.setCompareMode(prev => !prev)} style={menuItemStyle(p.compareMode)}>
              <span style={dot(p.compareMode, "#06b6d4")} />{p.compareMode ? "EXIT COMPARE" : "COMPARE IT/OT"}
            </button>
            <button onClick={p.toggleChainBuilder} style={menuItemStyle(p.chainBuilderMode)}>
              <span style={dot(p.chainBuilderMode, "#a855f7")} />{p.chainBuilderMode ? "EXIT CHAIN BUILDER" : "BUILD CUSTOM CHAIN"}
            </button>
            <div style={{ borderTop: "1px solid " + theme.colors.border, margin: "6px 0" }} />
            <div style={{ padding: "6px 14px 4px", ...theme.sectionLabel, fontSize: theme.fontSizes.tiny }}>Export / Import</div>
            <button onClick={close(p.exportBoardReport)} style={menuItemStyle(false)}><span style={dot(false, "#06b6d4")} />BOARD REPORT (HTML)</button>
            <button onClick={close(p.exportPlanCSV)} style={menuItemStyle(false)}><span style={dot(false, "#d95926")} />PLAN CSV</button>
            <button onClick={close(p.exportCSV)} style={menuItemStyle(false)}><span style={dot(false, "#3b82f6")} />ANALYSIS CSV</button>
            <button onClick={close(p.exportNavigatorLayer)} style={menuItemStyle(false)}><span style={dot(false, "#f97316")} />EXPORT NAVIGATOR LAYER</button>
            <button onClick={close(p.openNavImport)} style={menuItemStyle(false)}><span style={dot(false, "#f97316")} />IMPORT NAVIGATOR LAYER</button>
          </div>
        )}
      </div>
    </div>
  );
}
