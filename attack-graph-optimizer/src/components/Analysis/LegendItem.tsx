interface LegendItemProps {
  color: string;
  label: string;
}

export function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "9px", color: "#94a3b8" }}>{label}</span>
    </div>
  );
}
