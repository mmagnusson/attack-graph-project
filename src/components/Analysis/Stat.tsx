import { theme } from '../../theme';

interface StatProps {
  label: string;
  value: string | number;
  color: string;
}

export function Stat({ label, value, color }: StatProps) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: theme.spacing.md }}>
      <span style={{ fontSize: theme.fontSizes.stat, fontWeight: 700, color: color }}>{value}</span>
      <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>{label}</span>
    </div>
  );
}
