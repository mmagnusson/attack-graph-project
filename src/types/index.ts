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
  D3fendRole,
  D3fendTactic,
  D3fendBase,
  D3fendTechnique,
  D3fendLink,
  D3fendDataset,
  ChainColor,
  FrameworkConfig,
} from "./graph";

export type {
  ModelParams,
  DefensePosture,
  VocabularyId,
  PreventionDef,
  DetectionRule,
  DetectionBundle,
  DefenseVocabulary,
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
