// ─── useD3fendData — the bundled D3FEND dataset (shared by both frameworks) ──

import { useEffect, useState } from 'react';
import type { D3fendDataset } from '../types';
import { D3FEND_DATA_URL, D3FEND_SCHEMA_VERSION } from '../data/d3fendConfig';

export function useD3fendData() {
  const [data, setData] = useState<D3fendDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(D3FEND_DATA_URL, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() as Promise<D3fendDataset>; })
      .then(d => {
        if (d.schemaVersion !== D3FEND_SCHEMA_VERSION) throw new Error('Bundled D3FEND data is out of date — run `npm run data:d3fend`');
        setData(d);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
  }, []);
  return { d3fend: data, d3fendError: error };
}
