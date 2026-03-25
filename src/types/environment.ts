// ─── AttackBreaker — Environment Profile Types ──────────────────────
// Extracted from ProfileWizard and computeExposureScores() in attack-path-optimizer.html.

/** Organization context collected in the ProfileWizard (step 1) */
export interface OrganizationContext {
  industry: string;
  size: string;
  compliance: string[];
}

/**
 * Environment profile produced by the ProfileWizard.
 * Stored in `environmentProfile` state and persisted to localStorage.
 */
export interface EnvironmentProfile {
  /** Optional organization metadata (omitted if all fields empty) */
  organization?: OrganizationContext;
  /** Selected infrastructure item IDs from the coverage KB */
  infrastructure: string[];
  /** Selected security tool IDs from the coverage KB */
  securityTools: string[];
  /** Optional selected threat actor names for actor-weighted exposure */
  threatActors?: string[];
}

/** A single tool's contribution to coverage for a technique */
export interface CoverageSource {
  toolId: string;
  name: string;
  detect: number;
  prevent: number;
}

/**
 * Per-technique exposure result from computeExposureScores().
 * Returned as a Record<string, TechniqueExposure> keyed by technique ID.
 */
export interface TechniqueExposure {
  /** Base exposure derived from infrastructure items (default 0.3 minimum) */
  baseExposure: number;
  /** Combined coverage reduction from all deployed security tools (0.0–1.0) */
  coverageReduction: number;
  /** Actor weight multiplier (1.0 if no actors selected; up to 1.5) */
  actorWeight: number;
  /** Final exposure = min(1.0, baseExposure * (1 - coverageReduction) * actorWeight) */
  finalExposure: number;
  /** Breakdown of which tools contributed coverage for this technique */
  coverageSources: CoverageSource[];
}
