import { theme } from '../../theme';

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit: string;
  /** Identity accent shown as the left rule; the value itself stays in text ink */
  color: string;
}

export function MetricBox({ label, value, unit, color }: MetricBoxProps) {
  return (
    <div style={{
      background: theme.colors.bgSurface, borderRadius: theme.radii.sm, padding: theme.spacing.lg,
      borderLeft: "3px solid " + color,
    }}>
      <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: theme.fontSizes.heading, fontWeight: 600, color: theme.colors.textPrimary }}>
        {value}<span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>{unit}</span>
      </div>
    </div>
  );
}
