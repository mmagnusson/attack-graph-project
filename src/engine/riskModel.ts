// ─── Risk Model — probabilistic AND/OR attack-chain viability ───────────────
//
// An intrusion must pass every *gate* (a required stage such as Initial Access,
// Execution, Command & Control, Objective). At each gate the actor may use ANY
// technique it is known to use there, so a gate is an OR over options and the
// chain is an AND over gates:
//
//   success of technique t   p_t = base_t · Π_{i<k_t} (1 − M·½^i)   (0 if blocked)
//                                  k_t = implemented mitigations mapped to t;
//                                  each extra one on the same technique counts
//                                  half as much (overlapping controls correlate)
//   alert on technique t     q_t = D · (1 − (1 − rules_t)(1 − tools_t))
//   gate pass                S  = 1 − (1 − f) · Π_{t∈gate} (1 − p_t)
//   gate unalerted (blind)   E₀ = 1 − Σ p_t·q_t / (Σ p_t + f)
//   gate unalerted (adapt.)  E₁ = 1 − min_{t∈gate, p_t>0} q_t
//   gate unalerted           E  = (1 − α)·E₀ + α·E₁
//   actor viability          V  = Π S · (1 − ρ · (1 − Π E))
//   residual risk            R  = Σ_actors w · V
//
// M = mitigation effectiveness, D = detection effectiveness (alert chance on a
// fully covered technique), ρ = response effectiveness (chance an alerted
// intrusion is contained in time — applied once per intrusion, so detection
// can never remove more than ρ of an actor's viability), f = substitution
// rate (chance of succeeding with a technique outside the actor's known set),
// α = adversary adaptiveness (how reliably the actor steers toward your least-
// covered option). rules_t is the share of t's detection rules whose components
// are deployed — MITRE analytics fed by data components, or the D3FEND
// detection countermeasures inferred for t (see engine/defenseVocabulary.ts). Prevention needs breadth (one open option keeps a
// gate open); detection gives partial credit for covering the actor's likely
// choices, shrinking as α rises, and is capped by response.
//
// Inheritance: exposure, tool coverage, mitigations, and "blocked" assertions
// on a parent technique apply to its sub-techniques unless overridden.

import type {
  AttackChain,
  DefenseVocabulary,
  AttackDataset,
  DefensePosture,
  GateDef,
  GateResult,
  ModelParams,
  ToolCoverage,
} from '../types';

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  mitigationEffectiveness: 0.5,
  detectionEffectiveness: 0.5,
  responseEffectiveness: 0.6,
  substitutionRate: 0.15,
  adversaryAdaptiveness: 0.5,
};

/** Pessimistic / optimistic parameter sets used to show how sensitive a result is to the assumptions */
export const SENSITIVITY_BOUNDS: { low: ModelParams; high: ModelParams } = {
  low: { mitigationEffectiveness: 0.3, detectionEffectiveness: 0.3, responseEffectiveness: 0.4, substitutionRate: 0.25, adversaryAdaptiveness: 0.8 },
  high: { mitigationEffectiveness: 0.7, detectionEffectiveness: 0.7, responseEffectiveness: 0.8, substitutionRate: 0.05, adversaryAdaptiveness: 0.2 },
};

export interface CompileInputs {
  dataset: AttackDataset;
  /** Defense catalog the posture and optimizer are expressed in */
  vocabulary: DefenseVocabulary;
  /** Actors to model, already filtered by kind/sector; custom chains included */
  chains: AttackChain[];
  gates: GateDef[];
  includeSoftware: boolean;
  /** Restrict detection analytics to these platforms (null = all) */
  platforms: ReadonlySet<string> | null;
  /** Base exposure per technique (parent values inherited by sub-techniques); default 1 */
  exposure?: Record<string, number>;
  /** Estimated tool coverage from the environment profile (parent values inherited) */
  toolCoverage?: Record<string, ToolCoverage>;
  /** chainId → weight (default 1) */
  actorWeights?: Record<string, number>;
}

interface CompiledGate {
  gate: GateDef;
  options: Int32Array;
}

