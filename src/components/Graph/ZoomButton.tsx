import { theme } from '../../theme';

interface ZoomButtonProps {
  label: string;
  onClick: () => void;
}

export function ZoomButton({ label, onClick }: ZoomButtonProps) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, background: "#1e293bee", color: theme.colors.textBody,
      border: "1px solid " + theme.colors.textFaint, borderRadius: 5, cursor: "pointer",
      fontSize: label.length > 1 ? 12 : 18, fontWeight: 700,
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1, backdropFilter: "blur(4px)",
    }}>{label}</button>
  );
}
