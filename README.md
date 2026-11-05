# AttackBreaker

**Which defenses cut off the most real-world attack paths per dollar?**

AttackBreaker models how MITRE ATT&CK threat groups get through an intrusion, scores your current defenses against them, and recommends the next investments — MITRE mitigations and the telemetry MITRE's detection analytics need, or MITRE D3FEND countermeasures — ranked by risk removed per dollar, with an honest uncertainty range.

It runs entirely in the browser. The ATT&CK data (v20.1, Enterprise and ICS) and D3FEND data (1.6.0) are preprocessed at build time and served from the app's own origin.

## What you can do with it

- **Record your posture** — tick the MITRE mitigations you have and the telemetry you collect (grouped into purchasable sources such as endpoint process telemetry, identity logs, network flow, cloud audit logs), or start from an approximate preset (basic hygiene, NIST CSF, CIS IG2, PCI DSS, Zero Trust; NIST 800-82, IEC 62443, NERC CIP for OT).
- **Get a budgeted plan** — set an annual budget; see the recommended defenses in order, the cost-versus-residual-risk curve, and what the next dollars past the budget would buy. Edit any cost to a real quote and the plan re-ranks.
- **Plan in ATT&CK or D3FEND terms** — switch the defense catalog between ATT&CK mitigations + telemetry and MITRE D3FEND countermeasures (Harden, Isolate, Detect, Deceive). Every ATT&CK mitigation shows the D3FEND techniques that implement it, every technique shows its D3FEND countermeasures, and an ATT&CK posture can be carried over to D3FEND.
- **Check the plan against an exact search** — a background search tries every within-budget combination of the plan's defenses and the most promising others and reports how much of the best achievable reduction the plan gets (or proves it optimal).
- **See why** — for any threat actor, a stage-by-stage breakdown: which techniques it can switch between at each required stage, how likely it is to get through, and which defenses would cut it off.
- **Use MITRE's detection model** — every technique shows its MITRE detection strategy, the analytics per platform, and the data components each analytic needs; mark them collected and watch coverage change.
- **Find blind spots** — techniques in required stages carrying attacker activity with no mitigation and no telemetry.
- **Describe your environment** — pick your infrastructure and security products; for 33 EDR/XDR vendors, detection can come from their latest MITRE ATT&CK Evaluations results instead of estimates (see *Data provenance*).
- **Share and report** — shareable links, a printable one-page board report, plan/analysis CSVs, and ATT&CK Navigator layer import/export.

## How the model works

An intrusion must pass every **required stage** (default: Initial Access, Execution, Command & Control, and an Objective — Exfiltration or Impact). At each stage an actor can use **any** technique ATT&CK records for it, including techniques provided by its malware and tools. So:

- a stage is an **OR** over the actor's options — it only closes when all of them are covered;
- the chain is an **AND** over stages — closing any one stops the actor.

| Quantity | Formula |
|---|---|
| Technique success | `p = base · Π_{i<k} (1 − M·½ⁱ)` for `k` implemented mitigations (overlapping controls add less each) |
| Alert on a technique | `q = D · (1 − (1 − telemetry)(1 − tools))`, telemetry = share of the technique's MITRE analytics whose data components you collect |
| Stage passes | `S = 1 − (1 − f) · Π (1 − p)` |
| Stage raises no alert | `E = (1 − α)·[1 − Σp·q / (Σp + f)] + α·[1 − min q]` |
| Actor viability | `V = Π S · (1 − ρ · (1 − Π E))` |
| Residual risk | `Σ w·V / Σ w` over modeled actors |

`M` mitigation effectiveness (50%), `D` detection effectiveness (50%), `ρ` response effectiveness (60%), `f` substitution rate (15%), `α` adversary adaptiveness (50%). All are sliders in the **Model** panel; the plan reports its risk reduction under pessimistic and optimistic settings.

The optimizer is greedy on risk removed per dollar, re-evaluated after every pick, with the standard budgeted-greedy safeguard (compare against the best single affordable item), then a local search that swaps or adds single items while that lowers risk. The objective is not submodular, so that is a heuristic; **Plan → Run exact search** checks it. The exact search is a branch and bound over subsets of a growing candidate pool (the plan plus the 8, 16, 24 … most promising other defenses), run in a Web Worker for up to 30 s. Because risk only falls as defenses are added, the risk with every remaining affordable item added bounds each branch, which prunes most of the tree: on the bundled data it proves the optimum over all 40 useful ATT&CK defenses at a $250K budget in about 12 s. In those checks the plan got 96–100% of the best achievable reduction.

