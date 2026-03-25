// ─── Security Controls (Controls Framework) ──────────────────────────────────

export interface SecurityControl {
  id: string;
  name: string;
  category: string;
  cost: string;
  coverage: Record<string, number>;
}

export interface ControlPreset {
  name: string;
  controls: string[];
}

export const SECURITY_CONTROLS: SecurityControl[] = [
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

// ─── ICS/OT Security Controls ─────────────────────────────────────────────────

export const ICS_SECURITY_CONTROLS: SecurityControl[] = [
  // ── Technical / Preventive ──
  { id: "ics-dpi", name: "OT Deep Packet Inspection", category: "technical", cost: "$$$",
    coverage: { "T0831": -0.4, "T0830": -0.35, "T0855": -0.3, "T0869": -0.3, "T0885": -0.25, "T0860": -0.25 } },
  { id: "ics-diode", name: "Unidirectional Gateway (Data Diode)", category: "technical", cost: "$$$$",
    coverage: { "T0822": -0.5, "T0884": -0.5, "T0886": -0.5, "T0869": -0.4, "T0885": -0.4, "T0831": -0.3 } },
  { id: "ics-app-wl", name: "Application Whitelisting (HMI/EWS)", category: "technical", cost: "$$",
    coverage: { "T0821": -0.4, "T0823": -0.35, "T0807": -0.3, "T0853": -0.3, "T0863": -0.25 } },
  { id: "ics-firmware", name: "Firmware Integrity Verification", category: "technical", cost: "$$",
    coverage: { "T0839": -0.45, "T0857": -0.4, "T0836": -0.35, "T0873": -0.3 } },
  { id: "ics-jumphost", name: "Secure Remote Access (Jump Host)", category: "technical", cost: "$$",
    coverage: { "T0822": -0.45, "T0886": -0.4, "T0884": -0.35, "T0866": -0.3 } },
  { id: "ics-dmz", name: "Industrial DMZ Firewall", category: "technical", cost: "$$$",
    coverage: { "T0884": -0.4, "T0822": -0.35, "T0869": -0.3, "T0886": -0.3, "T0885": -0.25, "T0831": -0.2 } },
  { id: "ics-seg", name: "OT Network Segmentation (Purdue)", category: "technical", cost: "$$$$",
    coverage: { "T0866": -0.45, "T0886": -0.4, "T0822": -0.35, "T0884": -0.35, "T0869": -0.3, "T0831": -0.25, "T0855": -0.2 } },

  // ── Detective / Monitoring ──
  { id: "ics-ids", name: "OT-Specific IDS/IPS", category: "detective", cost: "$$$",
    coverage: { "T0831": -0.35, "T0830": -0.3, "T0855": -0.3, "T0869": -0.3, "T0885": -0.25, "T0860": -0.2 } },
  { id: "ics-anomaly", name: "Process Anomaly Detection", category: "detective", cost: "$$$",
    coverage: { "T0836": -0.35, "T0855": -0.3, "T0856": -0.3, "T0842": -0.3, "T0837": -0.25, "T0879": -0.25 } },
  { id: "ics-asset", name: "OT Asset Inventory & Discovery", category: "detective", cost: "$$",
    coverage: { "T0840": -0.35, "T0846": -0.3, "T0888": -0.3, "T0842": -0.25, "T0872": -0.2 } },
  { id: "ics-safety-mon", name: "Safety System Monitoring (SIS)", category: "detective", cost: "$$$",
    coverage: { "T0838": -0.45, "T0837": -0.4, "T0856": -0.35, "T0879": -0.3 } },
  { id: "ics-log", name: "OT Centralized Logging", category: "detective", cost: "$$",
    coverage: { "T0872": -0.3, "T0842": -0.25, "T0888": -0.25, "T0853": -0.2, "T0863": -0.2 } },

  // ── Administrative / Policy ──
  { id: "ics-training", name: "OT Security Awareness Training", category: "administrative", cost: "$",
    coverage: { "T0863": -0.3, "T0865": -0.3, "T0862": -0.25, "T0822": -0.2 } },
  { id: "ics-vendor", name: "Vendor/Contractor Access Mgmt", category: "administrative", cost: "$",
    coverage: { "T0822": -0.3, "T0862": -0.3, "T0866": -0.25, "T0800": -0.25 } },
  { id: "ics-patch", name: "OT Patch Management", category: "administrative", cost: "$$",
    coverage: { "T0866": -0.3, "T0857": -0.3, "T0812": -0.25, "T0839": -0.25, "T0873": -0.2 } },
  { id: "ics-ir", name: "OT Incident Response Plan", category: "administrative", cost: "$",
    coverage: { "T0879": -0.25, "T0826": -0.25, "T0838": -0.2, "T0837": -0.2, "T0856": -0.2 } },
  { id: "ics-change", name: "OT Change Management Policy", category: "administrative", cost: "$",
    coverage: { "T0839": -0.25, "T0857": -0.25, "T0821": -0.2, "T0836": -0.2, "T0853": -0.2 } },

  // ── Physical / Operational ──
  { id: "ics-keyswitch", name: "Physical Key Switches (Run/Prog)", category: "physical", cost: "$",
    coverage: { "T0839": -0.4, "T0836": -0.4, "T0821": -0.35, "T0857": -0.3 } },
  { id: "ics-tamper", name: "Tamper-Evident Seals & Enclosures", category: "physical", cost: "$",
    coverage: { "T0839": -0.3, "T0836": -0.3, "T0800": -0.25, "T0873": -0.2 } },
  { id: "ics-phys-access", name: "Control Room Physical Access", category: "physical", cost: "$$",
    coverage: { "T0800": -0.4, "T0839": -0.3, "T0836": -0.25, "T0862": -0.2, "T0865": -0.2 } },
];

// Maps ICS MITRE mitigation names → ICS control IDs
export const ICS_MITIGATION_CONTROL_MAP: Record<string, string> = {
  "Network Segmentation": "ics-seg",
  "Filter Network Traffic": "ics-dmz",
  "Network Intrusion Prevention": "ics-ids",
  "Multi-factor Authentication": "ics-jumphost",
  "User Training": "ics-training",
  "Execution Prevention": "ics-app-wl",
  "Communication Authenticity": "ics-dpi",
  "Audit": "ics-log",
  "Update Software": "ics-patch",
  "Access Management": "ics-vendor",
  "Data Backup": "ics-ir",
  "Human User Authentication": "ics-jumphost",
  "Limit Access to Resource Over Network": "ics-dmz",
  "Restrict File and Directory Permissions": "ics-app-wl",
  "Mechanical Protection Layers": "ics-keyswitch",
  "Safety Instrumented Systems": "ics-safety-mon",
  "Encrypt Network Traffic": "ics-dpi",
  "Operating System Configuration": "ics-firmware",
  "Out-of-Band Communications Channel": "ics-diode",
  "Supply Chain Management": "ics-tamper",
};

// F5: Industry Control Presets
export const CONTROL_PRESETS: Record<string, ControlPreset> = {
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

// F5: ICS/OT Control Presets
export const ICS_CONTROL_PRESETS: Record<string, ControlPreset> = {
  none: { name: "Manual", controls: [] },
  "nist-800-82": { name: "NIST SP 800-82", controls: [
    "ics-seg", "ics-dmz", "ics-dpi", "ics-ids", "ics-anomaly", "ics-asset", "ics-jumphost", "ics-app-wl", "ics-patch", "ics-ir", "ics-training", "ics-log", "ics-phys-access",
  ]},
  "iec-62443": { name: "IEC 62443", controls: [
    "ics-seg", "ics-dmz", "ics-dpi", "ics-ids", "ics-anomaly", "ics-asset", "ics-jumphost", "ics-app-wl", "ics-patch", "ics-ir", "ics-training", "ics-log", "ics-phys-access", "ics-diode", "ics-firmware", "ics-vendor", "ics-change", "ics-safety-mon",
  ]},
  "nerc-cip": { name: "NERC CIP", controls: [
    "ics-seg", "ics-dmz", "ics-ids", "ics-asset", "ics-jumphost", "ics-vendor", "ics-patch", "ics-ir", "ics-training", "ics-phys-access", "ics-log", "ics-change",
  ]},
};
