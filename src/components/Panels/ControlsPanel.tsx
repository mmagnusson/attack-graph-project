// ─── ControlsPanel — Security controls grid with deploy/undeploy ──

import { CONTROL_CATEGORIES } from '../../data/constants';
import { PopoutButton } from '../Analysis';
import { theme } from '../../theme';

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
      <h3 style={{ fontSize: theme.fontSizes.body, color: theme.colors.teal, margin: "0 0 14px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: theme.spacing.lg }}>
        SECURITY CONTROLS
        {!popoutControls && <PopoutButton onClick={() => setPopoutControls(true)} title="Pop out Controls" />}
        <select value={controlPreset} onChange={e => {
          const preset = e.target.value;
          setControlPreset(preset);
          if (preset !== "none" && fwConfig.controlPresets[preset]) {
            setDeployedControls(() => new Set(fwConfig.controlPresets[preset].controls));
          }
        }} style={{
          ...theme.inputBase, padding: "5px 10px", fontSize: theme.fontSizes.small, marginLeft: "auto",
        }}>
          {Object.entries(fwConfig.controlPresets).map(([k, v]: [string, any]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
        {controlPreset !== "none" && fwConfig.controlPresets[controlPreset] && (
          <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.teal }}>
            {fwConfig.controlPresets[controlPreset].controls.filter((c: string) => deployedControls.has(c)).length}/{fwConfig.controlPresets[controlPreset].controls.length} for {fwConfig.controlPresets[controlPreset].name}
          </span>
        )}
      </h3>
      {CONTROL_CATEGORIES.map((cat: any) => {
        const catControls = fwConfig.securityControls.filter((c: any) => c.category === cat.id);
        const catDeployed = catControls.filter((c: any) => deployedControls.has(c.id)).length;
        const allDeployed = catDeployed === catControls.length;
        return (
          <div key={cat.id} style={{ marginBottom: theme.spacing.xxl }}>
            <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
              <span style={{ fontSize: theme.fontSizes.large }}>{cat.icon}</span>
              <span style={{ fontSize: theme.fontSizes.base, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {cat.name}
              </span>
              <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>
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
                background: "transparent", color: allDeployed ? theme.colors.red : cat.color,
                border: "1px solid " + (allDeployed ? "#ef444466" : cat.color + "66"),
                borderRadius: theme.radii.sm, padding: "4px 10px", fontSize: theme.fontSizes.tiny, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
              }}>
                {allDeployed ? "CLEAR" : "DEPLOY ALL"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: theme.spacing.lg }}>
              {catControls.map((ctrl: any) => {
                const deployed = deployedControls.has(ctrl.id);
                const techCount = Object.keys(ctrl.coverage).filter((tid: string) => activeTechniques.some((t: any) => t.id === tid)).length;
                return (
                  <div key={ctrl.id} style={{
                    background: theme.colors.bg, border: "1px solid " + (deployed ? cat.color + "30" : theme.colors.borderSubtle),
                    borderRadius: theme.radii.md, padding: theme.spacing.lg,
                    borderLeft: "3px solid " + (deployed ? cat.color : theme.colors.borderSubtle),
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm }}>
                      <div>
                        <div style={{ fontSize: theme.fontSizes.base, fontWeight: 600, color: deployed ? cat.color : theme.colors.textPrimary }}>{ctrl.name}</div>
                        <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>{ctrl.cost} · {techCount} techniques</div>
                      </div>
                      <button onClick={() => {
                        setDeployedControls(prev => {
                          const next = new Set(prev);
                          if (next.has(ctrl.id)) next.delete(ctrl.id);
                          else next.add(ctrl.id);
                          return next;
                        });
                      }} style={{
                        background: deployed ? cat.color : theme.colors.border,
                        color: deployed ? theme.colors.bg : theme.colors.textSecondary,
                        border: "none", borderRadius: theme.radii.sm, padding: "5px 10px",
                        fontSize: theme.fontSizes.tiny, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {deployed ? "DEPLOYED" : "DEPLOY"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.xs }}>
                      {Object.entries(ctrl.coverage).map(([tid, red]: [string, any]) => {
                        const tech = activeTechniques.find((t: any) => t.id === tid);
                        return (
                          <span key={tid} title={tech ? tech.name : tid} style={{
                            fontSize: theme.fontSizes.micro, padding: "2px 5px", borderRadius: theme.radii.sm,
                            background: deployed ? cat.color + "15" : theme.colors.borderSubtle,
                            color: deployed ? cat.color : theme.colors.textFaint,
                            fontFamily: '"JetBrains Mono", monospace',
                            cursor: "default",
                          }}>
                            {tid} ({(red * 100).toFixed(0)}%)
                          </span>
                        );
                      })}
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
          <div style={{ marginTop: theme.spacing.lg, padding: "12px 14px", background: "#14b8a610", borderRadius: theme.radii.sm }}>
            <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.teal, marginBottom: theme.spacing.md }}>
              {deployedControls.size} control{deployedControls.size === 1 ? "" : "s"} deployed — average exposure reduced by {reduction}%
            </div>
            <div style={{ display: "flex", gap: theme.spacing.xl, flexWrap: "wrap", fontSize: theme.fontSizes.small }}>
              {CONTROL_CATEGORIES.map((cat: any) => {
                const catCtrls = fwConfig.securityControls.filter((c: any) => c.category === cat.id);
                const catDep = catCtrls.filter((c: any) => deployedControls.has(c.id)).length;
                return (
                  <span key={cat.id} style={{ color: catDep > 0 ? cat.color : theme.colors.textFaint }}>
                    {cat.icon} {cat.name.split(" / ")[0]}: {catDep}/{catCtrls.length}
                  </span>
                );
              })}
              <span style={{ color: theme.colors.textMuted, marginLeft: "auto" }}>Cost: {costSummary}</span>
            </div>
          </div>
        );
      })()}
    </>
  );
}
