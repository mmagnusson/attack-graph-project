import React from 'react';

interface AnalysisCardProps {
  title: string;
  children: React.ReactNode;
}

export function AnalysisCard({ title, children }: AnalysisCardProps) {
  return (
    <div style={{
      background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "6px", padding: "12px",
    }}>
      <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, marginBottom: "8px", letterSpacing: "0.5px" }}>{title}</div>
      <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.5" }}>{children}</div>
    </div>
  );
}
