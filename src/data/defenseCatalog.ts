// ─── Defense Catalog — telemetry sources, cost tiers, posture presets ────────
//
// Mitigations come from MITRE (M####). Detection is bought as *telemetry
// sources*: bundles of MITRE data components (DC####) that one product or log
// pipeline typically delivers together. Every data component in a domain
// belongs to exactly one source (enforced by tests/golden.test.ts).
//
// COST TIERS ARE PLACEHOLDER ESTIMATES. They exist so the optimizer has
// something to rank with on first load; every cost is editable in the UI and
// should be replaced with real quotes before a plan is used for decisions.
// Tier → default annual USD for a mid-size org: 1 = $15K, 2 = $50K,
// 3 = $150K, 4 = $400K (see engine/portfolioOptimizer.ts TIER_COSTS).

import type { CostTier, GateDef, PosturePreset, TelemetrySource } from '../types';

// ─── Enterprise ───────────────────────────────────────────────────────────────

export const ENTERPRISE_TELEMETRY: TelemetrySource[] = [
  {
    id: "ts-endpoint-exec", name: "Endpoint process & execution telemetry", tier: 3,
    description: "Process, command-line, script, API, module-load, named-pipe and WMI events from EDR or Sysmon.",
    dataComponents: ["DC0032", "DC0064", "DC0029", "DC0035", "DC0034", "DC0020", "DC0033", "DC0021", "DC0016", "DC0048", "DC0008"],
  },
  {
    id: "ts-endpoint-file", name: "Endpoint file, registry & drive telemetry", tier: 2,
    description: "File, registry and removable-drive events from EDR or Sysmon.",
    dataComponents: ["DC0039", "DC0061", "DC0040", "DC0055", "DC0059", "DC0050", "DC0056", "DC0045", "DC0063", "DC0054", "DC0042", "DC0046"],
  },
  {
    id: "ts-host-config", name: "Host configuration & persistence logs", tier: 1,
    description: "Scheduled jobs, services, drivers, kernel modules, firmware, host status and host firewall changes.",
    dataComponents: ["DC0001", "DC0005", "DC0012", "DC0060", "DC0041", "DC0065", "DC0079", "DC0074", "DC0031", "DC0004", "DC0018", "DC0043", "DC0044", "DC0053", "DC0051"],
  },
  {
    id: "ts-identity", name: "Identity & authentication logs", tier: 2,
    description: "Logons, account and group changes, Active Directory and Kerberos activity, web credentials and certificates (AD, IdP).",
    dataComponents: ["DC0002", "DC0067", "DC0088", "DC0014", "DC0009", "DC0013", "DC0010", "DC0084", "DC0071", "DC0087", "DC0068", "DC0066", "DC0099", "DC0105", "DC0094", "DC0006", "DC0007", "DC0093"],
  },
  {
    id: "ts-netflow", name: "Network flow & connection logs", tier: 2,
    description: "Flow records, connection creation and file-share access (NetFlow, Zeek conn logs, firewall logs).",
    dataComponents: ["DC0078", "DC0082", "DC0102"],
  },
  {
    id: "ts-netcontent", name: "Network content inspection", tier: 3,
    description: "Packet and protocol content (IDS/NSM, TLS-decrypted proxy logs, full packet capture).",
    dataComponents: ["DC0085"],
  },
  {
    id: "ts-applogs", name: "Application logs", tier: 2,
    description: "Logs from email, web, SaaS and business applications.",
    dataComponents: ["DC0038"],
  },
  {
    id: "ts-cloud", name: "Cloud control-plane audit logs", tier: 2,
    description: "Cloud service, storage, instance, image, snapshot and volume events (CloudTrail, Azure Activity, GCP Audit).",
    dataComponents: [
      "DC0090", "DC0083", "DC0070", "DC0069",
      "DC0025", "DC0024", "DC0022", "DC0017", "DC0027", "DC0023",
      "DC0076", "DC0081", "DC0075", "DC0086", "DC0073", "DC0080", "DC0089",
      "DC0015", "DC0026", "DC0028", "DC0036",
      "DC0057", "DC0049", "DC0047", "DC0062", "DC0058",
      "DC0097", "DC0098", "DC0095", "DC0100", "DC0092",
    ],
  },
  {
    id: "ts-containers", name: "Container & Kubernetes audit logs", tier: 2,
    description: "Container and pod creation, start, enumeration and modification events.",
    dataComponents: ["DC0072", "DC0091", "DC0077", "DC0019", "DC0037", "DC0030"],
  },
  {
    id: "ts-external", name: "External threat intelligence & internet monitoring", tier: 2,
    description: "Domain registration, active/passive DNS, internet scan responses, social media and malware repositories.",
    dataComponents: ["DC0101", "DC0103", "DC0096", "DC0104", "DC0106", "DC0052", "DC0011", "DC0003"],
  },
];

