import { theme } from '../../theme';

interface PopoutPlaceholderProps {
  label: string;
  onRestore: () => void;
}

export function PopoutPlaceholder({ label, onRestore }: PopoutPlaceholderProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: theme.colors.textFaint, fontSize: theme.fontSizes.body, gap: 10,
    }}>
      <span>{label} is in a separate window</span>
      <button onClick={onRestore} style={{
        background: 'transparent', color: theme.colors.blue, border: '1px solid ' + theme.colors.blue,
        borderRadius: theme.radii.sm, padding: '6px 14px', fontSize: theme.fontSizes.small, cursor: 'pointer', fontFamily: 'inherit',
      }}>Restore Inline</button>
    </div>
  );
}
