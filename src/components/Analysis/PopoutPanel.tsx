import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface PopoutPanelProps {
  title?: string;
  width?: number;
  height?: number;
  onClose: () => void;
  children: React.ReactNode;
  graphMode?: boolean;
}

export function PopoutPanel({ title, width, height, onClose, children, graphMode }: PopoutPanelProps) {
  const w = width || 500;
  const h = height || 600;

  // ─── ALL hooks must be declared before any conditional returns ─────────────

  // Detached window state
  const [detachedWin, setDetachedWin] = useState<Window | null>(null);
  const [detachedContainer, setDetachedContainer] = useState<HTMLDivElement | null>(null);

  // Overlay position/size state (always declared, only used in overlay mode)
  const [pos, setPos] = useState(() => ({
    x: Math.max(20, Math.round((window.innerWidth - w) / 2)),
    y: Math.max(20, Math.round((window.innerHeight - h) / 2 - 40)),
  }));
  const [size, setSize] = useState({ w, h });
  const [maximized, setMaximized] = useState(false);
  const preMaxRef = useRef({ pos, size: { w, h } });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // Called directly from click handler → browser allows the popup
  const detachToWindow = useCallback(() => {
    const win = window.open('', '', 'width=' + w + ',height=' + h);
    if (!win) return; // blocked — stay in overlay mode
    win.document.title = title || 'Panel';
    const link = win.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap';
    win.document.head.appendChild(link);
    const style = win.document.createElement('style');
    style.textContent =
      '*{margin:0;padding:0;box-sizing:border-box}' +
      'body{background:#0a0f1a;color:#e2e8f0;font-family:"JetBrains Mono","Fira Code","SF Mono",monospace}' +
      '::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}' +
      '::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}' +
      '::-webkit-scrollbar-thumb:hover{background:#334155}';
    win.document.head.appendChild(style);
    const div = win.document.createElement('div');
    div.style.cssText = graphMode ? 'height:100vh;overflow:hidden;padding:0' : 'padding:12px 16px;height:100vh;overflow:auto';
    win.document.body.appendChild(div);
    setDetachedWin(win);
    setDetachedContainer(div);
  }, [w, h, title, graphMode]);

  // Poll detached window for closure
  useEffect(() => {
    if (!detachedWin) return;
    const poll = setInterval(() => {
      if (detachedWin.closed) { clearInterval(poll); onClose(); }
    }, 300);
    return () => { clearInterval(poll); };
  }, [detachedWin, onClose]);

  // Update detached window title
  useEffect(() => {
    if (detachedWin && !detachedWin.closed) detachedWin.document.title = title || 'Panel';
  }, [detachedWin, title]);

  // Cleanup detached window on unmount
  useEffect(() => {
    return () => {
      if (detachedWin && !detachedWin.closed) detachedWin.close();
    };
  }, [detachedWin]);

  // Drag handler
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (maximized) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos({ x: dragRef.current.origX + dx, y: Math.max(0, dragRef.current.origY + dy) });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos, maximized]);

  // Resize handler
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    if (maximized) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = ev.clientX - resizeRef.current.startX;
      const dh = ev.clientY - resizeRef.current.startY;
      setSize({
        w: Math.max(300, resizeRef.current.origW + dw),
        h: Math.max(200, resizeRef.current.origH + dh),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size, maximized]);

  const toggleMaximize = useCallback(() => {
    if (maximized) {
      setPos(preMaxRef.current.pos);
      setSize(preMaxRef.current.size);
      setMaximized(false);
    } else {
      preMaxRef.current = { pos, size };
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight });
      setMaximized(true);
    }
  }, [maximized, pos, size]);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ─── Render: detached mode ─────────────────────────────────────────────────

  if (detachedWin && detachedContainer && !detachedWin.closed) {
    return ReactDOM.createPortal(children, detachedContainer);
  }

  // ─── Render: overlay mode ─────────────────────────────────────────────────

  const actualW = maximized ? window.innerWidth : size.w;
  const actualH = maximized ? window.innerHeight : size.h;
  const actualX = maximized ? 0 : pos.x;
  const actualY = maximized ? 0 : pos.y;

  const titleBarBtnStyle = {
    background: "transparent", border: "1px solid #475569", borderRadius: 3,
    color: "#94a3b8", cursor: "pointer", width: 22, height: 22, fontSize: 12,
    fontFamily: "inherit", display: "flex" as const, alignItems: "center" as const,
    justifyContent: "center" as const, padding: 0, lineHeight: 1,
  };

  return (
    <div style={{
      position: "fixed", left: actualX, top: actualY, width: actualW, height: actualH,
      zIndex: 9999, display: "flex", flexDirection: "column",
      background: "#0a0f1a", border: maximized ? "none" : "1px solid #334155",
      borderRadius: maximized ? 0 : 6, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      overflow: "hidden",
    }}>
      {/* Title bar */}
      <div onMouseDown={onDragStart} onDoubleClick={toggleMaximize}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px", background: "#1e293b", cursor: maximized ? "default" : "move",
          flexShrink: 0, userSelect: "none", borderBottom: "1px solid #334155",
        }}>
        <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title || "Panel"}
        </span>
        <button onClick={detachToWindow} title="Detach to new window"
          style={titleBarBtnStyle}>{"\u2197"}</button>
        <button onClick={toggleMaximize} title={maximized ? "Restore" : "Maximize"}
          style={titleBarBtnStyle}>{maximized ? "\u29C9" : "\u25A1"}</button>
        <button onClick={onClose} title="Close (Esc)"
          style={{
            ...titleBarBtnStyle,
            border: "1px solid #ef444466", color: "#ef4444", fontSize: 14,
          }}>{"\u00D7"}</button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflow: graphMode ? "hidden" : "auto",
        padding: graphMode ? 0 : "12px 16px", minHeight: 0,
      }}>
        {children}
      </div>

      {/* Resize handle */}
      {!maximized && (
        <div onMouseDown={onResizeStart}
          style={{
            position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
            cursor: "nwse-resize", zIndex: 1,
          }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ opacity: 0.4 }}>
            <line x1="14" y1="4" x2="4" y2="14" stroke="#64748b" strokeWidth="1.5" />
            <line x1="14" y1="8" x2="8" y2="14" stroke="#64748b" strokeWidth="1.5" />
            <line x1="14" y1="12" x2="12" y2="14" stroke="#64748b" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
}
