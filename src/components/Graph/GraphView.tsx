import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { CHAIN_COLORS, ENCODING } from '../../data/constants';
import { ZoomButton } from './ZoomButton';
import { theme } from '../../theme';
import type { Technique, Edge, Tactic } from '../../types';
import type { NodeMetrics } from '../../engine/displayMetrics';
import type { PhaseCenter } from '../../engine/graphModel';
import { fmtPct } from '../../engine/displayMetrics';

export interface ChainOverlay {
  id: string;
  name: string;
  colorIndex: number;
  nodes: Set<string>;
  edges: Edge[];
}

export interface GateMarker {
  label: string;
  tacticIds: string[];
  value: number;
}

interface GraphViewProps {
  techniques: Technique[];
  edges: Edge[];
  positions: Record<string, { x: number; y: number }>;
  metrics: Record<string, NodeMetrics>;
  selectedTech: string | null;
  onSelectTech: (id: string) => void;
  chainOverlays: ChainOverlay[];
  gateMarkers: GateMarker[] | null;
  focusSet: Set<string> | null;
  focusColor: string;
  blindSpots: Set<string> | null;
  viewHeight: number;
  viewWidth: number;
  phaseCenters: PhaseCenter[];
  onNodeDrag: (nodeId: string, dx: number, dy: number) => void;
  searchMatches: Set<string> | null;
  collapsedTactics: Set<string>;
  onToggleCollapse: (tacticId: string) => void;
  chainBuilderMode: boolean;
  chainBuilderPath: string[];
  onChainBuilderClick: (nodeId: string) => void;
  isolateChain: boolean;
  onPopout?: () => void;
  tactics: Tactic[];
}

const CRITICAL = "#d03b3b";

