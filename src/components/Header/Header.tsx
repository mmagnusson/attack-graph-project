// ─── Header — Framework, data source, environment, platform, sector, budget, search ──

import type { RefObject } from 'react';
import { theme } from '../../theme';

interface HeaderProps {
  framework: string;
  setFramework: (v: string) => void;
  fwConfig: any;
  dataSource: string;
  setDataSource: (v: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  navFileInputRef: RefObject<HTMLInputElement | null>;
  handleStixFileUpload: (file: File) => void;
  handleNavigatorImport: (file: File) => void;
  uploadedFileName: string | null;
  stixError: string | null;
  uploadError: string | null;
  autoDetectedFw: string | null;
  envPreset: string;
  setEnvPreset: (v: string) => void;
  selectedPlatforms: Set<string> | null;
  setSelectedPlatforms: (fn: (prev: Set<string> | null) => Set<string> | null) => void;
  sectorFilter: string;
  setSectorFilter: (v: string) => void;
  remediationBudget: number;
  setRemediationBudget: (v: number) => void;
  techSearchQuery: string;
  setTechSearchQuery: (v: string) => void;
  displayTechniques: any[];
  activeTechniques: any[];
  activeChains: any[];
  showSubTechniques: boolean;
}

export function Header({
  framework, setFramework, fwConfig,
  dataSource, setDataSource,
  fileInputRef, navFileInputRef,
  handleStixFileUpload, handleNavigatorImport,
  uploadedFileName, stixError, uploadError, autoDetectedFw,
  envPreset, setEnvPreset,
  selectedPlatforms, setSelectedPlatforms,
  sectorFilter, setSectorFilter,
  remediationBudget, setRemediationBudget,
  techSearchQuery, setTechSearchQuery,
  displayTechniques, activeTechniques, activeChains,
  showSubTechniques,
}: HeaderProps) {
  return (
    <div style={{
      padding: "16px 24px",
      borderBottom: "1px solid " + theme.colors.borderSubtle,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.lg,
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, letterSpacing: "-0.5px" }}>
          AttackBreaker
        </h1>
        <p style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted, margin: "4px 0 0 0" }}>
          Weighted graph analysis for optimal cybersecurity remediation
        </p>
      </div>
      <div style={{ display: "flex", gap: theme.spacing.lg, alignItems: "center", flexWrap: "wrap" }}>
        {/* Framework selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Framework</label>
          <select value={framework} onChange={e => setFramework(e.target.value)}
            style={theme.inputBase}>
            <option value="enterprise">Enterprise ATT&CK</option>
            <option value="ics">ICS/OT ATT&CK</option>
          </select>
        </div>
        {/* Data Source selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Data Source</label>
          <div style={{ display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
            <select value={dataSource} onChange={e => setDataSource(e.target.value)}
              style={theme.inputBase}>
              {fwConfig.hasBuiltin && <option value="builtin">Built-in (8 chains)</option>}
              <option value="stix">MITRE ATT&CK STIX (Live)</option>
              {uploadedFileName && <option value="upload">Upload: {uploadedFileName}</option>}
            </select>
            <input type="file" ref={fileInputRef} accept=".json" style={{ display: "none" }}
              onChange={e => { if ((e.target as any).files[0]) handleStixFileUpload((e.target as any).files[0]); (e.target as any).value = ""; }} />
            <input type="file" ref={navFileInputRef} accept=".json" style={{ display: "none" }}
              onChange={e => { if ((e.target as any).files[0]) handleNavigatorImport((e.target as any).files[0]); (e.target as any).value = ""; }} />
            <button onClick={() => fileInputRef.current?.click()} style={{
              background: theme.colors.bgSurface, color: theme.colors.cyan, border: "1px solid " + theme.colors.cyan, borderRadius: theme.radii.sm,
              padding: "6px 10px", fontSize: theme.fontSizes.small, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>UPLOAD</button>
          </div>
        </div>
        <span style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.textMuted, background: theme.colors.bgSurface, alignSelf: "flex-end", marginBottom: "2px" }}>
          {displayTechniques.length}{showSubTechniques && displayTechniques.length !== activeTechniques.length ? "/" + activeTechniques.length : ""} techniques, {activeChains.length} chains
        </span>
        {stixError && (
          <span style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.red, background: "#ef444415", alignSelf: "flex-end", marginBottom: "2px" }}>
            STIX: {stixError}
          </span>
        )}
        {uploadError && (
          <span style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.red, background: "#ef444415", alignSelf: "flex-end", marginBottom: "2px" }}>
            Upload: {uploadError}
          </span>
        )}
        {autoDetectedFw && (
          <span style={{ ...theme.badge, fontSize: theme.fontSizes.small, color: theme.colors.green, background: "#22c55e15", alignSelf: "flex-end", marginBottom: "2px" }}>
            Auto-detected: {autoDetectedFw === "ics" ? "ICS/OT" : "Enterprise"} framework
          </span>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Environment</label>
          <select value={envPreset} onChange={e => setEnvPreset(e.target.value)}
            style={theme.inputBase}>
            {Object.entries(fwConfig.envPresets).map(([k, v]: [string, any]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Platforms</label>
          <div style={{ display: "flex", gap: theme.spacing.xs, flexWrap: "wrap" }}>
            {fwConfig.allPlatforms.map((p: string) => {
              const active = !selectedPlatforms || selectedPlatforms.has(p);
              return (
                <button key={p} onClick={() => {
                  setSelectedPlatforms(prev => {
                    if (!prev) {
                      return new Set([p]);
                    }
                    const next = new Set(prev);
                    if (next.has(p)) {
                      next.delete(p);
                      return next.size === 0 ? null : next;
                    }
                    next.add(p);
                    if (next.size === fwConfig.allPlatforms.length) return null;
                    return next;
                  });
                }} style={{
                  background: active ? theme.colors.blue : "transparent",
                  color: active ? "#fff" : theme.colors.textMuted,
                  border: "1px solid " + (active ? theme.colors.blue : theme.colors.border),
                  borderRadius: theme.radii.sm, padding: "4px 8px", fontSize: theme.fontSizes.tiny, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2,
                }}>{p}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Threat Sector</label>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
            style={theme.inputBase}>
            <option value="all">All Sectors</option>
            <option value="government">Government</option>
            <option value="financial">Financial</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Budget (nodes)</label>
          <input type="range" min={1} max={10} value={remediationBudget} onChange={e => setRemediationBudget(+e.target.value)}
            style={{ width: "80px", accentColor: theme.colors.orange }} />
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.orange, textAlign: "center" }}>{remediationBudget}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xs }}>
          <label style={theme.fieldLabel}>Search</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input type="text" value={techSearchQuery} onChange={e => setTechSearchQuery(e.target.value)}
              placeholder="Search techniques..."
              style={{ ...theme.inputBase, padding: "6px 28px 6px 10px", width: "160px" }} />
            {techSearchQuery && (
              <button onClick={() => setTechSearchQuery("")} style={{
                position: "absolute", right: 6, background: "transparent", border: "none", color: theme.colors.textMuted,
                cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "2px",
              }}>{"\u2715"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
