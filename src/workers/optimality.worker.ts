// ─── Optimality check worker — runs checkOptimality off the main thread ─────

import { checkOptimality, type CheckProgress, type OptimalityCheck } from '../engine/exactSearch';
import type { CompiledModel } from '../engine/riskModel';
import type { CatalogItem, DefensePosture, ModelParams } from '../types';

export interface OptimalityRequest {
  model: CompiledModel;
  params: ModelParams;
  posture: DefensePosture;
  catalog: CatalogItem[];
  planIds: string[];
  marginal: Map<string, number>;
  budget: number;
  deadlineMs: number;
}

export type OptimalityMessage =
  | { type: 'progress'; progress: CheckProgress }
  | { type: 'done'; result: Omit<OptimalityCheck, 'items'> & { itemIds: string[] } }
  | { type: 'error'; message: string };

const post = (m: OptimalityMessage) => postMessage(m);

onmessage = (e: MessageEvent<OptimalityRequest>) => {
  const { model, params, posture, catalog, planIds, marginal, budget, deadlineMs } = e.data;
  try {
    const byId = new Map(catalog.map(c => [c.id, c]));
    const planItems = planIds.map(id => byId.get(id)).filter((c): c is CatalogItem => c !== undefined);
    let lastPost = 0;
    const { items, ...rest } = checkOptimality(model, params, posture, catalog, planItems, marginal, budget, {
      deadlineMs,
      onProgress: progress => {
        const t = Date.now();
        if (t - lastPost < 200) return;
        lastPost = t;
        post({ type: 'progress', progress });
      },
    });
    post({ type: 'done', result: { ...rest, itemIds: items.map(c => c.id) } });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
