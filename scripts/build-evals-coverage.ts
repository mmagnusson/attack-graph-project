// ─── build-evals-coverage — measured detection from MITRE ATT&CK Evaluations ─
//
// Writes public/data/evals-coverage.json: for every vendor whose latest
// Enterprise evaluation is from EVALS_MIN_YEAR on, per-technique detection rates
// scored as described in src/engine/evalsCoverage.ts. Technique IDs revoked
// since the round ran are remapped using the pinned ATT&CK release's revoked-by
// relationships. Responses are cached under .cache/evals; requests are spaced out.
//
//   npm run data:evals
//   npm run data:evals -- --offline              # use only cached responses
//   npm run data:evals -- --stix <dir>           # read enterprise-attack.json from <dir>
//
// Terms of use: publications built on this data must say it comes from MITRE
// ATT&CK Evaluations (the app shows EVALS_NOTICE wherever measured data is used).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  EVALS_DETECTED_TYPES, EVALS_MIN_YEAR, EVALS_NOTICE, EVALS_SCHEMA_VERSION, EVALS_SHRINKAGE, EVALS_SITE, EVALS_TO_KB,
} from '../src/data/evalsConfig';
import { scoreEvalsRound, type RawRound } from '../src/engine/evalsCoverage';
import { ATTACK_VERSION, getFrameworkConfig } from '../src/data/frameworkConfig';
import type { StixBundle } from '../src/engine/stixParser';
import type { AttackDataset, EvalsCoverage, EvalsVendor } from '../src/types';

const CACHE = resolve('.cache/evals');
const OUT = resolve('public/data/evals-coverage.json');
const offline = process.argv.includes('--offline');
const stixDir = process.argv.includes('--stix') ? process.argv[process.argv.indexOf('--stix') + 1] : undefined;

async function cachedJson<T>(url: string, file: string): Promise<T> {
  const p = join(CACHE, file);
  if (existsSync(p)) return JSON.parse(await readFile(p, 'utf8')) as T;
  if (offline) throw new Error('Offline and not cached: ' + url);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'AttackBreaker-build/1.0', Accept: 'application/json' } });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const text = await resp.text();
      const data = JSON.parse(text) as T; // don't cache an HTML error page
      await writeFile(p, text);
      await new Promise(r => setTimeout(r, 1000));
      return data;
    } catch (err) {
      if (attempt === 3) throw new Error(url + ': ' + (err instanceof Error ? err.message : String(err)));
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}

/** Revoked technique ID → current ID, following revoked-by chains */
async function revocations(): Promise<Map<string, string>> {
  const cfg = getFrameworkConfig('enterprise');
  const bundle = stixDir
    ? JSON.parse(await readFile(join(resolve(stixDir), 'enterprise-attack.json'), 'utf8')) as StixBundle
    : await cachedJson<StixBundle>(cfg.stixUrl, 'enterprise-attack-' + ATTACK_VERSION + '.json');
  const objs = bundle.objects as { id: string; type: string; relationship_type?: string; source_ref?: string; target_ref?: string; external_references?: { source_name?: string; external_id?: string }[] }[];
  const extId = new Map<string, string>();
  for (const o of objs) {
    const ref = o.type === 'attack-pattern' ? o.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id : undefined;
    if (ref) extId.set(o.id, ref);
  }
  const next = new Map<string, string>();
  for (const r of objs) {
    if (r.type !== 'relationship' || r.relationship_type !== 'revoked-by') continue;
    const from = extId.get(r.source_ref!), to = extId.get(r.target_ref!);
    if (from && to && from !== to) next.set(from, to);
  }
  const resolved = new Map<string, string>();
  for (const id of next.keys()) {
    let cur = id;
    for (let hops = 0; next.has(cur) && hops < 10; hops++) cur = next.get(cur)!;
    resolved.set(id, cur);
  }
  return resolved;
}

interface Adversary {
  name: string; display_name: string; eval_round: number; start_year: number; status: string; domain: string;
  participants: { participant: { name: string; display_name: string } }[];
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  const revoked = await revocations();
  const dataset = JSON.parse(await readFile(resolve('public' + getFrameworkConfig('enterprise').dataUrl), 'utf8')) as AttackDataset;
  const known = new Set(dataset.techniques.map(t => t.id));
  const remapped = new Map<string, string>(), unknown = new Set<string>();
  const remap = (id: string) => {
    const to = revoked.get(id);
    if (to) remapped.set(id, to);
    else if (!known.has(id)) unknown.add(id);
    return to ?? id;
  };
  const adversaries = await cachedJson<Adversary[]>(EVALS_SITE + '/api/adversaries/', 'adversaries.json');
  const rounds = adversaries
    .filter(a => a.domain === 'ENTERPRISE' && a.status === 'PUBLISHED')
    .sort((a, b) => b.eval_round - a.eval_round);

  // Each vendor's latest Enterprise round
  const latest = new Map<string, { round: Adversary; name: string }>();
  for (const r of rounds) for (const { participant: p } of r.participants) {
    if (!latest.has(p.name) && !p.name.startsWith('baseline')) latest.set(p.name, { round: r, name: p.display_name });
  }

  const vendors: Record<string, EvalsVendor> = {};
  const skipped: string[] = [];
  for (const [participant, { round, name }] of [...latest].sort(([a], [b]) => a.localeCompare(b))) {
    if (round.start_year < EVALS_MIN_YEAR) { skipped.push(participant + ' (' + round.name + ')'); continue; }
    const url = EVALS_SITE + '/api/results/?participant=' + encodeURIComponent(participant) + '&adversary=' + encodeURIComponent(round.name);
    const body = await cachedJson<{ adversaries?: RawRound[] }[]>(url, 'results-' + participant + '-' + round.name + '.json');
    const raw = body[0]?.adversaries?.find(a => a.Adversary_Name === round.name);
    const v = raw && scoreEvalsRound(participant, name, raw, { detectedTypes: EVALS_DETECTED_TYPES, shrinkage: EVALS_SHRINKAGE, remap });
    if (!v) { skipped.push(participant + ' (no scored substeps in ' + round.name + ')'); continue; }
    vendors[participant] = v;
    console.log(participant.padEnd(18), round.name.padEnd(8), String(v.substeps).padStart(4), 'substeps',
      String(Object.keys(v.techniques).length).padStart(4), 'techniques', EVALS_TO_KB[participant] ? '→ ' + EVALS_TO_KB[participant] : '(new)');
  }
  if (skipped.length) console.log('Skipped (older than ' + EVALS_MIN_YEAR + ' or empty):', skipped.join(', '));
  if (remapped.size) console.log('Remapped revoked techniques:', [...remapped].map(([a, b]) => a + '→' + b).join(', '));
  if (unknown.size) console.log('Not in ATT&CK v' + ATTACK_VERSION + ' (kept, unused by the model):', [...unknown].join(', '));

  const out: EvalsCoverage = {
    schemaVersion: EVALS_SCHEMA_VERSION,
    generated: new Date().toISOString().slice(0, 10),
    notice: EVALS_NOTICE,
    method: { detectedTypes: EVALS_DETECTED_TYPES, run: 'Initial Run', shrinkage: EVALS_SHRINKAGE, minYear: EVALS_MIN_YEAR },
    vendors,
  };
  await writeFile(OUT, JSON.stringify(out));
  console.log('Wrote', OUT, Object.keys(vendors).length, 'vendors');
}

main().catch(err => { console.error(err); process.exit(1); });
