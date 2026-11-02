// ─── AttackBreaker — Type Barrel ────────────────────────────────────
// Re-exports all types from domain-specific modules.

export type {
  FrameworkId,
  Tactic,
  Technique,
  Edge,
  ChainKind,
  AttackChain,
  MitigationDef,
  AnalyticDef,
  DetectionStrategyDef,
  DataComponentDef,
  AttackDataset,
  CostTier,
  DefenseKind,
  TelemetrySource,
  PosturePreset,
  GateDef,
  EnvPreset,
  ChainColor,
  FrameworkConfig,
} from "./graph";

export type {
  ModelParams,
  DefensePosture,
  ToolCoverage,
  GateResult,
  GateOption,
  CatalogItem,
  PlanStep,
  PlanResult,
} from "./model";

export type {
  ToolTechniqueScore,
  CoverageTool,
  InfrastructureItem,
  ToolCategory,
  InfraCategory,
  CoverageKBMetadata,
  CoverageKB,
} from "./coverageKb";

export type {
  OrganizationContext,
  EnvironmentProfile,
  CoverageSource,
  TechniqueAssessment,
} from "./environment";
