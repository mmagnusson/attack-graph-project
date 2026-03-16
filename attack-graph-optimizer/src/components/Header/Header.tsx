// ─── Header — Framework, data source, environment, platform, sector, budget, search ──

import type { RefObject } from 'react';

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
      borderBottom: "1px solid #1e293b",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.5px" }}>
          ATT&CK Path Optimizer
        </h1>
        <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>
          Weighted graph analysis for optimal cybersecurity expenditure
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Framework selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Framework</label>
          <select value={framework} onChange={e => setFramework(e.target.value)}
            style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
            <option value="enterprise">Enterprise ATT&CK</option>
            <option value="ics">ICS/OT ATT&CK</option>
          </select>
        </div>
        {/* Data Source selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Data Source</label>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <select value={dataSource} onChange={e => setDataSource(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              {fwConfig.hasBuiltin && <option value="builtin">Built-in (8 chains)</option>}
              <option value="stix">MITRE ATT&CK STIX (Live)</option>
              {uploadedFileName && <option value="upload">Upload: {uploadedFileName}</option>}
            </select>
            <input type="file" ref={fileInputRef} accept=".json" style={{ display: "none" }}
              onChange={e => { if ((e.target as any).files[0]) handleStixFileUpload((e.target as any).files[0]); (e.target as any).value = ""; }} />
            <input type="file" ref={navFileInputRef} accept=".json" style={{ display: "none" }}
              onChange={e => { if ((e.target as any).files[0]) handleNavigatorImport((e.target as any).files[0]); (e.target as any).value = ""; }} />
            <button onClick={() => fileInputRef.current?.click()} style={{
              background: "#1e293b", color: "#06b6d4", border: "1px solid #06b6d4", borderRadius: "4px",
              padding: "4px 8px", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>UPLOAD</button>
          </div>
        </div>
        <span style={{ fontSize: "9px", color: "#64748b", padding: "2px 6px", background: "#1e293b", borderRadius: "8px", alignSelf: "flex-end", marginBottom: "2px" }}>
          {displayTechniques.length}{showSubTechniques && displayTechniques.length !== activeTechniques.length ? "/" + activeTechniques.length : ""} techniques, {activeChains.length} chains
        </span>
        {stixError && (
          <span style={{ fontSize: "9px", color: "#ef4444", padding: "2px 6px", background: "#ef444415", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
            STIX: {stixError}
          </span>
        )}
        {uploadError && (
          <span style={{ fontSize: "9px", color: "#ef4444", padding: "2px 6px", background: "#ef444415", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
            Upload: {uploadError}
          </span>
        )}
        {autoDetectedFw && (
          <span style={{ fontSize: "9px", color: "#22c55e", padding: "2px 6px", background: "#22c55e15", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
            Auto-detected: {autoDetectedFw === "ics" ? "ICS/OT" : "Enterprise"} framework
          </span>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Environment</label>
          <select value={envPreset} onChange={e => setEnvPreset(e.target.value)}
            style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
            {Object.entries(fwConfig.envPresets).map(([k, v]: [string, any]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Platforms</label>
          <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
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
                  background: active ? "#3b82f6" : "transparent",
                  color: active ? "#fff" : "#64748b",
                  border: "1px solid " + (active ? "#3b82f6" : "#334155"),
                  borderRadius: "3px", padding: "2px 5px", fontSize: "8px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2,
                }}>{p}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Threat Sector</label>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
            style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
            <option value="all">All Sectors</option>
            <option value="government">Government</option>
            <option value="financial">Financial</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Budget (nodes)</label>
          <input type="range" min={1} max={10} value={remediationBudget} onChange={e => setRemediationBudget(+e.target.value)}
            style={{ width: "80px", accentColor: "#f59e0b" }} />
          <span style={{ fontSize: "10px", color: "#f59e0b", textAlign: "center" }}>{remediationBudget}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Search</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input type="text" value={techSearchQuery} onChange={e => setTechSearchQuery(e.target.value)}
              placeholder="Search techniques..."
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 24px 4px 8px", fontSize: "11px", fontFamily: "inherit", width: "150px" }} />
            {techSearchQuery && (
              <button onClick={() => setTechSearchQuery("")} style={{
                position: "absolute", right: 4, background: "transparent", border: "none", color: "#64748b",
                cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: "2px",
              }}>{"\u2715"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
