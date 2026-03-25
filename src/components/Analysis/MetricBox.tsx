interface MetricBoxProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

export function MetricBox({ label, value, unit, color }: MetricBoxProps) {
  return (
    <div style={{
      background: "#1e293b", borderRadius: "4px", padding: "8px",
      border: "1px solid " + color + "22",
    }}>
      <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: color }}>
        {value}<span style={{ fontSize: "9px", color: "#475569" }}>{unit}</span>
      </div>
    </div>
  );
}
