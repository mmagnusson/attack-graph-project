// ─── Framework Config ─────────────────────────────────────────────────────────

import type { Tactic } from './constants';
import type { SecurityControl, ControlPreset } from './controls';
import type { EnvPreset } from './envPresets';
import type { CoverageKB } from './coverageKb';

import {
  TACTICS, ICS_TACTICS,
  STIX_TACTIC_MAP, ICS_STIX_TACTIC_MAP,
  TACTIC_PHASE, PHASE_WEIGHTS, ICS_PHASE_WEIGHTS,
  ALL_PLATFORMS, ICS_ALL_PLATFORMS,
} from './constants';
import {
  SECURITY_CONTROLS, ICS_SECURITY_CONTROLS,
  CONTROL_PRESETS, ICS_CONTROL_PRESETS,
  ICS_MITIGATION_CONTROL_MAP,
} from './controls';
import { ENV_PRESETS, ICS_ENV_PRESETS } from './envPresets';
import { COVERAGE_KB, ICS_COVERAGE_KB } from './coverageKb';
import { MITIGATION_CONTROL_MAP } from './techniqueMetadata';

export interface FrameworkConfig {
  tactics: Tactic[];
  stixTacticMap: Record<string, string>;
  tacticPhase: Record<string, number>;
  tacticToPhase: Record<string, string>;
  phaseWeights: Record<number, number>;
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
  mitigationControlMap: Record<string, string>;
  coverageKB: CoverageKB;
}

export function buildTacticPhase(tactics: Tactic[]): Record<string, number> {
  const m: Record<string, number> = {};
  tactics.forEach(t => m[t.id] = t.phase);
  return m;
}

export function buildTacticToPhase(stixMap: Record<string, string>): Record<string, string> {
  const m: Record<string, string> = {};
  Object.entries(stixMap).forEach(([name, id]) => { m[id] = name; });
  return m;
}

const TACTIC_TO_PHASE_NAME: Record<string, string> = {};
Object.entries(STIX_TACTIC_MAP).forEach(([name, id]) => { TACTIC_TO_PHASE_NAME[id] = name; });

export function getFrameworkConfig(fw: string): FrameworkConfig {
  if (fw === "ics") {
    return {
      tactics: ICS_TACTICS,
      stixTacticMap: ICS_STIX_TACTIC_MAP,
      tacticPhase: buildTacticPhase(ICS_TACTICS),
      tacticToPhase: buildTacticToPhase(ICS_STIX_TACTIC_MAP),
      phaseWeights: ICS_PHASE_WEIGHTS,
      allPlatforms: ICS_ALL_PLATFORMS,
      killChainName: "mitre-ics-attack",
      stixSourceName: "mitre-attack",
      navigatorDomain: "ics-attack",
      stixUrl: "https://raw.githubusercontent.com/mitre/cti/ATT%26CK-v16.1/ics-attack/ics-attack.json",
      stixCacheKey: "ics-attack-v16.1",
      hasBuiltin: false,
      hasSubTechniques: false,
      securityControls: ICS_SECURITY_CONTROLS,
      controlPresets: ICS_CONTROL_PRESETS,
      envPresets: ICS_ENV_PRESETS,
      mitigationControlMap: ICS_MITIGATION_CONTROL_MAP,
      coverageKB: ICS_COVERAGE_KB,
    };
  }
  // Enterprise (default)
  return {
    tactics: TACTICS,
    stixTacticMap: STIX_TACTIC_MAP,
    tacticPhase: TACTIC_PHASE,
    tacticToPhase: TACTIC_TO_PHASE_NAME,
    phaseWeights: PHASE_WEIGHTS,
    allPlatforms: ALL_PLATFORMS,
    killChainName: "mitre-attack",
    stixSourceName: "mitre-attack",
    navigatorDomain: "enterprise-attack",
    stixUrl: "https://raw.githubusercontent.com/mitre/cti/ATT%26CK-v16.1/enterprise-attack/enterprise-attack.json",
    stixCacheKey: "enterprise-attack-v16.1",
    hasBuiltin: true,
    hasSubTechniques: true,
    securityControls: SECURITY_CONTROLS,
    controlPresets: CONTROL_PRESETS,
    envPresets: ENV_PRESETS,
    mitigationControlMap: MITIGATION_CONTROL_MAP,
    coverageKB: COVERAGE_KB,
  };
}
