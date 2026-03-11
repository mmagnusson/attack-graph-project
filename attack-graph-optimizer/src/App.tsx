// ─── App.tsx — Attack Path Optimizer (main component) ─────────────────────────
// State, computed values, effects, and handler functions.
// JSX return is in a follow-up edit.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { TECHNIQUES, EDGES, ATTACK_CHAINS } from './data/techniques';
import { CHAIN_COLORS, MAX_HIGHLIGHTED_CHAINS, CONTROL_CATEGORIES } from './data/constants';
import {
  TECHNIQUE_EXAMPLES,
  CHAIN_TECHNIQUE_CONTEXT,
  TECHNIQUE_PLATFORMS,
  TECHNIQUE_MITIGATIONS,
  CHAIN_PROFILES,
} from './data/techniqueMetadata';
import { getFrameworkConfig } from './data/frameworkConfig';
import { loadStixData } from './data/loadAttackData';

import {
  computeExposureScores,
  buildActorTechMap,
} from './engine/exposureEngine';
import {
  computeBetweenness,
  computeChainCoverage,
  findOptimalRemediation,
  layoutNodes,
  sanitizeCSVCell,
} from './engine/graphModel';
import { detectFramework, parseStixBundle } from './engine/stixParser';

import { encodeStateToHash, decodeHashToState } from './hooks/useUrlState';

