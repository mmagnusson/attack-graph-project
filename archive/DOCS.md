# Attack Graph Optimizer -- Comprehensive Documentation

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Setup and Installation](#2-setup-and-installation)
- [3. Quick Start Guide](#3-quick-start-guide)
- [4. Features Guide](#4-features-guide)
  - [4.1 Graph Visualization](#41-graph-visualization)
  - [4.2 Framework Selection (Enterprise vs ICS/OT)](#42-framework-selection-enterprise-vs-icsot)
  - [4.3 Data Sources](#43-data-sources)
  - [4.4 Attack Chain Highlighting](#44-attack-chain-highlighting)
  - [4.5 Security Controls Panel](#45-security-controls-panel)
  - [4.6 Control Presets](#46-control-presets)
  - [4.7 Environment Presets](#47-environment-presets)
  - [4.8 Platform/OS Filtering](#48-platformos-filtering)
  - [4.9 Sub-Technique Toggle](#49-sub-technique-toggle)
  - [4.10 Chain Builder Mode](#410-chain-builder-mode)
  - [4.11 Kill Chain Phase Weighting](#411-kill-chain-phase-weighting)
  - [4.12 Gap Analysis and Remediation Roadmap](#412-gap-analysis-and-remediation-roadmap)
  - [4.13 Environment Profiling Wizard](#413-environment-profiling-wizard)
  - [4.14 Executive Summary](#414-executive-summary)
  - [4.15 Compare Mode (Dual-Framework IT/OT)](#415-compare-mode-dual-framework-itot)
  - [4.16 ATT&CK Navigator Import/Export](#416-attck-navigator-importexport)
  - [4.17 Shareable URLs](#417-shareable-urls)
  - [4.18 CSV Export](#418-csv-export)
  - [4.19 Optimal Remediation Algorithm](#419-optimal-remediation-algorithm)
  - [4.20 Popout Panels](#420-popout-panels)
- [5. Codebase Architecture](#5-codebase-architecture)
  - [5.1 Project Structure](#51-project-structure)
  - [5.2 Core Architecture Patterns](#52-core-architecture-patterns)
  - [5.3 Type System (`src/types/`)](#53-type-system-srctypes)
  - [5.4 Static Data and Loaders (`src/data/`)](#54-static-data-and-loaders-srcdata)
  - [5.5 Pure TypeScript Algorithms (`src/engine/`)](#55-pure-typescript-algorithms-srcengine)
  - [5.6 React Components (`src/components/`)](#56-react-components-srccomponents)
  - [5.7 Custom Hooks (`src/hooks/`)](#57-custom-hooks-srchooks)
  - [5.8 Main Application Component (`App.tsx`)](#58-main-application-component-apptsx)
- [6. Data Flow Diagrams](#6-data-flow-diagrams)
- [7. Security Considerations](#7-security-considerations)
- [8. Legacy Monolith](#8-legacy-monolith)

---

## 1. Project Overview

The Attack Graph Optimizer is a cybersecurity decision-support tool built around the MITRE ATT&CK framework. It visualizes attack technique relationships as a directed graph and helps security teams understand, prioritize, and mitigate cyber threats through quantitative risk analysis.

### What It Does

- Renders MITRE ATT&CK techniques as an interactive node-edge graph organized by kill chain phase
- Loads real threat intelligence from STIX 2.1 bundles (live from MITRE GitHub or uploaded)
- Models real-world threat actor attack chains (APT29, Conti, Volt Typhoon, etc.) as paths through the graph
- Computes per-technique exposure scores based on deployed security controls, environment profile, and infrastructure
- Identifies optimal remediation targets using a greedy set-cover algorithm
- Supports both Enterprise ATT&CK (14 tactics, ~200+ techniques) and ICS/OT ATT&CK (12 tactics)
- Generates executive summaries, gap analysis reports, and CSV exports for stakeholder communication

### Key Value Proposition

Rather than treating ATT&CK as a static reference, this tool turns it into an interactive model of your organization's actual attack surface. By combining your security tooling, infrastructure, and threat context, it calculates which techniques pose the greatest risk and which remediations provide the highest return on investment.

### Target Audience

- **Security operations teams** evaluating control coverage against real threat actors
- **Risk analysts** building quantitative risk models tied to the ATT&CK framework
- **CISO staff** needing executive-level summaries of security posture
- **Red/purple teams** mapping attack paths and identifying coverage gaps
- **Compliance teams** mapping control frameworks (NIST CSF, CIS, PCI DSS, IEC 62443) to technique coverage

---

## 2. Setup and Installation

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (ships with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd attack-graph-project

# Navigate to the Vite project
cd attack-graph-optimizer

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

This starts the Vite dev server (typically at `http://localhost:5173`). Hot module replacement is enabled for instant feedback during development.

### Production Build

```bash
npm run build
```

Runs `tsc -b && vite build`. The output is placed in `attack-graph-optimizer/dist/`.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for verification.

### Linting

```bash
npm run lint
```

Runs ESLint across the project.

### Dependencies

The runtime dependencies are minimal:

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | DOM renderer |

All other packages (Vite, TypeScript, ESLint) are dev-only dependencies. The application has **no server-side requirements** -- it runs entirely in the browser.

### Accessing the Legacy Monolith

The original single-file version is still available at the project root:

```
attack-graph-project/attack-path-optimizer.html
```

Open it directly in any modern browser. It uses Babel Standalone for in-browser JSX compilation and loads React/ReactDOM from unpkg CDN. No build step is needed. See [Section 8. Legacy Monolith](#8-legacy-monolith) for details.

---

## 3. Quick Start Guide

### First Launch

1. Run `npm run dev` from the `attack-graph-optimizer/` directory.
2. Open the URL shown in the terminal (usually `http://localhost:5173`).
3. The application loads immediately with the **Enterprise ATT&CK** framework and **STIX live data** as the default data source.

### Loading Data

The application supports three data sources, selectable from the toolbar:

- **STIX (Live)** -- Fetches the full ATT&CK v16.1 STIX bundle from the MITRE GitHub repository. The bundle is cached in IndexedDB for 7 days, so subsequent loads are instant.
- **Built-in** -- Uses a curated dataset of 46 enterprise techniques, 8 threat actor chains (APT29, Conti, APT28, LockBit, Lazarus, FIN7, Volt Typhoon, BlackCat), and hand-authored contextual examples. Only available for the Enterprise framework.
- **Upload** -- Drag-and-drop or click to upload any STIX 2.1 bundle JSON file. The framework (Enterprise or ICS) is auto-detected from the bundle's kill chain phases.

### Basic Workflow

```
Load Data --> Explore Graph --> Select Chains --> Analyze --> Export
```

1. **Load data**: Choose your data source from the toolbar. Wait for STIX data to load if using live mode.
2. **Explore the graph**: Pan (click and drag background), zoom (scroll wheel), and hover nodes for tooltips showing technique details, exposure, and betweenness centrality.
3. **Select attack chains**: Click chains in the bottom panel to highlight them on the graph (up to 3 simultaneously, color-coded amber/cyan/pink).
4. **Deploy controls**: Open the Security Controls panel and toggle controls on/off to see how they reduce technique exposure in real time.
5. **Analyze gaps**: Use Gap Analysis to identify techniques with no control coverage.
6. **Run optimal remediation**: Set a budget (1-10 technique remediations) and view the algorithm's recommended targets.
7. **Export**: Generate an Executive Summary, export a CSV remediation roadmap, or share the current state via URL.

---

## 4. Features Guide

### 4.1 Graph Visualization

The core of the application is an interactive SVG graph where:

- **Nodes** represent MITRE ATT&CK techniques (e.g., T1566 Phishing, T1059 Command & Script Interpreter)
- **Edges** represent observed sequential relationships between techniques (derived from threat actor attack chains)
- **Node size** reflects priority: larger nodes have higher betweenness centrality multiplied by exposure
- **Node color** corresponds to the technique's tactic (kill chain phase), using a distinct color per tactic
- **Exposure ring** around each node: a dashed circle colored red (>70% exposure), amber (40-70%), or green (<40%)
- **Coverage indicator**: a purple dashed ring appears when the environment profile provides tool coverage for that technique

**Interactions:**

- **Pan**: Click and drag the background
- **Zoom**: Mouse scroll wheel, or use the +/- buttons in the top-right corner
- **Fit**: Click the "FIT" button to auto-zoom to show all nodes
- **Reset**: Click the reset button to return to the default view
- **Select node**: Click a node to view its full detail in the bottom detail panel
- **Hover**: Shows a rich tooltip with technique name, tactic, description excerpt, exposure percentage, betweenness centrality, and chain count
- **Drag node**: Click and drag a node to reposition it (custom positions persist during the session)
- **Collapse tactics**: Click the tactic labels at the top of the graph to collapse all techniques under that tactic into a single summary node

The graph layout is computed automatically by the `layoutNodes()` algorithm, which arranges techniques in columns by tactic (left-to-right following the kill chain), with adaptive multi-column layouts for tactics that contain many techniques.

### 4.2 Framework Selection (Enterprise vs ICS/OT)

The toolbar provides a framework toggle between:

- **Enterprise ATT&CK**: 14 tactics (Reconnaissance through Impact), 6 platforms (Windows, Linux, macOS, Cloud, Network, SaaS), sub-techniques supported
- **ICS/OT ATT&CK**: 12 tactics (Initial Access through Impact), 7 OT platforms (PLC/IED, HMI, Engineering Workstation, Control Server, Data Historian, SIS, I/O Server), no sub-techniques

Switching frameworks resets the environment preset, control preset, deployed controls, and environment profile, since each framework has its own set of security controls, environment presets, and coverage knowledge base.

When uploading a STIX bundle, the framework is auto-detected from the kill chain phases in the bundle (`mitre-attack` for Enterprise, `mitre-ics-attack` for ICS). If detected, a green notification appears and the framework switches automatically.

### 4.3 Data Sources

#### Built-in Dataset

A hand-curated dataset available only for the Enterprise framework. Contains:

- 46 techniques across all 14 tactics
- 117 directed edges between techniques
- 8 named attack chains modeling real threat actors (APT29/Cozy Bear, Conti Ransomware, APT28/Fancy Bear, LockBit 3.0, Lazarus Group, FIN7, Volt Typhoon, BlackCat/ALPHV)
- Per-technique contextual examples (3 real-world examples each)
- Per-chain technique context explaining how each actor uses the technique
- Threat actor profiles with country attribution, aliases, active years, and target sectors
- MITRE mitigation mappings for every technique

#### STIX Live

Fetches the full MITRE ATT&CK STIX 2.1 bundle (Enterprise or ICS) from:

- Enterprise: `https://raw.githubusercontent.com/mitre/cti/ATT%26CK-v16.1/enterprise-attack/enterprise-attack.json`
- ICS: `https://raw.githubusercontent.com/mitre/cti/ATT%26CK-v16.1/ics-attack/ics-attack.json`

The bundle is parsed to extract techniques, relationships, intrusion sets (threat actors), mitigations, and platforms. Parsed data is cached in IndexedDB with a 7-day TTL. Attack chains are automatically constructed from intrusion set "uses" relationships, requiring at least 4 techniques across 3+ kill chain phases.

#### STIX Upload

Upload any STIX 2.1 JSON bundle file (max 100 MB). The parser auto-detects the framework, extracts all available data, and replaces the current dataset. This enables analysis of custom threat intelligence or modified ATT&CK datasets.

### 4.4 Attack Chain Highlighting

Up to 3 attack chains can be highlighted simultaneously on the graph. Each highlighted chain receives a distinct color:

| Slot | Color | Label |
|------|-------|-------|
| 1 | Amber (#f59e0b) | amber |
| 2 | Cyan (#06b6d4) | cyan |
| 3 | Pink (#ec4899) | pink |

When chains are highlighted:

- Nodes in the chain path receive a colored stroke ring
- Edges along the chain path are drawn with the chain's color and increased opacity
- Nodes and edges not in any highlighted chain are dimmed
- If a node belongs to multiple highlighted chains, its ring is segmented (one color per chain)
- If an edge belongs to multiple chains, parallel colored lines are drawn

**Isolate mode**: When enabled, nodes and edges outside all highlighted chains are hidden entirely, focusing the view on only the selected attack paths.

**Chain projection**: When sub-techniques are hidden, chain paths that reference sub-techniques (e.g., T1059.001) are automatically projected to their parent technique (T1059), preventing "orphan" nodes in the chain path.

**Chain filtering**: The chain panel supports filtering by sector (All, Government, Financial) and text search by chain name.

### 4.5 Security Controls Panel

The Security Controls panel lists all available controls for the current framework, organized into four categories:

| Category | Icon | Color | Examples |
|----------|------|-------|----------|
| Technical / Preventive | Shield | Teal | EDR/XDR, MFA, Network Segmentation, WAF |
| Detective / Monitoring | Target | Blue | SIEM/SOC, Threat Hunting, IDS/IPS, UBA |
| Administrative / Policy | Section | Purple | Security Training, Access Review, IR Plan |
| Physical / Operational | Square | Amber | Air-Gapped Networks, Physical Access, Red Team |

**Enterprise framework** has 44 controls; **ICS/OT framework** has 20 specialized OT controls (OT DPI, Data Diodes, Firmware Integrity, Jump Hosts, Purdue Segmentation, etc.).

Each control has:

- **Name**: Descriptive control name
- **Cost indicator**: $ (low) to $$$$ (high)
- **Coverage map**: Per-technique risk reduction values (e.g., EDR provides -40% on T1059, -50% on T1055)

When a control is toggled on (deployed), its coverage reductions are applied to the effective exposure of each covered technique. Multiple controls stack multiplicatively (complementary product), so deploying two controls that each reduce T1059 by 40% results in 1 - (1-0.4)(1-0.4) = 64% total reduction, not 80%.

### 4.6 Control Presets

Pre-defined sets of controls aligned to common industry frameworks:

**Enterprise presets:**

| Preset | Description | Controls |
|--------|-------------|----------|
| Manual | No preset, select controls individually | -- |
| NIST CSF Essential | Core NIST Cybersecurity Framework | 14 controls |
| CIS Controls v8 IG2 | CIS Implementation Group 2 | 18 controls |
| PCI DSS 4.0 | Payment Card Industry standard | 15 controls |
| Zero Trust Architecture | Zero Trust model essentials | 13 controls |

**ICS/OT presets:**

| Preset | Description | Controls |
|--------|-------------|----------|
| Manual | No preset | -- |
| NIST SP 800-82 | Guide to ICS Security | 13 controls |
| IEC 62443 | Industrial Automation Security | 18 controls |
| NERC CIP | Critical Infrastructure Protection | 12 controls |

Selecting a preset automatically deploys all its controls. You can then manually adjust individual controls afterward.

### 4.7 Environment Presets

Environment presets apply per-technique exposure overrides to model different organizational security postures without configuring individual controls:

**Enterprise:**

| Preset | Description |
|--------|-------------|
| Unassessed (Worst Case) | All techniques at 100% exposure |
| Government (Typical) | Basic perimeter, some EDR, limited segmentation |
| Hardened Enterprise | Full EDR, app whitelisting, segmentation, MFA |

**ICS/OT:**

| Preset | Description |
|--------|-------------|
| Unassessed (Worst Case) | No environment assessment applied |
| Air-Gapped OT Network | Isolated OT, no direct internet connectivity |
| Converged IT/OT Network | Blurred IT/OT boundary, shared infrastructure |
| Legacy SCADA System | Old unpatched SCADA with minimal controls |

### 4.8 Platform/OS Filtering

Filter the displayed techniques by platform. Only techniques that apply to at least one selected platform are shown.

**Enterprise platforms**: Windows, Linux, macOS, Cloud, Network, SaaS

**ICS platforms**: Field Controller/RTU/PLC/IED, Human-Machine Interface, Engineering Workstation, Control Server, Data Historian, Safety Instrumented System/Protection Relay, Input/Output Server

When no platforms are selected, all techniques are shown.

### 4.9 Sub-Technique Toggle

MITRE ATT&CK Enterprise includes sub-techniques (e.g., T1059.001 "PowerShell" under T1059 "Command & Script Interpreter"). Sub-techniques are hidden by default for a cleaner graph.

When enabled, sub-techniques appear as smaller nodes grouped near their parent technique. Chain paths are adjusted accordingly.

Sub-techniques are not available for the ICS/OT framework.

### 4.10 Chain Builder Mode

Create custom attack chains by clicking nodes in sequence:

1. Toggle Chain Builder mode from the toolbar
2. Click technique nodes in the order you want the attack path to follow
3. Purple dashed edges appear connecting each step
4. Name your chain and save it
5. Custom chains are persisted in localStorage and appear alongside built-in/STIX chains

Custom chains can be highlighted, analyzed, and exported just like built-in chains.

### 4.11 Kill Chain Phase Weighting

When enabled, the optimal remediation algorithm applies multipliers based on kill chain phase:

**Enterprise weights**: Phase 0 (Recon) = 0.5x, through Phase 8 (Exfil/Impact) = 1.5x

**ICS weights**: Phase 0 (Initial Access) = 0.6x, through Phase 8 (Impact) = 1.6x

This prioritizes remediating techniques in later (more damaging) phases of the kill chain, reflecting the reality that Impact-phase techniques (e.g., ransomware, data destruction) cause the most business harm.

### 4.12 Gap Analysis and Remediation Roadmap

The Gap Analysis panel identifies:

- **Techniques with no control coverage**: No deployed control provides any risk reduction for these techniques
- **Techniques with no mitigation mapping**: No MITRE mitigation maps to a deployed control
- **High-exposure techniques**: Techniques with effective exposure above 70%

The Remediation Roadmap Export generates a CSV file containing:

- Technique ID and name
- Current exposure level
- Applicable MITRE mitigations
- Deployed vs. recommended controls
- Priority ranking

CSV cells are sanitized to prevent formula injection (cells starting with `=`, `+`, `-`, `@` are prefixed with a single quote).

### 4.13 Environment Profiling Wizard

A 5-step modal wizard that builds a detailed environment profile for precision exposure scoring:

**Step 1 -- Organization (optional):**
- Industry (Financial Services, Healthcare, Government, Manufacturing, etc.)
- Organization size (Small <500, Medium 500-5000, Large 5000+)
- Compliance frameworks (NIST CSF, CMMC, HIPAA, PCI-DSS, SOC 2, FedRAMP)

**Step 2 -- Infrastructure:**
Select your deployed infrastructure from the Coverage Knowledge Base. Each item maps to specific technique exposure scores. Enterprise KB includes 15 infrastructure items (Windows AD domain, cloud infrastructure, email servers, VPN, etc.). ICS KB includes PLC vendors and OT-specific infrastructure.

**Step 3 -- Security Tools:**
Select your deployed security tools. Enterprise KB includes 25 real-world products (CrowdStrike Falcon, Microsoft Defender for Endpoint, Splunk, Palo Alto NGFW, etc.) with per-technique detection and prevention scores sourced from MITRE ATT&CK Evaluations.

**Step 4 -- Threat Context (optional):**
Select specific threat actors of concern to weight exposure scores toward techniques used by those actors. Actor weight formula: `1.0 + (0.5 * actorsUsingTechnique / totalSelectedActors)`, meaning techniques used by all selected actors get a 1.5x multiplier.

**Step 5 -- Review:**
Summary of all selections before generating the analysis. Click "Generate Analysis" to compute exposure scores.

The profile is persisted to localStorage. The exposure computation uses the 4-step complementary product formula described in [Section 6](#6-data-flow-diagrams).

### 4.14 Executive Summary

A comprehensive risk dashboard designed for stakeholder communication. Contains:

- **Overall Risk Score** (0-100): Composite of average exposure (40%), disruption rate (35%), and high-exposure ratio (25%). Color-coded red/amber/green.
- **Key Metrics**: Total techniques, attack chains, disruption rate, average exposure, remediations applied, controls deployed
- **Top 5 Risks**: Highest-priority unremediated techniques ranked by (exposure x betweenness centrality)
- **Coverage Gaps**: Tactics with highest average exposure, shown as bar charts
- **Recommended Actions**: Top 3 remediation targets from the optimal algorithm, plus top 3 undeployed controls by total coverage impact
- **Tactic Exposure Heatmap**: Per-tactic average exposure with color-coded bars

The Executive Summary can be popped out into a separate window for presentation.

### 4.15 Compare Mode (Dual-Framework IT/OT)

Enables side-by-side comparison of Enterprise and ICS/OT frameworks. When activated:

- The graph area splits into two panels: the active framework on the left, the comparison framework (read-only) on the right
- A convergence analysis card shows shared techniques, unique techniques per framework, and overlap statistics
- The comparison framework's data is loaded from STIX in the background

This is useful for organizations with both IT and OT environments who want to understand where their attack surfaces converge.

### 4.16 ATT&CK Navigator Import/Export

**Export**: Generates a MITRE ATT&CK Navigator layer JSON file from the current graph state. Techniques are scored by effective exposure and colored accordingly. The exported layer can be opened directly in the MITRE ATT&CK Navigator web application.

**Import**: Accepts Navigator layer JSON files, applying technique scores and selections from the imported layer to the current analysis.

Navigator domain is framework-dependent: `enterprise-attack` for Enterprise, `ics-attack` for ICS.

### 4.17 Shareable URLs

The current application state can be encoded into a URL hash string for sharing. The hash includes:

| Parameter | Key | Example |
|-----------|-----|---------|
| Framework | `fw` | `fw=ics` |
| Data source | `ds` | `ds=builtin` |
| Environment preset | `env` | `env=hardened` |
| Sector filter | `sec` | `sec=government` |
| Remediation budget | `budget` | `budget=7` |
| Remediated techniques | `rem` | `rem=T1566,T1059` |
| Deployed controls | `ctrl` | `ctrl=edr,mfa,seg` |
| Highlighted chains | `chains` | `chains=APT29|Conti` |
| Phase weighting | `pw` | `pw=1` |
| Platform filter | `plat` | `plat=Windows,Linux` |
| Control preset | `cp` | `cp=nist-csf` |

Only non-default values are included to keep URLs compact. All decoded values are validated against allowlists (e.g., framework must be "enterprise" or "ics", budget must be 1-10).

On load, URL hash parameters take priority over localStorage-persisted state.

### 4.18 CSV Export

Export functionality generates CSV files with sanitized cell values (formula injection prevention). Available exports include:

- **Remediation Roadmap**: Techniques ranked by priority with exposure, chain coverage, recommended actions
- **Gap Analysis**: Techniques lacking control coverage
- **Technique List**: Full technique inventory with exposure and centrality scores

### 4.19 Optimal Remediation Algorithm

Uses a **greedy weighted set cover** algorithm to select the highest-impact techniques to remediate within a given budget:

1. Start with all attack chains marked as "active"
2. For each unselected technique, compute a score: `chainsCovered * avgSeverity * exposure / cost`
3. If phase weighting is enabled, multiply the score by the phase weight (0.5x to 1.5x)
4. Select the highest-scoring technique, mark all chains containing it as "disrupted"
5. Repeat until the budget is exhausted or all chains are disrupted
6. Return the selected techniques and disruption statistics

The algorithm optimizes for maximum chain disruption per remediation action, favoring high-exposure techniques that appear in many high-severity chains.

### 4.20 Popout Panels

Most analysis panels (chains, priority, detail, controls, gap analysis, graph, executive summary) can be "popped out" into separate browser windows using the popout button. This enables multi-monitor workflows where the graph occupies one screen and analysis panels occupy another.

Popout windows inherit the application's dark theme and monospace typography. They are automatically closed when the main window closes, and the main window detects when a popout is closed by polling `window.closed`.

---

## 5. Codebase Architecture

### 5.1 Project Structure

```
attack-graph-project/
|-- attack-graph-optimizer/          # Vite + React + TypeScript project
|   |-- package.json                 # Dependencies and scripts
|   |-- vite.config.ts               # Vite configuration (React plugin)
|   |-- tsconfig.json                # TypeScript configuration
|   |-- PROGRESS.md                  # Decomposition progress tracker
|   |-- index.html                   # HTML entry point
|   |-- src/
|   |   |-- main.tsx                 # React DOM mount point
|   |   |-- index.css                # Global styles (dark theme)
|   |   |-- App.tsx                  # Main application component (2,626 lines)
|   |   |
|   |   |-- types/                   # TypeScript type definitions
|   |   |   |-- index.ts             # Re-exports all types
|   |   |   |-- graph.ts             # Core graph types (Technique, Edge, AttackChain, FrameworkConfig, etc.)
|   |   |   |-- coverageKb.ts        # Coverage KB types (CoverageTool, InfrastructureItem, CoverageKB)
|   |   |   |-- environment.ts       # Environment profile types (EnvironmentProfile, TechniqueExposure)
|   |   |
|   |   |-- data/                    # Static data and data loaders
|   |   |   |-- index.ts             # Re-exports
|   |   |   |-- constants.ts         # Tactics, chain colors, platform lists, phase weights, STIX tactic maps
|   |   |   |-- techniques.ts        # Built-in techniques (46), edges (117), attack chains (8)
|   |   |   |-- controls.ts          # Security controls (44 enterprise + 20 ICS), presets, mitigation maps
|   |   |   |-- envPresets.ts        # Environment presets (3 enterprise + 4 ICS)
|   |   |   |-- coverageKb.ts        # Coverage Knowledge Base (25 tools + 15 infra items, 665 lines)
|   |   |   |-- techniqueMetadata.ts # Technique examples, chain context, platforms, mitigations, actor profiles
|   |   |   |-- frameworkConfig.ts   # getFrameworkConfig() -- central configuration factory
|   |   |   |-- loadAttackData.ts    # STIX data loader with IndexedDB caching
|   |   |
|   |   |-- engine/                  # Pure TypeScript algorithms (no React dependencies)
|   |   |   |-- index.ts             # Re-exports
|   |   |   |-- graphModel.ts        # Betweenness centrality, optimal remediation, layout, CSV sanitization
|   |   |   |-- stixParser.ts        # STIX bundle parsing, framework auto-detection
|   |   |   |-- exposureEngine.ts    # Exposure scoring (4-step formula), KB category grouping
|   |   |
|   |   |-- components/              # React components
|   |   |   |-- Graph/
|   |   |   |   |-- GraphView.tsx    # Main SVG graph renderer (interactive nodes, edges, zoom, pan)
|   |   |   |   |-- ZoomButton.tsx   # Zoom control button
|   |   |   |   |-- index.ts
|   |   |   |-- Analysis/
|   |   |   |   |-- AnalysisCard.tsx  # Collapsible analysis section card
|   |   |   |   |-- Stat.tsx          # Stat display component
|   |   |   |   |-- LegendItem.tsx    # Legend item (color + label)
|   |   |   |   |-- MetricBox.tsx     # Metric display box
|   |   |   |   |-- PopoutPanel.tsx   # Window popout container (React portal)
|   |   |   |   |-- PopoutButton.tsx  # Popout trigger button
|   |   |   |   |-- PopoutPlaceholder.tsx  # Placeholder shown when panel is popped out
|   |   |   |   |-- index.ts
|   |   |   |-- Export/
|   |   |   |   |-- ExecutiveSummary.tsx  # Executive risk dashboard component
|   |   |   |   |-- index.ts
|   |   |   |-- ProfileWizard/
|   |   |       |-- ProfileWizard.tsx    # 5-step environment profiling wizard modal
|   |   |       |-- index.ts
|   |   |
|   |   |-- hooks/                   # Custom React hooks
|   |       |-- useUrlState.ts       # URL hash state encoding/decoding
|   |
|-- attack-path-optimizer.html       # Legacy monolith (6,253 lines)
|-- SECURITY-AUDIT.md                # Security audit report
|-- DOCS.md                          # This documentation file
|-- archive/                         # Archived files
|   |-- attack-graph-analyzer.html   # Earlier graph analyzer prototype
|   |-- attack-path-optimizer.jsx    # JSX reference extracted from monolith
|   |-- attack-graph-project_initial-conversation.txt  # Project history
```

### 5.2 Core Architecture Patterns

#### Framework-Dependent Configuration

The central pattern of the application is `getFrameworkConfig(fw)`, which returns a `FrameworkConfig` object containing all framework-specific data. This function is the single point of truth for switching between Enterprise and ICS/OT:

```typescript
const fwConfig = useMemo(() => getFrameworkConfig(framework), [framework]);
```

The returned `FrameworkConfig` includes:

- Tactic definitions and ordering
- STIX tactic slug-to-ID mapping
- Phase weights for the remediation algorithm
- Platform lists
- STIX URL and cache key
- All security controls (different for Enterprise vs ICS)
- Control presets (NIST CSF vs NIST 800-82, etc.)
- Environment presets
- Mitigation-to-control mappings
- Coverage Knowledge Base

Every piece of code that needs framework-specific data reads it from `fwConfig`, never from global constants directly.

#### STIX Data Flow

```
User selects data source
        |
        v
  [loadStixData()]  -->  Check IndexedDB cache
        |                       |
        v                   (cache hit)
  fetch() from MITRE GitHub     |
        |                       v
        v                 Return cached ParsedStixData
  parseStixBundle(bundle, fwConfig)
        |
        v
  Store in IndexedDB cache
        |
        v
  Return ParsedStixData
```

The `ParsedStixData` structure contains techniques, edges, chains, descriptions, platforms, mitigations, and group profiles -- everything derived from the raw STIX bundle.

#### State Management

The application uses React `useState` for all state (approximately 38 state variables in `App.tsx`). There is no Redux, Zustand, or other state library. State is organized into logical groups:

- **Framework state**: `framework`, `fwConfig`
- **Data state**: `dataSource`, `customData`, `stixLoading`, `stixError`
- **View state**: `selectedTech`, `highlightedChains`, `showAnalysis`, `panelHeight`
- **Control state**: `deployedControls`, `controlPreset`, `showControls`
- **Filter state**: `envPreset`, `selectedPlatforms`, `sectorFilter`, `showSubTechniques`
- **Remediation state**: `remediated`, `remediationBudget`, `phaseWeighting`
- **Profile state**: `environmentProfile`, `profileExposures`
- **UI state**: `popoutChains`, `popoutPriority`, etc.

**Persistence**: Key state is auto-saved to `localStorage` under `attackPathOptimizer_*` keys. On mount, URL hash parameters take priority over localStorage values. Collapsed tactics, custom chains, and environment profiles are all persisted.

### 5.3 Type System (`src/types/`)

#### `graph.ts` -- Core Graph Types

The foundational type definitions for the entire application:

- `Tactic`: Kill chain phase with id, name, phase number, and color
- `Technique`: Graph node with id, name, tactic assignment, base criticality, optional parentId for sub-techniques
- `Edge`: Directed connection between two technique IDs
- `AttackChain`: Named threat actor path through the graph with sector and severity
- `SecurityControl`: Control with per-technique coverage reductions (negative floats, e.g., -0.4 = 40% risk reduction)
- `ControlPreset`: Named preset mapping to a list of control IDs
- `EnvPreset`: Named environment preset with optional per-technique exposure overrides
- `FrameworkConfig`: The comprehensive return type of `getFrameworkConfig()`, aggregating all framework-specific data
- `ParsedStixData`: Everything extracted from a parsed STIX bundle
- `ChainProfile`: Threat actor metadata (country, aliases, dates, sectors, description)

#### `coverageKb.ts` -- Coverage KB Types

- `ToolTechniqueScore`: Per-technique detect/prevent score (0.0-1.0) with source attribution
- `CoverageTool`: A security tool with display name, category, data source, and technique scores
- `InfrastructureItem`: An infrastructure item with display name, category, and technique exposure scores
- `CoverageKB`: The complete knowledge base structure with metadata, tools, infrastructure, and category definitions

#### `environment.ts` -- Environment Profile Types

- `OrganizationContext`: Industry, size, compliance frameworks
- `EnvironmentProfile`: Infrastructure selections, security tool selections, optional threat actor selections
- `CoverageSource`: A single tool's contribution to coverage for a technique
- `TechniqueExposure`: Per-technique result from the exposure engine (base exposure, coverage reduction, actor weight, final exposure, coverage sources)

### 5.4 Static Data and Loaders (`src/data/`)

#### `constants.ts`

Framework-independent constants and both Enterprise and ICS tactic definitions:

- `TACTICS` (14 enterprise tactics) and `ICS_TACTICS` (12 ICS tactics)
- `CHAIN_COLORS`: Amber, cyan, pink for up to 3 highlighted chains
- `MAX_HIGHLIGHTED_CHAINS`: 3
- `STIX_TACTIC_MAP` / `ICS_STIX_TACTIC_MAP`: STIX slug-to-tactic-ID maps
- `PHASE_WEIGHTS` / `ICS_PHASE_WEIGHTS`: Kill chain phase multipliers
- `ALL_PLATFORMS` / `ICS_ALL_PLATFORMS`: Available platform strings
- `CONTROL_CATEGORIES`: Technical, Detective, Administrative, Physical with colors and icons

#### `techniques.ts`

Built-in dataset for the Enterprise framework:

- `TECHNIQUES`: 46 techniques with ID, name, tactic, and base criticality
- `EDGES`: 117 directed edges representing observed technique sequences
- `ATTACK_CHAINS`: 8 named threat actor chains (APT29, Conti, APT28, LockBit, Lazarus, FIN7, Volt Typhoon, BlackCat)

#### `controls.ts`

All security controls and presets:

- `SECURITY_CONTROLS`: 44 enterprise controls across 4 categories with per-technique coverage reductions
- `ICS_SECURITY_CONTROLS`: 20 ICS/OT-specific controls
- `ICS_MITIGATION_CONTROL_MAP`: Maps MITRE ICS mitigation names to ICS control IDs
- `CONTROL_PRESETS`: 4 enterprise presets (Manual, NIST CSF, CIS v8, PCI DSS, Zero Trust)
- `ICS_CONTROL_PRESETS`: 3 ICS presets (Manual, NIST 800-82, IEC 62443, NERC CIP)

#### `envPresets.ts`

Environment presets with per-technique exposure overrides:

- `ENV_PRESETS`: 3 enterprise presets (Unassessed, Government, Hardened)
- `ICS_ENV_PRESETS`: 4 ICS presets (Unassessed, Air-Gapped, Converged, Legacy SCADA)

#### `coverageKb.ts`

The Coverage Knowledge Base (665 lines) containing real-world security product data:

- **Tools** (25 enterprise): CrowdStrike Falcon, Microsoft Defender for Endpoint, SentinelOne, Splunk, Palo Alto NGFW, Proofpoint, Okta MFA, and more. Scores sourced from MITRE ATT&CK Evaluations (ER6/ER7), Sigma rule coverage, and vendor Navigator layers.
- **Infrastructure** (15 enterprise): Windows AD domain, Azure/AWS/GCP cloud, VPN, email, web apps, databases, etc.
- **ICS tools** (3): OT-specific security products
- **ICS infrastructure** (3+): PLC vendors and OT infrastructure

Each tool has per-technique `detect` and `prevent` scores (0.0-1.0). Each infrastructure item has per-technique `exposes` scores indicating how relevant a technique is to that infrastructure.

#### `techniqueMetadata.ts`

Rich contextual data for the built-in dataset:

- `TECHNIQUE_EXAMPLES`: Per-technique summary + 3 real-world examples (e.g., T1566 includes "Spearphishing with weaponized Office documents")
- `CHAIN_TECHNIQUE_CONTEXT`: Per-chain per-technique context explaining how specific actors use the technique
- `TECHNIQUE_PLATFORMS`: Platform assignments for all 46 built-in techniques
- `TECHNIQUE_MITIGATIONS`: MITRE mitigation mappings (e.g., T1566 maps to M1049 Antivirus, M1031 Network Intrusion Prevention, etc.)
- `MITIGATION_CONTROL_MAP`: Maps MITRE mitigation names to security control IDs (e.g., "Multi-factor Authentication" to "mfa")
- `CHAIN_PROFILES`: Threat actor profiles with country, aliases, active dates, sectors, and descriptions

#### `frameworkConfig.ts`

The `getFrameworkConfig(fw)` factory function that assembles all framework-specific data into a single `FrameworkConfig` object. Contains helper functions `buildTacticPhase()` and `buildTacticToPhase()` for constructing lookup maps.

#### `loadAttackData.ts`

Handles STIX data fetching and IndexedDB caching:

- `openStixCache()`: Opens the IndexedDB database
- `getCachedStix(key)`: Retrieves cached parsed data by cache key, returns null if expired (7-day TTL)
- `setCachedStix(key, data)`: Stores parsed data in the cache
- `loadStixData(signal, fwConfig)`: Main entry point -- checks cache first, fetches from MITRE GitHub if needed, parses with `parseStixBundle()`, caches the result

### 5.5 Pure TypeScript Algorithms (`src/engine/`)

These modules contain no React imports and can be tested independently.

#### `graphModel.ts` -- Graph Algorithms

**`computeBetweenness(techniques, edges)`**: Implements Brandes' algorithm for betweenness centrality on the directed technique graph. Returns normalized scores (0.0-1.0) per technique. Techniques with high betweenness appear in many shortest paths and are critical chokepoints.

**`computeChainCoverage(techniques, chains)`**: Counts how many attack chains include each technique. Used for the chain count display inside graph nodes.

**`findOptimalRemediation(techniques, chains, exposures, budget, phaseWeighting, fwConfig)`**: Greedy weighted set cover algorithm. At each step, selects the unremediated technique that maximizes `(chainsCovered * avgSeverity * exposure) / cost`, optionally multiplied by phase weight. Returns selected technique IDs and disruption statistics.

**`layoutNodes(techniques, tactics)`**: Positions technique nodes in tactic columns with automatic multi-column layout. Uses adaptive column counts based on technique count per tactic (1 column for up to 5 techniques, scaling up to 10 columns for 110+). Returns positions, view dimensions, and phase center metadata for tactic labels.

**`sanitizeCSVCell(value)`**: Prevents CSV formula injection by prefixing cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single quote.

#### `stixParser.ts` -- STIX Bundle Processing

**`detectFramework(bundle)`**: Scans a STIX bundle's `kill_chain_phases` to determine the framework. Returns `"ics"` if `mitre-ics-attack` is found, `"enterprise"` if `mitre-attack` is found, or `null` if neither.

**`parseStixBundle(bundle, fwConfig)`**: The main parser that processes a STIX 2.1 bundle into structured application data:

1. Extracts `attack-pattern` objects (non-revoked, non-deprecated) with valid kill chain phases
2. Identifies sub-techniques by the presence of a dot in the technique ID (e.g., T1059.001)
3. Normalizes cloud platforms (IaaS, Azure AD, Office 365, Google Workspace mapped to "Cloud")
4. Cleans descriptions by removing STIX citations and markdown links
5. Extracts `intrusion-set` objects as threat actors with profiles
6. Builds attack chains from `uses` relationships between intrusion sets and techniques, requiring at least 4 techniques across 3+ kill chain phases
7. Computes base criticality from usage frequency across all groups
8. Extracts `course-of-action` to technique `mitigates` relationships
9. Constructs edges from sequential techniques in attack chains

#### `exposureEngine.ts` -- Exposure Scoring

**`computeExposureScores(profile, coverageKB, techniques, actorTechMap)`**: The core exposure scoring algorithm. See [Section 6](#6-data-flow-diagrams) for the detailed 4-step formula.

**`buildActorTechMap(chains)`**: Constructs a mapping from actor name to the set of technique IDs they use, derived from attack chain paths.

**`getKBToolsByCategory(coverageKB)`**: Groups all tools in the KB by their category, enriched with KB keys. Used by the ProfileWizard to display categorized tool lists.

**`getKBInfraByCategory(coverageKB)`**: Groups all infrastructure items by category. Used by the ProfileWizard for infrastructure selection.

### 5.6 React Components (`src/components/`)

#### Graph Components

**`GraphView`** (`Graph/GraphView.tsx`): The primary interactive SVG graph renderer. Responsibilities include:

- Rendering technique nodes as circles with size, color, exposure rings, chain highlights, and labels
- Rendering directed edges with arrowheads, chain coloring, and multi-chain parallel lines
- Pan and zoom (mouse drag, scroll wheel, button controls)
- Node drag-and-drop repositioning
- Tactic collapse/expand (hiding all nodes in a tactic behind a summary circle)
- Rich hover tooltips with technique details
- Chain builder mode edge rendering
- Search dimming (nodes not matching search are faded)
- Isolation mode (hide non-chain nodes/edges)

**`ZoomButton`** (`Graph/ZoomButton.tsx`): Small styled button for zoom controls (+, -, reset, fit, popout).

#### Analysis Components

**`PopoutPanel`** (`Analysis/PopoutPanel.tsx`): Opens a new browser window and uses `ReactDOM.createPortal()` to render React children into it. Applies the dark theme styles, monitors for window close, and cleans up on unmount.

**`PopoutButton`** (`Analysis/PopoutButton.tsx`): Small icon button that triggers popout behavior.

**`PopoutPlaceholder`** (`Analysis/PopoutPlaceholder.tsx`): Placeholder shown in the main window when a panel is popped out.

**`AnalysisCard`** (`Analysis/AnalysisCard.tsx`): Collapsible card container for analysis sections.

**`Stat`** (`Analysis/Stat.tsx`): Displays a labeled statistic value.

**`LegendItem`** (`Analysis/LegendItem.tsx`): Color swatch + label for graph legends.

**`MetricBox`** (`Analysis/MetricBox.tsx`): Styled metric display box.

#### Export Components

**`ExecutiveSummary`** (`Export/ExecutiveSummary.tsx`): Full executive risk dashboard. Computes:

- Overall risk score (0-100) from exposure, disruption rate, and high-exposure ratio
- Top 5 risk techniques sorted by (exposure x betweenness)
- Coverage gaps by tactic (sorted by average exposure)
- Recommended actions: top 3 remediation targets + top 3 undeployed controls
- Full tactic exposure heatmap with colored bar charts

#### Profile Components

**`ProfileWizard`** (`ProfileWizard/ProfileWizard.tsx`): 5-step modal wizard for environment profiling. Features searchable categorized lists of tools and infrastructure, pill-style toggle selection, progress bar, and review step. Calls `onApply` with the complete `EnvironmentProfile` when the user finalizes.

### 5.7 Custom Hooks (`src/hooks/`)

#### `useUrlState.ts`

Provides two pure functions (not a React hook despite the file name):

**`encodeStateToHash(state)`**: Converts a `ShareableState` object to a URL-safe query string. Only encodes non-default values for compact URLs.

**`decodeHashToState(hash)`**: Parses a URL hash string back into a `ShareableState` object with full validation:

- Framework validated against `["enterprise", "ics"]`
- Data source validated against `["stix", "builtin"]`
- Sector validated against `["all", "government", "financial"]`
- Budget validated to range 1-10
- Invalid values are silently dropped

### 5.8 Main Application Component (`App.tsx`)

At 2,626 lines, `App.tsx` is the largest file and contains the main `AttackPathOptimizer` component. It is the current focus for further decomposition (see `PROGRESS.md` Phase B).

#### State Management Overview

The component declares approximately 38 `useState` hooks covering:

- Framework and data source selection
- Loaded data (customData from STIX/upload, or falls back to built-in constants)
- UI visibility toggles (panels, modals, popped-out windows)
- Analysis configuration (budget, presets, filters, weighting)
- User interactions (selected technique, highlighted chains, remediated techniques)
- Environment profiling (profile, computed exposures)
- Compare mode state

#### Key Computed Values (useMemo)

- `fwConfig`: Framework configuration from `getFrameworkConfig(framework)`
- `displayTechniques`: Techniques filtered by sub-technique toggle and platform filter
- `effectiveExposures`: Base exposures with security control reductions applied
- `layoutResult`: Graph node positions from `layoutNodes()`
- `betweenness`: Betweenness centrality scores from `computeBetweenness()`
- `chainCoverage`: Per-technique chain count from `computeChainCoverage()`
- `optimal`: Optimal remediation result from `findOptimalRemediation()`
- `gapAnalysis`: Techniques with no control coverage
- `chainSetAnalysis`: Uniqueness analysis across selected chains
- `filteredChains`: Chains filtered by sector

#### Key Effects (useEffect)

- **STIX data loading**: Triggers on `dataSource` or `framework` change; uses `AbortController` for cleanup
- **Environment preset application**: Applies exposure overrides when `envPreset` changes
- **Profile exposure computation**: Runs `computeExposureScores()` when environment profile or data changes
- **Framework change reset**: Resets environment preset, control preset, deployed controls, and profile when framework switches
- **Persistence**: Auto-saves state to localStorage
- **URL hash restore**: On mount, decodes URL hash and applies state
- **Compare mode data loading**: Loads the opposite framework's STIX data when compare mode is enabled

#### Toolbar Structure

The header toolbar provides framework toggle, data source selector, environment preset dropdown, STIX upload button, sector filter, search input, and feature toggle buttons.

#### Panel Layout

The application uses a split-panel layout:

- **Top**: Full-width interactive graph (GraphView component)
- **Divider**: Draggable horizontal divider
- **Bottom**: Three-panel layout
  - Left: Attack chains list with highlighting controls
  - Center: Priority queue / optimal remediation results
  - Right: Technique detail panel (selected technique info, mitigations, control impact, examples)

Additional overlay panels include:

- Security Controls panel (slide-in from right)
- Gap Analysis panel (slide-in)
- Executive Summary panel
- Environment Profile Wizard (modal)

---

## 6. Data Flow Diagrams

### STIX Data Loading Pipeline

```
User selects "STIX" data source or uploads a file
                |
                v
    +---------------------------+
    |  loadStixData(signal, fw) |
    +---------------------------+
                |
        [Check IndexedDB cache]
          /              \
    (cache hit)      (cache miss)
         |                |
         v                v
    Return cached    fetch(fwConfig.stixUrl)
    ParsedStixData        |
                          v
                   parseStixBundle(bundle, fwConfig)
                          |
                    +-----+-----+
                    |           |
                    v           v
              Extract       Extract
              techniques    intrusion-sets
              & platforms   & relationships
                    |           |
                    v           v
              Build edges   Build attack chains
              from chains   (min 4 techs, 3 phases)
                    |           |
                    +-----+-----+
                          |
                          v
                   ParsedStixData {
                     techniques, edges, chains,
                     descriptions, platforms,
                     mitigations, groupProfiles
                   }
                          |
                          v
                   Store in IndexedDB
                          |
                          v
                   Set as customData in state
                          |
                          v
                   Graph re-renders with new data
```

### Exposure Scoring Pipeline

The `computeExposureScores()` function implements a 4-step formula:

```
EnvironmentProfile + CoverageKB + Techniques + ActorTechMap
                          |
    +---------------------+---------------------+
    |                     |                     |
    v                     v                     v
Step 1: Base          Step 2: Coverage      Step 3: Actor
Exposure              Reduction             Weight
    |                     |                     |
    v                     v                     v
For each technique:   For each technique:   For each technique:
  max(0.3,              missProduct = 1.0     if actors selected:
    max(infra.exposes   for each tool:          count = actors
    [techId]))            missProduct *=          using this tech
                          (1 - detect)        weight = 1.0 +
                        coverage =              (0.5 * count /
                          1 - missProduct       totalActors)
                                              else: weight = 1.0
    |                     |                     |
    +---------------------+---------------------+
                          |
                          v
                    Step 4: Final Exposure
                    = min(1.0,
                        baseExposure
                        * (1 - coverageReduction)
                        * actorWeight
                      )
                          |
                          v
                    Record<techId, TechniqueExposure>
```

Key points:

- **Base exposure** defaults to 0.3 for all techniques, increased by matching infrastructure items
- **Coverage reduction** uses a complementary product formula, so multiple tools with partial detection stack without exceeding 100%
- **Actor weight** ranges from 1.0 (no actors selected or technique not used by any selected actor) to 1.5 (technique used by all selected actors)
- **Final exposure** is capped at 1.0

### Control Coverage Calculation

```
Deployed Controls Set + fwConfig.securityControls
                          |
                          v
    For each deployed control:
      For each technique in control.coverage:
        effectiveExposure[tech] =
          currentExposure[tech] * (1 + reductionValue)
                          |
                (reductionValue is negative,
                 e.g. -0.4 means multiply by 0.6)
                          |
                          v
    Result: effectiveExposures map
    (exposure values reduced by deployed controls)
```

Note: In the `effectiveExposures` computation, control reductions are applied multiplicatively. If a technique starts at 0.8 exposure and a control provides -0.4 coverage, the new exposure is `0.8 * (1 + (-0.4)) = 0.8 * 0.6 = 0.48`.

---

## 7. Security Considerations

A formal security audit was conducted on 2026-02-27 (see `/home/mmagnusson/other_dev/attack-graph-project/SECURITY-AUDIT.md`). Key findings and their status:

### Resolved Issues

| Issue | Severity | Resolution |
|-------|----------|------------|
| Unpinned CDN dependencies without SRI hashes | HIGH | Pinned exact versions with SHA-384 integrity hashes |
| No Content Security Policy | HIGH | Added CSP meta tag with restrictive directives |
| No clickjacking protection | MEDIUM | Added `frame-ancestors 'none'` + frame-busting JS |
| CSV formula injection | MEDIUM | Added `sanitizeCSVCell()` for all CSV exports |
| PopoutPanel innerHTML | MEDIUM | Replaced with safe DOM APIs |
| Hash parameter validation | LOW | Added allowlist validation for all URL params |
| No upload size limit | LOW | Added 100 MB file size guard |
| STIX fetch uses unpinned branch | LOW | Pinned to `ATT%26CK-v16.1` |
| No fetch cancellation | LOW | Added AbortController with cleanup |

### Deferred Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Babel Standalone requires `unsafe-eval` | MEDIUM | Legacy monolith only; the Vite build eliminates this |
| Google Fonts privacy leak | LOW | External font loading; self-hosting requires deployment model change |

### Positive Findings

- No `innerHTML` or `dangerouslySetInnerHTML` in application code (all React JSX, auto-escaped)
- Safe `JSON.parse()` usage with try/catch
- No `eval()` or `new Function()` in application code
- STIX description cleaning removes markdown and citations before display

### Recommendations for the Vite Build

The migration to Vite + React (Phase A) resolves the Babel Standalone `unsafe-eval` issue, as JSX is now compiled at build time. For production deployment, consider:

- Adding a strict CSP to `index.html` (no `unsafe-eval` needed)
- Self-hosting fonts and dependencies for air-gapped or privacy-sensitive environments
- Enabling Subresource Integrity for any remaining CDN assets
- Implementing rate limiting on the STIX data fetch

---

## 8. Legacy Monolith

### `attack-path-optimizer.html`

The original implementation of the Attack Graph Optimizer as a single self-contained HTML file (6,253 lines). It uses:

- **React 18** loaded from unpkg CDN
- **Babel Standalone** for in-browser JSX compilation (no build step required)
- **Google Fonts** for the JetBrains Mono typeface

This file contains all the same features as the Vite project -- it is the source from which the modular project was decomposed. It can still be opened directly in any modern browser by double-clicking the file.

**Trade-offs vs. the Vite project:**

| Aspect | Monolith | Vite Project |
|--------|----------|-------------|
| Setup | Zero (open in browser) | Requires Node.js + npm install |
| Build step | None (Babel runtime) | TypeScript + Vite build |
| CSP compatibility | Requires `unsafe-eval` | Clean CSP possible |
| Page load | ~3 MB Babel overhead | Optimized bundle |
| Type safety | None (plain JSX) | Full TypeScript |
| Maintainability | Single 6,253-line file | 36 modular files |
| Testability | Difficult | Engine modules easily testable |

### Archive Directory

The `archive/` folder contains:

- `attack-graph-analyzer.html`: An earlier prototype of the graph analysis tool
- `attack-path-optimizer.jsx`: JSX source extracted from the monolith for reference
- `attack-graph-project_initial-conversation.txt`: Historical project context

These files are preserved for reference but are not part of the active codebase.