export function GraphView({ techniques, edges, positions, metrics, selectedTech, onSelectTech,
  chainOverlays, gateMarkers, focusSet, focusColor, blindSpots,
  viewHeight, viewWidth, phaseCenters, onNodeDrag, searchMatches,
  collapsedTactics, onToggleCollapse, chainBuilderMode, chainBuilderPath, onChainBuilderClick,
  isolateChain, onPopout, tactics }: GraphViewProps) {

  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipExpanded, setTooltipExpanded] = useState(false);
  const tooltipHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipHoveredRef = useRef(false);
  const clearTooltip = useCallback(() => {
    tooltipHideTimeout.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) {
        setHoveredNode(null); setTooltipPos(null); setTooltipExpanded(false);
      }
    }, 120);
  }, []);
  const isPanning = useRef(false);
  const didDrag = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouches = useRef<{ x: number; y: number }[]>([]);
  const lastPinchDist = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchDidMove = useRef(false);

  const dragNodeRef = useRef<string | null>(null);
  const dragDidMove = useRef(false);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const viewHeightRef = useRef(viewHeight);
  viewHeightRef.current = viewHeight;
  const viewWidthRef = useRef(viewWidth || 1000);
  viewWidthRef.current = viewWidth || 1000;
  const onNodeDragRef = useRef(onNodeDrag);
  onNodeDragRef.current = onNodeDrag;
  const onSelectTechRef = useRef(onSelectTech);
  onSelectTechRef.current = onSelectTech;
  const chainBuilderModeRef = useRef(chainBuilderMode);
  chainBuilderModeRef.current = chainBuilderMode;
  const onChainBuilderClickRef = useRef(onChainBuilderClick);
  onChainBuilderClickRef.current = onChainBuilderClick;
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const vh = viewHeight || 420;
  const vw = viewWidth || 1000;

  const { maxActivity, totalActivity } = useMemo(() => {
    let max = 0, total = 0;
    for (const t of techniques) {
      const a = metrics[t.id]?.activity ?? 0;
      total += a;
      if (a > max) max = a;
    }
    return { maxActivity: max || 1, totalActivity: total || 1 };
  }, [techniques, metrics]);

  const maxEdgeWeight = useMemo(() => Math.max(1, ...edges.map(e => e.weight ?? 1)), [edges]);

  const nodeChainMap = useMemo(() => {
    const m: Record<string, number[]> = {};
    chainOverlays.forEach(c => c.nodes.forEach(n => { (m[n] ||= []).push(c.colorIndex); }));
    return m;
  }, [chainOverlays]);

  const techTacticMap = useMemo(() => {
    const m: Record<string, string> = {};
    techniques.forEach(t => { m[t.id] = t.tactic; });
    return m;
  }, [techniques]);

  const tacticById = useMemo(() => new Map(tactics.map(t => [t.id, t])), [tactics]);

  const collapsedSummary = useMemo(() => {
    const summary: Record<string, { x: number; y: number; count: number }> = {};
    if (!collapsedTactics || collapsedTactics.size === 0) return summary;
    collapsedTactics.forEach(tacId => {
      let sx = 0, sy = 0, count = 0;
      techniques.forEach(t => {
        if (t.tactic !== tacId) return;
        const p = positions[t.id];
        if (p) { sx += p.x; sy += p.y; count++; }
      });
      if (count > 0) summary[tacId] = { x: sx / count, y: sy / count, count };
    });
    return summary;
  }, [collapsedTactics, techniques, positions]);

  const processedEdges = useMemo(() => {
    if (!collapsedTactics || collapsedTactics.size === 0) return edges;
    const seen = new Set<string>();
    return edges.filter(e => {
      const fromTac = techTacticMap[e.from];
      const toTac = techTacticMap[e.to];
      const fromCol = fromTac && collapsedTactics.has(fromTac);
      const toCol = toTac && collapsedTactics.has(toTac);
      if (fromCol && toCol && fromTac === toTac) return false;
      const key = (fromCol ? "~" + fromTac : e.from) + ">" + (toCol ? "~" + toTac : e.to);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [edges, collapsedTactics, techTacticMap]);

  const getNodePos = useCallback((techId: string) => {
    const tac = techTacticMap[techId];
    if (tac && collapsedTactics && collapsedTactics.has(tac) && collapsedSummary[tac]) {
      return collapsedSummary[tac];
    }
    return positions[techId];
  }, [techTacticMap, collapsedTactics, collapsedSummary, positions]);

  const builderEdges = useMemo(() => {
    if (!chainBuilderMode || !chainBuilderPath || chainBuilderPath.length < 2) return [];
    const result: { from: string; to: string }[] = [];
    for (let i = 0; i < chainBuilderPath.length - 1; i++) {
      result.push({ from: chainBuilderPath[i], to: chainBuilderPath[i + 1] });
    }
    return result;
  }, [chainBuilderMode, chainBuilderPath]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * viewWidthRef.current;
      const my = (e.clientY - rect.top) / rect.height * viewHeightRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => {
        const newScale = Math.max(0.3, Math.min(8, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return {
          x: mx - (mx - prev.x) * ratio,
          y: my - (my - prev.y) * ratio,
          scale: newScale,
        };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });

    // ─── Touch: pan (1 finger) + pinch-to-zoom (2 fingers) ─────────────
    const getTouchPoints = (e: TouchEvent) =>
      Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));

    const pinchDist = (pts: { x: number; y: number }[]) =>
      Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const pts = getTouchPoints(e);
      lastTouches.current = pts;
      lastPinchDist.current = pts.length >= 2 ? pinchDist(pts) : null;
      if (pts.length === 1) {
        touchStartPos.current = { x: pts[0].x, y: pts[0].y };
        touchDidMove.current = false;
      } else {
        touchStartPos.current = null;
        touchDidMove.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const pts = getTouchPoints(e);
      const prev = lastTouches.current;
      const rect = svg.getBoundingClientRect();

      // Detect if finger moved enough to count as a drag (not a tap)
      if (touchStartPos.current && pts.length === 1) {
        const dx = pts[0].x - touchStartPos.current.x;
        const dy = pts[0].y - touchStartPos.current.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touchDidMove.current = true;
      } else {
        touchDidMove.current = true;
      }

      if (pts.length >= 2 && prev.length >= 2) {
        // Pinch zoom
        const curDist = pinchDist(pts);
        const prevDist = lastPinchDist.current ?? curDist;
        if (prevDist > 0) {
          const factor = curDist / prevDist;
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const mx = (midX - rect.left) / rect.width * viewWidthRef.current;
          const my = (midY - rect.top) / rect.height * viewHeightRef.current;
          setTransform(p => {
            const newScale = Math.max(0.3, Math.min(8, p.scale * factor));
            const ratio = newScale / p.scale;
            return { x: mx - (mx - p.x) * ratio, y: my - (my - p.y) * ratio, scale: newScale };
          });
        }
        // Also pan with midpoint movement
        const prevMidX = (prev[0].x + prev[1].x) / 2;
        const prevMidY = (prev[0].y + prev[1].y) / 2;
        const curMidX = (pts[0].x + pts[1].x) / 2;
        const curMidY = (pts[0].y + pts[1].y) / 2;
        const dx = curMidX - prevMidX;
        const dy = curMidY - prevMidY;
        setTransform(p => ({
          ...p,
          x: p.x + dx / rect.width * viewWidthRef.current,
          y: p.y + dy / rect.height * viewHeightRef.current,
        }));
        lastPinchDist.current = curDist;
      } else if (pts.length === 1 && prev.length >= 1 && touchDidMove.current) {
        // Single-finger pan (only if moved past threshold)
        const dx = pts[0].x - prev[0].x;
        const dy = pts[0].y - prev[0].y;
        setTransform(p => ({
          ...p,
          x: p.x + dx / rect.width * viewWidthRef.current,
          y: p.y + dy / rect.height * viewHeightRef.current,
        }));
      }
      lastTouches.current = pts;
    };

    const onTouchEnd = (e: TouchEvent) => {
      // Tap detection: single finger, didn't move → hit-test nodes
      if (!touchDidMove.current && touchStartPos.current && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const t = transformRef.current;

        // Use SVG's built-in matrix to correctly map screen → viewBox coords
        const ctm = svg.getScreenCTM();
        let nodeX: number, nodeY: number;
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = touch.clientX;
          pt.y = touch.clientY;
          const svgPt = pt.matrixTransform(ctm.inverse());
          nodeX = (svgPt.x - t.x) / t.scale;
          nodeY = (svgPt.y - t.y) / t.scale;
        } else {
          const rect = svg.getBoundingClientRect();
          const svgX = (touch.clientX - rect.left) / rect.width * viewWidthRef.current;
          const svgY = (touch.clientY - rect.top) / rect.height * viewHeightRef.current;
          nodeX = (svgX - t.x) / t.scale;
          nodeY = (svgY - t.y) / t.scale;
        }

        // Find closest node within tap radius (~25px screen → node-space)
        const tapRadius = 25 / t.scale;
        let closest: string | null = null;
        let closestDist = tapRadius;
        const curPositions = positionsRef.current;
        for (const id of Object.keys(curPositions)) {
          const p = curPositions[id];
          if (!p) continue;
          const d = Math.hypot(p.x - nodeX, p.y - nodeY);
          if (d < closestDist) { closestDist = d; closest = id; }
        }
        if (closest) {
          if (chainBuilderModeRef.current && onChainBuilderClickRef.current) {
            onChainBuilderClickRef.current(closest);
          } else if (onSelectTechRef.current) {
            onSelectTechRef.current(closest);
          }
        }
      }
      touchStartPos.current = null;
      const pts = getTouchPoints(e);
      lastTouches.current = pts;
      lastPinchDist.current = pts.length >= 2 ? pinchDist(pts) : null;
    };

    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    svg.addEventListener('touchmove', onTouchMove, { passive: false });
    svg.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('touchstart', onTouchStart);
      svg.removeEventListener('touchmove', onTouchMove);
      svg.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragNodeRef.current = nodeId;
    dragDidMove.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setHoveredNode(null); setTooltipPos(null); setTooltipExpanded(false); tooltipHoveredRef.current = false;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    didDrag.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragNodeRef.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragDidMove.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (!dragDidMove.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scale = transformRef.current.scale;
      const svgDx = dx / rect.width * viewWidthRef.current / scale;
      const svgDy = dy / rect.height * viewHeightRef.current / scale;
      if (onNodeDragRef.current) onNodeDragRef.current(dragNodeRef.current, svgDx, svgDy);
      return;
    }
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx / rect.width * viewWidthRef.current,
      y: prev.y + dy / rect.height * viewHeightRef.current,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragNodeRef.current) {
      if (!dragDidMove.current) {
        if (chainBuilderModeRef.current && onChainBuilderClickRef.current) {
          onChainBuilderClickRef.current(dragNodeRef.current);
        } else if (onSelectTechRef.current) {
          onSelectTechRef.current(dragNodeRef.current);
        }
      }
      dragNodeRef.current = null;
      dragDidMove.current = false;
      return;
    }
    isPanning.current = false;
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) {
      e.stopPropagation();
      didDrag.current = false;
    }
  }, []);

  const centerY = vh / 2;

  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.min(8, prev.scale * 1.3);
      const ratio = newScale / prev.scale;
      const cx = viewWidthRef.current / 2;
      return { x: cx - (cx - prev.x) * ratio, y: centerY - (centerY - prev.y) * ratio, scale: newScale };
    });
  }, [centerY]);

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.max(0.3, prev.scale * 0.77);
      const ratio = newScale / prev.scale;
      const cx = viewWidthRef.current / 2;
      return { x: cx - (cx - prev.x) * ratio, y: centerY - (centerY - prev.y) * ratio, scale: newScale };
    });
  }, [centerY]);

  const resetZoom = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  const zoomToFit = useCallback(() => {
    const nodeIds = Object.keys(positions);
    if (nodeIds.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodeIds.forEach(id => {
      const p = positions[id];
      if (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    });
    const pad = 50;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const bw = maxX - minX;
    const bh = maxY - minY;
    if (bw <= 0 || bh <= 0) return;
    const scale = Math.min(vw / bw, vh / bh);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setTransform({ x: vw / 2 - cx * scale, y: vh / 2 - cy * scale, scale });
  }, [positions, vw, vh]);

  const lineBetween = (from: { x: number; y: number }, to: { x: number; y: number }, offset = 0) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return null;
    const ux = dx / len, uy = dy / len, px = -uy * offset, py = ux * offset, r = 14;
    return { x1: from.x + ux * r + px, y1: from.y + uy * r + py, x2: to.x - ux * (r + 6) + px, y2: to.y - uy * (r + 6) + py };
  };

  const highlighting = chainOverlays.length > 0;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 6, zIndex: 10 }}>
        <ZoomButton label="+" onClick={zoomIn} />
        <ZoomButton label={"−"} onClick={zoomOut} />
        <ZoomButton label={"↺"} onClick={resetZoom} />
        <ZoomButton label="FIT" onClick={zoomToFit} />
        {onPopout && <ZoomButton label={"↗"} onClick={onPopout} />}
      </div>
      {highlighting && (
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          display: "flex", flexDirection: "column", gap: 4,
          background: "rgba(10,15,26,0.8)", backdropFilter: "blur(4px)",
          padding: "8px 12px", borderRadius: 5, border: "1px solid " + theme.colors.borderSubtle,
        }}>
          <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Highlighted actors
          </span>
          {chainOverlays.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 3, borderRadius: 1, background: CHAIN_COLORS[c.colorIndex].color, flexShrink: 0 }} />
              <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textBody, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
                {c.name}
              </span>
            </div>
          ))}
          <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, maxWidth: 240 }}>
            Lines fan out from the actor's most-used technique to its options at the next stage.
          </span>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 10, right: 10, fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, fontFamily: '"JetBrains Mono", monospace', background: "rgba(10,15,26,0.7)", padding: "4px 8px", borderRadius: 4, zIndex: 10 }}>
        {(transform.scale * 100).toFixed(0)}%
      </div>
      <svg ref={svgRef} viewBox={"0 0 " + vw + " " + vh}
        style={{ width: "100%", height: "100%", background: "transparent", cursor: "grab", touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClickCapture={handleClickCapture}
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#475569" fillOpacity="0.5" />
          </marker>
          {CHAIN_COLORS.map((cc, i) => (
            <marker key={"chain-marker-" + i} id={"arrowhead-chain-" + i} markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={cc.color} />
            </marker>
          ))}
          <marker id="arrowhead-builder" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#a855f7" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g transform={"translate(" + transform.x + "," + transform.y + ") scale(" + transform.scale + ")"}>
          {(() => {
            const charW = 4.5;
            const placed: { x: number; halfW: number; row: number }[] = [];
            return phaseCenters.map((pc, i) => {
              const isCollapsed = collapsedTactics && collapsedTactics.has(pc.tacticId);
              const text = (isCollapsed ? "[+] " : "[−] ") + pc.label;
              const halfW = text.length * charW / 2;
              let row = 0;
              for (let r = 0; r < 4; r++) {
                const overlaps = placed.some(p => p.row === r && Math.abs(pc.x - p.x) < halfW + p.halfW + 4);
                if (!overlaps) { row = r; break; }
                row = r + 1;
              }
              placed.push({ x: pc.x, halfW, row });
              return (
                <text key={i} x={pc.x} y={18 + row * 11} textAnchor="middle" fill={pc.color || "#64748b"} fontSize="9.5" fontFamily="monospace" opacity={0.8}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); onToggleCollapse(pc.tacticId); }}
                >
                  {text}
                </text>
              );
            });
          })()}

          {gateMarkers && gateMarkers.flatMap(g => g.tacticIds.map(tid => {
            const pc = phaseCenters.find(p => p.tacticId === tid);
            if (!pc) return null;
            const s = g.value < 0.2 ? { icon: "✂", word: "cut", color: ENCODING.cut }
              : g.value < 0.6 ? { icon: "◐", word: "narrowed", color: "#fab219" }
                : { icon: "○", word: "open", color: theme.colors.textMuted };
            const label = s.icon + " " + s.word + " " + fmtPct(g.value);
            const w = label.length * 7 + 12;
            return (
              <g key={"gate-" + g.label + tid}>
                <title>{g.label}: {fmtPct(g.value, 1)} of attempts pass this stage without raising an alert</title>
                <rect x={pc.x - w / 2} y={vh - 26} width={w} height={20} rx={5} fill={theme.colors.bgSurface} stroke={s.color} strokeWidth={1.5} />
                <text x={pc.x} y={vh - 12} textAnchor="middle" fill={theme.colors.textBody} fontSize="12.5">{label}</text>
              </g>
            );
          }))}

          {Object.entries(collapsedSummary).map(([tacId, info]) => {
            const tac = tacticById.get(tacId);
            return (
              <g key={"collapsed-" + tacId} style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(tacId); }}>
                <circle cx={info.x} cy={info.y} r={20}
                  fill={tac?.color || "#6366f1"} fillOpacity={0.15}
                  stroke={tac?.color || "#6366f1"} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="4,2"
                />
                <text x={info.x} y={info.y + 4} textAnchor="middle" fill={tac?.color || "#fff"} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {info.count}
                </text>
              </g>
            );
          })}

          {builderEdges.map((e, i) => {
            const from = positions[e.from], to = positions[e.to];
            const l = from && to ? lineBetween(from, to) : null;
            if (!l) return null;
            return <line key={"builder-" + i} {...l} stroke="#a855f7" strokeWidth={2.5} strokeOpacity={0.8} markerEnd="url(#arrowhead-builder)" strokeDasharray="6,3" />;
          })}

          {!(highlighting && isolateChain) && processedEdges.map((e, i) => {
            const from = getNodePos(e.from), to = getNodePos(e.to);
            const l = from && to ? lineBetween(from, to) : null;
            if (!l) return null;
            const searchDimmed = searchMatches && searchMatches.size > 0 && !searchMatches.has(e.from) && !searchMatches.has(e.to);
            const strength = (e.weight ?? 1) / maxEdgeWeight;
            const opacity = searchDimmed ? 0.03 : highlighting ? 0.04 : 0.05 + 0.3 * strength;
            return <line key={i} {...l} stroke="#475569" strokeWidth={0.6 + strength * 0.8} strokeOpacity={opacity} markerEnd="url(#arrowhead)" />;
          })}

          {chainOverlays.map((c, ci) => c.edges.map((e, i) => {
            const from = getNodePos(e.from), to = getNodePos(e.to);
            const offset = (ci - (chainOverlays.length - 1) / 2) * 3;
            const l = from && to ? lineBetween(from, to, offset) : null;
            if (!l) return null;
            return <line key={"fan-" + c.id + "-" + i} {...l} stroke={CHAIN_COLORS[c.colorIndex].color} strokeWidth={1.4} strokeOpacity={0.75}
              markerEnd={"url(#arrowhead-chain-" + c.colorIndex + ")"} />;
          }))}

          {techniques.map(t => {
            const pos = positions[t.id];
            if (!pos) return null;
            if (collapsedTactics && collapsedTactics.has(t.tactic)) return null;
            const tactic = tacticById.get(t.tactic);
            const m = metrics[t.id];
            const success = m?.success ?? 1;
            const detection = m?.detection ?? 0;
            const activity = m ? Math.sqrt(m.activity / maxActivity) : 0;
            const isSelected = selectedTech === t.id;
            const nodeColors = nodeChainMap[t.id];
            const isInChain = !!nodeColors;
            const dimmedNode = highlighting && !isInChain;
            if (dimmedNode && isolateChain) return null;
            const searchDimmed = searchMatches && searchMatches.size > 0 && !searchMatches.has(t.id);
            const focused = focusSet?.has(t.id);
            const blind = blindSpots?.has(t.id);

            const isSub = !!t.parentId;
            const radius = isSub ? (5 + activity * 7) : (8 + activity * 12);
            const baseOpacity = dimmedNode ? 0.15 : (focusSet && !focused) ? 0.35 : isSub ? 0.8 : 1;
            const opacity = searchDimmed ? Math.min(baseOpacity, 0.12) : baseOpacity;
            const r1 = radius + 3, c1 = 2 * Math.PI * r1;
            const r2 = radius + 6, c2 = 2 * Math.PI * r2;
            const chainStrokeColor = isInChain && nodeColors.length === 1 ? CHAIN_COLORS[nodeColors[0]].color : null;
            const rot = "rotate(-90 " + pos.x + " " + pos.y + ")";

            return (
              <g key={t.id}
                onMouseDown={(e) => handleNodeMouseDown(e, t.id)}
                onMouseEnter={(e) => {
                  if (tooltipHideTimeout.current) clearTimeout(tooltipHideTimeout.current);
                  const rect = svgRef.current?.parentElement?.getBoundingClientRect();
                  if (rect) {
                    if (hoveredNode !== t.id) setTooltipExpanded(false);
                    setHoveredNode(t.id); setTooltipPos({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 });
                  }
                }}
                onMouseLeave={() => { tooltipHoveredRef.current = false; clearTooltip(); }}
                style={{ cursor: dragNodeRef.current === t.id ? "grabbing" : "pointer" }}
                opacity={opacity}
              >
                {/* residual success: arc length = chance an attempt works after prevention */}
                <circle cx={pos.x} cy={pos.y} r={r1} fill="none" stroke={ENCODING.success} strokeOpacity={0.16} strokeWidth={2} />
                {!m?.blocked && success > 0.005 && (
                  <circle cx={pos.x} cy={pos.y} r={r1} fill="none" stroke={ENCODING.success} strokeWidth={2}
                    strokeDasharray={(success * c1).toFixed(2) + " " + c1.toFixed(2)} transform={rot} style={{ transition: "stroke-dasharray 0.35s" }} />
                )}
                {/* detection coverage: outer arc */}
                {detection > 0.005 && (
                  <>
                    <circle cx={pos.x} cy={pos.y} r={r2} fill="none" stroke={ENCODING.detection} strokeOpacity={0.16} strokeWidth={1.5} />
                    <circle cx={pos.x} cy={pos.y} r={r2} fill="none" stroke={ENCODING.detection} strokeWidth={1.5}
                      strokeDasharray={(detection * c2).toFixed(2) + " " + c2.toFixed(2)} transform={rot} style={{ transition: "stroke-dasharray 0.35s" }} />
                  </>
                )}
                {(focused || blind) && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 9} fill="none" stroke={focused ? focusColor : CRITICAL} strokeWidth={1.5}
                    strokeDasharray={focused ? "3,2" : "2,3"} opacity={0.9}>
                    <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={pos.x} cy={pos.y} r={radius}
                  fill={tactic?.color || "#6366f1"} fillOpacity={m?.blocked ? 0.2 : 0.85}
                  stroke={isSelected ? "#fff" : chainStrokeColor || "transparent"}
                  strokeWidth={isSelected ? 2 : isInChain ? 1.5 : 0}
                  filter={isSelected || isInChain ? "url(#glow)" : "none"}
                  style={{ transition: "r 0.35s" }}
                />
                {isInChain && nodeColors.length > 1 && (() => {
                  const ringR = radius + 1;
                  const circumference = 2 * Math.PI * ringR;
                  const segLen = circumference / nodeColors.length;
                  return nodeColors.map((ci, j) => (
                    <circle key={"ring-" + j} cx={pos.x} cy={pos.y} r={ringR}
                      fill="none" stroke={CHAIN_COLORS[ci].color} strokeWidth={2}
                      strokeDasharray={segLen + " " + (circumference - segLen)}
                      strokeDashoffset={-j * segLen}
                    />
                  ));
                })()}
                {m && m.preventions > 0 && (
                  <circle cx={pos.x + r1 * Math.SQRT1_2} cy={pos.y - r1 * Math.SQRT1_2} r={3} fill={ENCODING.prevention} stroke={theme.colors.bg} strokeWidth={1.5} />
                )}
                {m?.blocked ? (
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={ENCODING.cut} fontSize="12" fontWeight="bold">{"✓"}</text>
                ) : (m && m.actors > 0 && !dimmedNode && (
                  <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="monospace">{m.actors}</text>
                ))}
                <text x={pos.x} y={pos.y + r2 + 9} textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
                  {t.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {hoveredNode && tooltipPos && (() => {
        const ht = techniques.find(t => t.id === hoveredNode);
        if (!ht) return null;
        const m = metrics[hoveredNode];
        const htSummary = ht.description ?? null;
        const TOOLTIP_TRUNC = 150;
        const needsMore = !!htSummary && htSummary.length > TOOLTIP_TRUNC;
        const displaySummary = htSummary && (!needsMore || tooltipExpanded) ? htSummary
          : htSummary ? htSummary.slice(0, htSummary.lastIndexOf(' ', TOOLTIP_TRUNC) || TOOLTIP_TRUNC) + '...' : null;
        return (
          <div
            onMouseEnter={() => { tooltipHoveredRef.current = true; if (tooltipHideTimeout.current) clearTimeout(tooltipHideTimeout.current); }}
            onMouseLeave={() => { tooltipHoveredRef.current = false; clearTooltip(); }}
            style={{
              position: "absolute", left: tooltipPos.x, top: tooltipPos.y,
              background: theme.colors.bgSurface + "f0", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.lg,
              padding: "12px 16px", pointerEvents: "auto", zIndex: 30,
              maxWidth: tooltipExpanded ? 420 : 320, fontSize: theme.fontSizes.body, color: theme.colors.textBody,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{ht.id} {ht.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {ht.tactics.map(tid => {
                const tac = tacticById.get(tid);
                return <span key={tid} style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: tac?.color, marginRight: 4 }} />{tac?.name ?? tid}
                </span>;
              })}
            </div>
            {displaySummary && (
              <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: "1.5", marginBottom: needsMore ? 4 : 8, borderTop: "1px solid " + theme.colors.border, paddingTop: 6 }}>
                {displaySummary}
              </div>
            )}
            {needsMore && (
              <div style={{ textAlign: "right", marginBottom: 4 }}>
                <span onClick={() => setTooltipExpanded(prev => !prev)} style={{
                  fontSize: theme.fontSizes.small, color: theme.colors.blue, cursor: "pointer", userSelect: "none",
                }}>{tooltipExpanded ? "▲ LESS" : "▼ MORE"}</span>
              </div>
            )}
            {m && (
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 12px", fontSize: theme.fontSizes.base, alignItems: "center" }}>
                <span style={{ color: theme.colors.textMuted }}><span style={{ color: ENCODING.success }}>{"●"}</span> Residual success</span>
                <span>{m.blocked ? "assumed blocked" : fmtPct(m.success)}</span>
                <span style={{ color: theme.colors.textMuted }}><span style={{ color: ENCODING.detection }}>{"●"}</span> Detection coverage</span>
                <span>{fmtPct(m.detection)}</span>
                <span style={{ color: theme.colors.textMuted }}>Share of residual activity</span>
                <span>{fmtPct(m.activity / totalActivity, 1)}</span>
                <span style={{ color: theme.colors.textMuted }}>Modeled actors using it</span>
                <span>{m.actors}</span>
                <span style={{ color: theme.colors.textMuted }}><span style={{ color: ENCODING.prevention }}>{"●"}</span> Preventions in place</span>
                <span>{m.preventions}</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
