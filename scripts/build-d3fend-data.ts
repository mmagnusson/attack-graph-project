// ─── build-d3fend-data — MITRE D3FEND countermeasures and ATT&CK mappings ───
//
// Writes public/data/d3fend-<version>.json from three pinned/verified sources:
//   • ontology (JSON-LD) and technique CSV for the pinned D3FEND release
//   • the D3FEND API's inferred ATT&CK → D3FEND mappings, one request per ATT&CK
//     technique in the bundled datasets (cached under .cache/d3fend, rate-limited)
// The API serves the latest release only, so the script refuses to run if the
// API version differs from D3FEND_VERSION.
//
//   npm run data:d3fend
//   npm run data:d3fend -- --offline     # use only cached API responses

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getFrameworkConfig } from '../src/data/frameworkConfig';
import { D3FEND_VERSION, D3FEND_TACTIC_ROLES, D3FEND_SCHEMA_VERSION } from '../src/data/d3fendConfig';
import type { AttackDataset, D3fendBase, D3fendDataset, D3fendLink, D3fendTechnique } from '../src/types';

const BASE = 'https://d3fend.mitre.org';
const CACHE = resolve('.cache/d3fend');
const offline = process.argv.includes('--offline');

/** `missing` is returned (and cached) on HTTP 404 instead of failing */
async function cachedFetch(url: string, file: string, missing?: string): Promise<string> {
  const p = join(CACHE, file);
  if (existsSync(p)) return readFile(p, 'utf8');
  if (offline) throw new Error('Offline and not cached: ' + url);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'AttackBreaker-build/1.0' } });
      if (resp.status === 404 && missing !== undefined) {
        await writeFile(p, missing);
        return missing;
      }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const text = await resp.text();
      if (file.endsWith('.json')) JSON.parse(text); // don't cache a truncated or HTML error body
      await writeFile(p, text);
      await new Promise(r => setTimeout(r, 250));
      return text;
    } catch (err) {
      if (attempt === 3) throw new Error(url + ': ' + (err instanceof Error ? err.message : String(err)));
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}

/** Minimal CSV parser (quoted fields with commas/newlines) */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

type JsonNode = Record<string, unknown> & { '@id': string };
type Binding = Record<string, { value: string } | undefined>;

