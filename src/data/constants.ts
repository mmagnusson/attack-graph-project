// ─── Static Constants ─────────────────────────────────────────────────────────

import type { ChainColor, Tactic } from '../types';

export const TACTICS: Tactic[] = [
  { id: "TA0043", name: "Reconnaissance", phase: 0, color: "#6366f1" },
  { id: "TA0042", name: "Resource Dev", phase: 0, color: "#8b5cf6" },
  { id: "TA0001", name: "Initial Access", phase: 1, color: "#ec4899" },
  { id: "TA0002", name: "Execution", phase: 2, color: "#ef4444" },
  { id: "TA0003", name: "Persistence", phase: 3, color: "#f97316" },
  { id: "TA0004", name: "Priv Escalation", phase: 3, color: "#f59e0b" },
  { id: "TA0005", name: "Stealth", phase: 4, color: "#eab308" },
  { id: "TA0112", name: "Defense Impairment", phase: 4, color: "#ca8a04" },
  { id: "TA0006", name: "Credential Access", phase: 4, color: "#84cc16" },
  { id: "TA0007", name: "Discovery", phase: 5, color: "#22c55e" },
  { id: "TA0008", name: "Lateral Movement", phase: 6, color: "#14b8a6" },
  { id: "TA0009", name: "Collection", phase: 7, color: "#06b6d4" },
  { id: "TA0011", name: "Command & Control", phase: 7, color: "#3b82f6" },
  { id: "TA0010", name: "Exfiltration", phase: 8, color: "#6366f1" },
  { id: "TA0040", name: "Impact", phase: 8, color: "#a855f7" },
];

/** Highlight colors for up to three compared chains (validated as a set on the dark surfaces) */
export const CHAIN_COLORS: readonly ChainColor[] = [
  { color: "#c98500", label: "gold" },
  { color: "#d55181", label: "magenta" },
  { color: "#9085e9", label: "violet" },
];

export const MAX_HIGHLIGHTED_CHAINS = 3;

/** Model encoding colors — attacker success, detection, prevention (validated, see README) */
export const ENCODING = {
  success: "#d95926",
  detection: "#3987e5",
  prevention: "#199e70",
  cut: "#0ca30c",
} as const;

// ─── ICS/OT ATT&CK Constants ─────────────────────────────────────────────────

export const ICS_TACTICS: Tactic[] = [
  { id: "TA0108", name: "Initial Access", phase: 0, color: "#ec4899" },
  { id: "TA0104", name: "Execution", phase: 1, color: "#ef4444" },
  { id: "TA0110", name: "Persistence", phase: 2, color: "#f97316" },
  { id: "TA0111", name: "Priv Escalation", phase: 2, color: "#f59e0b" },
  { id: "TA0103", name: "Evasion", phase: 3, color: "#eab308" },
  { id: "TA0102", name: "Discovery", phase: 4, color: "#22c55e" },
  { id: "TA0109", name: "Lateral Movement", phase: 5, color: "#14b8a6" },
  { id: "TA0100", name: "Collection", phase: 6, color: "#06b6d4" },
  { id: "TA0101", name: "Command & Ctrl", phase: 6, color: "#3b82f6" },
  { id: "TA0107", name: "Inhibit Resp Fn", phase: 7, color: "#6366f1" },
  { id: "TA0106", name: "Impair Process", phase: 7, color: "#a855f7" },
  { id: "TA0105", name: "Impact", phase: 8, color: "#dc2626" },
];

export const ICS_STIX_TACTIC_MAP: Record<string, string> = {
  "initial-access": "TA0108",
  "execution": "TA0104",
  "persistence": "TA0110",
  "privilege-escalation": "TA0111",
  "evasion": "TA0103",
  "discovery": "TA0102",
  "lateral-movement": "TA0109",
  "collection": "TA0100",
  "command-and-control": "TA0101",
  "inhibit-response-function": "TA0107",
  "impair-process-control": "TA0106",
  "impact": "TA0105",
};

// ─── STIX Phase → Tactic Mapping ──────────────────────────────────────────────

export const STIX_TACTIC_MAP: Record<string, string> = {
  "reconnaissance": "TA0043",
  "resource-development": "TA0042",
  "initial-access": "TA0001",
  "execution": "TA0002",
  "persistence": "TA0003",
  "privilege-escalation": "TA0004",
  "stealth": "TA0005",
  "defense-impairment": "TA0112",
  "credential-access": "TA0006",
  "discovery": "TA0007",
  "lateral-movement": "TA0008",
  "collection": "TA0009",
  "command-and-control": "TA0011",
  "exfiltration": "TA0010",
  "impact": "TA0040",
};

/** Enterprise platforms exactly as ATT&CK publishes them (techniques and analytics share these names) */
export const ALL_PLATFORMS: string[] = [
  "Windows", "Linux", "macOS", "ESXi", "IaaS", "SaaS", "Office Suite", "Identity Provider", "Containers", "Network Devices", "PRE",
];

/** ICS platforms as ATT&CK publishes them (v20 added them; earlier ICS techniques had none) */
export const ICS_PLATFORMS: string[] = ["Embedded", "Windows", "Linux", "Network Devices"];
