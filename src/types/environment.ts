// ─── AttackBreaker — Environment Profile Types ──────────────────────

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
  /** Optional threat actor names of particular concern (weighted up in the model) */
  threatActors?: string[];
}

/** A single tool's estimated contribution for a technique */
export interface CoverageSource {
  toolId: string;
  name: string;
  detect: number;
  prevent: number;
}

/** Per-technique result of assessing an environment profile against the coverage KB */
export interface TechniqueAssessment {
  /** Base exposure from infrastructure (default 0.3 when no selected item exposes it) */
  baseExposure: number;
  /** Combined estimated detection 1 − Π(1 − detect) across selected tools */
  detect: number;
  /** Combined estimated prevention 1 − Π(1 − prevent) across selected tools */
  prevent: number;
  sources: CoverageSource[];
}
