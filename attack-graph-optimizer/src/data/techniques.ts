// ─── Techniques, Edges, and Attack Chains ─────────────────────────────────────

export interface Technique {
  id: string;
  name: string;
  tactic: string;
  baseCriticality: number;
}

export interface Edge {
  from: string;
  to: string;
}

export interface AttackChain {
  name: string;
  description: string;
  sector: string;
  path: string[];
  severity: number;
}

export const TECHNIQUES: Technique[] = [
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

export const EDGES: Edge[] = [
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

export const ATTACK_CHAINS: AttackChain[] = [
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
