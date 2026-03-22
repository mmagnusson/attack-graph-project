// ─── AttackBreaker — Coverage Knowledge Base Types ──────────────────
// Extracted from COVERAGE_KB / ICS_COVERAGE_KB in attack-path-optimizer.html.

/** Per-technique detection/prevention score for a security tool */
export interface ToolTechniqueScore {
  detect: number;
  prevent: number;
  /** Source attribution (e.g. "ER7", "ER6", "sigma", "vendor") */
  source?: string;
}

/**
 * A security tool in the coverage KB.
 * Tools are keyed by string ID in the KB's `tools` map.
 * `techniques` is a map of technique ID → detection/prevention scores.
 */
export interface CoverageTool {
  display_name: string;
  category: string;
  data_source: string;
  techniques: Record<string, ToolTechniqueScore>;
}

/**
 * An infrastructure item in the coverage KB.
 * Infrastructure items are keyed by string ID in the KB's `infrastructure` map.
 * `exposes` maps technique IDs to an exposure relevance score (0.0–1.0).
 */
export interface InfrastructureItem {
  display_name: string;
  category: string;
  exposes: Record<string, number>;
}

/** Tool category metadata used for grouping in the ProfileWizard */
export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
}

/** Infrastructure category metadata used for grouping in the ProfileWizard */
export interface InfraCategory {
  id: string;
  name: string;
  icon: string;
}

/** KB metadata block */
export interface CoverageKBMetadata {
  attack_version: string;
  last_updated: string;
  sources: string[];
}

/** Full Coverage Knowledge Base shape */
export interface CoverageKB {
  metadata: CoverageKBMetadata;
  tools: Record<string, CoverageTool>;
  infrastructure: Record<string, InfrastructureItem>;
  toolCategories: ToolCategory[];
  infraCategories: InfraCategory[];
}
