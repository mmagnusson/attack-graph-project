# AttackBreaker

**Which defenses cut off the most real-world attack paths per dollar?**

AttackBreaker models how MITRE ATT&CK threat groups get through an intrusion, scores your current defenses against them, and recommends the next investments — MITRE mitigations and the telemetry MITRE's detection analytics need — ranked by risk removed per dollar, with an honest uncertainty range.

It runs entirely in the browser. The ATT&CK data (v19.0, Enterprise and ICS) is preprocessed at build time and served from the app's own origin.

## What you can do with it

- **Record your posture** — tick the MITRE mitigations you have and the telemetry you collect (grouped into purchasable sources such as endpoint process telemetry, identity logs, network flow, cloud audit logs), or start from an approximate preset (basic hygiene, NIST CSF, CIS IG2, PCI DSS, Zero Trust; NIST 800-82, IEC 62443, NERC CIP for OT).
- **Get a budgeted plan** — set an annual budget; see the recommended defenses in order, the cost-versus-residual-risk curve, and what the next dollars past the budget would buy. Edit any cost to a real quote and the plan re-ranks.
- **See why** — for any threat actor, a stage-by-stage breakdown: which techniques it can switch between at each required stage, how likely it is to get through, and which defenses would cut it off.
- **Use MITRE's detection model** — every technique shows its MITRE detection strategy, the analytics per platform, and the data components each analytic needs; mark them collected and watch coverage change.
- **Find blind spots** — techniques in required stages carrying attacker activity with no mitigation and no telemetry.
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

The optimizer is greedy on risk removed per dollar, re-evaluated after every pick, with the standard budgeted-greedy safeguard (compare against the best single affordable item). The objective is not submodular, so the result is a strong heuristic rather than a proven optimum.

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
| `npm test` | Vitest — parser, model, optimizer, URL state, report escaping, golden tests on bundled data |
| `npm run lint` | ESLint (typescript-eslint + React Hooks/Compiler rules) |
| `npm run check` | type check + lint + tests |
| `npm run build` | type check and production build to `dist/` |
| `npm run data` | regenerate `public/data/*.json` from the pinned ATT&CK release |
| `npm run deploy` | build and deploy to Cloudflare Workers |

CI (`.github/workflows/ci.yml`) runs type check, lint, tests and build on every push and pull request. A manual run also verifies `public/data` matches what the parser produces from the pinned release.

## Updating ATT&CK

1. Bump `ATTACK_VERSION` in `src/data/frameworkConfig.ts` (and `metadata.attack_version` in `src/data/coverageKb.ts`).
2. If the release adds tactics, update `TACTICS` / `STIX_TACTIC_MAP` in `src/data/constants.ts` and the gate lists in `src/data/defenseCatalog.ts`.
3. `npm run data` (or `npm run data -- --input <dir>` with local `<domain>-attack.json` files).
4. `npm test` — the golden tests fail if a new mitigation lacks a cost tier, or a new data component isn't assigned to exactly one telemetry source.

If you change the parser's output, bump `PARSER_VERSION` in `src/engine/stixParser.ts`; it is part of every cache key and the bundled files are validated against it.

## Data provenance

- **Techniques, groups, campaigns, software, mitigations, detection strategies, analytics, data components:** MITRE ATT&CK v19.0 STIX bundles (`mitre/cti`, tag `ATT&CK-v19.0`).
- **Telemetry sources:** AttackBreaker's grouping of MITRE data components into purchasable bundles (`src/data/defenseCatalog.ts`).
- **Costs:** placeholder estimates by tier (1 = $15K, 2 = $50K, 3 = $150K, 4 = $400K per year for a mid-size org, scaled by org size). Replace them with quotes before using a plan for decisions.
- **Sector and attribution tags:** keyword rules over MITRE group descriptions (`src/engine/actorTags.ts`); attribution only on strong phrasing.
- **Environment profile tool scores** (`src/data/coverageKb.ts`): author estimates, **not** derived from MITRE ATT&CK Evaluations results (which report per-substep detection categories, not 0–1 scores). There is no derivation pipeline; treat them as illustrative and replace with your own validation data.

## Color encoding

Orange `#d95926` = attacker success / residual risk, blue `#3987e5` = detection coverage, aqua `#199e70` = prevention, with arc length or bar length carrying the value and icons + words carrying state. Both this trio and the three chain-highlight colors were validated (lightness band, chroma, all-pairs CVD separation, contrast) against the app's dark surfaces.

## Project layout

```
scripts/build-attack-data.ts   STIX → compact dataset (build time)
public/data/                   bundled ATT&CK v19 datasets
src/engine/                    pure logic: parser, risk model, optimizer, graph helpers, report
src/data/                      framework config, defense catalog, presets, coverage KB
src/hooks/                     state, persistence, data loading, model wiring, exports
src/components/                React UI (graph, panels, charts)
tests/                         Vitest suites + a hand-built STIX fixture
```

See [CODEBASE_WALKTHROUGH.md](CODEBASE_WALKTHROUGH.md) for the architecture in depth.

## Limitations

ATT&CK records what has been publicly reported, not everything actors can do; MITRE's mitigation mappings don't state how effective a mitigation is for each technique; collecting telemetry only helps if analytics run on it and someone responds. The model makes these gaps explicit as parameters rather than hiding them — use it to rank and compare investments, not as a guarantee.
