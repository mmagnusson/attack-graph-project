// ─── PriorityPanel — Remediation priority ranking ──

import { PopoutButton } from '../Analysis';
import { theme } from '../../theme';

interface PriorityPanelProps {
  priorityRanking: any[];
  selectedTech: string | null;
  setSelectedTech: (v: string | null) => void;
  toggleRemediate: (techId: string) => void;
  optimal: { selected: string[] };
  popoutPriority: boolean;
  setPopoutPriority: (v: boolean) => void;
}

export function PriorityPanel({
  priorityRanking, selectedTech, setSelectedTech,
  toggleRemediate, optimal,
  popoutPriority, setPopoutPriority,
}: PriorityPanelProps) {
  return (
    <>
      <h3 style={{ ...theme.panelHeading }}>
        Remediation Priority
        {!popoutPriority && <PopoutButton onClick={() => setPopoutPriority(true)} title="Pop out Priority" />}
      </h3>
      {priorityRanking.map((t: any, i: number) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: theme.spacing.lg, padding: "8px 10px", marginBottom: theme.spacing.xs,
          borderRadius: theme.radii.sm, background: selectedTech === t.id ? theme.colors.bgSurface : "transparent",
          cursor: "pointer",
        }} onClick={() => { setSelectedTech(t.id); }}>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textFaint, width: "20px", fontFamily: '"JetBrains Mono", monospace' }}>#{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: theme.fontSizes.base, fontWeight: 600, color: theme.colors.textPrimary, fontFamily: '"JetBrains Mono", monospace' }}>{t.id}</div>
            <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted }}>{t.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.orange, fontWeight: 700 }}>{(t.priority * 100).toFixed(0)}</div>
            <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, fontFamily: '"JetBrains Mono", monospace' }}>
              E:{(t.exposure * 100).toFixed(0)} B:{(t.betweennessVal * 100).toFixed(0)} C:{t.chainCount}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleRemediate(t.id); }}
            style={{
              background: optimal.selected.includes(t.id) ? theme.colors.orange : theme.colors.border,
              color: optimal.selected.includes(t.id) ? theme.colors.bg : theme.colors.textSecondary,
              border: "none", borderRadius: theme.radii.sm, padding: "5px 10px",
              fontSize: theme.fontSizes.tiny, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
            }}>
            FIX
          </button>
        </div>
      ))}
    </>
  );
}
