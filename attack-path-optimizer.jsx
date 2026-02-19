import { useState, useCallback, useEffect, useRef, useMemo } from "react";

// ─── Data Model ───────────────────────────────────────────────────────────────
// Simplified but realistic ATT&CK graph with real technique IDs
// Each tactic contains techniques; edges represent known attack chain transitions

const TACTICS = [
  { id: "TA0043", name: "Reconnaissance", phase: 0, color: "#6366f1" },
  { id: "TA0042", name: "Resource Dev", phase: 0, color: "#8b5cf6" },
  { id: "TA0001", name: "Initial Access", phase: 1, color: "#ec4899" },
  { id: "TA0002", name: "Execution", phase: 2, color: "#ef4444" },
  { id: "TA0003", name: "Persistence", phase: 3, color: "#f97316" },
  { id: "TA0004", name: "Priv Escalation", phase: 3, color: "#f59e0b" },
  { id: "TA0005", name: "Defense Evasion", phase: 4, color: "#eab308" },
  { id: "TA0006", name: "Credential Access", phase: 4, color: "#84cc16" },
  { id: "TA0007", name: "Discovery", phase: 5, color: "#22c55e" },
  { id: "TA0008", name: "Lateral Movement", phase: 6, color: "#14b8a6" },
  { id: "TA0009", name: "Collection", phase: 7, color: "#06b6d4" },
  { id: "TA0011", name: "Command & Control", phase: 7, color: "#3b82f6" },
  { id: "TA0010", name: "Exfiltration", phase: 8, color: "#6366f1" },
  { id: "TA0040", name: "Impact", phase: 8, color: "#a855f7" },
];

const TECHNIQUES = [
  // Reconnaissance
  { id: "T1595", name: "Active Scanning", tactic: "TA0043", baseCriticality: 0.3 },
  { id: "T1598", name: "Phishing for Info", tactic: "TA0043", baseCriticality: 0.5 },
  { id: "T1592", name: "Gather Victim Host Info", tactic: "TA0043", baseCriticality: 0.4 },
  // Resource Development
  { id: "T1583", name: "Acquire Infrastructure", tactic: "TA0042", baseCriticality: 0.3 },
  { id: "T1588", name: "Obtain Capabilities", tactic: "TA0042", baseCriticality: 0.4 },
  { id: "T1586", name: "Compromise Accounts", tactic: "TA0042", baseCriticality: 0.5 },
  // Initial Access
  { id: "T1566", name: "Phishing", tactic: "TA0001", baseCriticality: 0.9 },
  { id: "T1190", name: "Exploit Public App", tactic: "TA0001", baseCriticality: 0.8 },
  { id: "T1078", name: "Valid Accounts", tactic: "TA0001", baseCriticality: 0.85 },
  { id: "T1199", name: "Trusted Relationship", tactic: "TA0001", baseCriticality: 0.6 },
  // Execution
  { id: "T1059", name: "Command & Script Interpreter", tactic: "TA0002", baseCriticality: 0.95 },
  { id: "T1204", name: "User Execution", tactic: "TA0002", baseCriticality: 0.7 },
  { id: "T1047", name: "WMI", tactic: "TA0002", baseCriticality: 0.6 },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "TA0002", baseCriticality: 0.65 },
  // Persistence
  { id: "T1547", name: "Boot/Logon Autostart", tactic: "TA0003", baseCriticality: 0.7 },
  { id: "T1136", name: "Create Account", tactic: "TA0003", baseCriticality: 0.6 },
  { id: "T1543", name: "Create/Modify System Process", tactic: "TA0003", baseCriticality: 0.65 },
  { id: "T1546", name: "Event Triggered Execution", tactic: "TA0003", baseCriticality: 0.5 },
  // Privilege Escalation
  { id: "T1068", name: "Exploitation for Priv Esc", tactic: "TA0004", baseCriticality: 0.8 },
  { id: "T1548", name: "Abuse Elevation Control", tactic: "TA0004", baseCriticality: 0.75 },
  { id: "T1134", name: "Access Token Manipulation", tactic: "TA0004", baseCriticality: 0.7 },
  // Defense Evasion
  { id: "T1027", name: "Obfuscated Files", tactic: "TA0005", baseCriticality: 0.6 },
  { id: "T1055", name: "Process Injection", tactic: "TA0005", baseCriticality: 0.85 },
  { id: "T1562", name: "Impair Defenses", tactic: "TA0005", baseCriticality: 0.9 },
  { id: "T1070", name: "Indicator Removal", tactic: "TA0005", baseCriticality: 0.5 },
  // Credential Access
  { id: "T1003", name: "OS Credential Dumping", tactic: "TA0006", baseCriticality: 0.9 },
  { id: "T1110", name: "Brute Force", tactic: "TA0006", baseCriticality: 0.5 },
  { id: "T1557", name: "Adversary-in-the-Middle", tactic: "TA0006", baseCriticality: 0.65 },
  { id: "T1558", name: "Steal/Forge Kerberos Tickets", tactic: "TA0006", baseCriticality: 0.8 },
  // Discovery
  { id: "T1087", name: "Account Discovery", tactic: "TA0007", baseCriticality: 0.4 },
  { id: "T1082", name: "System Info Discovery", tactic: "TA0007", baseCriticality: 0.35 },
  { id: "T1046", name: "Network Service Discovery", tactic: "TA0007", baseCriticality: 0.45 },
  { id: "T1069", name: "Permission Groups Discovery", tactic: "TA0007", baseCriticality: 0.5 },
  // Lateral Movement
  { id: "T1021", name: "Remote Services", tactic: "TA0008", baseCriticality: 0.85 },
  { id: "T1570", name: "Lateral Tool Transfer", tactic: "TA0008", baseCriticality: 0.6 },
  { id: "T1550", name: "Use Alternate Auth Material", tactic: "TA0008", baseCriticality: 0.75 },
  // Collection
  { id: "T1560", name: "Archive Collected Data", tactic: "TA0009", baseCriticality: 0.5 },
  { id: "T1005", name: "Data from Local System", tactic: "TA0009", baseCriticality: 0.6 },
  { id: "T1114", name: "Email Collection", tactic: "TA0009", baseCriticality: 0.55 },
  // C2
  { id: "T1071", name: "Application Layer Protocol", tactic: "TA0011", baseCriticality: 0.7 },
  { id: "T1105", name: "Ingress Tool Transfer", tactic: "TA0011", baseCriticality: 0.65 },
  { id: "T1572", name: "Protocol Tunneling", tactic: "TA0011", baseCriticality: 0.6 },
  // Exfiltration
  { id: "T1041", name: "Exfil Over C2 Channel", tactic: "TA0010", baseCriticality: 0.7 },
  { id: "T1048", name: "Exfil Over Alt Protocol", tactic: "TA0010", baseCriticality: 0.6 },
  // Impact
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "TA0040", baseCriticality: 0.95 },
  { id: "T1489", name: "Service Stop", tactic: "TA0040", baseCriticality: 0.7 },
  { id: "T1529", name: "System Shutdown/Reboot", tactic: "TA0040", baseCriticality: 0.5 },
  { id: "T1485", name: "Data Destruction", tactic: "TA0040", baseCriticality: 0.85 },
];

