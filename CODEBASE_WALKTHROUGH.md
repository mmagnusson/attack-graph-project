# AttackBreaker — Codebase Walkthrough

A developer guide to understanding the architecture, data flow, and code organization of the AttackBreaker application.

---

## What AttackBreaker Does

AttackBreaker is a single-page React application that models cyberattack paths using the MITRE ATT&CK framework. It parses real threat intelligence data (STIX bundles), builds a graph of attack techniques and chains, and helps users figure out which security controls to deploy for maximum defensive impact. Everything runs in the browser — there is no backend server.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        App.tsx                                │
│                   (main orchestrator)                         │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Header  │  │ StatsBar │  │ GraphView│  │ Bottom Panels│  │
│  │         │  │          │  │  (SVG)   │  │ Chains/Pri/  │  │
│  │ config  │  │ actions  │  │          │  │ Detail tabs  │  │
│  └─────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────────┐  │
│  │   Right Sidebar    │  │         Modals                 │  │
│  │ Controls/Analysis/ │  │ ProfileWizard / Executive /    │  │
│  │ Gaps / Executive   │  │ HelpGuide                     │  │
│  └────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

    ▲ state            ▲ algorithms            ▲ static data
    │                  │                       │
┌───┴────┐      ┌──────┴──────┐         ┌──────┴──────┐
│ hooks/ │      │   engine/   │         │    data/    │
│        │      │             │         │             │
│ State  │      │ stixParser  │         │ techniques  │
│ mgmt,  │◄────│ graphModel  │◄────────│ controls    │
│ effects│      │ exposure    │         │ coverageKb  │
│        │      │ Engine      │         │ constants   │
└────────┘      └─────────────┘         └─────────────┘
```

---

## Directory Structure

```
src/
├── App.tsx                    Main component — ~1200 lines, 48+ state variables
├── main.tsx                   React entry point (renders App into DOM)
├── index.css                  Global CSS (animations, hover transitions)
├── theme.ts                   Design tokens (colors, spacing, fonts, shadows)
│
├── engine/                    Pure logic — no React, no UI
│   ├── stixParser.ts          Parses STIX JSON into techniques, chains, mitigations
│   ├── graphModel.ts          Layout algorithm, betweenness centrality, set cover
│   └── exposureEngine.ts      Exposure scoring from infrastructure + tools
│
├── types/                     TypeScript interfaces
│   ├── graph.ts               Core domain: Technique, Edge, Chain, Control, etc.
│   ├── environment.ts         EnvironmentProfile, TechniqueExposure
│   └── coverageKb.ts          CoverageTool, InfrastructureItem, CoverageKB
│
├── data/                      Static datasets + data loading
│   ├── techniques.ts          Built-in techniques, edges, and attack chains
│   ├── constants.ts           Tactics, phase maps, chain colors
│   ├── controls.ts            Security controls and control presets
│   ├── envPresets.ts          Environment presets (Corporate, Cloud-heavy, etc.)
│   ├── techniqueMetadata.ts   Examples, chain profiles, mitigation descriptions
│   ├── coverageKb.ts          Coverage knowledge base (tools + infrastructure)
│   ├── frameworkConfig.ts     Framework-specific config factory
│   └── loadAttackData.ts      STIX fetching with IndexedDB caching
│
├── hooks/                     React custom hooks (state + side effects)
│   ├── useStixLoader.ts       STIX data loading, file upload, framework detection
│   ├── useChainBuilder.ts     Custom attack chain builder
│   ├── useEnvironmentProfile.ts  Profile wizard state + exposure computation
│   ├── useGraphInteraction.ts    Panel divider drag, tactic collapse, search
│   ├── useCompareMode.ts      Side-by-side Enterprise vs ICS comparison
│   ├── useExportHandlers.ts   CSV export, Navigator layer import/export
│   └── useUrlState.ts         URL hash encoding for state sharing
│
└── components/                React UI components
    ├── Graph/
    │   └── GraphView.tsx      SVG graph canvas — nodes, edges, interactions
    ├── Header/
    │   ├── Header.tsx         Top bar — framework, data source, filters
    │   └── StatsBar.tsx       Stats, action buttons, MORE dropdown
    ├── Panels/
    │   ├── ChainsPanel.tsx    Attack chain list with highlighting
    │   ├── PriorityPanel.tsx  Techniques ranked by risk
    │   ├── DetailPanel.tsx    Selected technique deep-dive
    │   ├── ControlsPanel.tsx  Security control deployment toggles
    │   ├── AnalysisPanel.tsx  Graph metrics and coverage stats
    │   ├── GapAnalysisPanel.tsx   Uncovered technique identification
    │   └── ExposureSummaryPanel.tsx  Environment profile results
    ├── Analysis/              Shared UI primitives (Stat, MetricBox, etc.)
    ├── Export/
    │   └── ExecutiveSummary.tsx    Leadership-ready report
    ├── ProfileWizard/
    │   └── ProfileWizard.tsx  Multi-step environment profiling wizard
    └── HelpGuide.tsx          In-app walkthrough overlay
