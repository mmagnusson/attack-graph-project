// ─── ChainsPanel — Attack chains list with search, profiles, and comparison ──

import { CHAIN_COLORS } from '../../data/constants';
import { PopoutButton } from '../Analysis';

interface ChainsPanelProps {
  filteredChains: any[];
  displayedChainStatus: any[];
  highlightedChains: any[];
  toggleHighlightedChain: (chain: any) => void;
  remediated: Set<string>;
  effectiveExposures: Record<string, number>;
  chainSearchQuery: string;
  setChainSearchQuery: (v: string) => void;
  popoutChains: boolean;
  setPopoutChains: (v: boolean) => void;
  setCustomChains: (fn: (prev: any[]) => any[]) => void;
  expandedChainProfile: string | null;
  setExpandedChainProfile: (fn: (prev: string | null) => string | null) => void;
  activeGroupProfiles: Record<string, any>;
  chainSetAnalysis: any;
}

export function ChainsPanel({
  filteredChains, displayedChainStatus, highlightedChains, toggleHighlightedChain,
  remediated, effectiveExposures,
  chainSearchQuery, setChainSearchQuery,
  popoutChains, setPopoutChains,
  setCustomChains,
  expandedChainProfile, setExpandedChainProfile,
  activeGroupProfiles, chainSetAnalysis,
}: ChainsPanelProps) {
  return (
    <>
      <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
        Attack Chains ({filteredChains.length})
        {!popoutChains && <PopoutButton onClick={() => setPopoutChains(true)} title="Pop out Attack Chains" />}
      </h3>
      <div style={{ position: "relative", marginBottom: "8px" }}>
        <input type="text" value={chainSearchQuery} onChange={e => setChainSearchQuery(e.target.value)}
          placeholder="Search chains..."
          style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 24px 4px 8px", fontSize: "10px", fontFamily: "inherit", width: "100%" }} />
        {chainSearchQuery && (
          <button onClick={() => setChainSearchQuery("")} style={{
            position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#64748b",
            cursor: "pointer", fontSize: "11px", lineHeight: 1, padding: "2px",
          }}>{"\u2715"}</button>
        )}
      </div>
      {displayedChainStatus.map((chain: any, i: number) => {
        const activeIdx = highlightedChains.findIndex((c: any) => c.name === chain.name);
        const isActive = activeIdx >= 0;
        const activeColor = isActive ? CHAIN_COLORS[activeIdx].color : null;
        return (
          <div key={i}
            onClick={() => toggleHighlightedChain(chain)}
            style={{
              padding: "8px 10px", marginBottom: "4px", borderRadius: "4px", cursor: "pointer",
              background: isActive ? "#1e293b" : "transparent",
              border: "1px solid " + (isActive ? activeColor + "66" : chain.broken ? "#22c55e33" : "#ef444433"),
              opacity: chain.broken ? 0.6 : 1,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: chain.broken ? "#22c55e" : "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
                {isActive && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: activeColor as any, flexShrink: 0 }} />}
                {chain.broken ? "\u2713 " : "\u26A0 "}{chain.name}
                {chain.custom && <span style={{ fontSize: "7px", color: "#a855f7", background: "#a855f715", padding: "1px 4px", borderRadius: 3, marginLeft: 6, fontWeight: 700 }}>CUSTOM</span>}
              </span>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{
                  fontSize: "9px", padding: "1px 6px", borderRadius: "8px",
                  background: chain.severity > 0.85 ? "#ef444430" : "#f59e0b30",
                  color: chain.severity > 0.85 ? "#ef4444" : "#f59e0b",
                }}>
                  {(chain.severity * 100).toFixed(0)}%
                </span>
                {chain.custom && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setCustomChains(prev => {
                      const next = prev.filter((c: any) => c.name !== chain.name || c.path.join(",") !== chain.path.join(","));
                      try { localStorage.setItem("attackBreaker_customChains", JSON.stringify(next)); } catch(e) {}
                      return next;
                    });
                  }} style={{
                    background: "transparent", color: "#ef4444", border: "none", fontSize: "10px",
                    cursor: "pointer", padding: "0 2px", lineHeight: 1,
                  }}>{"\u2715"}</button>
                )}
              </div>
            </div>
            <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>{chain.description}</div>
            <div style={{ fontSize: "8px", color: "#475569", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "2px" }}>
              {chain.path.map((tid: string, j: number) => (
                <span key={j} style={{
                  padding: "1px 3px", borderRadius: "2px",
                  background: remediated.has(tid) ? "#22c55e20" : (effectiveExposures[tid] ?? 1) > 0.7 ? "#ef444420" : "#1e293b",
                  color: remediated.has(tid) ? "#22c55e" : (effectiveExposures[tid] ?? 1) > 0.7 ? "#ef4444" : "#94a3b8",
                  textDecoration: remediated.has(tid) ? "line-through" : "none",
                }}>
                  {tid}{j < chain.path.length - 1 ? " \u2192" : ""}
                </span>
              ))}
            </div>
            {chain.broken && chain.breakpoints.length > 0 && (
              <div style={{ fontSize: "8px", color: "#22c55e", marginTop: "3px" }}>
                Broken at: {chain.breakpoints.join(", ")}
              </div>
            )}
            {/* Threat Actor Profile toggle */}
            {activeGroupProfiles[chain.name] && (
              <>
                <div style={{ marginTop: "4px" }}>
                  <span onClick={(e) => { e.stopPropagation(); setExpandedChainProfile(prev => prev === chain.name ? null : chain.name); }}
                    style={{ fontSize: "7px", color: "#64748b", cursor: "pointer", userSelect: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {expandedChainProfile === chain.name ? "\u25B2 HIDE PROFILE" : "\u25BC SHOW PROFILE"}
                  </span>
                </div>
                {expandedChainProfile === chain.name && (() => {
                  const prof = activeGroupProfiles[chain.name];
                  return (
                    <div style={{
                      marginTop: "6px", padding: "8px", background: "#0a0f1a", border: "1px solid #1e293b",
                      borderRadius: "4px", fontSize: "8px", color: "#94a3b8",
                    }}>
                      {prof.country && <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Origin:</span> <span style={{ color: "#e2e8f0" }}>{prof.country}</span></div>}
                      {prof.aliases && prof.aliases.length > 0 && <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Aliases:</span> {prof.aliases.slice(0, 5).join(", ")}</div>}
                      {(prof.firstSeen || prof.lastSeen) && <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Active:</span> {prof.firstSeen || "?"} — {prof.lastSeen || "present"}</div>}
                      {prof.sectors && prof.sectors.length > 0 && (
                        <div style={{ marginBottom: "3px" }}><span style={{ color: "#64748b" }}>Targeting:</span> {prof.sectors.join(", ")}</div>
                      )}
                      {prof.description && <div style={{ marginTop: "4px", lineHeight: "1.4", color: "#cbd5e1" }}>{prof.description}</div>}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        );
      })}

      {/* Chain Uniqueness Comparison */}
      {chainSetAnalysis && (
        <div style={{
          marginTop: "12px", padding: "10px", background: "#1e293b", borderRadius: "6px",
          border: "1px solid #334155",
        }}>
          <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Chain Comparison</div>
          {chainSetAnalysis.intersection.size > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "8px", color: "#f59e0b", marginBottom: "3px" }}>
                Shared by all ({chainSetAnalysis.intersection.size}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {[...chainSetAnalysis.intersection].map((tid: any) => (
                  <span key={tid} style={{
                    fontSize: "8px", padding: "1px 4px", borderRadius: "2px",
                    background: "#f59e0b20", color: "#f59e0b",
                  }}>{tid}</span>
                ))}
              </div>
              <div style={{ fontSize: "7px", color: "#f59e0b", marginTop: "3px", fontStyle: "italic" }}>
                Fix any to disrupt all {highlightedChains.length} chains
              </div>
            </div>
          )}
          {chainSetAnalysis.uniquePerChain.map(({ name, colorIndex, unique }: any) => {
            if (unique.size === 0) return null;
            const color = CHAIN_COLORS[colorIndex % CHAIN_COLORS.length].color;
            return (
              <div key={name} style={{ marginBottom: "6px" }}>
                <div style={{ fontSize: "8px", color, marginBottom: "2px" }}>Only in {name} ({unique.size}):</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                  {[...unique].map((tid: any) => (
                    <span key={tid} style={{
                      fontSize: "8px", padding: "1px 4px", borderRadius: "2px",
                      background: color + "20", color,
                    }}>{tid}</span>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: "8px", color: "#64748b", marginTop: "6px", borderTop: "1px solid #33415560", paddingTop: "4px" }}>
            Union: {chainSetAnalysis.union.size} | Overlap: {chainSetAnalysis.intersection.size}
          </div>
        </div>
      )}
    </>
  );
}
