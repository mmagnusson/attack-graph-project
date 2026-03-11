// ─── Coverage Knowledge Base (Environment Profiling — Phase 3) ───────────────
// Maps real-world security products → per-technique detection/prevention scores
// and infrastructure items → per-technique exposure relevance.
// Scores: detect/prevent 0.0 (none) to 1.0 (full). exposes 0.0 (irrelevant) to 1.0 (fully relevant).
// Sources: MITRE ATT&CK Evaluations, vendor Navigator layers, Sigma rule coverage, ATT&CK data source mappings.

export interface TechniqueScore {
  detect: number;
  prevent: number;
  source: string;
}

export interface KBTool {
  display_name: string;
  category: string;
  data_source: string;
  techniques: Record<string, TechniqueScore>;
}

export interface KBInfrastructure {
  display_name: string;
  category: string;
  exposes: Record<string, number>;
}

export interface KBCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CoverageKB {
  metadata: {
    attack_version: string;
    last_updated: string;
    sources: string[];
  };
  tools: Record<string, KBTool>;
  infrastructure: Record<string, KBInfrastructure>;
  toolCategories: KBCategory[];
  infraCategories: KBCategory[];
}

export const COVERAGE_KB: CoverageKB = {
  metadata: {
    attack_version: "16.1",
    last_updated: "2026-03-10",
    sources: ["MITRE Evals ER7 (2025)", "MITRE Evals ER6 (2024)", "Sigma Rules", "Vendor Navigator Layers", "ATT&CK Data Sources"],
  },
  tools: {
    "crowdstrike-falcon": {
      display_name: "CrowdStrike Falcon",
      category: "edr",
      data_source: "mitre_evals_2025",
      techniques: {
        "T1059": { detect: 0.92, prevent: 0.75, source: "ER7" }, "T1059.001": { detect: 0.95, prevent: 0.80, source: "ER7" },
        "T1055": { detect: 0.88, prevent: 0.65, source: "ER7" }, "T1055.012": { detect: 0.85, prevent: 0.60, source: "ER7" },
        "T1547": { detect: 0.90, prevent: 0.70, source: "ER7" }, "T1543": { detect: 0.85, prevent: 0.65, source: "ER7" },
        "T1546": { detect: 0.87, prevent: 0.60, source: "ER7" }, "T1053": { detect: 0.82, prevent: 0.55, source: "ER7" },
        "T1068": { detect: 0.75, prevent: 0.50, source: "ER7" }, "T1548": { detect: 0.80, prevent: 0.55, source: "ER7" },
        "T1134": { detect: 0.83, prevent: 0.50, source: "ER7" }, "T1036": { detect: 0.88, prevent: 0.60, source: "ER7" },
        "T1027": { detect: 0.82, prevent: 0.55, source: "ER7" }, "T1562": { detect: 0.78, prevent: 0.50, source: "ER7" },
        "T1070": { detect: 0.80, prevent: 0.45, source: "ER7" }, "T1003": { detect: 0.90, prevent: 0.70, source: "ER7" },
        "T1003.001": { detect: 0.92, prevent: 0.75, source: "ER7" }, "T1110": { detect: 0.70, prevent: 0.40, source: "ER7" },
        "T1021": { detect: 0.75, prevent: 0.40, source: "ER7" }, "T1570": { detect: 0.78, prevent: 0.45, source: "ER7" },
        "T1057": { detect: 0.85, prevent: 0.30, source: "ER7" }, "T1082": { detect: 0.80, prevent: 0.25, source: "ER7" },
        "T1005": { detect: 0.72, prevent: 0.35, source: "ER7" }, "T1204": { detect: 0.80, prevent: 0.60, source: "ER7" },
        "T1047": { detect: 0.85, prevent: 0.55, source: "ER7" }, "T1071": { detect: 0.70, prevent: 0.40, source: "ER7" },
        "T1573": { detect: 0.65, prevent: 0.35, source: "ER7" }, "T1486": { detect: 0.85, prevent: 0.70, source: "ER7" },
        "T1041": { detect: 0.68, prevent: 0.40, source: "ER7" }, "T1550": { detect: 0.75, prevent: 0.45, source: "ER7" },
        "T1558": { detect: 0.72, prevent: 0.35, source: "ER7" }, "T1560": { detect: 0.70, prevent: 0.40, source: "ER7" },
        "T1048": { detect: 0.65, prevent: 0.35, source: "ER7" }, "T1485": { detect: 0.80, prevent: 0.65, source: "ER7" },
        "T1489": { detect: 0.78, prevent: 0.55, source: "ER7" }, "T1529": { detect: 0.75, prevent: 0.50, source: "ER7" },
      },
    },
    "ms-defender-endpoint": {
      display_name: "Microsoft Defender for Endpoint",
      category: "edr",
      data_source: "mitre_evals_2024",
      techniques: {
        "T1059": { detect: 0.90, prevent: 0.78, source: "ER6" }, "T1059.001": { detect: 0.93, prevent: 0.82, source: "ER6" },
        "T1055": { detect: 0.85, prevent: 0.60, source: "ER6" }, "T1547": { detect: 0.88, prevent: 0.72, source: "ER6" },
        "T1543": { detect: 0.82, prevent: 0.60, source: "ER6" }, "T1546": { detect: 0.84, prevent: 0.58, source: "ER6" },
        "T1053": { detect: 0.80, prevent: 0.55, source: "ER6" }, "T1068": { detect: 0.72, prevent: 0.48, source: "ER6" },
        "T1548": { detect: 0.78, prevent: 0.55, source: "ER6" }, "T1134": { detect: 0.80, prevent: 0.50, source: "ER6" },
        "T1036": { detect: 0.85, prevent: 0.62, source: "ER6" }, "T1027": { detect: 0.80, prevent: 0.55, source: "ER6" },
        "T1562": { detect: 0.82, prevent: 0.58, source: "ER6" }, "T1070": { detect: 0.78, prevent: 0.42, source: "ER6" },
        "T1003": { detect: 0.88, prevent: 0.72, source: "ER6" }, "T1003.001": { detect: 0.90, prevent: 0.75, source: "ER6" },
        "T1110": { detect: 0.68, prevent: 0.40, source: "ER6" }, "T1021": { detect: 0.72, prevent: 0.38, source: "ER6" },
        "T1570": { detect: 0.75, prevent: 0.42, source: "ER6" }, "T1057": { detect: 0.82, prevent: 0.28, source: "ER6" },
        "T1082": { detect: 0.78, prevent: 0.22, source: "ER6" }, "T1005": { detect: 0.70, prevent: 0.35, source: "ER6" },
        "T1204": { detect: 0.82, prevent: 0.65, source: "ER6" }, "T1047": { detect: 0.83, prevent: 0.55, source: "ER6" },
        "T1071": { detect: 0.72, prevent: 0.42, source: "ER6" }, "T1573": { detect: 0.68, prevent: 0.38, source: "ER6" },
        "T1486": { detect: 0.82, prevent: 0.68, source: "ER6" }, "T1041": { detect: 0.65, prevent: 0.38, source: "ER6" },
        "T1550": { detect: 0.73, prevent: 0.45, source: "ER6" }, "T1558": { detect: 0.70, prevent: 0.38, source: "ER6" },
        "T1078": { detect: 0.75, prevent: 0.45, source: "ER6" }, "T1566": { detect: 0.70, prevent: 0.55, source: "ER6" },
      },
    },
    "sentinelone": {
      display_name: "SentinelOne Singularity",
      category: "edr",
      data_source: "mitre_evals_2024",
      techniques: {
        "T1059": { detect: 0.88, prevent: 0.72, source: "ER6" }, "T1055": { detect: 0.84, prevent: 0.62, source: "ER6" },
        "T1547": { detect: 0.86, prevent: 0.68, source: "ER6" }, "T1543": { detect: 0.80, prevent: 0.58, source: "ER6" },
        "T1546": { detect: 0.82, prevent: 0.55, source: "ER6" }, "T1053": { detect: 0.78, prevent: 0.52, source: "ER6" },
        "T1068": { detect: 0.70, prevent: 0.45, source: "ER6" }, "T1548": { detect: 0.76, prevent: 0.50, source: "ER6" },
        "T1134": { detect: 0.78, prevent: 0.48, source: "ER6" }, "T1036": { detect: 0.84, prevent: 0.58, source: "ER6" },
        "T1027": { detect: 0.80, prevent: 0.52, source: "ER6" }, "T1562": { detect: 0.75, prevent: 0.48, source: "ER6" },
        "T1070": { detect: 0.76, prevent: 0.40, source: "ER6" }, "T1003": { detect: 0.86, prevent: 0.68, source: "ER6" },
        "T1021": { detect: 0.72, prevent: 0.38, source: "ER6" }, "T1057": { detect: 0.80, prevent: 0.25, source: "ER6" },
        "T1204": { detect: 0.78, prevent: 0.58, source: "ER6" }, "T1047": { detect: 0.80, prevent: 0.52, source: "ER6" },
        "T1486": { detect: 0.82, prevent: 0.65, source: "ER6" }, "T1071": { detect: 0.68, prevent: 0.38, source: "ER6" },
        "T1573": { detect: 0.62, prevent: 0.32, source: "ER6" }, "T1041": { detect: 0.62, prevent: 0.35, source: "ER6" },
      },
    },
    "cortex-xdr": {
      display_name: "Cortex XDR (Palo Alto)",
      category: "edr",
      data_source: "mitre_evals_2024",
      techniques: {
        "T1059": { detect: 0.90, prevent: 0.74, source: "ER6" }, "T1055": { detect: 0.86, prevent: 0.64, source: "ER6" },
        "T1547": { detect: 0.88, prevent: 0.70, source: "ER6" }, "T1543": { detect: 0.83, prevent: 0.62, source: "ER6" },
        "T1546": { detect: 0.85, prevent: 0.58, source: "ER6" }, "T1053": { detect: 0.80, prevent: 0.54, source: "ER6" },
        "T1068": { detect: 0.73, prevent: 0.48, source: "ER6" }, "T1548": { detect: 0.78, prevent: 0.54, source: "ER6" },
        "T1134": { detect: 0.80, prevent: 0.50, source: "ER6" }, "T1036": { detect: 0.86, prevent: 0.60, source: "ER6" },
        "T1027": { detect: 0.82, prevent: 0.56, source: "ER6" }, "T1562": { detect: 0.80, prevent: 0.52, source: "ER6" },
        "T1070": { detect: 0.78, prevent: 0.44, source: "ER6" }, "T1003": { detect: 0.88, prevent: 0.70, source: "ER6" },
        "T1021": { detect: 0.74, prevent: 0.40, source: "ER6" }, "T1570": { detect: 0.76, prevent: 0.44, source: "ER6" },
        "T1057": { detect: 0.82, prevent: 0.28, source: "ER6" }, "T1082": { detect: 0.78, prevent: 0.24, source: "ER6" },
        "T1204": { detect: 0.80, prevent: 0.62, source: "ER6" }, "T1047": { detect: 0.82, prevent: 0.54, source: "ER6" },
        "T1486": { detect: 0.84, prevent: 0.68, source: "ER6" }, "T1071": { detect: 0.74, prevent: 0.48, source: "ER6" },
        "T1573": { detect: 0.70, prevent: 0.42, source: "ER6" }, "T1041": { detect: 0.66, prevent: 0.40, source: "ER6" },
        "T1550": { detect: 0.74, prevent: 0.46, source: "ER6" },
      },
    },
    "carbon-black": {
      display_name: "Carbon Black (VMware)",
      category: "edr",
      data_source: "mitre_evals_2024",
      techniques: {
        "T1059": { detect: 0.82, prevent: 0.60, source: "ER6" }, "T1055": { detect: 0.78, prevent: 0.52, source: "ER6" },
        "T1547": { detect: 0.80, prevent: 0.58, source: "ER6" }, "T1543": { detect: 0.75, prevent: 0.50, source: "ER6" },
        "T1546": { detect: 0.76, prevent: 0.48, source: "ER6" }, "T1053": { detect: 0.72, prevent: 0.45, source: "ER6" },
        "T1036": { detect: 0.78, prevent: 0.52, source: "ER6" }, "T1027": { detect: 0.74, prevent: 0.48, source: "ER6" },
        "T1003": { detect: 0.80, prevent: 0.60, source: "ER6" }, "T1204": { detect: 0.72, prevent: 0.50, source: "ER6" },
        "T1047": { detect: 0.75, prevent: 0.48, source: "ER6" }, "T1486": { detect: 0.76, prevent: 0.58, source: "ER6" },
        "T1071": { detect: 0.62, prevent: 0.32, source: "ER6" }, "T1021": { detect: 0.68, prevent: 0.35, source: "ER6" },
      },
    },
    "cybereason": {
      display_name: "Cybereason",
      category: "edr",
      data_source: "mitre_evals_2025",
      techniques: {
        "T1059": { detect: 0.85, prevent: 0.65, source: "ER7" }, "T1055": { detect: 0.80, prevent: 0.55, source: "ER7" },
        "T1547": { detect: 0.82, prevent: 0.60, source: "ER7" }, "T1036": { detect: 0.80, prevent: 0.55, source: "ER7" },
        "T1003": { detect: 0.82, prevent: 0.62, source: "ER7" }, "T1204": { detect: 0.75, prevent: 0.55, source: "ER7" },
        "T1047": { detect: 0.78, prevent: 0.50, source: "ER7" }, "T1486": { detect: 0.80, prevent: 0.60, source: "ER7" },
        "T1027": { detect: 0.76, prevent: 0.48, source: "ER7" }, "T1134": { detect: 0.74, prevent: 0.42, source: "ER7" },
        "T1562": { detect: 0.72, prevent: 0.45, source: "ER7" }, "T1070": { detect: 0.70, prevent: 0.38, source: "ER7" },
      },
    },
    "eset": {
      display_name: "ESET",
      category: "edr",
      data_source: "mitre_evals_2025",
      techniques: {
        "T1059": { detect: 0.80, prevent: 0.62, source: "ER7" }, "T1055": { detect: 0.75, prevent: 0.50, source: "ER7" },
        "T1547": { detect: 0.78, prevent: 0.58, source: "ER7" }, "T1036": { detect: 0.76, prevent: 0.52, source: "ER7" },
        "T1003": { detect: 0.78, prevent: 0.58, source: "ER7" }, "T1204": { detect: 0.72, prevent: 0.52, source: "ER7" },
        "T1486": { detect: 0.75, prevent: 0.58, source: "ER7" }, "T1027": { detect: 0.72, prevent: 0.46, source: "ER7" },
        "T1543": { detect: 0.70, prevent: 0.48, source: "ER7" }, "T1047": { detect: 0.72, prevent: 0.46, source: "ER7" },
      },
    },
    "sophos": {
      display_name: "Sophos Intercept X",
      category: "edr",
      data_source: "mitre_evals_2025",
      techniques: {
        "T1059": { detect: 0.84, prevent: 0.70, source: "ER7" }, "T1055": { detect: 0.78, prevent: 0.55, source: "ER7" },
        "T1547": { detect: 0.82, prevent: 0.62, source: "ER7" }, "T1036": { detect: 0.80, prevent: 0.56, source: "ER7" },
        "T1003": { detect: 0.84, prevent: 0.65, source: "ER7" }, "T1204": { detect: 0.78, prevent: 0.58, source: "ER7" },
        "T1486": { detect: 0.82, prevent: 0.68, source: "ER7" }, "T1027": { detect: 0.76, prevent: 0.50, source: "ER7" },
        "T1134": { detect: 0.75, prevent: 0.45, source: "ER7" }, "T1047": { detect: 0.76, prevent: 0.50, source: "ER7" },
        "T1543": { detect: 0.74, prevent: 0.52, source: "ER7" }, "T1562": { detect: 0.72, prevent: 0.46, source: "ER7" },
      },
    },
    "trendmicro": {
      display_name: "Trend Micro Vision One",
      category: "edr",
      data_source: "mitre_evals_2025",
      techniques: {
        "T1059": { detect: 0.86, prevent: 0.68, source: "ER7" }, "T1055": { detect: 0.80, prevent: 0.58, source: "ER7" },
        "T1547": { detect: 0.84, prevent: 0.64, source: "ER7" }, "T1036": { detect: 0.82, prevent: 0.58, source: "ER7" },
        "T1003": { detect: 0.85, prevent: 0.66, source: "ER7" }, "T1204": { detect: 0.78, prevent: 0.58, source: "ER7" },
        "T1486": { detect: 0.80, prevent: 0.62, source: "ER7" }, "T1027": { detect: 0.78, prevent: 0.52, source: "ER7" },
        "T1134": { detect: 0.76, prevent: 0.46, source: "ER7" }, "T1047": { detect: 0.78, prevent: 0.52, source: "ER7" },
        "T1071": { detect: 0.70, prevent: 0.42, source: "ER7" }, "T1562": { detect: 0.74, prevent: 0.48, source: "ER7" },
        "T1566": { detect: 0.72, prevent: 0.55, source: "ER7" },
      },
    },
    "withsecure": {
      display_name: "WithSecure",
      category: "edr",
      data_source: "mitre_evals_2025",
      techniques: {
        "T1059": { detect: 0.82, prevent: 0.64, source: "ER7" }, "T1055": { detect: 0.76, prevent: 0.52, source: "ER7" },
        "T1547": { detect: 0.80, prevent: 0.60, source: "ER7" }, "T1036": { detect: 0.78, prevent: 0.54, source: "ER7" },
        "T1003": { detect: 0.80, prevent: 0.60, source: "ER7" }, "T1204": { detect: 0.74, prevent: 0.54, source: "ER7" },
        "T1486": { detect: 0.78, prevent: 0.60, source: "ER7" }, "T1027": { detect: 0.74, prevent: 0.48, source: "ER7" },
        "T1047": { detect: 0.74, prevent: 0.48, source: "ER7" },
      },
    },
    // ── SIEM / Log Management ──
    "splunk-es": {
      display_name: "Splunk Enterprise Security",
      category: "siem",
      data_source: "community_sigma_rules",
      techniques: {
        "T1059": { detect: 0.80, prevent: 0.0, source: "Sigma" }, "T1059.001": { detect: 0.85, prevent: 0.0, source: "Sigma" },
        "T1055": { detect: 0.65, prevent: 0.0, source: "Sigma" }, "T1547": { detect: 0.75, prevent: 0.0, source: "Sigma" },
        "T1543": { detect: 0.72, prevent: 0.0, source: "Sigma" }, "T1546": { detect: 0.70, prevent: 0.0, source: "Sigma" },
        "T1053": { detect: 0.78, prevent: 0.0, source: "Sigma" }, "T1068": { detect: 0.50, prevent: 0.0, source: "Sigma" },
        "T1548": { detect: 0.60, prevent: 0.0, source: "Sigma" }, "T1134": { detect: 0.62, prevent: 0.0, source: "Sigma" },
        "T1036": { detect: 0.72, prevent: 0.0, source: "Sigma" }, "T1027": { detect: 0.55, prevent: 0.0, source: "Sigma" },
        "T1562": { detect: 0.70, prevent: 0.0, source: "Sigma" }, "T1070": { detect: 0.68, prevent: 0.0, source: "Sigma" },
        "T1003": { detect: 0.78, prevent: 0.0, source: "Sigma" }, "T1003.001": { detect: 0.82, prevent: 0.0, source: "Sigma" },
        "T1110": { detect: 0.72, prevent: 0.0, source: "Sigma" }, "T1558": { detect: 0.70, prevent: 0.0, source: "Sigma" },
        "T1021": { detect: 0.68, prevent: 0.0, source: "Sigma" }, "T1570": { detect: 0.60, prevent: 0.0, source: "Sigma" },
        "T1057": { detect: 0.65, prevent: 0.0, source: "Sigma" }, "T1082": { detect: 0.60, prevent: 0.0, source: "Sigma" },
        "T1005": { detect: 0.55, prevent: 0.0, source: "Sigma" }, "T1204": { detect: 0.62, prevent: 0.0, source: "Sigma" },
        "T1047": { detect: 0.70, prevent: 0.0, source: "Sigma" }, "T1071": { detect: 0.72, prevent: 0.0, source: "Sigma" },
        "T1573": { detect: 0.58, prevent: 0.0, source: "Sigma" }, "T1486": { detect: 0.68, prevent: 0.0, source: "Sigma" },
        "T1078": { detect: 0.72, prevent: 0.0, source: "Sigma" }, "T1566": { detect: 0.55, prevent: 0.0, source: "Sigma" },
        "T1041": { detect: 0.58, prevent: 0.0, source: "Sigma" }, "T1048": { detect: 0.55, prevent: 0.0, source: "Sigma" },
        "T1550": { detect: 0.65, prevent: 0.0, source: "Sigma" },
      },
    },
    "ms-sentinel": {
      display_name: "Microsoft Sentinel",
      category: "siem",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1059": { detect: 0.78, prevent: 0.0, source: "Vendor" }, "T1055": { detect: 0.62, prevent: 0.0, source: "Vendor" },
        "T1547": { detect: 0.72, prevent: 0.0, source: "Vendor" }, "T1543": { detect: 0.68, prevent: 0.0, source: "Vendor" },
        "T1053": { detect: 0.75, prevent: 0.0, source: "Vendor" }, "T1036": { detect: 0.70, prevent: 0.0, source: "Vendor" },
        "T1562": { detect: 0.72, prevent: 0.0, source: "Vendor" }, "T1070": { detect: 0.65, prevent: 0.0, source: "Vendor" },
        "T1003": { detect: 0.75, prevent: 0.0, source: "Vendor" }, "T1110": { detect: 0.74, prevent: 0.0, source: "Vendor" },
        "T1558": { detect: 0.72, prevent: 0.0, source: "Vendor" }, "T1078": { detect: 0.78, prevent: 0.0, source: "Vendor" },
        "T1021": { detect: 0.65, prevent: 0.0, source: "Vendor" }, "T1071": { detect: 0.68, prevent: 0.0, source: "Vendor" },
        "T1486": { detect: 0.65, prevent: 0.0, source: "Vendor" }, "T1566": { detect: 0.60, prevent: 0.0, source: "Vendor" },
        "T1204": { detect: 0.58, prevent: 0.0, source: "Vendor" }, "T1047": { detect: 0.66, prevent: 0.0, source: "Vendor" },
        "T1550": { detect: 0.62, prevent: 0.0, source: "Vendor" }, "T1134": { detect: 0.58, prevent: 0.0, source: "Vendor" },
      },
    },
    "elastic-security": {
      display_name: "Elastic Security",
      category: "siem",
      data_source: "community_sigma_rules",
      techniques: {
        "T1059": { detect: 0.76, prevent: 0.0, source: "Sigma" }, "T1055": { detect: 0.60, prevent: 0.0, source: "Sigma" },
        "T1547": { detect: 0.70, prevent: 0.0, source: "Sigma" }, "T1543": { detect: 0.66, prevent: 0.0, source: "Sigma" },
        "T1053": { detect: 0.72, prevent: 0.0, source: "Sigma" }, "T1036": { detect: 0.68, prevent: 0.0, source: "Sigma" },
        "T1562": { detect: 0.65, prevent: 0.0, source: "Sigma" }, "T1003": { detect: 0.74, prevent: 0.0, source: "Sigma" },
        "T1110": { detect: 0.68, prevent: 0.0, source: "Sigma" }, "T1078": { detect: 0.70, prevent: 0.0, source: "Sigma" },
        "T1021": { detect: 0.64, prevent: 0.0, source: "Sigma" }, "T1071": { detect: 0.66, prevent: 0.0, source: "Sigma" },
        "T1486": { detect: 0.62, prevent: 0.0, source: "Sigma" }, "T1204": { detect: 0.58, prevent: 0.0, source: "Sigma" },
        "T1047": { detect: 0.65, prevent: 0.0, source: "Sigma" }, "T1027": { detect: 0.52, prevent: 0.0, source: "Sigma" },
        "T1070": { detect: 0.62, prevent: 0.0, source: "Sigma" },
      },
    },
    "qradar": {
      display_name: "IBM QRadar",
      category: "siem",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1059": { detect: 0.72, prevent: 0.0, source: "Vendor" }, "T1547": { detect: 0.65, prevent: 0.0, source: "Vendor" },
        "T1003": { detect: 0.70, prevent: 0.0, source: "Vendor" }, "T1110": { detect: 0.68, prevent: 0.0, source: "Vendor" },
        "T1078": { detect: 0.72, prevent: 0.0, source: "Vendor" }, "T1021": { detect: 0.62, prevent: 0.0, source: "Vendor" },
        "T1071": { detect: 0.65, prevent: 0.0, source: "Vendor" }, "T1486": { detect: 0.58, prevent: 0.0, source: "Vendor" },
        "T1562": { detect: 0.60, prevent: 0.0, source: "Vendor" }, "T1036": { detect: 0.62, prevent: 0.0, source: "Vendor" },
        "T1047": { detect: 0.60, prevent: 0.0, source: "Vendor" }, "T1558": { detect: 0.62, prevent: 0.0, source: "Vendor" },
      },
    },
    "arctic-wolf": {
      display_name: "Arctic Wolf",
      category: "siem",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1059": { detect: 0.75, prevent: 0.0, source: "Vendor" }, "T1547": { detect: 0.68, prevent: 0.0, source: "Vendor" },
        "T1003": { detect: 0.72, prevent: 0.0, source: "Vendor" }, "T1110": { detect: 0.74, prevent: 0.0, source: "Vendor" },
        "T1078": { detect: 0.76, prevent: 0.0, source: "Vendor" }, "T1021": { detect: 0.64, prevent: 0.0, source: "Vendor" },
        "T1071": { detect: 0.70, prevent: 0.0, source: "Vendor" }, "T1486": { detect: 0.65, prevent: 0.0, source: "Vendor" },
        "T1562": { detect: 0.64, prevent: 0.0, source: "Vendor" }, "T1036": { detect: 0.66, prevent: 0.0, source: "Vendor" },
        "T1204": { detect: 0.62, prevent: 0.0, source: "Vendor" }, "T1566": { detect: 0.60, prevent: 0.0, source: "Vendor" },
        "T1055": { detect: 0.58, prevent: 0.0, source: "Vendor" }, "T1053": { detect: 0.64, prevent: 0.0, source: "Vendor" },
      },
    },
    // ── Network Security ──
    "paloalto-ngfw": {
      display_name: "Palo Alto NGFW",
      category: "network",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1071": { detect: 0.85, prevent: 0.70, source: "Vendor" }, "T1573": { detect: 0.78, prevent: 0.60, source: "Vendor" },
        "T1041": { detect: 0.80, prevent: 0.65, source: "Vendor" }, "T1048": { detect: 0.78, prevent: 0.62, source: "Vendor" },
        "T1190": { detect: 0.72, prevent: 0.60, source: "Vendor" }, "T1133": { detect: 0.70, prevent: 0.55, source: "Vendor" },
        "T1046": { detect: 0.75, prevent: 0.55, source: "Vendor" }, "T1021": { detect: 0.60, prevent: 0.35, source: "Vendor" },
        "T1570": { detect: 0.58, prevent: 0.32, source: "Vendor" }, "T1595": { detect: 0.65, prevent: 0.45, source: "Vendor" },
        "T1566": { detect: 0.55, prevent: 0.40, source: "Vendor" }, "T1204": { detect: 0.40, prevent: 0.30, source: "Vendor" },
        "T1486": { detect: 0.30, prevent: 0.0, source: "Vendor" },
      },
    },
    "fortinet": {
      display_name: "Fortinet FortiGate",
      category: "network",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1071": { detect: 0.82, prevent: 0.68, source: "Vendor" }, "T1573": { detect: 0.75, prevent: 0.58, source: "Vendor" },
        "T1041": { detect: 0.78, prevent: 0.62, source: "Vendor" }, "T1048": { detect: 0.75, prevent: 0.58, source: "Vendor" },
        "T1190": { detect: 0.70, prevent: 0.58, source: "Vendor" }, "T1133": { detect: 0.68, prevent: 0.52, source: "Vendor" },
        "T1046": { detect: 0.72, prevent: 0.50, source: "Vendor" }, "T1021": { detect: 0.55, prevent: 0.30, source: "Vendor" },
        "T1595": { detect: 0.60, prevent: 0.40, source: "Vendor" }, "T1566": { detect: 0.50, prevent: 0.35, source: "Vendor" },
      },
    },
    "zscaler": {
      display_name: "Zscaler",
      category: "network",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1071": { detect: 0.80, prevent: 0.65, source: "Vendor" }, "T1573": { detect: 0.82, prevent: 0.68, source: "Vendor" },
        "T1041": { detect: 0.78, prevent: 0.62, source: "Vendor" }, "T1048": { detect: 0.76, prevent: 0.60, source: "Vendor" },
        "T1190": { detect: 0.58, prevent: 0.42, source: "Vendor" }, "T1133": { detect: 0.65, prevent: 0.50, source: "Vendor" },
        "T1566": { detect: 0.62, prevent: 0.48, source: "Vendor" }, "T1204": { detect: 0.50, prevent: 0.38, source: "Vendor" },
        "T1595": { detect: 0.55, prevent: 0.38, source: "Vendor" },
      },
    },
    // ── Email Security ──
    "proofpoint": {
      display_name: "Proofpoint",
      category: "email",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1566": { detect: 0.90, prevent: 0.82, source: "Vendor" }, "T1566.001": { detect: 0.92, prevent: 0.85, source: "Vendor" },
        "T1566.002": { detect: 0.88, prevent: 0.80, source: "Vendor" },
        "T1598": { detect: 0.80, prevent: 0.65, source: "Vendor" }, "T1204": { detect: 0.72, prevent: 0.55, source: "Vendor" },
        "T1204.001": { detect: 0.75, prevent: 0.58, source: "Vendor" },
        "T1586": { detect: 0.50, prevent: 0.25, source: "Vendor" }, "T1583": { detect: 0.45, prevent: 0.20, source: "Vendor" },
      },
    },
    "mimecast": {
      display_name: "Mimecast",
      category: "email",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1566": { detect: 0.88, prevent: 0.80, source: "Vendor" }, "T1598": { detect: 0.78, prevent: 0.62, source: "Vendor" },
        "T1204": { detect: 0.68, prevent: 0.50, source: "Vendor" }, "T1586": { detect: 0.45, prevent: 0.20, source: "Vendor" },
        "T1583": { detect: 0.40, prevent: 0.18, source: "Vendor" },
      },
    },
    "ms-defender-o365": {
      display_name: "Microsoft Defender for Office 365",
      category: "email",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1566": { detect: 0.86, prevent: 0.78, source: "Vendor" }, "T1598": { detect: 0.75, prevent: 0.60, source: "Vendor" },
        "T1204": { detect: 0.70, prevent: 0.52, source: "Vendor" }, "T1586": { detect: 0.48, prevent: 0.22, source: "Vendor" },
      },
    },
    // ── Endpoint Hardening ──
    "threatlocker": {
      display_name: "ThreatLocker",
      category: "hardening",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1059": { detect: 0.60, prevent: 0.85, source: "Vendor" }, "T1059.001": { detect: 0.65, prevent: 0.88, source: "Vendor" },
        "T1204": { detect: 0.55, prevent: 0.80, source: "Vendor" }, "T1047": { detect: 0.50, prevent: 0.72, source: "Vendor" },
        "T1053": { detect: 0.45, prevent: 0.65, source: "Vendor" }, "T1543": { detect: 0.40, prevent: 0.60, source: "Vendor" },
        "T1055": { detect: 0.35, prevent: 0.55, source: "Vendor" }, "T1190": { detect: 0.30, prevent: 0.50, source: "Vendor" },
        "T1486": { detect: 0.40, prevent: 0.65, source: "Vendor" },
      },
    },
    "applocker-wdac": {
      display_name: "Microsoft AppLocker / WDAC",
      category: "hardening",
      data_source: "attack_data_sources",
      techniques: {
        "T1059": { detect: 0.50, prevent: 0.78, source: "DS" }, "T1059.001": { detect: 0.55, prevent: 0.80, source: "DS" },
        "T1204": { detect: 0.45, prevent: 0.72, source: "DS" }, "T1047": { detect: 0.40, prevent: 0.65, source: "DS" },
        "T1053": { detect: 0.35, prevent: 0.55, source: "DS" }, "T1055": { detect: 0.30, prevent: 0.48, source: "DS" },
        "T1486": { detect: 0.30, prevent: 0.55, source: "DS" },
      },
    },
    // ── Vulnerability Management ──
    "tenable": {
      display_name: "Tenable",
      category: "vuln_mgmt",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1190": { detect: 0.80, prevent: 0.0, source: "Vendor" }, "T1068": { detect: 0.75, prevent: 0.0, source: "Vendor" },
        "T1133": { detect: 0.70, prevent: 0.0, source: "Vendor" }, "T1082": { detect: 0.65, prevent: 0.0, source: "Vendor" },
        "T1046": { detect: 0.60, prevent: 0.0, source: "Vendor" }, "T1595": { detect: 0.55, prevent: 0.0, source: "Vendor" },
      },
    },
    // ── Identity Security ──
    "ms-defender-identity": {
      display_name: "Microsoft Defender for Identity",
      category: "identity_security",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1003": { detect: 0.85, prevent: 0.45, source: "Vendor" }, "T1003.001": { detect: 0.88, prevent: 0.50, source: "Vendor" },
        "T1558": { detect: 0.85, prevent: 0.40, source: "Vendor" }, "T1558.003": { detect: 0.88, prevent: 0.45, source: "Vendor" },
        "T1110": { detect: 0.82, prevent: 0.40, source: "Vendor" }, "T1078": { detect: 0.80, prevent: 0.35, source: "Vendor" },
        "T1550": { detect: 0.78, prevent: 0.38, source: "Vendor" }, "T1134": { detect: 0.72, prevent: 0.30, source: "Vendor" },
        "T1021": { detect: 0.70, prevent: 0.28, source: "Vendor" }, "T1068": { detect: 0.55, prevent: 0.20, source: "Vendor" },
        "T1548": { detect: 0.60, prevent: 0.22, source: "Vendor" },
      },
    },
    "crowdstrike-identity": {
      display_name: "CrowdStrike Identity Protection",
      category: "identity_security",
      data_source: "vendor_nav_layer",
      techniques: {
        "T1003": { detect: 0.82, prevent: 0.48, source: "Vendor" }, "T1558": { detect: 0.80, prevent: 0.42, source: "Vendor" },
        "T1110": { detect: 0.80, prevent: 0.42, source: "Vendor" }, "T1078": { detect: 0.78, prevent: 0.38, source: "Vendor" },
        "T1550": { detect: 0.75, prevent: 0.40, source: "Vendor" }, "T1134": { detect: 0.68, prevent: 0.32, source: "Vendor" },
        "T1021": { detect: 0.68, prevent: 0.30, source: "Vendor" },
      },
    },
  },
  infrastructure: {
    "active-directory": {
      display_name: "Active Directory",
      category: "identity",
      exposes: {
        "T1003": 0.9, "T1003.001": 0.95, "T1558": 1.0, "T1558.003": 1.0,
        "T1110": 0.8, "T1078": 0.85, "T1550": 0.85, "T1134": 0.8,
        "T1021": 0.8, "T1068": 0.6, "T1484": 0.9, "T1482": 0.9,
        "T1087": 0.85, "T1069": 0.85,
      },
    },
    "azure-ad": {
      display_name: "Azure AD / Entra ID",
      category: "identity",
      exposes: {
        "T1078": 0.9, "T1078.004": 0.95, "T1110": 0.75, "T1550": 0.7,
        "T1134": 0.6, "T1098": 0.85, "T1087": 0.7, "T1069": 0.7,
      },
    },
    "okta": {
      display_name: "Okta",
      category: "identity",
      exposes: {
        "T1078": 0.85, "T1110": 0.7, "T1550": 0.6, "T1098": 0.75,
      },
    },
    "aws": {
      display_name: "Amazon Web Services",
      category: "cloud",
      exposes: {
        "T1078": 0.8, "T1078.004": 0.9, "T1580": 0.85, "T1538": 0.8,
        "T1190": 0.7, "T1133": 0.65, "T1098": 0.8, "T1087": 0.7,
        "T1069": 0.65, "T1041": 0.6, "T1048": 0.55, "T1530": 0.85,
        "T1537": 0.8, "T1204": 0.5,
      },
    },
    "azure": {
      display_name: "Microsoft Azure",
      category: "cloud",
      exposes: {
        "T1078": 0.8, "T1078.004": 0.9, "T1580": 0.85, "T1538": 0.8,
        "T1190": 0.7, "T1133": 0.65, "T1098": 0.8, "T1087": 0.7,
        "T1069": 0.65, "T1041": 0.6, "T1530": 0.8, "T1537": 0.75,
      },
    },
    "gcp": {
      display_name: "Google Cloud Platform",
      category: "cloud",
      exposes: {
        "T1078": 0.8, "T1078.004": 0.9, "T1580": 0.85, "T1190": 0.65,
        "T1098": 0.75, "T1087": 0.65, "T1041": 0.55, "T1530": 0.8,
      },
    },
    "windows-server": {
      display_name: "Windows Server",
      category: "os",
      exposes: {
        "T1059": 0.85, "T1059.001": 0.9, "T1047": 0.85, "T1053": 0.8,
        "T1547": 0.85, "T1543": 0.85, "T1546": 0.8, "T1055": 0.85,
        "T1036": 0.8, "T1027": 0.75, "T1562": 0.8, "T1070": 0.75,
        "T1003": 0.85, "T1068": 0.7, "T1548": 0.75, "T1134": 0.8,
        "T1021": 0.8, "T1570": 0.75, "T1057": 0.8, "T1082": 0.8,
        "T1005": 0.7, "T1486": 0.8, "T1489": 0.7, "T1529": 0.6,
        "T1204": 0.7,
      },
    },
    "windows-workstation": {
      display_name: "Windows 10/11",
      category: "os",
      exposes: {
        "T1059": 0.85, "T1059.001": 0.9, "T1047": 0.8, "T1053": 0.75,
        "T1547": 0.85, "T1543": 0.7, "T1546": 0.8, "T1055": 0.85,
        "T1036": 0.8, "T1027": 0.75, "T1562": 0.75, "T1070": 0.7,
        "T1003": 0.8, "T1068": 0.65, "T1548": 0.7, "T1134": 0.75,
        "T1204": 0.8, "T1566": 0.8, "T1057": 0.75, "T1082": 0.75,
        "T1005": 0.75, "T1486": 0.85, "T1560": 0.7,
      },
    },
    "linux": {
      display_name: "Linux (Ubuntu/RHEL/etc)",
      category: "os",
      exposes: {
        "T1059": 0.8, "T1059.004": 0.9, "T1053": 0.75, "T1547": 0.7,
        "T1543": 0.8, "T1068": 0.75, "T1548": 0.8, "T1070": 0.75,
        "T1003": 0.6, "T1055": 0.7, "T1036": 0.75, "T1027": 0.7,
        "T1021": 0.7, "T1190": 0.75, "T1133": 0.7, "T1057": 0.75,
        "T1082": 0.75, "T1005": 0.7, "T1486": 0.7, "T1046": 0.7,
      },
    },
    "macos": {
      display_name: "macOS",
      category: "os",
      exposes: {
        "T1059": 0.75, "T1059.004": 0.85, "T1547": 0.7, "T1546": 0.65,
        "T1068": 0.6, "T1548": 0.65, "T1036": 0.7, "T1027": 0.65,
        "T1005": 0.7, "T1057": 0.7, "T1082": 0.7, "T1204": 0.7,
        "T1566": 0.7, "T1486": 0.55,
      },
    },
    "m365": {
      display_name: "Microsoft 365",
      category: "email_platform",
      exposes: {
        "T1566": 0.9, "T1566.001": 0.92, "T1566.002": 0.88,
        "T1598": 0.8, "T1204": 0.75, "T1586": 0.6, "T1078": 0.7,
      },
    },
    "google-workspace": {
      display_name: "Google Workspace",
      category: "email_platform",
      exposes: {
        "T1566": 0.85, "T1598": 0.75, "T1204": 0.7, "T1586": 0.55, "T1078": 0.65,
      },
    },
    "vmware": {
      display_name: "VMware vSphere",
      category: "virtualization",
      exposes: {
        "T1190": 0.6, "T1021": 0.55, "T1078": 0.6, "T1486": 0.7,
        "T1489": 0.65, "T1529": 0.6,
      },
    },
    "docker-k8s": {
      display_name: "Docker / Kubernetes",
      category: "virtualization",
      exposes: {
        "T1190": 0.7, "T1133": 0.6, "T1078": 0.65, "T1068": 0.7,
        "T1053": 0.55, "T1543": 0.6, "T1046": 0.6,
      },
    },
  },
  // Category metadata for UI grouping
  toolCategories: [
    { id: "edr", name: "EDR / XDR", icon: "\u2316" },
    { id: "siem", name: "SIEM / Log Management", icon: "\u25CE" },
    { id: "network", name: "Network Security", icon: "\u26E9" },
    { id: "email", name: "Email Security", icon: "\u2709" },
    { id: "hardening", name: "Endpoint Hardening", icon: "\u2B22" },
    { id: "vuln_mgmt", name: "Vulnerability Management", icon: "\u2690" },
    { id: "identity_security", name: "Identity Security", icon: "\u26BF" },
  ],
  infraCategories: [
    { id: "identity", name: "Identity & Access", icon: "\u26BF" },
    { id: "cloud", name: "Cloud Platforms", icon: "\u2601" },
    { id: "os", name: "Operating Systems", icon: "\u2395" },
    { id: "email_platform", name: "Email Platform", icon: "\u2709" },
    { id: "virtualization", name: "Virtualization / Containers", icon: "\u2B22" },
  ],
};

