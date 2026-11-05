// ─── useEvalsCoverage — measured detection from MITRE ATT&CK Evaluations ────
// Optional data: when public/data/evals-coverage.json isn't deployed the app
// keeps the estimated coverage KB and says nothing.

import { useEffect, useState } from 'react';
import type { EvalsCoverage } from '../types';
import { EVALS_COVERAGE_URL, EVALS_SCHEMA_VERSION } from '../data/evalsConfig';

export function useEvalsCoverage(): EvalsCoverage | null {
  const [data, setData] = useState<EvalsCoverage | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(EVALS_COVERAGE_URL, { signal: controller.signal })
      .then(r => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() as Promise<EvalsCoverage> : null))
      .then(d => { if (d?.schemaVersion === EVALS_SCHEMA_VERSION) setData(d); })
      .catch(() => { /* absent or unreadable: keep the estimates */ });
    return () => controller.abort();
  }, []);
  return data;
}
