# AttackBreaker — Codebase Walkthrough

A developer guide to the architecture, data flow, and code organization.

---

## What AttackBreaker Does

AttackBreaker is a single-page React app that models how MITRE ATT&CK threat actors get through an intrusion and recommends the defenses — MITRE mitigations and the telemetry MITRE's detection analytics need — that remove the most modeled risk per dollar. Everything runs in the browser; ATT&CK data is preprocessed at build time and served from the app's own origin.

---

## High-Level Architecture

```
 build time                         runtime (browser)
┌──────────────────────┐   ┌──────────────────────────────────────────────────────────┐
│ scripts/             │   │ App.tsx — state wiring, layout                           │
│ build-attack-data.ts │   │  ├ useAttackData ──► AttackDataset (bundled or upload)    │
│   STIX bundle        │   │  ├ useDefenses ────► DefensePosture (per framework)       │
│   └ parseStixBundle ─┼──►│  ├ useEnvironmentProfile ► exposure, tool coverage, weights│
│ public/data/*.json   │   │  ├ useRiskModel ───► compile → evaluate → optimize        │
└──────────────────────┘   │  │                    model state, plan, frontier, metrics │
                           │  └ components: GraphView, Plan/Defenses/Model/Blind spots/ │
                           │    Executive (sidebar), Threat actors/Hotspots/Detail (tabs)│
                           └──────────────────────────────────────────────────────────┘
```

`src/engine/` is pure TypeScript (no React) and is what the tests exercise.

---

## Directory Structure

```
scripts/build-attack-data.ts     Downloads/reads pinned STIX, writes public/data/<domain>-attack-<ver>.json
public/data/                     Bundled datasets (Enterprise ~2.8 MB / 0.7 MB gzipped, ICS ~0.3 MB)
tests/                           Vitest: parser, risk model, optimizer, URL state, board report, golden

src/
├── App.tsx                      Orchestrator: persisted settings, derived data, layout
├── main.tsx                     Applies a shared link to storage, then renders
├── theme.ts                     Design tokens
├── types/                       graph.ts (dataset, catalog, framework), model.ts, environment.ts, coverageKb.ts
├── engine/
│   ├── stixParser.ts            STIX → AttackDataset; PARSER_VERSION
│   ├── actorTags.ts             Sector / attribution keyword rules
│   ├── riskModel.ts             Probabilistic AND/OR model: compile, evaluate, what-ifs, read-outs
│   ├── portfolioOptimizer.ts    Catalog, costs, greedy budgeted optimizer, marginal values
│   ├── displayMetrics.ts        Roll-up onto displayed nodes, defense footprints, blind spots, formatters
│   ├── graphModel.ts            Layout, co-occurrence edges, chain fan edges, roll-up helpers
│   ├── exposureEngine.ts        Environment profile × coverage KB → model inputs
│   ├── boardReport.ts           Standalone printable HTML (escaped)
│   └── csv.ts                   CSV sanitizing + download
├── data/
│   ├── frameworkConfig.ts       ATTACK_VERSION, per-framework config (URLs, cache keys, gates, catalog)
│   ├── defenseCatalog.ts        Telemetry sources, mitigation cost tiers, gates, posture presets
│   ├── constants.ts             Tactics, STIX tactic maps, platforms, encoding/highlight colors
│   ├── envPresets.ts            Base-exposure presets
│   ├── coverageKb.ts            Environment-profile tool/infra KB (author estimates)
│   └── loadAttackData.ts        Same-origin fetch + IndexedDB cache keyed by parser version
├── hooks/
│   ├── useAttackData.ts         Bundled dataset per framework, STIX upload + auto-detect
│   ├── useDefenses.ts           Posture per framework (mitigations, data components, blocked)
│   ├── useEnvironmentProfile.ts Profile wizard state → exposure/tool coverage/actor weights
│   ├── useRiskModel.ts          Memoized compile/evaluate/plan/frontier/sensitivity/metrics
│   ├── useExportHandlers.ts     CSV, plan, Navigator layer, coverage, board report
│   ├── useCompareMode.ts        Read-only other-framework pane
│   ├── useGraphInteraction.ts   Divider drag, tactic collapse, search
│   ├── useChainBuilder.ts       Custom chains (migrates pre-v2 saved chains)
│   ├── usePersistentState.ts    localStorage-backed state with validation
│   ├── sharedLink.ts            Storage keys; shared link → storage before first render
│   └── useUrlState.ts           Validated hash encode/decode
└── components/
    ├── Graph/GraphView.tsx      SVG graph (pan/zoom/touch/drag), model-driven encoding
    ├── Charts/FrontierChart.tsx Cost vs residual risk
    ├── Panels/                  Plan, Defenses, Model, BlindSpots, Chains (+ChainBreakdown), Hotspots, Detail, ExposureSummary
    ├── Export/ExecutiveSummary.tsx
    ├── Header/                  Header, StatsBar, sidebar tab definitions
    ├── ProfileWizard/, HelpGuide.tsx, Analysis/ (small primitives), ui.tsx, styles.ts
```