```

---

## The Data Pipeline

Data flows through four stages, from raw STIX intelligence to an interactive graph with remediation recommendations.

### Stage 1: Data Loading

**Files:** `data/loadAttackData.ts`, `hooks/useStixLoader.ts`

The user picks a data source:
- **Built-in** — hardcoded techniques, edges, and chains from `data/techniques.ts`
- **STIX (Live)** — fetched from MITRE's GitHub, cached in IndexedDB for 7 days
- **Upload** — user provides a custom `.json` STIX bundle

The `useStixLoader` hook manages this. When STIX data arrives, it calls `parseStixBundle()` from the engine.

### Stage 2: STIX Parsing

**File:** `engine/stixParser.ts` — `parseStixBundle()` (lines 87–240)

This is where raw MITRE data becomes usable. The parser:

1. **Extracts techniques** from `attack-pattern` objects. Each gets an ID (like T1059), name, tactic assignment, platform list, and description.

2. **Assigns tactics** using a mapping table (`STIX_TACTIC_MAP`) that converts STIX kill-chain phase names to the app's tactic IDs (TA0001, TA0002, etc.).

3. **Builds attack chains** from `intrusion-set` objects (threat actor groups like APT28, APT41). It traces the "uses" relationships from actors to techniques and assembles them into ordered paths. Only chains with 4+ techniques spanning 3+ phases are kept — this filters out noise.

4. **Computes criticality** — a technique's `baseCriticality` is based on how many threat actors use it. More actors = higher score = bigger node on the graph.

5. **Creates edges** from chain adjacency — if technique A comes before technique B in any chain, an edge connects them.

6. **Parses mitigations** from `course-of-action` objects linked via "mitigates" relationships. Each mitigation gets an ID, name, and description (cleaned of citation markers).

7. **Detects framework** automatically if the user uploads a file — `detectFramework()` looks for ICS-specific tactic names.

### Stage 3: Graph Construction & Layout

**File:** `engine/graphModel.ts`

Once parsed data reaches `App.tsx`, several computations happen:

**Layout** — `layoutNodes()` (lines 169–259) positions technique nodes on the SVG canvas:
- Groups techniques by tactic (kill-chain phase)
- Arranges each tactic group in a multi-column grid
- Spaces phases horizontally with consistent gutters
- Returns (x, y) coordinates for every node

**Betweenness Centrality** — `computeBetweenness()` (lines 43–96) runs Brandes' algorithm on the technique graph. This identifies "chokepoint" techniques — the ones that appear on the most shortest paths between other techniques. High betweenness = high strategic value to defend.

**Chain Coverage** — `computeChainCoverage()` (lines 99–108) counts how many attack chains pass through each technique. More chains = more impact if you block it.

### Stage 4: Exposure Scoring & Remediation

**File:** `engine/exposureEngine.ts` — `computeExposureScores()` (lines 42–115)

If the user configures an environment profile (via the Profile Wizard), the exposure engine personalizes the analysis:

1. **Base exposure** from infrastructure — if your org runs Windows servers, Windows-relevant techniques get higher base exposure. Formula: `max(0.3, max(infra_relevance))` for each technique.

2. **Coverage reduction** from security tools — each tool (EDR, email gateway, SIEM, etc.) provides detect/prevent scores per technique. Multiple tools combine using complementary probability: `coverage = 1 - Π(1 - tool_score)`. This means two 50% tools give 75% coverage, not 100%.

3. **Actor weighting** (optional) — if the user selects threat actors of concern, techniques used by those actors get boosted importance: `weight = 1.0 + (0.5 × matched_actors / total_actors)`.

4. **Final exposure** = `base × (1 - coverage) × actor_weight`, capped at 1.0.

**Remediation** — `findOptimalRemediation()` (lines 111–166) solves a greedy weighted set cover:
- Each iteration picks the technique with the best score: `(chains_covered × avg_severity × exposure) / cost`
- Removes all chains that pass through that technique
- Repeats until the budget is spent
- When phase weighting is enabled, early-phase techniques (Initial Access, Execution) get multiplied importance

---

## How App.tsx Orchestrates Everything

`App.tsx` is the central hub. It's large (~1200 lines) because it manages all state and wires components together. Here's how it's organized:

### State (~48 variables)

| Category | Key State | Purpose |
|----------|-----------|---------|
| Data | `framework`, `dataSource`, `customData` | What data we're working with |
| Techniques | `activeTechniques`, `activeEdges`, `activeChains` | Merged built-in + STIX data |
| Display | `displayTechniques`, `displayEdges` | Filtered for current view |
| Controls | `deployedControls` (Set), `controlPreset` | Which security controls are active |
| Exposure | `exposures`, `effectiveExposures` | Per-technique risk scores |
| Remediation | `remediated` (Set), `optimal` | What's been fixed, what should be |
| Graph | `selectedTech`, `highlightedChains` | Current user selection |
| Layout | `headerCollapsed`, `showBottomPanels`, `sidebarPanel`, `bottomTab` | UI layout state |
| Filters | `selectedPlatforms`, `sectorFilter`, `showSubTechniques` | Data filtering |

### Key Computed Values (useMemo)

- `fwConfig` — framework configuration object, recomputed when `framework` changes
- `filteredChains` — chains filtered by sector and platform
- `displayTechniques` — techniques after sub-technique and platform filtering
- `displayEdges` — edges between currently visible techniques
- `betweenness` — centrality scores for current technique set
- `chainCoverage` — how many chains each technique appears in
- `optimal` — result of set cover algorithm with current budget
- `totalDisrupted` — count of chains with at least one remediated technique

### Data Flow Through Components

```
App.tsx
│
├─ useStixLoader(fwConfig)
│  └→ customData (ParsedStixData)
│     └→ merged into activeTechniques, activeEdges, activeChains
│
├─ useEnvironmentProfile(fwConfig, displayTechniques, ...)
│  └→ environmentProfile, exposureSummary
│     └→ feeds into effectiveExposures
│
├─ useChainBuilder()
│  └→ chainBuilderPath, custom chains added to activeChains
│
├─ useCompareMode(framework)
│  └→ compareData for side-by-side view
│
├─ useExportHandlers(...)
│  └→ exportCSV(), exportNavigatorLayer()
│
└─ useUrlState(...)
   └→ encodeStateToHash(), decodeHashToState()
      └→ enables SHARE button (URL contains full app state)
