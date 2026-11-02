// ─── AttackBreaker — Risk Model & Optimizer Types ───────────────────

import type { DefenseKind } from "./graph";

/** Tunable assumptions of the probabilistic AND/OR model (all 0..1) */
export interface ModelParams {
  /** Per-technique reduction in success chance from one implemented mitigation */
  mitigationEffectiveness: number;
  /** Chance an attempt on a fully covered technique raises an actionable alert */
  detectionEffectiveness: number;
  /** Chance an alerted intrusion is contained before it reaches its objective (one per intrusion, not per stage) */
  responseEffectiveness: number;
  /** Residual chance an actor passes a gate with a technique not in its known set */
  substitutionRate: number;
  /** 0 = actor picks techniques blind to your detections; 1 = always picks your least-covered option */
  adversaryAdaptiveness: number;
}

/** What the organization already has (or is previewing) */
export interface DefensePosture {
  /** Implemented MITRE mitigation IDs (M####) */
  mitigations: ReadonlySet<string>;
  /** Collected MITRE data component IDs (DC####) */
  dataComponents: ReadonlySet<string>;
  /** Techniques the user asserts are fully blocked (what-if override) */
  blocked: ReadonlySet<string>;
}

/** Estimated tool coverage from the environment profile */
export interface ToolCoverage {
  detect: number;
  prevent: number;
}

/** Gate evaluation for one actor — the AND/OR breakdown shown in the chain view */
export interface GateResult {
  gateId: string;
  label: string;
  /** Chance the actor gets through this gate with at least one technique */
  pass: number;
  /** Chance the gate is passed without the attempt being detected and stopped */
  evade: number;
  /** pass × evade */
  value: number;
  options: GateOption[];
}

export interface GateOption {
  techniqueId: string;
  /** Residual success chance after prevention */
  success: number;
  /** Detection coverage 0..1 (before the detection-effectiveness factor) */
  detection: number;
  viaSoftware: boolean;
}

/** A purchasable defense considered by the optimizer */
export interface CatalogItem {
  id: string;
  kind: DefenseKind;
  name: string;
  /** Annual cost estimate in USD (after overrides and partial-deployment discount) */
  cost: number;
  mitigationIds: string[];
  dataComponentIds: string[];
}

export interface PlanStep {
  item: CatalogItem;
  cumulativeCost: number;
  /** Residual risk (sum of weighted actor viability) after this step */
  risk: number;
  /** Risk removed by this step alone */
  delta: number;
}

export interface PlanResult {
  baselineRisk: number;
  totalWeight: number;
  steps: PlanStep[];
  totalCost: number;
  finalRisk: number;
}
