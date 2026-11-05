// ─── DefensesPanel — current posture in the active defense vocabulary ───────

import { useMemo, useState } from 'react';
import type { D3fendDataset, DefensePosture, DefenseVocabulary, FrameworkConfig, VocabularyId } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { d3fendRole } from '../../engine/defenseVocabulary';
import { ENCODING } from '../../data/constants';
import { EditableCost, KindBadge, PanelTitle, SmallButton, VocabularySwitch } from '../ui';
import { linkButton, mono } from '../styles';
import { d3fendUrl, mitigationUrl } from '../links';
import { theme } from '../../theme';

export interface DefenseHover {
  preventIds: string[];
  detectIds: string[];
  label: string;
}

interface DefensesPanelProps {
  cfg: FrameworkConfig;
  vocabulary: DefenseVocabulary;
  setVocabulary: (v: VocabularyId) => void;
  d3fend: D3fendDataset | null;
  rm: RiskModelView;
  posture: DefensePosture;
  togglePrevent: (id: string) => void;
  setDetect: (ids: string[], on: boolean) => void;
  toggleBlocked: (id: string) => void;
  applyPreset: (key: string) => void;
  importFromAttack: () => void;
  attackPostureSize: number;
  clearPosture: () => void;
  fullCostOf: (itemId: string) => number;
  onSetCost: (itemId: string, cost: number) => void;
  onHoverDefense: (d: DefenseHover | null) => void;
  onSelectTech: (id: string) => void;
  techName: (id: string) => string;
}

type Tab = 'prevent' | 'detect';

const GROUP_ORDER = (g: string | undefined) => (g ? ['Harden', 'Isolate', 'Detect', 'Deceive'].indexOf(g) : 0);

