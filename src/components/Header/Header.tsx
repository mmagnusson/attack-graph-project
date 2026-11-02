// ─── Header — framework, data source, exposure, platforms, sector, search ──

import type { RefObject } from 'react';
import type { FrameworkConfig, FrameworkId } from '../../types';
import { SECTORS } from '../../engine/actorTags';
import { theme } from '../../theme';

interface HeaderProps {
  framework: FrameworkId;
  setFramework: (v: FrameworkId) => void;
  cfg: FrameworkConfig;
  bundledLabel: string;
  uploadedFileName: string | null;
  uploadActive: boolean;
  setUseUpload: (v: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  navFileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (file: File) => void;
  onNavigatorImport: (file: File) => void;
  loadError: string | null;
  uploadError: string | null;
  autoDetectedFw: FrameworkId | null;
  envPreset: string;
  setEnvPreset: (v: string) => void;
  selectedPlatforms: Set<string> | null;
  setSelectedPlatforms: (fn: (prev: Set<string> | null) => Set<string> | null) => void;
  sector: string;
  setSector: (v: string) => void;
  sectorCounts: Record<string, number>;
  techSearchQuery: string;
  setTechSearchQuery: (v: string) => void;
  techniqueCount: number;
  actorCount: number;
}

export function Header({ fileInputRef, navFileInputRef, ...p }: HeaderProps) {
  const { cfg } = p;
  const fileFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    return f;
  };
  return (
    <div style={{
      padding: "14px 24px", borderBottom: "1px solid " + theme.colors.borderSubtle,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: theme.spacing.lg, flexShrink: 0,
    }}>
      <div>
        <h1 style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>
          AttackBreaker
        </h1>
        <p style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted, margin: "4px 0 0 0" }}>
          Which defenses cut off the most attack paths per dollar
        </p>
      </div>
      <div style={{ display: "flex", gap: theme.spacing.lg, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel} htmlFor="ab-framework">Framework</label>
          <select id="ab-framework" value={p.framework} onChange={e => p.setFramework(e.target.value as FrameworkId)} style={theme.inputBase}>
            <option value="enterprise">Enterprise ATT&CK</option>
            <option value="ics">ICS/OT ATT&CK</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel} htmlFor="ab-data">Data</label>
          <div style={{ display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
            <select id="ab-data" value={p.uploadActive ? "upload" : "bundled"} onChange={e => p.setUseUpload(e.target.value === "upload")} style={theme.inputBase}>
              <option value="bundled">{p.bundledLabel}</option>
              {p.uploadedFileName && <option value="upload">Upload: {p.uploadedFileName}</option>}
            </select>
            <input type="file" ref={fileInputRef} accept=".json" style={{ display: "none" }} onChange={e => { const f = fileFrom(e); if (f) p.onUpload(f); }} />
            <input type="file" ref={navFileInputRef} accept=".json" style={{ display: "none" }} onChange={e => { const f = fileFrom(e); if (f) p.onNavigatorImport(f); }} />
            <button onClick={() => fileInputRef.current?.click()} title="Load a custom STIX 2.1 bundle (e.g. a newer ATT&CK release or your own CTI)" style={{
              background: theme.colors.bgSurface, color: theme.colors.cyan, border: "1px solid " + theme.colors.cyan, borderRadius: theme.radii.sm,
              padding: "6px 10px", fontSize: theme.fontSizes.small, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>UPLOAD STIX</button>
          </div>
        </div>
        <span style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.textMuted, background: theme.colors.bgSurface, alignSelf: "flex-end", marginBottom: "2px" }}>
          {p.techniqueCount} techniques · {p.actorCount} actors
        </span>
        {(p.loadError || p.uploadError) && (
          <span role="alert" style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.textPrimary, background: "#d03b3b30", alignSelf: "flex-end", marginBottom: "2px" }}>
            {"⚠"} {p.loadError ?? p.uploadError}
          </span>
        )}
        {p.autoDetectedFw && (
          <span style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.textPrimary, background: "#0ca30c30", alignSelf: "flex-end", marginBottom: "2px" }}>
            {"✓"} Detected {p.autoDetectedFw === "ics" ? "ICS/OT" : "Enterprise"} bundle
          </span>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel} htmlFor="ab-env">Base exposure</label>
          <select id="ab-env" value={p.envPreset} onChange={e => p.setEnvPreset(e.target.value)} style={theme.inputBase}
            title={cfg.envPresets[p.envPreset]?.description}>
            {Object.entries(cfg.envPresets).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        {cfg.allPlatforms.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
            <span style={theme.fieldLabel}>Platforms (filters techniques & analytics)</span>
            <div style={{ display: "flex", gap: theme.spacing.xs, flexWrap: "wrap", maxWidth: 520 }}>
              {cfg.allPlatforms.map(pl => {
                const active = !p.selectedPlatforms || p.selectedPlatforms.has(pl);
                return (
                  <button key={pl} aria-pressed={active} onClick={() => {
                    p.setSelectedPlatforms(prev => {
                      if (!prev) return new Set([pl]);
                      const next = new Set(prev);
                      if (next.has(pl)) {
                        next.delete(pl);
                        return next.size === 0 ? null : next;
                      }
                      next.add(pl);
                      return next.size === cfg.allPlatforms.length ? null : next;
                    });
                  }} style={{
                    background: active ? theme.colors.blue : "transparent",
                    color: active ? "#fff" : theme.colors.textMuted,
                    border: "1px solid " + (active ? theme.colors.blue : theme.colors.border),
                    borderRadius: theme.radii.sm, padding: "3px 7px", fontSize: theme.fontSizes.micro, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2,
                  }}>{pl}</button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel} htmlFor="ab-sector">Actors targeting</label>
          <select id="ab-sector" value={p.sector} onChange={e => p.setSector(e.target.value)} style={theme.inputBase}
            title="Sector tags are keyword-derived from MITRE group descriptions">
            <option value="all">All sectors</option>
            {SECTORS.filter(s => (p.sectorCounts[s.id] ?? 0) > 0).map(s => (
              <option key={s.id} value={s.id}>{s.label} ({p.sectorCounts[s.id]})</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel} htmlFor="ab-search">Search</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input id="ab-search" type="text" value={p.techSearchQuery} onChange={e => p.setTechSearchQuery(e.target.value)}
              placeholder="Technique ID or name…"
              style={{ ...theme.inputBase, padding: "6px 28px 6px 10px", width: "160px" }} />
            {p.techSearchQuery && (
              <button onClick={() => p.setTechSearchQuery("")} aria-label="Clear search" style={{
                position: "absolute", right: 6, background: "transparent", border: "none", color: theme.colors.textMuted,
                cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "2px",
              }}>{"✕"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
