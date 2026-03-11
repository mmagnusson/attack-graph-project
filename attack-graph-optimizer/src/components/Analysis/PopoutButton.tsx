interface PopoutButtonProps {
  onClick: () => void;
  title?: string;
}

export function PopoutButton({ onClick, title }: PopoutButtonProps) {
  return (
    <button onClick={onClick} title={title || 'Pop out'}
      style={{
        background: 'transparent', color: '#64748b', border: '1px solid #334155',
        borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontSize: 11,
        fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginLeft: 6, lineHeight: 1, padding: 0, flexShrink: 0,
      }}>{"\u2197"}</button>
  );
}
