// ─── ExposureSummaryPanel — compact strip summarizing the environment profile ──

import type { EnvironmentProfile } from '../../types';
import { fmtPct } from '../../engine/displayMetrics';
import { SmallButton } from '../ui';
import { theme } from '../../theme';

interface ExposureSummaryPanelProps {
  exposureSummary: { techniques: number; covered: number; avgDetect: number; avgPrevent: number; avgExposure: number };
  environmentProfile: EnvironmentProfile;
  onEdit: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function ExposureSummaryPanel({ exposureSummary: s, environmentProfile: p, onEdit, onExport, onClear }: ExposureSummaryPanelProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: theme.spacing.lg, flexWrap: "wrap",
      borderTop: "1px solid " + theme.colors.borderSubtle, padding: "6px 20px", background: theme.colors.bgPanel, flexShrink: 0,
      fontSize: theme.fontSizes.small, color: theme.colors.textSecondary,
    }}>
      <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>Environment profile</span>
      <span>{p.infrastructure.length} infrastructure · {p.securityTools.length} tools · {p.threatActors?.length ?? 0} actors of concern</span>
      <span>{s.covered}/{s.techniques} techniques with tool coverage</span>
      <span>est. detect {fmtPct(s.avgDetect)} · prevent {fmtPct(s.avgPrevent)}</span>
      {p.infrastructure.length > 0 && <span>base exposure {fmtPct(s.avgExposure)}</span>}
      <span style={{ color: theme.colors.textMuted }}>(tool scores are estimates)</span>
      <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <SmallButton onClick={onEdit}>EDIT</SmallButton>
        <SmallButton onClick={onExport}>CSV</SmallButton>
        <SmallButton onClick={onClear} color={theme.colors.textMuted}>CLEAR</SmallButton>
      </span>
    </div>
  );
}
