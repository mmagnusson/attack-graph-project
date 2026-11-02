// ─── ChainsPanel — modeled actors ranked by viability + gate breakdown ──────

import { useMemo } from 'react';
import type { AttackChain, CatalogItem, ChainKind, Technique } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { CHAIN_COLORS, ENCODING } from '../../data/constants';
import { SECTORS } from '../../engine/actorTags';
import { fmtPct } from '../../engine/displayMetrics';
import { PopoutButton } from '../Analysis';
import { Meter } from '../ui';
import { linkButton } from '../styles';
import { ChainBreakdown } from './ChainBreakdown';
import { theme } from '../../theme';

export type KindFilter = 'all' | ChainKind;

interface ChainsPanelProps {
  rm: RiskModelView;
  chains: AttackChain[];
  techById: Map<string, Technique>;
  /** Highlighted actor IDs, most recently highlighted (the focus) first */
  highlightedIds: string[];
  /** Stable color slot of a highlighted actor */
  colorOf: (id: string) => number | undefined;
  toggleHighlighted: (id: string) => void;
  query: string;
  setQuery: (v: string) => void;
  kindFilter: KindFilter;
  setKindFilter: (v: KindFilter) => void;
  removeCustom: (id: string) => void;
  onSelectTech: (id: string) => void;
  bestDefensesFor: (chainId: string) => { item: CatalogItem; delta: number }[];
  popout: boolean;
  onPopout: () => void;
  stacked?: boolean;
}

const sectorLabel = new Map(SECTORS.map(s => [s.id, s.label]));