export interface CompiledActor {
  chain: AttackChain;
  weight: number;
  gates: CompiledGate[];
  /** One group per tactic the actor uses — drives the activity (flow) measure */
  activity: Int32Array[];
  software: ReadonlySet<number>;
}

export interface CompiledModel {
  techIds: string[];
  techIndex: Map<string, number>;
  parentIndex: Int32Array;
  /** base exposure × (1 − estimated tool prevention) */
  basePrevent: Float64Array;
  toolDetect: Float64Array;
  preventionIds: string[];
  preventionIndex: Map<string, number>;
  /** prevention → technique indices it applies to (explicit mappings + inherited sub-techniques) */
  preventionTechs: Int32Array[];
  componentIds: string[];
  componentIndex: Map<string, number>;
  /** technique → detection rules (each a list of component indices); platform-filtered, empty rules dropped */
  techRules: Int32Array[][];
  /** component → techniques with a rule that uses it */
  componentTechs: Int32Array[];
  actors: CompiledActor[];
  /** technique → actors whose gates or activity include it */
  techActors: Int32Array[];
  totalWeight: number;
}

export interface ModelState {
  /** Implemented preventions applying to each technique */
  preventCount: Int32Array;
  blocked: Uint8Array;
  /** Deployed detection components */
  collected: Uint8Array;
  /** Share of each technique's detection rules satisfied by deployed components */
  ruleCoverage: Float64Array;
  p: Float64Array;
  q: Float64Array;
  viability: Float64Array;
  risk: number;
}

// ─── Compile ──────────────────────────────────────────────────────────────────

export function compileModel(inputs: CompileInputs): CompiledModel {
  const { dataset, vocabulary, chains, gates, includeSoftware, platforms } = inputs;
  const techIds = dataset.techniques.map(t => t.id);
  const techIndex = new Map(techIds.map((id, i) => [id, i]));
  const n = techIds.length;

  const parentIndex = new Int32Array(n).fill(-1);
  dataset.techniques.forEach((t, i) => {
    if (t.parentId && techIndex.has(t.parentId)) parentIndex[i] = techIndex.get(t.parentId)!;
  });

  const inherit = <T,>(rec: Record<string, T> | undefined, i: number): T | undefined => {
    if (!rec) return undefined;
    const own = rec[techIds[i]];
    if (own !== undefined) return own;
    const p = parentIndex[i];
    return p >= 0 ? rec[techIds[p]] : undefined;
  };

  const basePrevent = new Float64Array(n);
  const toolDetect = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const exp = clamp01(inherit(inputs.exposure, i) ?? 1);
    const tool = inherit(inputs.toolCoverage, i);
    basePrevent[i] = exp * (1 - clamp01(tool?.prevent ?? 0));
    toolDetect[i] = clamp01(tool?.detect ?? 0);
  }

  // Preventions (parent mapping applies to sub-techniques)
  const children: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) if (parentIndex[i] >= 0) children[parentIndex[i]].push(i);
  // Non-deployable catalog entries ("Do Not Mitigate", "Pre-compromise") never change outcomes
  const deployable = vocabulary.preventions.filter(m => m.actionable);
  const preventionIds = deployable.map(m => m.id);
  const preventionIndex = new Map(preventionIds.map((id, i) => [id, i]));
  const preventionTechs = deployable.map(m => {
    const s = new Set<number>();
    for (const tid of m.techniques) {
      const i = techIndex.get(tid);
      if (i === undefined) continue;
      s.add(i);
      for (const c of children[i]) s.add(c);
    }
    return Int32Array.from([...s].sort((a, b) => a - b));
  });

  // Detection rules → components
  const componentIds = vocabulary.components.map(d => d.id);
  const componentIndex = new Map(componentIds.map((id, i) => [id, i]));
  const componentTechSets: Set<number>[] = componentIds.map(() => new Set());
  const techRules: Int32Array[][] = techIds.map((tid, i) => {
    const out: Int32Array[] = [];
    for (const r of vocabulary.rules[tid] ?? []) {
      if (platforms && platforms.size > 0 && r.platforms.length > 0 && !r.platforms.some(p => platforms.has(p))) continue;
      const comps = r.components.map(d => componentIndex.get(d)).filter((d): d is number => d !== undefined);
      if (comps.length === 0) continue;
      comps.forEach(d => componentTechSets[d].add(i));
      out.push(Int32Array.from(comps));
    }
    return out;
  });
  const componentTechs = componentTechSets.map(s => Int32Array.from(s));

  // Actors
  const techActorSets: Set<number>[] = techIds.map(() => new Set());
  const tacticsOf = dataset.techniques.map(t => t.tactics);
  const actors: CompiledActor[] = [];
  let totalWeight = 0;
  for (const chain of chains) {
    const weight = Math.max(0, inputs.actorWeights?.[chain.id] ?? 1);
    if (weight === 0) continue;
    const viaSw = new Set(chain.viaSoftware);
    const opts: number[] = [];
    const software = new Set<number>();
    for (const tid of chain.path) {
      if (!includeSoftware && viaSw.has(tid)) continue;
      const i = techIndex.get(tid);
      if (i === undefined) continue;
      opts.push(i);
      if (viaSw.has(tid)) software.add(i);
    }
    const ai = actors.length;
    const compiledGates: CompiledGate[] = [];
    for (const gate of gates) {
      const g = opts.filter(i => tacticsOf[i].some(t => gate.tactics.includes(t)));
      if (g.length > 0) compiledGates.push({ gate, options: Int32Array.from(g) });
    }
    const byTactic = new Map<string, number[]>();
    for (const i of opts) for (const t of tacticsOf[i]) {
      let arr = byTactic.get(t);
      if (!arr) byTactic.set(t, arr = []);
      arr.push(i);
    }
    const activity = [...byTactic.values()].map(a => Int32Array.from(a));
    for (const i of opts) techActorSets[i].add(ai);
    actors.push({ chain, weight, gates: compiledGates, activity, software });
    totalWeight += weight;
  }

  return {
    techIds, techIndex, parentIndex, basePrevent, toolDetect,
    preventionIds, preventionIndex, preventionTechs,
    componentIds, componentIndex, techRules, componentTechs,
    actors,
    techActors: techActorSets.map(s => Int32Array.from(s)),
    totalWeight,
  };
}

