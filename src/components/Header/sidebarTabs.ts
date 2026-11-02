// ─── Sidebar panel ids, labels, shortcuts ────────────────────────────────────

import { theme } from '../../theme';
import { ENCODING } from '../../data/constants';

export type SidebarPanel = "plan" | "defenses" | "model" | "gaps" | "executive";

export const SIDEBAR_TABS: { id: SidebarPanel; label: string; key: string; color: string }[] = [
  { id: "plan", label: "Plan", key: "P", color: ENCODING.success },
  { id: "defenses", label: "Defenses", key: "D", color: ENCODING.prevention },
  { id: "model", label: "Model", key: "M", color: theme.colors.blue },
  { id: "gaps", label: "Blind spots", key: "G", color: "#d03b3b" },
  { id: "executive", label: "Executive", key: "X", color: theme.colors.cyan },
];
