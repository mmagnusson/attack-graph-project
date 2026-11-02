// ─── Barrel file: re-exports all data modules ────────────────────────────────

export {
  TACTICS,
  ICS_TACTICS,
  CHAIN_COLORS,
  MAX_HIGHLIGHTED_CHAINS,
  ENCODING,
  ICS_STIX_TACTIC_MAP,
  STIX_TACTIC_MAP,
  ALL_PLATFORMS,
} from './constants';

export {
  ENTERPRISE_TELEMETRY,
  ICS_TELEMETRY,
  ENTERPRISE_POSTURES,
  ICS_POSTURES,
} from './defenseCatalog';

export { ENV_PRESETS, ICS_ENV_PRESETS } from './envPresets';
export { COVERAGE_KB, ICS_COVERAGE_KB } from './coverageKb';
export { getFrameworkConfig, buildTacticPhase, buildTacticToPhase, ATTACK_VERSION } from './frameworkConfig';
export { loadAttackData, isCurrentDataset } from './loadAttackData';
