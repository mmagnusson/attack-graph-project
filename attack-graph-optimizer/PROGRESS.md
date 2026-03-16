# Attack Graph Optimizer — Decomposition Progress

## Phase A: Scaffold & Extract Monolith ✅ COMPLETE (2026-03-11)

Decomposed `attack-path-optimizer.html` (6,253 lines) into modular Vite + React + TypeScript project.

- 36 source files, ~6,059 lines
- Clean build: `tsc -b && vite build` in <1s
- Separation: engine (pure TS) / components (React) / data (static + STIX)

### Files created:
- `src/types/` — graph.ts, coverageKb.ts, environment.ts, index.ts
- `src/engine/` — exposureEngine.ts, graphModel.ts, stixParser.ts, index.ts
- `src/data/` — constants.ts, techniques.ts, controls.ts, envPresets.ts, coverageKb.ts, techniqueMetadata.ts, frameworkConfig.ts, loadAttackData.ts, index.ts
- `src/components/Graph/` — GraphView.tsx, ZoomButton.tsx, index.ts
- `src/components/Analysis/` — Stat.tsx, LegendItem.tsx, MetricBox.tsx, AnalysisCard.tsx, PopoutPanel.tsx, PopoutButton.tsx, PopoutPlaceholder.tsx, index.ts
- `src/components/Export/` — ExecutiveSummary.tsx, index.ts
- `src/components/ProfileWizard/` — ProfileWizard.tsx, index.ts
- `src/hooks/` — useUrlState.ts
- `src/App.tsx` — Main component (2,626 lines — state, effects, handlers, JSX)
- `src/main.tsx`, `src/index.css`

---

## Phase B: Break Up App.tsx — IN PROGRESS

### B1: Extract UI components & export hook ✅ COMPLETE (2026-03-16)

App.tsx reduced from **2,626 → 1,244 lines** (53% reduction).
Extracted 10 focused component/hook files totaling ~1,633 lines.
Build: `tsc -b && vite build` — zero errors, 69 modules, <1s.

**Files created:**
- `src/hooks/useExportHandlers.ts` (191 lines) — CSV, Navigator layer, remediation plan, coverage CSV exports
- `src/components/Header/Header.tsx` (188 lines) — Framework, data source, env, platform, sector, budget, search
- `src/components/Header/StatsBar.tsx` (181 lines) — Stat indicators + 15 action buttons
- `src/components/Header/index.ts`
- `src/components/Panels/ChainsPanel.tsx` (191 lines) — Attack chains list, search, profiles, chain comparison
- `src/components/Panels/PriorityPanel.tsx` (56 lines) — Remediation priority ranking
- `src/components/Panels/DetailPanel.tsx` (315 lines) — Node detail, exposure slider, controls, mitigations, context
- `src/components/Panels/ControlsPanel.tsx` (166 lines) — Security controls grid with deploy/undeploy
- `src/components/Panels/AnalysisPanel.tsx` (120 lines) — Optimization analysis cards
- `src/components/Panels/GapAnalysisPanel.tsx` (118 lines) — Control gap analysis grid
- `src/components/Panels/ExposureSummaryPanel.tsx` (107 lines) — Environment coverage summary
- `src/components/Panels/index.ts`

### B2: Extract custom hooks from App.tsx — TODO

App.tsx still has ~1,244 lines with state + effects + computed values inline.
Further extraction possible but has diminishing returns due to heavy state interdependencies.

- [ ] `useStixLoader.ts` hook — dataSource, customData, stixLoading, file upload, STIX load effect
- [ ] `useEnvironmentProfile.ts` hook — profile state, exposure computation, persistence
- [ ] `usePersistence.ts` hook — localStorage autosave, URL hash restore/share
- [ ] `useGraphLayout.ts` hook — layoutResult, positions, customPositions, node drag
- [ ] `useAnalysis.ts` hook — betweenness, chainCoverage, gapAnalysis, optimal, chainStatus

---

## Phase C: Type Safety Hardening — TODO

- [ ] Replace all `any` casts in App.tsx with proper types
- [ ] Unify duplicate type definitions (FrameworkConfig in types/ vs data/)
- [ ] Add strict return types to all engine functions
- [ ] Add prop interfaces for all components (some use inline `any`)

---

## Phase D: Testing — TODO

- [ ] Unit tests for engine/exposureEngine.ts (computeExposureScores, buildActorTechMap)
- [ ] Unit tests for engine/graphModel.ts (computeBetweenness, findOptimalRemediation, layoutNodes)
- [ ] Unit tests for engine/stixParser.ts (detectFramework, parseStixBundle)
- [ ] Unit tests for hooks/useUrlState.ts (encode/decode round-trip)
- [ ] Integration test: load built-in data → compute → verify chain disruption
- [ ] Set up Vitest configuration

---

## Phase E: Cloudflare Pages Deployment — TODO

- [ ] Add `wrangler.toml` configuration
- [ ] Configure `vite.config.ts` for production (base path, chunk splitting)
- [ ] Add CSP meta tag to `index.html`
- [ ] Test production build locally with `npx wrangler pages dev dist`
- [ ] Set up CI/CD (GitHub Actions → Cloudflare Pages)

---

## Phase F: Phase 3 Spec Enhancements — TODO

Items from `ATT-CK_Graph_Optimizer_Phase3_Environment_Profiling_Plan.docx` not yet implemented:

- [ ] Review coverage KB completeness against spec (391 technique entries target)
- [ ] Verify exposure engine algorithm matches spec (4-step complementary product formula)
- [ ] Add free/paid tier gating per spec
- [ ] Additional testing scenarios from spec document