// Known attack chain edges — which techniques lead to which
// Based on real-world attack patterns from CTI
const EDGES = [
  // Recon → Initial Access
  { from: "T1595", to: "T1190" }, { from: "T1598", to: "T1566" },
  { from: "T1592", to: "T1190" }, { from: "T1598", to: "T1078" },
  // Resource Dev → Initial Access
  { from: "T1583", to: "T1566" }, { from: "T1588", to: "T1190" },
  { from: "T1586", to: "T1078" }, { from: "T1586", to: "T1199" },
  // Initial Access → Execution
  { from: "T1566", to: "T1204" }, { from: "T1566", to: "T1059" },
  { from: "T1190", to: "T1059" }, { from: "T1078", to: "T1059" },
  { from: "T1078", to: "T1047" }, { from: "T1199", to: "T1059" },
  { from: "T1204", to: "T1059" },
  // Execution → Persistence
  { from: "T1059", to: "T1547" }, { from: "T1059", to: "T1136" },
  { from: "T1059", to: "T1543" }, { from: "T1059", to: "T1546" },
  { from: "T1047", to: "T1543" }, { from: "T1053", to: "T1547" },
  // Execution → Priv Escalation
  { from: "T1059", to: "T1068" }, { from: "T1059", to: "T1548" },
  { from: "T1059", to: "T1134" }, { from: "T1053", to: "T1548" },
  // Execution → Defense Evasion
  { from: "T1059", to: "T1027" }, { from: "T1059", to: "T1055" },
  { from: "T1059", to: "T1562" }, { from: "T1059", to: "T1070" },
  // Persistence → Execution (cycle)
  { from: "T1547", to: "T1059" }, { from: "T1546", to: "T1059" },
  // Priv Esc → Credential Access
  { from: "T1068", to: "T1003" }, { from: "T1134", to: "T1003" },
  { from: "T1548", to: "T1003" },
  // Priv Esc → Defense Evasion
  { from: "T1068", to: "T1055" }, { from: "T1134", to: "T1562" },
  // Defense Evasion → Credential Access
  { from: "T1055", to: "T1003" }, { from: "T1562", to: "T1003" },
  // Credential Access → Discovery
  { from: "T1003", to: "T1087" }, { from: "T1003", to: "T1069" },
  { from: "T1558", to: "T1087" }, { from: "T1110", to: "T1082" },
  // Credential Access → Lateral Movement
  { from: "T1003", to: "T1021" }, { from: "T1003", to: "T1550" },
  { from: "T1558", to: "T1550" }, { from: "T1558", to: "T1021" },
  // Discovery → Lateral Movement
  { from: "T1087", to: "T1021" }, { from: "T1046", to: "T1021" },
  { from: "T1069", to: "T1550" }, { from: "T1082", to: "T1570" },
  // Lateral Movement → Collection
  { from: "T1021", to: "T1005" }, { from: "T1021", to: "T1114" },
  { from: "T1550", to: "T1005" }, { from: "T1570", to: "T1560" },
  // Lateral Movement → Execution on new host
  { from: "T1021", to: "T1059" }, { from: "T1550", to: "T1047" },
  // Collection → C2
  { from: "T1560", to: "T1071" }, { from: "T1005", to: "T1071" },
  { from: "T1114", to: "T1105" },
  // Execution → C2
  { from: "T1059", to: "T1071" }, { from: "T1059", to: "T1572" },
  { from: "T1059", to: "T1105" },
  // C2 → Exfiltration
  { from: "T1071", to: "T1041" }, { from: "T1572", to: "T1048" },
  { from: "T1105", to: "T1041" },
  // C2 → Impact
  { from: "T1071", to: "T1486" }, { from: "T1071", to: "T1489" },
  { from: "T1105", to: "T1486" },
  // Lateral Movement → Impact
  { from: "T1021", to: "T1486" }, { from: "T1021", to: "T1485" },
  { from: "T1021", to: "T1489" }, { from: "T1550", to: "T1529" },
  // Exfil → Impact
  { from: "T1041", to: "T1486" },
  // Defense Evasion → Discovery
  { from: "T1055", to: "T1082" }, { from: "T1562", to: "T1046" },
  // Credential Access → C2
  { from: "T1557", to: "T1071" },
];

