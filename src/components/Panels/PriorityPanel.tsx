// ─── PriorityPanel — Remediation priority ranking ──

import { PopoutButton } from '../Analysis';

interface PriorityPanelProps {
  priorityRanking: any[];
  selectedTech: string | null;
  setSelectedTech: (v: string | null) => void;
  toggleRemediate: (techId: string) => void;
  optimal: { selected: string[] };
  popoutPriority: boolean;
  setPopoutPriority: (v: boolean) => void;
}

export function PriorityPanel({
  priorityRanking, selectedTech, setSelectedTech,
  toggleRemediate, optimal,
  popoutPriority, setPopoutPriority,
}: PriorityPanelProps) {
  return (
    <>
      <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
        Remediation Priority
        {!popoutPriority && <PopoutButton onClick={() => setPopoutPriority(true)} title="Pop out Priority" />}
      </h3>
      {priorityRanking.map((t: any, i: number) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", marginBottom: "3px",
          borderRadius: "4px", background: selectedTech === t.id ? "#1e293b" : "transparent",
          cursor: "pointer",
        }} onClick={() => { setSelectedTech(t.id); }}>
          <span style={{ fontSize: "10px", color: "#475569", width: "16px" }}>#{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "#f8fafc" }}>{t.id}</div>
            <div style={{ fontSize: "8px", color: "#64748b" }}>{t.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700 }}>{(t.priority * 100).toFixed(0)}</div>
            <div style={{ fontSize: "7px", color: "#475569" }}>
              E:{(t.exposure * 100).toFixed(0)} B:{(t.betweennessVal * 100).toFixed(0)} C:{t.chainCount}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleRemediate(t.id); }}
            style={{
              background: optimal.selected.includes(t.id) ? "#f59e0b" : "#334155",
              color: optimal.selected.includes(t.id) ? "#0a0f1a" : "#94a3b8",
              border: "none", borderRadius: "3px", padding: "3px 6px",
              fontSize: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
            }}>
            FIX
          </button>
        </div>
      ))}
    </>
  );
}
