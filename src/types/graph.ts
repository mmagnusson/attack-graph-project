// ─── AttackBreaker — Core Graph Types ──────────────────────────────
// Extracted from attack-path-optimizer.html monolith data structures.

/** MITRE ATT&CK tactic (kill chain phase) */
export interface Tactic {
  id: string;
  name: string;
  phase: number;
  color: string;
}

/** ATT&CK technique node in the graph */
export interface Technique {
  id: string;
  name: string;
  tactic: string;
  baseCriticality: number;
  /** Present on sub-techniques (e.g. T1059.001 → parentId "T1059") */
  parentId?: string;
  /** Populated from STIX parsing */
  description?: string;
  /** Platforms populated from STIX or TECHNIQUE_PLATFORMS */
  platforms?: string[];
}

/** Directed edge between two technique IDs */
export interface Edge {
  from: string;
  to: string;
}

/** An attack chain (intrusion set / threat actor path) */
export interface AttackChain {
  name: string;
  description: string;
  sector: string;
  path: string[];
  severity: number;
  /** Assigned at runtime from CHAIN_COLORS */
  color?: string;
}

/** Visual styling config for a highlighted chain */
export interface ChainColor {
  color: string;
  label: string;
}

/** Security control category identifier */
export type ControlCategory = "technical" | "detective" | "administrative" | "physical";

/** Control category metadata */
export interface ControlCategoryInfo {
  id: ControlCategory;
  name: string;
  color: string;
  icon: string;
}

/**
 * A security control with per-technique coverage reductions.
 * Coverage values are negative floats (e.g. -0.4 means 40% risk reduction).
 */
export interface SecurityControl {
  id: string;
  name: string;
  category: ControlCategory;
  cost: string;
  coverage: Record<string, number>;
  /** Runtime state — whether the control is currently deployed */
  deployed?: boolean;
}

/** A named preset of control IDs (e.g. NIST CSF, CIS v8) */
export interface ControlPreset {
  name: string;
  controls: string[];
}

/** Named environment preset with optional per-technique exposure overrides */
export interface EnvPreset {
  name: string;
  description?: string;
  overrides?: Record<string, number>;
}

/** Threat actor / intrusion-set profile from CHAIN_PROFILES */
export interface ChainProfile {
  country: string;
  aliases: string[];
  firstSeen: string;
  lastSeen: string;
  sectors: string[];
  description: string;
}

/** Per-technique contextual examples from TECHNIQUE_EXAMPLES */
export interface TechniqueExample {
  summary: string;
  examples: string[];
}

/** Per-technique chain-specific context from CHAIN_TECHNIQUE_CONTEXT */
export type ChainTechniqueContext = Record<string, Record<string, string>>;

/** A MITRE mitigation reference */
export interface Mitigation {
  mitreId: string;
  name: string;
  description?: string;
}

/** Enterprise platform IDs */
export type EnterprisePlatformId = "Windows" | "Linux" | "macOS" | "Cloud" | "Network" | "SaaS";

/** ICS/OT platform IDs */
export type IcsPlatformId =
  | "Field Controller/RTU/PLC/IED"
  | "Human-Machine Interface"
  | "Engineering Workstation"
  | "Control Server"
  | "Data Historian"
  | "Safety Instrumented System/Protection Relay"
  | "Input/Output Server";

/** Union of all supported platform strings */
export type PlatformId = EnterprisePlatformId | IcsPlatformId;

/** Framework discriminator */
export type FrameworkId = "enterprise" | "ics";

/** Data source selector */
export type DataSourceId = "stix" | "builtin";

/** Sector filter options */
export type SectorFilter = "all" | "government" | "financial";

/** Kill-chain phase → weight multiplier (keyed by phase number) */
export type PhaseWeights = Record<number, number>;

/** STIX tactic slug → tactic ID mapping */
export type StixTacticMap = Record<string, string>;

/** Tactic ID → phase number mapping */
export type TacticPhase = Record<string, number>;

/** Tactic ID → STIX phase name mapping */
export type TacticToPhase = Record<string, string>;

/** Mitigation name → control ID mapping */
export type MitigationControlMap = Record<string, string>;

/** Import for coverage KB type (defined in coverageKb.ts) */
import type { CoverageKB } from "./coverageKb";

/** Return type of parseStixBundle() — all data extracted from a STIX bundle */
export interface ParsedStixData {
  techniques: Technique[];
  edges: Edge[];
  chains: AttackChain[];
  techniqueDescriptions: Record<string, string>;
  chainTechContext: ChainTechniqueContext;
  techniquePlatforms: Record<string, string[]>;
  mitigations: Record<string, Mitigation[]>;
  groupProfiles: Record<string, ChainProfile>;
}

/** Full return type of getFrameworkConfig(fw) */
export interface FrameworkConfig {
  tactics: Tactic[];
  stixTacticMap: StixTacticMap;
  tacticPhase: TacticPhase;
  tacticToPhase: TacticToPhase;
  phaseWeights: PhaseWeights;
  allPlatforms: string[];
  killChainName: string;
  stixSourceName: string;
  navigatorDomain: string;
  stixUrl: string;
  stixCacheKey: string;
  hasBuiltin: boolean;
  hasSubTechniques: boolean;
  securityControls: SecurityControl[];
  controlPresets: Record<string, ControlPreset>;
  envPresets: Record<string, EnvPreset>;
  mitigationControlMap: MitigationControlMap;
  coverageKB: CoverageKB;
}
