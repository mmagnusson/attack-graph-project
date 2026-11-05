// ─── DetailPanel — one technique: residual risk, MITRE mitigations, MITRE detection ──

import { useMemo, useState } from 'react';
import type { AttackChain, AttackDataset, D3fendDataset, DefensePosture, FrameworkConfig, Technique, TechniqueAssessment, VocabularyId } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { simulateAddition } from '../../engine/riskModel';
import { d3fendRole } from '../../engine/defenseVocabulary';
import { fmtPct } from '../../engine/displayMetrics';
import { CHAIN_COLORS, ENCODING } from '../../data/constants';
import { MetricBox, PopoutButton } from '../Analysis';
import { Meter, SmallButton } from '../ui';
import { linkButton, mono } from '../styles';
import { d3fendUrl, detectionStrategyUrl, mitigationUrl, techniqueUrl } from '../links';
import { theme } from '../../theme';

interface DetailPanelProps {
  cfg: FrameworkConfig;
  dataset: AttackDataset;
  rm: RiskModelView;
  posture: DefensePosture;
  tech: Technique | undefined;
  platforms: ReadonlySet<string> | null;
  exposure: number;
  exposureOverridden: boolean;
  setExposure: (id: string, v: number | undefined) => void;
  vocabulary: VocabularyId;
  d3fend: D3fendDataset | null;
  togglePrevent: (id: string) => void;
  setDetect: (ids: string[], on: boolean) => void;
  toggleBlocked: (id: string) => void;
  assessment: Record<string, TechniqueAssessment> | null;
  chains: AttackChain[];
  colorOf: (id: string) => number | undefined;
  toggleHighlighted: (id: string) => void;
  onSelectTech: (id: string) => void;
  showSubTechniques: boolean;
  popout: boolean;
  onPopout: () => void;
}

