// ─── AttackBreaker — Core Domain Types ──────────────────────────────
// Single source of truth for dataset, defense-catalog, and framework types.
// Data modules (src/data/*) import from here; they do not redefine shapes.

import type { CoverageKB } from "./coverageKb";

/** Framework discriminator */
export type FrameworkId = "enterprise" | "ics";

/** MITRE ATT&CK tactic (kill chain phase) */
export interface Tactic {
  id: string;
  name: string;
  phase: number;
  color: string;
}

/** ATT&CK technique node */
export interface Technique {
  id: string;
  name: string;
  /** Primary tactic — the earliest-phase tactic this technique serves (used for layout) */
  tactic: string;
  /** Every tactic this technique serves; ATT&CK allows several (e.g. Valid Accounts has four) */
  tactics: string[];
  /** Present on sub-techniques (e.g. T1059.001 → parentId "T1059") */
  parentId?: string;
  /** ATT&CK platform names as published (e.g. "Windows", "IaaS", "Network Devices") */
  platforms: string[];
  description?: string;
}

/** Directed edge between two technique IDs; weight = number of actors supporting it */
export interface Edge {
  from: string;
  to: string;
  weight?: number;
}

export type ChainKind = "group" | "campaign" | "custom";

/** An adversary's known technique set — a threat group, a campaign, or a user-built chain */
export interface AttackChain {
  /** ATT&CK ID (G0007, C0010) or a generated id for custom chains */
  id: string;
  name: string;
  kind: ChainKind;
  description: string;
  /** Technique IDs sorted by kill-chain phase: direct use ∪ use through the actor's software */
  path: string[];
  /** Subset of `path` attributed to the actor only through its malware/tools */
  viaSoftware: string[];
  /** Targeted sectors, keyword-derived from the MITRE description */
  sectors: string[];
  /** Attribution, keyword-derived from the MITRE description (conservative; may be empty) */
  country?: string;
  aliases: string[];
  firstSeen?: string;
  lastSeen?: string;
  /** For campaigns: the group the campaign is attributed to */
  attributedTo?: string;
  /** Assigned at runtime from CHAIN_COLORS */
  color?: string;
}

/** A MITRE mitigation (course-of-action) and the techniques it maps to */
export interface MitigationDef {
  id: string;
  name: string;
  description: string;
  techniques: string[];
  /** False for catalog entries MITRE marks as non-deployable ("Do Not Mitigate", "Pre-compromise") */
  actionable: boolean;
}

/** One MITRE analytic: platform-specific detection logic and the telemetry it needs */
export interface AnalyticDef {
  id: string;
  platforms: string[];
  /** Data component IDs (DC####) the analytic's log sources come from */
  dataComponents: string[];
  description: string;
}

/** A MITRE detection strategy (DET####) for a technique */
export interface DetectionStrategyDef {
  id: string;
  name: string;
  analytics: AnalyticDef[];
}

/** A MITRE data component (DC####) — a kind of telemetry, e.g. "Process Creation" */
export interface DataComponentDef {
  id: string;
  name: string;
  description: string;
}

/** Everything the app needs from one ATT&CK domain, produced by parseStixBundle() */
export interface AttackDataset {
  schemaVersion: number;
  framework: FrameworkId;
  sourceLabel: string;
  techniques: Technique[];
  chains: AttackChain[];
  mitigations: MitigationDef[];
  /** techniqueId → mitigationId → MITRE's note on how the mitigation applies */
  mitigationNotes: Record<string, Record<string, string>>;
  /** techniqueId → detection strategy */
  detections: Record<string, DetectionStrategyDef>;
  dataComponents: DataComponentDef[];
  /** chainId → techniqueId → MITRE's procedure description */
  usageNotes: Record<string, Record<string, string>>;
}

// ─── D3FEND ─────────────────────────────────────────────────────────────────

/** How a D3FEND tactic enters the risk model */
export type D3fendRole = "prevent" | "detect" | "response" | "foundation" | "recovery";

export interface D3fendTactic {
  name: string;
  role: D3fendRole;
}

/** A D3FEND base technique (the purchasable unit, e.g. D3-PH Platform Hardening) */
export interface D3fendBase {
  id: string;
  name: string;
  tactic: string;
  definition: string;
  /** Every D3FEND technique in this base, including the base itself */
  techniques: string[];
}

export interface D3fendTechnique {
  name: string;
  base: string;
  tactic: string;
  definition: string;
  /** Ontology local name, for https://d3fend.mitre.org/technique/d3f:<iri>/ */
  iri: string;
}

/** One inferred ATT&CK → D3FEND link: [D3FEND id, offensive relation, offensive artifact, defensive relation, defensive artifact] */
export type D3fendLink = [string, string, string, string, string];

export interface D3fendDataset {
  schemaVersion: number;
  version: string;
  releaseDate: string;
  tactics: D3fendTactic[];
  bases: D3fendBase[];
  techniques: Record<string, D3fendTechnique>;
  /** ATT&CK technique ID → inferred D3FEND countermeasures (via digital artifacts) */
  attack: Record<string, D3fendLink[]>;
  /** ATT&CK mitigation ID → related D3FEND techniques (ontology d3f:related) */
  mitigations: Record<string, string[]>;
}

// ─── Defense catalog ────────────────────────────────────────────────────────

/** Rough cost class used to derive default dollar estimates */
export type CostTier = 1 | 2 | 3 | 4;

export type DefenseKind = "mitigation" | "telemetry";

/** A purchasable bundle of data components (e.g. endpoint process telemetry) */
export interface TelemetrySource {
  id: string;
  name: string;
  description: string;
  dataComponents: string[];
  tier: CostTier;
}

/** A named starting posture (approximate mapping of a framework to mitigations + telemetry) */
export interface PosturePreset {
  name: string;
  description: string;
  mitigations: string[];
  telemetry: string[];
}

/** A required stage of an intrusion: the actor must pass one of these tactics */
export interface GateDef {
  id: string;
  label: string;
  tactics: string[];
}

/** Named environment preset with optional per-technique base exposure overrides */
export interface EnvPreset {
  name: string;
  description?: string;
  overrides?: Record<string, number>;
}

/** Visual styling config for a highlighted chain */
export interface ChainColor {
  color: string;
  label: string;
}

/** Full return type of getFrameworkConfig(fw) */
export interface FrameworkConfig {
  id: FrameworkId;
  label: string;
  tactics: Tactic[];
  stixTacticMap: Record<string, string>;
  tacticPhase: Record<string, number>;
  tacticToPhase: Record<string, string>;
  allPlatforms: string[];
  killChainName: string;
  stixSourceName: string;
  navigatorDomain: string;
  attackVersion: string;
  /** Upstream STIX bundle (used by scripts/build-attack-data.ts, not at runtime) */
  stixUrl: string;
  /** Same-origin compact dataset served from public/data */
  dataUrl: string;
  dataCacheKey: string;
  hasSubTechniques: boolean;
  gateOptions: GateDef[];
  defaultGates: string[];
  telemetrySources: TelemetrySource[];
  mitigationTiers: Record<string, CostTier>;
  nonActionableMitigations: string[];
  posturePresets: Record<string, PosturePreset>;
  envPresets: Record<string, EnvPreset>;
  coverageKB: CoverageKB;
}
