import { theme } from '../../theme';

interface MetricBoxProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

export function MetricBox({ label, value, unit, color }: MetricBoxProps) {
  return (
    <div style={{
      background: theme.colors.bgSurface, borderRadius: theme.radii.sm, padding: theme.spacing.lg,
      border: "1px solid " + color + "22",
    }}>
      <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: color }}>
        {value}<span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textFaint }}>{unit}</span>
      </div>
    </div>
  );
}
