interface PopoutPlaceholderProps {
  label: string;
  onRestore: () => void;
}

export function PopoutPlaceholder({ label, onRestore }: PopoutPlaceholderProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#475569', fontSize: '11px', gap: 8,
    }}>
      <span>{label} is in a separate window</span>
      <button onClick={onRestore} style={{
        background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6',
        borderRadius: 4, padding: '4px 10px', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit',
      }}>Restore Inline</button>
    </div>
  );
}
