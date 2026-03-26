import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { CHAIN_COLORS, TACTICS } from '../../data/constants';
import { ZoomButton } from './ZoomButton';
import { theme } from '../../theme';
import type { Technique, Edge, Tactic } from '../../types';

interface PhaseCenterInfo {
  x: number;
  label: string;
  color?: string;
  tacticId: string;
}

interface GraphViewProps {
  techniques: Technique[];
  edges: Edge[];
  positions: Record<string, { x: number; y: number }>;
  exposures: Record<string, number>;
  betweenness: Record<string, number>;
  chainCoverage: Record<string, number>;
  selectedTech: string | null;
  onSelectTech: (id: string) => void;
  highlightedChains: { path: string[]; name: string }[];
  remediated: Set<string>;
  optimalSet: string[];
  viewHeight: number;
  viewWidth: number;
  phaseCenters: PhaseCenterInfo[];
  onNodeDrag: (nodeId: string, dx: number, dy: number) => void;
  searchMatches: Set<string> | null;
  collapsedTactics: Set<string>;
  onToggleCollapse: (tacticId: string) => void;
  chainBuilderMode: boolean;
  chainBuilderPath: string[];
  onChainBuilderClick: (nodeId: string) => void;
  isolateChain: boolean;
  gapNodes: Set<string> | null;
  techDescriptions: Record<string, string | { summary: string }> | null;
  onPopout?: () => void;
  tactics: Tactic[];
  profileExposures: Record<string, { coverageSources: any[] }> | null;
}