export function ChainsPanel(p: ChainsPanelProps) {
  const { rm, chains, highlightedIds, bestDefensesFor, kindFilter } = p;
  const q = p.query.trim().toLowerCase();

  const rows = useMemo(() => chains
    .filter(c => kindFilter === 'all' || c.kind === kindFilter)
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      || c.aliases.some(a => a.toLowerCase().includes(q)) || c.path.some(t => t.toLowerCase() === q))
    .map(c => ({ c, v: rm.viabilityById.get(c.id) ?? 1 }))
    .sort((a, b) => b.v - a.v || a.c.name.localeCompare(b.c.name)),
  [chains, kindFilter, q, rm.viabilityById]);

  const focusedId = highlightedIds[0] ?? null;
  const focused = focusedId ? chains.find(c => c.id === focusedId) : undefined;
  const best = useMemo(() => (focusedId ? bestDefensesFor(focusedId) : []), [focusedId, bestDefensesFor]);

  const shared = useMemo(() => {
    if (highlightedIds.length < 2) return null;
    const sets = highlightedIds.map(id => new Set(chains.find(c => c.id === id)?.path ?? []));
    return [...sets[0]].filter(t => sets.every(s => s.has(t)));
  }, [highlightedIds, chains]);

  const kinds: { id: KindFilter; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'group', label: 'Groups' }, { id: 'campaign', label: 'Campaigns' }, { id: 'custom', label: 'Custom' },
  ];

  return (
    <div style={{ display: "flex", flexDirection: p.stacked ? "column" : "row", gap: theme.spacing.xl, height: "100%", minHeight: 0 }}>
      <div style={{ flex: p.stacked ? "none" : "0 0 min(420px, 42%)", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <h3 style={{ ...theme.panelHeading }}>
          Threat actors ({rows.length}) — most viable first
          {!p.popout && <PopoutButton onClick={p.onPopout} title="Pop out Attack Chains" />}
        </h3>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <input value={p.query} onChange={e => p.setQuery(e.target.value)} placeholder="Search actor, alias, or technique ID…" aria-label="Search actors"
            style={{ ...theme.inputBase, padding: "5px 8px", flex: 1, minWidth: 140 }} />
          <div style={{ display: "flex", gap: 2 }}>
            {kinds.map(k => (
              <button key={k.id} onClick={() => p.setKindFilter(k.id)} style={{
                ...theme.buttonBase, padding: "4px 8px", fontSize: theme.fontSizes.micro,
                background: p.kindFilter === k.id ? theme.colors.bgSurface : "transparent",
                color: p.kindFilter === k.id ? theme.colors.textPrimary : theme.colors.textMuted,
                border: "1px solid " + (p.kindFilter === k.id ? theme.colors.textMuted : theme.colors.border),
              }}>{k.label}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {rows.map(({ c, v }) => {
            const hi = p.colorOf(c.id) ?? -1;
            return (
              <div key={c.id} role="button" tabIndex={0} onClick={() => p.toggleHighlighted(c.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.toggleHighlighted(c.id); } }}
                style={{
                  padding: "7px 10px", marginBottom: 3, borderRadius: theme.radii.sm, cursor: "pointer",
                  background: hi >= 0 ? theme.colors.bgSurface : "transparent",
                  border: "1px solid " + (hi >= 0 ? CHAIN_COLORS[hi].color + "88" : theme.colors.borderSubtle),
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {hi >= 0 && <span style={{ width: 9, height: 9, borderRadius: "50%", background: CHAIN_COLORS[hi].color, flexShrink: 0 }} />}
                  <span style={{ fontSize: theme.fontSizes.small, fontWeight: 600, color: theme.colors.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  {c.kind !== 'group' && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, textTransform: "uppercase" }}>{c.kind}</span>}
                  <Meter value={v} color={ENCODING.success} width={60} label={"Viability of " + c.name} />
                  <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textBody, width: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtPct(v)}</span>
                  {c.kind === 'custom' && (
                    <button onClick={e => { e.stopPropagation(); p.removeCustom(c.id); }} aria-label={"Delete " + c.name}
                      style={{ ...linkButton, color: theme.colors.textMuted, padding: "0 2px" }}>{"✕"}</button>
                  )}
                </div>
                <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.id} · {c.path.length} techniques{c.viaSoftware.length > 0 ? " (" + c.viaSoftware.length + " via software)" : ""}
                  {c.country ? " · " + c.country : ""}
                  {c.sectors.length > 0 ? " · " + c.sectors.slice(0, 3).map(s => sectorLabel.get(s) ?? s).join(", ") : ""}
                  {c.attributedTo ? " · attributed to " + c.attributedTo : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {focused ? (
          <>
            <ChainBreakdown chain={focused} colorIndex={p.colorOf(focused.id) ?? 0} rm={rm} techById={p.techById} bestDefenses={best} onSelectTech={p.onSelectTech} />
            {focused.description && (
              <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, lineHeight: 1.5, marginTop: 10 }}>
                {focused.description}
                {focused.aliases.length > 0 && <div style={{ color: theme.colors.textMuted, marginTop: 4 }}>Aliases: {focused.aliases.slice(0, 6).join(", ")}</div>}
                {(focused.country || focused.sectors.length > 0) && (
                  <div style={{ color: theme.colors.textMuted, marginTop: 2 }}>Attribution and sectors are keyword-derived from MITRE's description.</div>
                )}
              </div>
            )}
            {shared && (
              <div style={{ marginTop: 12, fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>{shared.length}</strong> techniques shared by all {highlightedIds.length} highlighted actors
                {shared.length > 0 && <span style={{ color: theme.colors.textMuted }}> — e.g. {shared.slice(0, 8).join(", ")}</span>}.
                {" "}Shared techniques only help if they close a whole stage for each actor.
              </div>
            )}
          </>
        ) : (
          <div style={{ paddingTop: 30, textAlign: "center", color: theme.colors.textMuted, fontSize: theme.fontSizes.small, lineHeight: 1.7 }}>
            Select an actor to see its required stages, the techniques it can switch between at each one,<br />
            and which defenses would cut it off. Up to three actors can be highlighted on the graph.
          </div>
        )}
      </div>
    </div>
  );
}