// ─── Evaluate ─────────────────────────────────────────────────────────────────

export function evaluateModel(model: CompiledModel, params: ModelParams, posture: DefensePosture): ModelState {
  const n = model.techIds.length;
  const preventCount = new Int32Array(n);
  for (const mid of posture.prevent) {
    const m = model.preventionIndex.get(mid);
    if (m === undefined) continue;
    for (const t of model.preventionTechs[m]) preventCount[t]++;
  }
  const blocked = new Uint8Array(n);
  for (const tid of posture.blocked) {
    const i = model.techIndex.get(tid);
    if (i !== undefined) blocked[i] = 1;
  }
  for (let i = 0; i < n; i++) if (model.parentIndex[i] >= 0 && blocked[model.parentIndex[i]]) blocked[i] = 1;

  const collected = new Uint8Array(model.componentIds.length);
  for (const dc of posture.detect) {
    const d = model.componentIndex.get(dc);
    if (d !== undefined) collected[d] = 1;
  }
  const ruleCoverage = new Float64Array(n);
  for (let i = 0; i < n; i++) ruleCoverage[i] = rulesCovered(model.techRules[i], collected);

  const p = new Float64Array(n);
  const q = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    p[i] = success(model, params, i, preventCount[i], blocked[i]);
    q[i] = stopChance(params, ruleCoverage[i], model.toolDetect[i]);
  }

  const viability = new Float64Array(model.actors.length);
  let risk = 0;
  model.actors.forEach((a, ai) => {
    viability[ai] = actorViability(a, p, q, params);
    risk += a.weight * viability[ai];
  });
  return { preventCount, blocked, collected, ruleCoverage, p, q, viability, risk };
}

