const { useState, useCallback, useEffect, useRef, useMemo } = React;

// ─── Data Model ───────────────────────────────────────────────────────────────

const TACTICS = [
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

const CHAIN_COLORS = [
  { color: "#f59e0b", label: "amber" },
  { color: "#06b6d4", label: "cyan" },
  { color: "#ec4899", label: "pink" },
];
const MAX_HIGHLIGHTED_CHAINS = 3;

const TECHNIQUES = [
  { id: "T1595", name: "Active Scanning", tactic: "TA0043", baseCriticality: 0.3 },
  { id: "T1598", name: "Phishing for Info", tactic: "TA0043", baseCriticality: 0.5 },
  { id: "T1592", name: "Gather Victim Host Info", tactic: "TA0043", baseCriticality: 0.4 },
  { id: "T1583", name: "Acquire Infrastructure", tactic: "TA0042", baseCriticality: 0.3 },
  { id: "T1588", name: "Obtain Capabilities", tactic: "TA0042", baseCriticality: 0.4 },
  { id: "T1586", name: "Compromise Accounts", tactic: "TA0042", baseCriticality: 0.5 },
  { id: "T1566", name: "Phishing", tactic: "TA0001", baseCriticality: 0.9 },
  { id: "T1190", name: "Exploit Public App", tactic: "TA0001", baseCriticality: 0.8 },
  { id: "T1078", name: "Valid Accounts", tactic: "TA0001", baseCriticality: 0.85 },
  { id: "T1199", name: "Trusted Relationship", tactic: "TA0001", baseCriticality: 0.6 },
  { id: "T1059", name: "Command & Script Interpreter", tactic: "TA0002", baseCriticality: 0.95 },
  { id: "T1204", name: "User Execution", tactic: "TA0002", baseCriticality: 0.7 },
  { id: "T1047", name: "WMI", tactic: "TA0002", baseCriticality: 0.6 },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "TA0002", baseCriticality: 0.65 },
  { id: "T1547", name: "Boot/Logon Autostart", tactic: "TA0003", baseCriticality: 0.7 },
  { id: "T1136", name: "Create Account", tactic: "TA0003", baseCriticality: 0.6 },
  { id: "T1543", name: "Create/Modify System Process", tactic: "TA0003", baseCriticality: 0.65 },
  { id: "T1546", name: "Event Triggered Execution", tactic: "TA0003", baseCriticality: 0.5 },
  { id: "T1068", name: "Exploitation for Priv Esc", tactic: "TA0004", baseCriticality: 0.8 },
  { id: "T1548", name: "Abuse Elevation Control", tactic: "TA0004", baseCriticality: 0.75 },
  { id: "T1134", name: "Access Token Manipulation", tactic: "TA0004", baseCriticality: 0.7 },
  { id: "T1027", name: "Obfuscated Files", tactic: "TA0005", baseCriticality: 0.6 },
  { id: "T1055", name: "Process Injection", tactic: "TA0005", baseCriticality: 0.85 },
  { id: "T1562", name: "Impair Defenses", tactic: "TA0005", baseCriticality: 0.9 },
  { id: "T1070", name: "Indicator Removal", tactic: "TA0005", baseCriticality: 0.5 },
  { id: "T1003", name: "OS Credential Dumping", tactic: "TA0006", baseCriticality: 0.9 },
  { id: "T1110", name: "Brute Force", tactic: "TA0006", baseCriticality: 0.5 },
  { id: "T1557", name: "Adversary-in-the-Middle", tactic: "TA0006", baseCriticality: 0.65 },
  { id: "T1558", name: "Steal/Forge Kerberos Tickets", tactic: "TA0006", baseCriticality: 0.8 },
  { id: "T1087", name: "Account Discovery", tactic: "TA0007", baseCriticality: 0.4 },
  { id: "T1082", name: "System Info Discovery", tactic: "TA0007", baseCriticality: 0.35 },
  { id: "T1046", name: "Network Service Discovery", tactic: "TA0007", baseCriticality: 0.45 },
  { id: "T1069", name: "Permission Groups Discovery", tactic: "TA0007", baseCriticality: 0.5 },
  { id: "T1021", name: "Remote Services", tactic: "TA0008", baseCriticality: 0.85 },
  { id: "T1570", name: "Lateral Tool Transfer", tactic: "TA0008", baseCriticality: 0.6 },
  { id: "T1550", name: "Use Alternate Auth Material", tactic: "TA0008", baseCriticality: 0.75 },
  { id: "T1560", name: "Archive Collected Data", tactic: "TA0009", baseCriticality: 0.5 },
  { id: "T1005", name: "Data from Local System", tactic: "TA0009", baseCriticality: 0.6 },
  { id: "T1114", name: "Email Collection", tactic: "TA0009", baseCriticality: 0.55 },
  { id: "T1071", name: "Application Layer Protocol", tactic: "TA0011", baseCriticality: 0.7 },
  { id: "T1105", name: "Ingress Tool Transfer", tactic: "TA0011", baseCriticality: 0.65 },
  { id: "T1572", name: "Protocol Tunneling", tactic: "TA0011", baseCriticality: 0.6 },
  { id: "T1041", name: "Exfil Over C2 Channel", tactic: "TA0010", baseCriticality: 0.7 },
  { id: "T1048", name: "Exfil Over Alt Protocol", tactic: "TA0010", baseCriticality: 0.6 },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "TA0040", baseCriticality: 0.95 },
  { id: "T1489", name: "Service Stop", tactic: "TA0040", baseCriticality: 0.7 },
  { id: "T1529", name: "System Shutdown/Reboot", tactic: "TA0040", baseCriticality: 0.5 },
  { id: "T1485", name: "Data Destruction", tactic: "TA0040", baseCriticality: 0.85 },
];

const EDGES = [
  { from: "T1595", to: "T1190" }, { from: "T1598", to: "T1566" },
  { from: "T1592", to: "T1190" }, { from: "T1598", to: "T1078" },
  { from: "T1583", to: "T1566" }, { from: "T1588", to: "T1190" },
  { from: "T1586", to: "T1078" }, { from: "T1586", to: "T1199" },
  { from: "T1566", to: "T1204" }, { from: "T1566", to: "T1059" },
  { from: "T1190", to: "T1059" }, { from: "T1078", to: "T1059" },
  { from: "T1078", to: "T1047" }, { from: "T1199", to: "T1059" },
  { from: "T1204", to: "T1059" },
  { from: "T1059", to: "T1547" }, { from: "T1059", to: "T1136" },
  { from: "T1059", to: "T1543" }, { from: "T1059", to: "T1546" },
  { from: "T1047", to: "T1543" }, { from: "T1053", to: "T1547" },
  { from: "T1059", to: "T1068" }, { from: "T1059", to: "T1548" },
  { from: "T1059", to: "T1134" }, { from: "T1053", to: "T1548" },
  { from: "T1059", to: "T1027" }, { from: "T1059", to: "T1055" },
  { from: "T1059", to: "T1562" }, { from: "T1059", to: "T1070" },
  { from: "T1547", to: "T1059" }, { from: "T1546", to: "T1059" },
  { from: "T1068", to: "T1003" }, { from: "T1134", to: "T1003" },
  { from: "T1548", to: "T1003" },
  { from: "T1068", to: "T1055" }, { from: "T1134", to: "T1562" },
  { from: "T1055", to: "T1003" }, { from: "T1562", to: "T1003" },
  { from: "T1003", to: "T1087" }, { from: "T1003", to: "T1069" },
  { from: "T1558", to: "T1087" }, { from: "T1110", to: "T1082" },
  { from: "T1003", to: "T1021" }, { from: "T1003", to: "T1550" },
  { from: "T1558", to: "T1550" }, { from: "T1558", to: "T1021" },
  { from: "T1087", to: "T1021" }, { from: "T1046", to: "T1021" },
  { from: "T1069", to: "T1550" }, { from: "T1082", to: "T1570" },
  { from: "T1021", to: "T1005" }, { from: "T1021", to: "T1114" },
  { from: "T1550", to: "T1005" }, { from: "T1570", to: "T1560" },
  { from: "T1021", to: "T1059" }, { from: "T1550", to: "T1047" },
  { from: "T1560", to: "T1071" }, { from: "T1005", to: "T1071" },
  { from: "T1114", to: "T1105" },
  { from: "T1059", to: "T1071" }, { from: "T1059", to: "T1572" },
  { from: "T1059", to: "T1105" },
  { from: "T1071", to: "T1041" }, { from: "T1572", to: "T1048" },
  { from: "T1105", to: "T1041" },
  { from: "T1071", to: "T1486" }, { from: "T1071", to: "T1489" },
  { from: "T1105", to: "T1486" },
  { from: "T1021", to: "T1486" }, { from: "T1021", to: "T1485" },
  { from: "T1021", to: "T1489" }, { from: "T1550", to: "T1529" },
  { from: "T1041", to: "T1486" },
  { from: "T1055", to: "T1082" }, { from: "T1562", to: "T1046" },
  { from: "T1557", to: "T1071" },
];

const ATTACK_CHAINS = [
  {
    name: "APT29 / Cozy Bear",
    description: "Russian SVR - SolarWinds-style supply chain",
    sector: "government",
    path: ["T1199", "T1059", "T1543", "T1562", "T1003", "T1087", "T1021", "T1005", "T1071", "T1041"],
    severity: 0.95,
  },
  {
    name: "Conti Ransomware",
    description: "Double extortion ransomware operation",
    sector: "all",
    path: ["T1566", "T1204", "T1059", "T1547", "T1068", "T1003", "T1021", "T1560", "T1071", "T1486"],
    severity: 0.9,
  },
  {
    name: "APT28 / Fancy Bear",
    description: "Russian GRU - credential harvesting & espionage",
    sector: "government",
    path: ["T1598", "T1566", "T1059", "T1055", "T1003", "T1558", "T1550", "T1114", "T1071", "T1041"],
    severity: 0.9,
  },
  {
    name: "LockBit 3.0",
    description: "RaaS with affiliate model",
    sector: "all",
    path: ["T1595", "T1190", "T1059", "T1136", "T1548", "T1562", "T1003", "T1046", "T1021", "T1486"],
    severity: 0.85,
  },
  {
    name: "Lazarus Group",
    description: "DPRK - financially motivated + espionage",
    sector: "financial",
    path: ["T1586", "T1078", "T1059", "T1546", "T1134", "T1055", "T1003", "T1021", "T1005", "T1071", "T1048"],
    severity: 0.9,
  },
  {
    name: "FIN7",
    description: "Financially motivated, targets POS/retail",
    sector: "financial",
    path: ["T1598", "T1566", "T1204", "T1059", "T1547", "T1027", "T1003", "T1069", "T1021", "T1560", "T1071", "T1041"],
    severity: 0.8,
  },
  {
    name: "Volt Typhoon",
    description: "Chinese state actor - living off the land",
    sector: "government",
    path: ["T1190", "T1059", "T1543", "T1548", "T1070", "T1003", "T1082", "T1021", "T1005", "T1572", "T1048"],
    severity: 0.95,
  },
  {
    name: "BlackCat / ALPHV",
    description: "Ransomware with data leak site",
    sector: "all",
    path: ["T1078", "T1047", "T1543", "T1068", "T1562", "T1110", "T1046", "T1570", "T1560", "T1071", "T1486"],
    severity: 0.85,
  },
];

const ENV_PRESETS = {
  default: { name: "Unassessed (Worst Case)", description: "All nodes fully exposed" },
  government: {
    name: "Government (Typical)",
    description: "Basic perimeter, some EDR, limited segmentation",
    overrides: {
      "T1566": 0.6, "T1190": 0.5, "T1059": 0.8, "T1078": 0.7,
      "T1547": 0.6, "T1068": 0.7, "T1003": 0.75, "T1021": 0.7,
      "T1055": 0.8, "T1562": 0.65, "T1071": 0.6, "T1486": 0.85,
      "T1027": 0.7, "T1087": 0.5, "T1046": 0.4, "T1110": 0.3,
    }
  },
  hardened: {
    name: "Hardened Enterprise",
    description: "Full EDR, app whitelisting, network segmentation, MFA",
    overrides: {
      "T1566": 0.3, "T1190": 0.2, "T1059": 0.3, "T1078": 0.2,
      "T1547": 0.25, "T1068": 0.35, "T1003": 0.3, "T1021": 0.25,
      "T1055": 0.35, "T1562": 0.2, "T1071": 0.3, "T1486": 0.4,
      "T1204": 0.35, "T1047": 0.2, "T1136": 0.15, "T1543": 0.2,
      "T1548": 0.25, "T1134": 0.3, "T1027": 0.3, "T1070": 0.25,
      "T1110": 0.1, "T1557": 0.2, "T1558": 0.25, "T1087": 0.3,
      "T1082": 0.2, "T1046": 0.15, "T1069": 0.25, "T1570": 0.2,
      "T1550": 0.2, "T1560": 0.3, "T1005": 0.35, "T1114": 0.25,
      "T1105": 0.2, "T1572": 0.15, "T1041": 0.25, "T1048": 0.2,
      "T1486": 0.3, "T1489": 0.25, "T1529": 0.2, "T1485": 0.3,
    }
  },
};

// ─── STIX Phase → Tactic Mapping ──────────────────────────────────────────────

