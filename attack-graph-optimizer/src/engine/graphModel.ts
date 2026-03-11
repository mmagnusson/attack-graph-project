// ─── Graph Algorithms ─────────────────────────────────────────────────────────

import type {
  Technique,
  Edge,
  AttackChain,
  Tactic,
  FrameworkConfig,
} from '../types';

// ─── Layout Return Type ──────────────────────────────────────────────────────

export interface NodePosition {
  x: number;
  y: number;
}

export interface PhaseCenter {
  x: number;
  label: string;
  color: string;
  tacticId: string;
}

export interface LayoutResult {
  positions: Record<string, NodePosition>;
  viewHeight: number;
  viewWidth: number;
  phaseCenters: PhaseCenter[];
}

// ─── Remediation Return Type ─────────────────────────────────────────────────

export interface RemediationResult {
  selected: string[];
  chainsDisrupted: number;
  chainsTotal: number;
}

// ─── Algorithms ──────────────────────────────────────────────────────────────

/** Betweenness centrality computation (Brandes' algorithm) */
export function computeBetweenness(
  techniques: Technique[],
  edges: Edge[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  techniques.forEach(t => counts[t.id] = 0);

  const adj: Record<string, string[]> = {};
  techniques.forEach(t => adj[t.id] = []);
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });

  const ids = techniques.map(t => t.id);
  for (let s = 0; s < ids.length; s++) {
    const dist: Record<string, number> = {};
    const sigma: Record<string, number> = {};
    const pred: Record<string, string[]> = {};
    ids.forEach(id => { dist[id] = -1; sigma[id] = 0; pred[id] = []; });
    dist[ids[s]] = 0;
    sigma[ids[s]] = 1;
    const queue: string[] = [ids[s]];
    const stack: string[] = [];
    let qi = 0;
    while (qi < queue.length) {
      const v = queue[qi++];
      stack.push(v);
      (adj[v] || []).forEach(w => {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      });
    }
    const delta: Record<string, number> = {};
    ids.forEach(id => delta[id] = 0);
    while (stack.length > 0) {
      const w = stack.pop()!;
      pred[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== ids[s]) counts[w] += delta[w];
    }
  }

  const maxVal = Math.max(...Object.values(counts), 1);
  const result: Record<string, number> = {};
  Object.keys(counts).forEach(k => result[k] = counts[k] / maxVal);
  return result;
}

/** Chain coverage: count how many chains each technique appears in */
export function computeChainCoverage(
  techniques: Technique[],
  chains: AttackChain[],
): Record<string, number> {
  const coverage: Record<string, number> = {};
  techniques.forEach(t => {
    coverage[t.id] = chains.filter(c => c.path.includes(t.id)).length;
  });
  return coverage;
}

/** Greedy set cover algorithm for optimal remediation selection */
export function findOptimalRemediation(
  techniques: Technique[],
  chains: AttackChain[],
  exposures: Record<string, number>,
  budget: number,
  phaseWeighting: boolean,
  fwConfig: FrameworkConfig | null,
): RemediationResult {
  const remaining = new Set<number>(chains.map((_, i) => i));
  const selected: string[] = [];
  const costPerTech = 1;

  for (let step = 0; step < budget && remaining.size > 0; step++) {
    let bestTech: string | null = null;
    let bestScore = -1;

    techniques.forEach(t => {
      if (selected.includes(t.id)) return;
      const exposure = exposures[t.id] ?? 1.0;
      if (exposure < 0.1) return;

      let chainsCovered = 0;
      let severitySum = 0;
      chains.forEach((c, i) => {
        if (remaining.has(i) && c.path.includes(t.id)) {
          chainsCovered++;
          severitySum += c.severity;
        }
      });

      let score = chainsCovered > 0
        ? (chainsCovered * (severitySum / chainsCovered) * exposure) / costPerTech
        : 0;
      // F4: Apply phase weight when enabled
      if (phaseWeighting && score > 0 && fwConfig) {
        const phase = fwConfig.tacticPhase[t.tactic] ?? 99;
        const pw = fwConfig.phaseWeights[phase] ?? 1.0;
        score *= pw;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTech = t.id;
      }
    });

    if (bestTech) {
      selected.push(bestTech);
      chains.forEach((c, i) => {
        if (c.path.includes(bestTech!)) remaining.delete(i);
      });
    }
  }

  return { selected, chainsDisrupted: chains.length - remaining.size, chainsTotal: chains.length };
}