**Defense vocabularies.** The model scores *preventions* (lower technique success) and *detections* (raise alerts). In the ATT&CK vocabulary those are MITRE mitigations and data components (bought as telemetry sources); detection share is the fraction of a technique's MITRE analytics whose data components you collect. In the D3FEND vocabulary each D3FEND base technique is a purchasable item: Harden and Isolate are preventions (a base applies to every ATT&CK technique one of its countermeasures is mapped to); Detect and Deceive are detections, where each mapped countermeasure counts as one detection rule. Evict is what response effectiveness `ρ` already stands for, and Model (asset inventory, mapping) and Restore (recovery) don't change whether an intrusion succeeds, so those three are shown but not scored. Mappings are D3FEND's inferred ATT&CK ↔ D3FEND links via digital artifacts.

Why this replaced the previous model: it used to count a threat group as "disrupted" if *any one* of its techniques was remediated — on v19 data that claimed blocking a single technique (T1105) disrupted 57% of groups. Under the current model that block removes about 1.5% of risk, because groups have many alternatives at every stage. `tests/golden.test.ts` guards against regressing.

## Quick start

Requires **Node 20.19+ or 22** (Vite 7). `.nvmrc` pins 22.

```bash
npm ci
npm run dev        # http://localhost:5173
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest — parser, risk model, optimizer and exact search, D3FEND vocabulary and dataset, Evaluations scoring, URL state, report escaping, golden tests on bundled data |
| `npm run lint` | ESLint (typescript-eslint + React Hooks/Compiler rules) |
| `npm run check` | type check + lint + tests |
| `npm run build` | type check and production build to `dist/` |
| `npm run data` | regenerate the ATT&CK datasets in `public/data/` from the pinned release |
| `npm run data:d3fend` | regenerate `public/data/d3fend-1.6.0.json` from the pinned D3FEND release (API responses cached in `.cache/d3fend`) |
| `npm run data:evals` | build `public/data/evals-coverage.json` from MITRE ATT&CK Evaluations results (cached in `.cache/evals`; not committed — see below) |
| `npm run deploy` | build and deploy to Cloudflare Workers |

CI (`.github/workflows/ci.yml`) runs type check, lint, tests and build on every push and pull request. A manual run also verifies `public/data` matches what the parser produces from the pinned release.

## Updating ATT&CK and D3FEND

1. Bump `ATTACK_VERSION` in `src/data/frameworkConfig.ts` (and `metadata.attack_version` in `src/data/coverageKb.ts`).
2. If the release adds tactics, update `TACTICS` / `STIX_TACTIC_MAP` in `src/data/constants.ts` and the gate lists in `src/data/defenseCatalog.ts`; if it adds platforms, `ALL_PLATFORMS` / `ICS_PLATFORMS` there.
3. `npm run data` (or `npm run data -- --input <dir>` with local `<domain>-attack.json` files).
4. `npm run data:d3fend` — D3FEND links are kept only for techniques in the bundled datasets. The D3FEND API serves only its latest release, so if D3FEND has moved on, bump `D3FEND_VERSION` in `src/data/d3fendConfig.ts` (the script refuses to run otherwise). If you use Evaluations data, rerun `npm run data:evals` too; it maps technique IDs revoked by the new release to their replacements.
5. `npm test` — the golden tests fail if a new mitigation lacks a cost tier, a new data component isn't assigned to exactly one telemetry source, a platform isn't offered in the filter, or the coverage KB or an environment preset still uses a revoked or deprecated technique (map it to MITRE's replacement); the D3FEND tests fail if a scored D3FEND base technique lacks a cost tier, a telemetry source has no D3FEND equivalent, or D3FEND now maps a technique listed in `D3FEND_BORROWED_LINKS` (drop that entry).

If you change the parser's output, bump `PARSER_VERSION` in `src/engine/stixParser.ts`; it is part of every cache key and the bundled files are validated against it.

## Data provenance

- **Techniques, groups, campaigns, software, mitigations, detection strategies, analytics, data components:** MITRE ATT&CK v20.1 STIX bundles (`mitre/cti`, tag `ATT&CK-v20.1`).
- **Telemetry sources:** AttackBreaker's grouping of MITRE data components into purchasable bundles (`src/data/defenseCatalog.ts`).
- **Costs:** placeholder estimates by tier (1 = $15K, 2 = $50K, 3 = $150K, 4 = $400K per year for a mid-size org, scaled by org size). Replace them with quotes before using a plan for decisions.
- **Sector and attribution tags:** keyword rules over MITRE group descriptions (`src/engine/actorTags.ts`); attribution only on strong phrasing.
- **D3FEND countermeasures and ATT&CK mappings:** MITRE D3FEND 1.6.0 (ontology, technique CSV and the D3FEND API's inferred mappings; MIT license). D3FEND maps 424 of 706 Enterprise and 63 of 104 ICS techniques; 35 of 42 Enterprise mitigations have a D3FEND crosswalk (ICS mitigations have none). D3FEND 1.6.0 predates ATT&CK v20, so the nine ICS techniques v20 modeled on Enterprise ones (Command and Scripting Interpreter and its six sub-techniques, and DNS and Publish/Subscribe under Standard Application Layer Protocol) borrow the D3FEND links of their Enterprise equivalents until D3FEND maps them — AttackBreaker's inference, listed in `D3FEND_BORROWED_LINKS` and labeled in the Detail panel. The nine new Enterprise techniques have no D3FEND countermeasures yet. D3FEND cost tiers in `src/data/d3fendConfig.ts` are placeholders on the same scale as the ATT&CK catalog.
- **Environment profile tool scores** (`src/data/coverageKb.ts`): author estimates, illustrative only.
- **Measured EDR detection** (optional, `npm run data:evals`): for each vendor's latest Enterprise round from 2023 on (33 vendors across Enterprise 2023–2025), a technique's detection rate is the share of scored substeps whose first run produced a Technique, Tactic or General detection (MITRE's "analytic coverage"; setup, false-positive, N/A and post-configuration-change results excluded), pulled toward the vendor's overall rate by two pseudo-substeps since many techniques are tested once or twice. Technique IDs revoked since the round are mapped to their v19 replacements. Measured rates replace a product's estimated detection only for the techniques MITRE tested; prevention stays an estimate (protection test results can't be turned into per-technique rates). The generated file is **gitignored**: the Evaluations terms of use require any publication built on the results to say it uses MITRE ATT&CK Evaluations data and forbid "won"-style claims, and MITRE's general terms weren't verifiable, so confirm reuse is permitted before committing or deploying it. The app shows the attribution wherever measured data is used and works unchanged without the file.

## Color encoding

Orange `#d95926` = attacker success / residual risk, blue `#3987e5` = detection coverage, aqua `#199e70` = prevention, with arc length or bar length carrying the value and icons + words carrying state. Both this trio and the three chain-highlight colors were validated (lightness band, chroma, all-pairs CVD separation, contrast) against the app's dark surfaces.

