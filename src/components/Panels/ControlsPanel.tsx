// ─── ControlsPanel — Security controls grid with deploy/undeploy ──

import { CONTROL_CATEGORIES } from '../../data/constants';
import { PopoutButton } from '../Analysis';

interface ControlsPanelProps {
  fwConfig: any;
  deployedControls: Set<string>;
  setDeployedControls: (fn: (prev: Set<string>) => Set<string>) => void;
  controlPreset: string;
  setControlPreset: (v: string) => void;
  activeTechniques: any[];
  exposures: Record<string, number>;
  effectiveExposures: Record<string, number>;
  popoutControls: boolean;
  setPopoutControls: (v: boolean) => void;
}

export function ControlsPanel({
  fwConfig, deployedControls, setDeployedControls,
  controlPreset, setControlPreset,
  activeTechniques, exposures, effectiveExposures,
  popoutControls, setPopoutControls,
}: ControlsPanelProps) {
  return (
    <>
      <h3 style={{ fontSize: "11px", color: "#14b8a6", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
        SECURITY CONTROLS
        {!popoutControls && <PopoutButton onClick={() => setPopoutControls(true)} title="Pop out Controls" />}
        <select value={controlPreset} onChange={e => {
          const preset = e.target.value;
          setControlPreset(preset);
          if (preset !== "none" && fwConfig.controlPresets[preset]) {
            setDeployedControls(() => new Set(fwConfig.controlPresets[preset].controls));
          }
        }} style={{
          background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155",
          borderRadius: "4px", padding: "3px 8px", fontSize: "9px", fontFamily: "inherit", marginLeft: "auto",
        }}>
          {Object.entries(fwConfig.controlPresets).map(([k, v]: [string, any]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
        {controlPreset !== "none" && fwConfig.controlPresets[controlPreset] && (
          <span style={{ fontSize: "8px", color: "#14b8a6" }}>
            {fwConfig.controlPresets[controlPreset].controls.filter((c: string) => deployedControls.has(c)).length}/{fwConfig.controlPresets[controlPreset].controls.length} for {fwConfig.controlPresets[controlPreset].name}
          </span>
        )}
      </h3>
      {CONTROL_CATEGORIES.map((cat: any) => {
        const catControls = fwConfig.securityControls.filter((c: any) => c.category === cat.id);
        const catDeployed = catControls.filter((c: any) => deployedControls.has(c.id)).length;
        const allDeployed = catDeployed === catControls.length;
        return (
          <div key={cat.id} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px" }}>{cat.icon}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {cat.name}
              </span>
              <span style={{ fontSize: "9px", color: "#64748b" }}>
                {catDeployed}/{catControls.length} deployed
              </span>
              <button onClick={() => {
                setDeployedControls(prev => {
                  const next = new Set(prev);
                  if (allDeployed) {
                    catControls.forEach((c: any) => next.delete(c.id));
                  } else {
                    catControls.forEach((c: any) => next.add(c.id));
                  }
                  return next;
                });
              }} style={{
                background: "transparent", color: allDeployed ? "#ef4444" : cat.color,
                border: "1px solid " + (allDeployed ? "#ef444466" : cat.color + "66"),
                borderRadius: "3px", padding: "2px 8px", fontSize: "8px", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
              }}>
                {allDeployed ? "CLEAR" : "DEPLOY ALL"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
              {catControls.map((ctrl: any) => {
                const deployed = deployedControls.has(ctrl.id);
                const techCount = Object.keys(ctrl.coverage).filter((tid: string) => activeTechniques.some((t: any) => t.id === tid)).length;
                return (
                  <div key={ctrl.id} style={{
                    background: "#0a0f1a", border: "1px solid " + (deployed ? cat.color + "30" : "#1e293b"),
                    borderRadius: "6px", padding: "10px",
                    borderLeft: "3px solid " + (deployed ? cat.color : "#1e293b"),
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: deployed ? cat.color : "#f8fafc" }}>{ctrl.name}</div>
                        <div style={{ fontSize: "8px", color: "#64748b" }}>{ctrl.cost} · {techCount} techniques</div>
                      </div>
                      <button onClick={() => {
                        setDeployedControls(prev => {
                          const next = new Set(prev);
                          if (next.has(ctrl.id)) next.delete(ctrl.id);
                          else next.add(ctrl.id);
                          return next;
                        });
                      }} style={{
                        background: deployed ? cat.color : "#334155",
                        color: deployed ? "#0a0f1a" : "#94a3b8",
                        border: "none", borderRadius: "4px", padding: "3px 8px",
                        fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {deployed ? "DEPLOYED" : "DEPLOY"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                      {Object.entries(ctrl.coverage).map(([tid, red]: [string, any]) => (
                        <span key={tid} style={{
                          fontSize: "7px", padding: "1px 3px", borderRadius: "2px",
                          background: deployed ? cat.color + "15" : "#1e293b",
                          color: deployed ? cat.color : "#475569",
                        }}>
                          {tid} ({(red * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Summary */}
      {deployedControls.size > 0 && (() => {
        const baseAvg = activeTechniques.reduce((s: number, t: any) => s + (exposures[t.id] ?? 1), 0) / activeTechniques.length;
        const effAvg = activeTechniques.reduce((s: number, t: any) => s + (effectiveExposures[t.id] ?? 1), 0) / activeTechniques.length;
        const reduction = baseAvg > 0 ? ((baseAvg - effAvg) / baseAvg * 100).toFixed(1) : "0.0";
        const costTally: Record<string, number> = {};
        fwConfig.securityControls.forEach((c: any) => {
          if (!deployedControls.has(c.id)) return;
          const tier = c.cost;
          costTally[tier] = (costTally[tier] || 0) + 1;
        });
        const costSummary = Object.entries(costTally).sort((a, b) => b[0].length - a[0].length).map(([t, n]) => n + "x" + t).join("  ");
        return (
          <div style={{ marginTop: "8px", padding: "10px 12px", background: "#14b8a610", borderRadius: "4px" }}>
            <div style={{ fontSize: "10px", color: "#14b8a6", marginBottom: "6px" }}>
              {deployedControls.size} control{deployedControls.size === 1 ? "" : "s"} deployed — average exposure reduced by {reduction}%
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "9px" }}>
              {CONTROL_CATEGORIES.map((cat: any) => {
                const catCtrls = fwConfig.securityControls.filter((c: any) => c.category === cat.id);
                const catDep = catCtrls.filter((c: any) => deployedControls.has(c.id)).length;
                return (
                  <span key={cat.id} style={{ color: catDep > 0 ? cat.color : "#475569" }}>
                    {cat.icon} {cat.name.split(" / ")[0]}: {catDep}/{catCtrls.length}
                  </span>
                );
              })}
              <span style={{ color: "#64748b", marginLeft: "auto" }}>Cost: {costSummary}</span>
            </div>
          </div>
        );
      })()}
    </>
  );
}