// Named attack chains representing real threat actors
const ATTACK_CHAINS = [
  {
    name: "APT29 / Cozy Bear",
    description: "Russian SVR - SolarWinds-style supply chain",
    sector: "government",
    path: ["T1199", "T1059", "T1543", "T1562", "T1003", "T1087", "T1021", "T1005", "T1071", "T1041"],
    severity: 0.95,
  },
  {
    name: "Conti Ransomware",
    description: "Double extortion ransomware operation",
    sector: "all",
    path: ["T1566", "T1204", "T1059", "T1547", "T1068", "T1003", "T1021", "T1560", "T1071", "T1486"],
    severity: 0.9,
  },
  {
    name: "APT28 / Fancy Bear",
    description: "Russian GRU - credential harvesting & espionage",
    sector: "government",
    path: ["T1598", "T1566", "T1059", "T1055", "T1003", "T1558", "T1550", "T1114", "T1071", "T1041"],
    severity: 0.9,
  },
  {
    name: "LockBit 3.0",
    description: "RaaS with affiliate model",
    sector: "all",
    path: ["T1595", "T1190", "T1059", "T1136", "T1548", "T1562", "T1003", "T1046", "T1021", "T1486"],
    severity: 0.85,
  },
  {
    name: "Lazarus Group",
    description: "DPRK - financially motivated + espionage",
    sector: "financial",
    path: ["T1586", "T1078", "T1059", "T1546", "T1134", "T1055", "T1003", "T1021", "T1005", "T1071", "T1048"],
    severity: 0.9,
  },
  {
    name: "FIN7",
    description: "Financially motivated, targets POS/retail",
    sector: "financial",
    path: ["T1598", "T1566", "T1204", "T1059", "T1547", "T1027", "T1003", "T1069", "T1021", "T1560", "T1071", "T1041"],
    severity: 0.8,
  },
  {
    name: "Volt Typhoon",
    description: "Chinese state actor - living off the land",
    sector: "government",
    path: ["T1190", "T1059", "T1543", "T1548", "T1070", "T1003", "T1082", "T1021", "T1005", "T1572", "T1048"],
    severity: 0.95,
  },
  {
    name: "BlackCat / ALPHV",
    description: "Ransomware with data leak site",
    sector: "all",
    path: ["T1078", "T1047", "T1543", "T1068", "T1562", "T1110", "T1046", "T1570", "T1560", "T1071", "T1486"],
    severity: 0.85,
  },
];

// Environment presets
const ENV_PRESETS = {
  default: { name: "Unassessed (Worst Case)", description: "All nodes fully exposed" },
  government: {
    name: "Government (Typical)",
    description: "Basic perimeter, some EDR, limited segmentation",
    overrides: {
      "T1566": 0.6, "T1190": 0.5, "T1059": 0.8, "T1078": 0.7,
      "T1547": 0.6, "T1068": 0.7, "T1003": 0.75, "T1021": 0.7,
      "T1055": 0.8, "T1562": 0.65, "T1071": 0.6, "T1486": 0.85,
      "T1027": 0.7, "T1087": 0.5, "T1046": 0.4, "T1110": 0.3,
    }
  },
  hardened: {
    name: "Hardened Enterprise",
    description: "Full EDR, app whitelisting, network segmentation, MFA",
    overrides: {
      "T1566": 0.3, "T1190": 0.2, "T1059": 0.3, "T1078": 0.2,
      "T1547": 0.25, "T1068": 0.35, "T1003": 0.3, "T1021": 0.25,
      "T1055": 0.35, "T1562": 0.2, "T1071": 0.3, "T1486": 0.4,
      "T1204": 0.35, "T1047": 0.2, "T1136": 0.15, "T1543": 0.2,
      "T1548": 0.25, "T1134": 0.3, "T1027": 0.3, "T1070": 0.25,
      "T1110": 0.1, "T1557": 0.2, "T1558": 0.25, "T1087": 0.3,
      "T1082": 0.2, "T1046": 0.15, "T1069": 0.25, "T1570": 0.2,
      "T1550": 0.2, "T1560": 0.3, "T1005": 0.35, "T1114": 0.25,
      "T1105": 0.2, "T1572": 0.15, "T1041": 0.25, "T1048": 0.2,
      "T1486": 0.3, "T1489": 0.25, "T1529": 0.2, "T1485": 0.3,
    }
  },
};

