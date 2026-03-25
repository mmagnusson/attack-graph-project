// ─── Environment Presets ──────────────────────────────────────────────────────

export interface EnvPreset {
  name: string;
  description: string;
  overrides?: Record<string, number>;
}

export const ENV_PRESETS: Record<string, EnvPreset> = {
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
      "T1055": 0.35, "T1562": 0.2, "T1071": 0.3,
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

// ─── ICS/OT Environment Presets ───────────────────────────────────────────────

export const ICS_ENV_PRESETS: Record<string, EnvPreset> = {
  default: {
    name: "Unassessed (Worst Case)",
    description: "No environment assessment applied",
    overrides: {}
  },
  "air-gapped": {
    name: "Air-Gapped OT Network",
    description: "Isolated OT network with no direct internet connectivity",
    overrides: {
      "T0822": 0.1, "T0886": 0.15, "T0884": 0.2, "T0869": 0.15,
      "T0885": 0.2, "T0831": 0.3,
      "T0839": 0.7, "T0836": 0.8, "T0800": 0.75, "T0862": 0.65,
      "T0865": 0.6, "T0857": 0.5, "T0821": 0.5,
    }
  },
  converged: {
    name: "Converged IT/OT Network",
    description: "IT/OT boundary blurred, shared infrastructure",
    overrides: {
      "T0822": 0.75, "T0886": 0.7, "T0884": 0.7, "T0869": 0.8,
      "T0885": 0.75, "T0831": 0.7, "T0866": 0.8, "T0830": 0.65,
      "T0855": 0.7, "T0863": 0.65, "T0853": 0.6, "T0842": 0.65,
      "T0836": 0.6, "T0839": 0.6, "T0821": 0.65, "T0823": 0.7,
    }
  },
  "legacy-scada": {
    name: "Legacy SCADA System",
    description: "Old unpatched SCADA systems with minimal security controls",
    overrides: {
      "T0822": 0.85, "T0886": 0.8, "T0884": 0.85, "T0869": 0.9,
      "T0885": 0.85, "T0831": 0.9, "T0866": 0.9, "T0830": 0.85,
      "T0855": 0.9, "T0863": 0.85, "T0853": 0.85, "T0842": 0.85,
      "T0836": 0.9, "T0839": 0.95, "T0821": 0.9, "T0823": 0.85,
      "T0857": 0.9, "T0812": 0.85, "T0873": 0.9, "T0800": 0.85,
      "T0840": 0.85, "T0846": 0.8, "T0888": 0.85,
      "T0838": 0.9, "T0837": 0.85, "T0856": 0.9, "T0879": 0.9,
      "T0826": 0.85, "T0862": 0.8, "T0865": 0.8,
    }
  },
};
