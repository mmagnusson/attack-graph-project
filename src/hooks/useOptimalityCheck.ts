// ─── useOptimalityCheck — exact search against the current plan, in a worker ─
// A result belongs to the plan object it was run for; once the plan changes
// (posture, costs, budget, parameters) the result is dropped and any running
// search is stopped.

import { useEffect, useRef, useState } from 'react';
import type { CatalogItem, PlanResult } from '../types';
import type { CheckProgress, OptimalityCheck } from '../engine/exactSearch';
import type { OptimalityMessage, OptimalityRequest } from '../workers/optimality.worker';
import type { RiskModelView } from './useRiskModel';

export type OptimalityState =
  | { status: 'running'; plan: PlanResult; progress: CheckProgress | null }
  | { status: 'done'; plan: PlanResult; result: OptimalityCheck }
  | { status: 'error'; plan: PlanResult; message: string };

export const OPTIMALITY_DEADLINE_MS = 30_000;

export function useOptimalityCheck(rm: RiskModelView) {
  const [state, setState] = useState<OptimalityState | null>(null);
  const worker = useRef<{ w: Worker; plan: PlanResult } | null>(null);
  const { plan } = rm;

  useEffect(() => {
    if (worker.current && worker.current.plan !== plan) { worker.current.w.terminate(); worker.current = null; }
  }, [plan]);
  useEffect(() => () => worker.current?.w.terminate(), []);

  const stop = () => {
    worker.current?.w.terminate();
    worker.current = null;
    setState(null);
  };

  const run = () => {
    const { model, catalog, marginal, params, posture, budget } = rm;
    if (!model || !plan) return;
    worker.current?.w.terminate();
    const w = new Worker(new URL('../workers/optimality.worker.ts', import.meta.url), { type: 'module' });
    worker.current = { w, plan };
    const byId = new Map(catalog.map(c => [c.id, c]));
    const finish = (next: OptimalityState) => {
      w.terminate();
      if (worker.current?.w === w) worker.current = null;
      setState(next);
    };
    w.onmessage = (e: MessageEvent<OptimalityMessage>) => {
      const m = e.data;
      if (m.type === 'progress') setState(s => (s?.status === 'running' && s.plan === plan ? { ...s, progress: m.progress } : s));
      else if (m.type === 'done') {
        const { itemIds, ...rest } = m.result;
        const items = itemIds.map(id => byId.get(id)).filter((c): c is CatalogItem => c !== undefined);
        finish({ status: 'done', plan, result: { ...rest, items } });
      } else finish({ status: 'error', plan, message: m.message });
    };
    w.onerror = e => finish({ status: 'error', plan, message: e.message || 'The search worker failed to start' });
    const req: OptimalityRequest = {
      model, params, posture, catalog, marginal, budget, planIds: plan.steps.map(s => s.item.id), deadlineMs: OPTIMALITY_DEADLINE_MS,
    };
    w.postMessage(req);
    setState({ status: 'running', plan, progress: null });
  };

  return { state: state && state.plan === plan ? state : null, run, stop };
}

export type OptimalityView = ReturnType<typeof useOptimalityCheck>;
