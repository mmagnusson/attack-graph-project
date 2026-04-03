// ─── HelpGuide — In-app walkthrough and feature reference ──

import { useState } from 'react';
import { theme } from '../theme';

interface HelpGuideProps {
  onClose: () => void;
}

const sections = [
  {
    title: "Getting Started",
    content: `AttackBreaker helps you figure out the most effective way to defend your organization against cyberattacks. It models real attack paths — the sequences of techniques that adversaries actually use — and shows you which security controls give you the biggest bang for your buck.

**How it works in a nutshell:**
- Attack techniques (from the MITRE ATT&CK framework) are shown as nodes on the graph
- These techniques are connected into attack chains — realistic sequences an attacker would follow
- You deploy security controls to block or reduce the effectiveness of specific techniques
- The app calculates which controls disrupt the most attack chains, helping you prioritize your defenses

**Quick start:**
1. Choose your framework (Enterprise or ICS/OT) and data source
2. Look at the graph — red/orange nodes are high-risk techniques
3. Click "APPLY OPTIMAL" to see the mathematically best set of controls to deploy
4. Explore the sidebar panels (Controls, Analysis, Gaps, Executive) for deeper insight`,
  },
  {
    title: "The Graph",
    content: `The main visualization shows attack techniques as nodes and their connections as edges.

**Node colors tell you the risk level:**
- **Red/Orange nodes** — High exposure, not yet mitigated
- **Green nodes** — Remediated (a deployed control covers this technique)
- **Faded nodes** — Lower risk or not on a critical path

**Interacting with the graph:**
- **Click a node** to select it and see its details in the Detail panel below
- **Drag nodes** to rearrange the layout (use "AUTO-SPACE" in the MORE menu to reset)
- **Hover over a node** to see which attack chains pass through it

**Attack chains** are drawn as colored paths connecting technique nodes. When you deploy controls, you'll see chains change from active (colored) to disrupted (faded/green).`,
  },
  {
    title: "Controls & Deployment",
    content: `The **Controls** sidebar (press S or click "Controls" in the toolbar) shows all available security controls grouped by category.

**How controls work:**
- Each control covers one or more attack techniques, reducing their effectiveness by a percentage
- Deploying a control is like flipping a switch — it immediately updates the graph and all calculations
- Hover over a technique ID in the controls list to see its full name

**The "APPLY OPTIMAL" button** uses a weighted set-cover algorithm to find the smallest set of controls that disrupts the most attack chains. Think of it as: "If I could only deploy N controls, which ones should I pick?" The budget slider in the header controls how many nodes the algorithm targets.

**Deployment status** is tracked per-control. You can manually toggle individual controls on/off, or let the optimizer suggest the best set.`,
  },
  {
    title: "Bottom Panels",
    content: `The bottom of the screen has three tabbed panels (press 1, 2, or 3 to switch, or B to hide/show them all):

**1. Attack Chains** — Lists every attack chain in the model. Each chain shows the sequence of techniques an attacker would use. Disrupted chains are marked in green. Click a chain to highlight it on the graph. Hover over any technique ID to see its name.

**2. Priority List** — Ranks techniques by how critical they are to defend. The ranking considers how many chains each technique appears in and how much residual exposure remains. This helps you focus on the techniques that matter most.

**3. Detail** — Shows full information about the currently selected technique: its description, which attack phase it belongs to, what MITRE mitigations exist for it, and which controls in your framework can address it. Click on a MITRE mitigation to expand its description.`,
  },
  {
    title: "Sidebar Panels",
    content: `Four sidebar panels provide analytical views (press the key shown, or use the toolbar buttons):

**Controls (S)** — Deploy/undeploy security controls, see coverage percentages, and review what each control protects against.

**Analysis (A)** — Statistical breakdown of your security posture: coverage by attack phase, technique category distribution, and overall risk metrics.

**Gaps (G)** — Highlights techniques that are NOT covered by any deployed control. These are your blind spots. The gap analysis helps you identify where you're most vulnerable.

**Executive (X)** — A high-level summary suitable for leadership briefings: overall risk score, deployment progress, chain disruption rate, and key recommendations.`,
  },
  {
    title: "Settings & Configuration",
    content: `**Header controls** (press H to collapse/expand):

- **Framework** — Choose between Enterprise ATT&CK (IT-focused) and ICS/OT ATT&CK (industrial control systems)
- **Data Source** — "Built-in" uses curated sample chains. "STIX (Live)" fetches the latest MITRE data. You can also upload custom STIX bundles.
- **Environment** — Presets that adjust technique relevance based on your environment type
- **Platforms** — Filter techniques by operating system / platform (Windows, Linux, macOS, etc.)
- **Threat Sector** — Filter by industry sector to focus on the most relevant threats
- **Budget** — Controls how many nodes the optimal set-cover algorithm targets
- **Search** — Filter the technique list by name or ID`,
  },
  {
    title: "Advanced Tools",
    content: `Found in the **MORE** menu:

- **Sub-Techniques** — Show or hide MITRE sub-techniques (e.g., T1059.001 under T1059). Available when using STIX data.
- **Phase Weighting** — Adjusts technique importance based on where it falls in the attack kill chain. Early-phase techniques (like Initial Access) get higher weight since stopping an attack early is more valuable.
- **Environment Profile** — A wizard that captures your organization's size, industry, infrastructure, and existing security tools to personalize the analysis.
- **Compare IT/OT** — Side-by-side comparison of Enterprise and ICS/OT frameworks, useful for organizations with both IT and operational technology environments.
- **Build Chain** — Create custom attack chains by selecting techniques in sequence. Useful for modeling specific threat scenarios.
- **Export CSV** — Download the current analysis as a spreadsheet.
- **Import/Export Navigator** — Exchange data with MITRE ATT&CK Navigator layers, a widely used format for sharing coverage maps.`,
  },
  {
    title: "Keyboard Shortcuts",
    content: `**Panel shortcuts:**
- **1 / 2 / 3** — Switch bottom panel tabs (Chains / Priority / Detail)
- **S** — Toggle Controls sidebar
- **A** — Toggle Analysis sidebar
- **G** — Toggle Gaps sidebar
- **X** — Toggle Executive sidebar
- **Esc** — Close sidebar

**View shortcuts:**
- **H** — Collapse/expand the header toolbar
- **B** — Show/hide bottom panels

All shortcuts work when you're not typing in a text field.`,
  },
  {
    title: "Understanding the Math",
    content: `AttackBreaker uses a few key concepts under the hood:

**Exposure score** — Each technique has a score from 0 to 1 representing how exposed it is. 1.0 means fully exposed (no controls deployed), 0.0 means fully mitigated. When you deploy a control that covers a technique by, say, 80%, the exposure drops by that amount.

**Chain disruption** — An attack chain is considered "disrupted" when any technique in the chain has been sufficiently mitigated. Since an attacker needs every step in the chain to succeed, blocking even one step breaks the whole chain.

**Weighted set cover** — The "APPLY OPTIMAL" algorithm solves a classic optimization problem: given a limited budget, which controls cover the most attack chains? It considers both the number of chains a technique appears in and the exposure reduction each control provides, finding a near-optimal solution.

**Phase weighting** (when enabled) — Multiplies technique importance by its position in the attack lifecycle. Techniques in the Initial Access or Execution phases get higher weight because stopping an attack early prevents all downstream damage.`,
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
