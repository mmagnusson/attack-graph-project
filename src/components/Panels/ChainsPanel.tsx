// ─── ChainsPanel — Attack chains list with search, profiles, and comparison ──

import { CHAIN_COLORS } from '../../data/constants';
import { PopoutButton } from '../Analysis';
import { theme } from '../../theme';

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
      <h3 style={{ ...theme.panelHeading }}>
        Attack Chains ({filteredChains.length})
        {!popoutChains && <PopoutButton onClick={() => setPopoutChains(true)} title="Pop out Attack Chains" />}
      </h3>
      <div style={{ position: "relative", marginBottom: theme.spacing.lg }}>
        <input type="text" value={chainSearchQuery} onChange={e => setChainSearchQuery(e.target.value)}
          placeholder="Search chains..."
          style={{ ...theme.inputBase, padding: "6px 28px 6px 10px", width: "100%" }} />
        {chainSearchQuery && (
          <button onClick={() => setChainSearchQuery("")} style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: theme.colors.textMuted,
            cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "4px",
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
              padding: "10px 12px", marginBottom: theme.spacing.sm, borderRadius: theme.radii.sm, cursor: "pointer",
              background: isActive ? theme.colors.bgSurface : "transparent",
              border: "1px solid " + (isActive ? activeColor + "66" : chain.broken ? "#22c55e33" : "#ef444433"),
              opacity: chain.broken ? 0.6 : 1,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: theme.fontSizes.body, fontWeight: 600, color: chain.broken ? theme.colors.green : theme.colors.textPrimary, display: "flex", alignItems: "center", gap: theme.spacing.md }}>
                {isActive && <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: theme.radii.round, background: activeColor as any, flexShrink: 0 }} />}
                {chain.broken ? "\u2713 " : "\u26A0 "}{chain.name}
                {chain.custom && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.purple, background: "#a855f715", padding: "2px 6px", borderRadius: theme.radii.sm, marginLeft: 8, fontWeight: 700 }}>CUSTOM</span>}
              </span>
              <div style={{ display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
                <span style={{
                  fontSize: theme.fontSizes.small, padding: "3px 8px", borderRadius: theme.radii.pill,
                  background: chain.severity > 0.85 ? "#ef444430" : "#f59e0b30",
                  color: chain.severity > 0.85 ? theme.colors.red : theme.colors.orange,
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
                    background: "transparent", color: theme.colors.red, border: "none", fontSize: theme.fontSizes.base,
                    cursor: "pointer", padding: "0 4px", lineHeight: 1,
                  }}>{"\u2715"}</button>
                )}
              </div>
            </div>
            <div style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>{chain.description}</div>
            <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint, marginTop: theme.spacing.sm, display: "flex", flexWrap: "wrap", gap: theme.spacing.xs }}>
              {chain.path.map((tid: string, j: number) => (
                <span key={j} style={{
                  padding: "2px 5px", borderRadius: theme.radii.sm,
                  background: remediated.has(tid) ? "#22c55e20" : (effectiveExposures[tid] ?? 1) > 0.7 ? "#ef444420" : theme.colors.bgSurface,
                  color: remediated.has(tid) ? theme.colors.green : (effectiveExposures[tid] ?? 1) > 0.7 ? theme.colors.red : theme.colors.textSecondary,
                  textDecoration: remediated.has(tid) ? "line-through" : "none",
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {tid}{j < chain.path.length - 1 ? " \u2192" : ""}
                </span>
              ))}
            </div>
            {chain.broken && chain.breakpoints.length > 0 && (
              <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.green, marginTop: theme.spacing.xs }}>
                Broken at: {chain.breakpoints.join(", ")}
              </div>
            )}
            {/* Threat Actor Profile toggle */}
            {activeGroupProfiles[chain.name] && (
              <>
                <div style={{ marginTop: theme.spacing.sm }}>
                  <span onClick={(e) => { e.stopPropagation(); setExpandedChainProfile(prev => prev === chain.name ? null : chain.name); }}
                    style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textMuted, cursor: "pointer", userSelect: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {expandedChainProfile === chain.name ? "\u25B2 HIDE PROFILE" : "\u25BC SHOW PROFILE"}
                  </span>
                </div>
                {expandedChainProfile === chain.name && (() => {
                  const prof = activeGroupProfiles[chain.name];
                  return (
                    <div style={{
                      marginTop: theme.spacing.md, padding: theme.spacing.lg, background: theme.colors.bg, border: "1px solid " + theme.colors.borderSubtle,
                      borderRadius: theme.radii.sm, fontSize: theme.fontSizes.tiny, color: theme.colors.textSecondary,
                    }}>
                      {prof.country && <div style={{ marginBottom: theme.spacing.xs }}><span style={{ color: theme.colors.textMuted }}>Origin:</span> <span style={{ color: theme.colors.textBody }}>{prof.country}</span></div>}
                      {prof.aliases && prof.aliases.length > 0 && <div style={{ marginBottom: theme.spacing.xs }}><span style={{ color: theme.colors.textMuted }}>Aliases:</span> {prof.aliases.slice(0, 5).join(", ")}</div>}
                      {(prof.firstSeen || prof.lastSeen) && <div style={{ marginBottom: theme.spacing.xs }}><span style={{ color: theme.colors.textMuted }}>Active:</span> {prof.firstSeen || "?"} — {prof.lastSeen || "present"}</div>}
                      {prof.sectors && prof.sectors.length > 0 && (
                        <div style={{ marginBottom: theme.spacing.xs }}><span style={{ color: theme.colors.textMuted }}>Targeting:</span> {prof.sectors.join(", ")}</div>
                      )}
                      {prof.description && <div style={{ marginTop: theme.spacing.sm, lineHeight: "1.4", color: "#cbd5e1" }}>{prof.description}</div>}
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
          marginTop: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bgSurface, borderRadius: theme.radii.md,
          border: "1px solid " + theme.colors.border,
        }}>
          <div style={{ ...theme.sectionLabel, marginBottom: theme.spacing.md }}>Chain Comparison</div>
          {chainSetAnalysis.intersection.size > 0 && (
            <div style={{ marginBottom: theme.spacing.lg }}>
              <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.orange, marginBottom: theme.spacing.xs }}>
                Shared by all ({chainSetAnalysis.intersection.size}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.xs }}>
                {[...chainSetAnalysis.intersection].map((tid: any) => (
                  <span key={tid} style={{
                    fontSize: theme.fontSizes.tiny, padding: "2px 6px", borderRadius: theme.radii.sm,
                    background: "#f59e0b20", color: theme.colors.orange,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>{tid}</span>
                ))}
              </div>
              <div style={{ fontSize: theme.fontSizes.micro, color: theme.colors.orange, marginTop: theme.spacing.xs, fontStyle: "italic" }}>
                Fix any to disrupt all {highlightedChains.length} chains
              </div>
            </div>
          )}
          {chainSetAnalysis.uniquePerChain.map(({ name, colorIndex, unique }: any) => {
            if (unique.size === 0) return null;
            const color = CHAIN_COLORS[colorIndex % CHAIN_COLORS.length].color;
            return (
              <div key={name} style={{ marginBottom: theme.spacing.md }}>
                <div style={{ fontSize: theme.fontSizes.tiny, color, marginBottom: theme.spacing.xs }}>Only in {name} ({unique.size}):</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: theme.spacing.xs }}>
                  {[...unique].map((tid: any) => (
                    <span key={tid} style={{
                      fontSize: theme.fontSizes.tiny, padding: "2px 6px", borderRadius: theme.radii.sm,
                      background: color + "20", color,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}>{tid}</span>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textMuted, marginTop: theme.spacing.md, borderTop: "1px solid #33415560", paddingTop: theme.spacing.sm }}>
            Union: {chainSetAnalysis.union.size} | Overlap: {chainSetAnalysis.intersection.size}
          </div>
        </div>
      )}
    </>
  );
}
