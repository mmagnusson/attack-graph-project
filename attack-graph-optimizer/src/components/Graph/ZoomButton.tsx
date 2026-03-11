interface ZoomButtonProps {
  label: string;
  onClick: () => void;
}

export function ZoomButton({ label, onClick }: ZoomButtonProps) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28, background: "#1e293b", color: "#94a3b8",
      border: "1px solid #334155", borderRadius: 4, cursor: "pointer",
      fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1,
    }}>{label}</button>
  );
}
