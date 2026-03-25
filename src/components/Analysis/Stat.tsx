interface StatProps {
  label: string;
  value: string | number;
  color: string;
}

export function Stat({ label, value, color }: StatProps) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color: color }}>{value}</span>
      <span style={{ fontSize: "9px", color: "#64748b" }}>{label}</span>
    </div>
  );
}
