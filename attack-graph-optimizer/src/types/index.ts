// ─── Attack Graph Optimizer — Type Barrel ────────────────────────────────────
// Re-exports all types from domain-specific modules.

// Graph core types
export type {
  Tactic,
  Technique,
  Edge,
  AttackChain,
  ChainColor,
  ControlCategory,
  ControlCategoryInfo,
  SecurityControl,
  ControlPreset,
  EnvPreset,
  ChainProfile,
  TechniqueExample,
  ChainTechniqueContext,
  Mitigation,
  EnterprisePlatformId,
  IcsPlatformId,
  PlatformId,
  FrameworkId,
  DataSourceId,
  SectorFilter,
  PhaseWeights,
  StixTacticMap,
  TacticPhase,
  TacticToPhase,
  MitigationControlMap,
  FrameworkConfig,
  ParsedStixData,
} from "./graph";

// Coverage knowledge base types
export type {
  ToolTechniqueScore,
  CoverageTool,
  InfrastructureItem,
  ToolCategory,
  InfraCategory,
  CoverageKBMetadata,
  CoverageKB,
} from "./coverageKb";

// Environment profile and exposure types
export type {
  OrganizationContext,
  EnvironmentProfile,
  CoverageSource,
  TechniqueExposure,
} from "./environment";
