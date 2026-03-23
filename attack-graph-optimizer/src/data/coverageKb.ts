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
    // ── NDR (Network Detection & Response) ──
    "darktrace": {
      display_name: "Darktrace",
      category: "ndr",
      data_source: "vendor_docs",
      techniques: {
        "T1071": { detect: 0.78, prevent: 0.35, source: "Vendor" }, "T1572": { detect: 0.75, prevent: 0.40, source: "Vendor" },
        "T1095": { detect: 0.72, prevent: 0.30, source: "Vendor" }, "T1570": { detect: 0.70, prevent: 0.28, source: "Vendor" },
        "T1048": { detect: 0.74, prevent: 0.38, source: "Vendor" }, "T1041": { detect: 0.72, prevent: 0.35, source: "Vendor" },
        "T1571": { detect: 0.68, prevent: 0.32, source: "Vendor" },
      },
    },
    "vectra_ai": {
      display_name: "Vectra AI",
      category: "ndr",
      data_source: "vendor_docs",
      techniques: {
        "T1071": { detect: 0.76, prevent: 0.32, source: "Vendor" }, "T1572": { detect: 0.73, prevent: 0.38, source: "Vendor" },
        "T1095": { detect: 0.70, prevent: 0.28, source: "Vendor" }, "T1570": { detect: 0.68, prevent: 0.26, source: "Vendor" },
        "T1048": { detect: 0.72, prevent: 0.35, source: "Vendor" }, "T1041": { detect: 0.70, prevent: 0.32, source: "Vendor" },
        "T1571": { detect: 0.66, prevent: 0.30, source: "Vendor" }, "T1021": { detect: 0.65, prevent: 0.22, source: "Vendor" },
        "T1090": { detect: 0.68, prevent: 0.30, source: "Vendor" },
      },
    },
    "extrahop": {
      display_name: "ExtraHop Reveal(x)",
      category: "ndr",
      data_source: "vendor_docs",
      techniques: {
        "T1071": { detect: 0.75, prevent: 0.30, source: "Vendor" }, "T1572": { detect: 0.72, prevent: 0.36, source: "Vendor" },
        "T1095": { detect: 0.70, prevent: 0.28, source: "Vendor" }, "T1570": { detect: 0.68, prevent: 0.25, source: "Vendor" },
        "T1048": { detect: 0.71, prevent: 0.34, source: "Vendor" }, "T1041": { detect: 0.69, prevent: 0.30, source: "Vendor" },
        "T1571": { detect: 0.65, prevent: 0.28, source: "Vendor" },
      },
    },
    // ── WAF (Web Application Firewall) ──
    "cloudflare_waf": {
      display_name: "Cloudflare WAF",
      category: "waf",
      data_source: "vendor_docs",
      techniques: {
        "T1190": { detect: 0.72, prevent: 0.80, source: "Vendor" }, "T1133": { detect: 0.55, prevent: 0.50, source: "Vendor" },
        "T1595": { detect: 0.60, prevent: 0.40, source: "Vendor" },
      },
    },
    "aws_waf": {
      display_name: "AWS WAF",
      category: "waf",
      data_source: "vendor_docs",
      techniques: {
        "T1190": { detect: 0.70, prevent: 0.78, source: "Vendor" }, "T1133": { detect: 0.52, prevent: 0.48, source: "Vendor" },
        "T1595": { detect: 0.58, prevent: 0.38, source: "Vendor" },
      },
    },
    "imperva": {
      display_name: "Imperva WAF",
      category: "waf",
      data_source: "vendor_docs",
      techniques: {
        "T1190": { detect: 0.74, prevent: 0.82, source: "Vendor" }, "T1133": { detect: 0.56, prevent: 0.52, source: "Vendor" },
        "T1595": { detect: 0.62, prevent: 0.42, source: "Vendor" },
      },
    },
    // ── CASB / SSPM ──
    "netskope": {
      display_name: "Netskope",
      category: "casb",
      data_source: "vendor_docs",
      techniques: {
        "T1567": { detect: 0.78, prevent: 0.65, source: "Vendor" }, "T1537": { detect: 0.72, prevent: 0.55, source: "Vendor" },
        "T1530": { detect: 0.70, prevent: 0.50, source: "Vendor" }, "T1078": { detect: 0.65, prevent: 0.40, source: "Vendor" },
      },
    },
    "microsoft_defender_cloud_apps": {
      display_name: "Microsoft Defender for Cloud Apps",
      category: "casb",
      data_source: "vendor_docs",
      techniques: {
        "T1567": { detect: 0.75, prevent: 0.62, source: "Vendor" }, "T1537": { detect: 0.70, prevent: 0.52, source: "Vendor" },
        "T1530": { detect: 0.68, prevent: 0.48, source: "Vendor" }, "T1078": { detect: 0.68, prevent: 0.42, source: "Vendor" },
      },
    },
    // ── DLP (Data Loss Prevention) ──
    "symantec_dlp": {
      display_name: "Symantec DLP",
      category: "dlp",
      data_source: "vendor_docs",
      techniques: {
        "T1048": { detect: 0.75, prevent: 0.68, source: "Vendor" }, "T1041": { detect: 0.72, prevent: 0.65, source: "Vendor" },
        "T1567": { detect: 0.78, prevent: 0.70, source: "Vendor" }, "T1052": { detect: 0.60, prevent: 0.55, source: "Vendor" },
        "T1020": { detect: 0.65, prevent: 0.58, source: "Vendor" },
      },
    },
    "microsoft_purview": {
      display_name: "Microsoft Purview DLP",
      category: "dlp",
      data_source: "vendor_docs",
      techniques: {
        "T1048": { detect: 0.72, prevent: 0.65, source: "Vendor" }, "T1041": { detect: 0.70, prevent: 0.62, source: "Vendor" },
        "T1567": { detect: 0.76, prevent: 0.68, source: "Vendor" }, "T1052": { detect: 0.55, prevent: 0.50, source: "Vendor" },
        "T1020": { detect: 0.62, prevent: 0.55, source: "Vendor" },
      },
    },
    // ── PAM (Privileged Access Management) ──
    "cyberark": {
      display_name: "CyberArk",
      category: "pam",
      data_source: "vendor_docs",
      techniques: {
        "T1078": { detect: 0.72, prevent: 0.80, source: "Vendor" }, "T1134": { detect: 0.65, prevent: 0.55, source: "Vendor" },
        "T1098": { detect: 0.68, prevent: 0.70, source: "Vendor" }, "T1003": { detect: 0.58, prevent: 0.60, source: "Vendor" },
      },
    },
    "beyondtrust": {
      display_name: "BeyondTrust",
      category: "pam",
      data_source: "vendor_docs",
      techniques: {
        "T1078": { detect: 0.70, prevent: 0.78, source: "Vendor" }, "T1134": { detect: 0.62, prevent: 0.52, source: "Vendor" },
        "T1098": { detect: 0.65, prevent: 0.68, source: "Vendor" }, "T1003": { detect: 0.55, prevent: 0.58, source: "Vendor" },
      },
    },
    // ── Backup & Recovery ──
    "veeam": {
      display_name: "Veeam",
      category: "backup",
      data_source: "vendor_docs",
      techniques: {
        "T1490": { detect: 0.60, prevent: 0.70, source: "Vendor" }, "T1486": { detect: 0.45, prevent: 0.50, source: "Vendor" },
        "T1561": { detect: 0.50, prevent: 0.60, source: "Vendor" },
      },
    },
    "cohesity": {
      display_name: "Cohesity DataProtect",
      category: "backup",
      data_source: "vendor_docs",
      techniques: {
        "T1490": { detect: 0.58, prevent: 0.68, source: "Vendor" }, "T1486": { detect: 0.42, prevent: 0.48, source: "Vendor" },
        "T1561": { detect: 0.48, prevent: 0.58, source: "Vendor" },
      },
    },
    // ── Deception ──
    "attivo": {
      display_name: "Attivo Networks (SentinelOne)",
      category: "deception",
      data_source: "vendor_docs",
      techniques: {
        "T1021": { detect: 0.70, prevent: 0.0, source: "Vendor" }, "T1078": { detect: 0.60, prevent: 0.0, source: "Vendor" },
        "T1570": { detect: 0.70, prevent: 0.0, source: "Vendor" }, "T1083": { detect: 0.50, prevent: 0.0, source: "Vendor" },
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
    // ── Network Infrastructure ──
    "cisco_switches": {
      display_name: "Cisco Network Infrastructure",
      category: "network_infra",
      exposes: {
        "T1557": 0.7, "T1200": 0.6, "T1599": 0.8, "T1602": 0.7,
      },
    },
    "palo_alto_network": {
      display_name: "Palo Alto Networks (Firewalls)",
      category: "network_infra",
      exposes: {
        "T1590": 0.5, "T1602": 0.6,
      },
    },
    // ── MDM / Endpoint Management ──
    "intune": {
      display_name: "Microsoft Intune",
      category: "endpoint_mgmt",
      exposes: {
        "T1072": 0.7, "T1218": 0.5,
      },
    },
    "jamf": {
      display_name: "Jamf Pro (macOS)",
      category: "endpoint_mgmt",
      exposes: {
        "T1072": 0.7,
      },
    },
    // ── DNS ──
    "internal_dns": {
      display_name: "Internal DNS (AD-Integrated)",
      category: "dns",
      exposes: {
        "T1071": 0.6, "T1568": 0.7,
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
    { id: "ndr", name: "NDR (Network Detection & Response)", icon: "\u25C9" },
    { id: "waf", name: "WAF (Web Application Firewall)", icon: "\u2B21" },
    { id: "casb", name: "CASB / SSPM", icon: "\u2601" },
    { id: "dlp", name: "Data Loss Prevention", icon: "\u2B19" },
    { id: "pam", name: "Privileged Access Management", icon: "\u26BF" },
    { id: "backup", name: "Backup & Recovery", icon: "\u21BB" },
    { id: "deception", name: "Deception", icon: "\u2666" },
  ],
  infraCategories: [
    { id: "identity", name: "Identity & Access", icon: "\u26BF" },
    { id: "cloud", name: "Cloud Platforms", icon: "\u2601" },
    { id: "os", name: "Operating Systems", icon: "\u2395" },
    { id: "email_platform", name: "Email Platform", icon: "\u2709" },
    { id: "virtualization", name: "Virtualization / Containers", icon: "\u2B22" },
    { id: "network_infra", name: "Network Infrastructure", icon: "\u26E9" },
    { id: "endpoint_mgmt", name: "MDM / Endpoint Management", icon: "\u2316" },
    { id: "dns", name: "DNS", icon: "\u25CE" },
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
    "fortinet_ot": {
      display_name: "Fortinet OT Security",
      category: "ot_monitoring",
      data_source: "vendor_docs",
      techniques: {
        "T0846": { detect: 0.80, prevent: 0.0, source: "Vendor" },
        "T0842": { detect: 0.70, prevent: 0.30, source: "Vendor" },
        "T0855": { detect: 0.72, prevent: 0.32, source: "Vendor" },
        "T0860": { detect: 0.50, prevent: 0.0, source: "Vendor" },
      },
    },
    "cisco_cyber_vision": {
      display_name: "Cisco Cyber Vision",
      category: "ot_monitoring",
      data_source: "vendor_docs",
      techniques: {
        "T0846": { detect: 0.78, prevent: 0.0, source: "Vendor" },
        "T0842": { detect: 0.72, prevent: 0.28, source: "Vendor" },
        "T0855": { detect: 0.68, prevent: 0.28, source: "Vendor" },
      },
    },
    "tenable_ot": {
      display_name: "Tenable OT Security",
      category: "ot_monitoring",
      data_source: "vendor_docs",
      techniques: {
        "T0846": { detect: 0.75, prevent: 0.0, source: "Vendor" },
        "T0842": { detect: 0.65, prevent: 0.25, source: "Vendor" },
        "T0855": { detect: 0.70, prevent: 0.30, source: "Vendor" },
        "T0843": { detect: 0.60, prevent: 0.0, source: "Vendor" },
        "T0836": { detect: 0.55, prevent: 0.0, source: "Vendor" },
      },
    },
    "opswat": {
      display_name: "OPSWAT MetaDefender OT",
      category: "ot_monitoring",
      data_source: "vendor_docs",
      techniques: {
        "T0843": { detect: 0.70, prevent: 0.65, source: "Vendor" },
        "T0821": { detect: 0.60, prevent: 0.55, source: "Vendor" },
        "T0836": { detect: 0.55, prevent: 0.50, source: "Vendor" },
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
    "honeywell": {
      display_name: "Honeywell",
      category: "plc",
      exposes: {
        "T0843": 0.88, "T0821": 0.82, "T0836": 0.78, "T0886": 0.75,
        "T0855": 0.70, "T0846": 0.60, "T0842": 0.55,
      },
    },
    "abb": {
      display_name: "ABB",
      category: "plc",
      exposes: {
        "T0843": 0.87, "T0821": 0.83, "T0836": 0.79, "T0886": 0.74,
        "T0855": 0.68, "T0846": 0.58, "T0842": 0.53,
      },
    },
    "emerson": {
      display_name: "Emerson (DeltaV)",
      category: "plc",
      exposes: {
        "T0843": 0.86, "T0821": 0.80, "T0836": 0.77, "T0886": 0.73,
        "T0855": 0.69, "T0846": 0.59, "T0842": 0.54,
      },
    },
    "ge_vernova": {
      display_name: "GE Vernova",
      category: "plc",
      exposes: {
        "T0843": 0.85, "T0821": 0.81, "T0836": 0.76, "T0886": 0.72,
        "T0855": 0.67, "T0846": 0.57, "T0842": 0.52,
      },
    },
    "yokogawa": {
      display_name: "Yokogawa",
      category: "plc",
      exposes: {
        "T0843": 0.87, "T0821": 0.82, "T0836": 0.78, "T0886": 0.74,
        "T0855": 0.69, "T0846": 0.58, "T0842": 0.53,
      },
    },
    "mitsubishi_electric": {
      display_name: "Mitsubishi Electric",
      category: "plc",
      exposes: {
        "T0843": 0.86, "T0821": 0.80, "T0836": 0.77, "T0886": 0.73,
        "T0855": 0.68, "T0846": 0.57, "T0842": 0.52,
      },
    },
    // ── SCADA Software ──
    "wonderware": {
      display_name: "AVEVA (Wonderware)",
      category: "scada",
      exposes: {
        "T0843": 0.75, "T0821": 0.70, "T0836": 0.72, "T0855": 0.80,
        "T0846": 0.65,
      },
    },
    "ignition": {
      display_name: "Inductive Automation Ignition",
      category: "scada",
      exposes: {
        "T0843": 0.73, "T0821": 0.68, "T0836": 0.70, "T0855": 0.78,
        "T0846": 0.63,
      },
    },
    // ── Safety Systems ──
    "triconex": {
      display_name: "Schneider Triconex (SIS)",
      category: "safety",
      exposes: {
        "T0843": 0.90, "T0821": 0.88, "T0836": 0.85, "T0855": 0.82,
      },
    },
    "hima": {
      display_name: "HIMA Safety Systems",
      category: "safety",
      exposes: {
        "T0843": 0.88, "T0821": 0.86, "T0836": 0.83, "T0855": 0.80,
      },
    },
  },
  toolCategories: [
    { id: "ot_monitoring", name: "OT Network Monitoring", icon: "\u25CE" },
  ],
  infraCategories: [
    { id: "plc", name: "PLC / DCS Vendors", icon: "\u2699" },
    { id: "scada", name: "SCADA Software", icon: "\u2395" },
    { id: "safety", name: "Safety Systems (SIS)", icon: "\u26A0" },
  ],
};
