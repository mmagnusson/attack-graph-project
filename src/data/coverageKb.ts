// ─── Coverage Knowledge Base (Environment Profiling) ─────────────────────────
// Maps security products → per-technique detection/prevention scores and
// infrastructure items → per-technique exposure relevance.
// Scores: detect/prevent 0.0 (none) to 1.0 (full). exposes 0.0 (irrelevant) to 1.0 (fully relevant).
//
// PROVENANCE: these scores are ESTIMATES written by the project authors. They
// are NOT derived from MITRE ATT&CK Evaluations results (which report
// per-substep detection categories, not 0–1 scores) or from vendor-published
// data, and there is no derivation pipeline in this repo. Treat them as
// illustrative defaults; replace them with your own validation results.
// See README "Data provenance".

import type { CoverageKB } from '../types';

export const COVERAGE_KB: CoverageKB = {
  metadata: {
    attack_version: "19.0",
    last_updated: "2026-03-10",
    provenance: "estimate",
    sources: ["Author estimates informed by public vendor material; not derived from MITRE Evaluations data"],
  },
  tools: {
    "crowdstrike-falcon": {
      display_name: "CrowdStrike Falcon",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.92, prevent: 0.75, source: "estimate" }, "T1059.001": { detect: 0.95, prevent: 0.80, source: "estimate" },
        "T1055": { detect: 0.88, prevent: 0.65, source: "estimate" }, "T1055.012": { detect: 0.85, prevent: 0.60, source: "estimate" },
        "T1547": { detect: 0.90, prevent: 0.70, source: "estimate" }, "T1543": { detect: 0.85, prevent: 0.65, source: "estimate" },
        "T1546": { detect: 0.87, prevent: 0.60, source: "estimate" }, "T1053": { detect: 0.82, prevent: 0.55, source: "estimate" },
        "T1068": { detect: 0.75, prevent: 0.50, source: "estimate" }, "T1548": { detect: 0.80, prevent: 0.55, source: "estimate" },
        "T1134": { detect: 0.83, prevent: 0.50, source: "estimate" }, "T1036": { detect: 0.88, prevent: 0.60, source: "estimate" },
        "T1027": { detect: 0.82, prevent: 0.55, source: "estimate" }, "T1685": { detect: 0.78, prevent: 0.50, source: "estimate" },
        "T1070": { detect: 0.80, prevent: 0.45, source: "estimate" }, "T1003": { detect: 0.90, prevent: 0.70, source: "estimate" },
        "T1003.001": { detect: 0.92, prevent: 0.75, source: "estimate" }, "T1110": { detect: 0.70, prevent: 0.40, source: "estimate" },
        "T1021": { detect: 0.75, prevent: 0.40, source: "estimate" }, "T1570": { detect: 0.78, prevent: 0.45, source: "estimate" },
        "T1057": { detect: 0.85, prevent: 0.30, source: "estimate" }, "T1082": { detect: 0.80, prevent: 0.25, source: "estimate" },
        "T1005": { detect: 0.72, prevent: 0.35, source: "estimate" }, "T1204": { detect: 0.80, prevent: 0.60, source: "estimate" },
        "T1047": { detect: 0.85, prevent: 0.55, source: "estimate" }, "T1071": { detect: 0.70, prevent: 0.40, source: "estimate" },
        "T1573": { detect: 0.65, prevent: 0.35, source: "estimate" }, "T1486": { detect: 0.85, prevent: 0.70, source: "estimate" },
        "T1041": { detect: 0.68, prevent: 0.40, source: "estimate" }, "T1550": { detect: 0.75, prevent: 0.45, source: "estimate" },
        "T1558": { detect: 0.72, prevent: 0.35, source: "estimate" }, "T1560": { detect: 0.70, prevent: 0.40, source: "estimate" },
        "T1048": { detect: 0.65, prevent: 0.35, source: "estimate" }, "T1485": { detect: 0.80, prevent: 0.65, source: "estimate" },
        "T1489": { detect: 0.78, prevent: 0.55, source: "estimate" }, "T1529": { detect: 0.75, prevent: 0.50, source: "estimate" },
      },
    },
    "ms-defender-endpoint": {
      display_name: "Microsoft Defender for Endpoint",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.90, prevent: 0.78, source: "estimate" }, "T1059.001": { detect: 0.93, prevent: 0.82, source: "estimate" },
        "T1055": { detect: 0.85, prevent: 0.60, source: "estimate" }, "T1547": { detect: 0.88, prevent: 0.72, source: "estimate" },
        "T1543": { detect: 0.82, prevent: 0.60, source: "estimate" }, "T1546": { detect: 0.84, prevent: 0.58, source: "estimate" },
        "T1053": { detect: 0.80, prevent: 0.55, source: "estimate" }, "T1068": { detect: 0.72, prevent: 0.48, source: "estimate" },
        "T1548": { detect: 0.78, prevent: 0.55, source: "estimate" }, "T1134": { detect: 0.80, prevent: 0.50, source: "estimate" },
        "T1036": { detect: 0.85, prevent: 0.62, source: "estimate" }, "T1027": { detect: 0.80, prevent: 0.55, source: "estimate" },
        "T1685": { detect: 0.82, prevent: 0.58, source: "estimate" }, "T1070": { detect: 0.78, prevent: 0.42, source: "estimate" },
        "T1003": { detect: 0.88, prevent: 0.72, source: "estimate" }, "T1003.001": { detect: 0.90, prevent: 0.75, source: "estimate" },
        "T1110": { detect: 0.68, prevent: 0.40, source: "estimate" }, "T1021": { detect: 0.72, prevent: 0.38, source: "estimate" },
        "T1570": { detect: 0.75, prevent: 0.42, source: "estimate" }, "T1057": { detect: 0.82, prevent: 0.28, source: "estimate" },
        "T1082": { detect: 0.78, prevent: 0.22, source: "estimate" }, "T1005": { detect: 0.70, prevent: 0.35, source: "estimate" },
        "T1204": { detect: 0.82, prevent: 0.65, source: "estimate" }, "T1047": { detect: 0.83, prevent: 0.55, source: "estimate" },
        "T1071": { detect: 0.72, prevent: 0.42, source: "estimate" }, "T1573": { detect: 0.68, prevent: 0.38, source: "estimate" },
        "T1486": { detect: 0.82, prevent: 0.68, source: "estimate" }, "T1041": { detect: 0.65, prevent: 0.38, source: "estimate" },
        "T1550": { detect: 0.73, prevent: 0.45, source: "estimate" }, "T1558": { detect: 0.70, prevent: 0.38, source: "estimate" },
        "T1078": { detect: 0.75, prevent: 0.45, source: "estimate" }, "T1566": { detect: 0.70, prevent: 0.55, source: "estimate" },
      },
    },
    "sentinelone": {
      display_name: "SentinelOne Singularity",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.88, prevent: 0.72, source: "estimate" }, "T1055": { detect: 0.84, prevent: 0.62, source: "estimate" },
        "T1547": { detect: 0.86, prevent: 0.68, source: "estimate" }, "T1543": { detect: 0.80, prevent: 0.58, source: "estimate" },
        "T1546": { detect: 0.82, prevent: 0.55, source: "estimate" }, "T1053": { detect: 0.78, prevent: 0.52, source: "estimate" },
        "T1068": { detect: 0.70, prevent: 0.45, source: "estimate" }, "T1548": { detect: 0.76, prevent: 0.50, source: "estimate" },
        "T1134": { detect: 0.78, prevent: 0.48, source: "estimate" }, "T1036": { detect: 0.84, prevent: 0.58, source: "estimate" },
        "T1027": { detect: 0.80, prevent: 0.52, source: "estimate" }, "T1685": { detect: 0.75, prevent: 0.48, source: "estimate" },
        "T1070": { detect: 0.76, prevent: 0.40, source: "estimate" }, "T1003": { detect: 0.86, prevent: 0.68, source: "estimate" },
        "T1021": { detect: 0.72, prevent: 0.38, source: "estimate" }, "T1057": { detect: 0.80, prevent: 0.25, source: "estimate" },
        "T1204": { detect: 0.78, prevent: 0.58, source: "estimate" }, "T1047": { detect: 0.80, prevent: 0.52, source: "estimate" },
        "T1486": { detect: 0.82, prevent: 0.65, source: "estimate" }, "T1071": { detect: 0.68, prevent: 0.38, source: "estimate" },
        "T1573": { detect: 0.62, prevent: 0.32, source: "estimate" }, "T1041": { detect: 0.62, prevent: 0.35, source: "estimate" },
      },
    },
    "cortex-xdr": {
      display_name: "Cortex XDR (Palo Alto)",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.90, prevent: 0.74, source: "estimate" }, "T1055": { detect: 0.86, prevent: 0.64, source: "estimate" },
        "T1547": { detect: 0.88, prevent: 0.70, source: "estimate" }, "T1543": { detect: 0.83, prevent: 0.62, source: "estimate" },
        "T1546": { detect: 0.85, prevent: 0.58, source: "estimate" }, "T1053": { detect: 0.80, prevent: 0.54, source: "estimate" },
        "T1068": { detect: 0.73, prevent: 0.48, source: "estimate" }, "T1548": { detect: 0.78, prevent: 0.54, source: "estimate" },
        "T1134": { detect: 0.80, prevent: 0.50, source: "estimate" }, "T1036": { detect: 0.86, prevent: 0.60, source: "estimate" },
        "T1027": { detect: 0.82, prevent: 0.56, source: "estimate" }, "T1685": { detect: 0.80, prevent: 0.52, source: "estimate" },
        "T1070": { detect: 0.78, prevent: 0.44, source: "estimate" }, "T1003": { detect: 0.88, prevent: 0.70, source: "estimate" },
        "T1021": { detect: 0.74, prevent: 0.40, source: "estimate" }, "T1570": { detect: 0.76, prevent: 0.44, source: "estimate" },
        "T1057": { detect: 0.82, prevent: 0.28, source: "estimate" }, "T1082": { detect: 0.78, prevent: 0.24, source: "estimate" },
        "T1204": { detect: 0.80, prevent: 0.62, source: "estimate" }, "T1047": { detect: 0.82, prevent: 0.54, source: "estimate" },
        "T1486": { detect: 0.84, prevent: 0.68, source: "estimate" }, "T1071": { detect: 0.74, prevent: 0.48, source: "estimate" },
        "T1573": { detect: 0.70, prevent: 0.42, source: "estimate" }, "T1041": { detect: 0.66, prevent: 0.40, source: "estimate" },
        "T1550": { detect: 0.74, prevent: 0.46, source: "estimate" },
      },
    },
    "carbon-black": {
      display_name: "Carbon Black (VMware)",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.82, prevent: 0.60, source: "estimate" }, "T1055": { detect: 0.78, prevent: 0.52, source: "estimate" },
        "T1547": { detect: 0.80, prevent: 0.58, source: "estimate" }, "T1543": { detect: 0.75, prevent: 0.50, source: "estimate" },
        "T1546": { detect: 0.76, prevent: 0.48, source: "estimate" }, "T1053": { detect: 0.72, prevent: 0.45, source: "estimate" },
        "T1036": { detect: 0.78, prevent: 0.52, source: "estimate" }, "T1027": { detect: 0.74, prevent: 0.48, source: "estimate" },
        "T1003": { detect: 0.80, prevent: 0.60, source: "estimate" }, "T1204": { detect: 0.72, prevent: 0.50, source: "estimate" },
        "T1047": { detect: 0.75, prevent: 0.48, source: "estimate" }, "T1486": { detect: 0.76, prevent: 0.58, source: "estimate" },
        "T1071": { detect: 0.62, prevent: 0.32, source: "estimate" }, "T1021": { detect: 0.68, prevent: 0.35, source: "estimate" },
      },
    },
    "cybereason": {
      display_name: "Cybereason",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.85, prevent: 0.65, source: "estimate" }, "T1055": { detect: 0.80, prevent: 0.55, source: "estimate" },
        "T1547": { detect: 0.82, prevent: 0.60, source: "estimate" }, "T1036": { detect: 0.80, prevent: 0.55, source: "estimate" },
        "T1003": { detect: 0.82, prevent: 0.62, source: "estimate" }, "T1204": { detect: 0.75, prevent: 0.55, source: "estimate" },
        "T1047": { detect: 0.78, prevent: 0.50, source: "estimate" }, "T1486": { detect: 0.80, prevent: 0.60, source: "estimate" },
        "T1027": { detect: 0.76, prevent: 0.48, source: "estimate" }, "T1134": { detect: 0.74, prevent: 0.42, source: "estimate" },
        "T1685": { detect: 0.72, prevent: 0.45, source: "estimate" }, "T1070": { detect: 0.70, prevent: 0.38, source: "estimate" },
      },
    },
    "eset": {
      display_name: "ESET",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.80, prevent: 0.62, source: "estimate" }, "T1055": { detect: 0.75, prevent: 0.50, source: "estimate" },
        "T1547": { detect: 0.78, prevent: 0.58, source: "estimate" }, "T1036": { detect: 0.76, prevent: 0.52, source: "estimate" },
        "T1003": { detect: 0.78, prevent: 0.58, source: "estimate" }, "T1204": { detect: 0.72, prevent: 0.52, source: "estimate" },
        "T1486": { detect: 0.75, prevent: 0.58, source: "estimate" }, "T1027": { detect: 0.72, prevent: 0.46, source: "estimate" },
        "T1543": { detect: 0.70, prevent: 0.48, source: "estimate" }, "T1047": { detect: 0.72, prevent: 0.46, source: "estimate" },
      },
    },
    "sophos": {
      display_name: "Sophos Intercept X",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.84, prevent: 0.70, source: "estimate" }, "T1055": { detect: 0.78, prevent: 0.55, source: "estimate" },
        "T1547": { detect: 0.82, prevent: 0.62, source: "estimate" }, "T1036": { detect: 0.80, prevent: 0.56, source: "estimate" },
        "T1003": { detect: 0.84, prevent: 0.65, source: "estimate" }, "T1204": { detect: 0.78, prevent: 0.58, source: "estimate" },
        "T1486": { detect: 0.82, prevent: 0.68, source: "estimate" }, "T1027": { detect: 0.76, prevent: 0.50, source: "estimate" },
        "T1134": { detect: 0.75, prevent: 0.45, source: "estimate" }, "T1047": { detect: 0.76, prevent: 0.50, source: "estimate" },
        "T1543": { detect: 0.74, prevent: 0.52, source: "estimate" }, "T1685": { detect: 0.72, prevent: 0.46, source: "estimate" },
      },
    },
    "trendmicro": {
      display_name: "Trend Micro Vision One",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.86, prevent: 0.68, source: "estimate" }, "T1055": { detect: 0.80, prevent: 0.58, source: "estimate" },
        "T1547": { detect: 0.84, prevent: 0.64, source: "estimate" }, "T1036": { detect: 0.82, prevent: 0.58, source: "estimate" },
        "T1003": { detect: 0.85, prevent: 0.66, source: "estimate" }, "T1204": { detect: 0.78, prevent: 0.58, source: "estimate" },
        "T1486": { detect: 0.80, prevent: 0.62, source: "estimate" }, "T1027": { detect: 0.78, prevent: 0.52, source: "estimate" },
        "T1134": { detect: 0.76, prevent: 0.46, source: "estimate" }, "T1047": { detect: 0.78, prevent: 0.52, source: "estimate" },
        "T1071": { detect: 0.70, prevent: 0.42, source: "estimate" }, "T1685": { detect: 0.74, prevent: 0.48, source: "estimate" },
        "T1566": { detect: 0.72, prevent: 0.55, source: "estimate" },
      },
    },
    "withsecure": {
      display_name: "WithSecure",
      category: "edr",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.82, prevent: 0.64, source: "estimate" }, "T1055": { detect: 0.76, prevent: 0.52, source: "estimate" },
        "T1547": { detect: 0.80, prevent: 0.60, source: "estimate" }, "T1036": { detect: 0.78, prevent: 0.54, source: "estimate" },
        "T1003": { detect: 0.80, prevent: 0.60, source: "estimate" }, "T1204": { detect: 0.74, prevent: 0.54, source: "estimate" },
        "T1486": { detect: 0.78, prevent: 0.60, source: "estimate" }, "T1027": { detect: 0.74, prevent: 0.48, source: "estimate" },
        "T1047": { detect: 0.74, prevent: 0.48, source: "estimate" },
      },
    },
    // ── SIEM / Log Management ──
    "splunk-es": {
      display_name: "Splunk Enterprise Security",
      category: "siem",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.80, prevent: 0.0, source: "estimate" }, "T1059.001": { detect: 0.85, prevent: 0.0, source: "estimate" },
        "T1055": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1547": { detect: 0.75, prevent: 0.0, source: "estimate" },
        "T1543": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1546": { detect: 0.70, prevent: 0.0, source: "estimate" },
        "T1053": { detect: 0.78, prevent: 0.0, source: "estimate" }, "T1068": { detect: 0.50, prevent: 0.0, source: "estimate" },
        "T1548": { detect: 0.60, prevent: 0.0, source: "estimate" }, "T1134": { detect: 0.62, prevent: 0.0, source: "estimate" },
        "T1036": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1027": { detect: 0.55, prevent: 0.0, source: "estimate" },
        "T1685": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1070": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1003": { detect: 0.78, prevent: 0.0, source: "estimate" }, "T1003.001": { detect: 0.82, prevent: 0.0, source: "estimate" },
        "T1110": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1558": { detect: 0.70, prevent: 0.0, source: "estimate" },
        "T1021": { detect: 0.68, prevent: 0.0, source: "estimate" }, "T1570": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T1057": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1082": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T1005": { detect: 0.55, prevent: 0.0, source: "estimate" }, "T1204": { detect: 0.62, prevent: 0.0, source: "estimate" },
        "T1047": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1071": { detect: 0.72, prevent: 0.0, source: "estimate" },
        "T1573": { detect: 0.58, prevent: 0.0, source: "estimate" }, "T1486": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1078": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1566": { detect: 0.55, prevent: 0.0, source: "estimate" },
        "T1041": { detect: 0.58, prevent: 0.0, source: "estimate" }, "T1048": { detect: 0.55, prevent: 0.0, source: "estimate" },
        "T1550": { detect: 0.65, prevent: 0.0, source: "estimate" },
      },
    },
    "ms-sentinel": {
      display_name: "Microsoft Sentinel",
      category: "siem",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.78, prevent: 0.0, source: "estimate" }, "T1055": { detect: 0.62, prevent: 0.0, source: "estimate" },
        "T1547": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1543": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1053": { detect: 0.75, prevent: 0.0, source: "estimate" }, "T1036": { detect: 0.70, prevent: 0.0, source: "estimate" },
        "T1685": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1070": { detect: 0.65, prevent: 0.0, source: "estimate" },
        "T1003": { detect: 0.75, prevent: 0.0, source: "estimate" }, "T1110": { detect: 0.74, prevent: 0.0, source: "estimate" },
        "T1558": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1078": { detect: 0.78, prevent: 0.0, source: "estimate" },
        "T1021": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1071": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1486": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1566": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T1204": { detect: 0.58, prevent: 0.0, source: "estimate" }, "T1047": { detect: 0.66, prevent: 0.0, source: "estimate" },
        "T1550": { detect: 0.62, prevent: 0.0, source: "estimate" }, "T1134": { detect: 0.58, prevent: 0.0, source: "estimate" },
      },
    },
    "elastic-security": {
      display_name: "Elastic Security",
      category: "siem",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.76, prevent: 0.0, source: "estimate" }, "T1055": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T1547": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1543": { detect: 0.66, prevent: 0.0, source: "estimate" },
        "T1053": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1036": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1685": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1003": { detect: 0.74, prevent: 0.0, source: "estimate" },
        "T1110": { detect: 0.68, prevent: 0.0, source: "estimate" }, "T1078": { detect: 0.70, prevent: 0.0, source: "estimate" },
        "T1021": { detect: 0.64, prevent: 0.0, source: "estimate" }, "T1071": { detect: 0.66, prevent: 0.0, source: "estimate" },
        "T1486": { detect: 0.62, prevent: 0.0, source: "estimate" }, "T1204": { detect: 0.58, prevent: 0.0, source: "estimate" },
        "T1047": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1027": { detect: 0.52, prevent: 0.0, source: "estimate" },
        "T1070": { detect: 0.62, prevent: 0.0, source: "estimate" },
      },
    },
    "qradar": {
      display_name: "IBM QRadar",
      category: "siem",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1547": { detect: 0.65, prevent: 0.0, source: "estimate" },
        "T1003": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1110": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1078": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1021": { detect: 0.62, prevent: 0.0, source: "estimate" },
        "T1071": { detect: 0.65, prevent: 0.0, source: "estimate" }, "T1486": { detect: 0.58, prevent: 0.0, source: "estimate" },
        "T1685": { detect: 0.60, prevent: 0.0, source: "estimate" }, "T1036": { detect: 0.62, prevent: 0.0, source: "estimate" },
        "T1047": { detect: 0.60, prevent: 0.0, source: "estimate" }, "T1558": { detect: 0.62, prevent: 0.0, source: "estimate" },
      },
    },
    "arctic-wolf": {
      display_name: "Arctic Wolf",
      category: "siem",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.75, prevent: 0.0, source: "estimate" }, "T1547": { detect: 0.68, prevent: 0.0, source: "estimate" },
        "T1003": { detect: 0.72, prevent: 0.0, source: "estimate" }, "T1110": { detect: 0.74, prevent: 0.0, source: "estimate" },
        "T1078": { detect: 0.76, prevent: 0.0, source: "estimate" }, "T1021": { detect: 0.64, prevent: 0.0, source: "estimate" },
        "T1071": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1486": { detect: 0.65, prevent: 0.0, source: "estimate" },
        "T1685": { detect: 0.64, prevent: 0.0, source: "estimate" }, "T1036": { detect: 0.66, prevent: 0.0, source: "estimate" },
        "T1204": { detect: 0.62, prevent: 0.0, source: "estimate" }, "T1566": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T1055": { detect: 0.58, prevent: 0.0, source: "estimate" }, "T1053": { detect: 0.64, prevent: 0.0, source: "estimate" },
      },
    },
    // ── Network Security ──
    "paloalto-ngfw": {
      display_name: "Palo Alto NGFW",
      category: "network",
      data_source: "estimate",
      techniques: {
        "T1071": { detect: 0.85, prevent: 0.70, source: "estimate" }, "T1573": { detect: 0.78, prevent: 0.60, source: "estimate" },
        "T1041": { detect: 0.80, prevent: 0.65, source: "estimate" }, "T1048": { detect: 0.78, prevent: 0.62, source: "estimate" },
        "T1190": { detect: 0.72, prevent: 0.60, source: "estimate" }, "T1133": { detect: 0.70, prevent: 0.55, source: "estimate" },
        "T1046": { detect: 0.75, prevent: 0.55, source: "estimate" }, "T1021": { detect: 0.60, prevent: 0.35, source: "estimate" },
        "T1570": { detect: 0.58, prevent: 0.32, source: "estimate" }, "T1595": { detect: 0.65, prevent: 0.45, source: "estimate" },
        "T1566": { detect: 0.55, prevent: 0.40, source: "estimate" }, "T1204": { detect: 0.40, prevent: 0.30, source: "estimate" },
        "T1486": { detect: 0.30, prevent: 0.0, source: "estimate" },
      },
    },
    "fortinet": {
      display_name: "Fortinet FortiGate",
      category: "network",
      data_source: "estimate",
      techniques: {
        "T1071": { detect: 0.82, prevent: 0.68, source: "estimate" }, "T1573": { detect: 0.75, prevent: 0.58, source: "estimate" },
        "T1041": { detect: 0.78, prevent: 0.62, source: "estimate" }, "T1048": { detect: 0.75, prevent: 0.58, source: "estimate" },
        "T1190": { detect: 0.70, prevent: 0.58, source: "estimate" }, "T1133": { detect: 0.68, prevent: 0.52, source: "estimate" },
        "T1046": { detect: 0.72, prevent: 0.50, source: "estimate" }, "T1021": { detect: 0.55, prevent: 0.30, source: "estimate" },
        "T1595": { detect: 0.60, prevent: 0.40, source: "estimate" }, "T1566": { detect: 0.50, prevent: 0.35, source: "estimate" },
      },
    },
    "zscaler": {
      display_name: "Zscaler",
      category: "network",
      data_source: "estimate",
      techniques: {
        "T1071": { detect: 0.80, prevent: 0.65, source: "estimate" }, "T1573": { detect: 0.82, prevent: 0.68, source: "estimate" },
        "T1041": { detect: 0.78, prevent: 0.62, source: "estimate" }, "T1048": { detect: 0.76, prevent: 0.60, source: "estimate" },
        "T1190": { detect: 0.58, prevent: 0.42, source: "estimate" }, "T1133": { detect: 0.65, prevent: 0.50, source: "estimate" },
        "T1566": { detect: 0.62, prevent: 0.48, source: "estimate" }, "T1204": { detect: 0.50, prevent: 0.38, source: "estimate" },
        "T1595": { detect: 0.55, prevent: 0.38, source: "estimate" },
      },
    },
    // ── Email Security ──
    "proofpoint": {
      display_name: "Proofpoint",
      category: "email",
      data_source: "estimate",
      techniques: {
        "T1566": { detect: 0.90, prevent: 0.82, source: "estimate" }, "T1566.001": { detect: 0.92, prevent: 0.85, source: "estimate" },
        "T1566.002": { detect: 0.88, prevent: 0.80, source: "estimate" },
        "T1598": { detect: 0.80, prevent: 0.65, source: "estimate" }, "T1204": { detect: 0.72, prevent: 0.55, source: "estimate" },
        "T1204.001": { detect: 0.75, prevent: 0.58, source: "estimate" },
        "T1586": { detect: 0.50, prevent: 0.25, source: "estimate" }, "T1583": { detect: 0.45, prevent: 0.20, source: "estimate" },
      },
    },
    "mimecast": {
      display_name: "Mimecast",
      category: "email",
      data_source: "estimate",
      techniques: {
        "T1566": { detect: 0.88, prevent: 0.80, source: "estimate" }, "T1598": { detect: 0.78, prevent: 0.62, source: "estimate" },
        "T1204": { detect: 0.68, prevent: 0.50, source: "estimate" }, "T1586": { detect: 0.45, prevent: 0.20, source: "estimate" },
        "T1583": { detect: 0.40, prevent: 0.18, source: "estimate" },
      },
    },
    "ms-defender-o365": {
      display_name: "Microsoft Defender for Office 365",
      category: "email",
      data_source: "estimate",
      techniques: {
        "T1566": { detect: 0.86, prevent: 0.78, source: "estimate" }, "T1598": { detect: 0.75, prevent: 0.60, source: "estimate" },
        "T1204": { detect: 0.70, prevent: 0.52, source: "estimate" }, "T1586": { detect: 0.48, prevent: 0.22, source: "estimate" },
      },
    },
    // ── Endpoint Hardening ──
    "threatlocker": {
      display_name: "ThreatLocker",
      category: "hardening",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.60, prevent: 0.85, source: "estimate" }, "T1059.001": { detect: 0.65, prevent: 0.88, source: "estimate" },
        "T1204": { detect: 0.55, prevent: 0.80, source: "estimate" }, "T1047": { detect: 0.50, prevent: 0.72, source: "estimate" },
        "T1053": { detect: 0.45, prevent: 0.65, source: "estimate" }, "T1543": { detect: 0.40, prevent: 0.60, source: "estimate" },
        "T1055": { detect: 0.35, prevent: 0.55, source: "estimate" }, "T1190": { detect: 0.30, prevent: 0.50, source: "estimate" },
        "T1486": { detect: 0.40, prevent: 0.65, source: "estimate" },
      },
    },
    "applocker-wdac": {
      display_name: "Microsoft AppLocker / WDAC",
      category: "hardening",
      data_source: "estimate",
      techniques: {
        "T1059": { detect: 0.50, prevent: 0.78, source: "estimate" }, "T1059.001": { detect: 0.55, prevent: 0.80, source: "estimate" },
        "T1204": { detect: 0.45, prevent: 0.72, source: "estimate" }, "T1047": { detect: 0.40, prevent: 0.65, source: "estimate" },
        "T1053": { detect: 0.35, prevent: 0.55, source: "estimate" }, "T1055": { detect: 0.30, prevent: 0.48, source: "estimate" },
        "T1486": { detect: 0.30, prevent: 0.55, source: "estimate" },
      },
    },
    // ── Vulnerability Management ──
    "tenable": {
      display_name: "Tenable",
      category: "vuln_mgmt",
      data_source: "estimate",
      techniques: {
        "T1190": { detect: 0.80, prevent: 0.0, source: "estimate" }, "T1068": { detect: 0.75, prevent: 0.0, source: "estimate" },
        "T1133": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1082": { detect: 0.65, prevent: 0.0, source: "estimate" },
        "T1046": { detect: 0.60, prevent: 0.0, source: "estimate" }, "T1595": { detect: 0.55, prevent: 0.0, source: "estimate" },
      },
    },
    // ── Identity Security ──
    "ms-defender-identity": {
      display_name: "Microsoft Defender for Identity",
      category: "identity_security",
      data_source: "estimate",
      techniques: {
        "T1003": { detect: 0.85, prevent: 0.45, source: "estimate" }, "T1003.001": { detect: 0.88, prevent: 0.50, source: "estimate" },
        "T1558": { detect: 0.85, prevent: 0.40, source: "estimate" }, "T1558.003": { detect: 0.88, prevent: 0.45, source: "estimate" },
        "T1110": { detect: 0.82, prevent: 0.40, source: "estimate" }, "T1078": { detect: 0.80, prevent: 0.35, source: "estimate" },
        "T1550": { detect: 0.78, prevent: 0.38, source: "estimate" }, "T1134": { detect: 0.72, prevent: 0.30, source: "estimate" },
        "T1021": { detect: 0.70, prevent: 0.28, source: "estimate" }, "T1068": { detect: 0.55, prevent: 0.20, source: "estimate" },
        "T1548": { detect: 0.60, prevent: 0.22, source: "estimate" },
      },
    },
    "crowdstrike-identity": {
      display_name: "CrowdStrike Identity Protection",
      category: "identity_security",
      data_source: "estimate",
      techniques: {
        "T1003": { detect: 0.82, prevent: 0.48, source: "estimate" }, "T1558": { detect: 0.80, prevent: 0.42, source: "estimate" },
        "T1110": { detect: 0.80, prevent: 0.42, source: "estimate" }, "T1078": { detect: 0.78, prevent: 0.38, source: "estimate" },
        "T1550": { detect: 0.75, prevent: 0.40, source: "estimate" }, "T1134": { detect: 0.68, prevent: 0.32, source: "estimate" },
        "T1021": { detect: 0.68, prevent: 0.30, source: "estimate" },
      },
    },
    // ── NDR (Network Detection & Response) ──
    "darktrace": {
      display_name: "Darktrace",
      category: "ndr",
      data_source: "estimate",
      techniques: {
        "T1071": { detect: 0.78, prevent: 0.35, source: "estimate" }, "T1572": { detect: 0.75, prevent: 0.40, source: "estimate" },
        "T1095": { detect: 0.72, prevent: 0.30, source: "estimate" }, "T1570": { detect: 0.70, prevent: 0.28, source: "estimate" },
        "T1048": { detect: 0.74, prevent: 0.38, source: "estimate" }, "T1041": { detect: 0.72, prevent: 0.35, source: "estimate" },
        "T1571": { detect: 0.68, prevent: 0.32, source: "estimate" },
      },
    },
    "vectra_ai": {
      display_name: "Vectra AI",
      category: "ndr",
      data_source: "estimate",
      techniques: {
        "T1071": { detect: 0.76, prevent: 0.32, source: "estimate" }, "T1572": { detect: 0.73, prevent: 0.38, source: "estimate" },
        "T1095": { detect: 0.70, prevent: 0.28, source: "estimate" }, "T1570": { detect: 0.68, prevent: 0.26, source: "estimate" },
        "T1048": { detect: 0.72, prevent: 0.35, source: "estimate" }, "T1041": { detect: 0.70, prevent: 0.32, source: "estimate" },
        "T1571": { detect: 0.66, prevent: 0.30, source: "estimate" }, "T1021": { detect: 0.65, prevent: 0.22, source: "estimate" },
        "T1090": { detect: 0.68, prevent: 0.30, source: "estimate" },
      },
    },
    "extrahop": {
      display_name: "ExtraHop Reveal(x)",
      category: "ndr",
      data_source: "estimate",
      techniques: {
        "T1071": { detect: 0.75, prevent: 0.30, source: "estimate" }, "T1572": { detect: 0.72, prevent: 0.36, source: "estimate" },
        "T1095": { detect: 0.70, prevent: 0.28, source: "estimate" }, "T1570": { detect: 0.68, prevent: 0.25, source: "estimate" },
        "T1048": { detect: 0.71, prevent: 0.34, source: "estimate" }, "T1041": { detect: 0.69, prevent: 0.30, source: "estimate" },
        "T1571": { detect: 0.65, prevent: 0.28, source: "estimate" },
      },
    },
    // ── WAF (Web Application Firewall) ──
    "cloudflare_waf": {
      display_name: "Cloudflare WAF",
      category: "waf",
      data_source: "estimate",
      techniques: {
        "T1190": { detect: 0.72, prevent: 0.80, source: "estimate" }, "T1133": { detect: 0.55, prevent: 0.50, source: "estimate" },
        "T1595": { detect: 0.60, prevent: 0.40, source: "estimate" },
      },
    },
    "aws_waf": {
      display_name: "AWS WAF",
      category: "waf",
      data_source: "estimate",
      techniques: {
        "T1190": { detect: 0.70, prevent: 0.78, source: "estimate" }, "T1133": { detect: 0.52, prevent: 0.48, source: "estimate" },
        "T1595": { detect: 0.58, prevent: 0.38, source: "estimate" },
      },
    },
    "imperva": {
      display_name: "Imperva WAF",
      category: "waf",
      data_source: "estimate",
      techniques: {
        "T1190": { detect: 0.74, prevent: 0.82, source: "estimate" }, "T1133": { detect: 0.56, prevent: 0.52, source: "estimate" },
        "T1595": { detect: 0.62, prevent: 0.42, source: "estimate" },
      },
    },
    // ── CASB / SSPM ──
    "netskope": {
      display_name: "Netskope",
      category: "casb",
      data_source: "estimate",
      techniques: {
        "T1567": { detect: 0.78, prevent: 0.65, source: "estimate" }, "T1537": { detect: 0.72, prevent: 0.55, source: "estimate" },
        "T1530": { detect: 0.70, prevent: 0.50, source: "estimate" }, "T1078": { detect: 0.65, prevent: 0.40, source: "estimate" },
      },
    },
    "microsoft_defender_cloud_apps": {
      display_name: "Microsoft Defender for Cloud Apps",
      category: "casb",
      data_source: "estimate",
      techniques: {
        "T1567": { detect: 0.75, prevent: 0.62, source: "estimate" }, "T1537": { detect: 0.70, prevent: 0.52, source: "estimate" },
        "T1530": { detect: 0.68, prevent: 0.48, source: "estimate" }, "T1078": { detect: 0.68, prevent: 0.42, source: "estimate" },
      },
    },
    // ── DLP (Data Loss Prevention) ──
    "symantec_dlp": {
      display_name: "Symantec DLP",
      category: "dlp",
      data_source: "estimate",
      techniques: {
        "T1048": { detect: 0.75, prevent: 0.68, source: "estimate" }, "T1041": { detect: 0.72, prevent: 0.65, source: "estimate" },
        "T1567": { detect: 0.78, prevent: 0.70, source: "estimate" }, "T1052": { detect: 0.60, prevent: 0.55, source: "estimate" },
        "T1020": { detect: 0.65, prevent: 0.58, source: "estimate" },
      },
    },
    "microsoft_purview": {
      display_name: "Microsoft Purview DLP",
      category: "dlp",
      data_source: "estimate",
      techniques: {
        "T1048": { detect: 0.72, prevent: 0.65, source: "estimate" }, "T1041": { detect: 0.70, prevent: 0.62, source: "estimate" },
        "T1567": { detect: 0.76, prevent: 0.68, source: "estimate" }, "T1052": { detect: 0.55, prevent: 0.50, source: "estimate" },
        "T1020": { detect: 0.62, prevent: 0.55, source: "estimate" },
      },
    },
    // ── PAM (Privileged Access Management) ──
    "cyberark": {
      display_name: "CyberArk",
      category: "pam",
      data_source: "estimate",
      techniques: {
        "T1078": { detect: 0.72, prevent: 0.80, source: "estimate" }, "T1134": { detect: 0.65, prevent: 0.55, source: "estimate" },
        "T1098": { detect: 0.68, prevent: 0.70, source: "estimate" }, "T1003": { detect: 0.58, prevent: 0.60, source: "estimate" },
      },
    },
    "beyondtrust": {
      display_name: "BeyondTrust",
      category: "pam",
      data_source: "estimate",
      techniques: {
        "T1078": { detect: 0.70, prevent: 0.78, source: "estimate" }, "T1134": { detect: 0.62, prevent: 0.52, source: "estimate" },
        "T1098": { detect: 0.65, prevent: 0.68, source: "estimate" }, "T1003": { detect: 0.55, prevent: 0.58, source: "estimate" },
      },
    },
    // ── Backup & Recovery ──
    "veeam": {
      display_name: "Veeam",
      category: "backup",
      data_source: "estimate",
      techniques: {
        "T1490": { detect: 0.60, prevent: 0.70, source: "estimate" }, "T1486": { detect: 0.45, prevent: 0.50, source: "estimate" },
        "T1561": { detect: 0.50, prevent: 0.60, source: "estimate" },
      },
    },
    "cohesity": {
      display_name: "Cohesity DataProtect",
      category: "backup",
      data_source: "estimate",
      techniques: {
        "T1490": { detect: 0.58, prevent: 0.68, source: "estimate" }, "T1486": { detect: 0.42, prevent: 0.48, source: "estimate" },
        "T1561": { detect: 0.48, prevent: 0.58, source: "estimate" },
      },
    },
    // ── Deception ──
    "attivo": {
      display_name: "Attivo Networks (SentinelOne)",
      category: "deception",
      data_source: "estimate",
      techniques: {
        "T1021": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1078": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T1570": { detect: 0.70, prevent: 0.0, source: "estimate" }, "T1083": { detect: 0.50, prevent: 0.0, source: "estimate" },
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
        "T1036": 0.8, "T1027": 0.75, "T1685": 0.8, "T1070": 0.75,
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
        "T1036": 0.8, "T1027": 0.75, "T1685": 0.75, "T1070": 0.7,
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
    attack_version: "19.0",
    last_updated: "2026-03-10",
    provenance: "estimate",
    sources: ["Author estimates informed by public vendor material and ICS advisories"],
  },
  tools: {
    "claroty": {
      display_name: "Claroty",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0846": { detect: 0.85, prevent: 0.0, source: "estimate" },
        "T0842": { detect: 0.80, prevent: 0.40, source: "estimate" },
        "T1692.001": { detect: 0.75, prevent: 0.35, source: "estimate" },
        "T0860": { detect: 0.82, prevent: 0.0, source: "estimate" },
        "T0843": { detect: 0.78, prevent: 0.0, source: "estimate" },
        "T0886": { detect: 0.80, prevent: 0.0, source: "estimate" },
        "T0821": { detect: 0.72, prevent: 0.30, source: "estimate" },
      },
    },
    "dragos": {
      display_name: "Dragos Platform",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0846": { detect: 0.88, prevent: 0.0, source: "estimate" },
        "T0842": { detect: 0.82, prevent: 0.35, source: "estimate" },
        "T1692.001": { detect: 0.80, prevent: 0.40, source: "estimate" },
        "T0843": { detect: 0.82, prevent: 0.0, source: "estimate" },
        "T0886": { detect: 0.78, prevent: 0.0, source: "estimate" },
        "T0821": { detect: 0.75, prevent: 0.32, source: "estimate" },
        "T0860": { detect: 0.78, prevent: 0.0, source: "estimate" },
        "T0836": { detect: 0.80, prevent: 0.0, source: "estimate" },
      },
    },
    "nozomi": {
      display_name: "Nozomi Networks",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0846": { detect: 0.82, prevent: 0.0, source: "estimate" },
        "T0842": { detect: 0.78, prevent: 0.30, source: "estimate" },
        "T1692.001": { detect: 0.72, prevent: 0.30, source: "estimate" },
        "T0843": { detect: 0.75, prevent: 0.0, source: "estimate" },
        "T0886": { detect: 0.74, prevent: 0.0, source: "estimate" },
        "T0821": { detect: 0.70, prevent: 0.28, source: "estimate" },
      },
    },
    "fortinet_ot": {
      display_name: "Fortinet OT Security",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0846": { detect: 0.80, prevent: 0.0, source: "estimate" },
        "T0842": { detect: 0.70, prevent: 0.30, source: "estimate" },
        "T1692.001": { detect: 0.72, prevent: 0.32, source: "estimate" },
        "T0860": { detect: 0.50, prevent: 0.0, source: "estimate" },
      },
    },
    "cisco_cyber_vision": {
      display_name: "Cisco Cyber Vision",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0846": { detect: 0.78, prevent: 0.0, source: "estimate" },
        "T0842": { detect: 0.72, prevent: 0.28, source: "estimate" },
        "T1692.001": { detect: 0.68, prevent: 0.28, source: "estimate" },
      },
    },
    "tenable_ot": {
      display_name: "Tenable OT Security",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0846": { detect: 0.75, prevent: 0.0, source: "estimate" },
        "T0842": { detect: 0.65, prevent: 0.25, source: "estimate" },
        "T1692.001": { detect: 0.70, prevent: 0.30, source: "estimate" },
        "T0843": { detect: 0.60, prevent: 0.0, source: "estimate" },
        "T0836": { detect: 0.55, prevent: 0.0, source: "estimate" },
      },
    },
    "opswat": {
      display_name: "OPSWAT MetaDefender OT",
      category: "ot_monitoring",
      data_source: "estimate",
      techniques: {
        "T0843": { detect: 0.70, prevent: 0.65, source: "estimate" },
        "T0821": { detect: 0.60, prevent: 0.55, source: "estimate" },
        "T0836": { detect: 0.55, prevent: 0.50, source: "estimate" },
      },
    },
  },
  infrastructure: {
    "rockwell": {
      display_name: "Rockwell / Allen-Bradley",
      category: "plc",
      exposes: {
        "T0843": 0.9, "T0821": 0.85, "T0836": 0.8, "T1692.001": 0.85,
        "T0886": 0.8, "T0846": 0.75, "T0842": 0.7,
      },
    },
    "siemens": {
      display_name: "Siemens",
      category: "plc",
      exposes: {
        "T0843": 0.9, "T0821": 0.85, "T0836": 0.85, "T1692.001": 0.85,
        "T0886": 0.8, "T0846": 0.75, "T0842": 0.7,
      },
    },
    "schneider": {
      display_name: "Schneider Electric",
      category: "plc",
      exposes: {
        "T0843": 0.88, "T0821": 0.82, "T0836": 0.8, "T1692.001": 0.82,
        "T0886": 0.78, "T0846": 0.72, "T0842": 0.68,
      },
    },
    "honeywell": {
      display_name: "Honeywell",
      category: "plc",
      exposes: {
        "T0843": 0.88, "T0821": 0.82, "T0836": 0.78, "T0886": 0.75,
        "T1692.001": 0.70, "T0846": 0.60, "T0842": 0.55,
      },
    },
    "abb": {
      display_name: "ABB",
      category: "plc",
      exposes: {
        "T0843": 0.87, "T0821": 0.83, "T0836": 0.79, "T0886": 0.74,
        "T1692.001": 0.68, "T0846": 0.58, "T0842": 0.53,
      },
    },
    "emerson": {
      display_name: "Emerson (DeltaV)",
      category: "plc",
      exposes: {
        "T0843": 0.86, "T0821": 0.80, "T0836": 0.77, "T0886": 0.73,
        "T1692.001": 0.69, "T0846": 0.59, "T0842": 0.54,
      },
    },
    "ge_vernova": {
      display_name: "GE Vernova",
      category: "plc",
      exposes: {
        "T0843": 0.85, "T0821": 0.81, "T0836": 0.76, "T0886": 0.72,
        "T1692.001": 0.67, "T0846": 0.57, "T0842": 0.52,
      },
    },
    "yokogawa": {
      display_name: "Yokogawa",
      category: "plc",
      exposes: {
        "T0843": 0.87, "T0821": 0.82, "T0836": 0.78, "T0886": 0.74,
        "T1692.001": 0.69, "T0846": 0.58, "T0842": 0.53,
      },
    },
    "mitsubishi_electric": {
      display_name: "Mitsubishi Electric",
      category: "plc",
      exposes: {
        "T0843": 0.86, "T0821": 0.80, "T0836": 0.77, "T0886": 0.73,
        "T1692.001": 0.68, "T0846": 0.57, "T0842": 0.52,
      },
    },
    // ── SCADA Software ──
    "wonderware": {
      display_name: "AVEVA (Wonderware)",
      category: "scada",
      exposes: {
        "T0843": 0.75, "T0821": 0.70, "T0836": 0.72, "T1692.001": 0.80,
        "T0846": 0.65,
      },
    },
    "ignition": {
      display_name: "Inductive Automation Ignition",
      category: "scada",
      exposes: {
        "T0843": 0.73, "T0821": 0.68, "T0836": 0.70, "T1692.001": 0.78,
        "T0846": 0.63,
      },
    },
    // ── Safety Systems ──
    "triconex": {
      display_name: "Schneider Triconex (SIS)",
      category: "safety",
      exposes: {
        "T0843": 0.90, "T0821": 0.88, "T0836": 0.85, "T1692.001": 0.82,
      },
    },
    "hima": {
      display_name: "HIMA Safety Systems",
      category: "safety",
      exposes: {
        "T0843": 0.88, "T0821": 0.86, "T0836": 0.83, "T1692.001": 0.80,
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
