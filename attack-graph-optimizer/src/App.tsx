// ─── App.tsx — Attack Path Optimizer (main component) ─────────────────────────
// State, computed values, effects, and handler functions.
// UI panels are in components/Header, components/Panels, components/Graph, etc.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { TECHNIQUES, EDGES, ATTACK_CHAINS } from './data/techniques';
import { MAX_HIGHLIGHTED_CHAINS } from './data/constants';
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
} from './engine/graphModel';
import { detectFramework, parseStixBundle } from './engine/stixParser';

import { encodeStateToHash, decodeHashToState } from './hooks/useUrlState';
import { useExportHandlers } from './hooks/useExportHandlers';

import { GraphView } from './components/Graph';
import { LegendItem, PopoutPanel, PopoutPlaceholder } from './components/Analysis';
import { ExecutiveSummary } from './components/Export';
import { ProfileWizard } from './components/ProfileWizard';
import { Header, StatsBar } from './components/Header';
import {
  ChainsPanel, PriorityPanel, DetailPanel,
  ControlsPanel, AnalysisPanel, GapAnalysisPanel, ExposureSummaryPanel,
} from './components/Panels';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttackPathOptimizer() {
  // ─── Core state ──────────────────────────────────────────────────────────────

  const [framework, setFramework] = useState("enterprise");
  const fwConfig = useMemo(() => getFrameworkConfig(framework), [framework]);

  const [envPreset, setEnvPreset] = useState("government");
  const [exposures, setExposures] = useState<Record<string, number>>({});
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [highlightedChains, setHighlightedChains] = useState<any[]>([]);
  const [isolateChain, setIsolateChain] = useState(false);
  useEffect(() => { if (highlightedChains.length === 0) setIsolateChain(false); }, [highlightedChains]);
  const [remediated, setRemediated] = useState<Set<string>>(new Set());
  const [remediationBudget, setRemediationBudget] = useState(5);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [showBottomPanels, setShowBottomPanels] = useState(true);
  const isDraggingDivider = useRef(false);

  // ─── Data source state ───────────────────────────────────────────────────────

  const [dataSource, setDataSource] = useState("stix");
  const [customData, setCustomData] = useState<any>(null);
  const [stixLoading, setStixLoading] = useState(false);
  const [stixError, setStixError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoDetectedFw, setAutoDetectedFw] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navFileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Security controls state ─────────────────────────────────────────────────

  const [deployedControls, setDeployedControls] = useState<Set<string>>(new Set());
  const [showControls, setShowControls] = useState(false);

  // ─── Popout panel states ─────────────────────────────────────────────────────

  const [popoutChains, setPopoutChains] = useState(false);
  const [popoutPriority, setPopoutPriority] = useState(false);
  const [popoutDetail, setPopoutDetail] = useState(false);
  const [popoutAnalysis, setPopoutAnalysis] = useState(false);
  const [popoutControls, setPopoutControls] = useState(false);
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [popoutGapAnalysis, setPopoutGapAnalysis] = useState(false);
  const [popoutGraph, setPopoutGraph] = useState(false);

  // ─── Graph & interaction state ───────────────────────────────────────────────

  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [techSearchQuery, setTechSearchQuery] = useState("");
  const [chainSearchQuery, setChainSearchQuery] = useState("");
  const [collapsedTactics, setCollapsedTactics] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem("attackPathOptimizer_collapsed");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });
  const [showSubTechniques, setShowSubTechniques] = useState(false);

  // ─── Custom chain builder state ──────────────────────────────────────────────

  const [chainBuilderMode, setChainBuilderMode] = useState(false);
  const [chainBuilderPath, setChainBuilderPath] = useState<string[]>([]);
  const [chainBuilderName, setChainBuilderName] = useState("");
  const [customChains, setCustomChains] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem("attackPathOptimizer_customChains");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  // ─── Feature toggles ────────────────────────────────────────────────────────

  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [popoutExecutive, setPopoutExecutive] = useState(false);
  const [phaseWeighting, setPhaseWeighting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string> | null>(null);
  const [controlPreset, setControlPreset] = useState("none");
  const [expandedChainProfile, setExpandedChainProfile] = useState<string | null>(null);

  // ─── Environment profiling state ─────────────────────────────────────────────

  const [environmentProfile, setEnvironmentProfile] = useState<any>(() => {
    try {
      const s = localStorage.getItem("attackPathOptimizer_envProfile");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [profileExposures, setProfileExposures] = useState<Record<string, any> | null>(null);

  // ─── Compare mode state ──────────────────────────────────────────────────────

  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const otherFramework = framework === "enterprise" ? "ics" : "enterprise";
  const otherFwConfig = useMemo(() => getFrameworkConfig(otherFramework), [otherFramework]);

  // ─── Persistence helpers ─────────────────────────────────────────────────────

  const [showSaved, setShowSaved] = useState(false);
  const skipEnvEffect = useRef(false);
  const mountTime = useRef(Date.now());
  const hashChainNamesRef = useRef<string[] | null>(null);
  const [shareConfirm, setShareConfirm] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════════
  // DERIVED DATA
  // ═══════════════════════════════════════════════════════════════════════════════

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

  // ─── Display techniques (filtered by sub-technique toggle + platform filter) ──

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
    if (selectedPlatforms && selectedPlatforms.size > 0) {
      techs = techs.filter((t: any) => {
        const plats = activePlatforms[t.id];
        if (!plats || plats.length === 0) return true;
        return plats.some((p: string) => selectedPlatforms.has(p));
      });
    }
    return techs;
  }, [activeTechniques, showSubTechniques, selectedPlatforms, activePlatforms]);

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

  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════

  // ─── Draggable divider ────────────────────────────────────────────────────────

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
    } catch { /* ignore */ }
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

  // ─── Environment profiling: compute exposure scores ──────────────────────────

  const actorTechMap = useMemo(() => buildActorTechMap(activeChains), [activeChains]);

  useEffect(() => {
    if (!environmentProfile) { setProfileExposures(null); return; }
    const hasSelections = (environmentProfile.infrastructure?.length > 0) || (environmentProfile.securityTools?.length > 0);
    if (!hasSelections) { setProfileExposures(null); return; }
    const scores = computeExposureScores(environmentProfile, fwConfig.coverageKB, displayTechniques, actorTechMap);
    setProfileExposures(scores);
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

  // Persist environment profile
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
      } catch { /* ignore */ }
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

  // ─── Compare mode: load other framework STIX ─────────────────────────────────

  useEffect(() => {
    if (!compareMode) { setCompareData(null); return; }
    const controller = new AbortController();
    setCompareLoading(true);
    loadStixData(controller.signal, otherFwConfig as any).then((data: any) => {
      if (controller.signal.aborted) return;
      setCompareData(data);
      setCompareLoading(false);
    }).catch(() => {
      if (controller.signal.aborted) return;
      setCompareLoading(false);
    });
    return () => controller.abort();
  }, [compareMode, otherFwConfig]);

  // ─── Framework change side effect ─────────────────────────────────────────────

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
    const cfg = getFrameworkConfig(framework);
    if (!cfg.hasBuiltin && dataSource === "builtin") setDataSource("stix");
  }, [framework]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════

  const layoutResult = useMemo(() => layoutNodes(displayTechniques, fwConfig.tactics), [displayTechniques, fwConfig]);
  const displayEdges = useMemo(() => {
    const techSet = new Set(displayTechniques.map((t: any) => t.id));
    return activeEdges.filter((e: any) => techSet.has(e.from) && techSet.has(e.to));
  }, [displayTechniques, activeEdges]);
  const { viewHeight, viewWidth, phaseCenters } = layoutResult;
  const positions = useMemo(() => {
    if (Object.keys(customPositions).length === 0) return layoutResult.positions;
    return { ...layoutResult.positions, ...customPositions };
  }, [layoutResult.positions, customPositions]);
  const betweenness = useMemo(() => computeBetweenness(activeTechniques, activeEdges), [activeTechniques, activeEdges]);

  // Compare mode layout
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

  const compareAnalysis = useMemo(() => {
    if (!compareMode || !compareData) return null;
    const currentIds = new Set<string>(activeTechniques.filter((t: any) => !t.parentId).map((t: any) => t.id));
    const otherIds = new Set<string>((compareData.techniques || []).filter((t: any) => !t.parentId).map((t: any) => t.id));
    const shared = new Set<string>(Array.from(currentIds).filter((id: string) => otherIds.has(id)));
    const uniqueCurrent = new Set<string>(Array.from(currentIds).filter((id: string) => !otherIds.has(id)));
    const uniqueOther = new Set<string>(Array.from(otherIds).filter((id: string) => !currentIds.has(id)));
    return { currentCount: currentIds.size, otherCount: otherIds.size, shared, uniqueCurrent, uniqueOther };
  }, [compareMode, compareData, activeTechniques]);

  const filteredChains = useMemo(() => {
    if (sectorFilter === "all") return activeChains;
    return activeChains.filter((c: any) => c.sector === sectorFilter || c.sector === "all");
  }, [sectorFilter, activeChains]);

  const chainCoverage = useMemo(() => computeChainCoverage(activeTechniques, filteredChains), [activeTechniques, filteredChains]);

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

  const optimal = useMemo(() =>
    findOptimalRemediation(activeTechniques, filteredChains, effectiveExposures, remediationBudget, phaseWeighting, fwConfig as any),
    [activeTechniques, filteredChains, effectiveExposures, remediationBudget, phaseWeighting, fwConfig],
  );

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

  const displayedChainStatus = useMemo(() => {
    if (!chainSearchQuery.trim()) return chainStatus;
    const q = chainSearchQuery.toLowerCase().trim();
    return chainStatus.filter((c: any) =>
      c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) ||
      c.path.some((tid: string) => tid.toLowerCase().includes(q)),
    );
  }, [chainStatus, chainSearchQuery]);

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

  const exposureSummary = useMemo(() => {
    if (!profileExposures) return null;
    const entries = Object.entries(profileExposures);
    if (entries.length === 0) return null;
    const highExposed = entries.filter(([, pe]: [string, any]) => pe.finalExposure > 0.7);
    const wellCovered = entries.filter(([, pe]: [string, any]) => pe.finalExposure < 0.3);
    const totalCoverage = entries.reduce((s: number, [, pe]: [string, any]) => s + pe.coverageReduction, 0) / entries.length;
    const avgExposure = entries.reduce((s: number, [, pe]: [string, any]) => s + pe.finalExposure, 0) / entries.length;
    const uncoveredChokepoints = entries
      .map(([tid, pe]: [string, any]) => ({ tid, exposure: pe.finalExposure, bc: betweenness[tid] ?? 0, cc: chainCoverage[tid] ?? 0 }))
      .filter((x: any) => x.exposure > 0.5)
      .sort((a: any, b: any) => (b.bc * b.exposure) - (a.bc * a.exposure))
      .slice(0, 5);
    return { highExposed: highExposed.length, wellCovered: wellCovered.length, totalCoverage, avgExposure, uncoveredChokepoints, totalTechniques: entries.length };
  }, [profileExposures, betweenness, chainCoverage]);

  const selectedTechData = displayTechniques.find((t: any) => t.id === selectedTech);
  const selectedTactic = selectedTechData ? fwConfig.tactics.find((ta: any) => ta.id === selectedTechData.tactic) : null;

  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════

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
      envPreset, sectorFilter, remediationBudget,
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
        const techIds = new Set(activeTechniques.map((t: any) => t.id));
        data.techniques.forEach((nt: any) => {
          if (!techIds.has(nt.techniqueID)) return;
          if (typeof nt.score === "number") {
            newExposures[nt.techniqueID] = Math.max(0, Math.min(1, nt.score / 100));
          }
          if (nt.enabled === false) {
            newRemediated.add(nt.techniqueID);
          }
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
    } catch { /* ignore */ }
    setDataSource("builtin");
    setTimeout(() => setDataSource("stix"), 0);
  };

  const handleToggleCollapse = useCallback((tacId: string) => {
    setCollapsedTactics(prev => {
      const next = new Set(prev);
      if (next.has(tacId)) next.delete(tacId); else next.add(tacId);
      try { localStorage.setItem("attackPathOptimizer_collapsed", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  // ─── Export handlers (extracted hook) ─────────────────────────────────────────

  const { exportCSV, exportNavigatorLayer, exportRemediationPlan, exportCoverageCSV } = useExportHandlers({
    displayTechniques, effectiveExposures, betweenness, chainCoverage,
    filteredChains, remediated, optimal, chainStatus, fwConfig,
    deployedControls, profileExposures, gapAnalysis, exposures,
    activeTechniques, phaseWeighting,
  });

  // ─── GraphView shared props ───────────────────────────────────────────────────

  const graphViewProps = {
    techniques: displayTechniques, edges: displayEdges, positions,
    exposures: effectiveExposures, betweenness, chainCoverage,
    selectedTech, onSelectTech: setSelectedTech,
    highlightedChains, remediated, optimalSet: optimal.selected,
    viewHeight, viewWidth, phaseCenters,
    onNodeDrag: handleNodeDrag,
    searchMatches: techSearchMatches,
    collapsedTactics, onToggleCollapse: handleToggleCollapse,
    isolateChain, chainBuilderMode, chainBuilderPath,
    onChainBuilderClick: (techId: string) => {
      if (!chainBuilderPath.includes(techId)) setChainBuilderPath(prev => [...prev, techId]);
    },
    gapNodes: gapNodeSet,
    techDescriptions: activeTechDescriptions,
    tactics: fwConfig.tactics,
    profileExposures,
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{
      background: "#0a0f1a", color: "#e2e8f0", height: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <Header
        framework={framework} setFramework={setFramework} fwConfig={fwConfig}
        dataSource={dataSource} setDataSource={setDataSource}
        fileInputRef={fileInputRef} navFileInputRef={navFileInputRef}
        handleStixFileUpload={handleStixFileUpload} handleNavigatorImport={handleNavigatorImport}
        uploadedFileName={uploadedFileName} stixError={stixError} uploadError={uploadError} autoDetectedFw={autoDetectedFw}
        envPreset={envPreset} setEnvPreset={setEnvPreset}
        selectedPlatforms={selectedPlatforms} setSelectedPlatforms={setSelectedPlatforms}
        sectorFilter={sectorFilter} setSectorFilter={setSectorFilter}
        remediationBudget={remediationBudget} setRemediationBudget={setRemediationBudget}
        techSearchQuery={techSearchQuery} setTechSearchQuery={setTechSearchQuery}
        displayTechniques={displayTechniques} activeTechniques={activeTechniques} activeChains={activeChains}
        showSubTechniques={showSubTechniques}
      />

      {/* Stats bar */}
      <StatsBar
        framework={framework} filteredChains={filteredChains} totalDisrupted={totalDisrupted}
        remediated={remediated} optimal={optimal} applyOptimal={applyOptimal}
        exportCSV={exportCSV} navFileInputRef={navFileInputRef} exportNavigatorLayer={exportNavigatorLayer}
        showControls={showControls} setShowControls={setShowControls} setPopoutControls={setPopoutControls}
        dataSource={dataSource} fwConfig={fwConfig}
        showSubTechniques={showSubTechniques} setShowSubTechniques={setShowSubTechniques}
        chainBuilderMode={chainBuilderMode} setChainBuilderMode={setChainBuilderMode}
        setChainBuilderPath={setChainBuilderPath} setChainBuilderName={setChainBuilderName}
        phaseWeighting={phaseWeighting} setPhaseWeighting={setPhaseWeighting}
        showGapAnalysis={showGapAnalysis} setShowGapAnalysis={setShowGapAnalysis} setPopoutGapAnalysis={setPopoutGapAnalysis}
        gapAnalysis={gapAnalysis}
        compareMode={compareMode} setCompareMode={setCompareMode}
        environmentProfile={environmentProfile} setShowProfileWizard={setShowProfileWizard}
        showExecutiveSummary={showExecutiveSummary} setShowExecutiveSummary={setShowExecutiveSummary} setPopoutExecutive={setPopoutExecutive}
        showBottomPanels={showBottomPanels} setShowBottomPanels={setShowBottomPanels}
        highlightedChains={highlightedChains} isolateChain={isolateChain} setIsolateChain={setIsolateChain}
        customPositions={customPositions} setCustomPositions={setCustomPositions}
        handleShare={handleShare} shareConfirm={shareConfirm} resetAll={resetAll} showSaved={showSaved}
        showAnalysis={showAnalysis} setShowAnalysis={setShowAnalysis} setPopoutAnalysis={setPopoutAnalysis}
      />

      {/* Split container: graph + bottom panels */}
      <div id="split-container" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Graph area */}
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
                <GraphView {...graphViewProps} />
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
                    highlightedChains={[]} remediated={new Set()} optimalSet={[]}
                    viewHeight={compareLayout.viewHeight} viewWidth={compareLayout.viewWidth}
                    phaseCenters={compareLayout.phaseCenters}
                    onNodeDrag={() => {}} searchMatches={null}
                    collapsedTactics={new Set()} onToggleCollapse={() => {}}
                    isolateChain={false} chainBuilderMode={false} chainBuilderPath={[]} onChainBuilderClick={() => {}}
                    gapNodes={null} techDescriptions={{}}
                    tactics={otherFwConfig.tactics} profileExposures={null}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <GraphView {...graphViewProps} onPopout={() => setPopoutGraph(true)} />
          )}
          {popoutGraph && (
            <PopoutPanel title="ATT&CK Graph" width={1400} height={900} onClose={() => setPopoutGraph(false)} graphMode>
              <div style={{ width: "100%", height: "100vh" }}>
                <GraphView {...graphViewProps} viewHeight={900} viewWidth={1400} />
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
                  try { localStorage.setItem("attackPathOptimizer_customChains", JSON.stringify(next)); } catch {}
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

        {/* Legend bar */}
        <div style={{
          position: "absolute", bottom: showBottomPanels ? panelHeight + 4 : 4, left: 0, right: 0, zIndex: 5,
          background: "#0a0f1acc", backdropFilter: "blur(4px)",
        }}>
          <div style={{ display: "flex", gap: "16px", padding: "4px 24px 2px", flexWrap: "wrap", alignItems: "center" }}>
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
          <div style={{ display: "flex", gap: "4px", padding: "2px 24px 4px", flexWrap: "wrap", alignItems: "center" }}>
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
                    background: tac.color + "15", borderRadius: "3px", whiteSpace: "nowrap",
                  }}>
                    {tac.name}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom panels */}
        {showBottomPanels && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: panelHeight, zIndex: 10,
            display: "flex", flexDirection: "column",
            background: "#0a0f1aee", backdropFilter: "blur(8px)", borderTop: "1px solid #1e293b",
          }}>
            <div onMouseDown={startDividerDrag}
              style={{ height: 8, flexShrink: 0, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 48, height: 3, background: "#334155", borderRadius: 2 }} />
            </div>
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
              {/* Attack Chains */}
              <div style={{ flex: "1 1 280px", borderRight: "1px solid #1e293b", padding: popoutChains ? 0 : "12px 16px", overflow: "auto" }}>
                {popoutChains ? (
                  <>
                    <PopoutPlaceholder label="Attack Chains" onRestore={() => setPopoutChains(false)} />
                    <PopoutPanel title={"Attack Chains (" + filteredChains.length + ")"} width={500} height={700} onClose={() => setPopoutChains(false)}>
                      <ChainsPanel filteredChains={filteredChains} displayedChainStatus={displayedChainStatus}
                        highlightedChains={highlightedChains} toggleHighlightedChain={toggleHighlightedChain}
                        remediated={remediated} effectiveExposures={effectiveExposures}
                        chainSearchQuery={chainSearchQuery} setChainSearchQuery={setChainSearchQuery}
                        popoutChains={popoutChains} setPopoutChains={setPopoutChains}
                        setCustomChains={setCustomChains}
                        expandedChainProfile={expandedChainProfile} setExpandedChainProfile={setExpandedChainProfile}
                        activeGroupProfiles={activeGroupProfiles} chainSetAnalysis={chainSetAnalysis}
                      />
                    </PopoutPanel>
                  </>
                ) : (
                  <ChainsPanel filteredChains={filteredChains} displayedChainStatus={displayedChainStatus}
                    highlightedChains={highlightedChains} toggleHighlightedChain={toggleHighlightedChain}
                    remediated={remediated} effectiveExposures={effectiveExposures}
                    chainSearchQuery={chainSearchQuery} setChainSearchQuery={setChainSearchQuery}
                    popoutChains={popoutChains} setPopoutChains={setPopoutChains}
                    setCustomChains={setCustomChains}
                    expandedChainProfile={expandedChainProfile} setExpandedChainProfile={setExpandedChainProfile}
                    activeGroupProfiles={activeGroupProfiles} chainSetAnalysis={chainSetAnalysis}
                  />
                )}
              </div>
              {/* Priority Ranking */}
              <div style={{ flex: "1 1 240px", borderRight: "1px solid #1e293b", padding: popoutPriority ? 0 : "12px 16px", overflow: "auto" }}>
                {popoutPriority ? (
                  <>
                    <PopoutPlaceholder label="Remediation Priority" onRestore={() => setPopoutPriority(false)} />
                    <PopoutPanel title="Remediation Priority" width={400} height={600} onClose={() => setPopoutPriority(false)}>
                      <PriorityPanel priorityRanking={priorityRanking} selectedTech={selectedTech}
                        setSelectedTech={setSelectedTech} toggleRemediate={toggleRemediate}
                        optimal={optimal} popoutPriority={popoutPriority} setPopoutPriority={setPopoutPriority} />
                    </PopoutPanel>
                  </>
                ) : (
                  <PriorityPanel priorityRanking={priorityRanking} selectedTech={selectedTech}
                    setSelectedTech={setSelectedTech} toggleRemediate={toggleRemediate}
                    optimal={optimal} popoutPriority={popoutPriority} setPopoutPriority={setPopoutPriority} />
                )}
              </div>
              {/* Detail Panel */}
              <div style={{ flex: "1 1 240px", padding: popoutDetail ? 0 : "12px 16px", overflow: "auto" }}>
                {popoutDetail ? (
                  <>
                    <PopoutPlaceholder label="Node Detail" onRestore={() => setPopoutDetail(false)} />
                    <PopoutPanel title={"Node Detail" + (selectedTechData ? ": " + selectedTechData.id : "")} width={400} height={700} onClose={() => setPopoutDetail(false)}>
                      <DetailPanel selectedTech={selectedTech} selectedTechData={selectedTechData} selectedTactic={selectedTactic}
                        betweenness={betweenness} chainCoverage={chainCoverage} effectiveExposures={effectiveExposures}
                        exposures={exposures} handleExposureChange={handleExposureChange}
                        remediated={remediated} toggleRemediate={toggleRemediate}
                        deployedControls={deployedControls} filteredChains={filteredChains} chainStatus={chainStatus}
                        highlightedChains={highlightedChains} toggleHighlightedChain={toggleHighlightedChain}
                        fwConfig={fwConfig} profileExposures={profileExposures}
                        activeTechDescriptions={activeTechDescriptions} activeChainTechContext={activeChainTechContext}
                        activeMitigations={activeMitigations}
                        popoutDetail={popoutDetail} setPopoutDetail={setPopoutDetail}
                      />
                    </PopoutPanel>
                  </>
                ) : (
                  <DetailPanel selectedTech={selectedTech} selectedTechData={selectedTechData} selectedTactic={selectedTactic}
                    betweenness={betweenness} chainCoverage={chainCoverage} effectiveExposures={effectiveExposures}
                    exposures={exposures} handleExposureChange={handleExposureChange}
                    remediated={remediated} toggleRemediate={toggleRemediate}
                    deployedControls={deployedControls} filteredChains={filteredChains} chainStatus={chainStatus}
                    highlightedChains={highlightedChains} toggleHighlightedChain={toggleHighlightedChain}
                    fwConfig={fwConfig} profileExposures={profileExposures}
                    activeTechDescriptions={activeTechDescriptions} activeChainTechContext={activeChainTechContext}
                    activeMitigations={activeMitigations}
                    popoutDetail={popoutDetail} setPopoutDetail={setPopoutDetail}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Controls Panel */}
      {showControls && !popoutControls && (
        <div style={{ borderTop: "1px solid #1e293b", padding: "16px 24px", background: "#0d1321", flexShrink: 0, maxHeight: "45vh", overflow: "auto" }}>
          <ControlsPanel fwConfig={fwConfig} deployedControls={deployedControls} setDeployedControls={setDeployedControls}
            controlPreset={controlPreset} setControlPreset={setControlPreset}
            activeTechniques={activeTechniques} exposures={exposures} effectiveExposures={effectiveExposures}
            popoutControls={popoutControls} setPopoutControls={setPopoutControls} />
        </div>
      )}
      {showControls && popoutControls && (
        <div style={{ borderTop: "1px solid #1e293b", padding: 0, background: "#0d1321", flexShrink: 0 }}>
          <PopoutPlaceholder label="Security Controls" onRestore={() => setPopoutControls(false)} />
        </div>
      )}
      {popoutControls && (
        <PopoutPanel title="Security Controls" width={900} height={600} onClose={() => setPopoutControls(false)}>
          <ControlsPanel fwConfig={fwConfig} deployedControls={deployedControls} setDeployedControls={setDeployedControls}
            controlPreset={controlPreset} setControlPreset={setControlPreset}
            activeTechniques={activeTechniques} exposures={exposures} effectiveExposures={effectiveExposures}
            popoutControls={popoutControls} setPopoutControls={setPopoutControls} />
        </PopoutPanel>
      )}

      {/* Analysis Panel */}
      {showAnalysis && !popoutAnalysis && (
        <div style={{ borderTop: "1px solid #1e293b", padding: "16px 24px", background: "#0d1321", flexShrink: 0, maxHeight: "40vh", overflow: "auto" }}>
          <AnalysisPanel remediationBudget={remediationBudget} optimal={optimal}
            activeTechniques={activeTechniques} betweenness={betweenness} remediated={remediated}
            effectiveExposures={effectiveExposures} filteredChains={filteredChains} totalDisrupted={totalDisrupted}
            compareMode={compareMode} compareAnalysis={compareAnalysis}
            framework={framework} otherFramework={otherFramework}
            popoutAnalysis={popoutAnalysis} setPopoutAnalysis={setPopoutAnalysis} />
        </div>
      )}
      {showAnalysis && popoutAnalysis && (
        <div style={{ borderTop: "1px solid #1e293b", padding: 0, background: "#0d1321", flexShrink: 0 }}>
          <PopoutPlaceholder label="Analysis" onRestore={() => setPopoutAnalysis(false)} />
        </div>
      )}
      {popoutAnalysis && (
        <PopoutPanel title="Optimization Analysis" width={900} height={500} onClose={() => setPopoutAnalysis(false)}>
          <AnalysisPanel remediationBudget={remediationBudget} optimal={optimal}
            activeTechniques={activeTechniques} betweenness={betweenness} remediated={remediated}
            effectiveExposures={effectiveExposures} filteredChains={filteredChains} totalDisrupted={totalDisrupted}
            compareMode={compareMode} compareAnalysis={compareAnalysis}
            framework={framework} otherFramework={otherFramework}
            popoutAnalysis={popoutAnalysis} setPopoutAnalysis={setPopoutAnalysis} />
        </PopoutPanel>
      )}

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
              <div style={{ borderTop: "1px solid #1e293b", padding: "16px 24px", background: "#0d1321", flexShrink: 0, maxHeight: "50vh", overflow: "auto" }}>
                <ExecutiveSummary {...execProps} popout={false} onPopout={() => setPopoutExecutive(true)} />
              </div>
            )}
            {showExecutiveSummary && popoutExecutive && (
              <div style={{ borderTop: "1px solid #1e293b", padding: 0, background: "#0d1321", flexShrink: 0 }}>
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

      {/* Exposure Summary Panel */}
      {exposureSummary && environmentProfile && (
        <ExposureSummaryPanel
          exposureSummary={exposureSummary} environmentProfile={environmentProfile}
          displayTechniques={displayTechniques} setSelectedTech={setSelectedTech}
          exportCoverageCSV={exportCoverageCSV}
          setEnvironmentProfile={setEnvironmentProfile} setProfileExposures={setProfileExposures}
        />
      )}

      {/* Gap Analysis Panel */}
      {showGapAnalysis && !popoutGapAnalysis && (
        <div style={{ borderTop: "1px solid #1e293b", padding: "16px 24px", background: "#0d1321", flexShrink: 0, maxHeight: "45vh", overflow: "auto" }}>
          <GapAnalysisPanel gapAnalysis={gapAnalysis} fwConfig={fwConfig} setSelectedTech={setSelectedTech}
            exportRemediationPlan={exportRemediationPlan}
            popoutGapAnalysis={popoutGapAnalysis} setPopoutGapAnalysis={setPopoutGapAnalysis} />
        </div>
      )}
      {showGapAnalysis && popoutGapAnalysis && (
        <div style={{ borderTop: "1px solid #1e293b", padding: 0, background: "#0d1321", flexShrink: 0 }}>
          <PopoutPlaceholder label="Gap Analysis" onRestore={() => setPopoutGapAnalysis(false)} />
        </div>
      )}
      {popoutGapAnalysis && (
        <PopoutPanel title="Control Gap Analysis" width={900} height={600} onClose={() => setPopoutGapAnalysis(false)}>
          <GapAnalysisPanel gapAnalysis={gapAnalysis} fwConfig={fwConfig} setSelectedTech={setSelectedTech}
            exportRemediationPlan={exportRemediationPlan}
            popoutGapAnalysis={popoutGapAnalysis} setPopoutGapAnalysis={setPopoutGapAnalysis} />
        </PopoutPanel>
      )}

      {/* Environment Profile Wizard */}
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