export function GraphView({ techniques, edges, positions, exposures, betweenness, chainCoverage,
  selectedTech, onSelectTech, highlightedChains, remediated, optimalSet,
  viewHeight, viewWidth, phaseCenters, onNodeDrag, searchMatches,
  collapsedTactics, onToggleCollapse, chainBuilderMode, chainBuilderPath, onChainBuilderClick,
  isolateChain, gapNodes, techDescriptions, onPopout, tactics, profileExposures }: GraphViewProps) {

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

  const displayTechSet = useMemo(() => new Set(techniques.map(t => t.id)), [techniques]);

  const chainComputations = useMemo(() => {
    return highlightedChains.map((chain, colorIndex) => {
      const projected: string[] = [];
      for (const tid of chain.path) {
        let mapped = tid;
        if (!displayTechSet.has(tid)) {
          const parentId = tid.includes('.') ? tid.split('.')[0] : null;
          if (parentId && displayTechSet.has(parentId)) {
            mapped = parentId;
          } else {
            continue;
          }
        }
        if (projected.length === 0 || projected[projected.length - 1] !== mapped) {
          projected.push(mapped);
        }
      }
      const edgesSet = new Set<string>();
      for (let i = 0; i < projected.length - 1; i++) {
        edgesSet.add(projected[i] + "->" + projected[i + 1]);
      }
      return { chain, colorIndex, projected, edges: edgesSet, nodes: new Set(projected), color: CHAIN_COLORS[colorIndex].color };
    });
  }, [highlightedChains, displayTechSet]);

  const nodeChainMap = useMemo(() => {
    const m: Record<string, number[]> = {};
    chainComputations.forEach(c => {
      c.nodes.forEach(n => {
        if (!m[n]) m[n] = [];
        m[n].push(c.colorIndex);
      });
    });
    return m;
  }, [chainComputations]);

  const edgeChainMap = useMemo(() => {
    const m: Record<string, number[]> = {};
    chainComputations.forEach(c => {
      c.edges.forEach(e => {
        if (!m[e]) m[e] = [];
        m[e].push(c.colorIndex);
      });
    });
    return m;
  }, [chainComputations]);

  const techTacticMap = useMemo(() => {
    const m: Record<string, string> = {};
    techniques.forEach(t => { m[t.id] = t.tactic; });
    return m;
  }, [techniques]);

  const collapsedSummary = useMemo(() => {
    if (!collapsedTactics || collapsedTactics.size === 0) return {} as Record<string, { x: number; y: number; count: number }>;
    const summary: Record<string, { x: number; y: number; count: number }> = {};
    collapsedTactics.forEach(tacId => {
      const tacTechs = techniques.filter(t => t.tactic === tacId);
      if (tacTechs.length === 0) return;
      let sx = 0, sy = 0, count = 0;
      tacTechs.forEach(t => {
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
      const fk = fromCol ? "~" + fromTac : e.from;
      const tk = toCol ? "~" + toTac : e.to;
      const key = fk + ">" + tk;
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

  const missingChainEdges = useMemo(() => {
    if (highlightedChains.length === 0) return [];
    const graphEdgeSet = new Set(edges.map(e => e.from + "->" + e.to));
    const missing: { from: string; to: string; colorIndex: number; color: string }[] = [];
    const seen = new Set<string>();
    chainComputations.forEach(c => {
      for (let i = 0; i < c.projected.length - 1; i++) {
        const key = c.projected[i] + "->" + c.projected[i + 1];
        if (!graphEdgeSet.has(key) && !seen.has(key + ":" + c.colorIndex)) {
          seen.add(key + ":" + c.colorIndex);
          missing.push({ from: c.projected[i], to: c.projected[i + 1], colorIndex: c.colorIndex, color: c.color });
        }
      }
    });
    return missing;
  }, [highlightedChains, chainComputations, edges]);

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
        // This handles aspect ratio, letterboxing, and any CSS transforms
        const ctm = svg.getScreenCTM();
        let nodeX: number, nodeY: number;
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = touch.clientX;
          pt.y = touch.clientY;
          const svgPt = pt.matrixTransform(ctm.inverse());
          // Untransform from viewBox coords to node-space coords
          nodeX = (svgPt.x - t.x) / t.scale;
          nodeY = (svgPt.y - t.y) / t.scale;
        } else {
          // Fallback: simple linear mapping
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
        const posKeys = Object.keys(curPositions);
        for (let i = 0; i < posKeys.length; i++) {
          const id = posKeys[i];
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
      const vhCur = viewHeightRef.current;
      const svgDx = dx / rect.width * viewWidthRef.current / scale;
      const svgDy = dy / rect.height * vhCur / scale;
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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 6, zIndex: 10 }}>
        <ZoomButton label="+" onClick={zoomIn} />
        <ZoomButton label={"\u2212"} onClick={zoomOut} />
        <ZoomButton label={"\u21BA"} onClick={resetZoom} />
        <ZoomButton label="FIT" onClick={zoomToFit} />
        {onPopout && <ZoomButton label={"\u2197"} onClick={onPopout} />}
      </div>
      {highlightedChains.length > 0 && (
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          display: "flex", flexDirection: "column", gap: 4,
          background: "rgba(10,15,26,0.8)", backdropFilter: "blur(4px)",
          padding: "8px 12px", borderRadius: 5, border: "1px solid " + theme.colors.borderSubtle,
        }}>
          <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Active Chains
          </span>
          {highlightedChains.map((chain, i) => (
            <div key={chain.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 12, height: 3, borderRadius: 1,
                background: CHAIN_COLORS[i % CHAIN_COLORS.length].color,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: theme.fontSizes.base, color: CHAIN_COLORS[i % CHAIN_COLORS.length].color,
                fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden",
                textOverflow: "ellipsis", maxWidth: 220,
              }}>
                {chain.name}
              </span>
            </div>
          ))}
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
            <polygon points="0 0, 6 2, 0 4" fill="#475569" fillOpacity="0.4" />
          </marker>
          <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
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
            const arr = phaseCenters || [];
            const charW = 4.5;
            const placed: { x: number; halfW: number; row: number }[] = [];
            return arr.map((pc, i) => {
              const isCollapsed = collapsedTactics && collapsedTactics.has(pc.tacticId);
              const text = (isCollapsed ? "[+] " : "[\u2212] ") + pc.label;
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
                  onClick={(e) => { e.stopPropagation(); onToggleCollapse && onToggleCollapse(pc.tacticId); }}
                >
                  {text}
                </text>
              );
            });
          })()}

          {collapsedTactics && Object.entries(collapsedSummary).map(([tacId, info]) => {
            const tac = (tactics || TACTICS).find(t => t.id === tacId);
            return (
              <g key={"collapsed-" + tacId} style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onToggleCollapse && onToggleCollapse(tacId); }}>
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

          {missingChainEdges.map((e, i) => {
            const from = getNodePos(e.from);
            const to = getNodePos(e.to);
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len, uy = dy / len, r = 14;
            return (
              <line key={"chain-gap-" + i} x1={from.x + ux * r} y1={from.y + uy * r}
                x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
                stroke={e.color} strokeWidth={2} strokeOpacity={0.9}
                markerEnd={"url(#arrowhead-chain-" + e.colorIndex + ")"} />
            );
          })}

          {builderEdges.map((e, i) => {
            const from = positions[e.from];
            const to = positions[e.to];
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len, uy = dy / len, r = 14;
            return (
              <line key={"builder-" + i} x1={from.x + ux * r} y1={from.y + uy * r}
                x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
                stroke="#a855f7" strokeWidth={2.5} strokeOpacity={0.8}
                markerEnd="url(#arrowhead-builder)" strokeDasharray="6,3" />
            );
          })}

          {processedEdges.map((e, i) => {
            const from = getNodePos(e.from);
            const to = getNodePos(e.to);
            if (!from || !to) return null;
            const edgeKey = e.from + "->" + e.to;
            const chainColors = edgeChainMap[edgeKey];
            const isChainEdge = !!chainColors;
            const isRemediatedEdge = remediated.has(e.from) || remediated.has(e.to);
            const dimmed = highlightedChains.length > 0 && !isChainEdge;
            if (dimmed && isolateChain) return null;
            const searchDimmedEdge = searchMatches && searchMatches.size > 0 && !searchMatches.has(e.from) && !searchMatches.has(e.to);

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;
            const ux = dx / len;
            const uy = dy / len;
            const r = 14;

            if (isChainEdge && chainColors.length > 1) {
              const px = -uy, py = ux;
              const spacing = 3;
              const totalWidth = (chainColors.length - 1) * spacing;
              return (
                <g key={i}>
                  {chainColors.map((ci, j) => {
                    const offset = -totalWidth / 2 + j * spacing;
                    return (
                      <line key={j}
                        x1={from.x + ux * r + px * offset} y1={from.y + uy * r + py * offset}
                        x2={to.x - ux * (r + 6) + px * offset} y2={to.y - uy * (r + 6) + py * offset}
                        stroke={CHAIN_COLORS[ci].color} strokeWidth={1.5} strokeOpacity={searchDimmedEdge ? 0.04 : 0.9}
                        markerEnd={"url(#arrowhead-chain-" + ci + ")"}
                      />
                    );
                  })}
                </g>
              );
            }

            const chainColor = isChainEdge ? CHAIN_COLORS[chainColors[0]].color : null;
            return (
              <line
                key={i}
                x1={from.x + ux * r} y1={from.y + uy * r}
                x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
                stroke={isRemediatedEdge ? "#22c55e" : isChainEdge ? chainColor! : "#334155"}
                strokeWidth={isChainEdge ? 2 : 0.7}
                strokeOpacity={searchDimmedEdge ? 0.04 : dimmed ? 0.08 : isRemediatedEdge ? 0.3 : isChainEdge ? 0.9 : 0.2}
                markerEnd={isChainEdge ? "url(#arrowhead-chain-" + chainColors[0] + ")" : "url(#arrowhead)"}
                strokeDasharray={isRemediatedEdge ? "3,3" : "none"}
              />
            );
          })}

          {techniques.map(t => {
            const pos = positions[t.id];
            if (!pos) return null;
            if (collapsedTactics && collapsedTactics.has(t.tactic)) return null;
            const tactic = (tactics || TACTICS).find(ta => ta.id === t.tactic);
            const exposure = exposures[t.id] ?? 1.0;
            const bc = betweenness[t.id] ?? 0;
            const cc = chainCoverage[t.id] ?? 0;
            const priority = bc * exposure;
            const isSelected = selectedTech === t.id;
            const nodeColors = nodeChainMap[t.id];
            const isInChain = !!nodeColors;
            const isRemediated = remediated.has(t.id);
            const isOptimal = optimalSet.includes(t.id);
            const dimmedNode = highlightedChains.length > 0 && !isInChain;
            if (dimmedNode && isolateChain) return null;
            const searchDimmed = searchMatches && searchMatches.size > 0 && !searchMatches.has(t.id);

            const isSub = !!t.parentId;
            const radius = isSub ? (5 + priority * 6) : (8 + priority * 10);
            const nodeColor = isRemediated ? "#22c55e" : tactic?.color || "#6366f1";
            const baseOpacity = dimmedNode ? 0.15 : exposure < 0.2 ? 0.3 : isSub ? 0.7 : 1;
            const opacity = searchDimmed ? Math.min(baseOpacity, 0.12) : baseOpacity;

            const chainStrokeColor = isInChain && nodeColors.length === 1 ? CHAIN_COLORS[nodeColors[0]].color : null;

            return (
              <g key={t.id}
                onMouseDown={(e) => handleNodeMouseDown(e, t.id)}
                onMouseEnter={(e) => {
                  clearTimeout(tooltipHideTimeout.current!);
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
                <circle cx={pos.x} cy={pos.y} r={radius + 3}
                  fill="none" stroke={exposure > 0.7 ? "#ef4444" : exposure > 0.4 ? "#f59e0b" : "#22c55e"}
                  strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray={exposure * 20 + " " + (1 - exposure) * 20}
                />
                {profileExposures && profileExposures[t.id] && profileExposures[t.id].coverageSources.length > 0 && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 5.5}
                    fill="none" stroke="#8b5cf6" strokeWidth={1} strokeOpacity={0.45}
                    strokeDasharray="2,3"
                  />
                )}
                {isOptimal && !isRemediated && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 7}
                    fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2,2"
                    opacity={0.8}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {gapNodes && gapNodes.has(t.id) && !isRemediated && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 5}
                    fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,3"
                    opacity={0.7}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={pos.x} cy={pos.y} r={radius}
                  fill={nodeColor} fillOpacity={isRemediated ? 0.3 : 0.8}
                  stroke={isSelected ? "#fff" : chainStrokeColor || "transparent"}
                  strokeWidth={isSelected ? 2 : isInChain ? 1.5 : 0}
                  filter={isSelected || isInChain ? "url(#glow)" : "none"}
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
                      filter="url(#glow)"
                    />
                  ));
                })()}
                {cc > 0 && !dimmedNode && (
                  <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    {cc}
                  </text>
                )}
                {isRemediated && (
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">{"\u2713"}</text>
                )}
                <text x={pos.x} y={pos.y + radius + 11} textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="monospace">
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
        const htTactic = (tactics || TACTICS).find(ta => ta.id === ht.tactic);
        const htExposure = exposures[hoveredNode] ?? 1.0;
        const htBetweenness = betweenness[hoveredNode] ?? 0;
        const htChainCount = chainCoverage[hoveredNode] ?? 0;
        const htDesc = techDescriptions?.[hoveredNode];
        const htSummary = htDesc ? (typeof htDesc === 'string' ? htDesc : htDesc.summary) : null;
        const TOOLTIP_TRUNC = 150;
        const needsMore = htSummary && htSummary.length > TOOLTIP_TRUNC;
        const displaySummary = htSummary && (!needsMore || tooltipExpanded) ? htSummary
          : htSummary ? htSummary.slice(0, htSummary.lastIndexOf(' ', TOOLTIP_TRUNC) || TOOLTIP_TRUNC) + '...' : null;
        return (
          <div
            onMouseEnter={() => { tooltipHoveredRef.current = true; clearTimeout(tooltipHideTimeout.current!); }}
            onMouseLeave={() => { tooltipHoveredRef.current = false; clearTooltip(); }}
            style={{
              position: "absolute", left: tooltipPos.x, top: tooltipPos.y,
              background: theme.colors.bgSurface + "f0", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.lg,
              padding: "12px 16px", pointerEvents: "auto", zIndex: 30,
              maxWidth: tooltipExpanded ? 420 : 320, fontSize: theme.fontSizes.body, color: theme.colors.textBody,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{ht.name}</div>
            <div style={{ color: htTactic?.color, fontSize: theme.fontSizes.base, marginBottom: 6 }}>{htTactic?.name}</div>
            {displaySummary && (
              <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, lineHeight: "1.5", marginBottom: needsMore ? 4 : 8, borderTop: "1px solid " + theme.colors.border, paddingTop: 6 }}>
                {displaySummary}
              </div>
            )}
            {needsMore && (
              <div style={{ textAlign: "right", marginBottom: 4 }}>
                <span onClick={() => setTooltipExpanded(prev => !prev)} style={{
                  fontSize: theme.fontSizes.small, color: theme.colors.blue, cursor: "pointer", userSelect: "none",
                }}>{tooltipExpanded ? "\u25B2 LESS" : "\u25BC MORE"}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: theme.fontSizes.base }}>
              <span style={{ color: theme.colors.textMuted }}>Exposure</span>
              <span style={{ color: htExposure > 0.7 ? theme.colors.red : htExposure > 0.4 ? theme.colors.orange : theme.colors.green }}>{(htExposure * 100).toFixed(0)}%</span>
              <span style={{ color: theme.colors.textMuted }}>Betweenness</span>
              <span style={{ color: theme.colors.blue }}>{(htBetweenness * 100).toFixed(1)}%</span>
              <span style={{ color: theme.colors.textMuted }}>Chains</span>
              <span style={{ color: theme.colors.indigo }}>{htChainCount}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
