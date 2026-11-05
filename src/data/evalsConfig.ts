// ─── MITRE ATT&CK Evaluations — measured detection coverage ──────────────────
//
// scripts/build-evals-coverage.ts turns each vendor's latest Enterprise
// evaluation into per-technique detection rates (public/data/evals-coverage.json).
// When that file is present, the products below use measured detection for the
// techniques MITRE tested; everything else keeps the author estimates.
//
// Terms of use: any publication of results built on this data must note that it
// uses data from MITRE ATT&CK Evaluations, and must not claim a product "won".

export const EVALS_SCHEMA_VERSION = 1;
export const EVALS_COVERAGE_URL = "/data/evals-coverage.json";
export const EVALS_SITE = "https://evals.mitre.org";
export const EVALS_NOTICE = "Detection rates derived from MITRE ATT&CK® Evaluations results (evals.mitre.org). MITRE does not endorse any vendor or product; results reflect a controlled test environment.";

/** Only rounds from this year on: products change, older results say little about today's */
export const EVALS_MIN_YEAR = 2023;

/** Detection categories that count as an alert (MITRE's "analytic coverage"); Telemetry, None do not */
export const EVALS_DETECTED_TYPES = ["Technique", "Tactic", "General"];

/** Shrink each technique's rate toward the vendor's overall rate by this many pseudo-substeps */
export const EVALS_SHRINKAGE = 2;

/** Evaluations participant → coverage-KB tool id, where the KB already has the product */
export const EVALS_TO_KB: Record<string, string> = {
  crowdstrike: "crowdstrike-falcon",
  microsoft: "ms-defender-endpoint",
  sentinelone: "sentinelone",
  paloaltonetworks: "cortex-xdr",
  vmware: "carbon-black",
  cybereason: "cybereason",
  eset: "eset",
  sophos: "sophos",
  trendmicro: "trendmicro",
  withsecure: "withsecure",
  elastic: "elastic-security",
};