## Project layout

```
scripts/build-attack-data.ts   STIX → compact dataset (build time)
scripts/build-d3fend-data.ts   D3FEND release + API mappings → compact dataset
scripts/build-evals-coverage.ts MITRE ATT&CK Evaluations results → per-technique detection rates
public/data/                   bundled ATT&CK v20.1 and D3FEND 1.6.0 datasets
src/engine/                    pure logic: parser, risk model, defense vocabularies, optimizer + exact search, graph helpers, report
src/workers/                   exact search Web Worker
src/data/                      framework config, defense catalog, presets, coverage KB
src/hooks/                     state, persistence, data loading, model wiring, exports
src/components/                React UI (graph, panels, charts)
tests/                         Vitest suites + a hand-built STIX fixture
```

See [CODEBASE_WALKTHROUGH.md](CODEBASE_WALKTHROUGH.md) for the architecture in depth.

## Limitations

ATT&CK records what has been publicly reported, not everything actors can do; MITRE's mitigation mappings don't state how effective a mitigation is for each technique; collecting telemetry only helps if analytics run on it and someone responds. D3FEND's ATT&CK links are inferred through shared digital artifacts, so they say a countermeasure is relevant to a technique, not how well it works; the borrowed ICS links are a further inference. MITRE ATT&CK Evaluations test each product in a vendor-configured lab against a few emulated adversaries, often once or twice per technique. The exact search proves a plan optimal only within the model and its cost estimates. The model makes these gaps explicit as parameters rather than hiding them — use it to rank and compare investments, not as a guarantee.
