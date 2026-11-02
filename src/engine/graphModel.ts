// ─── Graph Layout & Display Edges ────────────────────────────────────────────

import type { AttackChain, Edge, Tactic, Technique } from '../types';

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

// ─── Roll-up ─────────────────────────────────────────────────────────────────

/** The displayed node a technique maps to: itself, its parent when sub-techniques are hidden, or null */
export function rollupId(techId: string, display: ReadonlySet<string>): string | null {
  if (display.has(techId)) return techId;
  const dot = techId.indexOf('.');
  if (dot > 0) {
    const parent = techId.slice(0, dot);
    if (display.has(parent)) return parent;
  }
  return null;
}

/** A chain's technique IDs projected onto the displayed nodes, grouped by phase (ascending) */
export function chainByPhase(chain: AttackChain, display: ReadonlySet<string>, techPhase: Record<string, number>): string[][] {
  const groups = new Map<number, string[]>();
  const seen = new Set<string>();
  for (const tid of chain.path) {
    const id = rollupId(tid, display);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const ph = techPhase[id] ?? 99;
    let g = groups.get(ph);
    if (!g) groups.set(ph, g = []);
    g.push(id);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, g]) => g);
}

// ─── Edges ───────────────────────────────────────────────────────────────────

/**
 * Background edges: technique pairs in *adjacent* phases of the same actor's
 * known set, weighted by how many actors share the pair. ATT&CK does not record
 * step order, so an edge means "commonly used together in consecutive stages",
 * never "A leads to B". Only the strongest `maxEdges` are kept.
 */
export function buildCooccurrenceEdges(
  chains: AttackChain[], display: ReadonlySet<string>, techPhase: Record<string, number>, maxEdges = 300,
): Edge[] {
  const counts = new Map<string, number>();
  for (const chain of chains) {
    const groups = chainByPhase(chain, display, techPhase);
    for (let g = 0; g < groups.length - 1; g++) {
      for (const a of groups[g]) for (const b of groups[g + 1]) {
        const k = a + '>' + b;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))
    .slice(0, maxEdges)
    .map(([k, w]) => {
      const [from, to] = k.split('>');
      return { from, to, weight: w };
    });
}

/**
 * Edges for a highlighted chain: from the actor's most-used technique in each
 * phase to every option it has in the next phase — a fan that shows the
 * alternatives the actor can switch between at each step.
 */
export function chainFanEdges(
  chain: AttackChain, display: ReadonlySet<string>, techPhase: Record<string, number>, score: (id: string) => number,
): Edge[] {
  const groups = chainByPhase(chain, display, techPhase);
  const edges: Edge[] = [];
  for (let g = 0; g < groups.length - 1; g++) {
    const hub = groups[g].reduce((best, id) => (score(id) > score(best) ? id : best), groups[g][0]);
    for (const b of groups[g + 1]) edges.push({ from: hub, to: b });
  }
  return edges;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/** Graph layout algorithm: positions nodes in tactic columns */
export function layoutNodes(
  techniques: Technique[],
  tactics: Tactic[],
): LayoutResult {
  // Node max visual radius: base 8 + activity*12 + detection ring 7 ≈ 27
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