// ICS Coverage KB — OT-specific tools and infrastructure
export const ICS_COVERAGE_KB: CoverageKB = {
  metadata: {
    attack_version: "16.1",
    last_updated: "2026-03-10",
    sources: ["Vendor Documentation", "ICS-CERT Advisories", "ATT&CK for ICS Data Sources"],
  },
  tools: {
    "claroty": {
      display_name: "Claroty",
      category: "ot_monitoring",
      data_source: "vendor_nav_layer",
      techniques: {
        "T0846": { detect: 0.85, prevent: 0.0, source: "Vendor" },
        "T0842": { detect: 0.80, prevent: 0.40, source: "Vendor" },
        "T0855": { detect: 0.75, prevent: 0.35, source: "Vendor" },
        "T0860": { detect: 0.82, prevent: 0.0, source: "Vendor" },
        "T0843": { detect: 0.78, prevent: 0.0, source: "Vendor" },
        "T0886": { detect: 0.80, prevent: 0.0, source: "Vendor" },
        "T0821": { detect: 0.72, prevent: 0.30, source: "Vendor" },
      },
    },
    "dragos": {
      display_name: "Dragos Platform",
      category: "ot_monitoring",
      data_source: "vendor_nav_layer",
      techniques: {
        "T0846": { detect: 0.88, prevent: 0.0, source: "Vendor" },
        "T0842": { detect: 0.82, prevent: 0.35, source: "Vendor" },
        "T0855": { detect: 0.80, prevent: 0.40, source: "Vendor" },
        "T0843": { detect: 0.82, prevent: 0.0, source: "Vendor" },
        "T0886": { detect: 0.78, prevent: 0.0, source: "Vendor" },
        "T0821": { detect: 0.75, prevent: 0.32, source: "Vendor" },
        "T0860": { detect: 0.78, prevent: 0.0, source: "Vendor" },
        "T0836": { detect: 0.80, prevent: 0.0, source: "Vendor" },
      },
    },
    "nozomi": {
      display_name: "Nozomi Networks",
      category: "ot_monitoring",
      data_source: "vendor_nav_layer",
      techniques: {
        "T0846": { detect: 0.82, prevent: 0.0, source: "Vendor" },
        "T0842": { detect: 0.78, prevent: 0.30, source: "Vendor" },
        "T0855": { detect: 0.72, prevent: 0.30, source: "Vendor" },
        "T0843": { detect: 0.75, prevent: 0.0, source: "Vendor" },
        "T0886": { detect: 0.74, prevent: 0.0, source: "Vendor" },
        "T0821": { detect: 0.70, prevent: 0.28, source: "Vendor" },
      },
    },
  },
  infrastructure: {
    "rockwell": {
      display_name: "Rockwell / Allen-Bradley",
      category: "plc",
      exposes: {
        "T0843": 0.9, "T0821": 0.85, "T0836": 0.8, "T0855": 0.85,
        "T0886": 0.8, "T0846": 0.75, "T0842": 0.7,
      },
    },
    "siemens": {
      display_name: "Siemens",
      category: "plc",
      exposes: {
        "T0843": 0.9, "T0821": 0.85, "T0836": 0.85, "T0855": 0.85,
        "T0886": 0.8, "T0846": 0.75, "T0842": 0.7,
      },
    },
    "schneider": {
      display_name: "Schneider Electric",
      category: "plc",
      exposes: {
        "T0843": 0.88, "T0821": 0.82, "T0836": 0.8, "T0855": 0.82,
        "T0886": 0.78, "T0846": 0.72, "T0842": 0.68,
      },
    },
  },
  toolCategories: [
    { id: "ot_monitoring", name: "OT Network Monitoring", icon: "\u25CE" },
  ],
  infraCategories: [
    { id: "plc", name: "PLC / DCS Vendors", icon: "\u2699" },
  ],
};
