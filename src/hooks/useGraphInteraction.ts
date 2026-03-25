// ─── useGraphInteraction — divider drag, collapse, search, panel layout ──────

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface UseGraphInteractionArgs {
  displayTechniques: any[];
}

export function useGraphInteraction({ displayTechniques }: UseGraphInteractionArgs) {
  const [panelHeight, setPanelHeight] = useState(300);
  const [showBottomPanels, setShowBottomPanels] = useState(true);
  const isDraggingDivider = useRef(false);

  const [collapsedTactics, setCollapsedTactics] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem("attackBreaker_collapsed");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });

  const [techSearchQuery, setTechSearchQuery] = useState("");
  const [popoutGraph, setPopoutGraph] = useState(false);

  // Divider drag effect
  const updatePanelHeight = useCallback((clientY: number) => {
    const container = document.getElementById('split-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newH = Math.max(60, Math.min(rect.height - 60, rect.bottom - clientY));
    setPanelHeight(newH);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingDivider.current) return;
      updatePanelHeight(e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingDivider.current) return;
      e.preventDefault();
      updatePanelHeight(e.touches[0].clientY);
    };
    const onUp = () => {
      isDraggingDivider.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [updatePanelHeight]);

  const startDividerDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const startDividerDragTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    document.body.style.userSelect = 'none';
  }, []);

  const handleToggleCollapse = useCallback((tacId: string) => {
    setCollapsedTactics(prev => {
      const next = new Set(prev);
      if (next.has(tacId)) next.delete(tacId); else next.add(tacId);
      try { localStorage.setItem("attackBreaker_collapsed", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const techSearchMatches = useMemo(() => {
    if (!techSearchQuery.trim()) return null;
    const q = techSearchQuery.toLowerCase().trim();
    const matches = new Set<string>();
    displayTechniques.forEach((t: any) => {
      if (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) matches.add(t.id);
    });
    return matches;
  }, [techSearchQuery, displayTechniques]);

  const resetGraphInteraction = useCallback(() => {
    setTechSearchQuery("");
    setCollapsedTactics(new Set());
    setPanelHeight(300);
    setShowBottomPanels(true);
    setPopoutGraph(false);
  }, []);

  return {
    panelHeight, setPanelHeight,
    showBottomPanels, setShowBottomPanels,
    collapsedTactics, setCollapsedTactics,
    techSearchQuery, setTechSearchQuery,
    popoutGraph, setPopoutGraph,
    startDividerDrag, startDividerDragTouch, handleToggleCollapse,
    techSearchMatches, resetGraphInteraction,
  };
}
