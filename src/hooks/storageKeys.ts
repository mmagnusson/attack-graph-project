// ─── Persisted state keys (single source of truth) ──────────────────────────

import { STORAGE_PREFIX } from './usePersistentState';

export const KEYS = {
  framework: STORAGE_PREFIX + 'framework',
  vocabulary: STORAGE_PREFIX + 'vocabulary',
  budget: STORAGE_PREFIX + 'budget',
  orgSize: STORAGE_PREFIX + 'orgSize',
  costs: STORAGE_PREFIX + 'costs',
  params: STORAGE_PREFIX + 'params',
  gates: STORAGE_PREFIX + 'gates',
  software: STORAGE_PREFIX + 'software',
  campaigns: STORAGE_PREFIX + 'campaigns',
  sector: STORAGE_PREFIX + 'sector',
  envPreset: STORAGE_PREFIX + 'envPreset',
  exposure: STORAGE_PREFIX + 'exposure',
  platforms: STORAGE_PREFIX + 'platforms',
  highlighted: STORAGE_PREFIX + 'highlighted',
  sidebar: STORAGE_PREFIX + 'sidebar',
  bottomTab: STORAGE_PREFIX + 'bottomTab',
  headerCollapsed: STORAGE_PREFIX + 'headerCollapsed',
  /** { "<framework>:<vocabulary>": { prevent, detect } } */
  defenses: STORAGE_PREFIX + 'defenses',
  /** { <framework>: technique IDs assumed blocked } */
  blocked: STORAGE_PREFIX + 'blocked',
  /** v2.0 format, migrated on first read */
  legacyPostures: STORAGE_PREFIX + 'postures',
} as const;