export function DetailPanel(p: DetailPanelProps) {
  const { cfg, dataset, rm, posture, tech } = p;
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [showAllActors, setShowAllActors] = useState(false);

  const family = useMemo(() => {
    if (!tech) return [] as string[];
    if (tech.parentId || p.showSubTechniques) return [tech.id];
    return dataset.techniques.filter(t => t.id === tech.id || t.parentId === tech.id).map(t => t.id);
  }, [tech, dataset, p.showSubTechniques]);

  const blockImpact = useMemo(() => {
    if (!tech || !rm.model || !rm.baseState || rm.baseState.risk === 0) return 0;
    if (posture.blocked.has(tech.id)) return 0;
    return 1 - simulateAddition(rm.model, rm.params, rm.baseState, { blocked: [tech.id] }) / rm.baseState.risk;
  }, [tech, rm.model, rm.params, rm.baseState, posture]);

  const users = useMemo(() => {
    const fam = new Set(family);
    return p.chains
      .filter(c => c.path.some(t => fam.has(t)))
      .map(c => ({ c, v: rm.viabilityById.get(c.id) ?? 0 }))
      .sort((a, b) => b.v - a.v);
  }, [family, p.chains, rm.viabilityById]);

  if (!tech) {
    return (
      <div style={{ paddingTop: 40, textAlign: "center", color: theme.colors.textMuted, fontSize: theme.fontSizes.small, lineHeight: 1.7 }}>
        <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>{"⬡"}</div>
        Click a technique on the graph to see its residual risk, MITRE mitigations,<br />and MITRE detection strategy with the telemetry each analytic needs.
      </div>
    );
  }

  const m = rm.metrics[tech.id];
  const parent = tech.parentId;
  const mitigations = dataset.mitigations.filter(x => x.techniques.includes(tech.id) || (parent && x.techniques.includes(parent)));
  const note = (mid: string) => dataset.mitigationNotes[tech.id]?.[mid] ?? (parent ? dataset.mitigationNotes[parent]?.[mid] : undefined);
  const strategy = dataset.detections[tech.id];
  const subStrategies = family.length > 1 ? family.filter(id => id !== tech.id && dataset.detections[id]).length : 0;
  const dcName = (id: string) => dataset.dataComponents.find(d => d.id === id)?.name ?? id;
  const assess = p.assessment?.[tech.id];
  const isBlocked = posture.blocked.has(tech.id);
  const isAttack = p.vocabulary === 'attack';
  const shownUsers = showAllActors ? users : users.slice(0, 8);

  return (
    <>
      <h3 style={{ ...theme.panelHeading }}>
        {tech.id}
        {!p.popout && <PopoutButton onClick={p.onPopout} title="Pop out Detail" />}
      </h3>
      <div style={{ fontSize: theme.fontSizes.large, fontWeight: 700, color: theme.colors.textPrimary }}>{tech.name}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 12px" }}>
        {tech.tactics.map(tid => {
          const t = cfg.tactics.find(x => x.id === tid);
          return <span key={tid} style={{ fontSize: theme.fontSizes.micro, padding: "2px 7px", borderRadius: theme.radii.sm, background: (t?.color ?? "#666") + "26", color: theme.colors.textBody }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: t?.color, marginRight: 5 }} />{t?.name ?? tid}
          </span>;
        })}
        {tech.platforms.length > 0 && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, alignSelf: "center" }}>{tech.platforms.join(" · ")}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <MetricBox label="Residual success" value={m ? (m.success * 100).toFixed(0) : "–"} unit="%" color={ENCODING.success} />
        <MetricBox label="Detection coverage" value={m ? (m.detection * 100).toFixed(0) : "–"} unit="%" color={ENCODING.detection} />
        <MetricBox label="Actors using" value={m?.actors ?? 0} unit={"/" + (rm.model?.actors.length ?? 0)} color={theme.colors.textBody} />
        <MetricBox label="Risk if blocked" value={isBlocked ? "blocked" : "−" + (blockImpact * 100).toFixed(1)} unit={isBlocked ? "" : "%"} color={theme.colors.textBody} />
      </div>
      {family.length > 1 && <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: -6, marginBottom: 10 }}>Figures include {family.length - 1} sub-techniques (shown rolled up).</div>}

      <div style={{ display: "flex", gap: theme.spacing.lg, alignItems: "center", flexWrap: "wrap", marginBottom: theme.spacing.xl }}>
        <SmallButton onClick={() => p.toggleBlocked(tech.id)} color={isBlocked ? ENCODING.cut : theme.colors.textSecondary}
          title="What-if: treat this technique and its sub-techniques as fully blocked">
          {isBlocked ? "✓ ASSUMED BLOCKED — UNDO" : "ASSUME FULLY BLOCKED"}
        </SmallButton>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, flex: 1, minWidth: 220 }}>
          Base exposure
          <input type="range" min={0} max={100} value={Math.round(p.exposure * 100)} onChange={e => p.setExposure(tech.id, Number(e.target.value) / 100)}
            style={{ flex: 1, accentColor: ENCODING.success }} aria-label="Base exposure" />
          <span style={{ width: 34, color: theme.colors.textBody, fontVariantNumeric: "tabular-nums" }}>{fmtPct(p.exposure)}</span>
          {p.exposureOverridden && <button onClick={() => p.setExposure(tech.id, undefined)} style={{ ...linkButton, color: theme.colors.blue }}>reset</button>}
        </label>
      </div>

      {/* MITRE mitigations */}
      <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.sm }}>
        <span style={{ color: ENCODING.prevention }}>{"⛨"}</span> MITRE mitigations ({mitigations.length})
      </div>
      {mitigations.length === 0 && <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted, marginBottom: 12 }}>MITRE lists no mitigation for this technique — detection is the only lever.</div>}
      {mitigations.map(x => {
        const n = note(x.id);
        const open = openNote === x.id;
        const inherited = !x.techniques.includes(tech.id);
        return (
          <div key={x.id} style={{ padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isAttack
                ? <input type="checkbox" disabled={!x.actionable} checked={posture.prevent.has(x.id)} onChange={() => p.togglePrevent(x.id)} aria-label={"In place: " + x.name} />
                : <span style={{ width: 13 }} />}
              <span style={{ ...mono, fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, width: 44 }}>{x.id}</span>
              <button onClick={() => setOpenNote(open ? null : x.id)} style={{ ...linkButton, flex: 1, textAlign: "left", fontSize: theme.fontSizes.small, color: theme.colors.textBody }}>
                {x.name}{inherited && <span style={{ color: theme.colors.textFaint }}> (via {parent})</span>}
                {!x.actionable && <span style={{ color: theme.colors.textFaint }}> — not deployable</span>}
                <span style={{ color: theme.colors.textFaint, marginLeft: 6, fontSize: theme.fontSizes.micro }}>{open ? "▲" : "▼"}</span>
              </button>
            </div>
            {open && (
              <div style={{ marginLeft: 60, marginTop: 4, padding: 10, background: theme.colors.bgCard, borderRadius: theme.radii.sm, fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
                {n || x.description}
                {p.d3fend && (p.d3fend.mitigations[x.id] ?? []).length > 0 && (
                  <div style={{ marginTop: 4, fontSize: theme.fontSizes.tiny }}>
                    <span style={{ color: theme.colors.textMuted }}>Implemented by D3FEND: </span>
                    {p.d3fend.mitigations[x.id].map((d, j) => <span key={d}>{j > 0 && ", "}<a href={d3fendUrl(p.d3fend!.techniques[d].iri)} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue }}>{p.d3fend!.techniques[d].name}</a></span>)}
                  </div>
                )}
                <div><a href={mitigationUrl(x.id)} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue, fontSize: theme.fontSizes.micro }}>MITRE {x.id} ↗</a></div>
              </div>
            )}
          </div>
        );
      })}

      {/* MITRE detection strategy */}
      <div style={{ ...theme.sectionLabel, margin: "18px 0 6px" }}>
        <span style={{ color: ENCODING.detection }}>{"◉"}</span> MITRE detection
      </div>
      {!strategy && <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>No detection strategy in ATT&CK v{cfg.attackVersion} for this technique.</div>}
      {strategy && (
        <>
          <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, marginBottom: 6 }}>
            <a href={detectionStrategyUrl(strategy.id)} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue }}>{strategy.id}</a> {strategy.name}
            {subStrategies > 0 && <span style={{ color: theme.colors.textMuted }}> · sub-techniques have {subStrategies} more strategies</span>}
          </div>
          {strategy.analytics.map(a => {
            const outside = !!p.platforms && p.platforms.size > 0 && a.platforms.length > 0 && !a.platforms.some(x => p.platforms!.has(x));
            const have = isAttack ? a.dataComponents.filter(d => posture.detect.has(d)).length : 0;
            const open = openNote === a.id;
            return (
              <div key={a.id} style={{ padding: "6px 8px", marginBottom: 4, background: theme.colors.bgCard, borderRadius: theme.radii.sm, opacity: outside ? 0.5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...mono, fontSize: theme.fontSizes.micro, color: theme.colors.textMuted }}>{a.id}</span>
                  <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody }}>{a.platforms.join(", ") || "All platforms"}</span>
                  {outside && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted }}>outside selected platforms</span>}
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Meter value={a.dataComponents.length ? have / a.dataComponents.length : 0} color={ENCODING.detection} width={50} label="Telemetry collected for this analytic" />
                    <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textBody, fontVariantNumeric: "tabular-nums" }}>{have}/{a.dataComponents.length}</span>
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {a.dataComponents.map(d => {
                    const on = isAttack && posture.detect.has(d);
                    return (
                      <button key={d} disabled={!isAttack} onClick={() => p.setDetect([d], !on)}
                        title={isAttack ? (on ? "Collected — click to remove" : "Not collected — click to mark collected") + " (" + d + ")" : "Switch to the ATT&CK catalog to record telemetry (" + d + ")"}
                        style={{ ...linkButton, fontSize: theme.fontSizes.micro, padding: "2px 6px", borderRadius: theme.radii.sm,
                          background: on ? ENCODING.detection + "26" : "transparent", border: "1px solid " + (on ? ENCODING.detection : theme.colors.border), color: theme.colors.textBody }}>
                        {on ? "✓ " : ""}{dcName(d)}
                      </button>
                    );
                  })}
                  {a.dataComponents.length === 0 && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint }}>No log sources listed</span>}
                  {a.description && (
                    <button onClick={() => setOpenNote(open ? null : a.id)} style={{ ...linkButton, fontSize: theme.fontSizes.micro, color: theme.colors.blue }}>{open ? "hide logic" : "show logic"}</button>
                  )}
                </div>
                {open && <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, lineHeight: 1.5, marginTop: 4 }}>{a.description}</div>}
              </div>
            );
          })}
        </>
      )}

      {/* D3FEND countermeasures */}
      <D3fendSection d3fend={p.d3fend} family={family} vocabulary={p.vocabulary} posture={posture}
        togglePrevent={p.togglePrevent} setDetect={p.setDetect} />

      {assess && assess.sources.length > 0 && (
        <div style={{ marginTop: theme.spacing.lg, padding: 10, background: theme.colors.bgCard, borderRadius: theme.radii.sm }}>
          <div style={{ ...theme.sectionLabel, marginBottom: 4 }}>Your tools (estimated coverage)</div>
          {assess.sources.map(s => (
            <div key={s.toolId} style={{ display: "flex", gap: 10, fontSize: theme.fontSizes.small, color: theme.colors.textBody }}>
              <span style={{ flex: 1 }}>{s.name}</span>
              <span style={{ color: theme.colors.textSecondary }}>detect ~{fmtPct(s.detect)}</span>
              <span style={{ color: theme.colors.textSecondary }}>prevent ~{fmtPct(s.prevent)}</span>
            </div>
          ))}
          <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, marginTop: 4 }}>Author estimates, not MITRE Evaluations results.</div>
        </div>
      )}

      {/* Actors */}
      <div style={{ ...theme.sectionLabel, margin: "18px 0 6px" }}>Used by {users.length} modeled actors</div>
      {shownUsers.map(({ c, v }) => {
        const hi = p.colorOf(c.id) ?? -1;
        const usage = family.map(t => dataset.usageNotes[c.id]?.[t]).find(Boolean);
        return (
          <div key={c.id} style={{ padding: "3px 0", borderLeft: hi >= 0 ? "3px solid " + CHAIN_COLORS[hi].color : "3px solid transparent", paddingLeft: 8 }}>
            <button onClick={() => p.toggleHighlighted(c.id)} style={{ ...linkButton, display: "flex", width: "100%", alignItems: "center", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, textAlign: "left" }}>
              <span style={{ flex: 1 }}>{c.name}{c.viaSoftware.some(t => family.includes(t)) && !c.path.some(t => family.includes(t) && !c.viaSoftware.includes(t)) && <span style={{ color: theme.colors.textFaint }}> (via software)</span>}</span>
              <Meter value={v} color={ENCODING.success} width={40} height={4} label="Viability" />
              <span style={{ width: 34, textAlign: "right", fontSize: theme.fontSizes.micro, fontVariantNumeric: "tabular-nums" }}>{fmtPct(v)}</span>
            </button>
            {hi >= 0 && usage && <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, lineHeight: 1.5, margin: "2px 0 4px" }}>{usage}</div>}
          </div>
        );
      })}
      {users.length > 8 && (
        <button onClick={() => setShowAllActors(v => !v)} style={{ ...linkButton, color: theme.colors.blue, fontSize: theme.fontSizes.tiny, marginTop: 4 }}>
          {showAllActors ? "Show fewer" : "Show all " + users.length}
        </button>
      )}

      {tech.description && (
        <>
          <div style={{ ...theme.sectionLabel, margin: "18px 0 6px" }}>About this technique</div>
          <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6, whiteSpace: "pre-line" }}>{tech.description}</div>
          <a href={techniqueUrl(tech.id)} target="_blank" rel="noreferrer" style={{ color: theme.colors.blue, fontSize: theme.fontSizes.micro }}>MITRE {tech.id} ↗</a>
        </>
      )}
    </>
  );
}

