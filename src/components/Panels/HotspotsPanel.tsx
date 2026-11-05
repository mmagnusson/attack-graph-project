// ─── HotspotsPanel — where residual attacker activity concentrates ──────────

import type { DefensePosture, FrameworkConfig, Technique } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import type { NodeDefenses } from '../../engine/displayMetrics';
import { fmtPct } from '../../engine/displayMetrics';
import { ENCODING } from '../../data/constants';
import { Meter, SmallButton } from '../ui';
import { mono } from '../styles';
import { PopoutButton } from '../Analysis';
import { theme } from '../../theme';

interface HotspotsPanelProps {
  cfg: FrameworkConfig;
  rm: RiskModelView;
  displayTechniques: Technique[];
  defenses: Record<string, NodeDefenses>;
  posture: DefensePosture;
  selectedTech: string | null;
  onSelectTech: (id: string) => void;
  toggleBlocked: (id: string) => void;
  popout: boolean;
  onPopout: () => void;
}

export function HotspotsPanel({ cfg, rm, displayTechniques, defenses, posture, selectedTech, onSelectTech, toggleBlocked, popout, onPopout }: HotspotsPanelProps) {
  const total = Object.values(rm.metrics).reduce((s, m) => s + m.activity, 0) || 1;
  const rows = displayTechniques
    .map(t => ({ t, m: rm.metrics[t.id] }))
    .filter(r => r.m && r.m.activity > 0)
    .sort((a, b) => b.m.activity - a.m.activity)
    .slice(0, 15);
  const top = rows[0]?.m.activity || 1;

  return (
    <>
      <h3 style={{ ...theme.panelHeading }}>
        Hotspots — where residual attacker activity concentrates
        {!popout && <PopoutButton onClick={onPopout} title="Pop out Hotspots" />}
      </h3>
      <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginBottom: theme.spacing.md }}>
        Share of the activity of actors who are still viable. Blocking a technique shifts its share to the actor's alternatives — watch the list re-rank.
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.fontSizes.small }}>
        <thead>
          <tr style={{ color: theme.colors.textMuted, textAlign: "left", fontSize: theme.fontSizes.tiny }}>
            <th style={th}>#</th><th style={th}>Technique</th><th style={th}>Activity share</th>
            <th style={{ ...th, textAlign: "right" }}>Success</th><th style={{ ...th, textAlign: "right" }}>Detection</th>
            <th style={{ ...th, textAlign: "right" }}>Actors</th><th style={th}>Defenses</th><th style={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ t, m }, i) => {
            const tac = cfg.tactics.find(x => x.id === t.tactic);
            const d = defenses[t.id];
            const mitIn = d?.preventions.filter(x => posture.prevent.has(x)).length ?? 0;
            return (
              <tr key={t.id} onClick={() => onSelectTech(t.id)} style={{ cursor: "pointer", borderTop: "1px solid " + theme.colors.borderSubtle, background: selectedTech === t.id ? theme.colors.bgSurface : "transparent" }}>
                <td style={{ ...td, color: theme.colors.textFaint, ...mono }}>{i + 1}</td>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: tac?.color, flexShrink: 0 }} />
                    <span style={{ ...mono, color: theme.colors.textMuted, fontSize: theme.fontSizes.tiny }}>{t.id}</span>
                    <span style={{ color: theme.colors.textPrimary }}>{t.name}</span>
                  </div>
                </td>
                <td style={td}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Meter value={m.activity / top} color={ENCODING.success} width={70} label="Activity share" />
                    <span style={{ fontVariantNumeric: "tabular-nums", color: theme.colors.textBody }}>{fmtPct(m.activity / total, 1)}</span>
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{m.blocked ? "blocked" : fmtPct(m.success)}</td>
                <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtPct(m.detection)}</td>
                <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{m.actors}</td>
                <td style={{ ...td, fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary }}>
                  {mitIn}/{d?.preventions.length ?? 0} preventions · {d?.rules ?? 0} detection rules
                </td>
                <td style={{ ...td, textAlign: "right" }} onClick={e => e.stopPropagation()}>
                  <SmallButton onClick={() => toggleBlocked(t.id)} color={m.blocked ? ENCODING.cut : theme.colors.textSecondary}
                    title="What-if: assume this technique (and its sub-techniques) is fully blocked">{m.blocked ? "UNBLOCK" : "ASSUME BLOCKED"}</SmallButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const th = { padding: "4px 6px", fontWeight: 600 } as const;
const td = { padding: "6px 6px", verticalAlign: "middle" } as const;
