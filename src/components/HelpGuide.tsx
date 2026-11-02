// ─── HelpGuide — In-app walkthrough and feature reference ──

import { useState } from 'react';
import { theme } from '../theme';

interface HelpGuideProps {
  onClose: () => void;
}

const sections = [
  {
    title: "Getting Started",
    content: `AttackBreaker answers one question: **given a budget, which defenses cut off the most attack paths used by real threat actors?** It works from MITRE ATT&CK v19 — techniques, the threat groups that use them, MITRE's mitigations, and MITRE's detection strategies.

**Quick start:**
1. Open **Defenses (D)** and record what you already have — tick MITRE mitigations and the telemetry you collect, or apply a starting posture (basic hygiene, NIST CSF, CIS IG2…).
2. Open **Plan (P)**, set your annual budget, and read the recommended investments in order.
3. Click any cost to replace the placeholder estimate with a real quote; the plan re-ranks instantly.
4. Tick **Preview plan** to see the graph as if the plan were in place, then **Board report** for a one-page summary.

Residual risk is the expected share of modeled threat actors that could complete every required stage of an intrusion without being contained.`,
  },
  {
    title: "How the Model Works",
    content: `An intrusion has to pass every **required stage** (by default Initial Access, Execution, Command & Control, and an Objective — Exfiltration or Impact). At each stage the actor can use **any** technique MITRE has recorded for it, including techniques its malware and tools provide.

- **A stage is an OR:** it only closes when all of the actor's options are covered. One open option keeps it open. This is why blocking a single popular technique rarely stops an actor.
- **The chain is an AND:** closing any one stage stops the actor.
- **Mitigations** lower each technique's chance of working. Additional mitigations on the same technique add less each time.
- **Detection** comes from MITRE's analytics. Each analytic needs specific telemetry (data components); when you collect it, the analytic can raise an alert. Alerts can come from any stage.
- **Response** contains an alerted intrusion with some probability — once per intrusion, so detection alone can never remove more than your response effectiveness.
- **Substitution** — actors sometimes succeed with techniques MITRE hasn't recorded for them, so no stage ever closes completely.

Every assumption is a slider in **Model (M)**, and the plan shows a pessimistic-to-optimistic range.`,
  },
  {
    title: "The Graph",
    content: `Techniques are nodes, arranged in tactic columns from Reconnaissance to Impact.

- **Node size** — share of residual attacker activity flowing through the technique. Block a technique and its share shifts to the actor's alternatives.
- **Orange arc** — residual success chance after mitigations (full ring = 100%).
- **Blue outer arc** — detection coverage from your telemetry and tools.
- **Aqua dot** — at least one mitigation in place.
- **Number** — modeled actors using the technique (sub-techniques rolled up when hidden).
- **Dashed halo** — techniques touched by the defense you're hovering in Plan or Defenses.
- **Red dashes** — blind spots (while the Blind spots panel is open).

Highlight an actor in the Threat actors tab: its techniques light up, lines fan out from its most-used technique to its options at the next stage, and stage markers (✂ cut, ◐ narrowed, ○ open) appear under the columns.

Background lines connect techniques commonly used together in consecutive stages. ATT&CK doesn't record step order, so a line never means "A leads to B".`,
  },
  {
    title: "Plan & Defenses",
    content: `**Plan (P)** — Budget, org size, the headline (residual risk today → with plan), a cost-versus-risk curve, and the ranked investments. Each step adds the defense with the most risk removed per dollar at that point. Items past the budget show what the next dollars would buy. Hover a row to see what it touches on the graph; **In place** records it as done.

**Defenses (D)** — Your current posture.
- Mitigations (prevent) — MITRE's mitigation catalog. Each row shows how many techniques and actors it reaches and the risk it would remove if added alone right now.
- Telemetry (detect) — MITRE data components grouped into purchasable sources (endpoint process telemetry, identity logs, network flow, cloud audit logs…). Expand a source to toggle individual data components.

**Costs are placeholder estimates by tier** — edit them. Telemetry costs assume you also run MITRE's analytics on the data and respond to alerts.`,
  },
  {
    title: "Panels & Tabs",
    content: `**Bottom tabs** (1/2/3, B to hide):
- **Threat actors** — modeled actors, most viable first. Select one for its gate-by-gate breakdown: each stage's chance of passing and of going unnoticed, every option it can switch between, and the best next defenses against that actor.
- **Hotspots** — techniques carrying the most residual attacker activity, with an Assume blocked what-if.
- **Detail** — the selected technique: MITRE mitigations (tick to record), MITRE's detection strategy with each analytic, its platforms and the data components it needs (click to mark collected), your tools' estimated coverage, and the actors who use it.

**Sidebar** (stays docked beside the graph):
- **Plan (P)**, **Defenses (D)**, **Model (M)**
- **Blind spots (G)** — techniques in required stages with activity but no mitigation in place and no telemetry.
- **Executive (X)** — leadership summary and board report.`,
  },
  {
    title: "Data & Settings",
    content: `**Header** (press H):
- **Framework** — Enterprise or ICS/OT ATT&CK.
- **Data** — the bundled MITRE ATT&CK v19 dataset, or a STIX 2.1 bundle you upload (a newer ATT&CK release or your own CTI).
- **Base exposure** — presets for how exposed techniques are before modeled defenses. Prefer "Unassessed" when you record defenses explicitly, or controls get counted twice.
- **Platforms** — filters techniques and MITRE analytics (a Windows-only shop isn't credited for Linux analytics).
- **Actors targeting** — sector tags derived from MITRE group descriptions.

**MORE menu:** sub-techniques, environment profile (infrastructure, tools, actors of concern — tool scores are author estimates), IT/OT compare, custom chain builder, exports (board report, plan CSV, analysis CSV, Navigator layer) and Navigator import.

**Share** copies a link with your posture, budget and settings. Everything else is saved in this browser.`,
  },
  {
    title: "Keyboard Shortcuts",
    content: `**Panels:**
- **P** Plan · **D** (or S) Defenses · **M** Model · **G** Blind spots · **X** Executive
- **Esc** — close the sidebar
- **1 / 2 / 3** — Threat actors / Hotspots / Detail

**View:**
- **H** — collapse/expand the header toolbar
- **B** — show/hide the bottom panels

Shortcuts are ignored while you're typing in a field.`,
  },
  {
    title: "Limits & Honesty",
    content: `- **A planning model, not a guarantee.** Results depend on the assumptions in Model; the plan always shows a range.
- **ATT&CK is incomplete.** Actors use techniques MITRE hasn't documented — that's what the substitution rate stands for.
- **Mitigation mappings are coarse.** MITRE maps one mitigation to many techniques without saying how well it works for each; the model uses one effectiveness value for all.
- **Detection assumes analytics.** Collecting telemetry only helps if MITRE's analytics (or equivalents) run on it and someone responds.
- **Costs are placeholders** until you edit them.
- **Tool coverage scores** in the environment profile are author estimates, not MITRE Evaluations results.
- **Sector and attribution tags** are keyword-derived from MITRE descriptions.`,
  },
];