/** Graph layout algorithm: positions nodes in tactic columns */
export function layoutNodes(
  techniques: Technique[],
  tactics: Tactic[],
): LayoutResult {
  // Node max visual radius: base 8 + priority*10 (max 18) + optimal ring 7 = 25
  // Two adjacent max-size nodes need 50 between centers
  // nodeW/nodeH: intra-cluster spacing; tacticGap/phaseGap: inter-cluster spacing
  const nodeW = 52, nodeH = 48, phaseGap = 64, tacticGap = 52, topMargin = 34, marginX = 40;

  // Group techniques by tactic, preserving tactics ordering (which is phase-sorted)
  const tacticOrder = tactics.filter(tac => techniques.some(t => t.tactic === tac.id));
  const byTactic: Record<string, Technique[]> = {};
  tacticOrder.forEach(tac => {
    byTactic[tac.id] = techniques.filter(t => t.tactic === tac.id);
  });

  function colsForCount(n: number): number {
    if (n <= 5) return 1;
    if (n <= 12) return 2;
    if (n <= 20) return 3;
    if (n <= 30) return 4;
    if (n <= 42) return 5;
    if (n <= 56) return 6;
    if (n <= 72) return 7;
    if (n <= 90) return 8;
    if (n <= 110) return 9;
    return 10;
  }

  // Compute cluster dimensions per tactic
  interface ClusterInfo {
    techs: Technique[];
    cols: number;
    rows: number;
    w: number;
    h: number;
    phase: number;
  }

  const clusterInfo: Record<string, ClusterInfo> = {};
  let totalClusterWidth = 0;
  let maxClusterHeight = 0;
  let totalGaps = 0;
  tacticOrder.forEach((tac, ti) => {
    const techs = byTactic[tac.id] || [];
    const n = techs.length;
    const cols = colsForCount(n);
    const rows = Math.ceil(n / cols);
    const w = (cols - 1) * nodeW;
    const h = (rows - 1) * nodeH;
    clusterInfo[tac.id] = { techs, cols, rows, w, h, phase: tac.phase };
    totalClusterWidth += w;
    if (h > maxClusterHeight) maxClusterHeight = h;
    // Count gaps: larger gap between phases, smaller within same phase
    if (ti > 0) {
      const prevPhase = tacticOrder[ti - 1].phase;
      totalGaps += tac.phase !== prevPhase ? phaseGap : tacticGap;
    }
  });

  const totalNeeded = totalClusterWidth + totalGaps + marginX * 2;
  const viewWidth = Math.max(1000, totalNeeded);
  const extraSpace = viewWidth - totalNeeded;
  const gapCount = tacticOrder.length > 1 ? tacticOrder.length - 1 : 1;
  const extraPerGap = extraSpace / gapCount;
  const viewHeight = Math.max(420, maxClusterHeight + topMargin + 60);
  const centerY = topMargin + (viewHeight - topMargin) / 2;

  const positions: Record<string, NodePosition> = {};
  const phaseCenters: PhaseCenter[] = [];
  let curX = marginX;
  tacticOrder.forEach((tac, ti) => {
    const info = clusterInfo[tac.id];
    const cx = curX + info.w / 2;
    phaseCenters.push({ x: cx, label: tac.name, color: tac.color, tacticId: tac.id });
    info.techs.forEach((t, i) => {
      const col = i % info.cols;
      const row = Math.floor(i / info.cols);
      const x = cx + (col - (info.cols - 1) / 2) * nodeW;
      const y = centerY + (row - (info.rows - 1) / 2) * nodeH;
      positions[t.id] = { x, y };
    });
    if (ti < tacticOrder.length - 1) {
      const nextPhase = tacticOrder[ti + 1].phase;
      const gap = tac.phase !== nextPhase ? phaseGap : tacticGap;
      curX += info.w + gap + extraPerGap;
    }
  });

  return { positions, viewHeight, viewWidth, phaseCenters };
}

// ─── CSV Sanitization ─────────────────────────────────────────────────────────

/** Prevent CSV injection by prefixing dangerous characters */
export function sanitizeCSVCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return "'" + value;
  return value;
}
