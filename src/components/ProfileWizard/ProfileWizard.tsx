import React, { useState, useMemo } from 'react';
import { getKBToolsByCategory, getKBInfraByCategory } from '../../engine/exposureEngine';
import type { CoverageKB, EnvironmentProfile } from '../../types';

interface ProfileWizardProps {
  coverageKB: CoverageKB;
  activeChains: { name: string }[];
  currentProfile: EnvironmentProfile | null;
  onApply: (profile: EnvironmentProfile | null) => void;
  onClose: () => void;
}

export function ProfileWizard({ coverageKB, activeChains, currentProfile, onApply, onClose }: ProfileWizardProps) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState(currentProfile?.organization?.industry || "");
  const [orgSize, setOrgSize] = useState(currentProfile?.organization?.size || "");
  const [compliance, setCompliance] = useState<string[]>(currentProfile?.organization?.compliance || []);
  const [infrastructure, setInfrastructure] = useState<string[]>(currentProfile?.infrastructure || []);
  const [securityTools, setSecurityTools] = useState<string[]>(currentProfile?.securityTools || []);
  const [threatActors, setThreatActors] = useState<string[]>(currentProfile?.threatActors || []);
  const [toolSearch, setToolSearch] = useState("");
  const [infraSearch, setInfraSearch] = useState("");

  const INDUSTRIES = ["Financial Services", "Healthcare", "Government (State/Local)", "Government (Federal)", "Education", "Manufacturing/OT", "Technology", "Retail", "Other"];
  const ORG_SIZES = [{ value: "small", label: "Small (<500)" }, { value: "medium", label: "Medium (500\u20135000)" }, { value: "large", label: "Large (5000+)" }];
  const COMPLIANCE_OPTS = ["NIST CSF", "CMMC", "HIPAA", "PCI-DSS", "SOC 2", "FedRAMP"];

  const toolsByCategory = useMemo(() => getKBToolsByCategory(coverageKB), [coverageKB]);
  const infraByCategory = useMemo(() => getKBInfraByCategory(coverageKB), [coverageKB]);
  const actorList = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const c of activeChains) {
      if (!seen.has(c.name)) { seen.add(c.name); names.push(c.name); }
    }
    return names.sort();
  }, [activeChains]);

  const toggleItem = (_arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleApply = () => {
    const profile: EnvironmentProfile = {
      organization: (industry || orgSize || compliance.length > 0) ? { industry, size: orgSize, compliance } : undefined,
      infrastructure,
      securityTools,
      threatActors: threatActors.length > 0 ? threatActors : undefined,
    };
    onApply(profile);
  };

  const stepBg = "#0d1321";
  const cardStyle = { background: "#111827", border: "1px solid #1e293b", borderRadius: 6, padding: 12, marginBottom: 10 };
  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-block", padding: "4px 10px", margin: "2px 4px 2px 0", borderRadius: 12,
    fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 400,
    background: active ? "#8b5cf620" : "#1e293b", color: active ? "#a78bfa" : "#94a3b8",
    border: active ? "1px solid #8b5cf6" : "1px solid #334155",
  });
  const searchStyle: React.CSSProperties = {
    width: "100%", background: "#0a0f1a", border: "1px solid #334155", borderRadius: 4,
    padding: "6px 8px", color: "#e2e8f0", fontSize: 10, fontFamily: "inherit", marginBottom: 8, outline: "none",
  };

  const filteredTools = useMemo(() => {
    if (!toolSearch.trim()) return toolsByCategory;
    const q = toolSearch.toLowerCase();
    const result: Record<string, any> = {};
    for (const [catId, cat] of Object.entries(toolsByCategory)) {
      const filtered = (cat as any).tools.filter((t: any) => t.display_name.toLowerCase().includes(q) || t.id.includes(q));
      if (filtered.length > 0) result[catId] = { ...cat, tools: filtered };
    }
    return result;
  }, [toolsByCategory, toolSearch]);

  const filteredInfra = useMemo(() => {
    if (!infraSearch.trim()) return infraByCategory;
    const q = infraSearch.toLowerCase();
    const result: Record<string, any> = {};
    for (const [catId, cat] of Object.entries(infraByCategory)) {
      const filtered = (cat as any).items.filter((t: any) => t.display_name.toLowerCase().includes(q) || t.id.includes(q));
      if (filtered.length > 0) result[catId] = { ...cat, items: filtered };
    }
    return result;
  }, [infraByCategory, infraSearch]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: stepBg, border: "1px solid #1e293b", borderRadius: 8, width: 560, maxHeight: "85vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Environment Profile</div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>Step {step} of 5 — {["Organization", "Infrastructure", "Security Tools", "Threat Context", "Review"][step - 1]}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>{"\u2715"}</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#1e293b" }}>
          <div style={{ height: "100%", width: (step / 5 * 100) + "%", background: "#8b5cf6", transition: "width 0.2s" }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {step === 1 && (
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Optional — helps tailor threat intelligence and compliance recommendations.</div>
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Industry</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {INDUSTRIES.map(ind => (
                    <span key={ind} style={pillStyle(industry === ind)} onClick={() => setIndustry(industry === ind ? "" : ind)}>{ind}</span>
                  ))}
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Organization Size</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {ORG_SIZES.map(s => (
                    <span key={s.value} style={pillStyle(orgSize === s.value)} onClick={() => setOrgSize(orgSize === s.value ? "" : s.value)}>{s.label}</span>
                  ))}
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Compliance Frameworks</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {COMPLIANCE_OPTS.map(c => (
                    <span key={c} style={pillStyle(compliance.includes(c))} onClick={() => toggleItem(compliance, setCompliance, c)}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>Select your infrastructure. Each adds relevant attack surface to the analysis.</div>
              <input type="text" placeholder="Search infrastructure..." value={infraSearch} onChange={e => setInfraSearch(e.target.value)} style={searchStyle} />
              {Object.entries(filteredInfra).map(([catId, cat]: [string, any]) => (
                <div key={catId} style={cardStyle}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{cat.icon} {cat.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {cat.items.map((item: any) => (
                      <span key={item.id} style={pillStyle(infrastructure.includes(item.id))} onClick={() => toggleItem(infrastructure, setInfrastructure, item.id)}>
                        {item.display_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {infrastructure.length > 0 && (
                <div style={{ fontSize: 9, color: "#8b5cf6", marginTop: 4 }}>{infrastructure.length} selected</div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>Select your deployed security tools. These reduce technique exposure based on detection/prevention capabilities.</div>
              <input type="text" placeholder="Search tools... (e.g. 'crowd', 'splunk')" value={toolSearch} onChange={e => setToolSearch(e.target.value)} style={searchStyle} />
              {Object.entries(filteredTools).map(([catId, cat]: [string, any]) => (
                <div key={catId} style={cardStyle}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{cat.icon} {cat.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {cat.tools.map((tool: any) => (
                      <span key={tool.id} style={pillStyle(securityTools.includes(tool.id))} onClick={() => toggleItem(securityTools, setSecurityTools, tool.id)}>
                        {tool.display_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {securityTools.length > 0 && (
                <div style={{ fontSize: 9, color: "#8b5cf6", marginTop: 4 }}>{securityTools.length} tools selected</div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Optional — weight the analysis toward specific threat actors from your chain data.</div>
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Threat Actors of Concern</div>
                {actorList.length === 0 ? (
                  <div style={{ fontSize: 9, color: "#475569" }}>No threat actor chains loaded. Load STIX data or use the built-in dataset.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {actorList.map(name => (
                      <span key={name} style={pillStyle(threatActors.includes(name))} onClick={() => toggleItem(threatActors, setThreatActors, name)}>{name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Review your environment profile before generating the coverage analysis.</div>
              {(industry || orgSize) && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Organization</div>
                  {industry && <div style={{ fontSize: 10, color: "#e2e8f0" }}>Industry: {industry}</div>}
                  {orgSize && <div style={{ fontSize: 10, color: "#e2e8f0" }}>Size: {ORG_SIZES.find(s => s.value === orgSize)?.label}</div>}
                  {compliance.length > 0 && <div style={{ fontSize: 10, color: "#e2e8f0" }}>Compliance: {compliance.join(", ")}</div>}
                </div>
              )}
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Infrastructure ({infrastructure.length})</div>
                {infrastructure.length === 0 ? (
                  <div style={{ fontSize: 9, color: "#475569" }}>None selected</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {infrastructure.map(id => {
                      const item = (coverageKB as any).infrastructure[id];
                      return <span key={id} style={{ ...pillStyle(true), cursor: "default" }}>{item?.display_name || id}</span>;
                    })}
                  </div>
                )}
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Security Tools ({securityTools.length})</div>
                {securityTools.length === 0 ? (
                  <div style={{ fontSize: 9, color: "#475569" }}>None selected</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {securityTools.map(id => {
                      const tool = (coverageKB as any).tools[id];
                      return <span key={id} style={{ ...pillStyle(true), cursor: "default" }}>{tool?.display_name || id}</span>;
                    })}
                  </div>
                )}
              </div>
              {threatActors.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Threat Actors ({threatActors.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {threatActors.map(name => <span key={name} style={{ ...pillStyle(true), cursor: "default" }}>{name}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={{
                background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 4,
                padding: "6px 14px", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
              }}>Back</button>
            )}
            {(step === 1 || step === 4) && (
              <button onClick={() => setStep(step + 1)} style={{
                background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 4,
                padding: "6px 14px", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
              }}>Skip</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {currentProfile && (
              <button onClick={() => { onApply(null); }} style={{
                background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 4,
                padding: "6px 14px", fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
              }}>Clear Profile</button>
            )}
            {step < 5 ? (
              <button onClick={() => setStep(step + 1)} style={{
                background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 4,
                padding: "6px 18px", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Next</button>
            ) : (
              <button onClick={handleApply} style={{
                background: "#22c55e", color: "#0a0f1a", border: "none", borderRadius: 4,
                padding: "6px 18px", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Generate Analysis</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