async function main() {
  await mkdir(CACHE, { recursive: true });
  const version = JSON.parse(await cachedFetch(BASE + '/api/version.json', 'version.json')) as { version: string; release_date: string };
  if (version.version !== D3FEND_VERSION) {
    throw new Error(`D3FEND API serves ${version.version} but D3FEND_VERSION is ${D3FEND_VERSION}. Bump it in src/data/d3fendConfig.ts and clear .cache/d3fend.`);
  }
  console.log(`D3FEND ${version.version} (released ${version.release_date.slice(0, 10)})`);

  // Hierarchy from the CSV: Tactic → base technique → level 0 → level 1
  const csv = parseCsv(await cachedFetch(`${BASE}/ontologies/d3fend/${D3FEND_VERSION}/d3fend.csv`, 'd3fend.csv'));
  const header = csv[0];
  const col = (name: string) => header.indexOf(name);
  const [cId, cTac, cBase, cL0, cL1, cDef] = ['ID', 'D3FEND Tactic', 'D3FEND Technique', 'D3FEND Technique Level 0', 'D3FEND Technique Level 1', 'Definition'].map(col);
  const bases: D3fendBase[] = [];
  const techniques: Record<string, D3fendTechnique> = {};
  let current: D3fendBase | null = null;
  for (const r of csv.slice(1)) {
    const id = r[cId], tactic = r[cTac];
    if (!id || !(tactic in D3FEND_TACTIC_ROLES)) continue;
    const name = r[cBase] || r[cL0] || r[cL1];
    if (r[cBase]) {
      current = { id, name, tactic, definition: r[cDef] ?? '', techniques: [] };
      bases.push(current);
    }
    if (!current) continue;
    current.techniques.push(id);
    techniques[id] = { name, base: current.id, tactic, definition: (r[cDef] ?? '').trim(), iri: '' };
  }

  // Ontology: IRIs, fuller definitions, mitigation crosswalk
  const graph = (JSON.parse(await cachedFetch(`${BASE}/ontologies/d3fend/${D3FEND_VERSION}/d3fend.json`, 'd3fend.json')) as { '@graph': JsonNode[] })['@graph'];
  const idByIri = new Map<string, string>();
  for (const n of graph) {
    const d3 = n['d3f:d3fend-id'];
    if (typeof d3 !== 'string' || !techniques[d3]) continue;
    idByIri.set(n['@id'], d3);
    techniques[d3].iri = n['@id'].replace(/^d3f:/, '');
    const def = n['d3f:definition'];
    if (!techniques[d3].definition && typeof def === 'string') techniques[d3].definition = def;
  }
  for (const b of bases) b.definition = b.definition || techniques[b.id]?.definition || '';
  const asList = (v: unknown): { '@id': string }[] => (Array.isArray(v) ? v : v ? [v] : []) as { '@id': string }[];
  const mitigations: Record<string, string[]> = {};
  for (const n of graph) {
    const types = asList(n['@type'] as unknown).map(t => (typeof t === 'string' ? t : t['@id']));
    if (!types.includes('d3f:ATTACKEnterpriseMitigation')) continue;
    const mid = n['@id'].replace(/^d3f:/, '');
    const rel = asList(n['d3f:related']).map(r => idByIri.get(r['@id'])).filter((x): x is string => !!x);
    if (/^M\d{4}$/.test(mid) && rel.length > 0) mitigations[mid] = [...new Set(rel)].sort();
  }

  // Inferred ATT&CK → D3FEND links for every technique in the bundled datasets
  const attackIds: string[] = [];
  for (const fw of ['enterprise', 'ics'] as const) {
    const cfg = getFrameworkConfig(fw);
    const ds = JSON.parse(await readFile(resolve('public' + cfg.dataUrl), 'utf8')) as AttackDataset;
    attackIds.push(...ds.techniques.map(t => t.id));
  }
  const attack: Record<string, D3fendLink[]> = {};
  let done = 0, unknown = 0;
  const queue = [...attackIds];
  const worker = async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      // D3FEND answers 404 for techniques it has no entry for yet (e.g. newer than its release)
      const text = await cachedFetch(`${BASE}/api/offensive-technique/attack/${t}.json`, 'off-' + t + '.json', '{}');
      if (text === '{}') unknown++;
      const body = JSON.parse(text) as { off_to_def?: { results?: { bindings?: Binding[] } } };
      const seen = new Set<string>();
      const links: D3fendLink[] = [];
      for (const b of body.off_to_def?.results?.bindings ?? []) {
        const d3 = b.def_tech_id?.value;
        if (!d3 || !techniques[d3] || seen.has(d3)) continue;
        seen.add(d3);
        links.push([d3, b.off_artifact_rel_label?.value ?? '', b.off_artifact_label?.value ?? '', b.def_artifact_rel_label?.value ?? '', b.def_artifact_label?.value ?? '']);
      }
      if (links.length > 0) attack[t] = links.sort((a, b) => a[0].localeCompare(b[0]));
      if (++done % 100 === 0) console.log(`  mappings ${done}/${attackIds.length}`);
    }
  };
  await Promise.all([worker(), worker()]);
  if (unknown) console.log(`  ${unknown} techniques not in D3FEND ${version.version} (no mappings; see D3FEND_BORROWED_LINKS for ICS stand-ins)`);

  const dataset: D3fendDataset = {
    schemaVersion: D3FEND_SCHEMA_VERSION,
    version: version.version,
    releaseDate: version.release_date.slice(0, 10),
    tactics: Object.entries(D3FEND_TACTIC_ROLES).map(([name, role]) => ({ name, role })),
    bases,
    techniques,
    attack: Object.fromEntries(Object.entries(attack).sort(([a], [b]) => a.localeCompare(b))),
    mitigations: Object.fromEntries(Object.entries(mitigations).sort(([a], [b]) => a.localeCompare(b))),
  };
  const out = resolve(`public/data/d3fend-${D3FEND_VERSION}.json`);
  const json = JSON.stringify(dataset);
  await writeFile(out, json);
  const linkCount = Object.values(attack).reduce((n, l) => n + l.length, 0);
  console.log(`  ${bases.length} base techniques · ${Object.keys(techniques).length} techniques · ${Object.keys(attack).length}/${attackIds.length} ATT&CK techniques mapped (${linkCount} links) · ${Object.keys(mitigations).length} mitigations crosswalked`);
  console.log(`  wrote ${out} (${(json.length / 1024).toFixed(0)} KB)`);
}

await main();