export function HelpGuide({ onClose }: HelpGuideProps) {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: theme.colors.bgPanel, border: "1px solid " + theme.colors.border, borderRadius: theme.radii.lg,
        width: "min(900px, 90vw)", maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px", borderBottom: "1px solid " + theme.colors.borderSubtle,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: theme.colors.textPrimary }}>
              AttackBreaker Guide
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>
              How to use the app and understand its features
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
            color: theme.colors.textSecondary, cursor: "pointer", padding: "6px 12px", fontSize: theme.fontSizes.body,
            fontFamily: "inherit",
          }}>Close</button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          {/* Sidebar nav */}
          <div style={{
            width: 200, flexShrink: 0, borderRight: "1px solid " + theme.colors.borderSubtle,
            padding: "12px 0", overflowY: "auto",
          }}>
            {sections.map((s, i) => (
              <button key={i} onClick={() => setActiveSection(i)} style={{
                display: "block", width: "100%", textAlign: "left",
                background: activeSection === i ? theme.colors.blue + "18" : "transparent",
                color: activeSection === i ? theme.colors.blue : theme.colors.textSecondary,
                border: "none", borderLeft: activeSection === i ? "3px solid " + theme.colors.blue : "3px solid transparent",
                padding: "10px 16px", fontSize: theme.fontSizes.small, fontWeight: activeSection === i ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                {s.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            flex: 1, padding: "20px 28px", overflowY: "auto",
          }}>
            <h3 style={{
              margin: "0 0 16px", fontSize: "17px", fontWeight: 700, color: theme.colors.textPrimary,
            }}>
              {sections[activeSection].title}
            </h3>
            <div style={{
              fontSize: theme.fontSizes.body, color: theme.colors.textBody, lineHeight: "1.7",
              whiteSpace: "pre-line",
            }}>
              {renderMarkdown(sections[activeSection].content)}
            </div>

            {/* Nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 16, borderTop: "1px solid " + theme.colors.borderSubtle }}>
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                style={{
                  background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
                  color: activeSection === 0 ? theme.colors.textFaint : theme.colors.textSecondary,
                  padding: "8px 16px", fontSize: theme.fontSizes.small, fontWeight: 600,
                  cursor: activeSection === 0 ? "default" : "pointer", fontFamily: "inherit",
                  opacity: activeSection === 0 ? 0.4 : 1,
                }}
              >
                {"\u2190"} Previous
              </button>
              <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textFaint, alignSelf: "center" }}>
                {activeSection + 1} / {sections.length}
              </span>
              <button
                onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                disabled={activeSection === sections.length - 1}
                style={{
                  background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
                  color: activeSection === sections.length - 1 ? theme.colors.textFaint : theme.colors.textSecondary,
                  padding: "8px 16px", fontSize: theme.fontSizes.small, fontWeight: 600,
                  cursor: activeSection === sections.length - 1 ? "default" : "pointer", fontFamily: "inherit",
                  opacity: activeSection === sections.length - 1 ? 0.4 : 1,
                }}
              >
                Next {"\u2192"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Minimal markdown-like renderer for bold and line breaks */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 10 }} />);
      continue;
    }
    // Parse bold (**text**) within the line
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    // Check if it's a list item
    if (line.trimStart().startsWith('- ')) {
      const indent = line.indexOf('-');
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, paddingLeft: indent > 0 ? 16 : 0, marginBottom: 3 }}>
          <span style={{ color: theme.colors.textFaint, flexShrink: 0 }}>{"\u2022"}</span>
          <span>{rendered.map((r, ri) => {
            if (typeof r === 'string' || (r && typeof r === 'object' && 'props' in r)) {
              // Strip leading "- " from the first text part
              if (ri === 0 && typeof r !== 'string' && r.props.children && typeof r.props.children === 'string') {
                return <span key={ri}>{r.props.children.replace(/^- /, '')}</span>;
              }
            }
            return r;
          })}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line.trimStart())) {
      // Numbered list item
      const match = line.trimStart().match(/^(\d+)\.\s/);
      const num = match ? match[1] : "";
      elements.push(
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
          <span style={{ color: theme.colors.blue, flexShrink: 0, minWidth: 16, textAlign: "right" }}>{num}.</span>
          <span>{rendered.map((r, ri) => {
            if (ri === 0 && typeof r !== 'string' && r && 'props' in r && r.props.children && typeof r.props.children === 'string') {
              return <span key={ri}>{r.props.children.replace(/^\d+\.\s/, '')}</span>;
            }
            return r;
          })}</span>
        </div>
      );
    } else {
      elements.push(<div key={i}>{rendered}</div>);
    }
  }

  return <>{elements}</>;
}
