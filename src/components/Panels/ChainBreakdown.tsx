// ─── ChainBreakdown — one actor's required stages, options, and weak points ──
// Each stage is an OR over the actor's known techniques; the chain is an AND
// over stages. Options show residual success (orange) and detection (blue).

import { useMemo } from 'react';
import type { AttackChain, CatalogItem, Technique } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import { actorBreakdown, viabilityParts } from '../../engine/riskModel';
import { fmtPct } from '../../engine/displayMetrics';
import { CHAIN_COLORS, ENCODING } from '../../data/constants';
import { GateStatus, KindBadge, Meter } from '../ui';
import { linkButton, mono } from '../styles';
import { theme } from '../../theme';

interface ChainBreakdownProps {
  chain: AttackChain;
  colorIndex: number;
  rm: RiskModelView;
  techById: Map<string, Technique>;
  bestDefenses: { item: CatalogItem; delta: number }[];
  onSelectTech: (id: string) => void;
}

const MAX_OPTIONS = 8;

export function ChainBreakdown({ chain, colorIndex, rm, techById, bestDefenses, onSelectTech }: ChainBreakdownProps) {
  const actorIndex = useMemo(() => rm.model?.actors.findIndex(a => a.chain.id === chain.id) ?? -1, [rm.model, chain.id]);
  const gates = useMemo(
    () => (rm.model && rm.state && actorIndex >= 0 ? actorBreakdown(rm.model, rm.params, rm.state, actorIndex) : []),
    [rm.model, rm.state, rm.params, actorIndex],
  );
  const parts = useMemo(
    () => (rm.model && rm.state && actorIndex >= 0 ? viabilityParts(rm.model, rm.params, rm.state, actorIndex) : null),
    [rm.model, rm.state, rm.params, actorIndex],
  );
  const viability = rm.viabilityById.get(chain.id);
  if (actorIndex < 0 || viability === undefined) {
    return <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.small }}>This actor is outside the current filters.</div>;
  }
  const weakest = gates.reduce<(typeof gates)[number] | null>((w, g) => (!w || g.value < w.value ? g : w), null);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: CHAIN_COLORS[colorIndex % CHAIN_COLORS.length].color, display: "inline-block" }} />
        <span style={{ fontSize: theme.fontSizes.medium, fontWeight: 700, color: theme.colors.textPrimary }}>{chain.name}</span>
        <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
          viability <strong style={{ color: theme.colors.textPrimary }}>{fmtPct(viability, 1)}</strong>
          {parts && <> = passes every stage {fmtPct(parts.pass, 1)} × not contained {fmtPct(1 - parts.contained, 1)}
            <span style={{ color: theme.colors.textMuted }}> (alert raised somewhere {fmtPct(parts.alerted)}, response {fmtPct(rm.params.responseEffectiveness)})</span></>}
        </span>
      </div>

      <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 6 }}>
        {gates.map(g => (
          <div key={g.gateId} style={{ minWidth: 170, flex: "1 0 170px", background: theme.colors.bgCard, borderRadius: theme.radii.md, padding: "8px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: theme.fontSizes.small, fontWeight: 700, color: theme.colors.textPrimary }}>{g.label}</span>
              <GateStatus value={g.value} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 2px" }}>
              <span style={{ flex: 1, minWidth: 0, display: "flex" }}><Meter value={g.value} color={ENCODING.success} width="100%" label={g.label + " stage value"} /></span>
              <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textBody, fontVariantNumeric: "tabular-nums", width: 32, textAlign: "right" }}>{fmtPct(g.value)}</span>
            </div>
            <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, marginBottom: 6 }}>
              passes {fmtPct(g.pass)} · no alert {fmtPct(g.evade)} · {g.options.length} option{g.options.length === 1 ? "" : "s"} (any one works)
            </div>
            {g.options.slice(0, MAX_OPTIONS).map(o => (
              <button key={o.techniqueId} onClick={() => onSelectTech(o.techniqueId)}
                title={(techById.get(o.techniqueId)?.name ?? o.techniqueId) + (o.viaSoftware ? " — attributed through the actor's software" : "")}
                style={{
                  ...linkButton, display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "2px 4px", marginBottom: 2,
                  borderRadius: theme.radii.sm, border: "1px " + (o.viaSoftware ? "dashed " + theme.colors.textFaint : "solid transparent"),
                }}>
                <span style={{ ...mono, fontSize: theme.fontSizes.micro, color: theme.colors.textBody, width: 62, textAlign: "left" }}>{o.techniqueId}</span>
                <Meter value={o.success} color={ENCODING.success} width={38} height={4} label="Residual success" />
                <Meter value={o.detection} color={ENCODING.detection} width={38} height={4} label="Detection coverage" />
              </button>
            ))}
            {g.options.length > MAX_OPTIONS && (
              <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, paddingLeft: 4 }}>+{g.options.length - MAX_OPTIONS} more options</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, margin: "4px 0 10px" }}>
        <span><Meter value={0.7} color={ENCODING.success} width={24} height={4} /> residual success</span>
        <span><Meter value={0.7} color={ENCODING.detection} width={24} height={4} /> detection coverage</span>
        <span><span style={{ display: "inline-block", width: 18, height: 9, border: "1px dashed " + theme.colors.textFaint, borderRadius: 2, verticalAlign: "middle" }} /> via the actor's software</span>
      </div>

      {weakest && (
        <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
          Weakest stage for this actor: <strong style={{ color: theme.colors.textPrimary }}>{weakest.label}</strong> ({fmtPct(weakest.value)}).
          {bestDefenses.length > 0 && <> Best next defenses against {chain.name}:</>}
        </div>
      )}
      {bestDefenses.map(b => (
        <div key={b.item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: theme.fontSizes.small, color: theme.colors.textBody, padding: "2px 0" }}>
          <KindBadge kind={b.item.kind} />
          <span style={{ flex: 1 }}>{b.item.name}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", color: theme.colors.textSecondary }}>viability −{(b.delta * 100).toFixed(1)} pts</span>
        </div>
      ))}
    </div>
  );
}
