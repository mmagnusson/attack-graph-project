// ─── BlindSpotsPanel — busy techniques with no prevention and no detection ──

import { useMemo } from 'react';
import type { FrameworkConfig, Technique } from '../../types';
import type { RiskModelView } from '../../hooks/useRiskModel';
import type { BlindSpot } from '../../engine/displayMetrics';
import { fmtPct } from '../../engine/displayMetrics';
import { csvRow, downloadFile, today } from '../../engine/csv';
import { ENCODING } from '../../data/constants';
import { Meter, PanelTitle, SmallButton } from '../ui';
import { linkButton, mono } from '../styles';
import { theme } from '../../theme';

interface BlindSpotsPanelProps {
  cfg: FrameworkConfig;
  rm: RiskModelView;
  blindSpots: BlindSpot[];
  techById: Map<string, Technique>;
  dcNames: Map<string, string>;
  onSelectTech: (id: string) => void;
}

const CRITICAL = "#d03b3b";

export function BlindSpotsPanel({ cfg, rm, blindSpots, techById, dcNames, onSelectTech }: BlindSpotsPanelProps) {
  const dcSource = useMemo(() => {
    const m = new Map<string, string>();
    cfg.telemetrySources.forEach(ts => ts.dataComponents.forEach(d => m.set(d, ts.name)));
    return m;
  }, [cfg]);
  const carried = blindSpots.reduce((s, r) => s + r.share, 0);
  const tacticOf = (t: Technique | undefined) => cfg.tactics.find(x => x.id === t?.tactic);

  const exportCSV = () => {
    let csv = csvRow(['Technique ID', 'Name', 'Tactic', 'Activity share %', 'Prevention', 'Detection', 'Mitigations available', 'Missing telemetry']);
    blindSpots.forEach(r => {
      const t = techById.get(r.techniqueId);
      csv += csvRow([r.techniqueId, t?.name ?? '', tacticOf(t)?.name ?? '', +(r.share * 100).toFixed(2),
        r.prevention === 'none' ? 'No MITRE mitigation' : 'Available, none in place',
        r.detection === 'no-guidance' ? 'No analytics for selected platforms' : 'No telemetry collected',
        r.mitigations.join('; '), r.missingDataComponents.map(d => dcNames.get(d) ?? d).join('; ')]);
    });
    downloadFile(csv, 'attackbreaker-blind-spots-' + today() + '.csv', 'text/csv');
  };

  return (
    <>
      <PanelTitle color={CRITICAL} right={<SmallButton onClick={exportCSV} disabled={blindSpots.length === 0} color={CRITICAL}>EXPORT</SmallButton>}>
        BLIND SPOTS
      </PanelTitle>
      <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: theme.spacing.lg }}>
        Techniques in your required stages that carry residual attacker activity with <strong style={{ color: theme.colors.textPrimary }}>no mitigation in place and no telemetry</strong> for
        their MITRE analytics. <strong style={{ color: theme.colors.textPrimary }}>{blindSpots.length}</strong> blind spots carry {fmtPct(carried)} of residual activity.
        They are outlined in red dashes on the graph while this panel is open.
        {rm.model && rm.model.actors.length === 0 && " No actors match the current filters."}
      </div>

      {blindSpots.slice(0, 60).map(r => {
        const t = techById.get(r.techniqueId);
        const tac = tacticOf(t);
        const m = rm.metrics[r.techniqueId];
        const sources = [...new Set(r.missingDataComponents.map(d => dcSource.get(d)).filter(Boolean))];
        return (
          <button key={r.techniqueId} onClick={() => onSelectTech(r.techniqueId)} style={{
            ...linkButton, display: "block", width: "100%", textAlign: "left", marginBottom: theme.spacing.md,
            background: theme.colors.bg, border: "1px solid " + theme.colors.borderSubtle, borderLeft: "3px solid " + CRITICAL,
            borderRadius: theme.radii.md, padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...mono, fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>{r.techniqueId}</span>
              <span style={{ fontSize: theme.fontSizes.small, fontWeight: 600, color: theme.colors.textPrimary, flex: 1 }}>{t?.name}</span>
              <Meter value={r.share / (blindSpots[0]?.share || 1)} color={ENCODING.success} width={60} label="Share of residual activity" />
              <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textBody, width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtPct(r.share, 1)}</span>
            </div>
            <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, marginTop: 4, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: tac?.color }} />{tac?.name} · {m?.actors ?? 0} actors
            </div>
            <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
              <div><span style={{ color: ENCODING.prevention }}>{"⛨"}</span> {r.prevention === 'none' ? 'MITRE lists no mitigation' : 'Available: ' + r.mitigations.slice(0, 5).join(', ') + (r.mitigations.length > 5 ? '…' : '')}</div>
              <div><span style={{ color: ENCODING.detection }}>{"◉"}</span> {r.detection === 'no-guidance' ? 'No analytics for the selected platforms' : 'Collect: ' + sources.join(', ')}</div>
            </div>
          </button>
        );
      })}
      {blindSpots.length === 0 && (
        <div style={{ textAlign: "center", color: theme.colors.textBody, fontSize: theme.fontSizes.body, padding: 24 }}>
          {"✓"} Every technique with meaningful residual activity has a mitigation or telemetry in place.
        </div>
      )}
    </>
  );
}