---

## The Data Pipeline

### 1. Build time: STIX → AttackDataset

`npm run data` runs `scripts/build-attack-data.ts`, which loads the pinned bundle (`frameworkConfig.stixUrl`, or `--input <dir>`) and calls `parseStixBundle()`. Output is deterministic, so CI can verify freshness with `git diff`.

`parseStixBundle()` (`engine/stixParser.ts`) extracts:

- **Techniques** with *every* tactic they serve (`tactics`); `tactic` is the earliest-phase one and drives layout. v19 platform names are kept verbatim.
- **Adversaries** — groups (`intrusion-set`) and campaigns. `path` = techniques used directly ∪ techniques used through the actor's live malware/tools; `viaSoftware` marks the latter. Actors need ≥ 4 techniques across ≥ 3 phases. Sector/attribution tags come from `actorTags.ts`.
- **Mitigations** (M-series) with their technique mappings and MITRE's per-technique notes. `M1055`/`M1056` (and ICS `M0816`) are flagged non-actionable.
- **Detection** — v18+ model: detection strategy (DET) → analytics (AN, per platform) → data components (DC). Stored per technique.

The same function parses user uploads in the browser (`useAttackData.handleUpload`, with `detectFramework()` auto-switching).

### 2. Runtime loading

`loadAttackData()` fetches `cfg.dataUrl` from the app's origin and caches it in IndexedDB under `cfg.dataCacheKey`, which embeds `PARSER_VERSION`. `isCurrentDataset()` rejects stale cache entries or bundled files from an older parser.

### 3. Model inputs

- **Actors**: groups (+ campaigns if enabled), filtered by sector, plus custom chains.
- **Gates**: enabled required stages (`cfg.gateOptions`, defaults in `defenseCatalog.ts`).
- **Exposure**: base-exposure preset, then environment-profile infrastructure, then per-technique overrides (Detail slider / Navigator import). Parent values apply to sub-techniques.
- **Tool coverage / actor weights**: from the environment profile (`exposureEngine.ts`).
- **Posture**: implemented mitigations, collected data components, techniques assumed blocked.

### 4. Risk model (`engine/riskModel.ts`)

`compileModel()` turns inputs into index-based typed arrays: mitigation → technique indices (parent mappings expanded to sub-techniques; only deployable mitigations), technique → platform-filtered analytics (as DC index lists), DC → techniques, and per actor the option list for each applicable gate plus per-tactic "activity" groups.

`evaluateModel()` computes per technique `p` (success) and `q` (alert chance), then per actor:

```
S_gate = 1 − (1 − f) · Π(1 − p)                         stage passes with any option
E_gate = (1 − α)·[1 − Σp·q / (Σp + f)] + α·[1 − min q]   stage raises no alert
V      = Π S · (1 − ρ · (1 − Π E))                       viability; detection capped by response ρ
R      = Σ w·V                                           residual risk
```

Mitigations stack with diminishing returns: `p = base · Π_{i<k} (1 − M·½ⁱ)`.

`simulateAddition()` / `applyAddition()` are incremental: they copy `p`/`q`, update only techniques the added defense touches, and re-evaluate only actors using those techniques. This is what makes the optimizer interactive (full Enterprise frontier ≈ 150 ms).

