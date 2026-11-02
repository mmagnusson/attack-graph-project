// ─── Board Report — standalone, printable HTML summary of the plan ──────────
// Pure string generation (no DOM) so it is testable and works offline. Every
// interpolated value goes through esc(): actor and chain names can come from
// user-uploaded STIX bundles.

import type { ModelParams } from '../types';
import { fmtPct, fmtUsd } from './displayMetrics';

export interface BoardReportInput {
  generatedAt: string;
  frameworkLabel: string;
  attackVersion: string;
  dataLabel: string;
  scope: { actors: number; sector: string; gates: string[]; includeSoftware: boolean; includeCampaigns: boolean };
  posture: { mitigations: number; dataComponents: number; totalDataComponents: number };
  /** Residual risk as a share of total actor weight (0..1) */
  currentResidual: number;
  planResidual: number;
  budget: number;
  spend: number;
  /** Plan's relative risk reduction under pessimistic / optimistic assumptions */
  sensitivity: { low: number; high: number };
  plan: { id: string; name: string; kind: 'mitigation' | 'telemetry'; cost: number; removed: number; residualAfter: number }[];
  frontier: { cost: number; residual: number }[];
  topActors: { name: string; kind: string; viability: number; sectors: string[] }[];
  params: ModelParams;
}

export function esc(s: string | number): string {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function frontierSvg(points: { cost: number; residual: number }[], budget: number, planCost: number): string {
  const W = 640, H = 240, L = 52, R = 16, T = 16, B = 36;
  const maxCost = Math.max(budget * 1.5, ...points.map(p => p.cost), 1);
  const x = (c: number) => L + (c / maxCost) * (W - L - R);
  const y = (r: number) => T + (1 - r) * (H - T - B);
  let d = '';
  points.forEach((p, i) => {
    if (i === 0) d += `M${x(p.cost).toFixed(1)},${y(p.residual).toFixed(1)}`;
    else d += `H${x(p.cost).toFixed(1)}V${y(p.residual).toFixed(1)}`;
  });
  const grid = [0, 0.25, 0.5, 0.75, 1].map(v =>
    `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 8}" y="${y(v) + 4}" class="tick" text-anchor="end">${v * 100}%</text>`).join('');
  const mag = Math.pow(10, Math.floor(Math.log10(maxCost / 4)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(v => v >= maxCost / 4) ?? 10 * mag;
  let xticks = '';
  for (let c = 0; c <= maxCost + 1; c += step) {
    xticks += `<text x="${x(c)}" y="${H - B + 18}" class="tick" text-anchor="middle">${esc(fmtUsd(c))}</text>`;
  }
  const planPt = points.reduce((best, p) => (p.cost <= planCost + 0.5 ? p : best), points[0]);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Residual risk versus cumulative cost">
  ${grid}${xticks}
  <line x1="${x(budget)}" x2="${x(budget)}" y1="${T}" y2="${H - B}" class="budget"/>
  <text x="${x(budget) + 4}" y="${T + 10}" class="tick">budget ${esc(fmtUsd(budget))}</text>
  <path d="${d}" class="line"/>
  <circle cx="${x(planPt.cost)}" cy="${y(planPt.residual)}" r="5" class="dot"/>
  <text x="${L}" y="${H - 4}" class="tick">cumulative annual cost →</text>
</svg>`;
}

export function buildBoardReport(r: BoardReportInput): string {
  const reduction = r.currentResidual > 0 ? 1 - r.planResidual / r.currentResidual : 0;
  const rows = r.plan.map((s, i) => `<tr>
    <td class="num">${i + 1}</td><td>${esc(s.name)} <span class="id">${esc(s.id)}</span></td>
    <td>${s.kind === 'mitigation' ? 'Mitigation' : 'Telemetry + analytics'}</td>
    <td class="num">${esc(fmtUsd(s.cost))}</td><td class="num">${esc((s.removed * 100).toFixed(1))}</td><td class="num">${esc(fmtPct(s.residualAfter, 1))}</td></tr>`).join('');
  const actors = r.topActors.map(a => `<tr><td>${esc(a.name)}</td><td>${esc(a.kind)}</td><td class="num">${esc(fmtPct(a.viability, 1))}</td><td>${esc(a.sectors.join(', ') || '—')}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AttackBreaker — Defense Investment Plan</title>
<style>
  :root { --ink:#0b0b0b; --ink2:#52514e; --muted:#898781; --grid:#e1e0d9; --line:#d95926; --budget:#898781; --surface:#fcfcfb; }
  body { margin:0; background:var(--surface); color:var(--ink); font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:860px; margin:0 auto; padding:32px 16px 48px; }
  h1 { font-size:24px; margin:0 0 4px; } h2 { font-size:16px; margin:28px 0 8px; }
  .sub { color:var(--ink2); margin:0 0 20px; }
  .hero { display:flex; gap:32px; flex-wrap:wrap; padding:16px 0; border-top:1px solid var(--grid); border-bottom:1px solid var(--grid); }
  .hero div { min-width:150px; } .hero .v { font-size:28px; font-weight:600; } .hero .l { color:var(--ink2); font-size:12px; }
  table { width:100%; border-collapse:collapse; font-size:13px; } th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--grid); vertical-align:top; }
  th { color:var(--ink2); font-weight:600; } .num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .id { color:var(--muted); font-size:11px; } svg { width:100%; height:auto; }
  svg .grid { stroke:var(--grid); stroke-width:1; } svg .tick { fill:var(--muted); font-size:11px; }
  svg .line { fill:none; stroke:var(--line); stroke-width:2; stroke-linejoin:round; } svg .dot { fill:var(--line); stroke:var(--surface); stroke-width:2; }
  svg .budget { stroke:var(--budget); stroke-width:1; }
  .note { color:var(--ink2); font-size:12px; } ul.note { padding-left:18px; }
  @media print { main { padding:0; } h2 { break-after:avoid; } tr { break-inside:avoid; } }
</style></head>
<body><main>
<h1>Defense investment plan</h1>
<p class="sub">${esc(r.dataLabel)} · generated ${esc(r.generatedAt)}</p>
<div class="hero">
  <div><div class="v">${esc(fmtPct(r.currentResidual))}</div><div class="l">Residual risk today</div></div>
  <div><div class="v">${esc(fmtPct(r.planResidual))}</div><div class="l">After the plan</div></div>
  <div><div class="v">${esc(fmtUsd(r.spend))}</div><div class="l">Estimated annual cost (budget ${esc(fmtUsd(r.budget))})</div></div>
  <div><div class="v">−${esc(fmtPct(reduction))}</div><div class="l">Risk reduction (range −${esc(fmtPct(r.sensitivity.low))} to −${esc(fmtPct(r.sensitivity.high))})</div></div>
</div>
<p class="note">Residual risk is the expected share of ${esc(r.scope.actors)} modeled threat actors${r.scope.sector !== 'all' ? ' targeting ' + esc(r.scope.sector) : ''} that could complete every required stage of an intrusion (${esc(r.scope.gates.join(', '))}) without being contained.</p>
<h2>Recommended investments, in order</h2>
<table><thead><tr><th class="num">#</th><th>Defense</th><th>Type</th><th class="num">Est. cost / yr</th><th class="num">Risk removed (pts)</th><th class="num">Residual after</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6">No affordable defense reduces risk further.</td></tr>'}</tbody></table>
<h2>Cost versus residual risk</h2>
${r.frontier.length > 1 ? frontierSvg(r.frontier, r.budget, r.spend) : '<p class="note">Not enough steps to chart.</p>'}
<p class="note">Each step adds the defense with the most risk removed per dollar at that point. The dot marks this plan.</p>
<h2>Actors most likely to still succeed after the plan</h2>
<table><thead><tr><th>Actor</th><th>Kind</th><th class="num">Viability</th><th>Sectors (from MITRE description)</th></tr></thead><tbody>${actors}</tbody></table>
<h2>Assumptions</h2>
<ul class="note">
  <li>Current posture: ${esc(r.posture.mitigations)} MITRE mitigations, ${esc(r.posture.dataComponents)} of ${esc(r.posture.totalDataComponents)} data components collected.</li>
  <li>One implemented mitigation cuts a technique's success by ${esc(fmtPct(r.params.mitigationEffectiveness))}; full detection coverage raises an alert on ${esc(fmtPct(r.params.detectionEffectiveness))} of attempts; ${esc(fmtPct(r.params.responseEffectiveness))} of alerted intrusions are contained in time; actors substitute an unrecorded technique ${esc(fmtPct(r.params.substitutionRate))} of the time; adversary adaptiveness ${esc(fmtPct(r.params.adversaryAdaptiveness))}.</li>
  <li>Techniques used through an actor's malware and tools ${r.scope.includeSoftware ? 'are' : 'are not'} counted; campaigns ${r.scope.includeCampaigns ? 'are' : 'are not'} modeled alongside groups.</li>
  <li>Costs are placeholder estimates unless edited; replace them with quotes before committing budget.</li>
  <li>Technique data, mitigations and detection strategies come from MITRE ATT&amp;CK. The model is a planning heuristic, not a guarantee of security outcomes.</li>
</ul>
</main></body></html>`;
}