function success(model: CompiledModel, params: ModelParams, i: number, k: number, blocked: number): number {
  if (blocked) return 0;
  return model.basePrevent[i] * stackedMitigation(params.mitigationEffectiveness, k);
}

/** Remaining success after k overlapping mitigations: Π_{i<k} (1 − M·½^i) — diminishing returns */
export function stackedMitigation(m: number, k: number): number {
  let f = 1, step = m;
  for (let i = 0; i < k; i++) { f *= 1 - step; step /= 2; }
  return f;
}

function stopChance(params: ModelParams, coverage: number, tool: number): number {
  return params.detectionEffectiveness * (1 - (1 - coverage) * (1 - tool));
}

/** Share of a technique's detection rules whose components are deployed (partial credit per rule) */
export function rulesCovered(rules: Int32Array[], collected: Uint8Array): number {
  if (rules.length === 0) return 0;
  let sum = 0;
  for (const a of rules) {
    let have = 0;
    for (const d of a) if (collected[d]) have++;
    sum += have / a.length;
  }
  return sum / rules.length;
}

export function gateValue(
  options: Int32Array, p: Float64Array, q: Float64Array, f: number, adaptiveness: number,
): { pass: number; evade: number; value: number } {
  let miss = 1 - f;
  let sumP = f;
  let sumPQ = 0;
  let minQ = Infinity;
  for (const t of options) {
    miss *= 1 - p[t];
    sumP += p[t];
    sumPQ += p[t] * q[t];
    if (p[t] > 0 && q[t] < minQ) minQ = q[t];
  }
  const pass = 1 - miss;
  const blind = sumP > 0 ? 1 - sumPQ / sumP : 1;
  const adaptive = minQ === Infinity ? 1 : 1 - minQ;
  const evade = (1 - adaptiveness) * blind + adaptiveness * adaptive;
  return { pass, evade, value: pass * evade };
}

function actorViability(actor: CompiledActor, p: Float64Array, q: Float64Array, params: ModelParams): number {
  let pass = 1;
  let unalerted = 1;
  for (const g of actor.gates) {
    const v = gateValue(g.options, p, q, params.substitutionRate, params.adversaryAdaptiveness);
    pass *= v.pass;
    unalerted *= v.evade;
  }
  return pass * (1 - params.responseEffectiveness * (1 - unalerted));
}

/** Chain-level split of an actor's viability: passing every stage vs. not being contained */
export function viabilityParts(model: CompiledModel, params: ModelParams, state: ModelState, actorIndex: number): { pass: number; alerted: number; contained: number } {
  const actor = model.actors[actorIndex];
  let pass = 1, unalerted = 1;
  for (const g of actor?.gates ?? []) {
    const v = gateValue(g.options, state.p, state.q, params.substitutionRate, params.adversaryAdaptiveness);
    pass *= v.pass;
    unalerted *= v.evade;
  }
  return { pass, alerted: 1 - unalerted, contained: params.responseEffectiveness * (1 - unalerted) };
}

// ─── What-if: adding defenses ────────────────────────────────────────────────

export interface Addition {
  prevent?: readonly string[];
  detect?: readonly string[];
  blocked?: readonly string[];
}

/** Residual risk if `add` were deployed on top of `state` (state is not modified) */
export function simulateAddition(model: CompiledModel, params: ModelParams, state: ModelState, add: Addition): number {
  const touched = applyToScratch(model, params, state, add);
  if (!touched) return state.risk;
  const { p, q, techs } = touched;
  const actorSet = new Set<number>();
  for (const t of techs) for (const a of model.techActors[t]) actorSet.add(a);
  let risk = state.risk;
  for (const ai of actorSet) {
    const actor = model.actors[ai];
    risk += actor.weight * (actorViability(actor, p, q, params) - state.viability[ai]);
  }
  return Math.max(0, risk);
}