import { GraphView } from './components/Graph';
import { Stat, LegendItem, MetricBox, AnalysisCard, PopoutPanel, PopoutButton, PopoutPlaceholder } from './components/Analysis';
import { ExecutiveSummary } from './components/Export';
import { ProfileWizard } from './components/ProfileWizard';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttackPathOptimizer() {
  // Framework selection (enterprise vs ICS/OT)
  const [framework, setFramework] = useState("enterprise");
  const fwConfig = useMemo(() => getFrameworkConfig(framework), [framework]);

  const [envPreset, setEnvPreset] = useState("government");
  const [exposures, setExposures] = useState<Record<string, number>>({});
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [expandedExamples, setExpandedExamples] = useState(false);
  useEffect(() => { setExpandedExamples(false); }, [selectedTech]);
  const [highlightedChains, setHighlightedChains] = useState<any[]>([]);
  const [isolateChain, setIsolateChain] = useState(false);
  // Auto-clear isolate when all chains are deselected
  useEffect(() => { if (highlightedChains.length === 0) setIsolateChain(false); }, [highlightedChains]);
  const [remediated, setRemediated] = useState<Set<string>>(new Set());
  const [remediationBudget, setRemediationBudget] = useState(5);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [showBottomPanels, setShowBottomPanels] = useState(true);
  const isDraggingDivider = useRef(false);

  // Phase 1: Dynamic data source
  const [dataSource, setDataSource] = useState("stix");
  const [customData, setCustomData] = useState<any>(null);
  const [stixLoading, setStixLoading] = useState(false);
  const [stixError, setStixError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoDetectedFw, setAutoDetectedFw] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navFileInputRef = useRef<HTMLInputElement | null>(null);

  // Phase 5: Security Controls
  const [deployedControls, setDeployedControls] = useState<Set<string>>(new Set());
  const [showControls, setShowControls] = useState(false);

  // Popout panel states
  const [popoutChains, setPopoutChains] = useState(false);
  const [popoutPriority, setPopoutPriority] = useState(false);
  const [popoutDetail, setPopoutDetail] = useState(false);
  const [popoutAnalysis, setPopoutAnalysis] = useState(false);
  const [popoutControls, setPopoutControls] = useState(false);

  // Gap Analysis
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [popoutGapAnalysis, setPopoutGapAnalysis] = useState(false);
  const [popoutGraph, setPopoutGraph] = useState(false);

  // Node dragging: custom position overrides
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Feature: Technique search
  const [techSearchQuery, setTechSearchQuery] = useState("");
  // Feature: Chain search
  const [chainSearchQuery, setChainSearchQuery] = useState("");
  // Feature: Collapsible tactic clusters
  const [collapsedTactics, setCollapsedTactics] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem("attackPathOptimizer_collapsed");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch (e) { return new Set(); }
  });
  // Feature: Sub-techniques
  const [showSubTechniques, setShowSubTechniques] = useState(false);
  // Feature: Custom chain builder
  const [chainBuilderMode, setChainBuilderMode] = useState(false);
  const [chainBuilderPath, setChainBuilderPath] = useState<string[]>([]);
  const [chainBuilderName, setChainBuilderName] = useState("");
  const [customChains, setCustomChains] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem("attackPathOptimizer_customChains");
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
  });
  // Feature: Executive summary
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [popoutExecutive, setPopoutExecutive] = useState(false);
  // F4: Phase weighting toggle
  const [phaseWeighting, setPhaseWeighting] = useState(false);
  // F2: Platform filtering
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string> | null>(null); // null = all platforms
  // F5: Control presets
  const [controlPreset, setControlPreset] = useState("none");
  // F7: Threat actor profile expansion
  const [expandedChainProfile, setExpandedChainProfile] = useState<string | null>(null);

  // Phase 3: Environment Profiling
  const [environmentProfile, setEnvironmentProfile] = useState<any>(() => {
    try {
      const s = localStorage.getItem("attackPathOptimizer_envProfile");
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  });
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [profileExposures, setProfileExposures] = useState<Record<string, any> | null>(null);

  // Dual-framework compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const otherFramework = framework === "enterprise" ? "ics" : "enterprise";
  const otherFwConfig = useMemo(() => getFrameworkConfig(otherFramework), [otherFramework]);

  // Phase 3: Persistence helpers
  const [showSaved, setShowSaved] = useState(false);
  const skipEnvEffect = useRef(false);
  const mountTime = useRef(Date.now());
  // Feature: Shareable URLs
  const hashChainNamesRef = useRef<string[] | null>(null);
  const [shareConfirm, setShareConfirm] = useState(false);

  // ─── Derived active data from source ──────────────────────────────────────────

  const activeTechniques = customData?.techniques || TECHNIQUES;
  const activeEdges = customData?.edges || EDGES;
  const activeChains = useMemo(
    () => [...(customData?.chains || ATTACK_CHAINS), ...customChains],
    [customData, customChains],
  );
  const activeTechDescriptions = customData?.techniqueDescriptions || TECHNIQUE_EXAMPLES;
  const activeChainTechContext = customData?.chainTechContext || CHAIN_TECHNIQUE_CONTEXT;
  const activePlatforms = customData?.techniquePlatforms || TECHNIQUE_PLATFORMS;
  const activeMitigations = customData?.mitigations || TECHNIQUE_MITIGATIONS;
  const activeGroupProfiles = customData?.groupProfiles || CHAIN_PROFILES;

  // ─── Display techniques (filtered by sub-technique toggle + F2 platform filter) ─

  const displayTechniques = useMemo(() => {
    let techs: any[];
    if (showSubTechniques) {
      techs = [...activeTechniques].sort((a: any, b: any) => {
        if (a.tactic !== b.tactic) return 0;
        const aBase = a.parentId || a.id;
        const bBase = b.parentId || b.id;
        if (aBase !== bBase) return aBase.localeCompare(bBase);
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return a.id.localeCompare(b.id);
      });
    } else {
      techs = activeTechniques.filter((t: any) => !t.parentId);
    }
    // F2: Platform filter
    if (selectedPlatforms && selectedPlatforms.size > 0) {
      techs = techs.filter((t: any) => {
        const plats = activePlatforms[t.id];
        if (!plats || plats.length === 0) return true; // include if no platform data
        return plats.some((p: string) => selectedPlatforms.has(p));
      });
    }
    return techs;
  }, [activeTechniques, showSubTechniques, selectedPlatforms, activePlatforms]);

  // ─── Technique search matches ─────────────────────────────────────────────────

  const techSearchMatches = useMemo(() => {
    if (!techSearchQuery.trim()) return null;
    const q = techSearchQuery.toLowerCase().trim();
    const matches = new Set<string>();
    displayTechniques.forEach((t: any) => {
      if (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) matches.add(t.id);
    });
    return matches;
  }, [techSearchQuery, displayTechniques]);

  // ─── Effective exposures with security control adjustments ────────────────────

  const effectiveExposures = useMemo(() => {
    if (deployedControls.size === 0) return exposures;
    const result: Record<string, number> = { ...exposures };
    fwConfig.securityControls.forEach((ctrl: any) => {
      if (!deployedControls.has(ctrl.id)) return;
      Object.entries(ctrl.coverage).forEach(([tid, reduction]: [string, any]) => {
        const current = result[tid] ?? 1.0;
        result[tid] = Math.max(0, Math.min(1, current * (1 + reduction)));
      });
    });
    return result;
  }, [exposures, deployedControls, fwConfig]);

  // ─── Draggable divider between graph and bottom panels ────────────────────────

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingDivider.current) return;
      const container = document.getElementById('split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newH = Math.max(60, Math.min(rect.height - 60, rect.bottom - e.clientY));
      setPanelHeight(newH);
    };
    const onUp = () => {
      isDraggingDivider.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDividerDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // ─── Restore state from hash or localStorage on mount ─────────────────────────

  useEffect(() => {
    const hashState = decodeHashToState(window.location.hash);
    if (hashState) {
      if (hashState.framework) setFramework(hashState.framework);
      if (hashState.envPreset) { skipEnvEffect.current = true; setEnvPreset(hashState.envPreset); }
      if (hashState.sectorFilter) setSectorFilter(hashState.sectorFilter);
      if (hashState.remediationBudget) setRemediationBudget(hashState.remediationBudget);
      if (hashState.dataSource) setDataSource(hashState.dataSource);
      if (hashState.remediated) setRemediated(new Set(hashState.remediated));
      if (hashState.deployedControls) setDeployedControls(new Set(hashState.deployedControls));
      if (hashState.chains) hashChainNamesRef.current = hashState.chains;
      if (hashState.phaseWeighting) setPhaseWeighting(true);
      if (hashState.selectedPlatforms) setSelectedPlatforms(new Set(hashState.selectedPlatforms));
      if (hashState.controlPreset) setControlPreset(hashState.controlPreset);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }
    try {
      const raw = localStorage.getItem("attackPathOptimizer");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.framework) setFramework(saved.framework);
      if (saved.envPreset) { skipEnvEffect.current = true; setEnvPreset(saved.envPreset); }
      if (saved.sectorFilter) setSectorFilter(saved.sectorFilter);
      if (saved.remediationBudget) setRemediationBudget(saved.remediationBudget);
      if (saved.dataSource) setDataSource(saved.dataSource);
      if (saved.exposures) setExposures(saved.exposures);
      if (saved.remediated) setRemediated(new Set(saved.remediated));
      if (saved.deployedControls) setDeployedControls(new Set(saved.deployedControls));
      if (saved.phaseWeighting) setPhaseWeighting(saved.phaseWeighting);
      if (saved.controlPreset) setControlPreset(saved.controlPreset);
      if (saved.selectedPlatforms) setSelectedPlatforms(new Set(saved.selectedPlatforms));
    } catch (e) { /* ignore */ }
  }, []);

  // Resolve chain names from hash once chains are loaded
  useEffect(() => {
    if (!hashChainNamesRef.current || activeChains.length === 0) return;
    const names = hashChainNamesRef.current;
    hashChainNamesRef.current = null;
    const matched = names.map((n: string) => activeChains.find((c: any) => c.name === n)).filter(Boolean);
    if (matched.length > 0) setHighlightedChains(matched.slice(0, MAX_HIGHLIGHTED_CHAINS));
  }, [activeChains]);

  // ─── Environment preset -> exposures ──────────────────────────────────────────

  useEffect(() => {
    if (skipEnvEffect.current) { skipEnvEffect.current = false; return; }
    const preset = fwConfig.envPresets[envPreset];
    if (preset?.overrides) {
      setExposures({ ...preset.overrides });
    } else {
      setExposures({});
    }
  }, [envPreset, fwConfig]);

  // ─── Phase 3 Env Profiling: Compute exposure scores from environment profile ──

  const actorTechMap = useMemo(() => buildActorTechMap(activeChains), [activeChains]);

  useEffect(() => {
    if (!environmentProfile) { setProfileExposures(null); return; }
    const hasSelections = (environmentProfile.infrastructure?.length > 0) || (environmentProfile.securityTools?.length > 0);
    if (!hasSelections) { setProfileExposures(null); return; }
    const scores = computeExposureScores(environmentProfile, fwConfig.coverageKB, displayTechniques, actorTechMap);
    setProfileExposures(scores);
    // Merge profile-computed exposures into the exposures state
    const newExposures: Record<string, number> = {};
    for (const [tid, data] of Object.entries(scores) as [string, any][]) {
      newExposures[tid] = data.finalExposure;
    }
    setExposures((prev: Record<string, number>) => {
      const merged = { ...prev };
      for (const [tid, val] of Object.entries(newExposures)) {
        merged[tid] = val;
      }
      return merged;
    });
  }, [environmentProfile, fwConfig, displayTechniques, actorTechMap]);

  // Persist environment profile to localStorage
  useEffect(() => {
    if (environmentProfile) {
      localStorage.setItem("attackPathOptimizer_envProfile", JSON.stringify(environmentProfile));
    } else {
      localStorage.removeItem("attackPathOptimizer_envProfile");
    }
  }, [environmentProfile]);

  // ─── Auto-save to localStorage (debounced 500ms) ──────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("attackPathOptimizer", JSON.stringify({
          framework, envPreset, sectorFilter, remediationBudget,
          dataSource: dataSource === "upload" ? (fwConfig.hasBuiltin ? "builtin" : "stix") : dataSource,
          exposures, remediated: Array.from(remediated),
          deployedControls: Array.from(deployedControls),
          phaseWeighting, controlPreset,
          selectedPlatforms: selectedPlatforms ? Array.from(selectedPlatforms) : null,
        }));
        if (Date.now() - mountTime.current > 1000) {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 1500);
        }
      } catch (e) { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [framework, envPreset, sectorFilter, remediationBudget, dataSource, exposures, remediated, deployedControls, phaseWeighting, controlPreset, selectedPlatforms, fwConfig]);

  // ─── STIX data loading ────────────────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();
    setCustomPositions({});
    if (dataSource === "stix") {
      setStixLoading(true);
      setStixError(null);
      loadStixData(controller.signal, fwConfig as any).then((data: any) => {
        if (controller.signal.aborted) return;
        setCustomData(data);
        setStixLoading(false);
      }).catch((err: any) => {
        if (controller.signal.aborted) return;
        setStixError(err.message);
        setStixLoading(false);
        if (fwConfig.hasBuiltin) setDataSource("builtin");
      });
    } else if (dataSource === "upload") {
      // Data already set by handleStixFileUpload
    } else {
      setCustomData(null);
      setStixError(null);
      setUploadedFileName(null);
      setUploadError(null);
    }
    return () => controller.abort();
  }, [dataSource, framework]);

  // ─── Compare mode: load other framework's STIX data ───────────────────────────

  useEffect(() => {
    if (!compareMode) { setCompareData(null); return; }
    const controller = new AbortController();
    setCompareLoading(true);
    loadStixData(controller.signal, otherFwConfig as any).then((data: any) => {
      if (controller.signal.aborted) return;
      setCompareData(data);
      setCompareLoading(false);
    }).catch((_err: any) => {
      if (controller.signal.aborted) return;
      setCompareLoading(false);
    });
    return () => controller.abort();
  }, [compareMode, otherFwConfig]);

  // ─── Framework change side effect: reset framework-dependent state ────────────

  const prevFramework = useRef(framework);
  useEffect(() => {
    if (prevFramework.current === framework) return;
    prevFramework.current = framework;
    setSelectedPlatforms(null);
    setHighlightedChains([]);
    setSelectedTech(null);
    setShowSubTechniques(false);
    setExpandedChainProfile(null);
    setCollapsedTactics(new Set());
    setCustomPositions({});
    setEnvPreset("default");
    setControlPreset("none");
    setDeployedControls(new Set());
    setEnvironmentProfile(null);
    setProfileExposures(null);
    // Auto-switch to STIX if framework has no builtin
    const cfg = getFrameworkConfig(framework);
    if (!cfg.hasBuiltin && dataSource === "builtin") setDataSource("stix");
  }, [framework]);

  // ─── Layout & graph computations ──────────────────────────────────────────────

  const layoutResult = useMemo(() => layoutNodes(displayTechniques, fwConfig.tactics), [displayTechniques, fwConfig]);
  const displayEdges = useMemo(() => {
    const techSet = new Set(displayTechniques.map((t: any) => t.id));
    return activeEdges.filter((e: any) => techSet.has(e.from) && techSet.has(e.to));
  }, [displayTechniques, activeEdges]);
  const viewHeight = layoutResult.viewHeight;
  const viewWidth = layoutResult.viewWidth;
  const phaseCenters = layoutResult.phaseCenters;
  const positions = useMemo(() => {
    if (Object.keys(customPositions).length === 0) return layoutResult.positions;
    return { ...layoutResult.positions, ...customPositions };
  }, [layoutResult.positions, customPositions]);
  const betweenness = useMemo(() => computeBetweenness(activeTechniques, activeEdges), [activeTechniques, activeEdges]);

  // ─── Compare mode: layout for other framework ────────────────────────────────

  const compareLayout = useMemo(() => {
    if (!compareMode || !compareData) return null;
    const techs = compareData.techniques.filter((t: any) => !t.parentId);
    const layout = layoutNodes(techs, otherFwConfig.tactics);
    const edges = (() => {
      const techSet = new Set(techs.map((t: any) => t.id));
      return compareData.edges.filter((e: any) => techSet.has(e.from) && techSet.has(e.to));
    })();
    const bc = computeBetweenness(techs, edges);
    const cc = computeChainCoverage(techs, compareData.chains || []);
    return {
      techniques: techs, edges, positions: layout.positions,
      viewHeight: layout.viewHeight, viewWidth: layout.viewWidth,
      phaseCenters: layout.phaseCenters, betweenness: bc,
      chainCoverage: cc, chains: compareData.chains || [],
    };
  }, [compareMode, compareData, otherFwConfig]);

  // ─── Compare mode: convergence analysis ───────────────────────────────────────

  const compareAnalysis = useMemo(() => {
    if (!compareMode || !compareData) return null;
    const currentIds = new Set<string>(activeTechniques.filter((t: any) => !t.parentId).map((t: any) => t.id));
    const otherIds = new Set<string>((compareData.techniques || []).filter((t: any) => !t.parentId).map((t: any) => t.id));
    const shared = new Set<string>(Array.from(currentIds).filter((id: string) => otherIds.has(id)));
    const uniqueCurrent = new Set<string>(Array.from(currentIds).filter((id: string) => !otherIds.has(id)));
    const uniqueOther = new Set<string>(Array.from(otherIds).filter((id: string) => !currentIds.has(id)));
    return { currentCount: currentIds.size, otherCount: otherIds.size, shared, uniqueCurrent, uniqueOther };
  }, [compareMode, compareData, activeTechniques]);

  // ─── Filtered chains ─────────────────────────────────────────────────────────

  const filteredChains = useMemo(() => {
    if (sectorFilter === "all") return activeChains;
    return activeChains.filter((c: any) => c.sector === sectorFilter || c.sector === "all");
  }, [sectorFilter, activeChains]);

  const chainCoverage = useMemo(() => computeChainCoverage(activeTechniques, filteredChains), [activeTechniques, filteredChains]);

  // ─── Gap Analysis computation ─────────────────────────────────────────────────

  const gapAnalysis = useMemo(() => {
    const controlCoverage: Record<string, any[]> = {};
    fwConfig.securityControls.forEach((ctrl: any) => {
      Object.keys(ctrl.coverage).forEach((tid: string) => {
        if (!controlCoverage[tid]) controlCoverage[tid] = [];
        controlCoverage[tid].push(ctrl);
      });
    });
    const gaps: any[] = [];
    displayTechniques.forEach((t: any) => {
      if (remediated.has(t.id)) return;
      const availableControls = controlCoverage[t.id] || [];
      const deployedForTech = availableControls.filter((c: any) => deployedControls.has(c.id));
      let gapType: string | null = null;
      if (availableControls.length === 0) {
        gapType = "no-coverage";
      } else if (deployedForTech.length === 0) {
        gapType = "not-deployed";
      } else {
        return;
      }
      const exposure = effectiveExposures[t.id] ?? 1.0;
      const bc = betweenness[t.id] ?? 0;
      const cc = chainCoverage[t.id] ?? 0;
      const riskScore = exposure * bc * Math.max(cc, 0.1);
      gaps.push({ ...t, gapType, exposure, bc, cc, riskScore, availableControls });
    });
    gaps.sort((a: any, b: any) => b.riskScore - a.riskScore);
    return {
      gaps,
      noCoverageCount: gaps.filter((g: any) => g.gapType === "no-coverage").length,
      notDeployedCount: gaps.filter((g: any) => g.gapType === "not-deployed").length,
    };
  }, [displayTechniques, deployedControls, effectiveExposures, betweenness, chainCoverage, remediated, fwConfig]);

  const gapNodeSet = useMemo(() => {
    if (!showGapAnalysis) return null;
    return new Set(gapAnalysis.gaps.map((g: any) => g.id));
  }, [showGapAnalysis, gapAnalysis]);

  // ─── Optimal remediation ──────────────────────────────────────────────────────

  const optimal = useMemo(() =>
    findOptimalRemediation(activeTechniques, filteredChains, effectiveExposures, remediationBudget, phaseWeighting, fwConfig as any),
    [activeTechniques, filteredChains, effectiveExposures, remediationBudget, phaseWeighting, fwConfig],
  );

  // ─── Chain status ─────────────────────────────────────────────────────────────

  const chainStatus = useMemo(() => {
    return filteredChains.map((chain: any) => {
      const broken = chain.path.some((tid: string) => remediated.has(tid));
      const breakpoints = chain.path.filter((tid: string) => remediated.has(tid));
      const exposedNodes = chain.path.filter((tid: string) => (effectiveExposures[tid] ?? 1.0) > 0.7);
      const avgExposure = chain.path.reduce((s: number, tid: string) => s + (effectiveExposures[tid] ?? 1.0), 0) / chain.path.length;
      return { ...chain, broken, breakpoints, exposedNodes, avgExposure };
    });
  }, [filteredChains, remediated, effectiveExposures]);

  const totalDisrupted = chainStatus.filter((c: any) => c.broken).length;

  // ─── F6: Chain uniqueness / comparison analysis ───────────────────────────────

  const chainSetAnalysis = useMemo(() => {
    if (highlightedChains.length < 2) return null;
    const sets = highlightedChains.map((c: any) => new Set<string>(c.path));
    const union = new Set<string>();
    sets.forEach((s: Set<string>) => s.forEach((t: string) => union.add(t)));
    const intersection = new Set<string>(Array.from(sets[0]).filter((t: string) => sets.every((s: Set<string>) => s.has(t))));
    const uniquePerChain = highlightedChains.map((c: any, i: number) => ({
      name: c.name,
      colorIndex: i,
      unique: new Set<string>(Array.from(sets[i]).filter((t: string) => sets.every((s: Set<string>, j: number) => j === i || !s.has(t)))),
    }));
    return { intersection, union, uniquePerChain };
  }, [highlightedChains]);

  // ─── Chain search display filter ──────────────────────────────────────────────

  const displayedChainStatus = useMemo(() => {
    if (!chainSearchQuery.trim()) return chainStatus;
    const q = chainSearchQuery.toLowerCase().trim();
    return chainStatus.filter((c: any) =>
      c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) ||
      c.path.some((tid: string) => tid.toLowerCase().includes(q)),
    );
  }, [chainStatus, chainSearchQuery]);

  // ─── Handler functions ────────────────────────────────────────────────────────

  const handleExposureChange = (techId: string, value: number) => {
    setExposures((prev: Record<string, number>) => ({ ...prev, [techId]: value }));
  };

  const toggleRemediate = (techId: string) => {
    setRemediated((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(techId)) next.delete(techId);
      else next.add(techId);
      return next;
    });
  };

  const applyOptimal = () => {
    setRemediated(new Set(optimal.selected));
  };

  const toggleHighlightedChain = useCallback((chain: any) => {
    setHighlightedChains((prev: any[]) => {
      const idx = prev.findIndex((c: any) => c.name === chain.name);
      if (idx >= 0) return prev.filter((_: any, i: number) => i !== idx);
      if (prev.length >= MAX_HIGHLIGHTED_CHAINS) return [...prev.slice(1), chain];
      return [...prev, chain];
    });
  }, []);

  const handleStixFileUpload = useCallback((file: File) => {
    setUploadError(null);
    setAutoDetectedFw(null);
    if (file.size > 100 * 1024 * 1024) { setUploadError("File too large (max 100 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bundle = JSON.parse(e.target.result);
        const detected = detectFramework(bundle);
        let activeFwConfig = fwConfig;
        if (detected && detected !== framework) {
          setFramework(detected);
          activeFwConfig = getFrameworkConfig(detected);
          setAutoDetectedFw(detected);
          setTimeout(() => setAutoDetectedFw(null), 3000);
        }
        const result = parseStixBundle(bundle, activeFwConfig as any);
        setCustomData(result);
        setUploadedFileName(file.name);
        setDataSource("upload");
      } catch (err: any) {
        setUploadError(err.message || "Failed to parse STIX file");
      }
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  }, [fwConfig, framework]);

  const handleShare = useCallback(() => {
    const state = {
      framework,
      dataSource: dataSource === "upload" ? (fwConfig.hasBuiltin ? "builtin" : "stix") : dataSource,
      envPreset,
      sectorFilter,
      remediationBudget,
      remediated: Array.from(remediated),
      deployedControls: Array.from(deployedControls),
      chains: highlightedChains.map((c: any) => c.name),
      phaseWeighting,
      selectedPlatforms: selectedPlatforms ? Array.from(selectedPlatforms) : [],
      controlPreset,
    };
    const hash = encodeStateToHash(state as any);
    const url = window.location.pathname + window.location.search + (hash ? "#" + hash : "");
    window.history.replaceState(null, "", url);
    navigator.clipboard.writeText(window.location.origin + url).then(() => {
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 2000);
    }).catch(() => {
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 2000);
    });
  }, [framework, dataSource, envPreset, sectorFilter, remediationBudget, remediated, deployedControls, highlightedChains, phaseWeighting, selectedPlatforms, controlPreset, fwConfig]);

  const handleNodeDrag = useCallback((nodeId: string, dx: number, dy: number) => {
    setCustomPositions((prev: Record<string, { x: number; y: number }>) => {
      const base = layoutResult.positions[nodeId] || { x: 0, y: 0 };
      const current = prev[nodeId] || base;
      return { ...prev, [nodeId]: { x: current.x + dx, y: current.y + dy } };
    });
  }, [layoutResult.positions]);

  const resetAll = () => {
    setFramework("enterprise");
    setRemediated(new Set());
    setSelectedTech(null);
    setHighlightedChains([]);
    setShowAnalysis(false);
    setEnvPreset("government");
    setSectorFilter("all");
    setRemediationBudget(5);
    setCustomPositions({});
    setDeployedControls(new Set());
    setShowControls(false);
    setPopoutChains(false);
    setPopoutPriority(false);
    setPopoutDetail(false);
    setPopoutAnalysis(false);
    setPopoutControls(false);
    setTechSearchQuery("");
    setChainSearchQuery("");
    setCollapsedTactics(new Set());
    setShowSubTechniques(false);
    setChainBuilderMode(false);
    setChainBuilderPath([]);
    setChainBuilderName("");
    setShowExecutiveSummary(false);
    setPopoutExecutive(false);
    setUploadedFileName(null);
    setUploadError(null);
    setShareConfirm(false);
    setPanelHeight(300);
    setShowBottomPanels(true);
    setShowGapAnalysis(false);
    setPopoutGapAnalysis(false);
    setPopoutGraph(false);
    setPhaseWeighting(false);
    setSelectedPlatforms(null);
    setControlPreset("none");
    setExpandedChainProfile(null);
    setCompareMode(false);
    setCompareData(null);
    setAutoDetectedFw(null);
    setEnvironmentProfile(null);
    setProfileExposures(null);
    setShowProfileWizard(false);
    try {
      localStorage.removeItem("attackPathOptimizer");
      localStorage.removeItem("attackPathOptimizer_collapsed");
      localStorage.removeItem("attackPathOptimizer_envProfile");
    } catch (e) { /* ignore */ }
    // Force STIX reload: briefly switch away then back so the effect always fires
    setDataSource("builtin");
    setTimeout(() => setDataSource("stix"), 0);
  };

  // ─── Derived values for detail panel ──────────────────────────────────────────

  const selectedTechData = displayTechniques.find((t: any) => t.id === selectedTech);
  const selectedTactic = selectedTechData ? fwConfig.tactics.find((ta: any) => ta.id === selectedTechData.tactic) : null;

  const techExamples = useMemo(() => {
    if (!selectedTech) return null;
    const raw = activeTechDescriptions[selectedTech];
    if (!raw) return null;
    return typeof raw === 'string' ? { summary: raw, examples: [] } : raw;
  }, [selectedTech, activeTechDescriptions]);

  const getChainTechContext = useCallback((chainName: string, techId: string) => {
    const descs = activeChainTechContext[chainName];
    if (!descs) return null;
    if (descs[techId]) return descs[techId];
    const subs = Object.entries(descs)
      .filter(([k]: [string, any]) => k.startsWith(techId + '.'))
      .map(([, v]: [string, any]) => v);
    return subs.length > 0 ? subs[0] : null;
  }, [activeChainTechContext]);

  // ─── Priority ranking ────────────────────────────────────────────────────────

  const priorityRanking = useMemo(() => {
    return displayTechniques
      .map((t: any) => {
        let priority = (betweenness[t.id] ?? 0) * (effectiveExposures[t.id] ?? 1.0) * (chainCoverage[t.id] ?? 0) / Math.max(filteredChains.length, 1);
        if (phaseWeighting) priority *= (fwConfig.phaseWeights[fwConfig.tacticPhase[t.tactic]] ?? 1.0);
        return {
          ...t,
          exposure: effectiveExposures[t.id] ?? 1.0,
          betweennessVal: betweenness[t.id] ?? 0,
          chainCount: chainCoverage[t.id] ?? 0,
          priority,
        };
      })
      .filter((t: any) => t.priority > 0 && !remediated.has(t.id))
      .sort((a: any, b: any) => b.priority - a.priority)
      .slice(0, 12);
  }, [displayTechniques, effectiveExposures, betweenness, chainCoverage, remediated, filteredChains, phaseWeighting, fwConfig]);

  // ─── CSV Export ───────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    let csv = "Rank,Technique ID,Name,Tactic,Exposure%,Betweenness%,Chain Count,Priority Score,Remediated,In Optimal Set\n";
    displayTechniques
      .map((t: any) => ({
        ...t,
        exposure: effectiveExposures[t.id] ?? 1.0,
        bc: betweenness[t.id] ?? 0,
        cc: chainCoverage[t.id] ?? 0,
        priority: (betweenness[t.id] ?? 0) * (effectiveExposures[t.id] ?? 1.0) * (chainCoverage[t.id] ?? 0) / Math.max(filteredChains.length, 1),
      }))
      .sort((a: any, b: any) => b.priority - a.priority)
      .forEach((t: any, i: number) => {
        const tactic = fwConfig.tactics.find((ta: any) => ta.id === t.tactic);
        csv += [
          i + 1, sanitizeCSVCell(t.id), '"' + sanitizeCSVCell(t.name).replace(/"/g, '""') + '"', sanitizeCSVCell(tactic?.name || ""),
          (t.exposure * 100).toFixed(1), (t.bc * 100).toFixed(1), t.cc,
          (t.priority * 100).toFixed(1),
          remediated.has(t.id) ? "Y" : "N",
          optimal.selected.includes(t.id) ? "Y" : "N",
        ].join(",") + "\n";
      });
    csv += "\nChain Name,Severity%,Disrupted,Break Points,Avg Exposure%,Sector\n";
    chainStatus.forEach((c: any) => {
      csv += [
        '"' + sanitizeCSVCell(c.name).replace(/"/g, '""') + '"',
        (c.severity * 100).toFixed(0),
        c.broken ? "Y" : "N",
        '"' + sanitizeCSVCell(c.breakpoints.join("; ")) + '"',
        (c.avgExposure * 100).toFixed(1),
        sanitizeCSVCell(c.sector),
      ].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attack-path-analysis-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [displayTechniques, effectiveExposures, betweenness, chainCoverage, filteredChains, remediated, optimal, chainStatus, fwConfig]);

  // ─── ATT&CK Navigator Layer Export ────────────────────────────────────────────

  const exportNavigatorLayer = useCallback(() => {
    const techniques = displayTechniques.map((t: any) => {
      const exposure = effectiveExposures[t.id] ?? 1.0;
      const isRemediated = remediated.has(t.id);
      const bc = betweenness[t.id] ?? 0;
      const cc = chainCoverage[t.id] ?? 0;
      const score = Math.round(exposure * 100);
      const color = isRemediated ? "#22c55e" : exposure > 0.7 ? "#ef4444" : exposure > 0.4 ? "#f59e0b" : "#22c55e";
      const deployedForTech = fwConfig.securityControls.filter((c: any) => deployedControls.has(c.id) && c.coverage[t.id]);
      const commentParts: string[] = [];
      commentParts.push(isRemediated ? "REMEDIATED" : "Exposure: " + (exposure * 100).toFixed(0) + "%");
      commentParts.push("Betweenness: " + (bc * 100).toFixed(1) + "%");
      commentParts.push("Chain count: " + cc);
      if (deployedForTech.length > 0) commentParts.push("Controls: " + deployedForTech.map((c: any) => c.name).join(", "));
      if (profileExposures && profileExposures[t.id]) {
        const pe = profileExposures[t.id];
        if (pe.coverageSources.length > 0) {
          commentParts.push("Covered by: " + pe.coverageSources.map((s: any) => s.name + " (" + (s.detect * 100).toFixed(0) + "%)").join(", "));
        }
        commentParts.push("Base exposure: " + (pe.baseExposure * 100).toFixed(0) + "% | Coverage: " + (pe.coverageReduction * 100).toFixed(0) + "%");
      }
      return {
        techniqueID: t.id,
        tactic: fwConfig.tacticToPhase[t.tactic] || "",
        score,
        color,
        comment: commentParts.join(" | "),
        enabled: !isRemediated,
      };
    });
    const layer = {
      name: "ATT&CK Path Optimizer Export",
      domain: fwConfig.navigatorDomain,
      versions: { attack: "14", navigator: "4.9.1", layer: "4.5" },
      techniques,
      gradient: { colors: ["#22c55e", "#f59e0b", "#ef4444"], minValue: 0, maxValue: 100 },
      description: "Exported from ATT&CK Path Optimizer on " + new Date().toISOString().split("T")[0],
    };
    const blob = new Blob([JSON.stringify(layer, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attack-navigator-layer-" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }, [displayTechniques, effectiveExposures, betweenness, chainCoverage, remediated, deployedControls, profileExposures, fwConfig]);

  // ─── F8: Gap Remediation Roadmap Export ───────────────────────────────────────

  const exportRemediationPlan = useCallback(() => {
    if (gapAnalysis.gaps.length === 0) return;
    const tierOf = (g: any) => {
      const s = g.riskScore;
      if (s > 0.5) return "Critical";
      if (s > 0.2) return "High";
      if (s > 0.05) return "Medium";
      return "Low";
    };
    let csv = "Priority Tier,Technique ID,Name,Tactic,Gap Type,Exposure%,Betweenness%,Chain Count,Risk Score,Recommended Controls\n";
    gapAnalysis.gaps.forEach((g: any) => {
      const tactic = fwConfig.tactics.find((ta: any) => ta.id === g.tactic);
      const recCtrls = g.availableControls.map((c: any) => c.name + " (" + c.cost + ")").join("; ") || "None available";
      csv += [
        tierOf(g), sanitizeCSVCell(g.id), '"' + sanitizeCSVCell(g.name).replace(/"/g, '""') + '"', sanitizeCSVCell(tactic?.name || ""),
        g.gapType === "no-coverage" ? "No Coverage" : "Not Deployed",
        (g.exposure * 100).toFixed(1), (g.bc * 100).toFixed(1), g.cc,
        (g.riskScore * 100).toFixed(2), '"' + sanitizeCSVCell(recCtrls) + '"',
      ].join(",") + "\n";
    });
    // Summary section
    const tiers: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    gapAnalysis.gaps.forEach((g: any) => { tiers[tierOf(g)]++; });
    const undeployedNeeded = new Set<string>();
    gapAnalysis.gaps.forEach((g: any) => g.availableControls.forEach((c: any) => { if (!deployedControls.has(c.id)) undeployedNeeded.add(c.id); }));
    const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
    let minCost = 0, maxCost = 0;
    undeployedNeeded.forEach((cid: string) => {
      const ctrl = fwConfig.securityControls.find((c: any) => c.id === cid);
      if (ctrl) { const cv = costMap[(ctrl as any).cost] || 0; minCost += cv; maxCost += cv * 2; }
    });
    csv += "\n--- SUMMARY ---\n";
    csv += "Critical Gaps," + tiers.Critical + "\nHigh Gaps," + tiers.High + "\nMedium Gaps," + tiers.Medium + "\nLow Gaps," + tiers.Low + "\n";
    csv += "Total Gaps," + gapAnalysis.gaps.length + "\n";
    csv += "Undeployed Controls Needed," + undeployedNeeded.size + "\n";
    csv += "Estimated Cost Range," + "$".repeat(Math.ceil(minCost / undeployedNeeded.size) || 1) + " - " + "$".repeat(Math.ceil(maxCost / undeployedNeeded.size) || 1) + " per control\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gap-remediation-plan-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [gapAnalysis, deployedControls, fwConfig]);

  // ─── Coverage CSV Export ──────────────────────────────────────────────────────

  const exportCoverageCSV = useCallback(() => {
    if (!profileExposures) return;
    let csv = "Technique ID,Name,Tactic,Base Exposure%,Coverage%,Actor Weight,Final Exposure%,Coverage Sources\n";
    displayTechniques.forEach((t: any) => {
      const pe = profileExposures[t.id];
      if (!pe) return;
      const tactic = fwConfig.tactics.find((ta: any) => ta.id === t.tactic);
      const sources = pe.coverageSources.map((s: any) => s.name + " (" + (s.detect * 100).toFixed(0) + "%)").join("; ") || "None";
      csv += [
        sanitizeCSVCell(t.id),
        '"' + sanitizeCSVCell(t.name).replace(/"/g, '""') + '"',
        sanitizeCSVCell(tactic?.name || ""),
        (pe.baseExposure * 100).toFixed(1),
        (pe.coverageReduction * 100).toFixed(1),
        pe.actorWeight.toFixed(2),
        (pe.finalExposure * 100).toFixed(1),
        '"' + sanitizeCSVCell(sources) + '"',
      ].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coverage-analysis-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [profileExposures, displayTechniques, fwConfig]);

  // ─── Exposure Summary stats ───────────────────────────────────────────────────

  const exposureSummary = useMemo(() => {
    if (!profileExposures) return null;
    const entries = Object.entries(profileExposures);
    if (entries.length === 0) return null;
    const highExposed = entries.filter(([, pe]: [string, any]) => pe.finalExposure > 0.7);
    const wellCovered = entries.filter(([, pe]: [string, any]) => pe.finalExposure < 0.3);
    const totalCoverage = entries.reduce((s: number, [, pe]: [string, any]) => s + pe.coverageReduction, 0) / entries.length;
    const avgExposure = entries.reduce((s: number, [, pe]: [string, any]) => s + pe.finalExposure, 0) / entries.length;
    // Top uncovered chokepoints: high exposure + high betweenness
    const uncoveredChokepoints = entries
      .map(([tid, pe]: [string, any]) => ({ tid, exposure: pe.finalExposure, bc: betweenness[tid] ?? 0, cc: chainCoverage[tid] ?? 0 }))
      .filter((x: any) => x.exposure > 0.5)
      .sort((a: any, b: any) => (b.bc * b.exposure) - (a.bc * a.exposure))
      .slice(0, 5);
    return { highExposed: highExposed.length, wellCovered: wellCovered.length, totalCoverage, avgExposure, uncoveredChokepoints, totalTechniques: entries.length };
  }, [profileExposures, betweenness, chainCoverage]);

  // ─── ATT&CK Navigator Layer Import ────────────────────────────────────────────

  const handleNavigatorImport = useCallback((file: File) => {
    if (file.size > 100 * 1024 * 1024) { setUploadError("File too large (max 100 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.techniques || !Array.isArray(data.techniques) || !data.techniques[0]?.techniqueID) {
          setUploadError("Not a valid Navigator layer (missing techniques[].techniqueID)");
          return;
        }
        const newExposures = { ...exposures };
        const newRemediated = new Set(remediated);
        let importedCount = 0;
        const techIds = new Set(activeTechniques.map((t: any) => t.id));
        data.techniques.forEach((nt: any) => {
          if (!techIds.has(nt.techniqueID)) return;
          if (typeof nt.score === "number") {
            newExposures[nt.techniqueID] = Math.max(0, Math.min(1, nt.score / 100));
          }
          if (nt.enabled === false) {
            newRemediated.add(nt.techniqueID);
          }
          importedCount++;
        });
        setExposures(newExposures);
        setRemediated(newRemediated);
        setUploadError(null);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (err: any) {
        setUploadError("Failed to parse Navigator layer: " + (err.message || "Invalid JSON"));
      }
    };
    reader.onerror = () => setUploadError("Failed to read Navigator file");
    reader.readAsText(file);
  }, [exposures, remediated, activeTechniques]);

  return (
    <div style={{
      background: "#0a0f1a",
      color: "#e2e8f0",
      height: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
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
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "-0.5px" }}>
            ATT&CK Path Optimizer
          </h1>
          <p style={{ fontSize: "10px", color: "#64748b", margin: "2px 0 0 0" }}>
            Weighted graph analysis for optimal cybersecurity expenditure
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Framework selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Framework</label>
            <select value={framework} onChange={e => setFramework(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              <option value="enterprise">Enterprise ATT&CK</option>
              <option value="ics">ICS/OT ATT&CK</option>
            </select>
          </div>
          {/* Phase 2: Data Source selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Data Source</label>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <select value={dataSource} onChange={e => setDataSource(e.target.value)}
                style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
                {fwConfig.hasBuiltin && <option value="builtin">Built-in (8 chains)</option>}
                <option value="stix">MITRE ATT&CK STIX (Live)</option>
                {uploadedFileName && <option value="upload">Upload: {uploadedFileName}</option>}
              </select>
              <input type="file" ref={fileInputRef} accept=".json" style={{ display: "none" }}
                onChange={e => { if ((e.target as any).files[0]) handleStixFileUpload((e.target as any).files[0]); (e.target as any).value = ""; }} />
              <input type="file" ref={navFileInputRef} accept=".json" style={{ display: "none" }}
                onChange={e => { if ((e.target as any).files[0]) handleNavigatorImport((e.target as any).files[0]); (e.target as any).value = ""; }} />
              <button onClick={() => fileInputRef.current?.click()} style={{
                background: "#1e293b", color: "#06b6d4", border: "1px solid #06b6d4", borderRadius: "4px",
                padding: "4px 8px", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>UPLOAD</button>
            </div>
          </div>
          <span style={{ fontSize: "9px", color: "#64748b", padding: "2px 6px", background: "#1e293b", borderRadius: "8px", alignSelf: "flex-end", marginBottom: "2px" }}>
            {displayTechniques.length}{showSubTechniques && displayTechniques.length !== activeTechniques.length ? "/" + activeTechniques.length : ""} techniques, {activeChains.length} chains
          </span>
          {stixError && (
            <span style={{ fontSize: "9px", color: "#ef4444", padding: "2px 6px", background: "#ef444415", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
              STIX: {stixError}
            </span>
          )}
          {uploadError && (
            <span style={{ fontSize: "9px", color: "#ef4444", padding: "2px 6px", background: "#ef444415", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
              Upload: {uploadError}
            </span>
          )}
          {autoDetectedFw && (
            <span style={{ fontSize: "9px", color: "#22c55e", padding: "2px 6px", background: "#22c55e15", borderRadius: "4px", alignSelf: "flex-end", marginBottom: "2px" }}>
              Auto-detected: {autoDetectedFw === "ics" ? "ICS/OT" : "Enterprise"} framework
            </span>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Environment</label>
            <select value={envPreset} onChange={e => setEnvPreset(e.target.value)}
              style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit" }}>
              {Object.entries(fwConfig.envPresets).map(([k, v]: [string, any]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Platforms</label>
            <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
              {fwConfig.allPlatforms.map((p: string) => {
                const active = !selectedPlatforms || selectedPlatforms.has(p);
                return (
                  <button key={p} onClick={() => {
                    setSelectedPlatforms(prev => {
                      if (!prev) {
                        // First click: activate only this platform
                        return new Set([p]);
                      }
                      const next = new Set(prev);
                      if (next.has(p)) {
                        next.delete(p);
                        return next.size === 0 ? null : next; // null = show all
                      }
                      next.add(p);
                      if (next.size === fwConfig.allPlatforms.length) return null; // all selected = same as null
                      return next;
                    });
                  }} style={{
                    background: active ? "#3b82f6" : "transparent",
                    color: active ? "#fff" : "#64748b",
                    border: "1px solid " + (active ? "#3b82f6" : "#334155"),
                    borderRadius: "3px", padding: "2px 5px", fontSize: "8px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2,
                  }}>{p}</button>
                );
              })}
            </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <label style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Search</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input type="text" value={techSearchQuery} onChange={e => setTechSearchQuery(e.target.value)}
                placeholder="Search techniques..."
                style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: "4px", padding: "4px 24px 4px 8px", fontSize: "11px", fontFamily: "inherit", width: "150px" }} />
              {techSearchQuery && (
                <button onClick={() => setTechSearchQuery("")} style={{
                  position: "absolute", right: 4, background: "transparent", border: "none", color: "#64748b",
                  cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: "2px",
                }}>{"\u2715"}</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "16px", padding: "10px 24px", borderBottom: "1px solid #1e293b",
        alignItems: "center", flexWrap: "wrap", flexShrink: 0,
      }}>
        <span style={{
          fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px",
          background: framework === "ics" ? "#a855f720" : "#3b82f620",
          color: framework === "ics" ? "#a855f7" : "#3b82f6",
          border: "1px solid " + (framework === "ics" ? "#a855f740" : "#3b82f640"),
        }}>
          {framework === "ics" ? "ICS/OT" : "Enterprise"}
        </span>
        <Stat label="Attack Chains" value={filteredChains.length} color="#6366f1" />
        <Stat label="Disrupted" value={totalDisrupted + "/" + filteredChains.length}
          color={totalDisrupted === filteredChains.length ? "#22c55e" : "#f59e0b"} />
        <Stat label="Remediated Nodes" value={remediated.size} color="#22c55e" />
        <Stat label="Optimal Covers" value={optimal.chainsDisrupted + " chains in " + optimal.selected.length + " nodes"} color="#f59e0b" />
        <button onClick={applyOptimal} style={{
          background: "#f59e0b", color: "#0a0f1a", border: "none", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.5px",
        }}>
          APPLY OPTIMAL
        </button>
        <button onClick={exportCSV} style={{
          background: "transparent", color: "#3b82f6", border: "1px solid #3b82f6", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          EXPORT CSV
        </button>
        <button onClick={() => navFileInputRef.current?.click()} style={{
          background: "transparent", color: "#f97316", border: "1px solid #f97316", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          IMPORT NAV
        </button>
        <button onClick={exportNavigatorLayer} style={{
          background: "transparent", color: "#f97316", border: "1px solid #f97316", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          EXPORT NAV
        </button>
        <button onClick={() => { const next = !showControls; setShowControls(next); if (!next) setPopoutControls(false); }} style={{
          background: showControls ? "#14b8a6" : "transparent", color: showControls ? "#0a0f1a" : "#14b8a6",
          border: "1px solid #14b8a6", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          CONTROLS
        </button>
        {dataSource === "stix" && fwConfig.hasSubTechniques && (
          <button onClick={() => setShowSubTechniques(prev => !prev)} style={{
            background: showSubTechniques ? "#8b5cf6" : "transparent", color: showSubTechniques ? "#fff" : "#8b5cf6",
            border: "1px solid #8b5cf6", borderRadius: "4px",
            padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            {showSubTechniques ? "HIDE" : "SHOW"} SUB-TECH
          </button>
        )}
        <button onClick={() => { setChainBuilderMode(prev => !prev); if (chainBuilderMode) { setChainBuilderPath([]); setChainBuilderName(""); } }} style={{
          background: chainBuilderMode ? "#a855f7" : "transparent", color: chainBuilderMode ? "#fff" : "#a855f7",
          border: "1px solid #a855f7", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          {chainBuilderMode ? "EXIT BUILDER" : "BUILD CHAIN"}
        </button>
        <button onClick={() => setPhaseWeighting(prev => !prev)} style={{
          background: phaseWeighting ? "#f97316" : "transparent", color: phaseWeighting ? "#fff" : "#f97316",
          border: "1px solid #f97316", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          PHASE WEIGHT
        </button>
        <button onClick={() => { const next = !showGapAnalysis; setShowGapAnalysis(next); if (!next) setPopoutGapAnalysis(false); }} style={{
          background: showGapAnalysis ? "#ef4444" : "transparent", color: showGapAnalysis ? "#fff" : "#ef4444",
          border: "1px solid #ef4444", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          position: "relative",
        }}>
          GAP ANALYSIS
          {gapAnalysis.gaps.length > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "#ef4444", color: "#fff", fontSize: "8px", fontWeight: 700,
              borderRadius: "8px", padding: "1px 5px", minWidth: 16, textAlign: "center",
            }}>{gapAnalysis.gaps.length}</span>
          )}
        </button>
        <button onClick={() => setCompareMode(prev => !prev)} style={{
          background: compareMode ? "#06b6d4" : "transparent", color: compareMode ? "#0a0f1a" : "#06b6d4",
          border: "1px solid #06b6d4", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          {compareMode ? "EXIT COMPARE" : "COMPARE IT/OT"}
        </button>
        <button onClick={() => setShowProfileWizard(true)} style={{
          background: environmentProfile ? "#8b5cf6" : "transparent", color: environmentProfile ? "#fff" : "#8b5cf6",
          border: "1px solid #8b5cf6", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          {environmentProfile ? "EDIT PROFILE" : "ENV PROFILE"}
        </button>
        <button onClick={() => { const next = !showExecutiveSummary; setShowExecutiveSummary(next); if (!next) setPopoutExecutive(false); }} style={{
          background: showExecutiveSummary ? "#06b6d4" : "transparent", color: showExecutiveSummary ? "#fff" : "#06b6d4",
          border: "1px solid #06b6d4", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          EXECUTIVE
        </button>
        <button onClick={() => setShowBottomPanels(prev => !prev)} style={{
          background: showBottomPanels ? "#64748b" : "transparent", color: showBottomPanels ? "#0a0f1a" : "#64748b",
          border: "1px solid #64748b", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          PANELS
        </button>
        {highlightedChains.length > 0 && (
          <button onClick={() => setIsolateChain(prev => !prev)} style={{
            background: isolateChain ? "#ec4899" : "transparent", color: isolateChain ? "#fff" : "#ec4899",
            border: "1px solid #ec4899", borderRadius: "4px",
            padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            {isolateChain ? "SHOW ALL" : "ISOLATE"}
          </button>
        )}
        {Object.keys(customPositions).length > 0 && (
          <button onClick={() => setCustomPositions({})} style={{
            background: "transparent", color: "#8b5cf6", border: "1px solid #8b5cf6", borderRadius: "4px",
            padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            AUTO-SPACE
          </button>
        )}
        <button onClick={handleShare} style={{
          background: "transparent", color: "#06b6d4", border: "1px solid #06b6d4", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          SHARE
        </button>
        {shareConfirm && (
          <span style={{ fontSize: "9px", color: "#06b6d4", opacity: 0.9 }}>URL copied!</span>
        )}
        <button onClick={resetAll} style={{
          background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
          RESET
        </button>
        {showSaved && (
          <span style={{ fontSize: "9px", color: "#22c55e", opacity: 0.8, transition: "opacity 0.3s" }}>Saved</span>
        )}
        <button onClick={() => { const next = !showAnalysis; setShowAnalysis(next); if (!next) setPopoutAnalysis(false); }} style={{
          background: showAnalysis ? "#3b82f6" : "transparent", color: showAnalysis ? "#fff" : "#64748b",
          border: "1px solid #334155", borderRadius: "4px",
          padding: "6px 12px", fontSize: "10px", cursor: "pointer", fontFamily: "inherit",
        }}>
          {showAnalysis ? "HIDE" : "SHOW"} ANALYSIS
        </button>
      </div>

      {/* Split container: graph fills all space, panels overlay from bottom */}
      <div id="split-container" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Graph area — fills everything */}
        <div style={{ position: "absolute", inset: 0, padding: "8px 16px" }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = (e as any).dataTransfer.files[0]; if (f && f.name.endsWith('.json')) handleStixFileUpload(f); }}
        >
          {popoutGraph ? (
            <PopoutPlaceholder label="Graph" onRestore={() => setPopoutGraph(false)} />
          ) : compareMode ? (
            <div style={{ display: "flex", width: "100%", height: "100%", gap: "2px" }}>
              <div style={{ flex: 1, position: "relative", borderRight: "2px solid #1e293b" }}>
                <div style={{ position: "absolute", top: 4, left: 8, zIndex: 10, padding: "2px 8px", background: framework === "ics" ? "#a855f730" : "#3b82f630", color: framework === "ics" ? "#a855f7" : "#3b82f6", borderRadius: "4px", fontSize: "9px", fontWeight: 700 }}>
                  {framework === "ics" ? "ICS/OT" : "ENTERPRISE"} (active)
                </div>
                <GraphView
                  techniques={displayTechniques} edges={displayEdges} positions={positions}
                  exposures={effectiveExposures} betweenness={betweenness} chainCoverage={chainCoverage}
                  selectedTech={selectedTech} onSelectTech={setSelectedTech}
                  highlightedChains={highlightedChains}
                  remediated={remediated}
                  optimalSet={optimal.selected}
                  viewHeight={viewHeight}
                  viewWidth={viewWidth}
                  phaseCenters={phaseCenters}
                  onNodeDrag={handleNodeDrag}
                  searchMatches={techSearchMatches}
                  collapsedTactics={collapsedTactics}
                  onToggleCollapse={(tacId: string) => setCollapsedTactics(prev => {
                    const next = new Set(prev);
                    if (next.has(tacId)) next.delete(tacId); else next.add(tacId);
                    try { localStorage.setItem("attackPathOptimizer_collapsed", JSON.stringify([...next])); } catch(e) {}
                    return next;
                  })}
                  isolateChain={isolateChain}
                  chainBuilderMode={chainBuilderMode}
                  chainBuilderPath={chainBuilderPath}
                  onChainBuilderClick={(techId: string) => {
                    if (!chainBuilderPath.includes(techId)) setChainBuilderPath(prev => [...prev, techId]);
                  }}
                  gapNodes={gapNodeSet}
                  techDescriptions={activeTechDescriptions}
                  tactics={fwConfig.tactics}
                  profileExposures={profileExposures}
                />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ position: "absolute", top: 4, left: 8, zIndex: 10, padding: "2px 8px", background: otherFramework === "ics" ? "#a855f730" : "#3b82f630", color: otherFramework === "ics" ? "#a855f7" : "#3b82f6", borderRadius: "4px", fontSize: "9px", fontWeight: 700 }}>
                  {otherFramework === "ics" ? "ICS/OT" : "ENTERPRISE"} (read-only)
                </div>
                {compareLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", fontSize: "12px" }}>
                    <span style={{ animation: "stix-pulse 1.5s ease-in-out infinite" }}>Loading {otherFramework === "ics" ? "ICS/OT" : "Enterprise"} data...</span>
                  </div>
                ) : compareLayout ? (
                  <GraphView
                    techniques={compareLayout.techniques} edges={compareLayout.edges} positions={compareLayout.positions}
                    exposures={{}} betweenness={compareLayout.betweenness} chainCoverage={compareLayout.chainCoverage}
                    selectedTech={null} onSelectTech={() => {}}
                    highlightedChains={[]}
                    remediated={new Set()}
                    optimalSet={[]}
                    viewHeight={compareLayout.viewHeight}
                    viewWidth={compareLayout.viewWidth}
                    phaseCenters={compareLayout.phaseCenters}
                    onNodeDrag={() => {}}
                    searchMatches={null}
                    collapsedTactics={new Set()}
                    onToggleCollapse={() => {}}
                    isolateChain={false}
                    chainBuilderMode={false}
                    chainBuilderPath={[]}
                    onChainBuilderClick={() => {}}
                    gapNodes={null}
                    techDescriptions={{}}
                    tactics={otherFwConfig.tactics}
                    profileExposures={null}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <GraphView
              techniques={displayTechniques} edges={displayEdges} positions={positions}
              exposures={effectiveExposures} betweenness={betweenness} chainCoverage={chainCoverage}
              selectedTech={selectedTech} onSelectTech={setSelectedTech}
              highlightedChains={highlightedChains}
              remediated={remediated}
              optimalSet={optimal.selected}
              viewHeight={viewHeight}
              viewWidth={viewWidth}
              phaseCenters={phaseCenters}
              onNodeDrag={handleNodeDrag}
              searchMatches={techSearchMatches}
              collapsedTactics={collapsedTactics}
              onToggleCollapse={(tacId: string) => setCollapsedTactics(prev => {
                const next = new Set(prev);
                if (next.has(tacId)) next.delete(tacId); else next.add(tacId);
                try { localStorage.setItem("attackPathOptimizer_collapsed", JSON.stringify([...next])); } catch(e) {}
                return next;
              })}
              isolateChain={isolateChain}
              chainBuilderMode={chainBuilderMode}
              chainBuilderPath={chainBuilderPath}
              onChainBuilderClick={(techId: string) => {
                if (!chainBuilderPath.includes(techId)) setChainBuilderPath(prev => [...prev, techId]);
              }}
              gapNodes={gapNodeSet}
              techDescriptions={activeTechDescriptions}
              onPopout={() => setPopoutGraph(true)}
              tactics={fwConfig.tactics}
              profileExposures={profileExposures}
            />
          )}
          {popoutGraph && (
            <PopoutPanel title="ATT&CK Graph" width={1400} height={900} onClose={() => setPopoutGraph(false)} graphMode>
              <div style={{ width: "100%", height: "100vh" }}>
                <GraphView
                  techniques={displayTechniques} edges={displayEdges} positions={positions}
                  exposures={effectiveExposures} betweenness={betweenness} chainCoverage={chainCoverage}
                  selectedTech={selectedTech} onSelectTech={setSelectedTech}
                  highlightedChains={highlightedChains}
                  remediated={remediated}
                  optimalSet={optimal.selected}
                  viewHeight={900}
                  viewWidth={1400}
                  phaseCenters={phaseCenters}
                  onNodeDrag={handleNodeDrag}
                  searchMatches={techSearchMatches}
                  collapsedTactics={collapsedTactics}
                  onToggleCollapse={(tacId: string) => setCollapsedTactics(prev => {
                    const next = new Set(prev);
                    if (next.has(tacId)) next.delete(tacId); else next.add(tacId);
                    try { localStorage.setItem("attackPathOptimizer_collapsed", JSON.stringify([...next])); } catch(e) {}
                    return next;
                  })}
                  isolateChain={isolateChain}
                  chainBuilderMode={chainBuilderMode}
                  chainBuilderPath={chainBuilderPath}
                  onChainBuilderClick={(techId: string) => {
                    if (!chainBuilderPath.includes(techId)) setChainBuilderPath(prev => [...prev, techId]);
                  }}
                  gapNodes={gapNodeSet}
                  techDescriptions={activeTechDescriptions}
                  tactics={fwConfig.tactics}
                  profileExposures={profileExposures}
                />
              </div>
            </PopoutPanel>
          )}
          {chainBuilderMode && (
            <div style={{
              position: "absolute", top: 8, left: 16, right: 16,
              background: "#1e293bee", border: "1px solid #a855f7", borderRadius: 6,
              padding: "10px 14px", zIndex: 15,
              display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700 }}>CHAIN BUILDER</span>
              <div style={{ flex: 1, display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
                {chainBuilderPath.length === 0 ? (
                  <span style={{ fontSize: "9px", color: "#64748b" }}>Click nodes to build a path...</span>
                ) : chainBuilderPath.map((tid: string, i: number) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: "9px", color: "#a855f7" }}>{"\u2192"}</span>}
                    <span style={{ fontSize: "9px", color: "#e2e8f0", background: "#a855f720", padding: "2px 5px", borderRadius: 3 }}>{tid}</span>
                  </React.Fragment>
                ))}
              </div>
              <input type="text" value={chainBuilderName} onChange={e => setChainBuilderName(e.target.value)}
                placeholder="Chain name..."
                style={{ background: "#0a0f1a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 4, padding: "3px 8px", fontSize: "10px", fontFamily: "inherit", width: "120px" }} />
              <button onClick={() => setChainBuilderPath(prev => prev.slice(0, -1))} disabled={chainBuilderPath.length === 0}
                style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 3, padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit", opacity: chainBuilderPath.length === 0 ? 0.3 : 1 }}>UNDO</button>
              <button onClick={() => setChainBuilderPath([])}
                style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef444466", borderRadius: 3, padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit" }}>CLEAR</button>
              <button onClick={() => {
                if (chainBuilderPath.length < 2) return;
                const name = chainBuilderName.trim() || ("Custom Chain " + (customChains.length + 1));
                const newChain = { name, description: "Custom chain", sector: "all", path: [...chainBuilderPath], severity: 0.5, custom: true };
                setCustomChains(prev => {
                  const next = [...prev, newChain];
                  try { localStorage.setItem("attackPathOptimizer_customChains", JSON.stringify(next)); } catch(e) {}
                  return next;
                });
                setChainBuilderPath([]);
                setChainBuilderName("");
              }} disabled={chainBuilderPath.length < 2}
                style={{
                  background: chainBuilderPath.length < 2 ? "#334155" : "#a855f7",
                  color: chainBuilderPath.length < 2 ? "#475569" : "#fff",
                  border: "none", borderRadius: 3, padding: "3px 10px", fontSize: "9px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>SAVE</button>
            </div>
          )}
          {stixLoading && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(10,15,26,0.85)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#f59e0b", marginBottom: "8px", animation: "stix-pulse 1.5s ease-in-out infinite" }}>
                  Fetching STIX data...
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Downloading from MITRE ATT&CK GitHub (~25MB)</div>
              </div>
            </div>
          )}
        </div>

        {/* Legend bar — floats above panels */}
        <div style={{
          position: "absolute", bottom: showBottomPanels ? panelHeight + 4 : 4, left: 0, right: 0, zIndex: 5,
          background: "#0a0f1acc", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            display: "flex", gap: "16px", padding: "4px 24px 2px", flexWrap: "wrap",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Legend:</span>
            <LegendItem color="#ef4444" label="High exposure ring" />
            <LegendItem color="#f59e0b" label="Medium exposure ring" />
            <LegendItem color="#22c55e" label="Low exposure / remediated" />
            <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>Node size = betweenness x exposure</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>Number = chain count</span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>|</span>
            <span style={{ fontSize: "9px", color: "#f59e0b", border: "1px dashed #f59e0b", padding: "1px 4px", borderRadius: "8px" }}>
              dashed ring = optimal target
            </span>
          </div>
          <div style={{
            display: "flex", gap: "4px", padding: "2px 24px 4px", flexWrap: "wrap",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginRight: "4px" }}>Tactics:</span>
            {fwConfig.tactics.map((tac: any, i: number) => {
              const isNewPhase = i > 0 && tac.phase !== fwConfig.tactics[i - 1].phase;
              return (
                <React.Fragment key={tac.id}>
                  {i > 0 && (
                    <span style={{ fontSize: "8px", color: "#334155", margin: "0 1px" }}>{isNewPhase ? "\u2192" : "\u00b7"}</span>
                  )}
                  <span style={{
                    fontSize: "8px", color: tac.color, padding: "1px 5px",
                    background: tac.color + "15", borderRadius: "3px",
                    whiteSpace: "nowrap",
                  }}>
                    {tac.name}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom panel overlay */}
        {showBottomPanels && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: panelHeight, zIndex: 10,
            display: "flex", flexDirection: "column",
            background: "#0a0f1aee", backdropFilter: "blur(8px)",
            borderTop: "1px solid #1e293b",
          }}>
            {/* Draggable divider at top of overlay */}
            <div
              onMouseDown={startDividerDrag}
              style={{
                height: 8, flexShrink: 0, cursor: "row-resize",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: 48, height: 3, background: "#334155", borderRadius: 2 }} />
            </div>

            {/* Panels row */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
              {/* Attack Chains Panel */}
              {(() => {
                const chainsContent = (
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
                                  try { localStorage.setItem("attackPathOptimizer_customChains", JSON.stringify(next)); } catch(e) {}
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
                        {/* F7: Threat Actor Profile toggle */}
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

                    {/* F6: Chain Uniqueness Comparison */}
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
                return (
                  <div style={{ flex: "1 1 280px", borderRight: "1px solid #1e293b", padding: popoutChains ? 0 : "12px 16px", overflow: "auto" }}>
                    {popoutChains ? (
                      <>
                        <PopoutPlaceholder label="Attack Chains" onRestore={() => setPopoutChains(false)} />
                        <PopoutPanel title={"Attack Chains (" + filteredChains.length + ")"} width={500} height={700} onClose={() => setPopoutChains(false)}>
                          {chainsContent}
                        </PopoutPanel>
                      </>
                    ) : chainsContent}
                  </div>
                );
              })()}

              {/* Priority Ranking Panel */}
              {(() => {
                const priorityContent = (
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
                return (
                  <div style={{ flex: "1 1 240px", borderRight: "1px solid #1e293b", padding: popoutPriority ? 0 : "12px 16px", overflow: "auto" }}>
                    {popoutPriority ? (
                      <>
                        <PopoutPlaceholder label="Remediation Priority" onRestore={() => setPopoutPriority(false)} />
                        <PopoutPanel title="Remediation Priority" width={400} height={600} onClose={() => setPopoutPriority(false)}>
                          {priorityContent}
                        </PopoutPanel>
                      </>
                    ) : priorityContent}
                  </div>
                );
              })()}

              {/* Detail / Exposure Panel */}
              {(() => {
                const detailContent = (
                  <>
                    {selectedTechData ? (
                      <>
                        <h3 style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px 0", display: "flex", alignItems: "center" }}>
                          Node Detail: {selectedTechData.id}
                          {!popoutDetail && <PopoutButton onClick={() => setPopoutDetail(true)} title="Pop out Detail" />}
                        </h3>
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{selectedTechData.name}</div>
                          <div style={{ fontSize: "9px", color: selectedTactic?.color, marginTop: "2px" }}>
                            {selectedTactic?.name} ({selectedTactic?.id})
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                          <MetricBox label="Betweenness" value={((betweenness[selectedTech!] ?? 0) * 100).toFixed(1)} unit="%" color="#3b82f6" />
                          <MetricBox label="Chain Count" value={chainCoverage[selectedTech!] ?? 0} unit={"/" + filteredChains.length} color="#6366f1" />
                          <MetricBox label="Exposure" value={((effectiveExposures[selectedTech!] ?? 1) * 100).toFixed(0)} unit="%" color={
                            (effectiveExposures[selectedTech!] ?? 1) > 0.7 ? "#ef4444" : (effectiveExposures[selectedTech!] ?? 1) > 0.4 ? "#f59e0b" : "#22c55e"
                          } />
                          <MetricBox label="Priority Score" value={(
                            (betweenness[selectedTech!] ?? 0) * (effectiveExposures[selectedTech!] ?? 1) * (chainCoverage[selectedTech!] ?? 0) / Math.max(filteredChains.length, 1) * 100
                          ).toFixed(1)} unit="pts" color="#f59e0b" />
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ fontSize: "9px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                            Adjust Exposure ({selectedTech})
                          </label>
                          <input type="range" min={0} max={100} value={((exposures[selectedTech!] ?? 1) * 100)}
                            onChange={e => handleExposureChange(selectedTech!, (e.target as any).value / 100)}
                            style={{ width: "100%", accentColor: "#f59e0b" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#475569" }}>
                            <span>Fully Mitigated</span><span>Fully Exposed</span>
                          </div>
                          {deployedControls.size > 0 && (exposures[selectedTech!] ?? 1) !== (effectiveExposures[selectedTech!] ?? 1) && (
                            <div style={{ fontSize: "8px", color: "#14b8a6", marginTop: "2px" }}>
                              Control-adjusted: {((effectiveExposures[selectedTech!] ?? 1) * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {/* F1: Control Impact Breakdown */}
                        {(() => {
                          const applied = fwConfig.securityControls.filter((c: any) => deployedControls.has(c.id) && c.coverage[selectedTech!]);
                          if (applied.length === 0) return null;
                          const baseExp = exposures[selectedTech!] ?? 1;
                          const effExp = effectiveExposures[selectedTech!] ?? 1;
                          const netReduction = baseExp > 0 ? ((1 - effExp / baseExp) * 100).toFixed(0) : 0;
                          return (
                            <div style={{ marginBottom: "12px", padding: "8px", background: "#14b8a608", border: "1px solid #14b8a620", borderRadius: "4px" }}>
                              <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Applied Controls</div>
                              {applied.map((ctrl: any) => {
                                const cat = CONTROL_CATEGORIES.find((c: any) => c.id === ctrl.category);
                                return (
                                  <div key={ctrl.id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                    <span style={{
                                      fontSize: "7px", padding: "1px 4px", borderRadius: "2px",
                                      background: (cat?.color || "#64748b") + "20", color: cat?.color || "#64748b",
                                    }}>{cat?.name?.split(" / ")[0] || ctrl.category}</span>
                                    <span style={{ fontSize: "9px", color: "#e2e8f0", flex: 1 }}>{ctrl.name}</span>
                                    <span style={{ fontSize: "9px", color: "#14b8a6", fontWeight: 700 }}>
                                      {(ctrl.coverage[selectedTech!] * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                );
                              })}
                              <div style={{ fontSize: "8px", color: "#14b8a6", marginTop: "4px", borderTop: "1px solid #14b8a615", paddingTop: "4px" }}>
                                Net reduction: {netReduction}% (multiplicative)
                              </div>
                            </div>
                          );
                        })()}

                        {/* Environment Profile Coverage Sources */}
                        {profileExposures && profileExposures[selectedTech!] && profileExposures[selectedTech!].coverageSources.length > 0 && (
                          <div style={{ marginBottom: "12px", padding: "8px", background: "#3b82f608", border: "1px solid #3b82f620", borderRadius: "4px" }}>
                            <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                              Environment Coverage Sources
                            </div>
                            {profileExposures[selectedTech!].coverageSources.map((src: any) => (
                              <div key={src.toolId} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                <span style={{ fontSize: "9px", color: "#e2e8f0", flex: 1 }}>{src.name}</span>
                                <span style={{ fontSize: "8px", color: "#3b82f6" }}>
                                  Detect: {(src.detect * 100).toFixed(0)}%
                                </span>
                                {src.prevent > 0 && (
                                  <span style={{ fontSize: "8px", color: "#22c55e" }}>
                                    Prevent: {(src.prevent * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            ))}
                            <div style={{ fontSize: "8px", color: "#3b82f6", marginTop: "4px", borderTop: "1px solid #3b82f615", paddingTop: "4px" }}>
                              Combined coverage: {(profileExposures[selectedTech!].coverageReduction * 100).toFixed(0)}%
                              {profileExposures[selectedTech!].actorWeight > 1 && (
                                <span style={{ color: "#f59e0b", marginLeft: "8px" }}>
                                  Threat actor weight: {profileExposures[selectedTech!].actorWeight.toFixed(2)}x
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <button onClick={() => toggleRemediate(selectedTech!)}
                          style={{
                            width: "100%", padding: "8px",
                            background: remediated.has(selectedTech!) ? "#22c55e20" : "#f59e0b",
                            color: remediated.has(selectedTech!) ? "#22c55e" : "#0a0f1a",
                            border: remediated.has(selectedTech!) ? "1px solid #22c55e" : "none",
                            borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          }}>
                          {remediated.has(selectedTech!) ? "\u2713 REMEDIATED \u2014 UNDO" : "MARK AS REMEDIATED"}
                        </button>

                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "4px" }}>Appears in chains:</div>
                          {filteredChains.filter((c: any) => c.path.includes(selectedTech)).map((c: any, i: number) => (
                            <div key={i} style={{
                              fontSize: "9px", color: "#94a3b8", padding: "2px 0",
                              cursor: "pointer", textDecoration: chainStatus[filteredChains.indexOf(c)]?.broken ? "line-through" : "none",
                              opacity: chainStatus[filteredChains.indexOf(c)]?.broken ? 0.5 : 1,
                            }} onClick={() => toggleHighlightedChain(c)}>
                              {"\u2192"} {c.name}
                            </div>
                          ))}
                        </div>

                        {/* Contextual Technique Examples */}
                        <div style={{ marginTop: "16px" }}>
                          {(() => {
                            const TRUNC = 150;
                            const truncate = (text: string) => {
                              if (!text || text.length <= TRUNC || expandedExamples) return text;
                              return text.slice(0, text.lastIndexOf(' ', TRUNC) || TRUNC) + '...';
                            };
                            const chainsWithTech = highlightedChains.filter((c: any) => c.path.includes(selectedTech));
                            const anyLong = (() => {
                              if (chainsWithTech.length > 0) {
                                for (const c of chainsWithTech) {
                                  const ctx = getChainTechContext(c.name, selectedTech!);
                                  if (ctx && ctx.length > TRUNC) return true;
                                }
                                if (techExamples?.summary?.length > TRUNC) return true;
                                return false;
                              }
                              return techExamples?.summary?.length > TRUNC;
                            })();
                            if (chainsWithTech.length > 0) {
                              return (
                                <>
                                  <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Threat Actor Context</div>
                                  {chainsWithTech.map((c: any, i: number) => {
                                    const colorIdx = highlightedChains.indexOf(c);
                                    const chainColor = CHAIN_COLORS[colorIdx % CHAIN_COLORS.length].color;
                                    const ctx = getChainTechContext(c.name, selectedTech!);
                                    return (
                                      <div key={i} style={{
                                        borderLeft: "2px solid " + chainColor,
                                        paddingLeft: "8px",
                                        marginBottom: "8px",
                                      }}>
                                        <div style={{ fontSize: "9px", fontWeight: 700, color: chainColor, marginBottom: "2px" }}>{c.name}</div>
                                        <div style={{ fontSize: "9px", color: ctx ? "#cbd5e1" : "#475569", fontStyle: ctx ? "normal" : "italic", lineHeight: "1.4" }}>
                                          {ctx ? truncate(ctx) : "No specific context available for this technique"}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {techExamples && (
                                    <div style={{ marginTop: "8px", opacity: 0.5 }}>
                                      <div style={{ fontSize: "8px", color: "#64748b", marginBottom: "2px" }}>General usage:</div>
                                      <div style={{ fontSize: "8px", color: "#94a3b8", lineHeight: "1.4" }}>{truncate(techExamples.summary)}</div>
                                    </div>
                                  )}
                                  {anyLong && (
                                    <div style={{ marginTop: "4px", textAlign: "right" }}>
                                      <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                                        fontSize: "8px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                                      }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            if (techExamples) {
                              return (
                                <>
                                  <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Real-World Usage</div>
                                  <div style={{ fontSize: "9px", color: "#cbd5e1", lineHeight: "1.4", marginBottom: "6px" }}>{truncate(techExamples.summary)}</div>
                                  {(expandedExamples || techExamples.summary.length <= TRUNC) && techExamples.examples.length > 0 && (
                                    <ul style={{ margin: "0", paddingLeft: "14px" }}>
                                      {techExamples.examples.map((ex: string, i: number) => (
                                        <li key={i} style={{ fontSize: "8px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "2px" }}>{ex}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {anyLong && (
                                    <div style={{ marginTop: "4px", textAlign: "right" }}>
                                      <span onClick={() => setExpandedExamples(prev => !prev)} style={{
                                        fontSize: "8px", color: "#3b82f6", cursor: "pointer", userSelect: "none",
                                      }}>{expandedExamples ? "\u25B2 LESS" : "\u25BC MORE"}</span>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return (
                              <div style={{ fontSize: "9px", color: "#475569", fontStyle: "italic" }}>No usage examples available for this technique</div>
                            );
                          })()}
                        </div>

                        {/* F3: MITRE Mitigations */}
                        {(() => {
                          const mits = activeMitigations[selectedTech!];
                          if (!mits || mits.length === 0) return null;
                          return (
                            <div style={{ marginTop: "16px" }}>
                              <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>MITRE Mitigations</div>
                              {mits.map((m: any, i: number) => {
                                const mappedCtrl = fwConfig.mitigationControlMap[m.name];
                                const isDeployed = mappedCtrl && deployedControls.has(mappedCtrl);
                                return (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "10px", color: isDeployed ? "#22c55e" : "#64748b" }}>{isDeployed ? "\u2713" : "\u25CB"}</span>
                                    <span style={{ fontSize: "8px", color: "#475569", minWidth: "38px" }}>{m.mitreId}</span>
                                    <span style={{ fontSize: "9px", color: isDeployed ? "#22c55e" : "#e2e8f0" }}>{m.name}</span>
                                    {mappedCtrl && (
                                      <span style={{ fontSize: "7px", color: isDeployed ? "#22c55e" : "#f59e0b", marginLeft: "auto" }}>
                                        {isDeployed ? "deployed" : "available"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div style={{ color: "#475569", fontSize: "11px", paddingTop: "40px", textAlign: "center" }}>
                        Click a node to inspect
                      </div>
                    )}
                  </>
                );
                return (
                  <div style={{ flex: "1 1 240px", padding: popoutDetail ? 0 : "12px 16px", overflow: "auto" }}>
                    {popoutDetail ? (
                      <>
                        <PopoutPlaceholder label="Node Detail" onRestore={() => setPopoutDetail(false)} />
                        <PopoutPanel title={"Node Detail" + (selectedTechData ? ": " + selectedTechData.id : "")} width={400} height={700} onClose={() => setPopoutDetail(false)}>
                          {detailContent}
                        </PopoutPanel>
                      </>
                    ) : detailContent}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>{/* end split-container */}

      {/* Phase 5: Security Controls Panel */}
      {(() => {
        const controlsContent = (
          <>
            <h3 style={{ fontSize: "11px", color: "#14b8a6", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
              SECURITY CONTROLS
              {!popoutControls && <PopoutButton onClick={() => setPopoutControls(true)} title="Pop out Controls" />}
              <select value={controlPreset} onChange={e => {
                const preset = e.target.value;
                setControlPreset(preset);
                if (preset !== "none" && fwConfig.controlPresets[preset]) {
                  setDeployedControls(new Set(fwConfig.controlPresets[preset].controls));
                }
              }} style={{
                background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155",
                borderRadius: "4px", padding: "3px 8px", fontSize: "9px", fontFamily: "inherit", marginLeft: "auto",
              }}>
                {Object.entries(fwConfig.controlPresets).map(([k, v]: [string, any]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
              {controlPreset !== "none" && fwConfig.controlPresets[controlPreset] && (
                <span style={{ fontSize: "8px", color: "#14b8a6" }}>
                  {fwConfig.controlPresets[controlPreset].controls.filter((c: string) => deployedControls.has(c)).length}/{fwConfig.controlPresets[controlPreset].controls.length} for {fwConfig.controlPresets[controlPreset].name}
                </span>
              )}
            </h3>
            {CONTROL_CATEGORIES.map((cat: any) => {
              const catControls = fwConfig.securityControls.filter((c: any) => c.category === cat.id);
              const catDeployed = catControls.filter((c: any) => deployedControls.has(c.id)).length;
              const allDeployed = catDeployed === catControls.length;
              return (
                <div key={cat.id} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px" }}>{cat.icon}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: "9px", color: "#64748b" }}>
                      {catDeployed}/{catControls.length} deployed
                    </span>
                    <button onClick={() => {
                      setDeployedControls(prev => {
                        const next = new Set(prev);
                        if (allDeployed) {
                          catControls.forEach((c: any) => next.delete(c.id));
                        } else {
                          catControls.forEach((c: any) => next.add(c.id));
                        }
                        return next;
                      });
                    }} style={{
                      background: "transparent", color: allDeployed ? "#ef4444" : cat.color,
                      border: "1px solid " + (allDeployed ? "#ef444466" : cat.color + "66"),
                      borderRadius: "3px", padding: "2px 8px", fontSize: "8px", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
                    }}>
                      {allDeployed ? "CLEAR" : "DEPLOY ALL"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                    {catControls.map((ctrl: any) => {
                      const deployed = deployedControls.has(ctrl.id);
                      const techCount = Object.keys(ctrl.coverage).filter((tid: string) => activeTechniques.some((t: any) => t.id === tid)).length;
                      return (
                        <div key={ctrl.id} style={{
                          background: "#0a0f1a", border: "1px solid " + (deployed ? cat.color + "30" : "#1e293b"),
                          borderRadius: "6px", padding: "10px",
                          borderLeft: "3px solid " + (deployed ? cat.color : "#1e293b"),
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: 600, color: deployed ? cat.color : "#f8fafc" }}>{ctrl.name}</div>
                              <div style={{ fontSize: "8px", color: "#64748b" }}>{ctrl.cost} · {techCount} techniques</div>
                            </div>
                            <button onClick={() => {
                              setDeployedControls(prev => {
                                const next = new Set(prev);
                                if (next.has(ctrl.id)) next.delete(ctrl.id);
                                else next.add(ctrl.id);
                                return next;
                              });
                            }} style={{
                              background: deployed ? cat.color : "#334155",
                              color: deployed ? "#0a0f1a" : "#94a3b8",
                              border: "none", borderRadius: "4px", padding: "3px 8px",
                              fontSize: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            }}>
                              {deployed ? "DEPLOYED" : "DEPLOY"}
                            </button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                            {Object.entries(ctrl.coverage).map(([tid, red]: [string, any]) => (
                              <span key={tid} style={{
                                fontSize: "7px", padding: "1px 3px", borderRadius: "2px",
                                background: deployed ? cat.color + "15" : "#1e293b",
                                color: deployed ? cat.color : "#475569",
                              }}>
                                {tid} ({(red * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* Summary */}
            {deployedControls.size > 0 && (() => {
              const baseAvg = activeTechniques.reduce((s: number, t: any) => s + (exposures[t.id] ?? 1), 0) / activeTechniques.length;
              const effAvg = activeTechniques.reduce((s: number, t: any) => s + (effectiveExposures[t.id] ?? 1), 0) / activeTechniques.length;
              const reduction = baseAvg > 0 ? ((baseAvg - effAvg) / baseAvg * 100).toFixed(1) : "0.0";
              const costTally: Record<string, number> = {};
              fwConfig.securityControls.forEach((c: any) => {
                if (!deployedControls.has(c.id)) return;
                const tier = c.cost;
                costTally[tier] = (costTally[tier] || 0) + 1;
              });
              const costSummary = Object.entries(costTally).sort((a, b) => b[0].length - a[0].length).map(([t, n]) => n + "x" + t).join("  ");
              return (
                <div style={{ marginTop: "8px", padding: "10px 12px", background: "#14b8a610", borderRadius: "4px" }}>
                  <div style={{ fontSize: "10px", color: "#14b8a6", marginBottom: "6px" }}>
                    {deployedControls.size} control{deployedControls.size === 1 ? "" : "s"} deployed — average exposure reduced by {reduction}%
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "9px" }}>
                    {CONTROL_CATEGORIES.map((cat: any) => {
                      const catCtrls = fwConfig.securityControls.filter((c: any) => c.category === cat.id);
                      const catDep = catCtrls.filter((c: any) => deployedControls.has(c.id)).length;
                      return (
                        <span key={cat.id} style={{ color: catDep > 0 ? cat.color : "#475569" }}>
                          {cat.icon} {cat.name.split(" / ")[0]}: {catDep}/{catCtrls.length}
                        </span>
                      );
                    })}
                    <span style={{ color: "#64748b", marginLeft: "auto" }}>Cost: {costSummary}</span>
                  </div>
                </div>
              );
            })()}
          </>
        );
        return (
          <>
            {showControls && !popoutControls && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "45vh", overflow: "auto",
              }}>
                {controlsContent}
              </div>
            )}
            {showControls && popoutControls && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Security Controls" onRestore={() => setPopoutControls(false)} />
              </div>
            )}
            {popoutControls && (
              <PopoutPanel title="Security Controls" width={900} height={600} onClose={() => setPopoutControls(false)}>
                {controlsContent}
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Analysis Panel */}
      {(() => {
        const analysisContent = (
          <>
            <h3 style={{ fontSize: "11px", color: "#f59e0b", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
              OPTIMIZATION ANALYSIS
              {!popoutAnalysis && <PopoutButton onClick={() => setPopoutAnalysis(true)} title="Pop out Analysis" />}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <AnalysisCard title="Greedy Set Cover Result">
                <p>With a budget of <strong style={{ color: "#f59e0b" }}>{remediationBudget}</strong> remediations,
                the optimal selection disrupts <strong style={{ color: "#22c55e" }}>{optimal.chainsDisrupted}/{optimal.chainsTotal}</strong> attack chains.</p>
                <p style={{ marginTop: "6px" }}>Optimal targets: {optimal.selected.map((id: string) => {
                  const t = activeTechniques.find((t: any) => t.id === id);
                  return t ? id + " (" + t.name + ")" : id;
                }).join(", ")}</p>
                <p style={{ marginTop: "6px", color: "#64748b" }}>
                  Algorithm: Greedy weighted maximum coverage. Each iteration selects the technique
                  that covers the most remaining unchained paths, weighted by severity x exposure.
                  Guaranteed {"\u2265"}63% of optimal (1 - 1/e approximation bound).
                </p>
              </AnalysisCard>
              <AnalysisCard title="Chokepoint Analysis">
                <p>Highest betweenness centrality nodes (most paths flow through):</p>
                {activeTechniques
                  .map((t: any) => ({ ...t, bc: betweenness[t.id] ?? 0 }))
                  .sort((a: any, b: any) => b.bc - a.bc)
                  .slice(0, 5)
                  .map((t: any, i: number) => (
                    <div key={i} style={{ fontSize: "10px", marginTop: "4px" }}>
                      <span style={{ color: "#f59e0b" }}>{t.id}</span> {t.name} — centrality: {(t.bc * 100).toFixed(1)}%
                      {remediated.has(t.id) && <span style={{ color: "#22c55e" }}> {"\u2713"}</span>}
                    </div>
                  ))
                }
              </AnalysisCard>
              <AnalysisCard title="Risk Posture Summary">
                {(() => {
                  const avgExposure = activeTechniques.reduce((s: number, t: any) => s + (effectiveExposures[t.id] ?? 1), 0) / activeTechniques.length;
                  const highExposed = activeTechniques.filter((t: any) => (effectiveExposures[t.id] ?? 1) > 0.7).length;
                  const disruptionRate = totalDisrupted / Math.max(filteredChains.length, 1);
                  return (
                    <>
                      <p>Average node exposure: <strong style={{
                        color: avgExposure > 0.6 ? "#ef4444" : avgExposure > 0.3 ? "#f59e0b" : "#22c55e"
                      }}>{(avgExposure * 100).toFixed(0)}%</strong></p>
                      <p>High-exposure nodes ({">"}70%): <strong style={{ color: "#ef4444" }}>{highExposed}</strong> of {activeTechniques.length}</p>
                      <p>Chain disruption rate: <strong style={{
                        color: disruptionRate > 0.8 ? "#22c55e" : disruptionRate > 0.5 ? "#f59e0b" : "#ef4444"
                      }}>{(disruptionRate * 100).toFixed(0)}%</strong></p>
                      <p style={{ marginTop: "6px", color: "#64748b" }}>
                        {disruptionRate === 1 ? "All known attack chains have at least one broken link." :
                          disruptionRate > 0.7 ? "Good coverage but some chains remain viable." :
                            disruptionRate > 0.4 ? "Moderate risk \u2014 several attack paths remain open." :
                              "Critical risk \u2014 majority of attack paths are unimpeded."}
                      </p>
                    </>
                  );
                })()}
              </AnalysisCard>
              {compareMode && compareAnalysis && (
                <AnalysisCard title="IT/OT Convergence Analysis">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>{framework === "ics" ? "ICS/OT" : "Enterprise"}</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: framework === "ics" ? "#a855f7" : "#3b82f6" }}>{compareAnalysis.currentCount}</div>
                      <div style={{ fontSize: "8px", color: "#64748b" }}>techniques</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>{otherFramework === "ics" ? "ICS/OT" : "Enterprise"}</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: otherFramework === "ics" ? "#a855f7" : "#3b82f6" }}>{compareAnalysis.otherCount}</div>
                      <div style={{ fontSize: "8px", color: "#64748b" }}>techniques</div>
                    </div>
                  </div>
                  <div style={{ padding: "6px 8px", background: "#06b6d410", borderRadius: "4px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "9px", color: "#06b6d4", fontWeight: 700 }}>{compareAnalysis.shared.size}</span>
                    <span style={{ fontSize: "9px", color: "#94a3b8" }}> shared technique IDs (potential IT{"\u2194"}OT pivot points)</span>
                  </div>
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                    Unique to {framework === "ics" ? "ICS" : "Enterprise"}: <strong style={{ color: "#f59e0b" }}>{compareAnalysis.uniqueCurrent.size}</strong>
                    {" \u00B7 "}
                    Unique to {otherFramework === "ics" ? "ICS" : "Enterprise"}: <strong style={{ color: "#f59e0b" }}>{compareAnalysis.uniqueOther.size}</strong>
                  </div>
                  {compareAnalysis.shared.size > 0 && (
                    <div style={{ marginTop: "6px", fontSize: "8px", color: "#64748b" }}>
                      Shared IDs: {[...compareAnalysis.shared].slice(0, 10).join(", ")}{compareAnalysis.shared.size > 10 ? " ..." : ""}
                    </div>
                  )}
                </AnalysisCard>
              )}
            </div>
          </>
        );
        return (
          <>
            {showAnalysis && !popoutAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "40vh", overflow: "auto",
              }}>
                {analysisContent}
              </div>
            )}
            {showAnalysis && popoutAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Analysis" onRestore={() => setPopoutAnalysis(false)} />
              </div>
            )}
            {popoutAnalysis && (
              <PopoutPanel title="Optimization Analysis" width={900} height={500} onClose={() => setPopoutAnalysis(false)}>
                {analysisContent}
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Executive Summary Panel */}
      {(() => {
        const execProps = {
          techniques: displayTechniques, exposures: effectiveExposures, betweenness, chainCoverage,
          filteredChains, chainStatus, remediated, optimal, deployedControls,
          tactics: fwConfig.tactics, securityControls: fwConfig.securityControls as any,
        };
        return (
          <>
            {showExecutiveSummary && !popoutExecutive && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "50vh", overflow: "auto",
              }}>
                <ExecutiveSummary {...execProps} popout={false} onPopout={() => setPopoutExecutive(true)} />
              </div>
            )}
            {showExecutiveSummary && popoutExecutive && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Executive Summary" onRestore={() => setPopoutExecutive(false)} />
              </div>
            )}
            {popoutExecutive && (
              <PopoutPanel title="Executive Summary" width={600} height={800} onClose={() => setPopoutExecutive(false)}>
                <ExecutiveSummary {...execProps} popout={true} />
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Phase 3: Exposure Summary Panel */}
      {exposureSummary && environmentProfile && (
        <div style={{
          borderTop: "1px solid #1e293b", padding: "12px 24px",
          background: "#0d1321", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: "11px", color: "#8b5cf6", margin: 0, letterSpacing: "0.5px" }}>
              ENVIRONMENT COVERAGE SUMMARY
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={exportCoverageCSV} style={{
                background: "transparent", color: "#8b5cf6", border: "1px solid #8b5cf6", borderRadius: 3,
                padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit",
              }}>EXPORT CSV</button>
              <button onClick={() => { setEnvironmentProfile(null); setProfileExposures(null); }} style={{
                background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 3,
                padding: "3px 8px", fontSize: "9px", cursor: "pointer", fontFamily: "inherit",
              }}>CLEAR</button>
            </div>
          </div>

          {/* Metric cards row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
            <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: exposureSummary.avgExposure > 0.6 ? "#ef4444" : exposureSummary.avgExposure > 0.35 ? "#f59e0b" : "#22c55e" }}>
                {(exposureSummary.avgExposure * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Avg Exposure</div>
            </div>
            <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
                {(exposureSummary.totalCoverage * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Avg Coverage</div>
            </div>
            <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #ef444420" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>
                {exposureSummary.highExposed}
              </div>
              <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Exposed ({">"}70%)</div>
            </div>
            <div style={{ background: "#111827", borderRadius: 4, padding: "8px 10px", textAlign: "center", border: "1px solid #22c55e20" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
                {exposureSummary.wellCovered}
              </div>
              <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Covered ({"<"}30%)</div>
            </div>
          </div>

          {/* Top uncovered chokepoints */}
          {exposureSummary.uncoveredChokepoints.length > 0 && (
            <div style={{ background: "#111827", borderRadius: 4, padding: 8, border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                Top Uncovered Chokepoints
              </div>
              {exposureSummary.uncoveredChokepoints.map((cp: any) => {
                const tech = displayTechniques.find((t: any) => t.id === cp.tid);
                return (
                  <div key={cp.tid} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, cursor: "pointer" }}
                    onClick={() => setSelectedTech(cp.tid)}>
                    <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, width: 65, flexShrink: 0 }}>{cp.tid}</span>
                    <span style={{ fontSize: 9, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tech?.name || cp.tid}
                    </span>
                    <span style={{ fontSize: 8, color: "#ef4444" }}>{(cp.exposure * 100).toFixed(0)}% exp</span>
                    <span style={{ fontSize: 8, color: "#f59e0b" }}>{(cp.bc * 100).toFixed(0)}% bc</span>
                    <span style={{ fontSize: 8, color: "#64748b" }}>{cp.cc} chains</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 8, color: "#475569", marginTop: 6 }}>
            {exposureSummary.totalTechniques} techniques analyzed
            {environmentProfile.securityTools && <span> | {environmentProfile.securityTools.length} tools</span>}
            {environmentProfile.infrastructure && <span> | {environmentProfile.infrastructure.length} infra</span>}
          </div>
        </div>
      )}

      {/* Gap Analysis Panel */}
      {(() => {
        const gapContent = (
          <>
            <h3 style={{ fontSize: "11px", color: "#ef4444", margin: "0 0 12px 0", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
              CONTROL GAP ANALYSIS
              {!popoutGapAnalysis && <PopoutButton onClick={() => setPopoutGapAnalysis(true)} title="Pop out Gap Analysis" />}
              <button onClick={exportRemediationPlan} disabled={gapAnalysis.gaps.length === 0} style={{
                background: "transparent", color: gapAnalysis.gaps.length === 0 ? "#475569" : "#ef4444",
                border: "1px solid " + (gapAnalysis.gaps.length === 0 ? "#334155" : "#ef4444"),
                borderRadius: "4px", padding: "3px 10px", fontSize: "9px", fontWeight: 700,
                cursor: gapAnalysis.gaps.length === 0 ? "default" : "pointer", fontFamily: "inherit",
                marginLeft: "auto", opacity: gapAnalysis.gaps.length === 0 ? 0.4 : 1,
              }}>EXPORT PLAN</button>
            </h3>
            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ background: "#ef444415", border: "1px solid #ef444433", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444" }}>{gapAnalysis.noCoverageCount}</div>
                <div style={{ fontSize: "8px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>No Coverage</div>
              </div>
              <div style={{ background: "#f59e0b15", border: "1px solid #f59e0b33", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b" }}>{gapAnalysis.notDeployedCount}</div>
                <div style={{ fontSize: "8px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Not Deployed</div>
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#e2e8f0" }}>{gapAnalysis.gaps.length}</div>
                <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Gaps</div>
              </div>
              {/* F8: Priority tier counts */}
              {gapAnalysis.gaps.length > 0 && (() => {
                const tiers: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
                gapAnalysis.gaps.forEach((g: any) => {
                  const s = g.riskScore;
                  if (s > 0.5) tiers.Critical++;
                  else if (s > 0.2) tiers.High++;
                  else if (s > 0.05) tiers.Medium++;
                  else tiers.Low++;
                });
                const tierColors: Record<string, string> = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#64748b" };
                return Object.entries(tiers).filter(([, n]) => n > 0).map(([tier, n]) => (
                  <div key={tier} style={{ background: tierColors[tier] + "15", border: "1px solid " + tierColors[tier] + "33", borderRadius: 6, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: tierColors[tier] }}>{n}</div>
                    <div style={{ fontSize: "8px", color: tierColors[tier], textTransform: "uppercase", letterSpacing: "0.5px" }}>{tier}</div>
                  </div>
                ));
              })()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
              {gapAnalysis.gaps.map((gap: any) => {
                const tactic = fwConfig.tactics.find((ta: any) => ta.id === gap.tactic);
                const isNoCoverage = gap.gapType === "no-coverage";
                return (
                  <div key={gap.id} onClick={() => setSelectedTech(gap.id)} style={{
                    background: "#0a0f1a", border: "1px solid " + (isNoCoverage ? "#ef444433" : "#f59e0b33"),
                    borderRadius: 6, padding: "10px 12px", cursor: "pointer",
                    borderLeft: "3px solid " + (isNoCoverage ? "#ef4444" : "#f59e0b"),
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>
                          {gap.id} — {gap.name}
                        </div>
                        <div style={{ fontSize: "9px", color: tactic?.color, marginTop: "1px" }}>{tactic?.name}</div>
                      </div>
                      <span style={{
                        fontSize: "7px", fontWeight: 700, padding: "2px 6px", borderRadius: "8px",
                        background: isNoCoverage ? "#ef444425" : "#f59e0b25",
                        color: isNoCoverage ? "#ef4444" : "#f59e0b",
                        whiteSpace: "nowrap",
                      }}>
                        {isNoCoverage ? "NO COVERAGE" : "NOT DEPLOYED"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", fontSize: "9px", marginBottom: "6px" }}>
                      <span style={{ color: gap.exposure > 0.7 ? "#ef4444" : gap.exposure > 0.4 ? "#f59e0b" : "#22c55e" }}>
                        Exp: {(gap.exposure * 100).toFixed(0)}%
                      </span>
                      <span style={{ color: "#3b82f6" }}>BC: {(gap.bc * 100).toFixed(1)}%</span>
                      <span style={{ color: "#6366f1" }}>Chains: {gap.cc}</span>
                    </div>
                    {gap.availableControls.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                        {gap.availableControls.map((ctrl: any) => (
                          <span key={ctrl.id} style={{
                            fontSize: "7px", padding: "1px 4px", borderRadius: 2,
                            background: "#1e293b", color: "#94a3b8",
                          }}>
                            {ctrl.name} ({ctrl.cost})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {gapAnalysis.gaps.length === 0 && (
              <div style={{ textAlign: "center", color: "#22c55e", fontSize: "11px", padding: "20px" }}>
                All techniques have at least one deployed control.
              </div>
            )}
          </>
        );
        return (
          <>
            {showGapAnalysis && !popoutGapAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: "16px 24px",
                background: "#0d1321", flexShrink: 0, maxHeight: "45vh", overflow: "auto",
              }}>
                {gapContent}
              </div>
            )}
            {showGapAnalysis && popoutGapAnalysis && (
              <div style={{
                borderTop: "1px solid #1e293b", padding: 0,
                background: "#0d1321", flexShrink: 0,
              }}>
                <PopoutPlaceholder label="Gap Analysis" onRestore={() => setPopoutGapAnalysis(false)} />
              </div>
            )}
            {popoutGapAnalysis && (
              <PopoutPanel title="Control Gap Analysis" width={900} height={600} onClose={() => setPopoutGapAnalysis(false)}>
                {gapContent}
              </PopoutPanel>
            )}
          </>
        );
      })()}

      {/* Phase 3: Environment Profile Wizard */}
      {showProfileWizard && (
        <ProfileWizard
          coverageKB={fwConfig.coverageKB}
          activeChains={activeChains}
          currentProfile={environmentProfile}
          onApply={(profile: any) => {
            setEnvironmentProfile(profile);
            setShowProfileWizard(false);
          }}
          onClose={() => setShowProfileWizard(false)}
        />
      )}
    </div>
  );
}
