interface LegendItemProps {
  color: string;
  label: string;
}

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "11px", color: "#cbd5e1" }}>{label}</span>
    </div>
  );
}
