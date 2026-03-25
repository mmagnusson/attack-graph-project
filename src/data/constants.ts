// ─── Static Constants extracted from attack-path-optimizer.html ───────────────

export interface Tactic {
  id: string;
  name: string;
  phase: number;
  color: string;
}

export interface ControlCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const TACTICS: Tactic[] = [
  { id: "TA0043", name: "Reconnaissance", phase: 0, color: "#6366f1" },
  { id: "TA0042", name: "Resource Dev", phase: 0, color: "#8b5cf6" },
  { id: "TA0001", name: "Initial Access", phase: 1, color: "#ec4899" },
  { id: "TA0002", name: "Execution", phase: 2, color: "#ef4444" },
  { id: "TA0003", name: "Persistence", phase: 3, color: "#f97316" },
  { id: "TA0004", name: "Priv Escalation", phase: 3, color: "#f59e0b" },
  { id: "TA0005", name: "Defense Evasion", phase: 4, color: "#eab308" },
  { id: "TA0006", name: "Credential Access", phase: 4, color: "#84cc16" },
  { id: "TA0007", name: "Discovery", phase: 5, color: "#22c55e" },
  { id: "TA0008", name: "Lateral Movement", phase: 6, color: "#14b8a6" },
  { id: "TA0009", name: "Collection", phase: 7, color: "#06b6d4" },
  { id: "TA0011", name: "Command & Control", phase: 7, color: "#3b82f6" },
  { id: "TA0010", name: "Exfiltration", phase: 8, color: "#6366f1" },
  { id: "TA0040", name: "Impact", phase: 8, color: "#a855f7" },
];

export const CHAIN_COLORS = [
  { color: "#f59e0b", label: "amber" },
  { color: "#06b6d4", label: "cyan" },
  { color: "#ec4899", label: "pink" },
] as const;

export const MAX_HIGHLIGHTED_CHAINS = 3;

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

export const ICS_ALL_PLATFORMS: string[] = [
  "Field Controller/RTU/PLC/IED",
  "Human-Machine Interface",
  "Engineering Workstation",
  "Control Server",
  "Data Historian",
  "Safety Instrumented System/Protection Relay",
  "Input/Output Server",
];

export const ICS_PHASE_WEIGHTS: Record<number, number> = {
  0: 0.6, 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.0, 6: 1.1, 7: 1.4, 8: 1.6,
};

// ─── STIX Phase → Tactic Mapping ──────────────────────────────────────────────

export const STIX_TACTIC_MAP: Record<string, string> = {
  "reconnaissance": "TA0043",
  "resource-development": "TA0042",
  "initial-access": "TA0001",
  "execution": "TA0002",
  "persistence": "TA0003",
  "privilege-escalation": "TA0004",
  "defense-evasion": "TA0005",
  "credential-access": "TA0006",
  "discovery": "TA0007",
  "lateral-movement": "TA0008",
  "collection": "TA0009",
  "command-and-control": "TA0011",
  "exfiltration": "TA0010",
  "impact": "TA0040",
};

export const TACTIC_PHASE: Record<string, number> = {};
TACTICS.forEach(t => TACTIC_PHASE[t.id] = t.phase);

// F4: Kill Chain Phase Weighting — later phases weight more
export const PHASE_WEIGHTS: Record<number, number> = {
  0: 0.5, 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.0, 6: 1.1, 7: 1.2, 8: 1.5,
};

// F2: Platform/OS Filtering
export const ALL_PLATFORMS: string[] = ["Windows", "Linux", "macOS", "Cloud", "Network", "SaaS"];

// ─── Security Control Categories ──────────────────────────────────────────────

export const CONTROL_CATEGORIES: ControlCategory[] = [
  { id: "technical", name: "Technical / Preventive", color: "#14b8a6", icon: "\u26E9" },
  { id: "detective", name: "Detective / Monitoring", color: "#3b82f6", icon: "\u25CE" },
  { id: "administrative", name: "Administrative / Policy", color: "#a855f7", icon: "\u00A7" },
  { id: "physical", name: "Physical / Operational", color: "#f59e0b", icon: "\u25A3" },
];