// ─── D3FEND countermeasures for the selected technique (family) ─────────────

const D3FEND_ORDER = ['Model', 'Harden', 'Detect', 'Isolate', 'Deceive', 'Evict', 'Restore'];

function D3fendSection({ d3fend, family, vocabulary, posture, togglePrevent, setDetect }: {
  d3fend: D3fendDataset | null; family: string[]; vocabulary: VocabularyId; posture: DefensePosture;
  togglePrevent: (id: string) => void; setDetect: (ids: string[], on: boolean) => void;
}) {
  const [showAll, setShowAll] = useState<string | null>(null);
  const groups = useMemo(() => {
    if (!d3fend) return [];
    const seen = new Map<string, { id: string; rel: string }>();
    for (const t of family) {
      for (const [d3id, offRel, offArt, defRel, defArt] of d3fend.attack[t] ?? []) {
        if (!seen.has(d3id)) seen.set(d3id, { id: d3id, rel: defRel + ' ' + defArt + (offArt ? ' ← technique ' + offRel + ' ' + offArt : '') });
      }
    }
    const by = new Map<string, { id: string; rel: string }[]>();
    for (const x of seen.values()) {
      const tac = d3fend.techniques[x.id]?.tactic ?? 'Model';
      by.set(tac, [...(by.get(tac) ?? []), x]);
    }
    return D3FEND_ORDER.filter(t => by.has(t)).map(t => ({ tactic: t, items: by.get(t)!.sort((a, b) => d3fend.techniques[a.id].name.localeCompare(d3fend.techniques[b.id].name)) }));
  }, [d3fend, family]);

  if (!d3fend) return null;
  const isD3 = vocabulary === 'd3fend';
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <div style={{ ...theme.sectionLabel, margin: "18px 0 6px" }}>
        <span style={{ color: ENCODING.prevention }}>{"\u25C6"}</span> D3FEND countermeasures ({total})
      </div>
      {total === 0 && <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>D3FEND {d3fend.version} infers no countermeasure for this technique.</div>}
      {total > 0 && (
        <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginBottom: 6, lineHeight: 1.5 }}>
          Inferred by D3FEND through shared digital artifacts.{!isD3 && " Switch Defenses to the D3FEND catalog to record and plan with these."}
        </div>
      )}
      {groups.map(g => {
        const role = d3fendRole(g.tactic);
        const items = showAll === g.tactic ? g.items : g.items.slice(0, 6);
        return (
          <div key={g.tactic} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textPrimary, fontWeight: 600 }}>
              {g.tactic} <span style={{ color: theme.colors.textMuted, fontWeight: 400, fontSize: theme.fontSizes.micro }}>
                {role === 'prevent' ? 'lowers success' : role === 'detect' ? 'raises alerts' : role === 'response' ? 'part of response (not scored separately)' : 'not scored'}
              </span>
            </div>
            {items.map(x => {
              const t = d3fend.techniques[x.id];
              const on = role === 'prevent' ? posture.prevent.has(t.base) : role === 'detect' ? posture.detect.has(x.id) : false;
              const scored = role === 'prevent' || role === 'detect';
              return (
                <div key={x.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "2px 0" }}>
                  {isD3 && scored
                    ? <input type="checkbox" checked={on} style={{ marginTop: 3 }}
                        onChange={() => (role === 'prevent' ? togglePrevent(t.base) : setDetect([x.id], !on))}
                        aria-label={(role === 'prevent' ? 'In place (whole ' + d3fend.techniques[t.base]?.name + ' base): ' : 'Deployed: ') + t.name}
                        title={role === 'prevent' ? 'Prevention is recorded per base technique: ' + d3fend.techniques[t.base]?.name : undefined} />
                    : <span style={{ width: 13, flexShrink: 0 }} />}
                  <div style={{ flex: 1, fontSize: theme.fontSizes.small, color: theme.colors.textBody, lineHeight: 1.4 }}>
                    <a href={d3fendUrl(t.iri)} target="_blank" rel="noreferrer" style={{ color: theme.colors.textBody }}>{t.name}</a>
                    <span style={{ ...mono, color: theme.colors.textFaint, fontSize: theme.fontSizes.micro, marginLeft: 6 }}>{x.id}</span>
                    <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted }}>{x.rel}{t.base !== x.id ? ' · ' + d3fend.techniques[t.base]?.name : ''}</div>
                  </div>
                </div>
              );
            })}
            {g.items.length > 6 && (
              <button onClick={() => setShowAll(showAll === g.tactic ? null : g.tactic)} style={{ ...linkButton, color: theme.colors.blue, fontSize: theme.fontSizes.micro, marginLeft: 21 }}>
                {showAll === g.tactic ? 'Show fewer' : 'Show all ' + g.items.length}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