export function DefensesPanel(p: DefensesPanelProps) {
  const { cfg, vocabulary, d3fend, rm, posture } = p;
  const model = rm.model;
  const isD3 = vocabulary.id === 'd3fend';
  const [tab, setTab] = useState<Tab>('prevent');
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
    model.preventionIds.forEach((id, mi) => out.set(id, tally(model.preventionTechs[mi])));
    for (const b of vocabulary.bundles) {
      out.set(b.id, tally(b.components.flatMap(d => { const di = model.componentIndex.get(d); return di === undefined ? [] : [...model.componentTechs[di]]; })));
    }
    model.componentIds.forEach((id, di) => out.set(id, tally(model.componentTechs[di])));
    return out;
  }, [model, vocabulary]);

  const componentName = useMemo(() => new Map(vocabulary.components.map(c => [c.id, c.name])), [vocabulary]);
  const known = useMemo(() => new Set(vocabulary.components.map(c => c.id)), [vocabulary]);

  const preventions = useMemo(() => vocabulary.preventions
    .filter(m => m.actionable && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)))
    .map(m => ({ m, on: posture.prevent.has(m.id), value: rm.marginal.get(m.id) ?? 0 }))
    .sort((a, b) => (GROUP_ORDER(a.m.group) - GROUP_ORDER(b.m.group))
      || (a.on === b.on ? (a.on ? a.m.id.localeCompare(b.m.id) : b.value - a.value) : a.on ? -1 : 1)),
  [vocabulary, q, posture, rm.marginal]);

  const bundles = useMemo(() => vocabulary.bundles
    .map(b => {
      const comps = b.components.filter(d => known.has(d));
      const have = comps.filter(d => posture.detect.has(d)).length;
      return { b, comps, have, value: rm.marginal.get(b.id) ?? 0 };
    })
    .filter(x => x.comps.length > 0 && (!q || x.b.name.toLowerCase().includes(q) || x.comps.some(d => (componentName.get(d) ?? '').toLowerCase().includes(q)))),
  [vocabulary, known, posture, rm.marginal, q, componentName]);

  const unscored = useMemo(() => (isD3 && d3fend ? d3fend.bases.filter(b => ['foundation', 'response', 'recovery'].includes(d3fendRole(b.tactic))) : []), [isD3, d3fend]);
  const blocked = [...posture.blocked].sort();

  const valueLabel = (v: number, on: boolean) => on
    ? <span style={{ color: theme.colors.textBody, fontSize: theme.fontSizes.micro, fontWeight: 700 }}><span style={{ color: ENCODING.prevention }}>{"✓"}</span> IN PLACE</span>
    : v > 1e-6
      ? <span style={{ color: theme.colors.textBody, fontSize: theme.fontSizes.micro, fontVariantNumeric: "tabular-nums" }}>−{(v / w * 100).toFixed(1)} pts</span>
      : <span style={{ color: theme.colors.textFaint, fontSize: theme.fontSizes.micro }}>no effect alone</span>;

  const linkFor = (id: string) => isD3
    ? (d3fend?.techniques[id] ? d3fendUrl(d3fend.techniques[id].iri) : undefined)
    : (id.startsWith('M') ? mitigationUrl(id) : undefined);

  const groupHeader = (group: string | undefined, prev: string | undefined) => isD3 && group && group !== prev
    ? <div style={{ ...theme.sectionLabel, margin: "14px 0 4px" }}>{group}</div> : null;

  return (
    <>
      <PanelTitle color={ENCODING.prevention}>YOUR DEFENSES</PanelTitle>
      <VocabularySwitch value={vocabulary.id} onChange={p.setVocabulary} />
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6, margin: "10px 0 12px" }}>
        {isD3
          ? <>Record the D3FEND countermeasures you run. Harden and Isolate lower technique success; Detect and Deceive raise alerts.
            Coverage comes from D3FEND's inferred links between countermeasures and ATT&CK techniques (through shared digital artifacts).</>
          : <>Record what you already have. Mitigations are MITRE's; telemetry is grouped from the data components MITRE's detection analytics need.</>}
        {" "}Values show risk removed if that defense were added on its own right now.
      </div>

      <div style={{ display: "flex", gap: theme.spacing.md, alignItems: "center", flexWrap: "wrap", marginBottom: theme.spacing.lg }}>
        <select value={preset} onChange={e => setPreset(e.target.value)} style={{ ...theme.inputBase, flex: 1, minWidth: 180 }} aria-label="Starting posture">
          {Object.entries(cfg.posturePresets).map(([k, v]) => <option key={k} value={k}>{v.name}{isD3 && k !== 'none' ? ' → D3FEND' : ''}</option>)}
        </select>
        <SmallButton onClick={() => p.applyPreset(preset)} color={ENCODING.prevention} title={cfg.posturePresets[preset]?.description}>APPLY</SmallButton>
        <SmallButton onClick={p.clearPosture} color={theme.colors.red}>CLEAR</SmallButton>
      </div>
      {isD3 && p.attackPostureSize > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: theme.spacing.lg, fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
          <span style={{ flex: 1 }}>Carry over your ATT&CK posture through MITRE's mitigation → D3FEND links.</span>
          <SmallButton onClick={p.importFromAttack} color={ENCODING.prevention}>IMPORT</SmallButton>
        </div>
      )}
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, marginBottom: theme.spacing.lg }}>
        {posture.prevent.size} prevention items · {[...posture.detect].filter(d => known.has(d)).length}/{vocabulary.components.length} detection {isD3 ? 'countermeasures' : 'data components'}
        {blocked.length > 0 && <> · {blocked.length} techniques assumed blocked</>}
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid " + theme.colors.borderSubtle, marginBottom: theme.spacing.lg }}>
        {([['prevent', isD3 ? 'Harden · Isolate' : 'Mitigations (prevent)', ENCODING.prevention], ['detect', isD3 ? 'Detect · Deceive' : 'Telemetry (detect)', ENCODING.detection]] as const).map(([id, label, color]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "transparent", border: "none", borderBottom: "2px solid " + (tab === id ? color : "transparent"),
            color: tab === id ? theme.colors.textPrimary : theme.colors.textMuted, padding: "6px 12px", fontSize: theme.fontSizes.small,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{label}</button>
        ))}
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter…" aria-label="Filter defenses"
          style={{ ...theme.inputBase, marginLeft: "auto", width: 110, padding: "4px 8px", fontSize: theme.fontSizes.small }} />
      </div>

      {tab === 'prevent' && preventions.map(({ m, on, value }, i) => {
        const r = reach.get(m.id);
        const open = expanded === m.id;
        const via = !isD3 && d3fend ? (d3fend.mitigations[m.id] ?? []) : [];
        return (
          <div key={m.id}>
            {groupHeader(m.group, i > 0 ? preventions[i - 1].m.group : undefined)}
            <div onMouseEnter={() => p.onHoverDefense({ preventIds: [m.id], detectIds: [], label: m.name })} onMouseLeave={() => p.onHoverDefense(null)}
              style={{ borderTop: "1px solid " + theme.colors.borderSubtle, padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={on} onChange={() => p.togglePrevent(m.id)} aria-label={"In place: " + m.name} />
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
                  {via.length > 0 && d3fend && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ color: theme.colors.textMuted }}>Implemented by D3FEND: </span>
                      {via.map((d, j) => <span key={d}>{j > 0 && ", "}<a href={d3fendUrl(d3fend.techniques[d].iri)} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue }}>{d3fend.techniques[d].name}</a></span>)}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {m.techniques.slice(0, 40).map(t => (
                      <button key={t} onClick={() => p.onSelectTech(t)} title={p.techName(t)} style={{ ...linkButton, ...mono, fontSize: theme.fontSizes.micro, padding: "2px 5px", borderRadius: theme.radii.sm, background: theme.colors.bgSurface, color: theme.colors.textSecondary }}>{t}</button>
                    ))}
                    {m.techniques.length > 40 && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint }}>+{m.techniques.length - 40} more</span>}
                  </div>
                  {linkFor(m.id) && <a href={linkFor(m.id)} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue, fontSize: theme.fontSizes.micro }}>{isD3 ? 'D3FEND' : 'MITRE'} {m.id} ↗</a>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {tab === 'detect' && bundles.map(({ b, comps, have, value }, i) => {
        const r = reach.get(b.id);
        const open = expanded === b.id;
        const all = have === comps.length;
        return (
          <div key={b.id}>
            {groupHeader(b.group, i > 0 ? bundles[i - 1].b.group : undefined)}
            <div onMouseEnter={() => p.onHoverDefense({ preventIds: [], detectIds: comps, label: b.name })} onMouseLeave={() => p.onHoverDefense(null)}
              style={{ borderTop: "1px solid " + theme.colors.borderSubtle, padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={all} ref={el => { if (el) el.indeterminate = have > 0 && !all; }}
                  onChange={() => p.setDetect(comps, !all)} aria-label={"Deployed: " + b.name} />
                <button onClick={() => setExpanded(open ? null : b.id)} style={{ ...linkButton, flex: 1, textAlign: "left", color: theme.colors.textPrimary, fontSize: theme.fontSizes.small }}>
                  {isD3 && <span style={{ ...mono, color: theme.colors.textFaint, fontSize: theme.fontSizes.micro, marginRight: 6 }}>{b.id}</span>}
                  {b.name}
                  <span style={{ color: theme.colors.textFaint, marginLeft: 6, fontSize: theme.fontSizes.micro }}>{open ? "▲" : "▼"}</span>
                </button>
                {valueLabel(value, all)}
                <EditableCost value={p.fullCostOf(b.id)} onChange={v => p.onSetCost(b.id, v)} />
              </div>
              <div style={{ marginLeft: 24, fontSize: theme.fontSizes.micro, color: theme.colors.textMuted }}>
                {have}/{comps.length} {isD3 ? 'countermeasures' : 'data components'} · detection for {r?.techs ?? 0} techniques · {r?.actors ?? 0} actors
              </div>
              {open && (
                <div style={{ marginLeft: 24, marginTop: 6 }}>
                  <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, marginBottom: 6 }}>{b.description}</div>
                  {comps.map(d => {
                    const dr = reach.get(d);
                    const href = isD3 && d3fend?.techniques[d] ? d3fendUrl(d3fend.techniques[d].iri) : undefined;
                    return (
                      <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, padding: "2px 0", cursor: "pointer" }}
                        onMouseEnter={() => p.onHoverDefense({ preventIds: [], detectIds: [d], label: componentName.get(d) ?? d })}>
                        <input type="checkbox" checked={posture.detect.has(d)} onChange={e => p.setDetect([d], e.target.checked)} />
                        <span style={{ ...mono, color: theme.colors.textFaint, fontSize: theme.fontSizes.micro }}>{d}</span>
                        <span style={{ flex: 1 }}>{componentName.get(d)}{href && <a href={href} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: theme.colors.blue, marginLeft: 4, fontSize: theme.fontSizes.micro }}>↗</a>}</span>
                        <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.micro }}>{dr?.techs ?? 0} techniques</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {unscored.length > 0 && tab === 'prevent' && (
        <div style={{ marginTop: theme.spacing.xl, fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, lineHeight: 1.6 }}>
          <div style={{ ...theme.sectionLabel, marginBottom: 4 }}>Not scored by the model</div>
          Model (asset, network and activity mapping) underpins every other countermeasure; Evict removes an adversary you
          have already found, which the model covers through response effectiveness; Restore limits damage afterwards.
          None of them is ranked on its own:{" "}
          {unscored.map((b, j) => <span key={b.id}>{j > 0 && ", "}<a href={d3fend ? d3fendUrl(d3fend.techniques[b.id]?.iri ?? '') : '#'} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue }}>{b.name}</a></span>)}.
        </div>
      )}

      {blocked.length > 0 && (
        <div style={{ marginTop: theme.spacing.xl }}>
          <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.sm }}>Assumed fully blocked (what-if, both catalogs)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {blocked.map(t => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: theme.fontSizes.tiny, padding: "3px 8px", borderRadius: theme.radii.pill, background: theme.colors.bgSurface, color: theme.colors.textBody }}>
                <button onClick={() => p.onSelectTech(t)} style={{ ...linkButton, ...mono, color: theme.colors.textBody }} title={p.techName(t)}>{t}</button>
                <button onClick={() => p.toggleBlocked(t)} aria-label={"Stop assuming " + t + " is blocked"} style={{ ...linkButton, color: theme.colors.textMuted }}>{"✕"}</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: theme.spacing.xl, display: "flex", gap: 8, alignItems: "center", fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, lineHeight: 1.6 }}>
        <KindBadge kind="prevent" /> lowers a technique's success
        <KindBadge kind="detect" /> raises alerts on it
      </div>
    </>
  );
}
