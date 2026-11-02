// ─── Shared UI primitives ─────────────────────────────────────────────────────

import { useState, type ReactNode } from 'react';
import { theme } from '../theme';
import { ENCODING } from '../data/constants';
import { fmtUsd } from '../engine/displayMetrics';
import type { DefenseKind } from '../types';
import { linkButton } from './styles';

/** Thin horizontal meter: the fill carries the value, the track is a faint step of the same hue */
export function Meter({ value, color, width = 80, height = 6, label }: { value: number; color: string; width?: number | string; height?: number; label?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <span role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}
      style={{ display: "inline-block", width, height, borderRadius: height, background: color + "2e", overflow: "hidden", verticalAlign: "middle", flexShrink: 0 }}>
      <span style={{ display: "block", width: (v * 100) + "%", height: "100%", borderRadius: height, background: color }} />
    </span>
  );
}

/** Marks a defense as a mitigation (prevention) or telemetry (detection) — icon + word, never color alone */
export function KindBadge({ kind }: { kind: DefenseKind }) {
  const isMit = kind === 'mitigation';
  return (
    <span title={isMit ? "MITRE mitigation (prevention)" : "Telemetry source + MITRE analytics (detection)"} style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: theme.fontSizes.micro, fontWeight: 700,
      padding: "2px 6px", borderRadius: theme.radii.sm, whiteSpace: "nowrap",
      background: (isMit ? ENCODING.prevention : ENCODING.detection) + "22", color: theme.colors.textBody,
    }}>
      <span aria-hidden style={{ color: isMit ? ENCODING.prevention : ENCODING.detection }}>{isMit ? "⛨" : "◉"}</span>
      {isMit ? "PREVENT" : "DETECT"}
    </span>
  );
}

/** A dollar amount that turns into a number field on click */
export function EditableCost({ value, onChange, title }: { value: number; onChange: (v: number) => void; title?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  if (!editing) {
    return (
      <button onClick={e => { e.stopPropagation(); setDraft(String(Math.round(value))); setEditing(true); }} title={title || "Edit cost estimate"}
        style={{ ...linkButton, color: theme.colors.textBody, fontVariantNumeric: "tabular-nums", borderBottom: "1px dashed " + theme.colors.textFaint }}>
        {fmtUsd(value)}
      </button>
    );
  }
  const commit = () => {
    const n = Number(draft.replace(/[$,\s]/g, ''));
    if (Number.isFinite(n) && n >= 0) onChange(n);
    setEditing(false);
  };
  return (
    <input autoFocus value={draft} onClick={e => e.stopPropagation()} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      aria-label="Annual cost in USD"
      style={{ ...theme.inputBase, width: 90, padding: "2px 6px", fontSize: theme.fontSizes.small }} />
  );
}

export function PanelTitle({ children, color, right }: { children: ReactNode; color: string; right?: ReactNode }) {
  return (
    <h3 style={{ fontSize: theme.fontSizes.body, color, margin: "0 0 14px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: theme.spacing.lg, flexWrap: "wrap" }}>
      {children}
      {right && <span style={{ marginLeft: "auto", display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>{right}</span>}
    </h3>
  );
}

export function SmallButton({ children, onClick, color = theme.colors.textSecondary, filled = false, disabled = false, title }: {
  children: ReactNode; onClick: () => void; color?: string; filled?: boolean; disabled?: boolean; title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      background: filled ? color : "transparent", color: filled ? theme.colors.bg : color,
      border: "1px solid " + (disabled ? theme.colors.border : color), borderRadius: theme.radii.sm,
      padding: "4px 10px", fontSize: theme.fontSizes.tiny, fontWeight: 700, cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit", opacity: disabled ? 0.4 : 1, whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

/** Status chip for a gate: icon + word so state never rides on color alone */
export function GateStatus({ value }: { value: number }) {
  const s = value < 0.2 ? { icon: "✂", label: "Cut", color: ENCODING.cut }
    : value < 0.6 ? { icon: "◐", label: "Narrowed", color: "#fab219" }
      : { icon: "○", label: "Open", color: theme.colors.textMuted };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: theme.fontSizes.micro, fontWeight: 700, color: theme.colors.textBody }}>
      <span aria-hidden style={{ color: s.color, fontSize: theme.fontSizes.small }}>{s.icon}</span>{s.label}
    </span>
  );
}
