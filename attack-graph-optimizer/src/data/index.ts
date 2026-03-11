// ─── Barrel file: re-exports all data modules ────────────────────────────────

export {
  TACTICS,
  ICS_TACTICS,
  CHAIN_COLORS,
  MAX_HIGHLIGHTED_CHAINS,
  ICS_STIX_TACTIC_MAP,
  ICS_ALL_PLATFORMS,
  ICS_PHASE_WEIGHTS,
  STIX_TACTIC_MAP,
  TACTIC_PHASE,
  PHASE_WEIGHTS,
  ALL_PLATFORMS,
  CONTROL_CATEGORIES,
} from './constants';
export type { Tactic, ControlCategory } from './constants';

export {
  TECHNIQUES,
  EDGES,
  ATTACK_CHAINS,
} from './techniques';
export type { Technique, Edge, AttackChain } from './techniques';

export {
  SECURITY_CONTROLS,
  ICS_SECURITY_CONTROLS,
  ICS_MITIGATION_CONTROL_MAP,
  CONTROL_PRESETS,
  ICS_CONTROL_PRESETS,
} from './controls';
export type { SecurityControl, ControlPreset } from './controls';

export {
  ENV_PRESETS,
  ICS_ENV_PRESETS,
} from './envPresets';
export type { EnvPreset } from './envPresets';

export {
  COVERAGE_KB,
  ICS_COVERAGE_KB,
} from './coverageKb';
export type { TechniqueScore, KBTool, KBInfrastructure, KBCategory, CoverageKB } from './coverageKb';

export {
  TECHNIQUE_EXAMPLES,
  CHAIN_TECHNIQUE_CONTEXT,
  TECHNIQUE_PLATFORMS,
  TECHNIQUE_MITIGATIONS,
  MITIGATION_CONTROL_MAP,
  CHAIN_PROFILES,
} from './techniqueMetadata';
export type { TechniqueExample, Mitigation, ChainProfile } from './techniqueMetadata';

export {
  getFrameworkConfig,
  buildTacticPhase,
  buildTacticToPhase,
} from './frameworkConfig';
export type { FrameworkConfig } from './frameworkConfig';
