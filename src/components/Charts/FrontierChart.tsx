// ─── FrontierChart — residual risk vs cumulative cost ───────────────────────
// One series (the efficiency frontier) as a 2px step line; the budget is a
// solid hairline reference; the plan is the labelled marker. Hover shows a
// crosshair and the step's details. The plan table beside it is the table view.

import { useMemo, useState } from 'react';
import type { CatalogItem, PlanResult } from '../../types';
import { ENCODING } from '../../data/constants';
import { fmtPct, fmtUsd } from '../../engine/displayMetrics';
import { theme } from '../../theme';

interface FrontierChartProps {
  frontier: PlanResult;
  plan: PlanResult;
  budget: number;
  onHoverItem?: (item: CatalogItem | null) => void;
}

const W = 440, H = 230, L = 44, R = 14, T = 16, B = 34;

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

export function FrontierChart({ frontier, plan, budget, onHoverItem }: FrontierChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = frontier.totalWeight || 1;

  const pts = useMemo(() => [
    { cost: 0, risk: frontier.baselineRisk, item: null as CatalogItem | null },
    ...frontier.steps.map(s => ({ cost: s.cumulativeCost, risk: s.risk, item: s.item })),
  ], [frontier]);

  const lastCost = pts[pts.length - 1].cost;
  const xMax = Math.max(budget * 1.5, plan.totalCost * 1.2, Math.min(lastCost, budget * 3), 1);
  const x = (c: number) => L + Math.min(c / xMax, 1) * (W - L - R);
  const y = (r: number) => T + (1 - r / total) * (H - T - B);

  let d = '';
  pts.forEach((p, i) => {
    if (p.cost > xMax && i > 0) {
      if (pts[i - 1].cost <= xMax) d += `H${x(xMax).toFixed(1)}`;
      return;
    }
    d += i === 0 ? `M${x(p.cost).toFixed(1)},${y(p.risk).toFixed(1)}` : `H${x(p.cost).toFixed(1)}V${y(p.risk).toFixed(1)}`;
  });
  if (pts[pts.length - 1].cost < xMax) d += `H${x(xMax).toFixed(1)}`;

  const step = niceStep(xMax / 4);
  const xTicks: number[] = [];
  for (let c = 0; c <= xMax + 1; c += step) xTicks.push(c);

  const visible = pts.map((p, i) => ({ ...p, i })).filter(p => p.cost <= xMax);
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * W;
    let best = visible[0];
    for (const p of visible) if (Math.abs(x(p.cost) - mx) < Math.abs(x(best.cost) - mx)) best = p;
    setHover(best.i);
    onHoverItem?.(best.item);
  };
  const onLeave = () => { setHover(null); onHoverItem?.(null); };

  const hp = hover !== null ? pts[hover] : null;
  const planX = x(plan.totalCost), planY = y(plan.finalRisk);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label={`Residual risk falls from ${fmtPct(frontier.baselineRisk / total)} as defenses are added; the plan reaches ${fmtPct(plan.finalRisk / total)} for ${fmtUsd(plan.totalCost)}`}>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v * total)} y2={y(v * total)} stroke={theme.colors.borderSubtle} strokeWidth={1} />
            <text x={L - 8} y={y(v * total) + 4} textAnchor="end" fill={theme.colors.textMuted} fontSize={10} style={{ fontVariantNumeric: "tabular-nums" }}>{v * 100}%</text>
          </g>
        ))}
        {xTicks.map(c => (
          <text key={c} x={x(c)} y={H - B + 16} textAnchor="middle" fill={theme.colors.textMuted} fontSize={10} style={{ fontVariantNumeric: "tabular-nums" }}>{fmtUsd(c)}</text>
        ))}
        <text x={W - R} y={H - 4} textAnchor="end" fill={theme.colors.textMuted} fontSize={10}>cumulative annual cost</text>
        <line x1={x(budget)} x2={x(budget)} y1={T} y2={H - B} stroke={theme.colors.textMuted} strokeWidth={1} />
        <text x={x(budget) + 4} y={T + 9} fill={theme.colors.textSecondary} fontSize={10}>budget {fmtUsd(budget)}</text>

        <path d={d} fill="none" stroke={ENCODING.success} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {visible.slice(1).map(p => (
          <circle key={p.i} cx={x(p.cost)} cy={y(p.risk)} r={hover === p.i ? 5 : 3.5} fill={ENCODING.success} stroke={theme.colors.bgPanel} strokeWidth={2} />
        ))}
        <circle cx={planX} cy={planY} r={6} fill={theme.colors.bgPanel} stroke={ENCODING.success} strokeWidth={2} />
        <text x={planX + 9} y={planY - 8} fill={theme.colors.textPrimary} fontSize={11} fontWeight={600}>Plan {fmtPct(plan.finalRisk / total)}</text>

        {hp && <line x1={x(hp.cost)} x2={x(hp.cost)} y1={T} y2={H - B} stroke={theme.colors.textSecondary} strokeWidth={1} opacity={0.6} />}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" onMouseMove={onMove} onMouseLeave={onLeave} style={{ cursor: "crosshair" }} />
      </svg>
      {hp && (
        <div style={{
          position: "absolute", top: 4, left: (x(hp.cost) / W) > 0.55 ? 8 : undefined, right: (x(hp.cost) / W) > 0.55 ? undefined : 8,
          background: theme.colors.bgSurface + "f2", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.md,
          padding: "8px 10px", fontSize: theme.fontSizes.small, color: theme.colors.textBody, pointerEvents: "none", maxWidth: 230,
          boxShadow: theme.shadows.md,
        }}>
          {hp.item ? (
            <>
              <div style={{ fontWeight: 700, color: theme.colors.textPrimary }}>Step {hover}: {hp.item.name}</div>
              <div style={{ color: theme.colors.textSecondary }}>{hp.item.id} · {fmtUsd(hp.item.cost)}</div>
            </>
          ) : <div style={{ fontWeight: 700, color: theme.colors.textPrimary }}>Current posture</div>}
          <div style={{ marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            Spend {fmtUsd(hp.cost)} → residual {fmtPct(hp.risk / total, 1)}
          </div>
        </div>
      )}
    </div>
  );
}