Read-outs: `actorBreakdown()` (per-gate pass/no-alert and options, for the chain view), `viabilityParts()`, `techniqueActivity()` (each viable actor's mass split across its tactics and, within a tactic, in proportion to option success — drives node size and Hotspots).

### 5. Optimizer (`engine/portfolioOptimizer.ts`)

`buildCatalog()` lists everything not yet deployed: actionable mitigations at tier cost (or the user's override) and telemetry sources priced for their *missing* data components. `optimizePortfolio()` greedily picks the best risk-removed-per-dollar item, re-evaluating after each pick; with a budget it skips unaffordable items and falls back to the best single affordable item if that beats the bundle. `useRiskModel` runs it twice — budgeted (the plan) and unconstrained (the frontier chart) — and re-scores the plan under `SENSITIVITY_BOUNDS` for the range.

### 6. Display

`rollupMetrics()` maps model state onto the displayed nodes: with sub-techniques hidden, a parent sums its family's activity, activity-weights success/detection, and counts actors using any family member. `buildCooccurrenceEdges()` draws the strongest adjacent-phase co-occurrences (ATT&CK has no step order, so edges never claim "A leads to B"); `chainFanEdges()` draws a highlighted actor's options stage to stage.

---

## State & Persistence

All persisted keys live in `hooks/sharedLink.ts` (`KEYS`, prefix `attackBreaker.v2.`) and are read through `usePersistentState`, which validates stored values and tolerates unavailable storage. Posture, gates and exposure overrides are stored per framework.

**Shared links**: `main.tsx` calls `applySharedLinkToStorage()` before the first render — the hash is decoded and validated (`useUrlState.ts`), written into the same keys, and stripped from the URL. Every hook then initializes normally; no effects apply URL state after mount.

Highlighted actors keep a stable color slot (`{ id, color }`), so un-highlighting one never repaints the others.

---

## The Graph

`components/Graph/GraphView.tsx` keeps the original pan/zoom/touch/drag handling. Encoding:

| Mark | Meaning |
|---|---|
| Node fill | Tactic color |
| Node size | √(share of residual activity) |
| Orange arc (r+3) | Residual success, arc length = probability |
| Blue arc (r+6) | Detection coverage |
| Aqua dot | ≥ 1 mitigation in place on this technique |
| Number | Modeled actors using it |
| Dashed halo | Footprint of the hovered defense (Plan/Defenses) |
| Red dashes | Blind spot (Blind spots panel open) |
| Bottom pills | Stage status for the focused actor (✂ cut / ◐ narrowed / ○ open) |

Colors were validated with the dataviz palette validator against `#0a0f1a` and `#111827`.

---

## Testing

`npm test` runs:

- `stixParser.test.ts` — hand-built STIX fixture (`tests/fixtures/miniBundle.ts`) covering multi-tactic techniques, revoked objects, software-mediated use, campaigns, non-actionable mitigations, detection strategies.
- `riskModel.test.ts` — closed-form checks of every formula, inheritance, platform filtering, response cap, diminishing returns, and that incremental what-ifs equal full re-evaluation.
- `portfolioOptimizer.test.ts` — ranking, budget, the single-item safeguard, non-submodular behavior, catalog pricing.
- `urlState.test.ts` — hash round-trip and rejection of malformed input; board report escaping.
- `golden.test.ts` — bundled v19 data: catalog sizes, every data component in exactly one telemetry source, every actionable mitigation tiered, presets reference real IDs, monotone frontier, and a realism guard (blocking one popular technique must remove < 25% of risk).

---

## Deployment

Cloudflare Workers via Wrangler (`wrangler.jsonc`); `public/data` ships as static assets. The CSP in `index.html` allows `connect-src 'self'` only. Build: `npm run build` (`tsc -b` covers app, tooling and tests; then `vite build`).

---

## Common Code Patterns

- **Inline styles + `theme.ts` tokens**; no CSS framework. Text uses text tokens; data colors go on marks (`ENCODING` in `data/constants.ts`).
- **Framework-agnostic components** read `FrameworkConfig`; Enterprise and ICS differ only in data.
- **Component files export only components** (React Fast Refresh); shared constants live in `styles.ts`, `sidebarTabs.ts`, etc.
- **Engine first**: new behavior goes into a pure `engine/` function with a test, then a hook/component consumes it.
