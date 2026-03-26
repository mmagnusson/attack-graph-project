import { theme } from '../../theme';

interface PopoutButtonProps {
  onClick: () => void;
  title?: string;
}

export function PopoutButton({ onClick, title }: PopoutButtonProps) {
  return (
    <button onClick={onClick} title={title || 'Pop out'}
      style={{
        background: 'transparent', color: theme.colors.textMuted, border: '1px solid ' + theme.colors.border,
        borderRadius: theme.radii.sm, width: 24, height: 24, cursor: 'pointer', fontSize: 13,
        fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginLeft: 8, lineHeight: 1, padding: 0, flexShrink: 0,
      }}>{"\u2197"}</button>
  );
}
