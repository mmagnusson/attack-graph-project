interface ZoomButtonProps {
  label: string;
  onClick: () => void;
}

export function ZoomButton({ label, onClick }: ZoomButtonProps) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, background: "#1e293bee", color: "#e2e8f0",
      border: "1px solid #475569", borderRadius: 5, cursor: "pointer",
      fontSize: label.length > 1 ? 10 : 16, fontWeight: 700,
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1, backdropFilter: "blur(4px)",
    }}>{label}</button>
  );
}