// ─── Graph Algorithms ─────────────────────────────────────────────────────────

function computeBetweenness(techniques, edges) {
  const counts = {};
  techniques.forEach(t => counts[t.id] = 0);

  const adj = {};
  techniques.forEach(t => adj[t.id] = []);
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });

  // Simplified betweenness: count how many shortest paths pass through each node
  const ids = techniques.map(t => t.id);
  for (let s = 0; s < ids.length; s++) {
    // BFS from s
    const dist = {};
    const sigma = {}; // number of shortest paths
    const pred = {};
    ids.forEach(id => { dist[id] = -1; sigma[id] = 0; pred[id] = []; });
    dist[ids[s]] = 0;
    sigma[ids[s]] = 1;
    const queue = [ids[s]];
    const stack = [];
    let qi = 0;
    while (qi < queue.length) {
      const v = queue[qi++];
      stack.push(v);
      (adj[v] || []).forEach(w => {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      });
    }
    // Accumulation
    const delta = {};
    ids.forEach(id => delta[id] = 0);
    while (stack.length > 0) {
      const w = stack.pop();
      pred[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== ids[s]) counts[w] += delta[w];
    }
  }

  // Normalize
  const maxVal = Math.max(...Object.values(counts), 1);
  const result = {};
  Object.keys(counts).forEach(k => result[k] = counts[k] / maxVal);
  return result;
}

function computeChainCoverage(techniques, chains) {
  const coverage = {};
  techniques.forEach(t => {
    coverage[t.id] = chains.filter(c => c.path.includes(t.id)).length;
  });
  return coverage;
}

function findOptimalRemediation(techniques, chains, exposures, budget) {
  // Greedy set cover variant
  // Each technique "covers" attack chains it participates in
  // Weight = (chains_covered * avg_severity * exposure) / cost_proxy
  const remaining = new Set(chains.map((_, i) => i));
  const selected = [];
  const costPerTech = 1; // Simplified: each remediation costs 1 unit

  for (let step = 0; step < budget && remaining.size > 0; step++) {
    let bestTech = null;
    let bestScore = -1;

    techniques.forEach(t => {
      if (selected.includes(t.id)) return;
      const exposure = exposures[t.id] ?? 1.0;
      if (exposure < 0.1) return; // Already well-mitigated

      let chainsCovered = 0;
      let severitySum = 0;
      chains.forEach((c, i) => {
        if (remaining.has(i) && c.path.includes(t.id)) {
          chainsCovered++;
          severitySum += c.severity;
        }
      });

      const score = chainsCovered > 0
        ? (chainsCovered * (severitySum / chainsCovered) * exposure) / costPerTech
        : 0;

      if (score > bestScore) {
        bestScore = score;
        bestTech = t.id;
      }
    });

    if (bestTech) {
      selected.push(bestTech);
      chains.forEach((c, i) => {
        if (c.path.includes(bestTech)) remaining.delete(i);
      });
    }
  }

  return { selected, chainsDisrupted: chains.length - remaining.size, chainsTotal: chains.length };
}

// ─── SVG Graph Renderer ───────────────────────────────────────────────────────

const PHASE_X = { 0: 60, 1: 160, 2: 260, 3: 370, 4: 480, 5: 590, 6: 700, 7: 810, 8: 920 };

function layoutNodes(techniques) {
  const byTactic = {};
  TACTICS.forEach(t => byTactic[t.id] = []);
  techniques.forEach(t => byTactic[t.tactic]?.push(t));

  const positions = {};
  TACTICS.forEach(tac => {
    const techs = byTactic[tac.id] || [];
    const x = PHASE_X[tac.phase];
    const spacing = Math.min(62, 340 / Math.max(techs.length, 1));
    const startY = 200 - (techs.length - 1) * spacing / 2;
    techs.forEach((t, i) => {
      positions[t.id] = { x, y: startY + i * spacing };
    });
  });
  return positions;
}

// ─── Components ───────────────────────────────────────────────────────────────

