// ─── Design Tokens — Centralized theme for AttackBreaker ─────────────────────
// All colors, font sizes, spacing, and border radii in one place.

export const theme = {
  // ─── Colors ──────────────────────────────────────────────────────────────────
  colors: {
    // Backgrounds
    bg: "#0a0f1a",
    bgSurface: "#1e293b",
    bgPanel: "#0d1321",
    bgCard: "#111827",

    // Borders
    border: "#334155",
    borderSubtle: "#1e293b",

    // Text
    textPrimary: "#f8fafc",
    textBody: "#e2e8f0",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textFaint: "#475569",

    // Accent colors
    blue: "#3b82f6",
    purple: "#a855f7",
    violet: "#8b5cf6",
    indigo: "#6366f1",
    orange: "#f59e0b",
    red: "#ef4444",
    green: "#22c55e",
    cyan: "#06b6d4",
    teal: "#14b8a6",
    pink: "#ec4899",
  },

  // ─── Font Sizes ──────────────────────────────────────────────────────────────
  // Old → New mapping:
  //   7px  → 10px (micro)
  //   8px  → 11px (tiny)
  //   9px  → 12px (small)
  //   10px → 13px (base)
  //   11px → 14px (body)
  //   12px → 15px (medium)
  //   13px → 16px (large)
  //   14px → 17px (stat)
  //   16px → 19px (heading)
  //   20px → 24px (display)
  //   48px → 52px (hero)
  fontSizes: {
    micro: "10px",   // was 7px — badges, tiny labels
    tiny: "11px",    // was 8px — captions, metadata
    small: "12px",   // was 9px — labels, descriptions
    base: "13px",    // was 10px — default UI text, buttons
    body: "14px",    // was 11px — body text, list items
    medium: "15px",  // was 12px — subheadings
    large: "16px",   // was 13px — element names
    stat: "17px",    // was 14px — stat values
    heading: "19px", // was 16px — section headings
    display: "24px", // was 20px — large metrics
    hero: "52px",    // was 48px — hero numbers
  },

  // ─── Spacing ─────────────────────────────────────────────────────────────────
  // Increased minimum spacing for better readability and touch targets
  spacing: {
    xs: "4px",    // was 2px
    sm: "6px",    // was 3-4px
    md: "8px",    // was 6px
    lg: "12px",   // was 8-10px
    xl: "16px",   // was 12px
    xxl: "24px",  // was 16px
  },

  // ─── Border Radii ────────────────────────────────────────────────────────────
  radii: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    pill: "12px",
    round: "50%",
  },

  // ─── Common Styles (reusable inline style objects) ───────────────────────────

  // Section heading style (uppercase label)
  sectionLabel: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    fontWeight: 600,
  },

  // Panel heading (h3)
  panelHeading: {
    fontSize: "13px",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    margin: "0 0 10px 0",
    display: "flex" as const,
    alignItems: "center" as const,
  },

  // Field label (above selects/inputs)
  fieldLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  },

  // Select / input base
  inputBase: {
    background: "#1e293b",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: "4px",
    padding: "6px 10px",
    fontSize: "13px",
    fontFamily: "inherit",
  },

  // Button base
  buttonBase: {
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700 as const,
    cursor: "pointer" as const,
    fontFamily: "inherit",
  },

  // Badge / pill
  badge: {
    fontSize: "11px",
    padding: "3px 8px",
    borderRadius: "8px",
  },

  // Card container
  card: {
    background: "#0a0f1a",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "14px",
  },
} as const;
