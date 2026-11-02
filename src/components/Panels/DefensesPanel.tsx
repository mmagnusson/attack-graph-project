// ─── DefensesPanel — current posture: mitigations, telemetry, overrides ─────

import { useMemo, useState } from 'react';
import type { AttackDataset, DefensePosture, FrameworkConfig } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { ENCODING } from '../../data/constants';
import { EditableCost, KindBadge, PanelTitle, SmallButton } from '../ui';
import { linkButton, mono } from '../styles';
import { theme } from '../../theme';

export interface DefenseHover {
  mitigationIds: string[];
  dataComponentIds: string[];
  label: string;
}

interface DefensesPanelProps {
  cfg: FrameworkConfig;
  dataset: AttackDataset;
  rm: RiskModelView;
  posture: DefensePosture;
  toggleMitigation: (id: string) => void;
  setDataComponents: (ids: string[], on: boolean) => void;
  toggleBlocked: (id: string) => void;
  applyPreset: (key: string) => void;
  clearPosture: () => void;
  fullCostOf: (itemId: string) => number;
  onSetCost: (itemId: string, cost: number) => void;
  onHoverDefense: (d: DefenseHover | null) => void;
  onSelectTech: (id: string) => void;
}

type Tab = 'mitigations' | 'telemetry';