function GraphView({ techniques, edges, positions, exposures, betweenness, chainCoverage,
  selectedTech, onSelectTech, highlightedChain, remediated, optimalSet }) {

  const svgRef = useRef(null);
  const [viewBox, setViewBox] = useState("0 0 1000 420");

  // Determine which edges are in the highlighted chain
  const chainEdges = useMemo(() => {
    if (!highlightedChain) return new Set();
    const s = new Set();
    for (let i = 0; i < highlightedChain.path.length - 1; i++) {
      s.add(`${highlightedChain.path[i]}->${highlightedChain.path[i + 1]}`);
    }
    return s;
  }, [highlightedChain]);

  const chainNodes = useMemo(() => {
    if (!highlightedChain) return new Set();
    return new Set(highlightedChain.path);
  }, [highlightedChain]);

  return (
    <svg ref={svgRef} viewBox={viewBox} className="w-full" style={{ height: "420px", background: "transparent" }}>
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#475569" fillOpacity="0.4" />
        </marker>
        <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Phase labels */}
      {Object.entries(PHASE_X).map(([phase, x]) => (
        <text key={phase} x={x} y={18} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
          {["PRE-ATT&CK", "", "ACCESS", "EXEC", "ESTABLISH", "ESCALATE", "DISCOVER", "MOVE", "OBJECTIVE"][phase]}
        </text>
      ))}

      {/* Edges */}
      {edges.map((e, i) => {
        const from = positions[e.from];
        const to = positions[e.to];
        if (!from || !to) return null;
        const isChainEdge = chainEdges.has(`${e.from}->${e.to}`);
        const isRemediatedEdge = remediated.has(e.from) || remediated.has(e.to);
        const dimmed = highlightedChain && !isChainEdge;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const r = 14;

        return (
          <line
            key={i}
            x1={from.x + ux * r} y1={from.y + uy * r}
            x2={to.x - ux * (r + 6)} y2={to.y - uy * (r + 6)}
            stroke={isRemediatedEdge ? "#22c55e" : isChainEdge ? "#f59e0b" : "#334155"}
            strokeWidth={isChainEdge ? 2 : 0.7}
            strokeOpacity={dimmed ? 0.08 : isRemediatedEdge ? 0.3 : isChainEdge ? 0.9 : 0.2}
            markerEnd={isChainEdge ? "url(#arrowhead-active)" : "url(#arrowhead)"}
            strokeDasharray={isRemediatedEdge ? "3,3" : "none"}
          />
        );
      })}

      {/* Nodes */}
      {techniques.map(t => {
        const pos = positions[t.id];
        if (!pos) return null;
        const tactic = TACTICS.find(ta => ta.id === t.tactic);
        const exposure = exposures[t.id] ?? 1.0;
        const bc = betweenness[t.id] ?? 0;
        const cc = chainCoverage[t.id] ?? 0;
        const priority = bc * exposure;
        const isSelected = selectedTech === t.id;
        const isInChain = chainNodes.has(t.id);
        const isRemediated = remediated.has(t.id);
        const isOptimal = optimalSet.includes(t.id);
        const dimmed = highlightedChain && !isInChain;

        const radius = 8 + priority * 10;
        const nodeColor = isRemediated ? "#22c55e" : tactic?.color || "#6366f1";
        const opacity = dimmed ? 0.15 : exposure < 0.2 ? 0.3 : 1;

        return (
          <g key={t.id} onClick={() => onSelectTech(t.id)} style={{ cursor: "pointer" }} opacity={opacity}>
            {/* Exposure ring */}
            <circle cx={pos.x} cy={pos.y} r={radius + 3}
              fill="none" stroke={exposure > 0.7 ? "#ef4444" : exposure > 0.4 ? "#f59e0b" : "#22c55e"}
              strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray={`${exposure * 20} ${(1 - exposure) * 20}`}
            />
            {/* Optimal remediation indicator */}
            {isOptimal && !isRemediated && (
              <circle cx={pos.x} cy={pos.y} r={radius + 7}
                fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2,2"
                opacity={0.8}
              >
                <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Main node */}
            <circle cx={pos.x} cy={pos.y} r={radius}
              fill={nodeColor} fillOpacity={isRemediated ? 0.3 : 0.8}
              stroke={isSelected ? "#fff" : isInChain ? "#f59e0b" : "transparent"}
              strokeWidth={isSelected ? 2 : isInChain ? 1.5 : 0}
              filter={isSelected || isInChain ? "url(#glow)" : "none"}
            />
            {/* Chain count badge */}
            {cc > 0 && !dimmed && (
              <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                {cc}
              </text>
            )}
            {/* Remediation check */}
            {isRemediated && (
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">✓</text>
            )}
            {/* Label */}
            <text x={pos.x} y={pos.y + radius + 10} textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
              {t.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AttackPathOptimizer() {
  const [envPreset, setEnvPreset] = useState("government");
  const [exposures, setExposures] = useState({});
  const [selectedTech, setSelectedTech] = useState(null);
  const [highlightedChain, setHighlightedChain] = useState(null);
  const [remediated, setRemediated] = useState(new Set());
  const [remediationBudget, setRemediationBudget] = useState(5);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Apply preset
  useEffect(() => {
    const preset = ENV_PRESETS[envPreset];
    if (preset?.overrides) {
      setExposures({ ...preset.overrides });
    } else {
      setExposures({});
    }
  }, [envPreset]);

  const positions = useMemo(() => layoutNodes(TECHNIQUES), []);
  const betweenness = useMemo(() => computeBetweenness(TECHNIQUES, EDGES), []);

  const filteredChains = useMemo(() => {
    if (sectorFilter === "all") return ATTACK_CHAINS;
    return ATTACK_CHAINS.filter(c => c.sector === sectorFilter || c.sector === "all");
  }, [sectorFilter]);

  const chainCoverage = useMemo(() => computeChainCoverage(TECHNIQUES, filteredChains), [filteredChains]);

  const optimal = useMemo(() =>
    findOptimalRemediation(TECHNIQUES, filteredChains, exposures, remediationBudget),
    [filteredChains, exposures, remediationBudget]
  );

  // Compute chain disruption status
  const chainStatus = useMemo(() => {
    return filteredChains.map(chain => {
      const broken = chain.path.some(tid => remediated.has(tid));
      const breakpoints = chain.path.filter(tid => remediated.has(tid));
      const exposedNodes = chain.path.filter(tid => (exposures[tid] ?? 1.0) > 0.7);
      const avgExposure = chain.path.reduce((s, tid) => s + (exposures[tid] ?? 1.0), 0) / chain.path.length;
      return { ...chain, broken, breakpoints, exposedNodes, avgExposure };
    });
  }, [filteredChains, remediated, exposures]);

  const totalDisrupted = chainStatus.filter(c => c.broken).length;

  const handleExposureChange = (techId, value) => {
    setExposures(prev => ({ ...prev, [techId]: value }));
  };

  const toggleRemediate = (techId) => {
    setRemediated(prev => {
      const next = new Set(prev);
      if (next.has(techId)) next.delete(techId);
      else next.add(techId);
      return next;
    });
  };

  const applyOptimal = () => {
    setRemediated(new Set(optimal.selected));
  };

  const selectedTechData = TECHNIQUES.find(t => t.id === selectedTech);
  const selectedTactic = selectedTechData ? TACTICS.find(ta => ta.id === selectedTechData.tactic) : null;

  // Priority ranking
  const priorityRanking = useMemo(() => {
    return TECHNIQUES
      .map(t => ({
        ...t,
        exposure: exposures[t.id] ?? 1.0,
        betweenness: betweenness[t.id] ?? 0,
        chainCount: chainCoverage[t.id] ?? 0,
        priority: (betweenness[t.id] ?? 0) * (exposures[t.id] ?? 1.0) * (chainCoverage[t.id] ?? 0) / filteredChains.length,
      }))
      .filter(t => t.priority > 0 && !remediated.has(t.id))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 12);
  }, [exposures, betweenness, chainCoverage, remediated, filteredChains]);

  return (
    <div style={{
      background: "#0a0f1a",
      color: "#e2e8f0",
      minHeight: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.5px" }}>
            ⚔ ATT&CK Path Optimizer
          </h1>
          <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>
            Weighted graph analysis for optimal cybersecurity expenditure
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Environment</label>
            <select value={envPreset} onChange={e => setEnvPreset(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              <option value="default">Unassessed (Worst Case)</option>
              <option value="government">Government (Typical)</option>
              <option value="hardened">Hardened Enterprise</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Threat Sector</label>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              <option value="all">All Sectors</option>
              <option value="government">Government</option>
              <option value="financial">Financial</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Budget (nodes)</label>
            <input type="range" min={1} max={10} value={remediationBudget} onChange={e => setRemediationBudget(+e.target.value)}
              style={{ width: "80px", accentColor: "#f59e0b" }} />
            <span style={{ fontSize: "10px", color: "#f59e0b", textAlign: "center" }}>{remediationBudget}</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "16px", padding: "10px 24px", borderBottom: "1px solid #1e293b",
        alignItems: "center", flexWrap: "wrap",
      }}>
        <Stat label="Attack Chains" value={filteredChains.length} color="#6366f1" />
        <Stat label="Disrupted" value={`${totalDisrupted}/${filteredChains.length}`}
          color={totalDisrupted === filteredChains.length ? "#22c55e" : "#f59e0b"} />
        <Stat label="Remediated Nodes" value={remediated.size} color="#22c55e" />
        <Stat label="Optimal Covers" value={`${optimal.chainsDisrupted} chains in ${optimal.selected.length} nodes`} color="#f59e0b" />
        <button onClick={applyOptimal} style={{
          background: "#f59e0b", color: "#0a0f1a", border: "none", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.5px",
        }}>
          APPLY OPTIMAL
        </button>
        <button onClick={() => setRemediated(new Set())} style={{
          background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
          RESET
        </button>
        <button onClick={() => setShowAnalysis(!showAnalysis)} style={{
          background: showAnalysis ? "#3b82f6" : "transparent", color: showAnalysis ? "#fff" : "#64748b",
          border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
          {showAnalysis ? "HIDE" : "SHOW"} ANALYSIS
        </button>
      </div>

      {/* Main graph */}
      <div style={{ padding: "8px 16px", overflow: "auto" }}>
        <GraphView
          techniques={TECHNIQUES} edges={EDGES} positions={positions}
          exposures={exposures} betweenness={betweenness} chainCoverage={chainCoverage}
          selectedTech={selectedTech} onSelectTech={setSelectedTech}
          highlightedChain={highlightedChain}
          remediated={remediated}
          optimalSet={optimal.selected}
        />
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: "16px", padding: "4px 24px 8px", flexWrap: "wrap",
        borderBottom: "1px solid #1e293b", alignItems: "center",
      }}>
        <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Legend:</span>
        <LegendItem color="#ef4444" label="High exposure ring" />
        <LegendItem color="#f59e0b" label="Medium exposure ring" />
        <LegendItem color="#22c55e" label="Low exposure / remediated" />
        <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
        <span style={{ fontSize: "9px", color: "#64748b" }}>Node size = betweenness × exposure</span>
        <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
        <span style={{ fontSize: "9px", color: "#64748b" }}>Number = chain count</span>
        <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
        <span style={{ fontSize: "9px", color: "#f59e0b", border: "1px dashed #f59e0b", padding: "1px 4px", borderRadius: "8px", fontSize: "8px" }}>
          dashed ring = optimal target
        </span>
      </div>

      {/* Bottom panels */}
      <div style={{ display: "flex", gap: "0", borderTop: "1px solid #1e293b", flexWrap: "wrap" }}>
        {/* Attack Chains Panel */}
        <div style={{ flex: "1 1 280px", borderRight: "1px solid #1e293b", padding: "12px 16px", maxHeight: "320px", overflow: "auto" }}>
          <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0" }}>
            Attack Chains ({filteredChains.length})
          </h3>
          {chainStatus.map((chain, i) => (
            <div key={i}
              onClick={() => setHighlightedChain(highlightedChain?.name === chain.name ? null : chain)}
              style={{
                padding: "8px 10px", marginBottom: "4px", borderRadius: "4px", cursor: "pointer",
                background: highlightedChain?.name === chain.name ? "#1e293b" : "transparent",
                border: `1px solid ${chain.broken ? "#22c55e33" : "#ef444433"}`,
                opacity: chain.broken ? 0.6 : 1,
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: chain.broken ? "#22c55e" : "#f8fafc" }}>
                  {chain.broken ? "✓ " : "⚠ "}{chain.name}
                </span>
                <span style={{
                  fontSize: "9px", padding: "1px 6px", borderRadius: "8px",
                  background: chain.severity > 0.85 ? "#ef444430" : "#f59e0b30",
                  color: chain.severity > 0.85 ? "#ef4444" : "#f59e0b",
                }}>
                  {(chain.severity * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>{chain.description}</div>
              <div style={{ fontSize: "8px", color: "#475569", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {chain.path.map((tid, j) => (
                  <span key={j} style={{
                    padding: "1px 3px", borderRadius: "2px",
                    background: remediated.has(tid) ? "#22c55e20" : (exposures[tid] ?? 1) > 0.7 ? "#ef444420" : "#1e293b",
                    color: remediated.has(tid) ? "#22c55e" : (exposures[tid] ?? 1) > 0.7 ? "#ef4444" : "#94a3b8",
                    textDecoration: remediated.has(tid) ? "line-through" : "none",
                  }}>
                    {tid}{j < chain.path.length - 1 ? " →" : ""}
                  </span>
                ))}
              </div>
              {chain.broken && chain.breakpoints.length > 0 && (
                <div style={{ fontSize: "8px", color: "#22c55e", marginTop: "3px" }}>
                  Broken at: {chain.breakpoints.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Priority Ranking Panel */}
        <div style={{ flex: "1 1 240px", borderRight: "1px solid #1e293b", padding: "12px 16px", maxHeight: "320px", overflow: "auto" }}>
          <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0" }}>
            Remediation Priority
          </h3>
          {priorityRanking.map((t, i) => (
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
                  E:{(t.exposure * 100).toFixed(0)} B:{(t.betweenness * 100).toFixed(0)} C:{t.chainCount}
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
        </div>

        {/* Detail / Exposure Panel */}
        <div style={{ flex: "1 1 240px", padding: "12px 16px", maxHeight: "320px", overflow: "auto" }}>
          {selectedTechData ? (
            <>
              <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0" }}>
                Node Detail: {selectedTechData.id}
              </h3>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{selectedTechData.name}</div>
                <div style={{ fontSize: "9px", color: selectedTactic?.color, marginTop: "2px" }}>
                  {selectedTactic?.name} ({selectedTactic?.id})
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <MetricBox label="Betweenness" value={((betweenness[selectedTech] ?? 0) * 100).toFixed(1)} unit="%" color="#3b82f6" />
                <MetricBox label="Chain Count" value={chainCoverage[selectedTech] ?? 0} unit={`/${filteredChains.length}`} color="#6366f1" />
                <MetricBox label="Exposure" value={((exposures[selectedTech] ?? 1) * 100).toFixed(0)} unit="%" color={
                  (exposures[selectedTech] ?? 1) > 0.7 ? "#ef4444" : (exposures[selectedTech] ?? 1) > 0.4 ? "#f59e0b" : "#22c55e"
                } />
                <MetricBox label="Priority Score" value={(
                  (betweenness[selectedTech] ?? 0) * (exposures[selectedTech] ?? 1) * (chainCoverage[selectedTech] ?? 0) / filteredChains.length * 100
                ).toFixed(1)} unit="pts" color="#f59e0b" />
              </div>

              {/* Exposure slider */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "9px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                  Adjust Exposure ({selectedTech})
                </label>
                <input type="range" min={0} max={100} value={(exposures[selectedTech] ?? 100)}
                  onChange={e => handleExposureChange(selectedTech, e.target.value / 100)}
                  style={{ width: "100%", accentColor: "#f59e0b" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#475569" }}>
                  <span>Fully Mitigated</span><span>Fully Exposed</span>
                </div>
              </div>

              <button onClick={() => toggleRemediate(selectedTech)}
                style={{
                  width: "100%", padding: "8px",
                  background: remediated.has(selectedTech) ? "#22c55e20" : "#f59e0b",
                  color: remediated.has(selectedTech) ? "#22c55e" : "#0a0f1a",
                  border: remediated.has(selectedTech) ? "1px solid #22c55e" : "none",
                  borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                {remediated.has(selectedTech) ? "✓ REMEDIATED — UNDO" : "MARK AS REMEDIATED"}
              </button>

              {/* Chains this technique appears in */}
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "4px" }}>Appears in chains:</div>
                {filteredChains.filter(c => c.path.includes(selectedTech)).map((c, i) => (
                  <div key={i} style={{
                    fontSize: "9px", color: "#94a3b8", padding: "2px 0",
                    cursor: "pointer", textDecoration: chainStatus[filteredChains.indexOf(c)]?.broken ? "line-through" : "none",
                    opacity: chainStatus[filteredChains.indexOf(c)]?.broken ? 0.5 : 1,
                  }} onClick={() => setHighlightedChain(c)}>
                    → {c.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "#475569", fontSize: "11px", paddingTop: "40px", textAlign: "center" }}>
              Click a node to inspect
            </div>
          )}
        </div>
      </div>

      {/* Analysis Panel */}
      {showAnalysis && (
        <div style={{
          borderTop: "1px solid #1e293b", padding: "16px 24px",
          background: "#0d1321",
        }}>
          <h3 style={{ fontSize: "11px", color: "#f59e0b", margin: "0 0 12px 0", letterSpacing: "0.5px" }}>
            ◆ OPTIMIZATION ANALYSIS
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <AnalysisCard title="Greedy Set Cover Result">
              <p>With a budget of <strong style={{ color: "#f59e0b" }}>{remediationBudget}</strong> remediations,
              the optimal selection disrupts <strong style={{ color: "#22c55e" }}>{optimal.chainsDisrupted}/{optimal.chainsTotal}</strong> attack chains.</p>
              <p style={{ marginTop: "6px" }}>Optimal targets: {optimal.selected.map(id => {
                const t = TECHNIQUES.find(t => t.id === id);
                return t ? `${id} (${t.name})` : id;
              }).join(", ")}</p>
              <p style={{ marginTop: "6px", color: "#64748b" }}>
                Algorithm: Greedy weighted maximum coverage. Each iteration selects the technique
                that covers the most remaining unchained paths, weighted by severity × exposure.
                Guaranteed ≥63% of optimal (1 - 1/e approximation bound).
              </p>
            </AnalysisCard>
            <AnalysisCard title="Chokepoint Analysis">
              <p>Highest betweenness centrality nodes (most paths flow through):</p>
              {TECHNIQUES
                .map(t => ({ ...t, bc: betweenness[t.id] ?? 0 }))
                .sort((a, b) => b.bc - a.bc)
                .slice(0, 5)
                .map((t, i) => (
                  <div key={i} style={{ fontSize: "10px", marginTop: "4px" }}>
                    <span style={{ color: "#f59e0b" }}>{t.id}</span> {t.name} — centrality: {(t.bc * 100).toFixed(1)}%
                    {remediated.has(t.id) && <span style={{ color: "#22c55e" }}> ✓</span>}
                  </div>
                ))
              }
            </AnalysisCard>
            <AnalysisCard title="Risk Posture Summary">
              {(() => {
                const avgExposure = TECHNIQUES.reduce((s, t) => s + (exposures[t.id] ?? 1), 0) / TECHNIQUES.length;
                const highExposed = TECHNIQUES.filter(t => (exposures[t.id] ?? 1) > 0.7).length;
                const disruptionRate = totalDisrupted / filteredChains.length;
                return (
                  <>
                    <p>Average node exposure: <strong style={{
                      color: avgExposure > 0.6 ? "#ef4444" : avgExposure > 0.3 ? "#f59e0b" : "#22c55e"
                    }}>{(avgExposure * 100).toFixed(0)}%</strong></p>
                    <p>High-exposure nodes (>70%): <strong style={{ color: "#ef4444" }}>{highExposed}</strong> of {TECHNIQUES.length}</p>
                    <p>Chain disruption rate: <strong style={{
                      color: disruptionRate > 0.8 ? "#22c55e" : disruptionRate > 0.5 ? "#f59e0b" : "#ef4444"
                    }}>{(disruptionRate * 100).toFixed(0)}%</strong></p>
                    <p style={{ marginTop: "6px", color: "#64748b" }}>
                      {disruptionRate === 1 ? "All known attack chains have at least one broken link." :
                        disruptionRate > 0.7 ? "Good coverage but some chains remain viable." :
                          disruptionRate > 0.4 ? "Moderate risk — several attack paths remain open." :
                            "Critical risk — majority of attack paths are unimpeded."}
                    </p>
                  </>
                );
              })()}
            </AnalysisCard>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: "9px", color: "#64748b" }}>{label}</span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "9px", color: "#94a3b8" }}>{label}</span>
    </div>
  );
}

function MetricBox({ label, value, unit, color }) {
  return (
    <div style={{
      background: "#1e293b", borderRadius: "4px", padding: "8px",
      border: `1px solid ${color}22`,
    }}>
      <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color }}>
        {value}<span style={{ fontSize: "9px", color: "#475569" }}>{unit}</span>
      </div>
    </div>
  );
}

function AnalysisCard({ title, children }) {
  return (
    <div style={{
      background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "6px", padding: "12px",
    }}>
      <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, marginBottom: "8px", letterSpacing: "0.5px" }}>{title}</div>
      <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.5" }}>{children}</div>
    </div>
  );
}
