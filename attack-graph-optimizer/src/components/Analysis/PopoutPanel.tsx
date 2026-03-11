import React, { useState, useEffect, useRef } from 'react';
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
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const winRef = useRef<Window | null>(null);

  useEffect(() => {
    const w = width || 500;
    const h = height || 600;
    const win = window.open('', '', 'width=' + w + ',height=' + h);
    if (!win) { onClose(); return; }
    winRef.current = win;
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
    setContainer(div);

    const poll = setInterval(() => { if (win.closed) { clearInterval(poll); onClose(); } }, 300);
    return () => { clearInterval(poll); setContainer(null); if (!win.closed) win.close(); };
  }, []);

  useEffect(() => {
    if (winRef.current && !winRef.current.closed) winRef.current.document.title = title || 'Panel';
  }, [title]);

  if (!container) return null;
  return ReactDOM.createPortal(children, container);
}
