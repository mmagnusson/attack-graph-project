// ─── build-attack-data — preprocess pinned ATT&CK STIX bundles ──────────────
//
// Downloads (or reads) the pinned MITRE ATT&CK STIX bundles, parses them with
// the same parser the app uses for uploads, and writes compact datasets to
// public/data/<domain>-attack-<version>.json for same-origin loading.
//
//   npm run data                       # fetch both domains from MITRE's GitHub
//   npm run data -- --framework ics    # one domain
//   npm run data -- --input ./stix     # use local <domain>-attack.json files

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getFrameworkConfig, ATTACK_VERSION } from '../src/data/frameworkConfig';
import { parseStixBundle, type StixBundle } from '../src/engine/stixParser';
import type { FrameworkId } from '../src/types';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function loadBundle(fw: FrameworkId, url: string, inputDir?: string): Promise<StixBundle> {
  const domain = fw === 'ics' ? 'ics-attack' : 'enterprise-attack';
  if (inputDir) {
    const p = join(resolve(inputDir), domain + '.json');
    if (!existsSync(p)) throw new Error('Missing ' + p);
    console.log('  reading ' + p);
    return JSON.parse(await readFile(p, 'utf8')) as StixBundle;
  }
  console.log('  fetching ' + url);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' for ' + url);
  return (await resp.json()) as StixBundle;
}

async function build(fw: FrameworkId, inputDir?: string) {
  const cfg = getFrameworkConfig(fw);
  console.log(`[${fw}] ATT&CK v${ATTACK_VERSION}`);
  const bundle = await loadBundle(fw, cfg.stixUrl, inputDir);
  const dataset = parseStixBundle(bundle, cfg, `MITRE ATT&CK ${cfg.label} v${ATTACK_VERSION}`);
  const out = resolve('public' + cfg.dataUrl);
  await mkdir(resolve('public/data'), { recursive: true });
  const json = JSON.stringify(dataset);
  await writeFile(out, json);

  const analytics = Object.values(dataset.detections).reduce((n, s) => n + s.analytics.length, 0);
  console.log(`  techniques ${dataset.techniques.length} · actors ${dataset.chains.filter(c => c.kind === 'group').length} groups + ${dataset.chains.filter(c => c.kind === 'campaign').length} campaigns`);
  console.log(`  mitigations ${dataset.mitigations.length} (${dataset.mitigations.filter(m => m.actionable).length} actionable) · detection strategies ${Object.keys(dataset.detections).length} · analytics ${analytics} · data components ${dataset.dataComponents.length}`);
  console.log(`  wrote ${out} (${(json.length / 1024 / 1024).toFixed(2)} MB)`);
}

const only = arg('framework') as FrameworkId | undefined;
const input = arg('input');
for (const fw of (only ? [only] : ['enterprise', 'ics']) as FrameworkId[]) {
  await build(fw, input);
}