/** New state with `add` applied (used by the optimizer to advance) */
export function applyAddition(model: CompiledModel, params: ModelParams, state: ModelState, add: Addition): ModelState {
  const touched = applyToScratch(model, params, state, add);
  if (!touched) return state;
  const { p, q, techs, preventCount, blocked, collected, ruleCoverage } = touched;
  const viability = state.viability.slice();
  const actorSet = new Set<number>();
  for (const t of techs) for (const a of model.techActors[t]) actorSet.add(a);
  let risk = state.risk;
  for (const ai of actorSet) {
    const actor = model.actors[ai];
    const v = actorViability(actor, p, q, params);
    risk += actor.weight * (v - viability[ai]);
    viability[ai] = v;
  }
  return { preventCount, blocked, collected, ruleCoverage, p, q, viability, risk: Math.max(0, risk) };
}

function applyToScratch(model: CompiledModel, params: ModelParams, state: ModelState, add: Addition) {
  const techs = new Set<number>();
  const preventCount = state.preventCount.slice();
  const blocked = state.blocked.slice();
  const collected = state.collected.slice();
  const ruleCoverage = state.ruleCoverage.slice();

  for (const mid of add.prevent || []) {
    const m = model.preventionIndex.get(mid);
    if (m === undefined) continue;
    for (const t of model.preventionTechs[m]) { preventCount[t]++; techs.add(t); }
  }
  for (const tid of add.blocked || []) {
    const i = model.techIndex.get(tid);
    if (i === undefined) continue;
    blocked[i] = 1; techs.add(i);
    for (let c = 0; c < model.parentIndex.length; c++) {
      if (model.parentIndex[c] === i) { blocked[c] = 1; techs.add(c); }
    }
  }
  const detTechs = new Set<number>();
  for (const dc of add.detect || []) {
    const d = model.componentIndex.get(dc);
    if (d === undefined || collected[d]) continue;
    collected[d] = 1;
    for (const t of model.componentTechs[d]) detTechs.add(t);
  }
  for (const t of detTechs) { ruleCoverage[t] = rulesCovered(model.techRules[t], collected); techs.add(t); }
  if (techs.size === 0) return null;

  const p = state.p.slice();
  const q = state.q.slice();
  for (const t of techs) {
    p[t] = success(model, params, t, preventCount[t], blocked[t]);
    q[t] = stopChance(params, ruleCoverage[t], model.toolDetect[t]);
  }
  return { p, q, techs, preventCount, blocked, collected, ruleCoverage };
}

// ─── Read-outs for the UI ─────────────────────────────────────────────────────

/** The AND/OR breakdown for one actor: each gate's pass/evade and its options */
export function actorBreakdown(model: CompiledModel, params: ModelParams, state: ModelState, actorIndex: number): GateResult[] {
  const actor = model.actors[actorIndex];
  if (!actor) return [];
  return actor.gates.map(g => {
    const v = gateValue(g.options, state.p, state.q, params.substitutionRate, params.adversaryAdaptiveness);
    return {
      gateId: g.gate.id,
      label: g.gate.label,
      ...v,
      options: [...g.options]
        .map(t => ({
          techniqueId: model.techIds[t],
          success: state.p[t],
          detection: 1 - (1 - state.ruleCoverage[t]) * (1 - model.toolDetect[t]),
          viaSoftware: actor.software.has(t),
        }))
        .sort((a, b) => b.success - a.success || a.techniqueId.localeCompare(b.techniqueId)),
    };
  });
}

/**
 * Expected share of residual attacker activity per technique: each actor
 * contributes w·V, split evenly across the tactics it uses and, within a
 * tactic, in proportion to each option's success chance. Blocking a
 * technique shifts its share to the actor's alternatives.
 */
export function techniqueActivity(model: CompiledModel, params: ModelParams, state: ModelState): Float64Array {
  const out = new Float64Array(model.techIds.length);
  const f = params.substitutionRate;
  model.actors.forEach((a, ai) => {
    const mass = a.weight * state.viability[ai];
    if (mass <= 0 || a.activity.length === 0) return;
    const perGroup = mass / a.activity.length;
    for (const group of a.activity) {
      let sumP = f;
      for (const t of group) sumP += state.p[t];
      if (sumP <= 0) continue;
      for (const t of group) out[t] += perGroup * state.p[t] / sumP;
    }
  });
  return out;
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