export const ENTERPRISE_MITIGATION_TIERS: Record<string, CostTier> = {
  M1013: 1, M1015: 2, M1016: 2, M1017: 2, M1018: 2, M1019: 3, M1020: 3, M1021: 2,
  M1022: 2, M1024: 1, M1025: 1, M1026: 3, M1027: 1, M1028: 2, M1029: 2, M1030: 4,
  M1031: 3, M1032: 3, M1033: 2, M1034: 1, M1035: 2, M1036: 1, M1037: 3, M1038: 3,
  M1039: 1, M1040: 3, M1041: 2, M1042: 2, M1043: 2, M1044: 1, M1045: 2, M1046: 2,
  M1047: 2, M1048: 3, M1049: 2, M1050: 2, M1051: 2, M1052: 1, M1053: 2, M1054: 2,
  M1057: 3, M1060: 2,
};

/** MITRE catalog entries that describe the absence of a control, not a control */
export const ENTERPRISE_NON_ACTIONABLE = ["M1055", "M1056"];

export const ENTERPRISE_GATES: GateDef[] = [
  { id: "TA0043", label: "Reconnaissance", tactics: ["TA0043"] },
  { id: "TA0042", label: "Resource Development", tactics: ["TA0042"] },
  { id: "TA0001", label: "Initial Access", tactics: ["TA0001"] },
  { id: "TA0002", label: "Execution", tactics: ["TA0002"] },
  { id: "TA0003", label: "Persistence", tactics: ["TA0003"] },
  { id: "TA0004", label: "Privilege Escalation", tactics: ["TA0004"] },
  { id: "TA0005", label: "Stealth", tactics: ["TA0005"] },
  { id: "TA0112", label: "Defense Impairment", tactics: ["TA0112"] },
  { id: "TA0006", label: "Credential Access", tactics: ["TA0006"] },
  { id: "TA0007", label: "Discovery", tactics: ["TA0007"] },
  { id: "TA0008", label: "Lateral Movement", tactics: ["TA0008"] },
  { id: "TA0009", label: "Collection", tactics: ["TA0009"] },
  { id: "TA0011", label: "Command & Control", tactics: ["TA0011"] },
  { id: "objective", label: "Objective (Exfiltration or Impact)", tactics: ["TA0010", "TA0040"] },
];
export const ENTERPRISE_DEFAULT_GATES = ["TA0001", "TA0002", "TA0011", "objective"];