```

### Persistence

State is saved to `localStorage` under these keys:
- `attackBreaker_envProfile` — environment profile
- `attackBreaker_customChains` — user-built chains
- `attackBreaker_collapsed` — collapsed tactic groups
- `ab_bottomTab` — which bottom tab is selected
- `ab_headerCollapsed` — header expand/collapse state

STIX data is cached in **IndexedDB** (database `AttackBreakerDB`, store `stixCache`) with a 7-day TTL.

---

## The Graph Visualization

**File:** `components/Graph/GraphView.tsx`

The graph is rendered as SVG inside a container with pan/zoom support.

### Node Rendering

Each technique becomes a circle with:
- **Radius** proportional to its importance (betweenness centrality × criticality)
- **Color** based on state: green (remediated), red/orange (high exposure), purple ring (optimal pick), blue (selected)
- **Label** showing the technique ID (e.g., T1059)
- **Tooltip** on hover showing name, exposure score, and coverage details

### Edge Rendering

Edges are drawn as SVG lines between technique nodes. When chains are highlighted, the edges in those chains get colored and thickened.

### Interactions

- **Click node** → selects it, switches bottom panel to Detail tab
- **Hover node** → shows tooltip with technique info
- **Drag node** → repositions it (saved in `customPositions`)
- **Click chain** (in ChainsPanel) → highlights up to 3 chains on the graph
- **Pan** — drag background to pan the view
- **Zoom** — scroll wheel or zoom buttons

---

## Security Controls System

**Files:** `data/controls.ts`, `components/Panels/ControlsPanel.tsx`

Security controls represent real-world defensive tools (like "Enable MFA", "Deploy EDR", "Network Segmentation"). Each control has:

```typescript
{
  id: string,
  name: string,
  category: string,          // "identity", "network", "endpoint", etc.
  coverage: {
    [techniqueId]: number    // negative value = reduction (e.g., -0.4 = 40% reduction)
  }
}
```

When you deploy a control, its coverage values modify `effectiveExposures`:
```
effectiveExposure[tid] = baseExposure[tid] × (1 + coverage[tid])
```
Since coverage values are negative, this reduces exposure. A technique is "remediated" when its effective exposure drops below a threshold.

The **Controls panel** groups controls by category and shows:
- Toggle switches to deploy/undeploy
- Which techniques each control covers (with hover tooltips showing technique names)
- Coverage percentage per technique
- Whether matching MITRE mitigations exist

---

## Coverage Knowledge Base

**File:** `data/coverageKb.ts`

The coverage KB is the data layer that powers the Environment Profile feature. It contains:

**Tools** — real security products (CrowdStrike Falcon, Microsoft Defender, Okta, etc.) with per-technique detect/prevent scores sourced from MITRE Evaluations, Sigma Rules, and vendor data.

**Infrastructure** — environment elements (Windows servers, Linux, cloud platforms, Active Directory, etc.) with per-technique exposure relevance scores. Having Windows servers means Windows-targeting techniques are more relevant to you.

There are separate KBs for Enterprise and ICS frameworks.

---

## Framework Configuration

**File:** `data/frameworkConfig.ts` — `getFrameworkConfig()`

This factory function returns a `FrameworkConfig` object that bundles all framework-specific data together:

```typescript
{
  id: "enterprise" | "ics",
  tactics: Tactic[],
  stixTacticMap: Record<string, string>,
  tacticPhase: Record<string, number>,
  phaseWeights: Record<number, number>,
  allPlatforms: string[],
  stixUrl: string,
  controls: SecurityControl[],
  controlPresets: ControlPreset[],
  envPresets: Record<string, EnvPreset>,
  coverageKB: CoverageKB,
  mitigationControlMap: Record<string, string>,
  // ... more
}
```

This pattern keeps the rest of the app framework-agnostic — components just read from `fwConfig` without caring whether it's Enterprise or ICS data.

---

## Key Algorithms Explained

### Betweenness Centrality (Brandes' Algorithm)

**What it does:** Identifies techniques that sit on the most "shortest paths" between other techniques. If technique T is on 80% of all shortest paths, it's a critical chokepoint — blocking it disrupts many attack flows.

**Where:** `engine/graphModel.ts` lines 43–96

**How:** Standard Brandes implementation on a directed graph. Results are normalized to 0.0–1.0. This is an O(V×E) algorithm, which is efficient enough for the ~200-500 technique graphs we deal with.

### Greedy Weighted Set Cover

**What it does:** Given a budget of N nodes to remediate, finds the set that disrupts the most attack chains.

**Where:** `engine/graphModel.ts` lines 111–166

**How:** Iterative greedy approach:
1. Score every un-remediated technique: `(chains_it_covers × avg_chain_severity × exposure) / cost`
2. Pick the highest-scoring technique
3. Mark all chains through that technique as "disrupted"
4. Repeat until budget is spent

This is a classic approximation algorithm — guaranteed to be within ln(n) of optimal, and in practice is usually very close.

### Exposure Scoring (Complementary Probability)

**What it does:** Calculates how exposed each technique is given your infrastructure and security tools.

**Where:** `engine/exposureEngine.ts` lines 42–115

**Key insight:** When multiple tools cover the same technique, their coverage combines using complementary probability rather than simple addition. Two tools each providing 50% coverage give 75% total coverage (1 - 0.5 × 0.5), not 100%. This prevents unrealistic results and accurately models defense-in-depth.

---

## State Sharing (URL Encoding)

**File:** `hooks/useUrlState.ts`

The SHARE button encodes the entire app state into a URL hash. This includes:
- Framework and data source
- Deployed controls
- Selected technique
- Highlighted chains
- Filter settings
- Environment preset

The hash is compressed to keep URLs manageable. When someone opens a shared URL, `decodeHashToState()` restores the full state.

---

## Deployment

The app deploys to **Cloudflare Workers** via Wrangler. The configuration is in `wrangler.json` at the project root. The Cloudflare dashboard auto-deploys from the `main` branch on GitHub.

Build command: `npx tsc -b && npx vite build`

Important: `tsc -b` (project build mode) is stricter than `tsc --noEmit` — it flags unused variables as errors, not just warnings.

---

## Testing & Development

```bash
# Dev server
npm run dev

# Type check
npx tsc -b

# Production build
npx tsc -b && npx vite build
```

The project uses:
- **React 19** with TypeScript 5.9
- **Vite 7.3** for bundling
- All styling via **inline style props** (no CSS framework, no Tailwind)
- Design tokens centralized in `theme.ts`

---

## Common Code Patterns

### No CSS framework
All styling uses React's `style` prop with objects. The `theme.ts` file provides consistent tokens:
```typescript
theme.colors.textPrimary  // "#e2e8f0"
theme.spacing.lg           // "12px"
theme.fontSizes.small      // "12px"
theme.radii.sm             // "4px"
```

### Framework-agnostic components
Components receive `fwConfig` as a prop and read framework-specific data from it. They never import Enterprise or ICS data directly.

### Barrel exports
Each directory has an `index.ts` that re-exports public symbols. Import from the directory, not individual files:
```typescript
import { Technique, Edge } from './types';       // not './types/graph'
import { parseStixBundle } from './engine';       // not './engine/stixParser'
```

### State in App.tsx
Nearly all state lives in `App.tsx` and flows down as props. Hooks in `hooks/` encapsulate related state clusters (STIX loading, environment profile, etc.) but are called from App.tsx.
