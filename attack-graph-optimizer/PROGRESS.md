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

## Phase B: Break Up App.tsx — TODO

App.tsx is still 2,626 lines. Extract into custom hooks and sub-components:

- [ ] `useAppState.ts` hook — all 38 useState declarations + localStorage init
- [ ] `useStixLoader.ts` hook — STIX loading effect, upload handler, data source switching
- [ ] `useEnvironmentProfile.ts` hook — profile state, exposure computation, persistence
- [ ] `usePersistence.ts` hook — localStorage autosave, URL hash restore/share
- [ ] `useGraphLayout.ts` hook — layoutResult, positions, customPositions, node drag
- [ ] `useAnalysis.ts` hook — betweenness, chainCoverage, gapAnalysis, optimal, chainStatus
- [ ] Extract header toolbar into `components/Header/Header.tsx`
- [ ] Extract stats bar into `components/Header/StatsBar.tsx`
- [ ] Extract bottom panels (chains, priority, detail) into separate components
- [ ] Extract controls panel into `components/Controls/ControlsPanel.tsx`
- [ ] Extract gap analysis panel into `components/Analysis/GapAnalysisPanel.tsx`
- [ ] Extract analysis panel into `components/Analysis/AnalysisPanel.tsx`
- [ ] Extract exposure summary into `components/Analysis/ExposureSummary.tsx`

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