// Approximate starting points — real programs vary; adjust after applying.
export const ENTERPRISE_POSTURES: Record<string, PosturePreset> = {
  none: { name: "Nothing assumed", description: "No mitigations or telemetry in place", mitigations: [], telemetry: [] },
  hygiene: {
    name: "Basic cyber hygiene", description: "Patching, training, MFA, backups, AV, password policy, account management",
    mitigations: ["M1051", "M1017", "M1032", "M1053", "M1049", "M1027", "M1018"],
    telemetry: ["ts-identity"],
  },
  "nist-csf": {
    name: "NIST CSF essentials (approx.)", description: "Common NIST CSF implementation",
    mitigations: ["M1051", "M1017", "M1032", "M1053", "M1049", "M1040", "M1026", "M1030", "M1047", "M1016", "M1018", "M1027"],
    telemetry: ["ts-endpoint-exec", "ts-identity", "ts-netflow"],
  },
  "cis-ig2": {
    name: "CIS Controls v8 IG2 (approx.)", description: "CIS Implementation Group 2 safeguards",
    mitigations: ["M1051", "M1017", "M1032", "M1053", "M1049", "M1040", "M1026", "M1030", "M1047", "M1016", "M1018", "M1027", "M1038", "M1021", "M1037", "M1042", "M1028", "M1054", "M1022"],
    telemetry: ["ts-endpoint-exec", "ts-endpoint-file", "ts-identity", "ts-netflow", "ts-applogs"],
  },
  pci: {
    name: "PCI DSS 4.0 (approx.)", description: "Cardholder-data environment controls",
    mitigations: ["M1051", "M1017", "M1032", "M1030", "M1037", "M1031", "M1047", "M1016", "M1018", "M1027", "M1026", "M1041", "M1020", "M1049"],
    telemetry: ["ts-identity", "ts-netflow", "ts-netcontent", "ts-applogs", "ts-endpoint-exec"],
  },
  "zero-trust": {
    name: "Zero Trust architecture (approx.)", description: "Identity-centric access, segmentation, continuous verification",
    mitigations: ["M1032", "M1026", "M1018", "M1030", "M1035", "M1036", "M1037", "M1040", "M1047", "M1021", "M1015"],
    telemetry: ["ts-identity", "ts-endpoint-exec", "ts-netflow", "ts-cloud"],
  },
};

// ─── ICS / OT ─────────────────────────────────────────────────────────────────

export const ICS_TELEMETRY: TelemetrySource[] = [
  {
    id: "ts-ot-process", name: "OT process & alarm monitoring", tier: 3,
    description: "Device alarms, process/event alarms and historian or live process data.",
    dataComponents: ["DC0108", "DC0107", "DC0109"],
  },
  {
    id: "ts-ot-inventory", name: "OT asset & software inventory", tier: 3,
    description: "Passive/active asset inventory and controller software/firmware versions.",
    dataComponents: ["DC0110", "DC0111"],
  },
  {
    id: "ts-ot-netflow", name: "OT network flow & connection logs", tier: 2,
    description: "Flow records, connection creation and share access across Purdue levels.",
    dataComponents: ["DC0078", "DC0082", "DC0102"],
  },
  {
    id: "ts-ot-dpi", name: "OT deep packet inspection", tier: 3,
    description: "Industrial protocol content inspection (Modbus, DNP3, S7, etc.).",
    dataComponents: ["DC0085"],
  },
  {
    id: "ts-ot-host-exec", name: "HMI/EWS process & execution telemetry", tier: 2,
    description: "Process, command, script, API and module-load events on Windows-based OT hosts.",
    dataComponents: ["DC0032", "DC0064", "DC0029", "DC0034", "DC0033", "DC0021", "DC0016"],
  },
  {
    id: "ts-ot-host-config", name: "HMI/EWS file, registry & configuration logs", tier: 2,
    description: "File, registry, drive, scheduled job, service and firmware changes on OT hosts.",
    dataComponents: ["DC0039", "DC0061", "DC0040", "DC0055", "DC0059", "DC0045", "DC0063", "DC0042", "DC0046", "DC0001", "DC0005", "DC0012", "DC0060", "DC0041", "DC0065", "DC0004"],
  },
  {
    id: "ts-ot-identity", name: "OT identity & authentication logs", tier: 2,
    description: "Logon sessions and account authentication on OT hosts and remote access.",
    dataComponents: ["DC0002", "DC0067", "DC0088"],
  },
  {
    id: "ts-ot-applogs", name: "Application & controller logs", tier: 2,
    description: "Logs from SCADA, historian, engineering and controller software.",
    dataComponents: ["DC0038"],
  },
];

