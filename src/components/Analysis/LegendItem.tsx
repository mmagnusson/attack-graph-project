import { theme } from '../../theme';

interface LegendItemProps {
  color: string;
  label: string;
}

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
      <div style={{ width: "10px", height: "10px", borderRadius: theme.radii.round, background: color }} />
      <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.textBody }}>{label}</span>
    </div>
  );
}
