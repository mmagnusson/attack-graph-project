// ─── D3FEND configuration — pinned release, model roles, cost tiers ──────────
//
// D3FEND base techniques are the purchasable unit in the D3FEND vocabulary.
// Roles decide how a tactic enters the risk model:
//   prevent    Harden, Isolate — lowers technique success (like a mitigation)
//   detect     Detect, Deceive — raises alerts (like collected telemetry)
//   response   Evict           — removes an adversary already found; this is what the model's
//                                response effectiveness stands for, so it isn't scored separately
//   foundation Model           — asset/network/activity mapping; enables the rest, not scored
//   recovery   Restore         — limits damage after the fact; not scored (viability only)
//
// COST TIERS ARE PLACEHOLDER ESTIMATES (same scale as defenseCatalog.ts).

import type { CostTier, D3fendRole } from '../types';

export const D3FEND_VERSION = "1.6.0";
/** Bump when the shape of public/data/d3fend-*.json changes */
export const D3FEND_SCHEMA_VERSION = 1;
export const D3FEND_DATA_URL = "/data/d3fend-" + D3FEND_VERSION + ".json";

export const D3FEND_TACTIC_ROLES: Record<string, D3fendRole> = {
  Model: "foundation",
  Harden: "prevent",
  Detect: "detect",
  Isolate: "prevent",
  Deceive: "detect",
  Evict: "response",
  Restore: "recovery",
};

export const D3FEND_TIERS: Record<string, CostTier> = {
  // Harden
  "D3-SCH": 2, "D3-AA": 2, "D3-MH": 2, "D3-CH": 2, "D3-PH": 2, "D3-AH": 2,
  // Isolate
  "D3-AMED": 3, "D3-CF": 2, "D3-EI": 3, "D3-APA": 2, "D3-NI": 4,
  // Detect
  "D3-NTA": 3, "D3-MA": 2, "D3-PA": 3, "D3-PHAM": 2, "D3-FA": 2, "D3-UBA": 3, "D3-ID": 2, "D3-PM": 2,
  // Deceive
  "D3-DO": 1, "D3-DE": 3,
};

/**
 * ICS techniques that ATT&CK v20 modeled on an Enterprise technique and that
 * D3FEND has not mapped yet → the Enterprise technique whose D3FEND
 * countermeasures they borrow. AttackBreaker's inference, not D3FEND's: a
 * borrow applies only while D3FEND has no links of its own for the technique.
 */
export const D3FEND_BORROWED_LINKS: Record<string, string> = {
  "T1701": "T1059",         // Command and Scripting Interpreter
  "T1701.001": "T1059.001", // PowerShell
  "T1701.002": "T1059.003", // Windows Command Shell
  "T1701.003": "T1059.004", // Unix Shell
  "T1701.004": "T1059.005", // Visual Basic
  "T1701.005": "T1059.006", // Python
  "T1701.006": "T1059.007", // JavaScript
  "T0869.001": "T1071.004", // Application Layer Protocol: DNS
  "T0869.002": "T1071.005", // Application Layer Protocol: Publish/Subscribe Protocols
};

/**
 * Approximate translation of AttackBreaker's ATT&CK telemetry sources to the
 * D3FEND detection base techniques that typically run on that telemetry. Used
 * only to carry an ATT&CK posture (or preset) over to the D3FEND vocabulary.
 */
export const TELEMETRY_TO_D3FEND: Record<string, string[]> = {
  "ts-endpoint-exec": ["D3-PA", "D3-PM"],
  "ts-endpoint-file": ["D3-FA"],
  "ts-host-config": ["D3-PM"],
  "ts-identity": ["D3-UBA", "D3-ID"],
  "ts-netflow": ["D3-NTA"],
  "ts-netcontent": ["D3-NTA", "D3-MA"],
  "ts-applogs": ["D3-MA"],
  "ts-cloud": ["D3-PM", "D3-UBA"],
  "ts-containers": ["D3-PM"],
  "ts-external": ["D3-ID"],
  "ts-ot-process": ["D3-PM"],
  "ts-ot-inventory": ["D3-PM"],
  "ts-ot-netflow": ["D3-NTA"],
  "ts-ot-dpi": ["D3-NTA"],
  "ts-ot-host-exec": ["D3-PA", "D3-PM"],
  "ts-ot-host-config": ["D3-FA", "D3-PM"],
  "ts-ot-identity": ["D3-UBA"],
  "ts-ot-applogs": ["D3-MA"],
};