export const ICS_MITIGATION_TIERS: Record<string, CostTier> = {
  M0800: 2, M0801: 2, M0802: 3, M0803: 3, M0804: 2, M0805: 3, M0806: 2, M0807: 2,
  M0808: 3, M0809: 1, M0810: 3, M0811: 4, M0812: 4, M0813: 3, M0814: 1, M0815: 2,
  M0817: 2, M0818: 2, M0913: 1, M0915: 2, M0916: 2, M0917: 2, M0918: 2, M0919: 3,
  M0920: 3, M0921: 2, M0922: 2, M0924: 1, M0926: 3, M0927: 1, M0928: 2, M0930: 4,
  M0931: 3, M0932: 3, M0934: 1, M0935: 1, M0936: 1, M0937: 3, M0938: 3, M0941: 2,
  M0942: 2, M0944: 1, M0945: 2, M0946: 2, M0947: 2, M0948: 3, M0949: 2, M0950: 2,
  M0951: 3, M0953: 2, M0954: 2,
};

export const ICS_NON_ACTIONABLE = ["M0816"];

export const ICS_GATES: GateDef[] = [
  { id: "TA0108", label: "Initial Access", tactics: ["TA0108"] },
  { id: "TA0104", label: "Execution", tactics: ["TA0104"] },
  { id: "TA0110", label: "Persistence", tactics: ["TA0110"] },
  { id: "TA0111", label: "Privilege Escalation", tactics: ["TA0111"] },
  { id: "TA0103", label: "Evasion", tactics: ["TA0103"] },
  { id: "TA0102", label: "Discovery", tactics: ["TA0102"] },
  { id: "TA0109", label: "Lateral Movement", tactics: ["TA0109"] },
  { id: "TA0100", label: "Collection", tactics: ["TA0100"] },
  { id: "TA0101", label: "Command & Control", tactics: ["TA0101"] },
  { id: "objective", label: "Objective (Inhibit Response, Impair Process, or Impact)", tactics: ["TA0107", "TA0106", "TA0105"] },
];
export const ICS_DEFAULT_GATES = ["TA0108", "TA0104", "objective"];

export const ICS_POSTURES: Record<string, PosturePreset> = {
  none: { name: "Nothing assumed", description: "No mitigations or telemetry in place", mitigations: [], telemetry: [] },
  "nist-800-82": {
    name: "NIST SP 800-82 (approx.)", description: "OT security guide baseline",
    mitigations: ["M0930", "M0937", "M0807", "M0801", "M0804", "M0932", "M0951", "M0953", "M0947", "M0917", "M0938", "M0810"],
    telemetry: ["ts-ot-process", "ts-ot-netflow", "ts-ot-dpi", "ts-ot-inventory"],
  },
  "iec-62443": {
    name: "IEC 62443 (approx.)", description: "Industrial automation security levels",
    mitigations: ["M0930", "M0937", "M0807", "M0801", "M0804", "M0932", "M0951", "M0953", "M0947", "M0917", "M0938", "M0810", "M0800", "M0802", "M0813", "M0945", "M0946", "M0814", "M0811"],
    telemetry: ["ts-ot-process", "ts-ot-netflow", "ts-ot-dpi", "ts-ot-inventory", "ts-ot-host-exec", "ts-ot-identity"],
  },
  "nerc-cip": {
    name: "NERC CIP (approx.)", description: "Bulk electric system reliability standards",
    mitigations: ["M0930", "M0937", "M0801", "M0804", "M0932", "M0951", "M0947", "M0917", "M0953", "M0926"],
    telemetry: ["ts-ot-netflow", "ts-ot-identity", "ts-ot-inventory"],
  },
};