const STIX_TACTIC_MAP = {
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

const TACTIC_PHASE = {};
TACTICS.forEach(t => TACTIC_PHASE[t.id] = t.phase);

const TACTIC_TO_PHASE_NAME = {};
Object.entries(STIX_TACTIC_MAP).forEach(([name, id]) => { TACTIC_TO_PHASE_NAME[id] = name; });

// F4: Kill Chain Phase Weighting — later phases weight more
const PHASE_WEIGHTS = {
  0: 0.5, 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.0, 6: 1.1, 7: 1.2, 8: 1.5,
};

// ─── Security Controls (Controls Framework) ──────────────────────────────────

const CONTROL_CATEGORIES = [
  { id: "technical", name: "Technical / Preventive", color: "#14b8a6", icon: "\u26E9" },
  { id: "detective", name: "Detective / Monitoring", color: "#3b82f6", icon: "\u25CE" },
  { id: "administrative", name: "Administrative / Policy", color: "#a855f7", icon: "\u00A7" },
  { id: "physical", name: "Physical / Operational", color: "#f59e0b", icon: "\u25A3" },
];

const SECURITY_CONTROLS = [
  // ── Technical / Preventive ──
  { id: "edr", name: "EDR/XDR Platform", category: "technical", cost: "$$$$",
    coverage: { "T1059": -0.4, "T1055": -0.5, "T1547": -0.3, "T1543": -0.3, "T1546": -0.3, "T1204": -0.3, "T1047": -0.3 } },
  { id: "email-sec", name: "Email Security Gateway", category: "technical", cost: "$$",
    coverage: { "T1566": -0.5, "T1598": -0.4, "T1204": -0.3 } },
  { id: "mfa", name: "Multi-Factor Auth", category: "technical", cost: "$",
    coverage: { "T1078": -0.6, "T1110": -0.5, "T1550": -0.4 } },
  { id: "seg", name: "Network Segmentation", category: "technical", cost: "$$$",
    coverage: { "T1021": -0.5, "T1570": -0.5, "T1046": -0.4 } },
  { id: "pam", name: "Privileged Access Mgmt", category: "technical", cost: "$$$",
    coverage: { "T1068": -0.4, "T1548": -0.4, "T1134": -0.3, "T1003": -0.3 } },
  { id: "dlp", name: "Data Loss Prevention", category: "technical", cost: "$$",
    coverage: { "T1041": -0.5, "T1048": -0.5, "T1560": -0.3, "T1005": -0.3 } },
  { id: "backup", name: "Immutable Backups", category: "technical", cost: "$$",
    coverage: { "T1486": -0.6, "T1485": -0.5, "T1489": -0.3, "T1529": -0.3 } },
  { id: "app-wl", name: "App Whitelisting", category: "technical", cost: "$$",
    coverage: { "T1059": -0.3, "T1204": -0.3, "T1047": -0.25, "T1053": -0.25 } },
  { id: "waf", name: "Web App Firewall", category: "technical", cost: "$$",
    coverage: { "T1190": -0.4, "T1059": -0.2 } },
  { id: "ztna", name: "Zero Trust Network Access", category: "technical", cost: "$$$",
    coverage: { "T1021": -0.4, "T1550": -0.35, "T1570": -0.3 } },
  { id: "sandbox", name: "Sandbox / Detonation", category: "technical", cost: "$$",
    coverage: { "T1566": -0.35, "T1204": -0.3, "T1059": -0.2 } },
  { id: "secrets", name: "Secrets Management", category: "technical", cost: "$",
    coverage: { "T1003": -0.3, "T1558": -0.25, "T1110": -0.3 } },
  { id: "patch", name: "Patch Management", category: "technical", cost: "$",
    coverage: { "T1190": -0.35, "T1068": -0.3 } },
  { id: "tls-inspect", name: "TLS Inspection / Decryption", category: "technical", cost: "$$",
    coverage: { "T1557": -0.5, "T1071": -0.2 } },
  { id: "proxy", name: "Web Proxy / Content Filter", category: "technical", cost: "$$",
    coverage: { "T1105": -0.4, "T1071": -0.2, "T1059": -0.15 } },
  { id: "dns-filter", name: "DNS Filtering", category: "technical", cost: "$",
    coverage: { "T1071": -0.25, "T1572": -0.3, "T1105": -0.2 } },
  { id: "ad-harden", name: "Active Directory Hardening", category: "technical", cost: "$$",
    coverage: { "T1087": -0.3, "T1069": -0.3, "T1136": -0.25, "T1003": -0.2 } },

  // ── Detective / Monitoring ──
  { id: "siem", name: "SIEM / SOC", category: "detective", cost: "$$$$",
    coverage: { "T1059": -0.3, "T1055": -0.35, "T1021": -0.25, "T1071": -0.3, "T1572": -0.25 } },
  { id: "hunt", name: "Threat Hunting", category: "detective", cost: "$$$",
    coverage: { "T1027": -0.35, "T1070": -0.3, "T1055": -0.3, "T1562": -0.3 } },
  { id: "vuln-scan", name: "Vulnerability Scanning", category: "detective", cost: "$",
    coverage: { "T1190": -0.25, "T1068": -0.2, "T1548": -0.2 } },
  { id: "ids", name: "IDS / IPS", category: "detective", cost: "$$",
    coverage: { "T1071": -0.35, "T1572": -0.3, "T1041": -0.3, "T1048": -0.3 } },
  { id: "uba", name: "User Behavior Analytics", category: "detective", cost: "$$$",
    coverage: { "T1078": -0.3, "T1134": -0.25, "T1021": -0.2, "T1087": -0.2 } },
  { id: "easm", name: "Attack Surface Management", category: "detective", cost: "$$",
    coverage: { "T1595": -0.4, "T1592": -0.35, "T1190": -0.2 } },
  { id: "ndr", name: "Network Detection & Response", category: "detective", cost: "$$$",
    coverage: { "T1557": -0.35, "T1071": -0.25, "T1570": -0.25, "T1021": -0.2 } },
  { id: "deception", name: "Deception / Honeypots", category: "detective", cost: "$$",
    coverage: { "T1082": -0.35, "T1069": -0.3, "T1046": -0.3, "T1087": -0.25 } },
  { id: "log-mgmt", name: "Centralized Log Management", category: "detective", cost: "$$",
    coverage: { "T1070": -0.35, "T1562": -0.25, "T1059": -0.15 } },
  { id: "email-mon", name: "Email Security Monitoring", category: "detective", cost: "$",
    coverage: { "T1114": -0.4, "T1566": -0.15, "T1598": -0.15 } },

  // ── Administrative / Policy ──
  { id: "training", name: "Security Awareness Training", category: "administrative", cost: "$",
    coverage: { "T1566": -0.3, "T1598": -0.3, "T1204": -0.35, "T1078": -0.2 } },
  { id: "access-review", name: "Access Review Policy", category: "administrative", cost: "$",
    coverage: { "T1078": -0.25, "T1136": -0.3, "T1134": -0.2 } },
  { id: "ir-plan", name: "Incident Response Plan", category: "administrative", cost: "$",
    coverage: { "T1486": -0.25, "T1485": -0.25, "T1489": -0.2, "T1529": -0.2 } },
  { id: "change-mgmt", name: "Change Management", category: "administrative", cost: "$",
    coverage: { "T1543": -0.25, "T1547": -0.2, "T1546": -0.2 } },
  { id: "least-priv", name: "Least Privilege Policy", category: "administrative", cost: "$",
    coverage: { "T1068": -0.25, "T1548": -0.25, "T1134": -0.2, "T1003": -0.2 } },
  { id: "ti-program", name: "Threat Intelligence Program", category: "administrative", cost: "$$",
    coverage: { "T1583": -0.3, "T1588": -0.3, "T1586": -0.2, "T1595": -0.2 } },
  { id: "identity-gov", name: "Identity Governance", category: "administrative", cost: "$$",
    coverage: { "T1136": -0.3, "T1078": -0.2, "T1134": -0.2, "T1069": -0.2 } },
  { id: "data-class", name: "Data Classification Policy", category: "administrative", cost: "$",
    coverage: { "T1005": -0.25, "T1114": -0.25, "T1560": -0.2 } },
  { id: "vendor-mgmt", name: "Third-Party Risk Management", category: "administrative", cost: "$$",
    coverage: { "T1199": -0.35, "T1586": -0.25, "T1583": -0.2 } },

  // ── Physical / Operational ──
  { id: "airgap", name: "Air-Gapped Networks", category: "physical", cost: "$$$$",
    coverage: { "T1071": -0.5, "T1572": -0.5, "T1041": -0.5, "T1048": -0.5, "T1105": -0.4 } },
  { id: "phys-access", name: "Physical Access Controls", category: "physical", cost: "$$",
    coverage: { "T1078": -0.2, "T1199": -0.25 } },
  { id: "supply-chain", name: "Supply Chain Verification", category: "physical", cost: "$$",
    coverage: { "T1199": -0.3, "T1586": -0.25, "T1195": -0.3 } },
  { id: "media-control", name: "Removable Media Control", category: "physical", cost: "$",
    coverage: { "T1048": -0.25, "T1005": -0.2, "T1105": -0.2 } },
  { id: "secure-build", name: "Secure Build / Golden Images", category: "physical", cost: "$$",
    coverage: { "T1588": -0.3, "T1543": -0.2, "T1547": -0.2, "T1053": -0.25 } },
  { id: "net-monitor", name: "Network Traffic Monitoring", category: "physical", cost: "$$",
    coverage: { "T1082": -0.25, "T1046": -0.25, "T1572": -0.2 } },
  { id: "red-team", name: "Red Team / Pen Testing", category: "physical", cost: "$$$",
    coverage: { "T1190": -0.2, "T1068": -0.2, "T1059": -0.15, "T1003": -0.15 } },
];

// F5: Industry Control Presets
const CONTROL_PRESETS = {
  none: { name: "Manual", controls: [] },
  "nist-csf": { name: "NIST CSF Essential", controls: [
    "edr", "email-sec", "mfa", "seg", "pam", "backup", "patch", "siem", "vuln-scan", "ids", "training", "ir-plan", "least-priv", "log-mgmt",
  ]},
  "cis-top18": { name: "CIS Controls v8 IG2", controls: [
    "edr", "email-sec", "mfa", "seg", "pam", "dlp", "backup", "app-wl", "waf", "siem", "vuln-scan", "ids", "uba", "training", "access-review", "ir-plan", "change-mgmt", "log-mgmt",
  ]},
  "pci-dss": { name: "PCI DSS 4.0", controls: [
    "edr", "mfa", "seg", "dlp", "waf", "tls-inspect", "proxy", "siem", "ids", "vuln-scan", "training", "access-review", "ir-plan", "change-mgmt", "log-mgmt",
  ]},
  "zero-trust": { name: "Zero Trust Architecture", controls: [
    "edr", "mfa", "ztna", "pam", "seg", "dns-filter", "proxy", "siem", "uba", "ndr", "least-priv", "identity-gov", "ad-harden",
  ]},
};

// ─── Technique Examples (Built-in Dataset) ────────────────────────────────────

const TECHNIQUE_EXAMPLES = {
  "T1595": {
    summary: "Adversaries scan victim IP ranges and infrastructure to identify potential entry points and running services.",
    examples: [
      "Port scanning external-facing hosts to find open management interfaces",
      "Banner grabbing web servers to identify vulnerable software versions",
      "DNS enumeration to map an organization's internet-facing attack surface",
    ],
  },
  "T1598": {
    summary: "Adversaries send targeted messages to elicit sensitive information like credentials or internal details before the actual attack.",
    examples: [
      "Spoofed emails impersonating IT support asking users to verify credentials",
      "Social media messages to employees asking about internal tools and processes",
      "Fake vendor surveys designed to gather technical environment details",
    ],
  },
  "T1592": {
    summary: "Adversaries collect information about victim hosts such as hardware, software, and configurations to tailor attacks.",
    examples: [
      "Scraping job postings that reveal internal technology stacks",
      "Using browser fingerprinting on watering-hole sites to profile visitor systems",
      "Harvesting exposed configuration files from misconfigured web servers",
    ],
  },
  "T1583": {
    summary: "Adversaries acquire infrastructure such as servers, domains, and cloud services to stage and execute operations.",
    examples: [
      "Registering look-alike domains for credential phishing campaigns",
      "Purchasing VPS hosting in multiple countries for C2 resilience",
      "Setting up cloud storage accounts for malware staging and exfiltration",
    ],
  },
  "T1588": {
    summary: "Adversaries obtain tools, exploits, and certificates to use during operations rather than developing them.",
    examples: [
      "Purchasing zero-day exploits from underground markets",
      "Downloading open-source offensive tools like Cobalt Strike or Mimikatz",
      "Stealing valid code-signing certificates to sign malware",
    ],
  },
  "T1586": {
    summary: "Adversaries compromise existing accounts on third-party services to use for targeting victims.",
    examples: [
      "Hijacking a trusted vendor's email account for supply-chain phishing",
      "Purchasing stolen corporate credentials from darknet markets",
      "Compromising social media accounts to distribute malicious links",
    ],
  },
  "T1566": {
    summary: "Adversaries send targeted emails with malicious attachments or links to gain initial access.",
    examples: [
      "Spearphishing with weaponized Office documents containing macros",
      "Credential harvesting via spoofed login pages linked in emails",
      "HTML smuggling attachments that drop malware when opened",
    ],
  },
  "T1190": {
    summary: "Adversaries exploit vulnerabilities in internet-facing applications to gain initial access to networks.",
    examples: [
      "Exploiting unpatched Exchange Server vulnerabilities (ProxyShell/ProxyLogon)",
      "SQL injection against web applications to gain server access",
      "Exploiting VPN appliance vulnerabilities to bypass perimeter controls",
    ],
  },
  "T1078": {
    summary: "Adversaries use legitimate credentials to authenticate and blend in with normal activity.",
    examples: [
      "Logging in with credentials obtained from previous breaches",
      "Using default or unchanged service account passwords",
      "Leveraging stolen VPN credentials to access the internal network",
    ],
  },
  "T1199": {
    summary: "Adversaries exploit trusted third-party relationships to gain access to target networks.",
    examples: [
      "Compromising a managed service provider to pivot to their clients",
      "Injecting malicious code into a software vendor's update pipeline",
      "Abusing trusted VPN connections between partner organizations",
    ],
  },
  "T1059": {
    summary: "Adversaries abuse command-line interpreters and scripting languages to execute commands and scripts.",
    examples: [
      "PowerShell scripts for downloading and executing payloads in memory",
      "Python-based implants for cross-platform post-exploitation",
      "Windows Command Shell one-liners chained via batch scripts",
    ],
  },
  "T1204": {
    summary: "Adversaries rely on user interaction to execute malicious payloads, typically through social engineering.",
    examples: [
      "Tricking users into enabling macros in a phishing document",
      "Disguising malware as a legitimate software installer",
      "Luring users to click malicious links in convincing pretexts",
    ],
  },
  "T1047": {
    summary: "Adversaries use Windows Management Instrumentation to execute commands and move laterally.",
    examples: [
      "Remote process creation on other hosts via WMI for lateral movement",
      "WMI event subscriptions for fileless persistence",
      "Querying WMI for system reconnaissance and inventory",
    ],
  },
  "T1053": {
    summary: "Adversaries abuse task scheduling functionality for persistent or delayed execution.",
    examples: [
      "Creating scheduled tasks to run malware at system startup",
      "Using at/schtasks for remote code execution on other hosts",
      "Cron jobs on Linux systems for persistent backdoor access",
    ],
  },
  "T1547": {
    summary: "Adversaries configure settings to automatically execute programs during system boot or user logon.",
    examples: [
      "Adding malware to the Windows Registry Run keys",
      "Placing malicious shortcuts in the Startup folder",
      "Modifying boot configuration for pre-OS execution",
    ],
  },
  "T1136": {
    summary: "Adversaries create new accounts to maintain access to victim systems.",
    examples: [
      "Creating local admin accounts on compromised hosts as backup access",
      "Adding rogue accounts to Active Directory with elevated privileges",
      "Creating cloud IAM users with programmatic access keys",
    ],
  },
  "T1543": {
    summary: "Adversaries create or modify system-level processes to repeatedly execute malicious payloads.",
    examples: [
      "Installing a malicious Windows service for persistence",
      "Modifying systemd unit files on Linux for backdoor execution",
      "Creating launch daemons on macOS to survive reboots",
    ],
  },
  "T1546": {
    summary: "Adversaries establish persistence by configuring code to execute in response to specific system events.",
    examples: [
      "WMI event subscriptions that trigger on specific conditions",
      "Modifying Windows accessibility features (e.g., Sticky Keys) for backdoor login",
      "AppInit_DLLs that load into every user-mode process",
    ],
  },
  "T1068": {
    summary: "Adversaries exploit software vulnerabilities in privileged processes to escalate from user to admin or SYSTEM.",
    examples: [
      "Kernel exploits to escalate from standard user to SYSTEM",
      "Exploiting misconfigured SUID binaries on Linux",
      "Targeting vulnerable device drivers for ring-0 code execution",
    ],
  },
  "T1548": {
    summary: "Adversaries bypass elevation controls like UAC to gain higher privileges without prompting the user.",
    examples: [
      "UAC bypass techniques using auto-elevating Windows binaries",
      "Abusing sudoers misconfigurations on Linux systems",
      "DLL side-loading into elevated processes",
    ],
  },
  "T1134": {
    summary: "Adversaries manipulate access tokens to operate under a different security context.",
    examples: [
      "Duplicating tokens from privileged processes to impersonate SYSTEM",
      "Creating processes with stolen tokens via token impersonation",
      "Adjusting token privileges to enable disabled security rights",
    ],
  },
  "T1027": {
    summary: "Adversaries obfuscate files and information to make detection and analysis more difficult.",
    examples: [
      "Base64-encoding PowerShell payloads to bypass string-based detection",
      "Packing executables with custom crypters to evade antivirus",
      "Steganography to hide payloads within image files",
    ],
  },
  "T1055": {
    summary: "Adversaries inject code into legitimate processes to evade defenses and elevate privileges.",
    examples: [
      "DLL injection into explorer.exe to hide in a trusted process",
      "Process hollowing to replace a legitimate process's memory with malware",
      "Thread execution hijacking in running system processes",
    ],
  },
  "T1562": {
    summary: "Adversaries disable or tamper with security tools and logging to avoid detection.",
    examples: [
      "Killing or uninstalling endpoint protection agents",
      "Disabling Windows Event Log or Sysmon services",
      "Modifying firewall rules to allow C2 traffic",
    ],
  },
  "T1070": {
    summary: "Adversaries delete or modify artifacts to remove evidence of their presence.",
    examples: [
      "Clearing Windows Event Logs after lateral movement",
      "Timestomping files to match legitimate system files",
      "Deleting command history files on Linux (.bash_history)",
    ],
  },
  "T1003": {
    summary: "Adversaries dump credentials from OS memory, registry, or files to obtain account login information.",
    examples: [
      "Using Mimikatz to extract plaintext passwords from LSASS memory",
      "Dumping the SAM database for local account password hashes",
      "Extracting cached domain credentials via DCSync attacks",
    ],
  },
  "T1110": {
    summary: "Adversaries use brute force techniques to guess credentials and gain access to accounts.",
    examples: [
      "Password spraying common passwords against all domain accounts",
      "Credential stuffing with leaked username/password combinations",
      "Dictionary attacks against exposed RDP or SSH services",
    ],
  },
  "T1557": {
    summary: "Adversaries position themselves between communicating systems to intercept and modify traffic.",
    examples: [
      "ARP spoofing on local networks to intercept authentication traffic",
      "LLMNR/NBT-NS poisoning to capture NTLMv2 hashes",
      "Rogue Wi-Fi access points for credential interception",
    ],
  },
  "T1558": {
    summary: "Adversaries steal or forge Kerberos tickets to move laterally or access resources without credentials.",
    examples: [
      "Kerberoasting to extract service account ticket hashes for offline cracking",
      "Golden Ticket attacks using a compromised KRBTGT hash",
      "Silver Ticket forgery targeting specific services",
    ],
  },
  "T1087": {
    summary: "Adversaries enumerate accounts to understand which users and service accounts exist in the environment.",
    examples: [
      "Querying Active Directory for all domain users and their group memberships",
      "Enumerating local accounts on compromised hosts",
      "Using net user /domain to list domain accounts",
    ],
  },
  "T1082": {
    summary: "Adversaries collect detailed system information to understand the environment and plan next steps.",
    examples: [
      "Running systeminfo to gather OS version, patches, and hardware details",
      "Querying installed software and running services",
      "Enumerating domain trust relationships and forest structure",
    ],
  },
  "T1046": {
    summary: "Adversaries scan internal networks to discover running services and identify lateral movement targets.",
    examples: [
      "Internal port scanning to find database servers and file shares",
      "Scanning for open SMB ports to identify reachable hosts",
      "Service discovery sweeps across internal subnets",
    ],
  },
  "T1069": {
    summary: "Adversaries discover permission groups and their members to identify high-value targets for privilege escalation.",
    examples: [
      "Enumerating Domain Admins and Enterprise Admins group membership",
      "Identifying users in privileged security groups",
      "Querying cloud IAM roles and group permissions",
    ],
  },
  "T1021": {
    summary: "Adversaries use legitimate remote services to move laterally between systems.",
    examples: [
      "RDP sessions to jump between compromised workstations",
      "PsExec or SMB admin shares for remote command execution",
      "SSH connections using stolen keys for Linux lateral movement",
    ],
  },
  "T1570": {
    summary: "Adversaries transfer tools and files between compromised systems within the network.",
    examples: [
      "Copying attack tools via SMB shares to other hosts",
      "Using native OS utilities like SCP or BITSAdmin for internal transfers",
      "Staging tools on internal file shares for other compromised hosts to access",
    ],
  },
  "T1550": {
    summary: "Adversaries use stolen authentication material like hashes or tickets instead of plaintext credentials.",
    examples: [
      "Pass-the-hash attacks using NTLM hashes for authentication",
      "Pass-the-ticket with stolen Kerberos TGTs",
      "Using stolen web session cookies to bypass MFA",
    ],
  },
  "T1560": {
    summary: "Adversaries compress and encrypt collected data before exfiltration to reduce size and avoid detection.",
    examples: [
      "Using 7-Zip or RAR to create password-protected archives of stolen files",
      "Custom encryption of collected data prior to exfiltration",
      "Staging compressed archives in temporary directories for bulk transfer",
    ],
  },
  "T1005": {
    summary: "Adversaries collect sensitive data from local system sources like file systems and databases.",
    examples: [
      "Searching for documents containing keywords like 'password' or 'confidential'",
      "Extracting data from local database files and application stores",
      "Collecting browser-stored credentials and session data",
    ],
  },
  "T1114": {
    summary: "Adversaries collect email data from local clients or mail servers for intelligence gathering.",
    examples: [
      "Exporting Outlook PST files from user workstations",
      "Using Exchange Web Services to search and download mailboxes",
      "Accessing cloud email via compromised OAuth tokens",
    ],
  },
  "T1071": {
    summary: "Adversaries communicate with C2 servers using standard application layer protocols to blend with normal traffic.",
    examples: [
      "HTTPS-based C2 channels disguised as normal web browsing",
      "DNS tunneling for covert command and control",
      "C2 traffic over legitimate cloud service APIs (Slack, Teams, S3)",
    ],
  },
  "T1105": {
    summary: "Adversaries transfer tools and files from external systems into the compromised environment.",
    examples: [
      "Downloading post-exploitation tools via PowerShell or curl",
      "Fetching additional payloads from attacker-controlled cloud storage",
      "Using BITSAdmin or certutil to download files while evading detection",
    ],
  },
  "T1572": {
    summary: "Adversaries tunnel network communications through an existing protocol to avoid detection or network filtering.",
    examples: [
      "SSH tunneling to encapsulate C2 traffic within allowed protocols",
      "DNS-over-HTTPS tunneling to bypass network inspection",
      "Encapsulating traffic within legitimate cloud service protocols",
    ],
  },
  "T1041": {
    summary: "Adversaries exfiltrate stolen data over the existing command and control channel.",
    examples: [
      "Uploading collected files through the HTTPS C2 channel",
      "Chunking large data sets into C2 protocol messages",
      "Using encrypted C2 sessions to blend exfiltration with command traffic",
    ],
  },
  "T1048": {
    summary: "Adversaries exfiltrate data over alternative protocols different from the C2 channel to avoid detection.",
    examples: [
      "Exfiltrating data over DNS queries to attacker-controlled resolvers",
      "Using FTP or SFTP to external servers separate from C2 infrastructure",
      "Sending data through ICMP tunnels or steganographic channels",
    ],
  },
  "T1486": {
    summary: "Adversaries encrypt victim data to extort ransom payments for decryption keys.",
    examples: [
      "Deploying ransomware across domain-joined systems via GPO",
      "Encrypting network shares and backup volumes simultaneously",
      "Double extortion: exfiltrating data before encryption for added leverage",
    ],
  },
  "T1489": {
    summary: "Adversaries stop services to disrupt availability or inhibit recovery before destructive actions.",
    examples: [
      "Stopping SQL Server and Exchange services before encrypting databases",
      "Disabling backup agent services to prevent recovery",
      "Killing antivirus processes prior to deploying ransomware",
    ],
  },
  "T1529": {
    summary: "Adversaries shut down or reboot systems to finalize destructive actions or disrupt availability.",
    examples: [
      "Forcing reboots after MBR modification for wiper deployment",
      "Mass system shutdowns to amplify operational disruption",
      "Scheduled reboots to trigger boot-level ransomware payload",
    ],
  },
  "T1485": {
    summary: "Adversaries destroy data and files to disrupt availability and hinder recovery efforts.",
    examples: [
      "Wiping disk partitions with destructive malware (e.g., WhisperGate)",
      "Overwriting critical files and backups to prevent restoration",
      "Deleting Volume Shadow Copies before deploying destructive payloads",
    ],
  },
};

const CHAIN_TECHNIQUE_CONTEXT = {
  "APT29 / Cozy Bear": {
    "T1199": "Compromised the SolarWinds Orion build process to deliver trojanized updates to ~18,000 organizations",
    "T1059": "Used PowerShell extensively and deployed the SUNBURST backdoor, later using Python-based tooling",
    "T1543": "Installed malicious services masquerading as legitimate SolarWinds components",
    "T1562": "Disabled security logging and tampered with Defender to conceal SUNBURST activity",
    "T1003": "Used DCSync attacks and token manipulation to extract credentials from domain controllers",
    "T1087": "Enumerated privileged accounts and Azure AD roles to identify high-value targets",
    "T1021": "Moved laterally via RDP and SMB using stolen admin credentials across victim networks",
    "T1071": "Used HTTPS C2 mimicking legitimate SolarWinds API traffic to blend with normal activity",
  },
  "Conti Ransomware": {
    "T1566": "Delivered BazarLoader and IcedID via phishing emails with malicious document attachments",
    "T1204": "Relied on victims enabling macros in weaponized Excel and Word documents",
    "T1059": "Used PowerShell and cmd.exe extensively for Cobalt Strike beacon deployment",
    "T1547": "Established persistence via Run keys and startup folder entries for Cobalt Strike beacons",
    "T1068": "Exploited PrintNightmare and ZeroLogon for rapid privilege escalation",
    "T1003": "Ran Mimikatz and used DCSync to harvest domain admin credentials",
    "T1021": "Used PsExec and SMB admin shares for network-wide ransomware deployment",
    "T1486": "Deployed Conti ransomware using group policy, encrypting systems and demanding multi-million dollar ransoms",
  },
  "APT28 / Fancy Bear": {
    "T1598": "Conducted credential phishing campaigns spoofing government and military organizations",
    "T1566": "Sent spearphishing emails with weaponized documents exploiting Office vulnerabilities",
    "T1059": "Deployed X-Agent and X-Tunnel implants executed via PowerShell and command shell",
    "T1055": "Injected code into legitimate browser and system processes to evade endpoint detection",
    "T1003": "Harvested credentials from browsers, mail clients, and LSASS using custom tools",
    "T1558": "Used Kerberoasting and forged tickets to move through Active Directory environments",
    "T1550": "Leveraged stolen Kerberos tickets and NTLM hashes for pass-the-hash/ticket attacks",
    "T1114": "Targeted email servers and OWA to exfiltrate sensitive diplomatic communications",
  },
  "LockBit 3.0": {
    "T1595": "Scanned for exposed RDP, VPN, and web application ports to identify entry points",
    "T1190": "Exploited public-facing Fortinet, Citrix, and Exchange vulnerabilities for initial access",
    "T1059": "Used PowerShell and batch scripts for automated reconnaissance and tool deployment",
    "T1136": "Created new local admin accounts for persistent backup access across hosts",
    "T1548": "Bypassed UAC using known DLL side-loading techniques to gain elevated execution",
    "T1562": "Disabled Windows Defender and other AV products using GMER and Process Hacker",
    "T1003": "Dumped LSASS memory and SAM database to collect domain credentials",
    "T1486": "Deployed LockBit 3.0 ransomware via GPO with automated encryption and ransom note delivery",
  },
  "Lazarus Group": {
    "T1586": "Compromised legitimate accounts and created fake recruiter personas for social engineering",
    "T1078": "Used stolen credentials from supply-chain compromises to access target networks",
    "T1059": "Deployed custom backdoors (BLINDINGCAN, HOPLIGHT) executed via command interpreters",
    "T1546": "Established event-triggered persistence through WMI subscriptions and registry modifications",
    "T1134": "Manipulated access tokens to impersonate higher-privileged accounts",
    "T1055": "Injected custom malware into legitimate processes for defense evasion",
    "T1003": "Extracted credentials using custom tools and Mimikatz for domain escalation",
    "T1048": "Exfiltrated stolen cryptocurrency and data over custom encrypted protocols",
  },
  "FIN7": {
    "T1598": "Conducted reconnaissance phishing impersonating SEC filings and hospitality vendors",
    "T1566": "Sent tailored phishing emails with malicious documents targeting restaurant and retail chains",
    "T1204": "Used convincing social engineering to get targets to open weaponized documents",
    "T1059": "Deployed CARBANAK and Cobalt Strike payloads via JavaScript and PowerShell",
    "T1547": "Persisted through Registry Run keys and scheduled tasks for CARBANAK backdoor",
    "T1027": "Heavily obfuscated JavaScript and PowerShell scripts using custom encoding",
    "T1003": "Extracted payment card data and credentials from POS systems and memory",
    "T1021": "Moved laterally using stolen credentials to access additional POS terminals",
  },
  "Volt Typhoon": {
    "T1190": "Exploited Fortinet FortiGuard and Zoho ManageEngine vulnerabilities for initial access",
    "T1059": "Relied heavily on living-off-the-land binaries (LOLBins) — cmd, PowerShell, wmic, ntdsutil",
    "T1543": "Created Windows services for persistence using native tools to avoid file-based detection",
    "T1548": "Abused elevation mechanisms to run tools with SYSTEM-level privileges",
    "T1070": "Carefully cleaned logs and evidence using wevtutil and other native utilities",
    "T1003": "Used ntdsutil and volume shadow copies to extract Active Directory credentials",
    "T1082": "Performed extensive system and network enumeration using only built-in Windows tools",
    "T1572": "Tunneled C2 traffic through compromised SOHO routers and legitimate network devices",
  },
  "BlackCat / ALPHV": {
    "T1078": "Gained initial access using compromised VPN credentials often purchased from access brokers",
    "T1047": "Used WMI for remote command execution and lateral movement across the network",
    "T1543": "Modified system services to load the Rust-based ransomware payload at boot",
    "T1068": "Exploited privilege escalation vulnerabilities to gain domain-level access",
    "T1562": "Used custom tools to disable endpoint protection and delete volume shadow copies",
    "T1110": "Conducted password spraying against internal services after initial foothold",
    "T1046": "Scanned internal networks to map targets for ransomware deployment",
    "T1486": "Deployed cross-platform Rust-based ransomware with configurable encryption and data leak threats",
  },
};

// F2: Technique Platforms (Built-in Dataset)
const ALL_PLATFORMS = ["Windows", "Linux", "macOS", "Cloud", "Network", "SaaS"];
const TECHNIQUE_PLATFORMS = {
  "T1595": ["Windows", "Linux", "macOS", "Cloud", "Network"],
  "T1598": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1592": ["Windows", "Linux", "macOS"],
  "T1583": ["Windows", "Linux", "macOS", "Cloud"],
  "T1588": ["Windows", "Linux", "macOS"],
  "T1586": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1566": ["Windows", "Linux", "macOS", "SaaS"],
  "T1190": ["Windows", "Linux", "macOS", "Cloud", "Network"],
  "T1078": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1199": ["Windows", "Linux", "macOS", "Cloud"],
  "T1059": ["Windows", "Linux", "macOS"],
  "T1204": ["Windows", "Linux", "macOS"],
  "T1047": ["Windows"],
  "T1053": ["Windows", "Linux", "macOS"],
  "T1547": ["Windows", "Linux", "macOS"],
  "T1136": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1543": ["Windows", "Linux", "macOS"],
  "T1546": ["Windows", "Linux", "macOS"],
  "T1068": ["Windows", "Linux", "macOS"],
  "T1548": ["Windows", "Linux", "macOS"],
  "T1134": ["Windows"],
  "T1027": ["Windows", "Linux", "macOS"],
  "T1055": ["Windows", "Linux", "macOS"],
  "T1562": ["Windows", "Linux", "macOS", "Cloud"],
  "T1070": ["Windows", "Linux", "macOS", "Network"],
  "T1003": ["Windows", "Linux", "macOS"],
  "T1110": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1557": ["Windows", "Linux", "macOS", "Network"],
  "T1558": ["Windows"],
  "T1087": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1082": ["Windows", "Linux", "macOS"],
  "T1046": ["Windows", "Linux", "macOS", "Network"],
  "T1069": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1021": ["Windows", "Linux", "macOS"],
  "T1570": ["Windows", "Linux", "macOS"],
  "T1550": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1560": ["Windows", "Linux", "macOS"],
  "T1005": ["Windows", "Linux", "macOS"],
  "T1114": ["Windows", "Cloud", "SaaS"],
  "T1071": ["Windows", "Linux", "macOS", "Network"],
  "T1105": ["Windows", "Linux", "macOS"],
  "T1572": ["Windows", "Linux", "macOS", "Network"],
  "T1041": ["Windows", "Linux", "macOS"],
  "T1048": ["Windows", "Linux", "macOS", "Network"],
  "T1486": ["Windows", "Linux", "macOS"],
  "T1489": ["Windows", "Linux", "macOS"],
  "T1529": ["Windows", "Linux", "macOS"],
  "T1485": ["Windows", "Linux", "macOS"],
};

// F3: MITRE Mitigations (Built-in Dataset)
const TECHNIQUE_MITIGATIONS = {
  "T1595": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1598": [{ mitreId: "M1054", name: "Software Configuration" }, { mitreId: "M1017", name: "User Training" }],
  "T1592": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1583": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1588": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1586": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1566": [{ mitreId: "M1049", name: "Antivirus/Antimalware" }, { mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1054", name: "Software Configuration" }, { mitreId: "M1017", name: "User Training" }],
  "T1190": [{ mitreId: "M1048", name: "Application Isolation and Sandboxing" }, { mitreId: "M1050", name: "Exploit Protection" }, { mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1051", name: "Update Software" }, { mitreId: "M1016", name: "Vulnerability Scanning" }],
  "T1078": [{ mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1027", name: "Password Policies" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1199": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1032", name: "Multi-factor Authentication" }],
  "T1059": [{ mitreId: "M1049", name: "Antivirus/Antimalware" }, { mitreId: "M1038", name: "Execution Prevention" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1204": [{ mitreId: "M1038", name: "Execution Prevention" }, { mitreId: "M1017", name: "User Training" }],
  "T1047": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1038", name: "Execution Prevention" }],
  "T1053": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1028", name: "Operating System Configuration" }],
  "T1547": [{ mitreId: "M1038", name: "Execution Prevention" }],
  "T1136": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1543": [{ mitreId: "M1047", name: "Audit" }, { mitreId: "M1033", name: "Limit Software Installation" }],
  "T1546": [{ mitreId: "M1038", name: "Execution Prevention" }],
  "T1068": [{ mitreId: "M1048", name: "Application Isolation and Sandboxing" }, { mitreId: "M1050", name: "Exploit Protection" }, { mitreId: "M1051", name: "Update Software" }],
  "T1548": [{ mitreId: "M1047", name: "Audit" }, { mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1028", name: "Operating System Configuration" }],
  "T1134": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1018", name: "User Account Management" }],
  "T1027": [{ mitreId: "M1049", name: "Antivirus/Antimalware" }],
  "T1055": [{ mitreId: "M1040", name: "Behavior Prevention on Endpoint" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1562": [{ mitreId: "M1022", name: "Restrict File and Directory Permissions" }, { mitreId: "M1024", name: "Restrict Registry Permissions" }, { mitreId: "M1018", name: "User Account Management" }],
  "T1070": [{ mitreId: "M1029", name: "Remote Data Storage" }, { mitreId: "M1022", name: "Restrict File and Directory Permissions" }],
  "T1003": [{ mitreId: "M1040", name: "Behavior Prevention on Endpoint" }, { mitreId: "M1043", name: "Credential Access Protection" }, { mitreId: "M1027", name: "Password Policies" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1110": [{ mitreId: "M1036", name: "Account Use Policies" }, { mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1027", name: "Password Policies" }],
  "T1557": [{ mitreId: "M1041", name: "Encrypt Sensitive Information" }, { mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1035", name: "Limit Access to Resource Over Network" }],
  "T1558": [{ mitreId: "M1027", name: "Password Policies" }, { mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1041", name: "Encrypt Sensitive Information" }],
  "T1087": [{ mitreId: "M1028", name: "Operating System Configuration" }],
  "T1082": [],
  "T1046": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1031", name: "Network Intrusion Prevention" }],
  "T1069": [],
  "T1021": [{ mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1035", name: "Limit Access to Resource Over Network" }],
  "T1570": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1037", name: "Filter Network Traffic" }],
  "T1550": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1018", name: "User Account Management" }],
  "T1560": [{ mitreId: "M1047", name: "Audit" }],
  "T1005": [{ mitreId: "M1057", name: "Data Loss Prevention" }],
  "T1114": [{ mitreId: "M1041", name: "Encrypt Sensitive Information" }, { mitreId: "M1032", name: "Multi-factor Authentication" }],
  "T1071": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1030", name: "Network Segmentation" }],
  "T1105": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }],
  "T1572": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1037", name: "Filter Network Traffic" }],
  "T1041": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1057", name: "Data Loss Prevention" }],
  "T1048": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1057", name: "Data Loss Prevention" }, { mitreId: "M1037", name: "Filter Network Traffic" }],
  "T1486": [{ mitreId: "M1053", name: "Data Backup" }, { mitreId: "M1040", name: "Behavior Prevention on Endpoint" }],
  "T1489": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1022", name: "Restrict File and Directory Permissions" }],
  "T1529": [],
  "T1485": [{ mitreId: "M1053", name: "Data Backup" }],
};

// F3: Maps MITRE mitigation names → our SECURITY_CONTROLS IDs
const MITIGATION_CONTROL_MAP = {
  "Multi-factor Authentication": "mfa",
  "Network Segmentation": "seg",
  "Privileged Account Management": "pam",
  "Update Software": "patch",
  "Vulnerability Scanning": "vuln-scan",
  "User Training": "training",
  "Network Intrusion Prevention": "ids",
  "Data Loss Prevention": "dlp",
  "Data Backup": "backup",
  "Antivirus/Antimalware": "edr",
  "Application Isolation and Sandboxing": "sandbox",
  "Behavior Prevention on Endpoint": "edr",
  "Execution Prevention": "app-wl",
  "Encrypt Sensitive Information": "tls-inspect",
  "Filter Network Traffic": "dns-filter",
  "Exploit Protection": "edr",
  "Credential Access Protection": "secrets",
  "Password Policies": "ad-harden",
  "User Account Management": "identity-gov",
  "Restrict File and Directory Permissions": "least-priv",
  "Account Use Policies": "access-review",
  "Audit": "log-mgmt",
  "Operating System Configuration": "secure-build",
  "Remote Data Storage": "backup",
  "Limit Access to Resource Over Network": "ztna",
  "Limit Software Installation": "app-wl",
  "Restrict Registry Permissions": "least-priv",
};

// F7: Threat Actor Profiles (Built-in Dataset)
const CHAIN_PROFILES = {
  "APT29 / Cozy Bear": {
    country: "Russia (SVR)", aliases: ["Cozy Bear", "The Dukes", "Nobelium", "Midnight Blizzard"],
    firstSeen: "2008", lastSeen: "2024", sectors: ["Government", "Diplomacy", "Think Tanks", "Healthcare", "Technology"],
    description: "Russian Foreign Intelligence Service (SVR) unit specializing in long-term espionage operations against Western governments and organizations. Known for the SolarWinds supply chain attack (2020) and numerous diplomatic espionage campaigns.",
  },
  "Conti Ransomware": {
    country: "Russia", aliases: ["Wizard Spider", "Gold Blackburn"],
    firstSeen: "2020", lastSeen: "2022", sectors: ["Healthcare", "Government", "Manufacturing", "All"],
    description: "One of the most prolific ransomware-as-a-service operations. Caused an estimated $180M+ in damages. Disbanded after internal leaks in 2022, with members splintering into Royal, Black Basta, and other groups.",
  },
  "APT28 / Fancy Bear": {
    country: "Russia (GRU)", aliases: ["Fancy Bear", "Sofacy", "Strontium", "Forest Blizzard"],
    firstSeen: "2004", lastSeen: "2024", sectors: ["Government", "Military", "Defense", "Journalism", "Political Organizations"],
    description: "Russian GRU Unit 26165 cyber-espionage group. Responsible for the 2016 DNC hack, attacks on the German Bundestag, and campaigns against NATO and Olympic organizations.",
  },
  "LockBit 3.0": {
    country: "Russia / Global Affiliates", aliases: ["LockBit Black", "LockBit Gang"],
    firstSeen: "2019", lastSeen: "2024", sectors: ["Manufacturing", "Healthcare", "Financial", "Government", "All"],
    description: "Most active ransomware-as-a-service operation globally. Uses an affiliate model with an automated attack platform. Law enforcement disrupted infrastructure in Feb 2024 (Operation Cronos).",
  },
  "Lazarus Group": {
    country: "North Korea (DPRK)", aliases: ["Hidden Cobra", "Zinc", "Diamond Sleet"],
    firstSeen: "2009", lastSeen: "2024", sectors: ["Financial", "Cryptocurrency", "Defense", "Entertainment"],
    description: "DPRK-linked group responsible for the Sony Pictures hack (2014), Bangladesh Bank heist (2016), WannaCry (2017), and over $1.5B in cryptocurrency thefts. Motivated by both espionage and revenue generation.",
  },
  "FIN7": {
    country: "Russia / Ukraine", aliases: ["Carbanak", "Navigator", "Sangria Tempest"],
    firstSeen: "2013", lastSeen: "2024", sectors: ["Retail", "Hospitality", "Restaurant", "Financial"],
    description: "Financially motivated group that has stolen over $1B from hundreds of companies. Known for sophisticated social engineering and custom malware targeting point-of-sale systems. Multiple members arrested 2018-2023.",
  },
  "Volt Typhoon": {
    country: "China (PRC)", aliases: ["Bronze Silhouette", "Vanguard Panda"],
    firstSeen: "2021", lastSeen: "2024", sectors: ["Critical Infrastructure", "Government", "Telecommunications", "Energy"],
    description: "Chinese state-sponsored group focused on pre-positioning in US critical infrastructure. Relies almost exclusively on living-off-the-land techniques to avoid detection. Targeted Guam and US communications sectors.",
  },
  "BlackCat / ALPHV": {
    country: "Russia / Global Affiliates", aliases: ["ALPHV", "Noberus"],
    firstSeen: "2021", lastSeen: "2024", sectors: ["Healthcare", "Financial", "Legal", "Technology", "All"],
    description: "First ransomware written in Rust for cross-platform targeting. Employed triple extortion (encryption + data leak + DDoS). Notable attacks on MGM Resorts and Change Healthcare. Seized by FBI Dec 2023, briefly resurfaced.",
  },
};

// ─── IndexedDB STIX Cache ─────────────────────────────────────────────────────

function openStixCache() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("attack-stix-cache", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("bundles");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getCachedStix(version) {
  return openStixCache().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction("bundles", "readonly");
    const req = tx.objectStore("bundles").get(version);
    req.onsuccess = () => {
      const entry = req.result;
      if (!entry) return resolve(null);
      if (Date.now() - entry.timestamp > 7 * 24 * 60 * 60 * 1000) return resolve(null);
      resolve(entry.data);
    };
    req.onerror = () => reject(req.error);
  }));
}

function setCachedStix(version, data) {
  return openStixCache().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction("bundles", "readwrite");
    tx.objectStore("bundles").put({ data, timestamp: Date.now() }, version);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

// ─── STIX Data Loader ─────────────────────────────────────────────────────────

function parseStixBundle(bundle) {
  if (!bundle || !bundle.objects) throw new Error("Invalid STIX bundle: missing objects array");

  const techniques = [];
  const techById = {};
  const techniqueDescriptions = {};
  const techniquePlatforms = {};  // F2: platform extraction
  const stixObjById = {};  // for F3 mitigation lookup
  bundle.objects.forEach(o => {
    if (o.type === "course-of-action" && !o.revoked) stixObjById[o.id] = o;  // F3
    if (o.type !== "attack-pattern") return;
    if (o.revoked || o.x_mitre_deprecated) return;
    const extRefs = o.external_references || [];
    const mitreRef = extRefs.find(r => r.source_name === "mitre-attack");
    if (!mitreRef || !mitreRef.external_id) return;
    const techId = mitreRef.external_id;
    const parentId = techId.includes(".") ? techId.split(".")[0] : null;
    const phases = o.kill_chain_phases || [];
    const phase = phases.find(p => p.kill_chain_name === "mitre-attack");
    if (!phase) return;
    const tacticId = STIX_TACTIC_MAP[phase.phase_name];
    if (!tacticId) return;
    techniques.push({ id: techId, name: o.name, tactic: tacticId, baseCriticality: 0.5, parentId });
    techById[o.id] = techId;
    stixObjById[o.id] = o;
    // F2: extract platforms, normalize cloud variants to "Cloud"
    if (o.x_mitre_platforms && o.x_mitre_platforms.length > 0) {
      const cloudNames = new Set(["IaaS", "Azure AD", "Office 365", "Google Workspace", "SaaS"]);
      const normalized = [...new Set(o.x_mitre_platforms.map(p => cloudNames.has(p) ? (p === "SaaS" ? "SaaS" : "Cloud") : p))];
      techniquePlatforms[techId] = normalized;
    }
    if (o.description) {
      const cleaned = o.description.replace(/\(Citation:[^)]+\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      techniqueDescriptions[techId] = cleaned;
    }
  });

  if (techniques.length === 0) throw new Error("No valid techniques found in STIX bundle");

  const groupTechniques = {};
  const groupNames = {};
  const groupProfiles = {};  // F7: threat actor profiles
  bundle.objects.forEach(o => {
    if (o.type === "intrusion-set" && !o.revoked) {
      groupNames[o.id] = o.name;
      // F7: extract profile metadata
      groupProfiles[o.name] = {
        country: "", aliases: o.aliases || [],
        firstSeen: o.first_seen ? o.first_seen.slice(0, 4) : "",
        lastSeen: o.last_seen ? o.last_seen.slice(0, 4) : "",
        sectors: [], // STIX doesn't always have sector info
        description: o.description ? o.description.replace(/\(Citation:[^)]+\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim().slice(0, 300) : "",
      };
    }
  });
  const chainTechContext = {};
  bundle.objects.forEach(o => {
    if (o.type !== "relationship" || o.relationship_type !== "uses") return;
    if (o.revoked) return;
    if (!groupNames[o.source_ref] || !techById[o.target_ref]) return;
    if (!groupTechniques[o.source_ref]) groupTechniques[o.source_ref] = [];
    groupTechniques[o.source_ref].push(techById[o.target_ref]);
    if (o.description) {
      const gn = groupNames[o.source_ref];
      const tid = techById[o.target_ref];
      if (!chainTechContext[gn]) chainTechContext[gn] = {};
      const cleaned = o.description.replace(/\(Citation:[^)]+\)/g, '').trim();
      chainTechContext[gn][tid] = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
  });

  // F3: Parse mitigations from course-of-action + mitigates relationships
  const mitigationMap = {};
  bundle.objects.forEach(o => {
    if (o.type !== "relationship" || o.relationship_type !== "mitigates") return;
    if (o.revoked) return;
    const coaObj = stixObjById[o.source_ref];
    const techStixId = techById[o.target_ref];
    if (!coaObj || !techStixId) return;
    const coaRefs = coaObj.external_references || [];
    const coaMitre = coaRefs.find(r => r.source_name === "mitre-attack");
    if (!mitigationMap[techStixId]) mitigationMap[techStixId] = [];
    mitigationMap[techStixId].push({
      mitreId: coaMitre?.external_id || coaObj.id,
      name: coaObj.name,
    });
  });

  const usageCount = {};
  techniques.forEach(t => { usageCount[t.id] = 0; });
  Object.values(groupTechniques).forEach(techs => {
    techs.forEach(tid => { if (usageCount[tid] !== undefined) usageCount[tid]++; });
  });
  const maxUsage = Math.max(...Object.values(usageCount), 1);
  techniques.forEach(t => {
    t.baseCriticality = Math.max(0.1, (usageCount[t.id] || 0) / maxUsage);
  });

  const techPhase = {};
  techniques.forEach(t => { techPhase[t.id] = TACTIC_PHASE[t.tactic] ?? 99; });
  const techSet = new Set(techniques.map(t => t.id));
  const chains = [];
  Object.entries(groupTechniques).forEach(([groupId, techs]) => {
    const uniqueTechs = [...new Set(techs)].filter(t => techSet.has(t));
    const sorted = uniqueTechs.sort((a, b) => (techPhase[a] ?? 99) - (techPhase[b] ?? 99));
    const phases = new Set(sorted.map(t => techPhase[t]));
    if (sorted.length >= 4 && phases.size >= 3) {
      const sev = Math.min(1, sorted.length / 15 + phases.size / 12);
      chains.push({
        name: groupNames[groupId] || groupId,
        description: "Threat actor with " + sorted.length + " techniques across " + phases.size + " phases",
        sector: "all",
        path: sorted,
        severity: Math.round(sev * 100) / 100,
      });
    }
  });

  const edgeSet = new Set();
  const edges = [];
  chains.forEach(chain => {
    for (let i = 0; i < chain.path.length - 1; i++) {
      const key = chain.path[i] + "->" + chain.path[i + 1];
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ from: chain.path[i], to: chain.path[i + 1] });
      }
    }
  });

  return { techniques, edges, chains, techniqueDescriptions, chainTechContext, techniquePlatforms, mitigations: mitigationMap, groupProfiles };
}

async function loadStixData() {
  const version = "enterprise-attack-v5";
  const cached = await getCachedStix(version).catch(() => null);
  if (cached) return cached;

  const resp = await fetch("https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json");
  if (!resp.ok) throw new Error("Failed to fetch STIX data: " + resp.status);
  const bundle = await resp.json();

  const result = parseStixBundle(bundle);
  await setCachedStix(version, result).catch(() => {});
  return result;
}

// ─── Graph Algorithms ─────────────────────────────────────────────────────────

function computeBetweenness(techniques, edges) {
  const counts = {};
  techniques.forEach(t => counts[t.id] = 0);

  const adj = {};
  techniques.forEach(t => adj[t.id] = []);
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });

  const ids = techniques.map(t => t.id);
  for (let s = 0; s < ids.length; s++) {
    const dist = {};
    const sigma = {};
    const pred = {};
    ids.forEach(id => { dist[id] = -1; sigma[id] = 0; pred[id] = []; });
    dist[ids[s]] = 0;
    sigma[ids[s]] = 1;
    const queue = [ids[s]];
    const stack = [];
    let qi = 0;
    while (qi < queue.length) {
      const v = queue[qi++];
      stack.push(v);
      (adj[v] || []).forEach(w => {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      });
    }
    const delta = {};
    ids.forEach(id => delta[id] = 0);
    while (stack.length > 0) {
      const w = stack.pop();
      pred[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== ids[s]) counts[w] += delta[w];
    }
  }

  const maxVal = Math.max(...Object.values(counts), 1);
  const result = {};
  Object.keys(counts).forEach(k => result[k] = counts[k] / maxVal);
  return result;
}

function computeChainCoverage(techniques, chains) {
  const coverage = {};
  techniques.forEach(t => {
    coverage[t.id] = chains.filter(c => c.path.includes(t.id)).length;
  });
  return coverage;
}

function findOptimalRemediation(techniques, chains, exposures, budget, phaseWeighting) {
  const remaining = new Set(chains.map((_, i) => i));
  const selected = [];
  const costPerTech = 1;

  for (let step = 0; step < budget && remaining.size > 0; step++) {
    let bestTech = null;
    let bestScore = -1;

    techniques.forEach(t => {
      if (selected.includes(t.id)) return;
      const exposure = exposures[t.id] ?? 1.0;
      if (exposure < 0.1) return;

      let chainsCovered = 0;
      let severitySum = 0;
      chains.forEach((c, i) => {
        if (remaining.has(i) && c.path.includes(t.id)) {
          chainsCovered++;
          severitySum += c.severity;
        }
      });

      let score = chainsCovered > 0
        ? (chainsCovered * (severitySum / chainsCovered) * exposure) / costPerTech
        : 0;
      // F4: Apply phase weight when enabled
      if (phaseWeighting && score > 0) {
        const pw = PHASE_WEIGHTS[TACTIC_PHASE[t.tactic]] ?? 1.0;
        score *= pw;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTech = t.id;
      }
    });

    if (bestTech) {
      selected.push(bestTech);
      chains.forEach((c, i) => {
        if (c.path.includes(bestTech)) remaining.delete(i);
      });
    }
  }

  return { selected, chainsDisrupted: chains.length - remaining.size, chainsTotal: chains.length };
}

// ─── SVG Graph Renderer ───────────────────────────────────────────────────────

function layoutNodes(techniques) {
  // Node max visual radius: base 8 + priority*10 (max 18) + optimal ring 7 = 25
  // Two adjacent max-size nodes need 50 between centers
  // nodeW/nodeH: intra-cluster spacing; tacticGap/phaseGap: inter-cluster spacing
  const nodeW = 52, nodeH = 48, phaseGap = 64, tacticGap = 52, topMargin = 34, marginX = 40;

  // Group techniques by tactic, preserving TACTICS ordering (which is phase-sorted)
  const tacticOrder = TACTICS.filter(tac => techniques.some(t => t.tactic === tac.id));
  const byTactic = {};
  tacticOrder.forEach(tac => {
    byTactic[tac.id] = techniques.filter(t => t.tactic === tac.id);
  });

  function colsForCount(n) {
    if (n <= 5) return 1;
    if (n <= 12) return 2;
    if (n <= 20) return 3;
    if (n <= 30) return 4;
    if (n <= 42) return 5;
    if (n <= 56) return 6;
    if (n <= 72) return 7;
    if (n <= 90) return 8;
    if (n <= 110) return 9;
    return 10;
  }

  // Compute cluster dimensions per tactic
  const clusterInfo = {};
  let totalClusterWidth = 0;
  let maxClusterHeight = 0;
  let totalGaps = 0;
  tacticOrder.forEach((tac, ti) => {
    const techs = byTactic[tac.id] || [];
    const n = techs.length;
    const cols = colsForCount(n);
    const rows = Math.ceil(n / cols);
    const w = (cols - 1) * nodeW;
    const h = (rows - 1) * nodeH;
    clusterInfo[tac.id] = { techs, cols, rows, w, h, phase: tac.phase };
    totalClusterWidth += w;
    if (h > maxClusterHeight) maxClusterHeight = h;
    // Count gaps: larger gap between phases, smaller within same phase
    if (ti > 0) {
      const prevPhase = tacticOrder[ti - 1].phase;
      totalGaps += tac.phase !== prevPhase ? phaseGap : tacticGap;
    }
  });

  const totalNeeded = totalClusterWidth + totalGaps + marginX * 2;
  const viewWidth = Math.max(1000, totalNeeded);
  const extraSpace = viewWidth - totalNeeded;
  const gapCount = tacticOrder.length > 1 ? tacticOrder.length - 1 : 1;
  const extraPerGap = extraSpace / gapCount;
  const viewHeight = Math.max(420, maxClusterHeight + topMargin + 60);
  const centerY = topMargin + (viewHeight - topMargin) / 2;

  const positions = {};
  const phaseCenters = []; // array of { x, label, color }
  let curX = marginX;
  tacticOrder.forEach((tac, ti) => {
    const info = clusterInfo[tac.id];
    const cx = curX + info.w / 2;
    phaseCenters.push({ x: cx, label: tac.name, color: tac.color, tacticId: tac.id });
    info.techs.forEach((t, i) => {
      const col = i % info.cols;
      const row = Math.floor(i / info.cols);
      const x = cx + (col - (info.cols - 1) / 2) * nodeW;
      const y = centerY + (row - (info.rows - 1) / 2) * nodeH;
      positions[t.id] = { x, y };
    });
    if (ti < tacticOrder.length - 1) {
      const nextPhase = tacticOrder[ti + 1].phase;
      const gap = tac.phase !== nextPhase ? phaseGap : tacticGap;
      curX += info.w + gap + extraPerGap;
    }
  });

  return { positions, viewHeight, viewWidth, phaseCenters };
}

// ─── Components ───────────────────────────────────────────────────────────────

function ZoomButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28, background: "#1e293b", color: "#94a3b8",
      border: "1px solid #334155", borderRadius: 4, cursor: "pointer",
      fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1,
    }}>{label}</button>
  );
}

function GraphView({ techniques, edges, positions, exposures, betweenness, chainCoverage,
  selectedTech, onSelectTech, highlightedChains, remediated, optimalSet,
  viewHeight, viewWidth, phaseCenters, onNodeDrag, searchMatches,
  collapsedTactics, onToggleCollapse, chainBuilderMode, chainBuilderPath, onChainBuilderClick,
  isolateChain, gapNodes, techDescriptions }) {

  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [tooltipExpanded, setTooltipExpanded] = useState(false);
  const tooltipHideTimeout = useRef(null);
  const tooltipHoveredRef = useRef(false);
  const clearTooltip = useCallback(() => {
    tooltipHideTimeout.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) {
        setHoveredNode(null); setTooltipPos(null); setTooltipExpanded(false);
      }
    }, 120);
  }, []);
  const isPanning = useRef(false);
  const didDrag = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Node dragging state
  const dragNodeRef = useRef(null);
  const dragDidMove = useRef(false);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const viewHeightRef = useRef(viewHeight);
  viewHeightRef.current = viewHeight;
  const viewWidthRef = useRef(viewWidth || 1000);
  viewWidthRef.current = viewWidth || 1000;
  const onNodeDragRef = useRef(onNodeDrag);
  onNodeDragRef.current = onNodeDrag;
  const onSelectTechRef = useRef(onSelectTech);
  onSelectTechRef.current = onSelectTech;
  const chainBuilderModeRef = useRef(chainBuilderMode);
  chainBuilderModeRef.current = chainBuilderMode;
  const onChainBuilderClickRef = useRef(onChainBuilderClick);
  onChainBuilderClickRef.current = onChainBuilderClick;

  const vh = viewHeight || 420;
  const vw = viewWidth || 1000;

  // Multi-chain computation: per-chain projected paths, edges, nodes, colors
  const displayTechSet = useMemo(() => new Set(techniques.map(t => t.id)), [techniques]);

  const chainComputations = useMemo(() => {
    return highlightedChains.map((chain, colorIndex) => {
      const projected = [];
      for (const tid of chain.path) {
        let mapped = tid;
        if (!displayTechSet.has(tid)) {
          const parentId = tid.includes('.') ? tid.split('.')[0] : null;
          if (parentId && displayTechSet.has(parentId)) {
            mapped = parentId;
          } else {
            continue;
          }
        }
        if (projected.length === 0 || projected[projected.length - 1] !== mapped) {
          projected.push(mapped);
        }
      }
      const edgesSet = new Set();
      for (let i = 0; i < projected.length - 1; i++) {
        edgesSet.add(projected[i] + "->" + projected[i + 1]);
      }
      return { chain, colorIndex, projected, edges: edgesSet, nodes: new Set(projected), color: CHAIN_COLORS[colorIndex].color };
    });
  }, [highlightedChains, displayTechSet]);

  const anyChainNode = useMemo(() => {
    const s = new Set();
    chainComputations.forEach(c => c.nodes.forEach(n => s.add(n)));
    return s;
  }, [chainComputations]);

  const anyChainEdge = useMemo(() => {
    const s = new Set();
    chainComputations.forEach(c => c.edges.forEach(e => s.add(e)));
    return s;
  }, [chainComputations]);

  const nodeChainMap = useMemo(() => {
    const m = {};
    chainComputations.forEach(c => {
      c.nodes.forEach(n => {
        if (!m[n]) m[n] = [];
        m[n].push(c.colorIndex);
      });
    });
    return m;
  }, [chainComputations]);

  const edgeChainMap = useMemo(() => {
    const m = {};
    chainComputations.forEach(c => {
      c.edges.forEach(e => {
        if (!m[e]) m[e] = [];
        m[e].push(c.colorIndex);
      });
    });
    return m;
  }, [chainComputations]);

  // Collapse support: maps and memos
  const techTacticMap = useMemo(() => {
    const m = {};
    techniques.forEach(t => { m[t.id] = t.tactic; });
    return m;
  }, [techniques]);

  const collapsedSummary = useMemo(() => {
    if (!collapsedTactics || collapsedTactics.size === 0) return {};
    const summary = {};
    collapsedTactics.forEach(tacId => {
      const tacTechs = techniques.filter(t => t.tactic === tacId);
      if (tacTechs.length === 0) return;
      let sx = 0, sy = 0, count = 0;
      tacTechs.forEach(t => {
        const p = positions[t.id];
        if (p) { sx += p.x; sy += p.y; count++; }
      });
      if (count > 0) summary[tacId] = { x: sx / count, y: sy / count, count };
    });
    return summary;
  }, [collapsedTactics, techniques, positions]);

  const processedEdges = useMemo(() => {
    if (!collapsedTactics || collapsedTactics.size === 0) return edges;
    const seen = new Set();
    return edges.filter(e => {
      const fromTac = techTacticMap[e.from];
      const toTac = techTacticMap[e.to];
      const fromCol = fromTac && collapsedTactics.has(fromTac);
      const toCol = toTac && collapsedTactics.has(toTac);
      if (fromCol && toCol && fromTac === toTac) return false;
      const fk = fromCol ? "~" + fromTac : e.from;
      const tk = toCol ? "~" + toTac : e.to;
      const key = fk + ">" + tk;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [edges, collapsedTactics, techTacticMap]);

  const getNodePos = useCallback((techId) => {
    const tac = techTacticMap[techId];
    if (tac && collapsedTactics && collapsedTactics.has(tac) && collapsedSummary[tac]) {
      return collapsedSummary[tac];
    }
    return positions[techId];
  }, [techTacticMap, collapsedTactics, collapsedSummary, positions]);

  // Chain path edges that don't exist in the graph edge set — render explicitly
  const missingChainEdges = useMemo(() => {
    if (highlightedChains.length === 0) return [];
    const graphEdgeSet = new Set(edges.map(e => e.from + "->" + e.to));
    const missing = [];
    const seen = new Set();
    chainComputations.forEach(c => {
      for (let i = 0; i < c.projected.length - 1; i++) {
        const key = c.projected[i] + "->" + c.projected[i + 1];
        if (!graphEdgeSet.has(key) && !seen.has(key + ":" + c.colorIndex)) {
          seen.add(key + ":" + c.colorIndex);
          missing.push({ from: c.projected[i], to: c.projected[i + 1], colorIndex: c.colorIndex, color: c.color });
        }
      }
    });
    return missing;
  }, [highlightedChains, chainComputations, edges]);

  // Chain builder edges for SVG rendering
  const builderEdges = useMemo(() => {
    if (!chainBuilderMode || !chainBuilderPath || chainBuilderPath.length < 2) return [];
    const result = [];
    for (let i = 0; i < chainBuilderPath.length - 1; i++) {
      result.push({ from: chainBuilderPath[i], to: chainBuilderPath[i + 1] });
    }
    return result;
  }, [chainBuilderMode, chainBuilderPath]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * viewWidthRef.current;
      const my = (e.clientY - rect.top) / rect.height * viewHeightRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => {
        const newScale = Math.max(0.3, Math.min(8, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return {
          x: mx - (mx - prev.x) * ratio,
          y: my - (my - prev.y) * ratio,
          scale: newScale,
        };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragNodeRef.current = nodeId;
    dragDidMove.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setHoveredNode(null); setTooltipPos(null); setTooltipExpanded(false); tooltipHoveredRef.current = false;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    didDrag.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    // Node dragging takes priority
    if (dragNodeRef.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragDidMove.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (!dragDidMove.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scale = transformRef.current.scale;
      const vhCur = viewHeightRef.current;
      const svgDx = dx / rect.width * viewWidthRef.current / scale;
      const svgDy = dy / rect.height * vhCur / scale;
      if (onNodeDragRef.current) onNodeDragRef.current(dragNodeRef.current, svgDx, svgDy);
      return;
    }
    // Canvas panning
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx / rect.width * viewWidthRef.current,
      y: prev.y + dy / rect.height * viewHeightRef.current,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragNodeRef.current) {
      if (!dragDidMove.current) {
        if (chainBuilderModeRef.current && onChainBuilderClickRef.current) {
          onChainBuilderClickRef.current(dragNodeRef.current);
        } else if (onSelectTechRef.current) {
          onSelectTechRef.current(dragNodeRef.current);
        }
      }
      dragNodeRef.current = null;
      dragDidMove.current = false;
      return;
    }
    isPanning.current = false;
  }, []);

  const handleClickCapture = useCallback((e) => {
    if (didDrag.current) {
      e.stopPropagation();
      didDrag.current = false;
    }
  }, []);

  const centerY = vh / 2;
  const centerX = vw / 2;

  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.min(8, prev.scale * 1.3);
      const ratio = newScale / prev.scale;
      const cx = viewWidthRef.current / 2;
      return { x: cx - (cx - prev.x) * ratio, y: centerY - (centerY - prev.y) * ratio, scale: newScale };
    });
  }, [centerY]);

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.max(0.3, prev.scale * 0.77);
      const ratio = newScale / prev.scale;
      const cx = viewWidthRef.current / 2;
      return { x: cx - (cx - prev.x) * ratio, y: centerY - (centerY - prev.y) * ratio, scale: newScale };
    });
  }, [centerY]);

  const resetZoom = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  const zoomToFit = useCallback(() => {
    const nodeIds = Object.keys(positions);
    if (nodeIds.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodeIds.forEach(id => {
      const p = positions[id];
      if (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    });
    const pad = 50;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const bw = maxX - minX;
    const bh = maxY - minY;
    if (bw <= 0 || bh <= 0) return;
    const scale = Math.min(vw / bw, vh / bh);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setTransform({ x: vw / 2 - cx * scale, y: vh / 2 - cy * scale, scale });
  }, [positions, vw, vh]);

  const handlePopout = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true);
    const g = clone.querySelector('g');
    if (g) g.setAttribute('transform', 'translate(0,0) scale(1)');
    clone.setAttribute('style', 'width:100vw;height:100vh;background:#0a0f1a;cursor:grab;');
    const svgString = new XMLSerializer().serializeToString(clone);
    const vhNow = viewHeightRef.current;
    const vwNow = viewWidthRef.current;
    const halfVh = Math.round(vhNow / 2);
    const halfVw = Math.round(vwNow / 2);
    const scriptClose = '</' + 'script>';
    const win = window.open('', 'attack-graph-popout', 'width=1400,height=800');
    if (!win) return;
    win.document.write('<!DOCTYPE html><html><head><title>ATT&CK Graph</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0f1a;overflow:hidden}svg{width:100vw;height:100vh}' +
      '.ctrls{position:fixed;top:12px;right:12px;display:flex;flex-direction:column;gap:4px;z-index:10}' +
      '.ctrls button{width:32px;height:32px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:4px;cursor:pointer;font-size:16px;font-family:"JetBrains Mono",monospace}' +
      '.ctrls button:hover{background:#334155}' +
      '.zlvl{position:fixed;bottom:12px;right:12px;font-size:10px;color:#64748b;font-family:"JetBrains Mono",monospace;background:rgba(10,15,26,0.8);padding:2px 8px;border-radius:3px}</style></head><body>' +
      '<div class="ctrls"><button id="zi">+</button><button id="zo">\u2212</button><button id="zr">\u21BA</button></div>' +
      '<div class="zlvl" id="zl">100%</div>' + svgString +
      '<script>' +
      'var svg=document.querySelector("svg"),g=svg.querySelector("g"),tx=0,ty=0,sc=1,ip=false,lx=0,ly=0;' +
      'function upd(){g.setAttribute("transform","translate("+tx+","+ty+") scale("+sc+")");document.getElementById("zl").textContent=(sc*100).toFixed(0)+"%"}' +
      'svg.addEventListener("wheel",function(e){e.preventDefault();var r=svg.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*' + vwNow + ',' +
      'my=(e.clientY-r.top)/r.height*' + vhNow + ',f=e.deltaY>0?0.9:1.1,ns=Math.max(0.1,Math.min(20,sc*f)),rt=ns/sc;' +
      'tx=mx-(mx-tx)*rt;ty=my-(my-ty)*rt;sc=ns;upd()},{passive:false});' +
      'svg.addEventListener("mousedown",function(e){ip=true;lx=e.clientX;ly=e.clientY;svg.style.cursor="grabbing"});' +
      'window.addEventListener("mousemove",function(e){if(!ip)return;var r=svg.getBoundingClientRect();' +
      'tx+=(e.clientX-lx)/r.width*' + vwNow + ';ty+=(e.clientY-ly)/r.height*' + vhNow + ';lx=e.clientX;ly=e.clientY;upd()});' +
      'window.addEventListener("mouseup",function(){ip=false;svg.style.cursor="grab"});' +
      'document.getElementById("zi").onclick=function(){var ns=Math.min(20,sc*1.3),rt=ns/sc;tx=' + halfVw + '-(' + halfVw + '-tx)*rt;ty=' + halfVh + '-(' + halfVh + '-ty)*rt;sc=ns;upd()};' +
      'document.getElementById("zo").onclick=function(){var ns=Math.max(0.1,sc*0.77),rt=ns/sc;tx=' + halfVw + '-(' + halfVw + '-tx)*rt;ty=' + halfVh + '-(' + halfVh + '-ty)*rt;sc=ns;upd()};' +
      'document.getElementById("zr").onclick=function(){tx=0;ty=0;sc=1;upd()};' +
      scriptClose + '</body></html>');
    win.document.close();
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 4, zIndex: 10 }}>
        <ZoomButton label="+" onClick={zoomIn} />
        <ZoomButton label={"\u2212"} onClick={zoomOut} />
        <ZoomButton label={"\u21BA"} onClick={resetZoom} />
        <ZoomButton label="FIT" onClick={zoomToFit} />
        <ZoomButton label={"\u2197"} onClick={handlePopout} />
      </div>
      <div style={{ position: "absolute", bottom: 8, right: 8, fontSize: "9px", color: "#64748b", fontFamily: "monospace", background: "rgba(10,15,26,0.7)", padding: "2px 6px", borderRadius: 3, zIndex: 10 }}>
        {(transform.scale * 100).toFixed(0)}%
      </div>
      <svg ref={svgRef} viewBox={"0 0 " + vw + " " + vh}
        style={{ width: "100%", height: "100%", background: "transparent", cursor: "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClickCapture={handleClickCapture}
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#475569" fillOpacity="0.4" />
          </marker>
          <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
          </marker>
          {CHAIN_COLORS.map((cc, i) => (
            <marker key={"chain-marker-" + i} id={"arrowhead-chain-" + i} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={cc.color} />
            </marker>
          ))}
          <marker id="arrowhead-builder" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#a855f7" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g transform={"translate(" + transform.x + "," + transform.y + ") scale(" + transform.scale + ")"}>
          {(phaseCenters || []).map((pc, i) => {
            const isCollapsed = collapsedTactics && collapsedTactics.has(pc.tacticId);
            return (
              <text key={i} x={pc.x} y={18} textAnchor="middle" fill={pc.color || "#64748b"} fontSize="7.5" fontFamily="monospace" opacity={0.7}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onToggleCollapse && onToggleCollapse(pc.tacticId); }}
              >
                {(isCollapsed ? "[+] " : "[\u2212] ") + pc.label}
              </text>
            );
          })}

          {/* Collapsed tactic summary circles */}
          {collapsedTactics && Object.entries(collapsedSummary).map(([tacId, info]) => {
            const tac = TACTICS.find(t => t.id === tacId);
            return (
              <g key={"collapsed-" + tacId} style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onToggleCollapse && onToggleCollapse(tacId); }}>
                <circle cx={info.x} cy={info.y} r={20}
                  fill={tac?.color || "#6366f1"} fillOpacity={0.15}
                  stroke={tac?.color || "#6366f1"} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="4,2"
                />
                <text x={info.x} y={info.y + 4} textAnchor="middle" fill={tac?.color || "#fff"} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {info.count}
                </text>
              </g>
            );
          })}

          {/* Missing chain path edges (consecutive chain nodes with no graph edge) */}
          {missingChainEdges.map((e, i) => {
            const from = getNodePos(e.from);
            const to = getNodePos(e.to);
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len, uy = dy / len, r = 14;
            return (
              <line key={"chain-gap-" + i} x1={from.x + ux * r} y1={from.y + uy * r}
                x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
                stroke={e.color} strokeWidth={2} strokeOpacity={0.9}
                markerEnd={"url(#arrowhead-chain-" + e.colorIndex + ")"} />
            );
          })}

          {/* Chain builder path edges */}
          {builderEdges.map((e, i) => {
            const from = positions[e.from];
            const to = positions[e.to];
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len, uy = dy / len, r = 14;
            return (
              <line key={"builder-" + i} x1={from.x + ux * r} y1={from.y + uy * r}
                x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
                stroke="#a855f7" strokeWidth={2.5} strokeOpacity={0.8}
                markerEnd="url(#arrowhead-builder)" strokeDasharray="6,3" />
            );
          })}

          {processedEdges.map((e, i) => {
            const from = getNodePos(e.from);
            const to = getNodePos(e.to);
            if (!from || !to) return null;
            const edgeKey = e.from + "->" + e.to;
            const chainColors = edgeChainMap[edgeKey];
            const isChainEdge = !!chainColors;
            const isRemediatedEdge = remediated.has(e.from) || remediated.has(e.to);
            const dimmed = highlightedChains.length > 0 && !isChainEdge;
            if (dimmed && isolateChain) return null;
            const searchDimmedEdge = searchMatches && searchMatches.size > 0 && !searchMatches.has(e.from) && !searchMatches.has(e.to);

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len;
            const uy = dy / len;
            const r = 14;

            if (isChainEdge && chainColors.length > 1) {
              const px = -uy, py = ux;
              const spacing = 3;
              const totalWidth = (chainColors.length - 1) * spacing;
              return (
                <g key={i}>
                  {chainColors.map((ci, j) => {
                    const offset = -totalWidth / 2 + j * spacing;
                    return (
                      <line key={j}
                        x1={from.x + ux * r + px * offset} y1={from.y + uy * r + py * offset}
                        x2={to.x - ux * (r + 6) + px * offset} y2={to.y - uy * (r + 6) + py * offset}
                        stroke={CHAIN_COLORS[ci].color} strokeWidth={1.5} strokeOpacity={searchDimmedEdge ? 0.04 : 0.9}
                        markerEnd={"url(#arrowhead-chain-" + ci + ")"}
                      />
                    );
                  })}
                </g>
              );
            }

            const chainColor = isChainEdge ? CHAIN_COLORS[chainColors[0]].color : null;
            return (
              <line
                key={i}
                x1={from.x + ux * r} y1={from.y + uy * r}
                x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
                stroke={isRemediatedEdge ? "#22c55e" : isChainEdge ? chainColor : "#334155"}
                strokeWidth={isChainEdge ? 2 : 0.7}
                strokeOpacity={searchDimmedEdge ? 0.04 : dimmed ? 0.08 : isRemediatedEdge ? 0.3 : isChainEdge ? 0.9 : 0.2}
                markerEnd={isChainEdge ? "url(#arrowhead-chain-" + chainColors[0] + ")" : "url(#arrowhead)"}
                strokeDasharray={isRemediatedEdge ? "3,3" : "none"}
              />
            );
          })}

          {techniques.map(t => {
            const pos = positions[t.id];
            if (!pos) return null;
            if (collapsedTactics && collapsedTactics.has(t.tactic)) return null;
            const tactic = TACTICS.find(ta => ta.id === t.tactic);
            const exposure = exposures[t.id] ?? 1.0;
            const bc = betweenness[t.id] ?? 0;
            const cc = chainCoverage[t.id] ?? 0;
            const priority = bc * exposure;
            const isSelected = selectedTech === t.id;
            const nodeColors = nodeChainMap[t.id];
            const isInChain = !!nodeColors;
            const isRemediated = remediated.has(t.id);
            const isOptimal = optimalSet.includes(t.id);
            const dimmed = highlightedChains.length > 0 && !isInChain;
            if (dimmed && isolateChain) return null;
            const searchDimmed = searchMatches && searchMatches.size > 0 && !searchMatches.has(t.id);

            const isSub = !!t.parentId;
            const radius = isSub ? (5 + priority * 6) : (8 + priority * 10);
            const nodeColor = isRemediated ? "#22c55e" : tactic?.color || "#6366f1";
            const baseOpacity = dimmed ? 0.15 : exposure < 0.2 ? 0.3 : isSub ? 0.7 : 1;
            const opacity = searchDimmed ? Math.min(baseOpacity, 0.12) : baseOpacity;

            const chainStrokeColor = isInChain && nodeColors.length === 1 ? CHAIN_COLORS[nodeColors[0]].color : null;

            return (
              <g key={t.id}
                onMouseDown={(e) => handleNodeMouseDown(e, t.id)}
                onMouseEnter={(e) => {
                  clearTimeout(tooltipHideTimeout.current);
                  const rect = svgRef.current?.parentElement?.getBoundingClientRect();
                  if (rect) {
                    if (hoveredNode !== t.id) setTooltipExpanded(false);
                    setHoveredNode(t.id); setTooltipPos({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 });
                  }
                }}
                onMouseLeave={() => { tooltipHoveredRef.current = false; clearTooltip(); }}
                style={{ cursor: dragNodeRef.current === t.id ? "grabbing" : "pointer" }}
                opacity={opacity}
              >
                <circle cx={pos.x} cy={pos.y} r={radius + 3}
                  fill="none" stroke={exposure > 0.7 ? "#ef4444" : exposure > 0.4 ? "#f59e0b" : "#22c55e"}
                  strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray={exposure * 20 + " " + (1 - exposure) * 20}
                />
                {isOptimal && !isRemediated && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 7}
                    fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2,2"
                    opacity={0.8}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {gapNodes && gapNodes.has(t.id) && !isRemediated && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 5}
                    fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,3"
                    opacity={0.7}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={pos.x} cy={pos.y} r={radius}
                  fill={nodeColor} fillOpacity={isRemediated ? 0.3 : 0.8}
                  stroke={isSelected ? "#fff" : chainStrokeColor || "transparent"}
                  strokeWidth={isSelected ? 2 : isInChain ? 1.5 : 0}
                  filter={isSelected || isInChain ? "url(#glow)" : "none"}
                />
                {isInChain && nodeColors.length > 1 && (() => {
                  const ringR = radius + 1;
                  const circumference = 2 * Math.PI * ringR;
                  const segLen = circumference / nodeColors.length;
                  return nodeColors.map((ci, j) => (
                    <circle key={"ring-" + j} cx={pos.x} cy={pos.y} r={ringR}
                      fill="none" stroke={CHAIN_COLORS[ci].color} strokeWidth={2}
                      strokeDasharray={segLen + " " + (circumference - segLen)}
                      strokeDashoffset={-j * segLen}
                      filter="url(#glow)"
                    />
                  ));
                })()}
                {cc > 0 && !dimmed && (
                  <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    {cc}
                  </text>
                )}
                {isRemediated && (
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">{"\u2713"}</text>
                )}
                <text x={pos.x} y={pos.y + radius + 10} textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
                  {t.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {hoveredNode && tooltipPos && (() => {
        const ht = techniques.find(t => t.id === hoveredNode);
        if (!ht) return null;
        const htTactic = TACTICS.find(ta => ta.id === ht.tactic);
        const htExposure = exposures[hoveredNode] ?? 1.0;
        const htBetweenness = betweenness[hoveredNode] ?? 0;
        const htChainCount = chainCoverage[hoveredNode] ?? 0;
        const htDesc = techDescriptions?.[hoveredNode];
        const htSummary = htDesc ? (typeof htDesc === 'string' ? htDesc : htDesc.summary) : null;
        const TOOLTIP_TRUNC = 150;
        const needsMore = htSummary && htSummary.length > TOOLTIP_TRUNC;
        const displaySummary = htSummary && (!needsMore || tooltipExpanded) ? htSummary
          : htSummary ? htSummary.slice(0, htSummary.lastIndexOf(' ', TOOLTIP_TRUNC) || TOOLTIP_TRUNC) + '...' : null;
        return (
          <div
            onMouseEnter={() => { tooltipHoveredRef.current = true; clearTimeout(tooltipHideTimeout.current); }}
            onMouseLeave={() => { tooltipHoveredRef.current = false; clearTooltip(); }}
            style={{
              position: "absolute", left: tooltipPos.x, top: tooltipPos.y,
              background: "#1e293bf0", border: "1px solid #475569", borderRadius: 6,
              padding: "8px 10px", pointerEvents: "auto", zIndex: 30,
              maxWidth: tooltipExpanded ? 400 : 300, fontSize: "12px", color: "#e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
            }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{ht.name}</div>
            <div style={{ color: htTactic?.color, fontSize: "11px", marginBottom: 5 }}>{htTactic?.name}</div>
            {displaySummary && (
              <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.4", marginBottom: needsMore ? 2 : 6, borderTop: "1px solid #334155", paddingTop: 4 }}>
                {displaySummary}
              </div>
            )}
            {needsMore && (
              <div style={{ textAlign: "right", marginBottom: 4 }}>
                <span onClick={() => setTooltipExpanded(prev => !prev)} style={{
                  fontSize: "9px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                }}>{tooltipExpanded ? "\u25B2 LESS" : "\u25BC MORE"}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 10px", fontSize: "11px" }}>
              <span style={{ color: "#64748b" }}>Exposure</span>
              <span style={{ color: htExposure > 0.7 ? "#ef4444" : htExposure > 0.4 ? "#f59e0b" : "#22c55e" }}>{(htExposure * 100).toFixed(0)}%</span>
              <span style={{ color: "#64748b" }}>Betweenness</span>
              <span style={{ color: "#3b82f6" }}>{(htBetweenness * 100).toFixed(1)}%</span>
              <span style={{ color: "#64748b" }}>Chains</span>
              <span style={{ color: "#6366f1" }}>{htChainCount}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Popout Helpers ───────────────────────────────────────────────────────────

function PopoutPanel({ title, width, height, onClose, children }) {
  const [container, setContainer] = useState(null);
  const winRef = useRef(null);

  useEffect(() => {
    const w = width || 500;
    const h = height || 600;
    const win = window.open('', '', 'width=' + w + ',height=' + h);
    if (!win) { onClose(); return; }
    winRef.current = win;
    win.document.title = title || 'Panel';
    win.document.head.innerHTML =
      '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{margin:0;padding:0;box-sizing:border-box}' +
      'body{background:#0a0f1a;color:#e2e8f0;font-family:"JetBrains Mono","Fira Code","SF Mono",monospace}' +
      '::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}' +
      '::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}' +
      '::-webkit-scrollbar-thumb:hover{background:#334155}' +
      '</style>';
    const div = win.document.createElement('div');
    div.style.cssText = 'padding:12px 16px;height:100vh;overflow:auto';
    win.document.body.appendChild(div);
    setContainer(div);

    const poll = setInterval(() => { if (win.closed) { clearInterval(poll); onClose(); } }, 300);
    return () => { clearInterval(poll); setContainer(null); if (!win.closed) win.close(); };
  }, []);

  useEffect(() => {
    if (winRef.current && !winRef.current.closed) winRef.current.document.title = title || 'Panel';
  }, [title]);

  if (!container) return null;
  return ReactDOM.createPortal(children, container);
}

function PopoutButton({ onClick, title }) {
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

function PopoutPlaceholder({ label, onRestore }) {
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

// ─── URL State Sharing ────────────────────────────────────────────────────────

function encodeStateToHash(state) {
  const p = new URLSearchParams();
  if (state.dataSource && state.dataSource !== "stix") p.set("ds", state.dataSource);
  if (state.envPreset && state.envPreset !== "government") p.set("env", state.envPreset);
  if (state.sectorFilter && state.sectorFilter !== "all") p.set("sec", state.sectorFilter);
  if (state.remediationBudget && state.remediationBudget !== 5) p.set("budget", String(state.remediationBudget));
  if (state.remediated && state.remediated.length > 0) p.set("rem", state.remediated.join(","));
  if (state.deployedControls && state.deployedControls.length > 0) p.set("ctrl", state.deployedControls.join(","));
  if (state.chains && state.chains.length > 0) p.set("chains", state.chains.join("|"));
  if (state.phaseWeighting) p.set("pw", "1");
  if (state.selectedPlatforms && state.selectedPlatforms.length > 0) p.set("plat", state.selectedPlatforms.join(","));
  if (state.controlPreset && state.controlPreset !== "none") p.set("cp", state.controlPreset);
  return p.toString();
}

function decodeHashToState(hash) {
  if (!hash || hash.length < 2) return null;
  try {
    const p = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const state = {};
    if (p.has("ds")) state.dataSource = p.get("ds");
    if (p.has("env")) state.envPreset = p.get("env");
    if (p.has("sec")) state.sectorFilter = p.get("sec");
    if (p.has("budget")) state.remediationBudget = parseInt(p.get("budget"), 10);
    if (p.has("rem")) state.remediated = p.get("rem").split(",").filter(Boolean);
    if (p.has("ctrl")) state.deployedControls = p.get("ctrl").split(",").filter(Boolean);
    if (p.has("chains")) state.chains = p.get("chains").split("|").filter(Boolean);
    if (p.has("pw")) state.phaseWeighting = true;
    if (p.has("plat")) state.selectedPlatforms = p.get("plat").split(",").filter(Boolean);
    if (p.has("cp")) state.controlPreset = p.get("cp");
    return Object.keys(state).length > 0 ? state : null;
  } catch (e) { return null; }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function AttackPathOptimizer() {
  const [envPreset, setEnvPreset] = useState("government");
  const [exposures, setExposures] = useState({});
  const [selectedTech, setSelectedTech] = useState(null);
  const [expandedExamples, setExpandedExamples] = useState(false);
  useEffect(() => { setExpandedExamples(false); }, [selectedTech]);
  const [highlightedChains, setHighlightedChains] = useState([]);
  const [isolateChain, setIsolateChain] = useState(false);
  // Auto-clear isolate when all chains are deselected
  useEffect(() => { if (highlightedChains.length === 0) setIsolateChain(false); }, [highlightedChains]);
  const [remediated, setRemediated] = useState(new Set());
  const [remediationBudget, setRemediationBudget] = useState(5);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [showBottomPanels, setShowBottomPanels] = useState(true);
  const isDraggingDivider = useRef(false);

  // Phase 1: Dynamic data source
  const [dataSource, setDataSource] = useState("stix");
  const [customData, setCustomData] = useState(null);
  const [stixLoading, setStixLoading] = useState(false);
  const [stixError, setStixError] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const navFileInputRef = useRef(null);

  // Phase 5: Security Controls
  const [deployedControls, setDeployedControls] = useState(new Set());
  const [showControls, setShowControls] = useState(false);

  // Popout panel states
  const [popoutChains, setPopoutChains] = useState(false);
  const [popoutPriority, setPopoutPriority] = useState(false);
  const [popoutDetail, setPopoutDetail] = useState(false);
  const [popoutAnalysis, setPopoutAnalysis] = useState(false);
  const [popoutControls, setPopoutControls] = useState(false);

  // Gap Analysis
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [popoutGapAnalysis, setPopoutGapAnalysis] = useState(false);

  // Node dragging: custom position overrides
  const [customPositions, setCustomPositions] = useState({});

  // Feature: Technique search
  const [techSearchQuery, setTechSearchQuery] = useState("");
  // Feature: Chain search
  const [chainSearchQuery, setChainSearchQuery] = useState("");
  // Feature: Collapsible tactic clusters
  const [collapsedTactics, setCollapsedTactics] = useState(() => {
    try { const s = localStorage.getItem("attackPathOptimizer_collapsed"); return s ? new Set(JSON.parse(s)) : new Set(); } catch(e) { return new Set(); }
  });
  // Feature: Sub-techniques
  const [showSubTechniques, setShowSubTechniques] = useState(false);
  // Feature: Custom chain builder
  const [chainBuilderMode, setChainBuilderMode] = useState(false);
  const [chainBuilderPath, setChainBuilderPath] = useState([]);
  const [chainBuilderName, setChainBuilderName] = useState("");
  const [customChains, setCustomChains] = useState(() => {
    try { const s = localStorage.getItem("attackPathOptimizer_customChains"); return s ? JSON.parse(s) : []; } catch(e) { return []; }
  });
  // Feature: Executive summary
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [popoutExecutive, setPopoutExecutive] = useState(false);
  // F4: Phase weighting toggle
  const [phaseWeighting, setPhaseWeighting] = useState(false);
  // F2: Platform filtering
  const [selectedPlatforms, setSelectedPlatforms] = useState(null); // null = all platforms
  // F5: Control presets
  const [controlPreset, setControlPreset] = useState("none");
  // F7: Threat actor profile expansion
  const [expandedChainProfile, setExpandedChainProfile] = useState(null);

  // Phase 3: Persistence helpers
  const [showSaved, setShowSaved] = useState(false);
  const skipEnvEffect = useRef(false);
  const mountTime = useRef(Date.now());
  // Feature: Shareable URLs
  const hashChainNamesRef = useRef(null);
  const [shareConfirm, setShareConfirm] = useState(false);

  // Phase 1: Derive active data from source
  const activeTechniques = customData?.techniques || TECHNIQUES;
  const activeEdges = customData?.edges || EDGES;
  const activeChains = useMemo(() => [...(customData?.chains || ATTACK_CHAINS), ...customChains], [customData, customChains]);
  const activeTechDescriptions = customData?.techniqueDescriptions || TECHNIQUE_EXAMPLES;
  const activeChainTechContext = customData?.chainTechContext || CHAIN_TECHNIQUE_CONTEXT;
  const activePlatforms = customData?.techniquePlatforms || TECHNIQUE_PLATFORMS;
  const activeMitigations = customData?.mitigations || TECHNIQUE_MITIGATIONS;
  const activeGroupProfiles = customData?.groupProfiles || CHAIN_PROFILES;

  // Feature: Display techniques (filtered by sub-technique toggle + F2 platform filter)
  const displayTechniques = useMemo(() => {
    let techs;
    if (showSubTechniques) {
      techs = [...activeTechniques].sort((a, b) => {
        if (a.tactic !== b.tactic) return 0;
        const aBase = a.parentId || a.id;
        const bBase = b.parentId || b.id;
        if (aBase !== bBase) return aBase.localeCompare(bBase);
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return a.id.localeCompare(b.id);
      });
    } else {
      techs = activeTechniques.filter(t => !t.parentId);
    }
    // F2: Platform filter
    if (selectedPlatforms && selectedPlatforms.size > 0) {
      techs = techs.filter(t => {
        const plats = activePlatforms[t.id];
        if (!plats || plats.length === 0) return true; // include if no platform data
        return plats.some(p => selectedPlatforms.has(p));
      });
    }
    return techs;
  }, [activeTechniques, showSubTechniques, selectedPlatforms, activePlatforms]);

  // Feature: Technique search matches
  const techSearchMatches = useMemo(() => {
    if (!techSearchQuery.trim()) return null;
    const q = techSearchQuery.toLowerCase().trim();
    const matches = new Set();
    displayTechniques.forEach(t => {
      if (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) matches.add(t.id);
    });
    return matches;
  }, [techSearchQuery, displayTechniques]);

  // Phase 5: Compute effective exposures with security control adjustments
  const effectiveExposures = useMemo(() => {
    if (deployedControls.size === 0) return exposures;
    const result = { ...exposures };
    SECURITY_CONTROLS.forEach(ctrl => {
      if (!deployedControls.has(ctrl.id)) return;
      Object.entries(ctrl.coverage).forEach(([tid, reduction]) => {
        const current = result[tid] ?? 1.0;
        result[tid] = Math.max(0, Math.min(1, current * (1 + reduction)));
      });
    });
    return result;
  }, [exposures, deployedControls]);

  // Draggable divider between graph and bottom panels (overlay)
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingDivider.current) return;
      const container = document.getElementById('split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newH = Math.max(60, Math.min(rect.height - 60, rect.bottom - e.clientY));
      setPanelHeight(newH);
    };
    const onUp = () => { isDraggingDivider.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const startDividerDrag = useCallback((e) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Phase 3: Restore state from hash or localStorage on mount
  useEffect(() => {
    const hashState = decodeHashToState(window.location.hash);
    if (hashState) {
      if (hashState.envPreset) { skipEnvEffect.current = true; setEnvPreset(hashState.envPreset); }
      if (hashState.sectorFilter) setSectorFilter(hashState.sectorFilter);
      if (hashState.remediationBudget) setRemediationBudget(hashState.remediationBudget);
      if (hashState.dataSource) setDataSource(hashState.dataSource);
      if (hashState.remediated) setRemediated(new Set(hashState.remediated));
      if (hashState.deployedControls) setDeployedControls(new Set(hashState.deployedControls));
      if (hashState.chains) hashChainNamesRef.current = hashState.chains;
      if (hashState.phaseWeighting) setPhaseWeighting(true);
      if (hashState.selectedPlatforms) setSelectedPlatforms(new Set(hashState.selectedPlatforms));
      if (hashState.controlPreset) setControlPreset(hashState.controlPreset);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }
    try {
      const raw = localStorage.getItem("attackPathOptimizer");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.envPreset) { skipEnvEffect.current = true; setEnvPreset(saved.envPreset); }
      if (saved.sectorFilter) setSectorFilter(saved.sectorFilter);
      if (saved.remediationBudget) setRemediationBudget(saved.remediationBudget);
      if (saved.dataSource) setDataSource(saved.dataSource);
      if (saved.exposures) setExposures(saved.exposures);
      if (saved.remediated) setRemediated(new Set(saved.remediated));
      if (saved.deployedControls) setDeployedControls(new Set(saved.deployedControls));
      if (saved.phaseWeighting) setPhaseWeighting(saved.phaseWeighting);
      if (saved.controlPreset) setControlPreset(saved.controlPreset);
      if (saved.selectedPlatforms) setSelectedPlatforms(new Set(saved.selectedPlatforms));
    } catch (e) {}
  }, []);

  // Resolve chain names from hash once chains are loaded
  useEffect(() => {
    if (!hashChainNamesRef.current || activeChains.length === 0) return;
    const names = hashChainNamesRef.current;
    hashChainNamesRef.current = null;
    const matched = names.map(n => activeChains.find(c => c.name === n)).filter(Boolean);
    if (matched.length > 0) setHighlightedChains(matched.slice(0, MAX_HIGHLIGHTED_CHAINS));
  }, [activeChains]);

  // Environment preset → exposures
  useEffect(() => {
    if (skipEnvEffect.current) { skipEnvEffect.current = false; return; }
    const preset = ENV_PRESETS[envPreset];
    if (preset?.overrides) {
      setExposures({ ...preset.overrides });
    } else {
      setExposures({});
    }
  }, [envPreset]);

  // Phase 3: Auto-save to localStorage (debounced 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("attackPathOptimizer", JSON.stringify({
          envPreset, sectorFilter, remediationBudget,
          dataSource: dataSource === "upload" ? "builtin" : dataSource,
          exposures, remediated: [...remediated],
          deployedControls: [...deployedControls],
          phaseWeighting, controlPreset,
          selectedPlatforms: selectedPlatforms ? [...selectedPlatforms] : null,
        }));
        if (Date.now() - mountTime.current > 1000) {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 1500);
        }
      } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [envPreset, sectorFilter, remediationBudget, dataSource, exposures, remediated, deployedControls, phaseWeighting, controlPreset, selectedPlatforms]);

  // Phase 2: STIX data loading
  useEffect(() => {
    setCustomPositions({});
    if (dataSource === "stix") {
      setStixLoading(true);
      setStixError(null);
      loadStixData().then(data => {
        setCustomData(data);
        setStixLoading(false);
      }).catch(err => {
        setStixError(err.message);
        setStixLoading(false);
        setDataSource("builtin");
      });
    } else if (dataSource === "upload") {
      // Data already set by handleStixFileUpload
    } else {
      setCustomData(null);
      setStixError(null);
      setUploadedFileName(null);
      setUploadError(null);
    }
  }, [dataSource]);

  const layoutResult = useMemo(() => layoutNodes(displayTechniques), [displayTechniques]);
  const displayEdges = useMemo(() => {
    const techSet = new Set(displayTechniques.map(t => t.id));
    return activeEdges.filter(e => techSet.has(e.from) && techSet.has(e.to));
  }, [displayTechniques, activeEdges]);
  const viewHeight = layoutResult.viewHeight;
  const viewWidth = layoutResult.viewWidth;
  const phaseCenters = layoutResult.phaseCenters;
  const positions = useMemo(() => {
    if (Object.keys(customPositions).length === 0) return layoutResult.positions;
    return { ...layoutResult.positions, ...customPositions };
  }, [layoutResult.positions, customPositions]);
  const betweenness = useMemo(() => computeBetweenness(activeTechniques, activeEdges), [activeTechniques, activeEdges]);

  const filteredChains = useMemo(() => {
    if (sectorFilter === "all") return activeChains;
    return activeChains.filter(c => c.sector === sectorFilter || c.sector === "all");
  }, [sectorFilter, activeChains]);

  const chainCoverage = useMemo(() => computeChainCoverage(activeTechniques, filteredChains), [activeTechniques, filteredChains]);

  // Gap Analysis computation (must be after betweenness + chainCoverage)
  const gapAnalysis = useMemo(() => {
    const controlCoverage = {};
    SECURITY_CONTROLS.forEach(ctrl => {
      Object.keys(ctrl.coverage).forEach(tid => {
        if (!controlCoverage[tid]) controlCoverage[tid] = [];
        controlCoverage[tid].push(ctrl);
      });
    });
    const gaps = [];
    displayTechniques.forEach(t => {
      if (remediated.has(t.id)) return;
      const availableControls = controlCoverage[t.id] || [];
      const deployedForTech = availableControls.filter(c => deployedControls.has(c.id));
      let gapType = null;
      if (availableControls.length === 0) {
        gapType = "no-coverage";
      } else if (deployedForTech.length === 0) {
        gapType = "not-deployed";
      } else {
        return;
      }
      const exposure = effectiveExposures[t.id] ?? 1.0;
      const bc = betweenness[t.id] ?? 0;
      const cc = chainCoverage[t.id] ?? 0;
      const riskScore = exposure * bc * Math.max(cc, 0.1);
      gaps.push({ ...t, gapType, exposure, bc, cc, riskScore, availableControls });
    });
    gaps.sort((a, b) => b.riskScore - a.riskScore);
    return {
      gaps,
      noCoverageCount: gaps.filter(g => g.gapType === "no-coverage").length,
      notDeployedCount: gaps.filter(g => g.gapType === "not-deployed").length,
    };
  }, [displayTechniques, deployedControls, effectiveExposures, betweenness, chainCoverage, remediated]);

  const gapNodeSet = useMemo(() => {
    if (!showGapAnalysis) return null;
    return new Set(gapAnalysis.gaps.map(g => g.id));
  }, [showGapAnalysis, gapAnalysis]);

  const optimal = useMemo(() =>
    findOptimalRemediation(activeTechniques, filteredChains, effectiveExposures, remediationBudget, phaseWeighting),
    [activeTechniques, filteredChains, effectiveExposures, remediationBudget, phaseWeighting]
  );

  const chainStatus = useMemo(() => {
    return filteredChains.map(chain => {
      const broken = chain.path.some(tid => remediated.has(tid));
      const breakpoints = chain.path.filter(tid => remediated.has(tid));
      const exposedNodes = chain.path.filter(tid => (effectiveExposures[tid] ?? 1.0) > 0.7);
      const avgExposure = chain.path.reduce((s, tid) => s + (effectiveExposures[tid] ?? 1.0), 0) / chain.path.length;
      return { ...chain, broken, breakpoints, exposedNodes, avgExposure };
    });
  }, [filteredChains, remediated, effectiveExposures]);

  const totalDisrupted = chainStatus.filter(c => c.broken).length;

  // F6: Chain uniqueness/comparison analysis
  const chainSetAnalysis = useMemo(() => {
    if (highlightedChains.length < 2) return null;
    const sets = highlightedChains.map(c => new Set(c.path));
    const union = new Set();
    sets.forEach(s => s.forEach(t => union.add(t)));
    const intersection = new Set([...sets[0]].filter(t => sets.every(s => s.has(t))));
    const uniquePerChain = highlightedChains.map((c, i) => ({
      name: c.name,
      colorIndex: i,
      unique: new Set([...sets[i]].filter(t => sets.every((s, j) => j === i || !s.has(t)))),
    }));
    return { intersection, union, uniquePerChain };
  }, [highlightedChains]);

  // Feature: Chain search display filter
  const displayedChainStatus = useMemo(() => {
    if (!chainSearchQuery.trim()) return chainStatus;
    const q = chainSearchQuery.toLowerCase().trim();
    return chainStatus.filter(c =>
      c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) ||
      c.path.some(tid => tid.toLowerCase().includes(q))
    );
  }, [chainStatus, chainSearchQuery]);

  const handleExposureChange = (techId, value) => {
    setExposures(prev => ({ ...prev, [techId]: value }));
  };

  const toggleRemediate = (techId) => {
    setRemediated(prev => {
      const next = new Set(prev);
      if (next.has(techId)) next.delete(techId);
      else next.add(techId);
      return next;
    });
  };

  const applyOptimal = () => {
    setRemediated(new Set(optimal.selected));
  };

  const toggleHighlightedChain = useCallback((chain) => {
    setHighlightedChains(prev => {
      const idx = prev.findIndex(c => c.name === chain.name);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= MAX_HIGHLIGHTED_CHAINS) return [...prev.slice(1), chain];
      return [...prev, chain];
    });
  }, []);

  const handleStixFileUpload = useCallback((file) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bundle = JSON.parse(e.target.result);
        const result = parseStixBundle(bundle);
        setCustomData(result);
        setUploadedFileName(file.name);
        setDataSource("upload");
      } catch (err) {
        setUploadError(err.message || "Failed to parse STIX file");
      }
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  }, []);

  const handleShare = useCallback(() => {
    const state = {
      dataSource: dataSource === "upload" ? "builtin" : dataSource,
      envPreset,
      sectorFilter,
      remediationBudget,
      remediated: [...remediated],
      deployedControls: [...deployedControls],
      chains: highlightedChains.map(c => c.name),
      phaseWeighting,
      selectedPlatforms: selectedPlatforms ? [...selectedPlatforms] : [],
      controlPreset,
    };
    const hash = encodeStateToHash(state);
    const url = window.location.pathname + window.location.search + (hash ? "#" + hash : "");
    window.history.replaceState(null, "", url);
    navigator.clipboard.writeText(window.location.origin + url).then(() => {
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 2000);
    }).catch(() => {
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 2000);
    });
  }, [dataSource, envPreset, sectorFilter, remediationBudget, remediated, deployedControls, highlightedChains, phaseWeighting, selectedPlatforms, controlPreset]);

  const handleNodeDrag = useCallback((nodeId, dx, dy) => {
    setCustomPositions(prev => {
      const base = layoutResult.positions[nodeId] || { x: 0, y: 0 };
      const current = prev[nodeId] || base;
      return { ...prev, [nodeId]: { x: current.x + dx, y: current.y + dy } };
    });
  }, [layoutResult.positions]);

  const resetAll = () => {
    setRemediated(new Set());
    setSelectedTech(null);
    setHighlightedChains([]);
    setShowAnalysis(false);
    setEnvPreset("government");
    setSectorFilter("all");
    setRemediationBudget(5);
    setCustomPositions({});
    setDeployedControls(new Set());
    setShowControls(false);
    setPopoutChains(false);
    setPopoutPriority(false);
    setPopoutDetail(false);
    setPopoutAnalysis(false);
    setPopoutControls(false);
    setTechSearchQuery("");
    setChainSearchQuery("");
    setCollapsedTactics(new Set());
    setShowSubTechniques(false);
    setChainBuilderMode(false);
    setChainBuilderPath([]);
    setChainBuilderName("");
    setShowExecutiveSummary(false);
    setPopoutExecutive(false);
    setUploadedFileName(null);
    setUploadError(null);
    setShareConfirm(false);
    setPanelHeight(300);
    setShowBottomPanels(true);
    setShowGapAnalysis(false);
    setPopoutGapAnalysis(false);
    setPhaseWeighting(false);
    setSelectedPlatforms(null);
    setControlPreset("none");
    setExpandedChainProfile(null);
    try { localStorage.removeItem("attackPathOptimizer"); localStorage.removeItem("attackPathOptimizer_collapsed"); } catch (e) {}
    // Force STIX reload: briefly switch away then back so the effect always fires
    setDataSource("builtin");
    setTimeout(() => setDataSource("stix"), 0);
  };

  const selectedTechData = displayTechniques.find(t => t.id === selectedTech);
  const selectedTactic = selectedTechData ? TACTICS.find(ta => ta.id === selectedTechData.tactic) : null;

  const techExamples = useMemo(() => {
    if (!selectedTech) return null;
    const raw = activeTechDescriptions[selectedTech];
    if (!raw) return null;
    return typeof raw === 'string' ? { summary: raw, examples: [] } : raw;
  }, [selectedTech, activeTechDescriptions]);

  const getChainTechContext = useCallback((chainName, techId) => {
    const descs = activeChainTechContext[chainName];
    if (!descs) return null;
    if (descs[techId]) return descs[techId];
    const subs = Object.entries(descs)
      .filter(([k]) => k.startsWith(techId + '.'))
      .map(([, v]) => v);
    return subs.length > 0 ? subs[0] : null;
  }, [activeChainTechContext]);

  const priorityRanking = useMemo(() => {
    return displayTechniques
      .map(t => {
        let priority = (betweenness[t.id] ?? 0) * (effectiveExposures[t.id] ?? 1.0) * (chainCoverage[t.id] ?? 0) / Math.max(filteredChains.length, 1);
        if (phaseWeighting) priority *= (PHASE_WEIGHTS[TACTIC_PHASE[t.tactic]] ?? 1.0);
        return {
          ...t,
          exposure: effectiveExposures[t.id] ?? 1.0,
          betweennessVal: betweenness[t.id] ?? 0,
          chainCount: chainCoverage[t.id] ?? 0,
          priority,
        };
      })
      .filter(t => t.priority > 0 && !remediated.has(t.id))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 12);
  }, [displayTechniques, effectiveExposures, betweenness, chainCoverage, remediated, filteredChains, phaseWeighting]);

  // Phase 4: CSV Export
  const exportCSV = useCallback(() => {
    let csv = "Rank,Technique ID,Name,Tactic,Exposure%,Betweenness%,Chain Count,Priority Score,Remediated,In Optimal Set\n";
    displayTechniques
      .map(t => ({
        ...t,
        exposure: effectiveExposures[t.id] ?? 1.0,
        bc: betweenness[t.id] ?? 0,
        cc: chainCoverage[t.id] ?? 0,
        priority: (betweenness[t.id] ?? 0) * (effectiveExposures[t.id] ?? 1.0) * (chainCoverage[t.id] ?? 0) / Math.max(filteredChains.length, 1),
      }))
      .sort((a, b) => b.priority - a.priority)
      .forEach((t, i) => {
        const tactic = TACTICS.find(ta => ta.id === t.tactic);
        csv += [
          i + 1, t.id, '"' + t.name.replace(/"/g, '""') + '"', tactic?.name || "",
          (t.exposure * 100).toFixed(1), (t.bc * 100).toFixed(1), t.cc,
          (t.priority * 100).toFixed(1),
          remediated.has(t.id) ? "Y" : "N",
          optimal.selected.includes(t.id) ? "Y" : "N",
        ].join(",") + "\n";
      });
    csv += "\nChain Name,Severity%,Disrupted,Break Points,Avg Exposure%,Sector\n";
    chainStatus.forEach(c => {
      csv += [
        '"' + c.name.replace(/"/g, '""') + '"',
        (c.severity * 100).toFixed(0),
        c.broken ? "Y" : "N",
        '"' + c.breakpoints.join("; ") + '"',
        (c.avgExposure * 100).toFixed(1),
        c.sector,
      ].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attack-path-analysis-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [displayTechniques, effectiveExposures, betweenness, chainCoverage, filteredChains, remediated, optimal, chainStatus]);

  // ATT&CK Navigator Layer Export
  const exportNavigatorLayer = useCallback(() => {
    const techniques = displayTechniques.map(t => {
      const exposure = effectiveExposures[t.id] ?? 1.0;
      const isRemediated = remediated.has(t.id);
      const bc = betweenness[t.id] ?? 0;
      const cc = chainCoverage[t.id] ?? 0;
      const score = Math.round(exposure * 100);
      const color = isRemediated ? "#22c55e" : exposure > 0.7 ? "#ef4444" : exposure > 0.4 ? "#f59e0b" : "#22c55e";
      const deployedForTech = SECURITY_CONTROLS.filter(c => deployedControls.has(c.id) && c.coverage[t.id]);
      const commentParts = [];
      commentParts.push(isRemediated ? "REMEDIATED" : "Exposure: " + (exposure * 100).toFixed(0) + "%");
      commentParts.push("Betweenness: " + (bc * 100).toFixed(1) + "%");
      commentParts.push("Chain count: " + cc);
      if (deployedForTech.length > 0) commentParts.push("Controls: " + deployedForTech.map(c => c.name).join(", "));
      return {
        techniqueID: t.id,
        tactic: TACTIC_TO_PHASE_NAME[t.tactic] || "",
        score,
        color,
        comment: commentParts.join(" | "),
        enabled: !isRemediated,
      };
    });
    const layer = {
      name: "ATT&CK Path Optimizer Export",
      domain: "enterprise-attack",
      versions: { attack: "14", navigator: "4.9.1", layer: "4.5" },
      techniques,
      gradient: { colors: ["#22c55e", "#f59e0b", "#ef4444"], minValue: 0, maxValue: 100 },
      description: "Exported from ATT&CK Path Optimizer on " + new Date().toISOString().split("T")[0],
    };
    const blob = new Blob([JSON.stringify(layer, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attack-navigator-layer-" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }, [displayTechniques, effectiveExposures, betweenness, chainCoverage, remediated, deployedControls]);

  // F8: Gap Remediation Roadmap Export
  const exportRemediationPlan = useCallback(() => {
    if (gapAnalysis.gaps.length === 0) return;
    const tierOf = (g) => {
      const s = g.riskScore;
      if (s > 0.5) return "Critical";
      if (s > 0.2) return "High";
      if (s > 0.05) return "Medium";
      return "Low";
    };
    let csv = "Priority Tier,Technique ID,Name,Tactic,Gap Type,Exposure%,Betweenness%,Chain Count,Risk Score,Recommended Controls\n";
    gapAnalysis.gaps.forEach(g => {
      const tactic = TACTICS.find(ta => ta.id === g.tactic);
      const recCtrls = g.availableControls.map(c => c.name + " (" + c.cost + ")").join("; ") || "None available";
      csv += [
        tierOf(g), g.id, '"' + g.name.replace(/"/g, '""') + '"', tactic?.name || "",
        g.gapType === "no-coverage" ? "No Coverage" : "Not Deployed",
        (g.exposure * 100).toFixed(1), (g.bc * 100).toFixed(1), g.cc,
        (g.riskScore * 100).toFixed(2), '"' + recCtrls + '"',
      ].join(",") + "\n";
    });
    // Summary section
    const tiers = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    gapAnalysis.gaps.forEach(g => { tiers[tierOf(g)]++; });
    const undeployedNeeded = new Set();
    gapAnalysis.gaps.forEach(g => g.availableControls.forEach(c => { if (!deployedControls.has(c.id)) undeployedNeeded.add(c.id); }));
    const costMap = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
    let minCost = 0, maxCost = 0;
    undeployedNeeded.forEach(cid => {
      const ctrl = SECURITY_CONTROLS.find(c => c.id === cid);
      if (ctrl) { const cv = costMap[ctrl.cost] || 0; minCost += cv; maxCost += cv * 2; }
    });
    csv += "\n--- SUMMARY ---\n";
    csv += "Critical Gaps," + tiers.Critical + "\nHigh Gaps," + tiers.High + "\nMedium Gaps," + tiers.Medium + "\nLow Gaps," + tiers.Low + "\n";
    csv += "Total Gaps," + gapAnalysis.gaps.length + "\n";
    csv += "Undeployed Controls Needed," + undeployedNeeded.size + "\n";
    csv += "Estimated Cost Range," + "$".repeat(Math.ceil(minCost / undeployedNeeded.size) || 1) + " - " + "$".repeat(Math.ceil(maxCost / undeployedNeeded.size) || 1) + " per control\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gap-remediation-plan-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [gapAnalysis, deployedControls]);

  // ATT&CK Navigator Layer Import
  const handleNavigatorImport = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.techniques || !Array.isArray(data.techniques) || !data.techniques[0]?.techniqueID) {
          setUploadError("Not a valid Navigator layer (missing techniques[].techniqueID)");
          return;
        }
        const newExposures = { ...exposures };
        const newRemediated = new Set(remediated);
        let importedCount = 0;
        const techIds = new Set(activeTechniques.map(t => t.id));
        data.techniques.forEach(nt => {
          if (!techIds.has(nt.techniqueID)) return;
          if (typeof nt.score === "number") {
            newExposures[nt.techniqueID] = Math.max(0, Math.min(1, nt.score / 100));
          }
          if (nt.enabled === false) {
            newRemediated.add(nt.techniqueID);
          }
          importedCount++;
        });
        setExposures(newExposures);
        setRemediated(newRemediated);
        setUploadError(null);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (err) {
        setUploadError("Failed to parse Navigator layer: " + (err.message || "Invalid JSON"));
      }
    };
    reader.onerror = () => setUploadError("Failed to read Navigator file");
    reader.readAsText(file);
  }, [exposures, remediated, activeTechniques]);

  return (
    <div style={{
      background: "#0a0f1a",
      color: "#e2e8f0",
      height: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.5px" }}>
            ATT&CK Path Optimizer
          </h1>
          <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>
            Weighted graph analysis for optimal cybersecurity expenditure
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Phase 2: Data Source selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Data Source</label>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <select value={dataSource} onChange={e => setDataSource(e.target.value)}
                style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
                <option value="builtin">Built-in (8 chains)</option>
                <option value="stix">MITRE ATT&CK STIX (Live)</option>
                {uploadedFileName && <option value="upload">Upload: {uploadedFileName}</option>}
              </select>
              <input type="file" ref={fileInputRef} accept=".json" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) handleStixFileUpload(e.target.files[0]); e.target.value = ""; }} />
              <input type="file" ref={navFileInputRef} accept=".json" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) handleNavigatorImport(e.target.files[0]); e.target.value = ""; }} />
              <button onClick={() => fileInputRef.current?.click()} style={{
                background: "#1e293b", color: "#06b6d4", border: "1px solid #06b6d4", borderRadius: "4px",
                padding: "4px 8px", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>UPLOAD</button>
            </div>
          </div>
          <span style={{ fontSize: "9px", color: "#64748b", padding: "2px 6px", background: "#1e293b", borderRadius: "8px", alignSelf: "flex-end", marginBottom: "2px" }}>
            {displayTechniques.length}{showSubTechniques && displayTechniques.length !== activeTechniques.length ? "/" + activeTechniques.length : ""} techniques, {activeChains.length} chains
          </span>
          {stixError && (
            <span style={{ fontSize: "9px", color: "#ef4444", padding: "2px 6px", background: "#ef444415", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
              STIX: {stixError}
            </span>
          )}
          {uploadError && (
            <span style={{ fontSize: "9px", color: "#ef4444", padding: "2px 6px", background: "#ef444415", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
              Upload: {uploadError}
            </span>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Environment</label>
            <select value={envPreset} onChange={e => setEnvPreset(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              <option value="default">Unassessed (Worst Case)</option>
              <option value="government">Government (Typical)</option>
              <option value="hardened">Hardened Enterprise</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Platforms</label>
            <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
              {ALL_PLATFORMS.map(p => {
                const active = !selectedPlatforms || selectedPlatforms.has(p);
                return (
                  <button key={p} onClick={() => {
                    setSelectedPlatforms(prev => {
                      if (!prev) {
                        // First click: activate only this platform
                        return new Set([p]);
                      }
                      const next = new Set(prev);
                      if (next.has(p)) {
                        next.delete(p);
                        return next.size === 0 ? null : next; // null = show all
                      }
                      next.add(p);
                      if (next.size === ALL_PLATFORMS.length) return null; // all selected = same as null
                      return next;
                    });
                  }} style={{
                    background: active ? "#3b82f6" : "transparent",
                    color: active ? "#fff" : "#64748b",
                    border: "1px solid " + (active ? "#3b82f6" : "#334155"),
                    borderRadius: "3px", padding: "2px 5px", fontSize: "8px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2,
                  }}>{p}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Threat Sector</label>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              <option value="all">All Sectors</option>
              <option value="government">Government</option>
              <option value="financial">Financial</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Budget (nodes)</label>
            <input type="range" min={1} max={10} value={remediationBudget} onChange={e => setRemediationBudget(+e.target.value)}
              style={{ width: "80px", accentColor: "#f59e0b" }} />
            <span style={{ fontSize: "10px", color: "#f59e0b", textAlign: "center" }}>{remediationBudget}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Search</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input type="text" value={techSearchQuery} onChange={e => setTechSearchQuery(e.target.value)}
                placeholder="Search techniques..."
                style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 24px 4px 8px", fontSize: "11px", fontFamily: "inherit", width: "150px" }} />
              {techSearchQuery && (
                <button onClick={() => setTechSearchQuery("")} style={{
                  position: "absolute", right: 4, background: "transparent", border: "none", color: "#64748b",
                  cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: "2px",
                }}>{"\u2715"}</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "16px", padding: "10px 24px", borderBottom: "1px solid #1e293b",
        alignItems: "center", flexWrap: "wrap", flexShrink: 0,
      }}>
        <Stat label="Attack Chains" value={filteredChains.length} color="#6366f1" />
        <Stat label="Disrupted" value={totalDisrupted + "/" + filteredChains.length}
          color={totalDisrupted === filteredChains.length ? "#22c55e" : "#f59e0b"} />
        <Stat label="Remediated Nodes" value={remediated.size} color="#22c55e" />
        <Stat label="Optimal Covers" value={optimal.chainsDisrupted + " chains in " + optimal.selected.length + " nodes"} color="#f59e0b" />
        <button onClick={applyOptimal} style={{
          background: "#f59e0b", color: "#0a0f1a", border: "none", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.5px",
        }}>
          APPLY OPTIMAL
        </button>
        <button onClick={exportCSV} style={{
          background: "transparent", color: "#3b82f6", border: "1px solid #3b82f6", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          EXPORT CSV
        </button>
        <button onClick={() => navFileInputRef.current?.click()} style={{
          background: "transparent", color: "#f97316", border: "1px solid #f97316", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          IMPORT NAV
        </button>
        <button onClick={exportNavigatorLayer} style={{
          background: "transparent", color: "#f97316", border: "1px solid #f97316", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          EXPORT NAV
        </button>
        <button onClick={() => { const next = !showControls; setShowControls(next); if (!next) setPopoutControls(false); }} style={{
          background: showControls ? "#14b8a6" : "transparent", color: showControls ? "#0a0f1a" : "#14b8a6",
          border: "1px solid #14b8a6", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          CONTROLS
        </button>
        {dataSource === "stix" && (
          <button onClick={() => setShowSubTechniques(prev => !prev)} style={{
            background: showSubTechniques ? "#8b5cf6" : "transparent", color: showSubTechniques ? "#fff" : "#8b5cf6",
            border: "1px solid #8b5cf6", borderRadius: "4px",
            padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            {showSubTechniques ? "HIDE" : "SHOW"} SUB-TECH
          </button>
        )}
        <button onClick={() => { setChainBuilderMode(prev => !prev); if (chainBuilderMode) { setChainBuilderPath([]); setChainBuilderName(""); } }} style={{
          background: chainBuilderMode ? "#a855f7" : "transparent", color: chainBuilderMode ? "#fff" : "#a855f7",
          border: "1px solid #a855f7", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          {chainBuilderMode ? "EXIT BUILDER" : "BUILD CHAIN"}
        </button>
        <button onClick={() => setPhaseWeighting(prev => !prev)} style={{
          background: phaseWeighting ? "#f97316" : "transparent", color: phaseWeighting ? "#fff" : "#f97316",
          border: "1px solid #f97316", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          PHASE WEIGHT
        </button>
        <button onClick={() => { const next = !showGapAnalysis; setShowGapAnalysis(next); if (!next) setPopoutGapAnalysis(false); }} style={{
          background: showGapAnalysis ? "#ef4444" : "transparent", color: showGapAnalysis ? "#fff" : "#ef4444",
          border: "1px solid #ef4444", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          position: "relative",
        }}>
          GAP ANALYSIS
          {gapAnalysis.gaps.length > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "#ef4444", color: "#fff", fontSize: "8px", fontWeight: 700,
              borderRadius: "8px", padding: "1px 5px", minWidth: 16, textAlign: "center",
            }}>{gapAnalysis.gaps.length}</span>
          )}
        </button>
        <button onClick={() => { const next = !showExecutiveSummary; setShowExecutiveSummary(next); if (!next) setPopoutExecutive(false); }} style={{
          background: showExecutiveSummary ? "#06b6d4" : "transparent", color: showExecutiveSummary ? "#fff" : "#06b6d4",
          border: "1px solid #06b6d4", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          EXECUTIVE
        </button>
        <button onClick={() => setShowBottomPanels(prev => !prev)} style={{
          background: showBottomPanels ? "#64748b" : "transparent", color: showBottomPanels ? "#0a0f1a" : "#64748b",
          border: "1px solid #64748b", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          PANELS
        </button>
        {highlightedChains.length > 0 && (
          <button onClick={() => setIsolateChain(prev => !prev)} style={{
            background: isolateChain ? "#ec4899" : "transparent", color: isolateChain ? "#fff" : "#ec4899",
            border: "1px solid #ec4899", borderRadius: "4px",
            padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            {isolateChain ? "SHOW ALL" : "ISOLATE"}
          </button>
        )}
        {Object.keys(customPositions).length > 0 && (
          <button onClick={() => setCustomPositions({})} style={{
            background: "transparent", color: "#8b5cf6", border: "1px solid #8b5cf6", borderRadius: "4px",
            padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            AUTO-SPACE
          </button>
        )}
        <button onClick={handleShare} style={{
          background: "transparent", color: "#06b6d4", border: "1px solid #06b6d4", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          SHARE
        </button>
        {shareConfirm && (
          <span style={{ fontSize: "9px", color: "#06b6d4", opacity: 0.9 }}>URL copied!</span>
        )}
        <button onClick={resetAll} style={{
          background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
          RESET
        </button>
        {showSaved && (
          <span style={{ fontSize: "9px", color: "#22c55e", opacity: 0.8, transition: "opacity 0.3s" }}>Saved</span>
        )}
        <button onClick={() => { const next = !showAnalysis; setShowAnalysis(next); if (!next) setPopoutAnalysis(false); }} style={{
          background: showAnalysis ? "#3b82f6" : "transparent", color: showAnalysis ? "#fff" : "#64748b",
          border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
          {showAnalysis ? "HIDE" : "SHOW"} ANALYSIS
        </button>
      </div>

      {/* Split container: graph fills all space, panels overlay from bottom */}
      <div id="split-container" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Graph area — fills everything */}
        <div style={{ position: "absolute", inset: 0, padding: "8px 16px" }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith('.json')) handleStixFileUpload(f); }}
        >
          <GraphView
            techniques={displayTechniques} edges={displayEdges} positions={positions}
            exposures={effectiveExposures} betweenness={betweenness} chainCoverage={chainCoverage}
            selectedTech={selectedTech} onSelectTech={setSelectedTech}
            highlightedChains={highlightedChains}
            remediated={remediated}
            optimalSet={optimal.selected}
            viewHeight={viewHeight}
            viewWidth={viewWidth}
            phaseCenters={phaseCenters}
            onNodeDrag={handleNodeDrag}
            searchMatches={techSearchMatches}
            collapsedTactics={collapsedTactics}
            onToggleCollapse={(tacId) => setCollapsedTactics(prev => {
              const next = new Set(prev);
              if (next.has(tacId)) next.delete(tacId); else next.add(tacId);
              try { localStorage.setItem("attackPathOptimizer_collapsed", JSON.stringify([...next])); } catch(e) {}
              return next;
            })}
            isolateChain={isolateChain}
            chainBuilderMode={chainBuilderMode}
            chainBuilderPath={chainBuilderPath}
            onChainBuilderClick={(techId) => {
              if (!chainBuilderPath.includes(techId)) setChainBuilderPath(prev => [...prev, techId]);
            }}
            gapNodes={gapNodeSet}
            techDescriptions={activeTechDescriptions}
          />
          {chainBuilderMode && (
            <div style={{
              position: "absolute", top: 8, left: 16, right: 16,
              background: "#1e293bee", border: "1px solid #a855f7", borderRadius: 6,
              padding: "10px 14px", zIndex: 15,
              display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700 }}>CHAIN BUILDER</span>
              <div style={{ flex: 1, display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
                {chainBuilderPath.length === 0 ? (
                  <span style={{ fontSize: "9px", color: "#64748b" }}>Click nodes to build a path...</span>
                ) : chainBuilderPath.map((tid, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: "9px", color: "#a855f7" }}>{"\u2192"}</span>}
                    <span style={{ fontSize: "9px", color: "#e2e8f0", background: "#a855f720", padding: "2px 5px", borderRadius: 3 }}>{tid}</span>
                  </React.Fragment>
                ))}
              </div>
              <input type="text" value={chainBuilderName} onChange={e => setChainBuilderName(e.target.value)}
                placeholder="Chain name..."
                style={{ background: "#0a0f1a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 4, padding: "3px 8px", fontSize: "10px", fontFamily: "inherit", width: "120px" }} />
              <button onClick={() => setChainBuilderPath(prev => prev.slice(0, -1))} disabled={chainBuilderPath.length === 0}
                style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 3, padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit", opacity: chainBuilderPath.length === 0 ? 0.3 : 1 }}>UNDO</button>
              <button onClick={() => setChainBuilderPath([])}
                style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef444466", borderRadius: 3, padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit" }}>CLEAR</button>
              <button onClick={() => {
                if (chainBuilderPath.length < 2) return;
                const name = chainBuilderName.trim() || ("Custom Chain " + (customChains.length + 1));
                const newChain = { name, description: "Custom chain", sector: "all", path: [...chainBuilderPath], severity: 0.5, custom: true };
                setCustomChains(prev => {
                  const next = [...prev, newChain];
                  try { localStorage.setItem("attackPathOptimizer_customChains", JSON.stringify(next)); } catch(e) {}
                  return next;
                });
                setChainBuilderPath([]);
                setChainBuilderName("");
              }} disabled={chainBuilderPath.length < 2}
                style={{
                  background: chainBuilderPath.length < 2 ? "#334155" : "#a855f7",
                  color: chainBuilderPath.length < 2 ? "#475569" : "#fff",
                  border: "none", borderRadius: 3, padding: "3px 10px", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>SAVE</button>
            </div>
          )}
          {stixLoading && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(10,15,26,0.85)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#f59e0b", marginBottom: "8px", animation: "stix-pulse 1.5s ease-in-out infinite" }}>
                  Fetching STIX data...
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Downloading from MITRE ATT&CK GitHub (~25MB)</div>
              </div>
            </div>
          )}
        </div>

        {/* Legend bar — floats above panels */}
        <div style={{
          position: "absolute", bottom: showBottomPanels ? panelHeight + 4 : 4, left: 0, right: 0, zIndex: 5,
          background: "#0a0f1acc", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            display: "flex", gap: "16px", padding: "4px 24px 2px", flexWrap: "wrap",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Legend:</span>
            <LegendItem color="#ef4444" label="High exposure ring" />
            <LegendItem color="#f59e0b" label="Medium exposure ring" />
            <LegendItem color="#22c55e" label="Low exposure / remediated" />
            <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>Node size = betweenness x exposure</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>Number = chain count</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
            <span style={{ fontSize: "9px", color: "#f59e0b", border: "1px dashed #f59e0b", padding: "1px 4px", borderRadius: "8px", fontSize: "8px" }}>
              dashed ring = optimal target
            </span>
          </div>
          <div style={{
            display: "flex", gap: "4px", padding: "2px 24px 4px", flexWrap: "wrap",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginRight: "4px" }}>Tactics:</span>
            {TACTICS.map((tac, i) => {
              const isNewPhase = i > 0 && tac.phase !== TACTICS[i - 1].phase;
              return (
                <React.Fragment key={tac.id}>
                  {i > 0 && (
                    <span style={{ fontSize: "8px", color: "#334155", margin: "0 1px" }}>{isNewPhase ? "\u2192" : "\u00b7"}</span>
                  )}
                  <span style={{
                    fontSize: "8px", color: tac.color, padding: "1px 5px",
                    background: tac.color + "15", borderRadius: "3px",
                    whiteSpace: "nowrap",
                  }}>
                    {tac.name}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom panel overlay */}
        {showBottomPanels && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: panelHeight, zIndex: 10,
            display: "flex", flexDirection: "column",
            background: "#0a0f1aee", backdropFilter: "blur(8px)",
            borderTop: "1px solid #1e293b",
          }}>
            {/* Draggable divider at top of overlay */}
            <div
              onMouseDown={startDividerDrag}
              style={{
                height: 8, flexShrink: 0, cursor: "row-resize",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: 48, height: 3, background: "#334155", borderRadius: 2 }} />
            </div>

            {/* Panels row */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
              {/* Attack Chains Panel */}
              {(() => {
                const chainsContent = (
                  <>
                    <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
                      Attack Chains ({filteredChains.length})
                      {!popoutChains && <PopoutButton onClick={() => setPopoutChains(true)} title="Pop out Attack Chains" />}
                    </h3>
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <input type="text" value={chainSearchQuery} onChange={e => setChainSearchQuery(e.target.value)}
                        placeholder="Search chains..."
                        style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 24px 4px 8px", fontSize: "10px", fontFamily: "inherit", width: "100%" }} />
                      {chainSearchQuery && (
                        <button onClick={() => setChainSearchQuery("")} style={{
                          position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#64748b",
                          cursor: "pointer", fontSize: "11px", lineHeight: 1, padding: "2px",
                        }}>{"\u2715"}</button>
                      )}
                    </div>
                    {displayedChainStatus.map((chain, i) => {
                      const activeIdx = highlightedChains.findIndex(c => c.name === chain.name);
                      const isActive = activeIdx >= 0;
                      const activeColor = isActive ? CHAIN_COLORS[activeIdx].color : null;
                      return (
                      <div key={i}
                        onClick={() => toggleHighlightedChain(chain)}
                        style={{
                          padding: "8px 10px", marginBottom: "4px", borderRadius: "4px", cursor: "pointer",
                          background: isActive ? "#1e293b" : "transparent",
                          border: "1px solid " + (isActive ? activeColor + "66" : chain.broken ? "#22c55e33" : "#ef444433"),
                          opacity: chain.broken ? 0.6 : 1,
                        }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: chain.broken ? "#22c55e" : "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
                            {isActive && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: activeColor, flexShrink: 0 }} />}
                            {chain.broken ? "\u2713 " : "\u26A0 "}{chain.name}
                            {chain.custom && <span style={{ fontSize: "7px", color: "#a855f7", background: "#a855f715", padding: "1px 4px", borderRadius: 3, marginLeft: 6, fontWeight: 700 }}>CUSTOM</span>}
                          </span>
                          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                            <span style={{
                              fontSize: "9px", padding: "1px 6px", borderRadius: "8px",
                              background: chain.severity > 0.85 ? "#ef444430" : "#f59e0b30",
                              color: chain.severity > 0.85 ? "#ef4444" : "#f59e0b",
                            }}>
                              {(chain.severity * 100).toFixed(0)}%
                            </span>
                            {chain.custom && (
                              <button onClick={(e) => {
                                e.stopPropagation();
                                setCustomChains(prev => {
                                  const next = prev.filter(c => c.name !== chain.name || c.path.join(",") !== chain.path.join(","));
                                  try { localStorage.setItem("attackPathOptimizer_customChains", JSON.stringify(next)); } catch(e) {}
                                  return next;
                                });
                              }} style={{
                                background: "transparent", color: "#ef4444", border: "none", fontSize: "10px",
                                cursor: "pointer", padding: "0 2px", lineHeight: 1,
                              }}>{"\u2715"}</button>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>{chain.description}</div>
                        <div style={{ fontSize: "8px", color: "#475569", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "2px" }}>
                          {chain.path.map((tid, j) => (
                            <span key={j} style={{
                              padding: "1px 3px", borderRadius: "2px",
                              background: remediated.has(tid) ? "#22c55e20" : (effectiveExposures[tid] ?? 1) > 0.7 ? "#ef444420" : "#1e293b",
                              color: remediated.has(tid) ? "#22c55e" : (effectiveExposures[tid] ?? 1) > 0.7 ? "#ef4444" : "#94a3b8",
                              textDecoration: remediated.has(tid) ? "line-through" : "none",
                            }}>
                              {tid}{j < chain.path.length - 1 ? " \u2192" : ""}
                            </span>
                          ))}
                        </div>
                        {chain.broken && chain.breakpoints.length > 0 && (
                          <div style={{ fontSize: "8px", color: "#22c55e", marginTop: "3px" }}>
                            Broken at: {chain.breakpoints.join(", ")}
                          </div>
                        )}
                        {/* F7: Threat Actor Profile toggle */}
                        {activeGroupProfiles[chain.name] && (
                          <>
                            <div style={{ marginTop: "4px" }}>
                              <span onClick={(e) => { e.stopPropagation(); setExpandedChainProfile(prev => prev === chain.name ? null : chain.name); }}
                                style={{ fontSize: "7px", color: "#64748b", cursor: "pointer", userSelect: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {expandedChainProfile === chain.name ? "\u25B2 HIDE PROFILE" : "\u25BC SHOW PROFILE"}
                              </span>
                            </div>
                            {expandedChainProfile === chain.name && (() => {
                              const prof = activeGroupProfiles[chain.name];
                              return (
                                <div style={{
                                  marginTop: "6px", padding: "8px", background: "#0a0f1a", border: "1px solid #1e293b",
                                  borderRadius: "4px", fontSize: "8px", color: "#94a3b8",
                                }}>
                                  {prof.country && <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Origin:</span> <span style={{ color: "#e2e8f0" }}>{prof.country}</span></div>}
                                  {prof.aliases && prof.aliases.length > 0 && <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Aliases:</span> {prof.aliases.slice(0, 5).join(", ")}</div>}
                                  {(prof.firstSeen || prof.lastSeen) && <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Active:</span> {prof.firstSeen || "?"} — {prof.lastSeen || "present"}</div>}
                                  {prof.sectors && prof.sectors.length > 0 && (
                                    <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Targeting:</span> {prof.sectors.join(", ")}</div>
                                  )}
                                  {prof.description && <div style={{ marginTop: "4px", lineHeight: "1.4", color: "#cbd5e1" }}>{prof.description}</div>}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                      );
                    })}

                    {/* F6: Chain Uniqueness Comparison */}
                    {chainSetAnalysis && (
                      <div style={{
                        marginTop: "12px", padding: "10px", background: "#1e293b", borderRadius: "6px",
                        border: "1px solid #334155",
                      }}>
                        <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Chain Comparison</div>
                        {chainSetAnalysis.intersection.size > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "8px", color: "#f59e0b", marginBottom: "3px" }}>
                              Shared by all ({chainSetAnalysis.intersection.size}):
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                              {[...chainSetAnalysis.intersection].map(tid => (
                                <span key={tid} style={{
                                  fontSize: "8px", padding: "1px 4px", borderRadius: "2px",
                                  background: "#f59e0b20", color: "#f59e0b",
                                }}>{tid}</span>
                              ))}
                            </div>
                            <div style={{ fontSize: "7px", color: "#f59e0b", marginTop: "3px", fontStyle: "italic" }}>
                              Fix any to disrupt all {highlightedChains.length} chains
                            </div>
                          </div>
                        )}
                        {chainSetAnalysis.uniquePerChain.map(({ name, colorIndex, unique }) => {
                          if (unique.size === 0) return null;
                          const color = CHAIN_COLORS[colorIndex % CHAIN_COLORS.length].color;
                          return (
                            <div key={name} style={{ marginBottom: "6px" }}>
                              <div style={{ fontSize: "8px", color, marginBottom: "2px" }}>Only in {name} ({unique.size}):</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                                {[...unique].map(tid => (
                                  <span key={tid} style={{
                                    fontSize: "8px", padding: "1px 4px", borderRadius: "2px",
                                    background: color + "20", color,
                                  }}>{tid}</span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: "8px", color: "#64748b", marginTop: "6px", borderTop: "1px solid #33415560", paddingTop: "4px" }}>
                          Union: {chainSetAnalysis.union.size} | Overlap: {chainSetAnalysis.intersection.size}
                        </div>
                      </div>
                    )}
                  </>
                );
                return (
                  <div style={{ flex: "1 1 280px", borderRight: "1px solid #1e293b", padding: popoutChains ? 0 : "12px 16px", overflow: "auto" }}>
                    {popoutChains ? (
                      <>
                        <PopoutPlaceholder label="Attack Chains" onRestore={() => setPopoutChains(false)} />
                        <PopoutPanel title={"Attack Chains (" + filteredChains.length + ")"} width={500} height={700} onClose={() => setPopoutChains(false)}>
                          {chainsContent}
                        </PopoutPanel>
                      </>
                    ) : chainsContent}
                  </div>
                );
              })()}

              {/* Priority Ranking Panel */}
              {(() => {
                const priorityContent = (
                  <>
                    <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
                      Remediation Priority
                      {!popoutPriority && <PopoutButton onClick={() => setPopoutPriority(true)} title="Pop out Priority" />}
                    </h3>
                    {priorityRanking.map((t, i) => (
                      <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", marginBottom: "3px",
                        borderRadius: "4px", background: selectedTech === t.id ? "#1e293b" : "transparent",
                        cursor: "pointer",
                      }} onClick={() => { setSelectedTech(t.id); }}>
                        <span style={{ fontSize: "10px", color: "#475569", width: "16px" }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: "#f8fafc" }}>{t.id}</div>
                          <div style={{ fontSize: "8px", color: "#64748b" }}>{t.name}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700 }}>{(t.priority * 100).toFixed(0)}</div>
                          <div style={{ fontSize: "7px", color: "#475569" }}>
                            E:{(t.exposure * 100).toFixed(0)} B:{(t.betweennessVal * 100).toFixed(0)} C:{t.chainCount}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleRemediate(t.id); }}
                          style={{
                            background: optimal.selected.includes(t.id) ? "#f59e0b" : "#334155",
                            color: optimal.selected.includes(t.id) ? "#0a0f1a" : "#94a3b8",
                            border: "none", borderRadius: "3px", padding: "3px 6px",
                            fontSize: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                          }}>
                          FIX
                        </button>
                      </div>
                    ))}
                  </>
                );
                return (
                  <div style={{ flex: "1 1 240px", borderRight: "1px solid #1e293b", padding: popoutPriority ? 0 : "12px 16px", overflow: "auto" }}>
                    {popoutPriority ? (
                      <>
                        <PopoutPlaceholder label="Remediation Priority" onRestore={() => setPopoutPriority(false)} />
                        <PopoutPanel title="Remediation Priority" width={400} height={600} onClose={() => setPopoutPriority(false)}>
                          {priorityContent}
                        </PopoutPanel>
                      </>
                    ) : priorityContent}
                  </div>
                );
              })()}

              {/* Detail / Exposure Panel */}
              {(() => {
                const detailContent = (
                  <>
                    {selectedTechData ? (
                      <>
                        <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
                          Node Detail: {selectedTechData.id}
                          {!popoutDetail && <PopoutButton onClick={() => setPopoutDetail(true)} title="Pop out Detail" />}
                        </h3>
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{selectedTechData.name}</div>
                          <div style={{ fontSize: "9px", color: selectedTactic?.color, marginTop: "2px" }}>
                            {selectedTactic?.name} ({selectedTactic?.id})
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                          <MetricBox label="Betweenness" value={((betweenness[selectedTech] ?? 0) * 100).toFixed(1)} unit="%" color="#3b82f6" />
                          <MetricBox label="Chain Count" value={chainCoverage[selectedTech] ?? 0} unit={"/" + filteredChains.length} color="#6366f1" />
                          <MetricBox label="Exposure" value={((effectiveExposures[selectedTech] ?? 1) * 100).toFixed(0)} unit="%" color={
                            (effectiveExposures[selectedTech] ?? 1) > 0.7 ? "#ef4444" : (effectiveExposures[selectedTech] ?? 1) > 0.4 ? "#f59e0b" : "#22c55e"
                          } />
                          <MetricBox label="Priority Score" value={(
                            (betweenness[selectedTech] ?? 0) * (effectiveExposures[selectedTech] ?? 1) * (chainCoverage[selectedTech] ?? 0) / Math.max(filteredChains.length, 1) * 100
                          ).toFixed(1)} unit="pts" color="#f59e0b" />
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ fontSize: "9px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                            Adjust Exposure ({selectedTech})
                          </label>
                          <input type="range" min={0} max={100} value={((exposures[selectedTech] ?? 1) * 100)}
                            onChange={e => handleExposureChange(selectedTech, e.target.value / 100)}
                            style={{ width: "100%", accentColor: "#f59e0b" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#475569" }}>
                            <span>Fully Mitigated</span><span>Fully Exposed</span>
                          </div>
                          {deployedControls.size > 0 && (exposures[selectedTech] ?? 1) !== (effectiveExposures[selectedTech] ?? 1) && (
                            <div style={{ fontSize: "8px", color: "#14b8a6", marginTop: "2px" }}>
                              Control-adjusted: {((effectiveExposures[selectedTech] ?? 1) * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {/* F1: Control Impact Breakdown */}
                        {(() => {
                          const applied = SECURITY_CONTROLS.filter(c => deployedControls.has(c.id) && c.coverage[selectedTech]);
                          if (applied.length === 0) return null;
                          const baseExp = exposures[selectedTech] ?? 1;
                          const effExp = effectiveExposures[selectedTech] ?? 1;
                          const netReduction = baseExp > 0 ? ((1 - effExp / baseExp) * 100).toFixed(0) : 0;
                          return (
                            <div style={{ marginBottom: "12px", padding: "8px", background: "#14b8a608", border: "1px solid #14b8a620", borderRadius: "4px" }}>
                              <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Applied Controls</div>
                              {applied.map(ctrl => {
                                const cat = CONTROL_CATEGORIES.find(c => c.id === ctrl.category);
                                return (
                                  <div key={ctrl.id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                    <span style={{
                                      fontSize: "7px", padding: "1px 4px", borderRadius: "2px",
                                      background: (cat?.color || "#64748b") + "20", color: cat?.color || "#64748b",
                                    }}>{cat?.name?.split(" / ")[0] || ctrl.category}</span>
                                    <span style={{ fontSize: "9px", color: "#e2e8f0", flex: 1 }}>{ctrl.name}</span>
                                    <span style={{ fontSize: "9px", color: "#14b8a6", fontWeight: 700 }}>
                                      {(ctrl.coverage[selectedTech] * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                );
                              })}
                              <div style={{ fontSize: "8px", color: "#14b8a6", marginTop: "4px", borderTop: "1px solid #14b8a615", paddingTop: "4px" }}>
                                Net reduction: {netReduction}% (multiplicative)
                              </div>
                            </div>
                          );
                        })()}

                        <button onClick={() => toggleRemediate(selectedTech)}
                          style={{
                            width: "100%", padding: "8px",
                            background: remediated.has(selectedTech) ? "#22c55e20" : "#f59e0b",
                            color: remediated.has(selectedTech) ? "#22c55e" : "#0a0f1a",
                            border: remediated.has(selectedTech) ? "1px solid #22c55e" : "none",
                            borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          }}>
                          {remediated.has(selectedTech) ? "\u2713 REMEDIATED \u2014 UNDO" : "MARK AS REMEDIATED"}
                        </button>

                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "4px" }}>Appears in chains:</div>
                          {filteredChains.filter(c => c.path.includes(selectedTech)).map((c, i) => (
                            <div key={i} style={{
                              fontSize: "9px", color: "#94a3b8", padding: "2px 0",
                              cursor: "pointer", textDecoration: chainStatus[filteredChains.indexOf(c)]?.broken ? "line-through" : "none",
                              opacity: chainStatus[filteredChains.indexOf(c)]?.broken ? 0.5 : 1,
                            }} onClick={() => toggleHighlightedChain(c)}>
                              {"\u2192"} {c.name}
                            </div>
                          ))}
                        </div>

                        {/* Contextual Technique Examples */}
                        <div style={{ marginTop: "16px" }}>
                          {(() => {
                            const TRUNC = 150;
                            const truncate = (text) => {
                              if (!text || text.length <= TRUNC || expandedExamples) return text;
                              return text.slice(0, text.lastIndexOf(' ', TRUNC) || TRUNC) + '...';
                            };
                            const chainsWithTech = highlightedChains.filter(c => c.path.includes(selectedTech));
                            const anyLong = (() => {
                              if (chainsWithTech.length > 0) {
                                for (const c of chainsWithTech) {
                                  const ctx = getChainTechContext(c.name, selectedTech);
                                  if (ctx && ctx.length > TRUNC) return true;
                                }
                                if (techExamples?.summary?.length > TRUNC) return true;
                                return false;
                              }
                              return techExamples?.summary?.length > TRUNC;
                            })();
                            if (chainsWithTech.length > 0) {
                              return (
                                <>
                                  <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Threat Actor Context</div>
                                  {chainsWithTech.map((c, i) => {
                                    const colorIdx = highlightedChains.indexOf(c);
                                    const chainColor = CHAIN_COLORS[colorIdx % CHAIN_COLORS.length].color;
                                    const ctx = getChainTechContext(c.name, selectedTech);
                                    return (
                                      <div key={i} style={{
                                        borderLeft: "2px solid " + chainColor,
                                        paddingLeft: "8px",
                                        marginBottom: "8px",
                                      }}>
                                        <div style={{ fontSize: "9px", fontWeight: 700, color: chainColor, marginBottom: "2px" }}>{c.name}</div>
                                        <div style={{ fontSize: "9px", color: ctx ? "#cbd5e1" : "#475569", fontStyle: ctx ? "normal" : "italic", lineHeight: "1.4" }}>
                                          {ctx ? truncate(ctx) : "No specific context available for this technique"}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {techExamples && (
                                    <div style={{ marginTop: "8px", opacity: 0.5 }}>
                                      <div style={{ fontSize: "8px", color: "#64748b", marginBottom: "2px" }}>General usage:</div>
                                      <div style={{ fontSize: "8px", color: "#94a3b8", lineHeight: "1.4" }}>{truncate(techExamples.summary)}</div>
                                    </div>
                                  )}
                                  {anyLong && (
                                    <div style={{ marginTop: "4px", textAlign: "right" }}>
                                      <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                                        fontSize: "8px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                                      }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            if (techExamples) {
                              return (
                                <>
                                  <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Real-World Usage</div>
                                  <div style={{ fontSize: "9px", color: "#cbd5e1", lineHeight: "1.4", marginBottom: "6px" }}>{truncate(techExamples.summary)}</div>
                                  {(expandedExamples || techExamples.summary.length <= TRUNC) && techExamples.examples.length > 0 && (
                                    <ul style={{ margin: "0", paddingLeft: "14px" }}>
                                      {techExamples.examples.map((ex, i) => (
                                        <li key={i} style={{ fontSize: "8px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "2px" }}>{ex}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {anyLong && (
                                    <div style={{ marginTop: "4px", textAlign: "right" }}>
                                      <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                                        fontSize: "8px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                                      }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return (
                              <div style={{ fontSize: "9px", color: "#475569", fontStyle: "italic" }}>No usage examples available for this technique</div>
                            );
                          })()}
                        </div>

                        {/* F3: MITRE Mitigations */}
                        {(() => {
                          const mits = activeMitigations[selectedTech];
                          if (!mits || mits.length === 0) return null;
                          return (
                            <div style={{ marginTop: "16px" }}>
                              <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>MITRE Mitigations</div>
                              {mits.map((m, i) => {
                                const mappedCtrl = MITIGATION_CONTROL_MAP[m.name];
                                const isDeployed = mappedCtrl && deployedControls.has(mappedCtrl);
                                return (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "10px", color: isDeployed ? "#22c55e" : "#64748b" }}>{isDeployed ? "\u2713" : "\u25CB"}</span>
                                    <span style={{ fontSize: "8px", color: "#475569", minWidth: "38px" }}>{m.mitreId}</span>
                                    <span style={{ fontSize: "9px", color: isDeployed ? "#22c55e" : "#e2e8f0" }}>{m.name}</span>
                                    {mappedCtrl && (
                                      <span style={{ fontSize: "7px", color: isDeployed ? "#22c55e" : "#f59e0b", marginLeft: "auto" }}>
                                        {isDeployed ? "deployed" : "available"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div style={{ color: "#475569", fontSize: "11px", paddingTop: "40px", textAlign: "center" }}>
                        Click a node to inspect
                      </div>
                    )}
                  </>
                );
                return (
                  <div style={{ flex: "1 1 240px", padding: popoutDetail ? 0 : "12px 16px", overflow: "auto" }}>
                    {popoutDetail ? (
                      <>
                        <PopoutPlaceholder label="Node Detail" onRestore={() => setPopoutDetail(false)} />
                        <PopoutPanel title={"Node Detail" + (selectedTechData ? ": " + selectedTechData.id : "")} width={400} height={700} onClose={() => setPopoutDetail(false)}>
                          {detailContent}
                        </PopoutPanel>
                      </>
                    ) : detailContent}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>{/* end split-container */}

      {/* Phase 5: Security Controls Panel */}
      {(() => {
        const controlsContent = (
          <>
            <h3 style={{ fontSize: "11px", color: "#14b8a6", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
              SECURITY CONTROLS
              {!popoutControls && <PopoutButton onClick={() => setPopoutControls(true)} title="Pop out Controls" />}
              <select value={controlPreset} onChange={e => {
                const preset = e.target.value;
                setControlPreset(preset);
                if (preset !== "none" && CONTROL_PRESETS[preset]) {
                  setDeployedControls(new Set(CONTROL_PRESETS[preset].controls));
                }
              }} style={{
                background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155",
                borderRadius: "4px", padding: "3px 8px", fontSize: "9px", fontFamily: "inherit", marginLeft: "auto",
              }}>
                {Object.entries(CONTROL_PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
              {controlPreset !== "none" && CONTROL_PRESETS[controlPreset] && (
                <span style={{ fontSize: "8px", color: "#14b8a6" }}>
                  {CONTROL_PRESETS[controlPreset].controls.filter(c => deployedControls.has(c)).length}/{CONTROL_PRESETS[controlPreset].controls.length} for {CONTROL_PRESETS[controlPreset].name}
                </span>
              )}
            </h3>
            {CONTROL_CATEGORIES.map(cat => {
              const catControls = SECURITY_CONTROLS.filter(c => c.category === cat.id);
              const catDeployed = catControls.filter(c => deployedControls.has(c.id)).length;
              const allDeployed = catDeployed === catControls.length;
              return (
                <div key={cat.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px" }}>{cat.icon}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: "9px", color: "#64748b" }}>
                      {catDeployed}/{catControls.length} deployed
                    </span>
                    <button onClick={() => {
                      setDeployedControls(prev => {
                        const next = new Set(prev);
                        if (allDeployed) {
                          catControls.forEach(c => next.delete(c.id));
                        } else {
                          catControls.forEach(c => next.add(c.id));
                        }
                        return next;
                      });
                    }} style={{
                      background: "transparent", color: allDeployed ? "#ef4444" : cat.color,
                      border: "1px solid " + (allDeployed ? "#ef444466" : cat.color + "66"),
                      borderRadius: "3px", padding: "2px 8px", fontSize: "8px", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
                    }}>
                      {allDeployed ? "CLEAR" : "DEPLOY ALL"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                    {catControls.map(ctrl => {
                      const deployed = deployedControls.has(ctrl.id);
                      const techCount = Object.keys(ctrl.coverage).filter(tid => activeTechniques.some(t => t.id === tid)).length;
                      return (
                        <div key={ctrl.id} style={{
                          background: "#0a0f1a", border: "1px solid " + (deployed ? cat.color + "30" : "#1e293b"),
                          borderRadius: "6px", padding: "10px",
                          borderLeft: "3px solid " + (deployed ? cat.color : "#1e293b"),
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: 600, color: deployed ? cat.color : "#f8fafc" }}>{ctrl.name}</div>
                              <div style={{ fontSize: "8px", color: "#64748b" }}>{ctrl.cost} · {techCount} techniques</div>
                            </div>
                            <button onClick={() => {
                              setDeployedControls(prev => {
                                const next = new Set(prev);
                                if (next.has(ctrl.id)) next.delete(ctrl.id);
                                else next.add(ctrl.id);
                                return next;
                              });
                            }} style={{
                              background: deployed ? cat.color : "#334155",
                              color: deployed ? "#0a0f1a" : "#94a3b8",
                              border: "none", borderRadius: "4px", padding: "3px 8px",
                              fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            }}>
                              {deployed ? "DEPLOYED" : "DEPLOY"}
                            </button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                            {Object.entries(ctrl.coverage).map(([tid, red]) => (
                              <span key={tid} style={{
                                fontSize: "7px", padding: "1px 3px", borderRadius: "2px",
                                background: deployed ? cat.color + "15" : "#1e293b",
                                color: deployed ? cat.color : "#475569",
                              }}>
                                {tid} ({(red * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* Summary */}
            {deployedControls.size > 0 && (() => {
              const baseAvg = activeTechniques.reduce((s, t) => s + (exposures[t.id] ?? 1), 0) / activeTechniques.length;
              const effAvg = activeTechniques.reduce((s, t) => s + (effectiveExposures[t.id] ?? 1), 0) / activeTechniques.length;
              const reduction = baseAvg > 0 ? ((baseAvg - effAvg) / baseAvg * 100).toFixed(1) : "0.0";
              const costTally = {};
              SECURITY_CONTROLS.forEach(c => {
                if (!deployedControls.has(c.id)) return;
                const tier = c.cost;
                costTally[tier] = (costTally[tier] || 0) + 1;
              });
              const costSummary = Object.entries(costTally).sort((a, b) => b[0].length - a[0].length).map(([t, n]) => n + "x" + t).join("  ");
              return (
                <div style={{ marginTop: "8px", padding: "10px 12px", background: "#14b8a610", borderRadius: "4px" }}>
                  <div style={{ fontSize: "10px", color: "#14b8a6", marginBottom: "6px" }}>
                    {deployedControls.size} control{deployedControls.size === 1 ? "" : "s"} deployed — average exposure reduced by {reduction}%
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "9px" }}>
                    {CONTROL_CATEGORIES.map(cat => {
                      const catCtrls = SECURITY_CONTROLS.filter(c => c.category === cat.id);
                      const catDep = catCtrls.filter(c => deployedControls.has(c.id)).length;
                      return (
                        <span key={cat.id} style={{ color: catDep > 0 ? cat.color : "#475569" }}>
                          {cat.icon} {cat.name.split(" / ")[0]}: {catDep}/{catCtrls.length}
                        </span>
                      );
                    })}
                    <span style={{ color: "#64748b", marginLeft: "auto" }}>Cost: {costSummary}</span>
                  </div>
                </div>
              );
            })()}
          </>
        );
        return (
          <>
            {showControls && !popoutControls && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "45vh", overflow: "auto",
              }}>
                {controlsContent}
              </div>
            )}
            {showControls && popoutControls && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Security Controls" onRestore={() => setPopoutControls(false)} />
              </div>
            )}
            {popoutControls && (
              <PopoutPanel title="Security Controls" width={900} height={600} onClose={() => setPopoutControls(false)}>
                {controlsContent}
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Analysis Panel */}
      {(() => {
        const analysisContent = (
          <>
            <h3 style={{ fontSize: "11px", color: "#f59e0b", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
              OPTIMIZATION ANALYSIS
              {!popoutAnalysis && <PopoutButton onClick={() => setPopoutAnalysis(true)} title="Pop out Analysis" />}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <AnalysisCard title="Greedy Set Cover Result">
                <p>With a budget of <strong style={{ color: "#f59e0b" }}>{remediationBudget}</strong> remediations,
                the optimal selection disrupts <strong style={{ color: "#22c55e" }}>{optimal.chainsDisrupted}/{optimal.chainsTotal}</strong> attack chains.</p>
                <p style={{ marginTop: "6px" }}>Optimal targets: {optimal.selected.map(id => {
                  const t = activeTechniques.find(t => t.id === id);
                  return t ? id + " (" + t.name + ")" : id;
                }).join(", ")}</p>
                <p style={{ marginTop: "6px", color: "#64748b" }}>
                  Algorithm: Greedy weighted maximum coverage. Each iteration selects the technique
                  that covers the most remaining unchained paths, weighted by severity x exposure.
                  Guaranteed {"\u2265"}63% of optimal (1 - 1/e approximation bound).
                </p>
              </AnalysisCard>
              <AnalysisCard title="Chokepoint Analysis">
                <p>Highest betweenness centrality nodes (most paths flow through):</p>
                {activeTechniques
                  .map(t => ({ ...t, bc: betweenness[t.id] ?? 0 }))
                  .sort((a, b) => b.bc - a.bc)
                  .slice(0, 5)
                  .map((t, i) => (
                    <div key={i} style={{ fontSize: "10px", marginTop: "4px" }}>
                      <span style={{ color: "#f59e0b" }}>{t.id}</span> {t.name} — centrality: {(t.bc * 100).toFixed(1)}%
                      {remediated.has(t.id) && <span style={{ color: "#22c55e" }}> {"\u2713"}</span>}
                    </div>
                  ))
                }
              </AnalysisCard>
              <AnalysisCard title="Risk Posture Summary">
                {(() => {
                  const avgExposure = activeTechniques.reduce((s, t) => s + (effectiveExposures[t.id] ?? 1), 0) / activeTechniques.length;
                  const highExposed = activeTechniques.filter(t => (effectiveExposures[t.id] ?? 1) > 0.7).length;
                  const disruptionRate = totalDisrupted / Math.max(filteredChains.length, 1);
                  return (
                    <>
                      <p>Average node exposure: <strong style={{
                        color: avgExposure > 0.6 ? "#ef4444" : avgExposure > 0.3 ? "#f59e0b" : "#22c55e"
                      }}>{(avgExposure * 100).toFixed(0)}%</strong></p>
                      <p>High-exposure nodes ({">"}70%): <strong style={{ color: "#ef4444" }}>{highExposed}</strong> of {activeTechniques.length}</p>
                      <p>Chain disruption rate: <strong style={{
                        color: disruptionRate > 0.8 ? "#22c55e" : disruptionRate > 0.5 ? "#f59e0b" : "#ef4444"
                      }}>{(disruptionRate * 100).toFixed(0)}%</strong></p>
                      <p style={{ marginTop: "6px", color: "#64748b" }}>
                        {disruptionRate === 1 ? "All known attack chains have at least one broken link." :
                          disruptionRate > 0.7 ? "Good coverage but some chains remain viable." :
                            disruptionRate > 0.4 ? "Moderate risk \u2014 several attack paths remain open." :
                              "Critical risk \u2014 majority of attack paths are unimpeded."}
                      </p>
                    </>
                  );
                })()}
              </AnalysisCard>
            </div>
          </>
        );
        return (
          <>
            {showAnalysis && !popoutAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "40vh", overflow: "auto",
              }}>
                {analysisContent}
              </div>
            )}
            {showAnalysis && popoutAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Analysis" onRestore={() => setPopoutAnalysis(false)} />
              </div>
            )}
            {popoutAnalysis && (
              <PopoutPanel title="Optimization Analysis" width={900} height={500} onClose={() => setPopoutAnalysis(false)}>
                {analysisContent}
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Executive Summary Panel */}
      {(() => {
        const execProps = {
          techniques: displayTechniques, exposures: effectiveExposures, betweenness, chainCoverage,
          filteredChains, chainStatus, remediated, optimal, deployedControls,
        };
        return (
          <>
            {showExecutiveSummary && !popoutExecutive && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "50vh", overflow: "auto",
              }}>
                <ExecutiveSummary {...execProps} popout={false} onPopout={() => setPopoutExecutive(true)} />
              </div>
            )}
            {showExecutiveSummary && popoutExecutive && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Executive Summary" onRestore={() => setPopoutExecutive(false)} />
              </div>
            )}
            {popoutExecutive && (
              <PopoutPanel title="Executive Summary" width={600} height={800} onClose={() => setPopoutExecutive(false)}>
                <ExecutiveSummary {...execProps} popout={true} />
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Gap Analysis Panel */}
      {(() => {
        const gapContent = (
          <>
            <h3 style={{ fontSize: "11px", color: "#ef4444", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
              CONTROL GAP ANALYSIS
              {!popoutGapAnalysis && <PopoutButton onClick={() => setPopoutGapAnalysis(true)} title="Pop out Gap Analysis" />}
              <button onClick={exportRemediationPlan} disabled={gapAnalysis.gaps.length === 0} style={{
                background: "transparent", color: gapAnalysis.gaps.length === 0 ? "#475569" : "#ef4444",
                border: "1px solid " + (gapAnalysis.gaps.length === 0 ? "#334155" : "#ef4444"),
                borderRadius: "4px", padding: "3px 10px", fontSize: "9px", fontWeight: 700,
                cursor: gapAnalysis.gaps.length === 0 ? "default" : "pointer", fontFamily: "inherit",
                marginLeft: "auto", opacity: gapAnalysis.gaps.length === 0 ? 0.4 : 1,
              }}>EXPORT PLAN</button>
            </h3>
            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ background: "#ef444415", border: "1px solid #ef444433", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444" }}>{gapAnalysis.noCoverageCount}</div>
                <div style={{ fontSize: "8px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>No Coverage</div>
              </div>
              <div style={{ background: "#f59e0b15", border: "1px solid #f59e0b33", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b" }}>{gapAnalysis.notDeployedCount}</div>
                <div style={{ fontSize: "8px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Not Deployed</div>
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#e2e8f0" }}>{gapAnalysis.gaps.length}</div>
                <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Gaps</div>
              </div>
              {/* F8: Priority tier counts */}
              {gapAnalysis.gaps.length > 0 && (() => {
                const tiers = { Critical: 0, High: 0, Medium: 0, Low: 0 };
                gapAnalysis.gaps.forEach(g => {
                  const s = g.riskScore;
                  if (s > 0.5) tiers.Critical++;
                  else if (s > 0.2) tiers.High++;
                  else if (s > 0.05) tiers.Medium++;
                  else tiers.Low++;
                });
                const tierColors = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#64748b" };
                return Object.entries(tiers).filter(([, n]) => n > 0).map(([tier, n]) => (
                  <div key={tier} style={{ background: tierColors[tier] + "15", border: "1px solid " + tierColors[tier] + "33", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: tierColors[tier] }}>{n}</div>
                    <div style={{ fontSize: "8px", color: tierColors[tier], textTransform: "uppercase", letterSpacing: "0.5px" }}>{tier}</div>
                  </div>
                ));
              })()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {gapAnalysis.gaps.map(gap => {
                const tactic = TACTICS.find(ta => ta.id === gap.tactic);
                const isNoCoverage = gap.gapType === "no-coverage";
                return (
                  <div key={gap.id} onClick={() => setSelectedTech(gap.id)} style={{
                    background: "#0a0f1a", border: "1px solid " + (isNoCoverage ? "#ef444433" : "#f59e0b33"),
                    borderRadius: 6, padding: "10px 12px", cursor: "pointer",
                    borderLeft: "3px solid " + (isNoCoverage ? "#ef4444" : "#f59e0b"),
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>
                          {gap.id} — {gap.name}
                        </div>
                        <div style={{ fontSize: "9px", color: tactic?.color, marginTop: "1px" }}>{tactic?.name}</div>
                      </div>
                      <span style={{
                        fontSize: "7px", fontWeight: 700, padding: "2px 6px", borderRadius: "8px",
                        background: isNoCoverage ? "#ef444425" : "#f59e0b25",
                        color: isNoCoverage ? "#ef4444" : "#f59e0b",
                        whiteSpace: "nowrap",
                      }}>
                        {isNoCoverage ? "NO COVERAGE" : "NOT DEPLOYED"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", fontSize: "9px", marginBottom: "6px" }}>
                      <span style={{ color: gap.exposure > 0.7 ? "#ef4444" : gap.exposure > 0.4 ? "#f59e0b" : "#22c55e" }}>
                        Exp: {(gap.exposure * 100).toFixed(0)}%
                      </span>
                      <span style={{ color: "#3b82f6" }}>BC: {(gap.bc * 100).toFixed(1)}%</span>
                      <span style={{ color: "#6366f1" }}>Chains: {gap.cc}</span>
                    </div>
                    {gap.availableControls.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                        {gap.availableControls.map(ctrl => (
                          <span key={ctrl.id} style={{
                            fontSize: "7px", padding: "1px 4px", borderRadius: 2,
                            background: "#1e293b", color: "#94a3b8",
                          }}>
                            {ctrl.name} ({ctrl.cost})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {gapAnalysis.gaps.length === 0 && (
              <div style={{ textAlign: "center", color: "#22c55e", fontSize: "11px", padding: "20px" }}>
                All techniques have at least one deployed control.
              </div>
            )}
          </>
        );
        return (
          <>
            {showGapAnalysis && !popoutGapAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "45vh", overflow: "auto",
              }}>
                {gapContent}
              </div>
            )}
            {showGapAnalysis && popoutGapAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Gap Analysis" onRestore={() => setPopoutGapAnalysis(false)} />
              </div>
            )}
            {popoutGapAnalysis && (
              <PopoutPanel title="Control Gap Analysis" width={900} height={600} onClose={() => setPopoutGapAnalysis(false)}>
                {gapContent}
              </PopoutPanel>
            )}
          </>
        );
      })()}
    </div>
  );
}

function ExecutiveSummary({ techniques, exposures, betweenness, chainCoverage, filteredChains,
  chainStatus, remediated, optimal, deployedControls, popout, onPopout }) {
  const avgExposure = techniques.reduce((s, t) => s + (exposures[t.id] ?? 1), 0) / Math.max(techniques.length, 1);
  const highExposed = techniques.filter(t => (exposures[t.id] ?? 1) > 0.7).length;
  const totalDisrupted = chainStatus.filter(c => c.broken).length;
  const disruptionRate = totalDisrupted / Math.max(filteredChains.length, 1);
  const riskScore = Math.round(Math.min(100, (avgExposure * 40 + (1 - disruptionRate) * 35 + (highExposed / Math.max(techniques.length, 1)) * 25)));
  const riskColor = riskScore > 70 ? "#ef4444" : riskScore > 40 ? "#f59e0b" : "#22c55e";

  const topRisks = techniques
    .map(t => ({ ...t, exposure: exposures[t.id] ?? 1, bc: betweenness[t.id] ?? 0, cc: chainCoverage[t.id] ?? 0 }))
    .sort((a, b) => (b.exposure * b.bc) - (a.exposure * a.bc))
    .filter(t => !remediated.has(t.id))
    .slice(0, 5);

  const tacticExposures = {};
  TACTICS.forEach(tac => {
    const tacTechs = techniques.filter(t => t.tactic === tac.id);
    if (tacTechs.length === 0) return;
    const avg = tacTechs.reduce((s, t) => s + (exposures[t.id] ?? 1), 0) / tacTechs.length;
    tacticExposures[tac.id] = { avg, count: tacTechs.length, name: tac.name, color: tac.color };
  });
  const coverageGaps = Object.values(tacticExposures).sort((a, b) => b.avg - a.avg).slice(0, 5);

  const topUndeployedControls = SECURITY_CONTROLS
    .filter(c => !deployedControls.has(c.id))
    .map(c => {
      const totalReduction = Object.values(c.coverage).reduce((s, v) => s + Math.abs(v), 0);
      return { ...c, impact: totalReduction };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const sectionStyle = { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "16px 20px", marginBottom: 12 };
  const labelStyle = { fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 };

  return (
    <>
      <h3 style={{ fontSize: "12px", color: "#06b6d4", margin: "0 0 14px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
        EXECUTIVE SUMMARY
        {!popout && onPopout && <PopoutButton onClick={onPopout} title="Pop out Executive Summary" />}
      </h3>

      {/* Risk Score */}
      <div style={{ ...sectionStyle, textAlign: "center" }}>
        <div style={labelStyle}>Overall Risk Score</div>
        <div style={{ fontSize: "48px", fontWeight: 700, color: riskColor, lineHeight: 1.1 }}>{riskScore}</div>
        <div style={{ fontSize: "10px", color: "#64748b", marginTop: 4 }}>
          {riskScore > 70 ? "Critical — Immediate action required" : riskScore > 40 ? "Moderate — Improvements recommended" : "Good — Maintain current posture"}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Key Metrics</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { label: "Techniques", value: techniques.length, color: "#6366f1" },
            { label: "Attack Chains", value: filteredChains.length, color: "#8b5cf6" },
            { label: "Disruption Rate", value: (disruptionRate * 100).toFixed(0) + "%", color: disruptionRate > 0.7 ? "#22c55e" : "#f59e0b" },
            { label: "Avg Exposure", value: (avgExposure * 100).toFixed(0) + "%", color: avgExposure > 0.6 ? "#ef4444" : "#f59e0b" },
            { label: "Remediated", value: remediated.size, color: "#22c55e" },
            { label: "Controls Deployed", value: deployedControls.size, color: "#14b8a6" },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: "8px", color: "#64748b" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Risks */}
      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Top 5 Risks</div>
        {topRisks.map((t, i) => {
          const tactic = TACTICS.find(ta => ta.id === t.tactic);
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? "1px solid #1e293b" : "none" }}>
              <span style={{ fontSize: "12px", color: "#475569", width: 20, fontWeight: 700 }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>{t.id} — {t.name}</div>
                <div style={{ fontSize: "9px", color: tactic?.color }}>{tactic?.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: t.exposure > 0.7 ? "#ef4444" : "#f59e0b" }}>{(t.exposure * 100).toFixed(0)}%</div>
                <div style={{ fontSize: "8px", color: "#475569" }}>exposure</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coverage Gaps */}
      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Coverage Gaps (Highest Exposure Tactics)</div>
        {coverageGaps.map((tac, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: 2 }}>
              <span style={{ color: tac.color }}>{tac.name}</span>
              <span style={{ color: tac.avg > 0.7 ? "#ef4444" : "#f59e0b" }}>{(tac.avg * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (tac.avg * 100) + "%", background: tac.color, borderRadius: 3, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Actions */}
      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Recommended Actions</div>
        <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: 8 }}>Top remediation targets:</div>
        {optimal.selected.slice(0, 3).map((id, i) => {
          const t = techniques.find(t => t.id === id);
          return (
            <div key={id} style={{ fontSize: "10px", color: "#f59e0b", padding: "3px 0" }}>
              {i + 1}. Remediate <strong>{id}</strong>{t ? " (" + t.name + ")" : ""}
            </div>
          );
        })}
        {topUndeployedControls.length > 0 && (
          <>
            <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: 10, marginBottom: 4 }}>Top undeployed controls:</div>
            {topUndeployedControls.map((c, i) => (
              <div key={c.id} style={{ fontSize: "10px", color: "#14b8a6", padding: "3px 0" }}>
                {i + 1}. Deploy <strong>{c.name}</strong> ({c.cost})
              </div>
            ))}
          </>
        )}
      </div>

      {/* Tactic Heatmap */}
      <div style={{ ...sectionStyle }}>
        <div style={labelStyle}>Tactic Exposure Heatmap</div>
        {TACTICS.map(tac => {
          const info = tacticExposures[tac.id];
          if (!info) return null;
          return (
            <div key={tac.id} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: 1 }}>
                <span style={{ color: tac.color }}>{tac.name}</span>
                <span style={{ color: "#64748b" }}>{(info.avg * 100).toFixed(0)}% ({info.count})</span>
              </div>
              <div style={{ height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: (info.avg * 100) + "%", borderRadius: 4,
                  background: info.avg > 0.7 ? "#ef4444" : info.avg > 0.4 ? "#f59e0b" : "#22c55e",
                  opacity: 0.8,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color: color }}>{value}</span>
      <span style={{ fontSize: "9px", color: "#64748b" }}>{label}</span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "9px", color: "#94a3b8" }}>{label}</span>
    </div>
  );
}

function MetricBox({ label, value, unit, color }) {
  return (
    <div style={{
      background: "#1e293b", borderRadius: "4px", padding: "8px",
      border: "1px solid " + color + "22",
    }}>
      <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: color }}>
        {value}<span style={{ fontSize: "9px", color: "#475569" }}>{unit}</span>
      </div>
    </div>
  );
}

function AnalysisCard({ title, children }) {
  return (
    <div style={{
      background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "6px", padding: "12px",
    }}>
      <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, marginBottom: "8px", letterSpacing: "0.5px" }}>{title}</div>
      <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.5" }}>{children}</div>
    </div>
  );
}

// ─── Mount ────────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AttackPathOptimizer />);
