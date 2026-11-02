// ─── Framework Config ─────────────────────────────────────────────────────────
//
// ATT&CK version pinning lives here (attackVersion / stixUrl) and in the coverage
// KB metadata. After bumping it, run `npm run data` to regenerate public/data.

import type { FrameworkConfig, FrameworkId, Tactic } from '../types';
import { TACTICS, ICS_TACTICS, STIX_TACTIC_MAP, ICS_STIX_TACTIC_MAP, ALL_PLATFORMS } from './constants';
import {
  ENTERPRISE_TELEMETRY, ENTERPRISE_MITIGATION_TIERS, ENTERPRISE_NON_ACTIONABLE, ENTERPRISE_GATES, ENTERPRISE_DEFAULT_GATES, ENTERPRISE_POSTURES,
  ICS_TELEMETRY, ICS_MITIGATION_TIERS, ICS_NON_ACTIONABLE, ICS_GATES, ICS_DEFAULT_GATES, ICS_POSTURES,
} from './defenseCatalog';
import { ENV_PRESETS, ICS_ENV_PRESETS } from './envPresets';
import { COVERAGE_KB, ICS_COVERAGE_KB } from './coverageKb';
import { PARSER_VERSION } from '../engine/stixParser';

export const ATTACK_VERSION = "19.0";

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

const stixUrl = (domain: string) =>
  "https://raw.githubusercontent.com/mitre/cti/ATT%26CK-v" + ATTACK_VERSION + "/" + domain + "/" + domain + ".json";

export function getFrameworkConfig(fw: FrameworkId | string): FrameworkConfig {
  if (fw === "ics") {
    return {
      id: "ics",
      label: "ICS/OT",
      tactics: ICS_TACTICS,
      stixTacticMap: ICS_STIX_TACTIC_MAP,
      tacticPhase: buildTacticPhase(ICS_TACTICS),
      tacticToPhase: buildTacticToPhase(ICS_STIX_TACTIC_MAP),
      // v19 ICS techniques carry no platform data, so there is nothing to filter on
      allPlatforms: [],
      killChainName: "mitre-ics-attack",
      stixSourceName: "mitre-attack",
      navigatorDomain: "ics-attack",
      attackVersion: ATTACK_VERSION,
      stixUrl: stixUrl("ics-attack"),
      dataUrl: "/data/ics-attack-" + ATTACK_VERSION + ".json",
      dataCacheKey: "ics-attack-" + ATTACK_VERSION + "-p" + PARSER_VERSION,
      hasSubTechniques: false,
      gateOptions: ICS_GATES,
      defaultGates: ICS_DEFAULT_GATES,
      telemetrySources: ICS_TELEMETRY,
      mitigationTiers: ICS_MITIGATION_TIERS,
      nonActionableMitigations: ICS_NON_ACTIONABLE,
      posturePresets: ICS_POSTURES,
      envPresets: ICS_ENV_PRESETS,
      coverageKB: ICS_COVERAGE_KB,
    };
  }
  return {
    id: "enterprise",
    label: "Enterprise",
    tactics: TACTICS,
    stixTacticMap: STIX_TACTIC_MAP,
    tacticPhase: buildTacticPhase(TACTICS),
    tacticToPhase: buildTacticToPhase(STIX_TACTIC_MAP),
    allPlatforms: ALL_PLATFORMS,
    killChainName: "mitre-attack",
    stixSourceName: "mitre-attack",
    navigatorDomain: "enterprise-attack",
    attackVersion: ATTACK_VERSION,
    stixUrl: stixUrl("enterprise-attack"),
    dataUrl: "/data/enterprise-attack-" + ATTACK_VERSION + ".json",
    dataCacheKey: "enterprise-attack-" + ATTACK_VERSION + "-p" + PARSER_VERSION,
    hasSubTechniques: true,
    gateOptions: ENTERPRISE_GATES,
    defaultGates: ENTERPRISE_DEFAULT_GATES,
    telemetrySources: ENTERPRISE_TELEMETRY,
    mitigationTiers: ENTERPRISE_MITIGATION_TIERS,
    nonActionableMitigations: ENTERPRISE_NON_ACTIONABLE,
    posturePresets: ENTERPRISE_POSTURES,
    envPresets: ENV_PRESETS,
    coverageKB: COVERAGE_KB,
  };
}