export function DefensesPanel(p: DefensesPanelProps) {
  const { cfg, dataset, rm, posture } = p;
  const model = rm.model;
  const [tab, setTab] = useState<Tab>('mitigations');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preset, setPreset] = useState('none');
  const w = rm.totalWeight || 1;
  const q = query.trim().toLowerCase();

  // Reach of each defense: techniques it changes and modeled actors using them
  const reach = useMemo(() => {
    const out = new Map<string, { techs: number; actors: number }>();
    if (!model) return out;
    const tally = (techIdx: Iterable<number>) => {
      const t = new Set<number>(), a = new Set<number>();
      for (const i of techIdx) { t.add(i); model.techActors[i].forEach(x => a.add(x)); }
      return { techs: t.size, actors: a.size };
    };
    model.mitigationIds.forEach((id, mi) => out.set(id, tally(model.mitigationTechs[mi])));
    for (const ts of cfg.telemetrySources) {
      out.set(ts.id, tally(ts.dataComponents.flatMap(d => { const di = model.dcIndex.get(d); return di === undefined ? [] : [...model.dcTechs[di]]; })));
    }
    model.dcIds.forEach((id, di) => out.set(id, tally(model.dcTechs[di])));
    return out;
  }, [model, cfg]);

  const dcName = useMemo(() => new Map(dataset.dataComponents.map(d => [d.id, d.name])), [dataset]);
  const knownDcs = useMemo(() => new Set(dataset.dataComponents.map(d => d.id)), [dataset]);

  const mitigations = useMemo(() => dataset.mitigations
    .filter(m => m.actionable && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)))
    .map(m => ({ m, on: posture.mitigations.has(m.id), value: rm.marginal.get(m.id) ?? 0 }))
    .sort((a, b) => (a.on === b.on ? (a.on ? a.m.id.localeCompare(b.m.id) : b.value - a.value) : a.on ? -1 : 1)),
  [dataset, q, posture, rm.marginal]);

  const telemetry = useMemo(() => cfg.telemetrySources
    .map(ts => {
      const dcs = ts.dataComponents.filter(d => knownDcs.has(d));
      const have = dcs.filter(d => posture.dataComponents.has(d)).length;
      return { ts, dcs, have, value: rm.marginal.get(ts.id) ?? 0 };
    })
    .filter(x => x.dcs.length > 0 && (!q || x.ts.name.toLowerCase().includes(q) || x.dcs.some(d => (dcName.get(d) ?? '').toLowerCase().includes(q)))),
  [cfg, knownDcs, posture, rm.marginal, q, dcName]);

  const blocked = [...posture.blocked].sort();
  const techName = (id: string) => dataset.techniques.find(t => t.id === id)?.name ?? id;

  const valueLabel = (v: number, on: boolean) => on
    ? <span style={{ color: ENCODING.prevention, fontSize: theme.fontSizes.micro, fontWeight: 700 }}>{"✓"} IN PLACE</span>
    : v > 1e-6
      ? <span style={{ color: theme.colors.textBody, fontSize: theme.fontSizes.micro, fontVariantNumeric: "tabular-nums" }}>−{(v / w * 100).toFixed(1)} pts</span>
      : <span style={{ color: theme.colors.textFaint, fontSize: theme.fontSizes.micro }}>no effect alone</span>;

  return (
    <>
      <PanelTitle color={ENCODING.prevention}>YOUR DEFENSES</PanelTitle>
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: theme.spacing.lg }}>
        Record what you already have. Mitigations are MITRE's; telemetry is grouped from MITRE data components.
        Values show risk removed if that defense were added on its own right now.
      </div>

      <div style={{ display: "flex", gap: theme.spacing.md, alignItems: "center", flexWrap: "wrap", marginBottom: theme.spacing.lg }}>
        <select value={preset} onChange={e => setPreset(e.target.value)} style={{ ...theme.inputBase, flex: 1, minWidth: 180 }} aria-label="Starting posture">
          {Object.entries(cfg.posturePresets).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>
        <SmallButton onClick={() => p.applyPreset(preset)} color={ENCODING.prevention} title={cfg.posturePresets[preset]?.description}>APPLY</SmallButton>
        <SmallButton onClick={p.clearPosture} color={theme.colors.red}>CLEAR</SmallButton>
      </div>
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, marginBottom: theme.spacing.lg }}>
        {posture.mitigations.size} mitigations · {[...posture.dataComponents].filter(d => knownDcs.has(d)).length}/{dataset.dataComponents.length} data components
        {blocked.length > 0 && <> · {blocked.length} techniques assumed blocked</>}
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid " + theme.colors.borderSubtle, marginBottom: theme.spacing.lg }}>
        {([['mitigations', 'Mitigations (prevent)', ENCODING.prevention], ['telemetry', 'Telemetry (detect)', ENCODING.detection]] as const).map(([id, label, color]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "transparent", border: "none", borderBottom: "2px solid " + (tab === id ? color : "transparent"),
            color: tab === id ? theme.colors.textPrimary : theme.colors.textMuted, padding: "6px 14px", fontSize: theme.fontSizes.small,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{label}</button>
        ))}
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter…" aria-label="Filter defenses"
          style={{ ...theme.inputBase, marginLeft: "auto", width: 120, padding: "4px 8px", fontSize: theme.fontSizes.small }} />
      </div>

      {tab === 'mitigations' && mitigations.map(({ m, on, value }) => {
        const r = reach.get(m.id);
        const open = expanded === m.id;
        return (
          <div key={m.id} onMouseEnter={() => p.onHoverDefense({ mitigationIds: [m.id], dataComponentIds: [], label: m.name })}
            onMouseLeave={() => p.onHoverDefense(null)}
            style={{ borderTop: "1px solid " + theme.colors.borderSubtle, padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={on} onChange={() => p.toggleMitigation(m.id)} aria-label={"In place: " + m.name} />
              <button onClick={() => setExpanded(open ? null : m.id)} style={{ ...linkButton, flex: 1, textAlign: "left", color: theme.colors.textPrimary, fontSize: theme.fontSizes.small }}>
                <span style={{ ...mono, color: theme.colors.textFaint, fontSize: theme.fontSizes.micro, marginRight: 6 }}>{m.id}</span>
                {m.name}
                <span style={{ color: theme.colors.textFaint, marginLeft: 6, fontSize: theme.fontSizes.micro }}>{open ? "▲" : "▼"}</span>
              </button>
              {valueLabel(value, on)}
              <EditableCost value={p.fullCostOf(m.id)} onChange={v => p.onSetCost(m.id, v)} />
            </div>
            <div style={{ marginLeft: 24, fontSize: theme.fontSizes.micro, color: theme.colors.textMuted }}>
              {r?.techs ?? 0} techniques · used by {r?.actors ?? 0} modeled actors
            </div>
            {open && (
              <div style={{ marginLeft: 24, marginTop: 6, fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                {m.description}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {m.techniques.slice(0, 40).map(t => (
                    <button key={t} onClick={() => p.onSelectTech(t)} title={techName(t)} style={{ ...linkButton, ...mono, fontSize: theme.fontSizes.micro, padding: "2px 5px", borderRadius: theme.radii.sm, background: theme.colors.bgSurface, color: theme.colors.textSecondary }}>{t}</button>
                  ))}
                  {m.techniques.length > 40 && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint }}>+{m.techniques.length - 40} more</span>}
                </div>
                <a href={"https://attack.mitre.org/mitigations/" + m.id + "/"} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue, fontSize: theme.fontSizes.micro }}>MITRE {m.id} ↗</a>
              </div>
            )}
          </div>
        );
      })}

      {tab === 'telemetry' && telemetry.map(({ ts, dcs, have, value }) => {
        const r = reach.get(ts.id);
        const open = expanded === ts.id;
        const all = have === dcs.length;
        return (
          <div key={ts.id} onMouseEnter={() => p.onHoverDefense({ mitigationIds: [], dataComponentIds: dcs, label: ts.name })}
            onMouseLeave={() => p.onHoverDefense(null)}
            style={{ borderTop: "1px solid " + theme.colors.borderSubtle, padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={all} ref={el => { if (el) el.indeterminate = have > 0 && !all; }}
                onChange={() => p.setDataComponents(dcs, !all)} aria-label={"Collected: " + ts.name} />
              <button onClick={() => setExpanded(open ? null : ts.id)} style={{ ...linkButton, flex: 1, textAlign: "left", color: theme.colors.textPrimary, fontSize: theme.fontSizes.small }}>
                {ts.name}
                <span style={{ color: theme.colors.textFaint, marginLeft: 6, fontSize: theme.fontSizes.micro }}>{open ? "▲" : "▼"}</span>
              </button>
              {valueLabel(value, all)}
              <EditableCost value={p.fullCostOf(ts.id)} onChange={v => p.onSetCost(ts.id, v)} />
            </div>
            <div style={{ marginLeft: 24, fontSize: theme.fontSizes.micro, color: theme.colors.textMuted }}>
              {have}/{dcs.length} data components · detection analytics for {r?.techs ?? 0} techniques · {r?.actors ?? 0} actors
            </div>
            {open && (
              <div style={{ marginLeft: 24, marginTop: 6 }}>
                <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, marginBottom: 6 }}>{ts.description}</div>
                {dcs.map(d => {
                  const dr = reach.get(d);
                  return (
                    <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, padding: "2px 0", cursor: "pointer" }}
                      onMouseEnter={() => p.onHoverDefense({ mitigationIds: [], dataComponentIds: [d], label: dcName.get(d) ?? d })}>
                      <input type="checkbox" checked={posture.dataComponents.has(d)} onChange={e => p.setDataComponents([d], e.target.checked)} />
                      <span style={{ ...mono, color: theme.colors.textFaint, fontSize: theme.fontSizes.micro }}>{d}</span>
                      <span style={{ flex: 1 }}>{dcName.get(d)}</span>
                      <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.micro }}>{dr?.techs ?? 0} techniques</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {blocked.length > 0 && (
        <div style={{ marginTop: theme.spacing.xl }}>
          <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.sm }}>Assumed fully blocked (what-if)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {blocked.map(t => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: theme.fontSizes.tiny, padding: "3px 8px", borderRadius: theme.radii.pill, background: theme.colors.bgSurface, color: theme.colors.textBody }}>
                <button onClick={() => p.onSelectTech(t)} style={{ ...linkButton, ...mono, color: theme.colors.textBody }} title={techName(t)}>{t}</button>
                <button onClick={() => p.toggleBlocked(t)} aria-label={"Stop assuming " + t + " is blocked"} style={{ ...linkButton, color: theme.colors.textMuted }}>{"✕"}</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: theme.spacing.xl, display: "flex", gap: 8, alignItems: "center", fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, lineHeight: 1.6 }}>
        <KindBadge kind="mitigation" /> lowers a technique's success chance
        <KindBadge kind="telemetry" /> lets MITRE analytics catch it
      </div>
    </>
  );
}
