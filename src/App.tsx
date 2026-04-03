// ─── App.tsx — AttackBreaker (main component) ────────────────────────────────
// Core state, persistence, and panel orchestration.
// Hooks: useStixLoader, useCompareMode, useEnvironmentProfile, useGraphInteraction, useChainBuilder
// UI panels are in components/Header, components/Panels, components/Graph, etc.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { theme } from './theme';

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

import {
  computeBetweenness,
  computeChainCoverage,
  findOptimalRemediation,
  layoutNodes,
} from './engine/graphModel';

import { encodeStateToHash, decodeHashToState } from './hooks/useUrlState';
import { useExportHandlers } from './hooks/useExportHandlers';
import { useStixLoader } from './hooks/useStixLoader';
import { useCompareMode } from './hooks/useCompareMode';
import { useEnvironmentProfile } from './hooks/useEnvironmentProfile';
import { useGraphInteraction } from './hooks/useGraphInteraction';
import { useChainBuilder } from './hooks/useChainBuilder';

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

export default function AttackBreaker() {
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
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  // ─── Security controls state ─────────────────────────────────────────────────

  const [deployedControls, setDeployedControls] = useState<Set<string>>(new Set());

  // ─── Popout panel states ─────────────────────────────────────────────────────

  const [popoutChains, setPopoutChains] = useState(false);
  const [popoutPriority, setPopoutPriority] = useState(false);
  const [popoutDetail, setPopoutDetail] = useState(false);
  const [popoutAnalysis, setPopoutAnalysis] = useState(false);
  const [popoutControls, setPopoutControls] = useState(false);
  const [popoutGapAnalysis, setPopoutGapAnalysis] = useState(false);

  // ─── Feature toggles ────────────────────────────────────────────────────────

  const [popoutExecutive, setPopoutExecutive] = useState(false);
  const [phaseWeighting, setPhaseWeighting] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string> | null>(null);
  const [controlPreset, setControlPreset] = useState("none");
  const [expandedChainProfile, setExpandedChainProfile] = useState<string | null>(null);
  const [showSubTechniques, setShowSubTechniques] = useState(false);
  const [chainSearchQuery, setChainSearchQuery] = useState("");

  // ─── Right sidebar drawer ──────────────────────────────────────────────────
  type SidebarPanel = "controls" | "analysis" | "gap" | "executive" | null;
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>(null);
  const sidebarOpen = sidebarPanel !== null;
  const [headerCollapsed, setHeaderCollapsed] = useState(() => {
    const saved = localStorage.getItem('ab_headerCollapsed');
    return saved !== null ? saved === 'true' : true; // collapsed by default for more space
  });

  // ─── Bottom panel tab state ────────────────────────────────────────────────
  type BottomTab = "chains" | "priority" | "detail";
  const [bottomTab, setBottomTab] = useState<BottomTab>(() => {
    const saved = localStorage.getItem('ab_bottomTab');
    return (saved === "chains" || saved === "priority" || saved === "detail") ? saved : "chains";
  });

  // Persist layout preferences
  useEffect(() => { localStorage.setItem('ab_bottomTab', bottomTab); }, [bottomTab]);
  useEffect(() => { localStorage.setItem('ab_headerCollapsed', String(headerCollapsed)); }, [headerCollapsed]);

  // Auto-switch to detail tab when a technique is selected
  useEffect(() => {
    if (selectedTech) setBottomTab("detail");
  }, [selectedTech]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      // Bottom tab shortcuts: 1/2/3
      if (e.key === "1" && !e.ctrlKey && !e.metaKey && !e.altKey) { setBottomTab("chains"); return; }
      if (e.key === "2" && !e.ctrlKey && !e.metaKey && !e.altKey) { setBottomTab("priority"); return; }
      if (e.key === "3" && !e.ctrlKey && !e.metaKey && !e.altKey) { setBottomTab("detail"); return; }

      // Toggle bottom panels: b
      if (e.key === "b" && !e.ctrlKey && !e.metaKey && !e.altKey) { setShowBottomPanels((prev: boolean) => !prev); return; }

      // Toggle header: h
      if (e.key === "h" && !e.ctrlKey && !e.metaKey && !e.altKey) { setHeaderCollapsed(prev => !prev); return; }

      // Sidebar panels: s (controls), a (analysis), g (gap), x (executive)
      if (e.key === "s" && !e.ctrlKey && !e.metaKey && !e.altKey) { setSidebarPanel(prev => prev === "controls" ? null : "controls"); return; }
      if (e.key === "a" && !e.ctrlKey && !e.metaKey && !e.altKey) { setSidebarPanel(prev => prev === "analysis" ? null : "analysis"); return; }
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) { setSidebarPanel(prev => prev === "gap" ? null : "gap"); return; }
      if (e.key === "x" && !e.ctrlKey && !e.metaKey && !e.altKey) { setSidebarPanel(prev => prev === "executive" ? null : "executive"); return; }

      // Escape closes sidebar
      if (e.key === "Escape" && sidebarOpen) { setSidebarPanel(null); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sidebarOpen]);

  // ─── Persistence helpers ─────────────────────────────────────────────────────

  const [showSaved, setShowSaved] = useState(false);
  const skipEnvEffect = useRef(false);
  const mountTime = useRef(Date.now());
  const hashChainNamesRef = useRef<string[] | null>(null);
  const [shareConfirm, setShareConfirm] = useState(false);

  // ─── Extracted hooks ─────────────────────────────────────────────────────────

  const stixLoader = useStixLoader({ framework, fwConfig, setFramework, setCustomPositions });
  const {
    dataSource, setDataSource, customData, stixLoading, stixError,
    uploadedFileName, uploadError, autoDetectedFw,
    fileInputRef, navFileInputRef, handleStixFileUpload,
  } = stixLoader;

  const chainBuilder = useChainBuilder();
  const {
    chainBuilderMode, setChainBuilderMode,
    chainBuilderPath, setChainBuilderPath,
    chainBuilderName, setChainBuilderName,
    customChains, setCustomChains,
    saveChain, addTechToPath, undoStep, clearPath,
  } = chainBuilder;

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

  // Display techniques (filtered by sub-technique toggle + platform filter)
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

  // Effective exposures with security control adjustments
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

  // ─── More extracted hooks (depend on derived data) ───────────────────────────

  const compare = useCompareMode({ framework, activeTechniques });
  const {
    compareMode, setCompareMode, compareLoading,
    otherFramework, otherFwConfig, compareLayout, compareAnalysis,
  } = compare;

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

  const graphInteraction = useGraphInteraction({ displayTechniques });
  const {
    panelHeight, showBottomPanels, setShowBottomPanels,
    collapsedTactics, setCollapsedTactics,
    techSearchQuery, setTechSearchQuery,
    popoutGraph, setPopoutGraph,
    startDividerDrag, startDividerDragTouch, handleToggleCollapse, techSearchMatches,
  } = graphInteraction;

  const filteredChains = useMemo(() => {
    if (sectorFilter === "all") return activeChains;
    return activeChains.filter((c: any) => c.sector === sectorFilter || c.sector === "all");
  }, [sectorFilter, activeChains]);

  const chainCoverage = useMemo(() => computeChainCoverage(activeTechniques, filteredChains), [activeTechniques, filteredChains]);

  const envProfile = useEnvironmentProfile({
    fwConfig, displayTechniques, activeChains,
    betweenness, chainCoverage, setExposures,
  });
  const {
    environmentProfile, setEnvironmentProfile,
    showProfileWizard, setShowProfileWizard,
    profileExposures, setProfileExposures,
    exposureSummary,
  } = envProfile;

  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════════

  // Restore state from hash or localStorage on mount
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
      const raw = localStorage.getItem("attackBreaker");
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

  // Environment preset -> exposures
  useEffect(() => {
    if (skipEnvEffect.current) { skipEnvEffect.current = false; return; }
    const preset = fwConfig.envPresets[envPreset];
    if (preset?.overrides) {
      setExposures({ ...preset.overrides });
    } else {
      setExposures({});
    }
  }, [envPreset, fwConfig]);

  // Framework change side effect
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

  // Auto-save to localStorage (debounced 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("attackBreaker", JSON.stringify({
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════

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
    if (sidebarPanel !== "gap") return null;
    return new Set(gapAnalysis.gaps.map((g: any) => g.id));
  }, [sidebarPanel, gapAnalysis]);

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

  const handleNavigatorImport = useCallback((file: File) => {
    if (file.size > 25 * 1024 * 1024) { stixLoader.setUploadError("File too large (max 25 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.techniques || !Array.isArray(data.techniques) || !data.techniques[0]?.techniqueID) {
          stixLoader.setUploadError("Not a valid Navigator layer (missing techniques[].techniqueID)");
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
        stixLoader.setUploadError(null);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (err: any) {
        stixLoader.setUploadError("Failed to parse Navigator layer: " + (err.message || "Invalid JSON"));
      }
    };
    reader.onerror = () => stixLoader.setUploadError("Failed to read Navigator file");
    reader.readAsText(file);
  }, [exposures, remediated, activeTechniques]);

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

  const resetAll = () => {
    setFramework("enterprise");
    setRemediated(new Set());
    setSelectedTech(null);
    setHighlightedChains([]);
    setSidebarPanel(null);
    setEnvPreset("government");
    setSectorFilter("all");
    setRemediationBudget(5);
    setCustomPositions({});
    setDeployedControls(new Set());
    setPopoutChains(false);
    setPopoutPriority(false);
    setPopoutDetail(false);
    setPopoutAnalysis(false);
    setPopoutControls(false);
    setChainSearchQuery("");
    setShowSubTechniques(false);
    setPopoutExecutive(false);
    setShareConfirm(false);
    setPopoutGapAnalysis(false);
    setPhaseWeighting(false);
    setSelectedPlatforms(null);
    setControlPreset("none");
    setExpandedChainProfile(null);
    // Reset extracted hooks
    graphInteraction.resetGraphInteraction();
    chainBuilder.resetBuilder();
    compare.resetCompare();
    envProfile.resetProfile();
    stixLoader.resetLoader();
    try {
      localStorage.removeItem("attackBreaker");
      localStorage.removeItem("attackBreaker_collapsed");
      localStorage.removeItem("attackBreaker_envProfile");
    } catch { /* ignore */ }
  };

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
    onChainBuilderClick: addTechToPath,
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
      background: theme.colors.bg, color: theme.colors.textBody, height: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Collapsed toolbar strip */}
      {headerCollapsed && (
        <div style={{
          display: "flex", alignItems: "center", gap: theme.spacing.xl,
          padding: "6px 20px", background: theme.colors.bgPanel, borderBottom: "1px solid " + theme.colors.borderSubtle,
          flexShrink: 0, minHeight: "32px",
        }}>
          <button onClick={() => setHeaderCollapsed(false)}
            title="Expand toolbar"
            style={{
              background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
              color: theme.colors.textSecondary, cursor: "pointer", padding: "2px 8px", fontSize: theme.fontSizes.body,
              fontFamily: "inherit", lineHeight: 1,
            }}>{"\u25BC"}</button>
          <span style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: theme.colors.textPrimary, letterSpacing: "-0.5px" }}>
            AttackBreaker
          </span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textSecondary }}>|</span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.blue, fontWeight: 700 }}>
            {framework === "ics" ? "ICS/OT" : "ENTERPRISE"}
          </span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textSecondary }}>|</span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textBody }}>
            {filteredChains.length} chains
          </span>
          <span style={{ fontSize: theme.fontSizes.base, color: totalDisrupted > 0 ? theme.colors.green : theme.colors.textSecondary }}>
            {totalDisrupted} disrupted
          </span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textBody }}>
            {remediated.size} remediated
          </span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textSecondary }}>|</span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textSecondary }}>
            {dataSource === "stix" ? "STIX" : dataSource === "upload" ? uploadedFileName || "Uploaded" : "Built-in"}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>
            H expand toolbar &middot; B toggle panels &middot; 1/2/3 tabs
          </span>
        </div>
      )}

      {/* Header */}
      {!headerCollapsed && (
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
      )}

      {/* Stats bar */}
      {!headerCollapsed && <StatsBar
        framework={framework} filteredChains={filteredChains} totalDisrupted={totalDisrupted}
        remediated={remediated} optimal={optimal} applyOptimal={applyOptimal}
        exportCSV={exportCSV} navFileInputRef={navFileInputRef} exportNavigatorLayer={exportNavigatorLayer}
        dataSource={dataSource} fwConfig={fwConfig}
        showSubTechniques={showSubTechniques} setShowSubTechniques={setShowSubTechniques}
        chainBuilderMode={chainBuilderMode} setChainBuilderMode={setChainBuilderMode}
        setChainBuilderPath={setChainBuilderPath} setChainBuilderName={setChainBuilderName}
        phaseWeighting={phaseWeighting} setPhaseWeighting={setPhaseWeighting}
        compareMode={compareMode} setCompareMode={setCompareMode}
        environmentProfile={environmentProfile} setShowProfileWizard={setShowProfileWizard}
        showBottomPanels={showBottomPanels} setShowBottomPanels={setShowBottomPanels}
        highlightedChains={highlightedChains} isolateChain={isolateChain} setIsolateChain={setIsolateChain}
        customPositions={customPositions} setCustomPositions={setCustomPositions}
        handleShare={handleShare} shareConfirm={shareConfirm} resetAll={resetAll} showSaved={showSaved}
        sidebarPanel={sidebarPanel} setSidebarPanel={setSidebarPanel}
      />}

      {/* Collapse toolbar button (shown when expanded) */}
      {!headerCollapsed && (
        <div style={{
          display: "flex", justifyContent: "center", background: theme.colors.bgPanel,
          borderBottom: "1px solid " + theme.colors.borderSubtle, flexShrink: 0,
        }}>
          <button onClick={() => setHeaderCollapsed(true)}
            title="Collapse toolbar"
            style={{
              background: "transparent", border: "none", color: theme.colors.textMuted,
              cursor: "pointer", padding: "2px 14px", fontSize: theme.fontSizes.small,
              fontFamily: "inherit", lineHeight: "18px",
            }}>{"\u25B2"} collapse toolbar {"\u25B2"}</button>
        </div>
      )}

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
                <div style={{ position: "absolute", top: 6, left: 10, zIndex: 10, padding: "4px 10px", background: framework === "ics" ? "#a855f730" : "#3b82f630", color: framework === "ics" ? theme.colors.purple : theme.colors.blue, borderRadius: theme.radii.sm, fontSize: theme.fontSizes.small, fontWeight: 700 }}>
                  {framework === "ics" ? "ICS/OT" : "ENTERPRISE"} (active)
                </div>
                <GraphView {...graphViewProps} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ position: "absolute", top: 6, left: 10, zIndex: 10, padding: "4px 10px", background: otherFramework === "ics" ? "#a855f730" : "#3b82f630", color: otherFramework === "ics" ? theme.colors.purple : theme.colors.blue, borderRadius: theme.radii.sm, fontSize: theme.fontSizes.small, fontWeight: 700 }}>
                  {otherFramework === "ics" ? "ICS/OT" : "ENTERPRISE"} (read-only)
                </div>
                {compareLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: theme.colors.textMuted, fontSize: theme.fontSizes.body }}>
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
              position: "absolute", top: 10, left: 16, right: 16,
              background: "#1e293bee", border: "1px solid " + theme.colors.purple, borderRadius: theme.radii.md,
              padding: "12px 16px", zIndex: 15,
              display: "flex", alignItems: "center", gap: theme.spacing.lg, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.purple, fontWeight: 700 }}>CHAIN BUILDER</span>
              <div style={{ flex: 1, display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
                {chainBuilderPath.length === 0 ? (
                  <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>Click nodes to build a path...</span>
                ) : chainBuilderPath.map((tid: string, i: number) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.purple }}>{"\u2192"}</span>}
                    <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, background: "#a855f720", padding: "3px 7px", borderRadius: theme.radii.sm, fontFamily: '"JetBrains Mono", monospace' }}>{tid}</span>
                  </React.Fragment>
                ))}
              </div>
              <input type="text" value={chainBuilderName} onChange={e => setChainBuilderName(e.target.value)}
                placeholder="Chain name..."
                style={{ ...theme.inputBase, padding: "5px 10px", width: "140px" }} />
              <button onClick={undoStep} disabled={chainBuilderPath.length === 0}
                style={{ background: "transparent", color: theme.colors.textMuted, border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm, padding: "5px 10px", fontSize: theme.fontSizes.small, cursor: "pointer", fontFamily: "inherit", opacity: chainBuilderPath.length === 0 ? 0.3 : 1 }}>UNDO</button>
              <button onClick={clearPath}
                style={{ background: "transparent", color: theme.colors.red, border: "1px solid #ef444466", borderRadius: theme.radii.sm, padding: "5px 10px", fontSize: theme.fontSizes.small, cursor: "pointer", fontFamily: "inherit" }}>CLEAR</button>
              <button onClick={saveChain} disabled={chainBuilderPath.length < 2}
                style={{
                  background: chainBuilderPath.length < 2 ? theme.colors.border : theme.colors.purple,
                  color: chainBuilderPath.length < 2 ? theme.colors.textFaint : "#fff",
                  border: "none", borderRadius: theme.radii.sm, padding: "5px 12px", fontSize: theme.fontSizes.small, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>SAVE</button>
            </div>
          )}
          {stixLoading && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(10,15,26,0.85)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: theme.fontSizes.stat, color: theme.colors.orange, marginBottom: theme.spacing.lg, animation: "stix-pulse 1.5s ease-in-out infinite" }}>
                  Fetching STIX data...
                </div>
                <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.textMuted }}>Downloading from MITRE ATT&CK GitHub (~25MB)</div>
              </div>
            </div>
          )}
        </div>

        {/* Legend bar */}
        <div style={{
          position: "absolute", bottom: showBottomPanels ? panelHeight + 4 : 4, left: 0, right: 0, zIndex: 5,
          background: "#0a0f1acc", backdropFilter: "blur(4px)",
        }}>
          <div style={{ display: "flex", gap: theme.spacing.xl, padding: "6px 24px 3px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Legend:</span>
            <LegendItem color="#ef4444" label="High exposure ring" />
            <LegendItem color="#f59e0b" label="Medium exposure ring" />
            <LegendItem color="#22c55e" label="Low exposure / remediated" />
            <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.textSecondary }}>|</span>
            <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.textSecondary }}>Node size = betweenness x exposure</span>
            <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.textSecondary }}>|</span>
            <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.textSecondary }}>Number = chain count</span>
            <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.textSecondary }}>|</span>
            <span style={{ fontSize: theme.fontSizes.body, color: theme.colors.orange, border: "1px dashed " + theme.colors.orange, padding: "2px 7px", borderRadius: theme.radii.pill }}>
              dashed ring = optimal target
            </span>
          </div>
          <div style={{ display: "flex", gap: theme.spacing.sm, padding: "3px 24px 6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "1px", marginRight: theme.spacing.sm, fontWeight: 600 }}>Tactics:</span>
            {fwConfig.tactics.map((tac: any, i: number) => {
              const isNewPhase = i > 0 && tac.phase !== fwConfig.tactics[i - 1].phase;
              return (
                <React.Fragment key={tac.id}>
                  {i > 0 && (
                    <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textFaint, margin: "0 2px" }}>{isNewPhase ? "\u2192" : "\u00b7"}</span>
                  )}
                  <span style={{
                    fontSize: theme.fontSizes.small, color: tac.color, padding: "2px 8px",
                    background: tac.color + "20", borderRadius: theme.radii.sm, whiteSpace: "nowrap",
                  }}>
                    {tac.name}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom panels — tabbed interface */}
        {showBottomPanels && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: panelHeight, zIndex: 10,
            display: "flex", flexDirection: "column",
            background: "#0a0f1aee", backdropFilter: "blur(8px)", borderTop: "1px solid #1e293b",
          }}>
            {/* Resize handle */}
            <div onMouseDown={startDividerDrag} onTouchStart={startDividerDragTouch}
              style={{ height: 16, flexShrink: 0, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none" }}>
              <div style={{ width: 48, height: 4, background: theme.colors.textFaint, borderRadius: 2 }} />
            </div>
            {/* Tab bar */}
            <div style={{
              display: "flex", gap: 0, flexShrink: 0,
              borderBottom: "1px solid " + theme.colors.borderSubtle,
              background: theme.colors.bgPanel,
              padding: "0 12px",
            }}>
              {([
                { id: "chains" as BottomTab, label: "Attack Chains", shortcut: "1", count: filteredChains.length, color: theme.colors.violet, popped: popoutChains },
                { id: "priority" as BottomTab, label: "Priority", shortcut: "2", count: priorityRanking.length, color: theme.colors.orange, popped: popoutPriority },
                { id: "detail" as BottomTab, label: "Detail" + (selectedTechData ? ": " + selectedTechData.id : ""), shortcut: "3", count: null, color: theme.colors.cyan, popped: popoutDetail },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setBottomTab(tab.id)}
                  style={{
                    background: bottomTab === tab.id ? theme.colors.bgCard : "transparent",
                    border: "none",
                    borderBottom: bottomTab === tab.id ? "2px solid " + tab.color : "2px solid transparent",
                    color: bottomTab === tab.id ? tab.color : theme.colors.textMuted,
                    padding: "8px 18px",
                    fontSize: theme.fontSizes.base,
                    fontWeight: bottomTab === tab.id ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "color 0.15s, border-color 0.15s",
                    display: "flex", alignItems: "center", gap: 8,
                    position: "relative",
                  }}>
                  {tab.label}
                  <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, marginLeft: 2 }}>{tab.shortcut}</span>
                  {tab.count !== null && (
                    <span style={{
                      fontSize: theme.fontSizes.tiny,
                      background: bottomTab === tab.id ? tab.color + "22" : theme.colors.bgSurface,
                      color: bottomTab === tab.id ? tab.color : theme.colors.textFaint,
                      padding: "1px 7px",
                      borderRadius: theme.radii.pill,
                      fontWeight: 600,
                    }}>{tab.count}</span>
                  )}
                  {tab.popped && (
                    <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint }}>⧉</span>
                  )}
                </button>
              ))}
            </div>
            {/* Tab content — full width */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {/* Attack Chains tab */}
              {bottomTab === "chains" && (
                <div style={{ padding: popoutChains ? 0 : "14px 20px", height: "100%" }}>
                  {popoutChains ? (
                    <>
                      <PopoutPlaceholder label="Attack Chains" onRestore={() => setPopoutChains(false)} />
                      <PopoutPanel title={"Attack Chains (" + filteredChains.length + ")"} width={500} height={700} onClose={() => setPopoutChains(false)}>
                        <ChainsPanel filteredChains={filteredChains} displayedChainStatus={displayedChainStatus}
                          highlightedChains={highlightedChains} toggleHighlightedChain={toggleHighlightedChain}
                          remediated={remediated} effectiveExposures={effectiveExposures}
                          activeTechniques={activeTechniques}
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
                      activeTechniques={activeTechniques}
                      chainSearchQuery={chainSearchQuery} setChainSearchQuery={setChainSearchQuery}
                      popoutChains={popoutChains} setPopoutChains={setPopoutChains}
                      setCustomChains={setCustomChains}
                      expandedChainProfile={expandedChainProfile} setExpandedChainProfile={setExpandedChainProfile}
                      activeGroupProfiles={activeGroupProfiles} chainSetAnalysis={chainSetAnalysis}
                    />
                  )}
                </div>
              )}
              {/* Priority tab */}
              {bottomTab === "priority" && (
                <div style={{ padding: popoutPriority ? 0 : "14px 20px", height: "100%" }}>
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
              )}
              {/* Detail tab */}
              {bottomTab === "detail" && (
                <div style={{ padding: popoutDetail ? 0 : "14px 20px", height: "100%" }}>
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Right Sidebar Drawer ═══ */}
      {sidebarOpen && (
        <div className="sidebar-enter" style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 90vw)", zIndex: 100,
          display: "flex", flexDirection: "column",
          background: theme.colors.bgPanel, borderLeft: "1px solid " + theme.colors.border,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        }}>
          {/* Sidebar header */}
          <div style={{
            display: "flex", alignItems: "center", padding: "12px 16px",
            borderBottom: "1px solid " + theme.colors.borderSubtle,
            background: theme.colors.bgCard, flexShrink: 0,
          }}>
            {/* Sidebar tab buttons */}
            {([
              { id: "controls" as SidebarPanel, label: "Controls", shortcut: "S", color: theme.colors.teal },
              { id: "analysis" as SidebarPanel, label: "Analysis", shortcut: "A", color: theme.colors.blue },
              { id: "gap" as SidebarPanel, label: "Gaps", shortcut: "G", color: theme.colors.red },
              { id: "executive" as SidebarPanel, label: "Executive", shortcut: "X", color: theme.colors.cyan },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setSidebarPanel(tab.id)}
                style={{
                  background: sidebarPanel === tab.id ? tab.color + "18" : "transparent",
                  border: "none",
                  borderBottom: sidebarPanel === tab.id ? "2px solid " + tab.color : "2px solid transparent",
                  color: sidebarPanel === tab.id ? tab.color : theme.colors.textMuted,
                  padding: "6px 12px", fontSize: theme.fontSizes.small, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                {tab.label}
                <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, marginLeft: 4 }}>{tab.shortcut}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setSidebarPanel(null)}
              title="Close (Esc)"
              style={{
                background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
                color: theme.colors.textMuted, cursor: "pointer", padding: "4px 10px",
                fontSize: theme.fontSizes.base, fontFamily: "inherit",
              }}>{"\u2715"}</button>
          </div>
          {/* Sidebar content */}
          <div style={{ flex: 1, overflow: "auto", padding: "18px 20px" }}>
            {sidebarPanel === "controls" && (
              <ControlsPanel fwConfig={fwConfig} deployedControls={deployedControls} setDeployedControls={setDeployedControls}
                controlPreset={controlPreset} setControlPreset={setControlPreset}
                activeTechniques={activeTechniques} exposures={exposures} effectiveExposures={effectiveExposures}
                popoutControls={popoutControls} setPopoutControls={setPopoutControls} />
            )}
            {sidebarPanel === "analysis" && (
              <AnalysisPanel remediationBudget={remediationBudget} optimal={optimal}
                activeTechniques={activeTechniques} betweenness={betweenness} remediated={remediated}
                effectiveExposures={effectiveExposures} filteredChains={filteredChains} totalDisrupted={totalDisrupted}
                compareMode={compareMode} compareAnalysis={compareAnalysis}
                framework={framework} otherFramework={otherFramework}
                popoutAnalysis={popoutAnalysis} setPopoutAnalysis={setPopoutAnalysis} />
            )}
            {sidebarPanel === "gap" && (
              <GapAnalysisPanel gapAnalysis={gapAnalysis} fwConfig={fwConfig} setSelectedTech={setSelectedTech}
                exportRemediationPlan={exportRemediationPlan}
                popoutGapAnalysis={popoutGapAnalysis} setPopoutGapAnalysis={setPopoutGapAnalysis} />
            )}
            {sidebarPanel === "executive" && (() => {
              const execProps = {
                techniques: displayTechniques, exposures: effectiveExposures, betweenness, chainCoverage,
                filteredChains, chainStatus, remediated, optimal, deployedControls,
                tactics: fwConfig.tactics, securityControls: fwConfig.securityControls as any,
              };
              return <ExecutiveSummary {...execProps} popout={false} onPopout={() => setPopoutExecutive(true)} />;
            })()}
          </div>
          {/* Keyboard hint */}
          <div style={{
            padding: "8px 16px", borderTop: "1px solid " + theme.colors.borderSubtle,
            display: "flex", gap: 12, flexShrink: 0,
          }}>
            <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint }}>
              Esc close
            </span>
            <span style={{ fontSize: theme.fontSizes.tiny, color: theme.colors.textFaint }}>
              S controls  A analysis  G gaps  X executive
            </span>
          </div>
        </div>
      )}
      {/* Backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div className="backdrop-fade" onClick={() => setSidebarPanel(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99,
            background: "rgba(0,0,0,0.3)",
          }} />
      )}

      {/* Popout panels still work independently */}
      {popoutControls && (
        <PopoutPanel title="Security Controls" width={900} height={600} onClose={() => setPopoutControls(false)}>
          <ControlsPanel fwConfig={fwConfig} deployedControls={deployedControls} setDeployedControls={setDeployedControls}
            controlPreset={controlPreset} setControlPreset={setControlPreset}
            activeTechniques={activeTechniques} exposures={exposures} effectiveExposures={effectiveExposures}
            popoutControls={popoutControls} setPopoutControls={setPopoutControls} />
        </PopoutPanel>
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
      {popoutExecutive && (
        <PopoutPanel title="Executive Summary" width={600} height={800} onClose={() => setPopoutExecutive(false)}>
          {(() => {
            const execProps = {
              techniques: displayTechniques, exposures: effectiveExposures, betweenness, chainCoverage,
              filteredChains, chainStatus, remediated, optimal, deployedControls,
              tactics: fwConfig.tactics, securityControls: fwConfig.securityControls as any,
            };
            return <ExecutiveSummary {...execProps} popout={true} />;
          })()}
        </PopoutPanel>
      )}
      {popoutGapAnalysis && (
        <PopoutPanel title="Control Gap Analysis" width={900} height={600} onClose={() => setPopoutGapAnalysis(false)}>
          <GapAnalysisPanel gapAnalysis={gapAnalysis} fwConfig={fwConfig} setSelectedTech={setSelectedTech}
            exportRemediationPlan={exportRemediationPlan}
            popoutGapAnalysis={popoutGapAnalysis} setPopoutGapAnalysis={setPopoutGapAnalysis} />
        </PopoutPanel>
      )}

      {/* Exposure Summary Panel — shown inline when environment profile is active */}
      {exposureSummary && environmentProfile && (
        <ExposureSummaryPanel
          exposureSummary={exposureSummary} environmentProfile={environmentProfile}
          displayTechniques={displayTechniques} setSelectedTech={setSelectedTech}
          exportCoverageCSV={exportCoverageCSV}
          setEnvironmentProfile={setEnvironmentProfile} setProfileExposures={setProfileExposures}
        />
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
