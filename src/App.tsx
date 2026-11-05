// ─── App.tsx — AttackBreaker (main component) ────────────────────────────────
// Core state, persistence, and panel orchestration.
// Data: useAttackData · Posture: useDefenses · Environment: useEnvironmentProfile
// Model + optimizer: useRiskModel · Exports: useExportHandlers

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { theme } from './theme';

import type { AttackChain, CatalogItem, FrameworkId, ModelParams, VocabularyId } from './types';
import { ENCODING, MAX_HIGHLIGHTED_CHAINS } from './data/constants';
import { getFrameworkConfig } from './data/frameworkConfig';

import { layoutNodes, buildCooccurrenceEdges, chainByPhase, chainFanEdges } from './engine/graphModel';
import { actorBreakdown, compileModel, evaluateModel, DEFAULT_MODEL_PARAMS } from './engine/riskModel';
import { fullCost, marginalValues, ORG_SIZES, type OrgSize } from './engine/portfolioOptimizer';
import { defenseFootprint, findBlindSpots, fmtPct, fmtUsd, nodeDefenses } from './engine/displayMetrics';

import { usePersistentState, STORAGE_PREFIX } from './hooks/usePersistentState';
import { KEYS, DEFAULT_BUDGET, isParams, shareUrl, type Highlight } from './hooks/sharedLink';
import { useAttackData } from './hooks/useAttackData';
import { useDefenses } from './hooks/useDefenses';
import { useD3fendData } from './hooks/useD3fendData';
import { attackVocabulary, d3fendVocabulary } from './engine/defenseVocabulary';
import { useEnvironmentProfile } from './hooks/useEnvironmentProfile';
import { useRiskModel } from './hooks/useRiskModel';
import { useOptimalityCheck } from './hooks/useOptimalityCheck';
import { useEvalsCoverage } from './hooks/useEvalsCoverage';
import { mergeEvalsIntoKb } from './engine/evalsCoverage';
import { useExportHandlers } from './hooks/useExportHandlers';
import { useCompareMode } from './hooks/useCompareMode';
import { useGraphInteraction } from './hooks/useGraphInteraction';
import { useChainBuilder } from './hooks/useChainBuilder';

import { GraphView, type ChainOverlay, type GateMarker } from './components/Graph';
import { PopoutPanel, PopoutPlaceholder } from './components/Analysis';
import { ExecutiveSummary } from './components/Export';
import { ProfileWizard } from './components/ProfileWizard';
import { HelpGuide } from './components/HelpGuide';
import { Header, StatsBar, SIDEBAR_TABS, type SidebarPanel } from './components/Header';
import {
  ChainsPanel, HotspotsPanel, DetailPanel, PlanPanel, DefensesPanel, ModelPanel, BlindSpotsPanel, ExposureSummaryPanel,
  type DefenseHover, type KindFilter,
} from './components/Panels';

// ─── Persistence validators ──────────────────────────────────────────────────

const isBool = (v: unknown) => typeof v === 'boolean';
const isStr = (v: unknown) => typeof v === 'string';
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
const isFw = (v: unknown) => v === 'enterprise' || v === 'ics';
const isOrg = (v: unknown) => typeof v === 'string' && v in ORG_SIZES;
const isStrListOrNull = (v: unknown) => v === null || (Array.isArray(v) && v.every(x => typeof x === 'string'));
const isHighlights = (v: unknown) => Array.isArray(v) && v.every(h => !!h && typeof (h as Highlight).id === 'string' && typeof (h as Highlight).color === 'number');
const isSidebar = (v: unknown) => v === null || SIDEBAR_TABS.some(t => t.id === v);
type BottomTab = "chains" | "hotspots" | "detail";
const isBottomTab = (v: unknown) => v === 'chains' || v === 'hotspots' || v === 'detail';
const isVocab = (v: unknown) => v === 'attack' || v === 'd3fend';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttackBreaker() {
  // ─── Core state ──────────────────────────────────────────────────────────────

  const [framework, setFramework] = usePersistentState<FrameworkId>(KEYS.framework, 'enterprise', isFw);
  const cfg = useMemo(() => getFrameworkConfig(framework), [framework]);
  const data = useAttackData(cfg, setFramework);
  const dataset = data.dataset;

  const [vocab, setVocab] = usePersistentState<VocabularyId>(KEYS.vocabulary, 'attack', isVocab);
  const { d3fend } = useD3fendData();
  const evals = useEvalsCoverage();
  const [budget, setBudget] = usePersistentState<number>(KEYS.budget, DEFAULT_BUDGET, isNum);
  const [orgSize, setOrgSize] = usePersistentState<OrgSize>(KEYS.orgSize, 'medium', isOrg);
  const [costOverrides, setCostOverrides] = usePersistentState<Record<string, number>>(KEYS.costs, {}, isObj);
  const [params, setParams] = usePersistentState<ModelParams>(KEYS.params, DEFAULT_MODEL_PARAMS, isParams);
  const [gatesByFw, setGatesByFw] = usePersistentState<Partial<Record<FrameworkId, string[]>>>(KEYS.gates, {}, isObj);
  const [includeSoftware, setIncludeSoftware] = usePersistentState<boolean>(KEYS.software, true, isBool);
  const [includeCampaigns, setIncludeCampaigns] = usePersistentState<boolean>(KEYS.campaigns, false, isBool);
  const [sector, setSector] = usePersistentState<string>(KEYS.sector, 'all', isStr);
  const [envPreset, setEnvPreset] = usePersistentState<string>(KEYS.envPreset, 'default', isStr);
  const [exposureOverrides, setExposureOverrides] = usePersistentState<Partial<Record<FrameworkId, Record<string, number>>>>(KEYS.exposure, {}, isObj);
  const [platformList, setPlatformList] = usePersistentState<string[] | null>(KEYS.platforms, null, isStrListOrNull);
  const [highlighted, setHighlighted] = usePersistentState<Highlight[]>(KEYS.highlighted, [], isHighlights);
  const [sidebarPanel, setSidebarPanel] = usePersistentState<SidebarPanel | null>(KEYS.sidebar, 'plan', isSidebar);
  const [bottomTab, setBottomTab] = usePersistentState<BottomTab>(KEYS.bottomTab, 'chains', isBottomTab);
  const [headerCollapsed, setHeaderCollapsed] = usePersistentState<boolean>(KEYS.headerCollapsed, true, isBool);

  const [selectedTech, setSelectedTechState] = useState<string | null>(null);
  const [isolateChain, setIsolateChain] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(false);
  const [showSubTechniques, setShowSubTechniques] = useState(false);
  const [chainQuery, setChainQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [hoverDefense, setHoverDefense] = useState<DefenseHover | null>(null);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [popout, setPopout] = useState<{ chains?: boolean; hotspots?: boolean; detail?: boolean; executive?: boolean }>({});
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [shareConfirm, setShareConfirm] = useState(false);

  const setSelectedTech = useCallback((id: string | null) => {
    setSelectedTechState(id);
    if (id) setBottomTab("detail");
  }, [setBottomTab]);

  const changeFramework = useCallback((fw: FrameworkId) => {
    setFramework(fw);
    setSelectedTechState(null);
    setHighlighted([]);
    setCustomPositions({});
    setShowSubTechniques(false);
    setPlatformList(null);
  }, [setFramework, setHighlighted, setPlatformList]);

  const defenses = useDefenses(cfg, vocab, d3fend);
  const chainBuilder = useChainBuilder();
  const { customChains, removeChain } = chainBuilder;

  // ═══════════════════════════════════════════════════════════════════════════════
  // DERIVED DATA
  // ═══════════════════════════════════════════════════════════════════════════════

  const techniques = useMemo(() => dataset?.techniques ?? [], [dataset]);
  const techById = useMemo(() => new Map(techniques.map(t => [t.id, t])), [techniques]);
  const vocabulary = useMemo(() => {
    if (!dataset) return null;
    if (vocab === 'd3fend') return d3fend ? d3fendVocabulary(dataset, d3fend) : null;
    return attackVocabulary(dataset, cfg);
  }, [dataset, vocab, d3fend, cfg]);
  /** D3FEND countermeasures that implement an ATT&CK mitigation (crosswalk) */
  const implementedBy = useCallback((itemId: string) => (vocab === 'attack' && d3fend
    ? (d3fend.mitigations[itemId] ?? []).map(id => d3fend.techniques[id]?.name ?? id)
    : []), [vocab, d3fend]);
  const platforms = useMemo(() => (platformList ? new Set(platformList) : null), [platformList]);
  const setSelectedPlatforms = useCallback((fn: (prev: Set<string> | null) => Set<string> | null) => {
    setPlatformList(prev => {
      const next = fn(prev ? new Set(prev) : null);
      return next ? [...next] : null;
    });
  }, [setPlatformList]);

  const displayTechniques = useMemo(() => {
    let techs = showSubTechniques ? techniques : techniques.filter(t => !t.parentId);
    if (platforms && platforms.size > 0) techs = techs.filter(t => t.platforms.length === 0 || t.platforms.some(p => platforms.has(p)));
    return techs;
  }, [techniques, showSubTechniques, platforms]);
  const displaySet = useMemo(() => new Set(displayTechniques.map(t => t.id)), [displayTechniques]);
  const techPhase = useMemo(() => {
    const m: Record<string, number> = {};
    techniques.forEach(t => { m[t.id] = cfg.tacticPhase[t.tactic] ?? 99; });
    return m;
  }, [techniques, cfg]);

  // Modeled actors: groups (+ campaigns), sector filter, plus custom chains
  const candidateChains = useMemo(
    () => (dataset?.chains ?? []).filter(c => c.kind === 'group' || (includeCampaigns && c.kind === 'campaign')),
    [dataset, includeCampaigns],
  );
  const sectorCounts = useMemo(() => {
    const m: Record<string, number> = {};
    candidateChains.forEach(c => c.sectors.forEach(s => { m[s] = (m[s] || 0) + 1; }));
    return m;
  }, [candidateChains]);
  const effectiveSector = sector === 'all' || sectorCounts[sector] ? sector : 'all';
  const modeledChains: AttackChain[] = useMemo(() => [
    ...(effectiveSector === 'all' ? candidateChains : candidateChains.filter(c => c.sectors.includes(effectiveSector))),
    ...customChains.filter(c => c.path.some(t => techById.has(t))),
  ], [candidateChains, effectiveSector, customChains, techById]);

  // Measured detection from MITRE ATT&CK Evaluations (Enterprise only) replaces estimates where present
  const coverageKB = useMemo(() => (evals && cfg.id === 'enterprise' ? mergeEvalsIntoKb(cfg.coverageKB, evals) : cfg.coverageKB), [evals, cfg]);
  const env = useEnvironmentProfile(cfg, coverageKB, techniques, modeledChains);
  const effectiveEnvPreset = cfg.envPresets[envPreset] ? envPreset : 'default';
  const fwExposureOverrides = exposureOverrides[framework];
  const exposure = useMemo(() => {
    const merged = { ...(cfg.envPresets[effectiveEnvPreset]?.overrides ?? {}), ...(env.modelInputs.exposure ?? {}), ...(fwExposureOverrides ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [cfg, effectiveEnvPreset, env.modelInputs.exposure, fwExposureOverrides]);

  const gateIds = gatesByFw[framework] ?? cfg.defaultGates;
  const gates = useMemo(() => {
    const g = cfg.gateOptions.filter(o => gateIds.includes(o.id));
    return g.length > 0 ? g : cfg.gateOptions.filter(o => cfg.defaultGates.includes(o.id));
  }, [cfg, gateIds]);
  const costModel = useMemo(() => ({ orgSize, overrides: costOverrides }), [orgSize, costOverrides]);

  const rm = useRiskModel({
    dataset, vocabulary, chains: modeledChains, gates, includeSoftware, platforms, exposure,
    toolCoverage: env.modelInputs.toolCoverage, actorWeights: env.actorWeights,
    params, posture: defenses.posture, costModel, budget, previewPlan, displaySet,
  });
  const optimality = useOptimalityCheck(rm);

  const defenseIndex = useMemo(() => (rm.model ? nodeDefenses(rm.model, displaySet) : {}), [rm.model, displaySet]);
  const gateTactics = useMemo(() => new Set(gates.flatMap(g => g.tactics)), [gates]);
  const blindSpots = useMemo(
    () => findBlindSpots(displayTechniques, gateTactics, rm.metrics, defenseIndex, rm.shownPosture),
    [displayTechniques, gateTactics, rm.metrics, defenseIndex, rm.shownPosture],
  );

  // ─── Graph ────────────────────────────────────────────────────────────────

  const layoutResult = useMemo(() => layoutNodes(displayTechniques, cfg.tactics), [displayTechniques, cfg]);
  const positions = useMemo(
    () => (Object.keys(customPositions).length === 0 ? layoutResult.positions : { ...layoutResult.positions, ...customPositions }),
    [layoutResult.positions, customPositions],
  );
  const displayEdges = useMemo(() => buildCooccurrenceEdges(modeledChains, displaySet, techPhase, 300), [modeledChains, displaySet, techPhase]);

  const highlightedChains = useMemo(
    () => highlighted.map(h => ({ h, c: modeledChains.find(c => c.id === h.id) })).filter((x): x is { h: Highlight; c: AttackChain } => !!x.c),
    [highlighted, modeledChains],
  );
  const focused = highlightedChains[highlightedChains.length - 1];
  const highlightedIds = useMemo(() => [...highlightedChains].reverse().map(x => x.c.id), [highlightedChains]);
  const colorOf = useCallback((id: string) => highlighted.find(h => h.id === id)?.color, [highlighted]);

  const chainOverlays: ChainOverlay[] = useMemo(() => highlightedChains.map(({ h, c }) => ({
    id: c.id, name: c.name, colorIndex: h.color,
    nodes: new Set(chainByPhase(c, displaySet, techPhase).flat()),
    edges: chainFanEdges(c, displaySet, techPhase, id => rm.metrics[id]?.activity ?? 0),
  })), [highlightedChains, displaySet, techPhase, rm.metrics]);

  const gateMarkers: GateMarker[] | null = useMemo(() => {
    if (!focused || !rm.model || !rm.state) return null;
    const i = rm.model.actors.findIndex(a => a.chain.id === focused.c.id);
    if (i < 0) return null;
    return actorBreakdown(rm.model, rm.params, rm.state, i).map(g => ({
      label: g.label, value: g.value, tacticIds: cfg.gateOptions.find(o => o.id === g.gateId)?.tactics ?? [],
    }));
  }, [focused, rm.model, rm.state, rm.params, cfg]);

  const focus = useMemo(() => {
    if (!rm.model || !hoverDefense) return null;
    return {
      set: defenseFootprint(rm.model, displaySet, hoverDefense.preventIds, hoverDefense.detectIds),
      color: hoverDefense.preventIds.length > 0 ? ENCODING.prevention : ENCODING.detection,
    };
  }, [rm.model, hoverDefense, displaySet]);
  const hoverItem = useCallback((item: CatalogItem | null) => {
    setHoverDefense(item ? { preventIds: item.preventIds, detectIds: item.detectIds, label: item.name } : null);
  }, []);

  const blindSpotSet = useMemo(() => (sidebarPanel === 'gaps' ? new Set(blindSpots.map(b => b.techniqueId)) : null), [sidebarPanel, blindSpots]);

  const graphInteraction = useGraphInteraction({ displayTechniques });
  const {
    panelHeight, showBottomPanels, setShowBottomPanels,
    techSearchQuery, setTechSearchQuery,
    popoutGraph, setPopoutGraph,
    collapsedTactics, startDividerDrag, startDividerDragTouch, handleToggleCollapse, techSearchMatches,
  } = graphInteraction;

  const compare = useCompareMode({ framework, activeTechniques: techniques });
  const { compareMode, setCompareMode, compareLoading, otherFramework, otherFwConfig, compareLayout, compareAnalysis } = compare;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleHighlighted = useCallback((id: string) => {
    setHighlighted(prev => {
      if (prev.some(h => h.id === id)) return prev.filter(h => h.id !== id);
      const used = new Set(prev.map(h => h.color));
      const free = [...Array(MAX_HIGHLIGHTED_CHAINS).keys()].find(c => !used.has(c));
      return free === undefined ? [...prev.slice(1), { id, color: prev[0].color }] : [...prev, { id, color: free }];
    });
    setBottomTab("chains");
  }, [setHighlighted, setBottomTab]);

  const fullCostOf = useCallback((id: string) => (vocabulary ? fullCost(vocabulary, id, costModel) : 0), [vocabulary, costModel]);
  const setCost = useCallback((id: string, v: number) => setCostOverrides(prev => ({ ...prev, [id]: Math.round(v) })), [setCostOverrides]);

  const setExposure = useCallback((id: string, v: number | undefined) => {
    setExposureOverrides(prev => {
      const cur = { ...(prev[framework] ?? {}) };
      if (v === undefined) delete cur[id]; else cur[id] = v;
      return { ...prev, [framework]: cur };
    });
  }, [framework, setExposureOverrides]);

  const bestDefensesFor = useCallback((chainId: string) => {
    if (!dataset || !vocabulary) return [];
    const chain = modeledChains.find(c => c.id === chainId);
    if (!chain) return [];
    const m = compileModel({ dataset, vocabulary, chains: [chain], gates, includeSoftware, platforms, exposure, toolCoverage: env.modelInputs.toolCoverage });
    const st = evaluateModel(m, rm.params, defenses.posture);
    const byId = new Map(rm.catalog.map(c => [c.id, c]));
    return [...marginalValues(m, rm.params, st, rm.catalog)]
      .filter(([, d]) => d > 1e-4)
      .sort((a, b) => b[1] - a[1] || (byId.get(a[0])!.cost - byId.get(b[0])!.cost))
      .slice(0, 3)
      .map(([id, delta]) => ({ item: byId.get(id)!, delta }));
  }, [dataset, vocabulary, modeledChains, gates, includeSoftware, platforms, exposure, env.modelInputs.toolCoverage, rm.params, rm.catalog, defenses.posture]);

  const handleNodeDrag = useCallback((nodeId: string, dx: number, dy: number) => {
    setCustomPositions(prev => {
      const current = prev[nodeId] || layoutResult.positions[nodeId] || { x: 0, y: 0 };
      return { ...prev, [nodeId]: { x: current.x + dx, y: current.y + dy } };
    });
  }, [layoutResult.positions]);

  const handleNavigatorImport = useCallback((file: File) => {
    if (file.size > 25 * 1024 * 1024) { data.setUploadError("Navigator layer too large (max 25 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const layer = JSON.parse(String(reader.result)) as { techniques?: { techniqueID?: unknown; score?: unknown; enabled?: unknown }[] };
        if (!Array.isArray(layer.techniques) || typeof layer.techniques[0]?.techniqueID !== 'string') {
          data.setUploadError("Not a Navigator layer (missing techniques[].techniqueID)");
          return;
        }
        const scores: Record<string, number> = {};
        const blocked: string[] = [];
        for (const t of layer.techniques) {
          if (typeof t.techniqueID !== 'string' || !techById.has(t.techniqueID)) continue;
          if (typeof t.score === 'number') scores[t.techniqueID] = Math.max(0, Math.min(1, t.score / 100));
          if (t.enabled === false) blocked.push(t.techniqueID);
        }
        setExposureOverrides(prev => ({ ...prev, [framework]: { ...(prev[framework] ?? {}), ...scores } }));
        defenses.addBlocked(blocked);
        data.setUploadError(null);
      } catch (err: unknown) {
        data.setUploadError("Failed to parse Navigator layer: " + (err instanceof Error ? err.message : "invalid JSON"));
      }
    };
    reader.onerror = () => data.setUploadError("Failed to read Navigator file");
    reader.readAsText(file);
  }, [data, techById, framework, setExposureOverrides, defenses]);
  const navFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleShare = useCallback(() => {
    const url = shareUrl({
      framework, sector: effectiveSector, budget, orgSize, envPreset: effectiveEnvPreset,
      vocabulary: vocab, prevent: defenses.stored.prevent, detect: defenses.stored.detect, blocked: defenses.blocked,
      chains: highlighted.map(h => h.id), platforms: platformList ?? undefined,
      params: (Object.keys(DEFAULT_MODEL_PARAMS) as (keyof ModelParams)[]).some(k => params[k] !== DEFAULT_MODEL_PARAMS[k]) ? params : undefined,
      gates: gateIds.join() !== cfg.defaultGates.join() ? gateIds : undefined,
      includeSoftware, includeCampaigns,
    });
    const done = () => { setShareConfirm(true); setTimeout(() => setShareConfirm(false), 2000); };
    navigator.clipboard?.writeText(url).then(done, done);
  }, [framework, effectiveSector, budget, orgSize, effectiveEnvPreset, vocab, defenses.stored, defenses.blocked, highlighted, platformList, params, gateIds, cfg, includeSoftware, includeCampaigns]);

  const resetAll = useCallback(() => {
    if (!window.confirm("Reset everything — defenses, costs, budget, model settings and layout?")) return;
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith(STORAGE_PREFIX) || k.startsWith('attackBreaker') || k.startsWith('ab_')) localStorage.removeItem(k);
      }
    } catch { /* storage unavailable — nothing persisted to clear */ }
    window.location.reload();
  }, []);

  const toggleChainBuilder = useCallback(() => {
    if (chainBuilder.chainBuilderMode) chainBuilder.resetBuilder();
    else chainBuilder.setChainBuilderMode(true);
  }, [chainBuilder]);

  const exports = useExportHandlers({
    cfg, dataset, vocabulary, implementedBy, model: rm.model, state: rm.state, activity: rm.activity, params: rm.params,
    plan: rm.plan, frontier: rm.frontier, sensitivity: rm.sensitivity,
    posture: defenses.posture, budget, sector: effectiveSector, gates, includeSoftware, includeCampaigns,
    assessment: env.assessment,
  });

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "1") setBottomTab("chains");
      else if (k === "2") setBottomTab("hotspots");
      else if (k === "3") setBottomTab("detail");
      else if (k === "b") setShowBottomPanels(prev => !prev);
      else if (k === "h") setHeaderCollapsed(prev => !prev);
      else if (k === "escape") setSidebarPanel(null);
      else {
        const tab = SIDEBAR_TABS.find(t => t.key.toLowerCase() === k) ?? (k === "s" ? SIDEBAR_TABS.find(t => t.id === "defenses") : undefined);
        if (tab) setSidebarPanel(prev => (prev === tab.id ? null : tab.id));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setBottomTab, setShowBottomPanels, setHeaderCollapsed, setSidebarPanel]);

  // ─── Shared view props ─────────────────────────────────────────────────────

  const selectedTechData = selectedTech ? techById.get(selectedTech) : undefined;
  const reduction = rm.currentResidual > 0 ? 1 - rm.planResidual / rm.currentResidual : 0;

  const graphViewProps = {
    techniques: displayTechniques, edges: displayEdges, positions, metrics: rm.metrics,
    selectedTech, onSelectTech: setSelectedTech,
    chainOverlays, gateMarkers, focusSet: focus?.set ?? null, focusColor: focus?.color ?? ENCODING.prevention, blindSpots: blindSpotSet,
    viewHeight: layoutResult.viewHeight, viewWidth: layoutResult.viewWidth, phaseCenters: layoutResult.phaseCenters,
    onNodeDrag: handleNodeDrag, searchMatches: techSearchMatches,
    collapsedTactics, onToggleCollapse: handleToggleCollapse, isolateChain,
    chainBuilderMode: chainBuilder.chainBuilderMode, chainBuilderPath: chainBuilder.chainBuilderPath,
    onChainBuilderClick: chainBuilder.addTechToPath, tactics: cfg.tactics,
  };

  const chainsPanel = (stacked: boolean) => (
    <ChainsPanel rm={rm} chains={modeledChains} techById={techById}
      highlightedIds={highlightedIds} colorOf={colorOf} toggleHighlighted={toggleHighlighted}
      query={chainQuery} setQuery={setChainQuery} kindFilter={kindFilter} setKindFilter={setKindFilter}
      removeCustom={removeChain} onSelectTech={setSelectedTech} bestDefensesFor={bestDefensesFor}
      popout={!!popout.chains} onPopout={() => setPopout(p => ({ ...p, chains: true }))} stacked={stacked} />
  );
  const hotspotsPanel = (
    <HotspotsPanel cfg={cfg} rm={rm} displayTechniques={displayTechniques} defenses={defenseIndex} posture={rm.shownPosture}
      selectedTech={selectedTech} onSelectTech={setSelectedTech} toggleBlocked={defenses.toggleBlocked}
      popout={!!popout.hotspots} onPopout={() => setPopout(p => ({ ...p, hotspots: true }))} />
  );
  const detailPanel = dataset && (
    <DetailPanel cfg={cfg} dataset={dataset} rm={rm} posture={defenses.posture} tech={selectedTechData} platforms={platforms}
      exposure={selectedTech ? (exposure?.[selectedTech] ?? (selectedTechData?.parentId ? exposure?.[selectedTechData.parentId] : undefined) ?? 1) : 1}
      exposureOverridden={!!selectedTech && fwExposureOverrides?.[selectedTech] !== undefined} setExposure={setExposure}
      vocabulary={vocab} d3fend={d3fend} togglePrevent={defenses.togglePrevent} setDetect={defenses.setDetect} toggleBlocked={defenses.toggleBlocked}
      assessment={env.assessment} chains={modeledChains} colorOf={colorOf} toggleHighlighted={toggleHighlighted}
      onSelectTech={setSelectedTech} showSubTechniques={showSubTechniques}
      popout={!!popout.detail} onPopout={() => setPopout(p => ({ ...p, detail: true }))} />
  );
  const executive = (isPopout: boolean) => vocabulary && (
    <ExecutiveSummary rm={rm} vocabulary={vocabulary} posture={defenses.posture} budget={budget} onExportBoard={exports.exportBoardReport}
      popout={isPopout} onPopout={() => setPopout(p => ({ ...p, executive: true }))} />
  );

  const tabs: { id: BottomTab; label: string; shortcut: string; count: number | null; popped: boolean; content: React.ReactNode; title: string; w: number; h: number }[] = [
    { id: "chains", label: "Threat actors", shortcut: "1", count: modeledChains.length, popped: !!popout.chains, content: chainsPanel(false), title: "Threat actors", w: 900, h: 700 },
    { id: "hotspots", label: "Hotspots", shortcut: "2", count: null, popped: !!popout.hotspots, content: hotspotsPanel, title: "Hotspots", w: 900, h: 600 },
    { id: "detail", label: "Detail" + (selectedTechData ? ": " + selectedTechData.id : ""), shortcut: "3", count: null, popped: !!popout.detail, content: detailPanel, title: "Technique detail", w: 520, h: 760 },
  ];

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  const toolbarButton = {
    background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
    color: theme.colors.textSecondary, cursor: "pointer", padding: "2px 8px", fontSize: theme.fontSizes.body,
    fontFamily: "inherit", lineHeight: 1,
  } as const;

  return (
    <div style={{
      background: theme.colors.bg, color: theme.colors.textBody, height: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {headerCollapsed && (
        <div style={{
          display: "flex", alignItems: "center", gap: theme.spacing.lg, flexWrap: "wrap",
          padding: "6px 20px", background: theme.colors.bgPanel, borderBottom: "1px solid " + theme.colors.borderSubtle,
          flexShrink: 0, minHeight: "34px",
        }}>
          <button onClick={() => setHeaderCollapsed(false)} title="Expand toolbar (H)" style={toolbarButton}>{"▼"}</button>
          <span style={{ fontSize: theme.fontSizes.heading, fontWeight: 700, color: theme.colors.textPrimary, letterSpacing: "-0.5px" }}>AttackBreaker</span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textSecondary }}>{cfg.label} · v{cfg.attackVersion}</span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textBody }}>
            Residual risk <strong style={{ color: theme.colors.textPrimary }}>{fmtPct(rm.shownResidual)}</strong>{previewPlan && " (preview)"}
          </span>
          <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textBody }}>
            Plan <strong style={{ color: theme.colors.textPrimary }}>−{fmtPct(reduction)}</strong> for {fmtUsd(rm.plan?.totalCost ?? 0)}
          </span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.fontSizes.small, color: theme.colors.textBody, cursor: "pointer" }}>
            <input type="checkbox" checked={previewPlan} onChange={e => setPreviewPlan(e.target.checked)} /> Preview plan
          </label>
          <div style={{ display: "flex", gap: 2 }}>
            {SIDEBAR_TABS.map(t => (
              <button key={t.id} onClick={() => setSidebarPanel(sidebarPanel === t.id ? null : t.id)} aria-pressed={sidebarPanel === t.id} title={t.label + " (" + t.key + ")"}
                style={{
                  background: sidebarPanel === t.id ? t.color + "22" : "transparent", border: "1px solid " + (sidebarPanel === t.id ? t.color + "66" : "transparent"),
                  color: sidebarPanel === t.id ? theme.colors.textPrimary : theme.colors.textMuted, borderRadius: theme.radii.sm,
                  padding: "3px 8px", fontSize: theme.fontSizes.small, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>{t.label}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowHelpGuide(true)} title="Help / Guide" style={toolbarButton}>?</button>
          <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>H toolbar · B panels · 1/2/3 tabs · P D M G X panels</span>
        </div>
      )}

      {!headerCollapsed && (
        <>
          <Header framework={framework} setFramework={changeFramework} cfg={cfg}
            bundledLabel={"MITRE ATT&CK v" + cfg.attackVersion + " (bundled)"}
            uploadedFileName={data.uploadedFileName} uploadActive={data.uploadActive} setUseUpload={data.setUseUpload}
            fileInputRef={data.fileInputRef} navFileInputRef={navFileInputRef}
            onUpload={data.handleUpload} onNavigatorImport={handleNavigatorImport}
            loadError={data.loadError} uploadError={data.uploadError} autoDetectedFw={data.autoDetectedFw}
            envPreset={effectiveEnvPreset} setEnvPreset={setEnvPreset}
            selectedPlatforms={platforms} setSelectedPlatforms={setSelectedPlatforms}
            sector={effectiveSector} setSector={setSector} sectorCounts={sectorCounts}
            techSearchQuery={techSearchQuery} setTechSearchQuery={setTechSearchQuery}
            techniqueCount={displayTechniques.length} actorCount={modeledChains.length} />
          <StatsBar
            shownResidual={rm.shownResidual} currentResidual={rm.currentResidual} planResidual={rm.planResidual}
            planCost={rm.plan?.totalCost ?? 0} budget={budget} actorCount={rm.model?.actors.length ?? 0}
            previewPlan={previewPlan} setPreviewPlan={setPreviewPlan}
            sidebarPanel={sidebarPanel} setSidebarPanel={setSidebarPanel}
            hasSubTechniques={cfg.hasSubTechniques} showSubTechniques={showSubTechniques} setShowSubTechniques={setShowSubTechniques}
            showBottomPanels={showBottomPanels} setShowBottomPanels={setShowBottomPanels}
            highlightedCount={highlighted.length} isolateChain={isolateChain} setIsolateChain={setIsolateChain}
            hasCustomPositions={Object.keys(customPositions).length > 0} resetPositions={() => setCustomPositions({})}
            hasProfile={!!env.environmentProfile} openProfileWizard={() => env.setShowProfileWizard(true)}
            compareMode={compareMode} setCompareMode={setCompareMode}
            chainBuilderMode={chainBuilder.chainBuilderMode} toggleChainBuilder={toggleChainBuilder}
            exportCSV={exports.exportCSV} openNavImport={() => navFileInputRef.current?.click()}
            exportNavigatorLayer={exports.exportNavigatorLayer} exportPlanCSV={exports.exportPlanCSV} exportBoardReport={exports.exportBoardReport}
            handleShare={handleShare} shareConfirm={shareConfirm} resetAll={resetAll} onShowHelp={() => setShowHelpGuide(true)} />
          <div style={{ display: "flex", justifyContent: "center", background: theme.colors.bgPanel, borderBottom: "1px solid " + theme.colors.borderSubtle, flexShrink: 0 }}>
            <button onClick={() => setHeaderCollapsed(true)} title="Collapse toolbar (H)" style={{
              background: "transparent", border: "none", color: theme.colors.textMuted, cursor: "pointer",
              padding: "2px 14px", fontSize: theme.fontSizes.small, fontFamily: "inherit", lineHeight: "18px",
            }}>{"▲"} collapse toolbar {"▲"}</button>
          </div>
        </>
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Split container: graph + bottom panels */}
        <div id="split-container" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, position: "relative", minHeight: 0, padding: "8px 16px" }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith('.json')) data.handleUpload(f); }}
          >
            {popoutGraph ? (
              <PopoutPlaceholder label="Graph" onRestore={() => setPopoutGraph(false)} />
            ) : compareMode ? (
              <div style={{ display: "flex", width: "100%", height: "100%", gap: "2px" }}>
                <div style={{ flex: 1, position: "relative", borderRight: "2px solid " + theme.colors.borderSubtle }}>
                  <div style={{ position: "absolute", top: 6, left: 10, zIndex: 10, padding: "4px 10px", background: theme.colors.bgSurface, color: theme.colors.textBody, borderRadius: theme.radii.sm, fontSize: theme.fontSizes.small, fontWeight: 700 }}>
                    {cfg.label} (active)
                  </div>
                  <GraphView {...graphViewProps} />
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <div style={{ position: "absolute", top: 6, left: 10, zIndex: 10, padding: "4px 10px", background: theme.colors.bgSurface, color: theme.colors.textBody, borderRadius: theme.radii.sm, fontSize: theme.fontSizes.small, fontWeight: 700 }}>
                    {otherFwConfig.label} (read-only, size = actor count)
                  </div>
                  {compareLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: theme.colors.textMuted, fontSize: theme.fontSizes.body }}>
                      <span style={{ animation: "stix-pulse 1.5s ease-in-out infinite" }}>Loading {otherFwConfig.label} data…</span>
                    </div>
                  ) : compareLayout ? (
                    <GraphView
                      techniques={compareLayout.techniques} edges={compareLayout.edges} positions={compareLayout.positions} metrics={compareLayout.metrics}
                      selectedTech={null} onSelectTech={() => {}} chainOverlays={[]} gateMarkers={null} focusSet={null} focusColor={ENCODING.prevention} blindSpots={null}
                      viewHeight={compareLayout.viewHeight} viewWidth={compareLayout.viewWidth} phaseCenters={compareLayout.phaseCenters}
                      onNodeDrag={() => {}} searchMatches={null} collapsedTactics={new Set()} onToggleCollapse={() => {}}
                      isolateChain={false} chainBuilderMode={false} chainBuilderPath={[]} onChainBuilderClick={() => {}}
                      tactics={otherFwConfig.tactics} />
                  ) : null}
                </div>
              </div>
            ) : (
              <GraphView {...graphViewProps} onPopout={() => setPopoutGraph(true)} />
            )}
            {popoutGraph && (
              <PopoutPanel title="ATT&CK Graph" width={1400} height={900} onClose={() => setPopoutGraph(false)} graphMode>
                <div style={{ width: "100%", height: "100vh" }}>
                  <GraphView {...graphViewProps} />
                </div>
              </PopoutPanel>
            )}
            {chainBuilder.chainBuilderMode && (
              <div style={{
                position: "absolute", top: 10, left: 16, right: 16,
                background: "#1e293bee", border: "1px solid " + theme.colors.purple, borderRadius: theme.radii.md,
                padding: "12px 16px", zIndex: 15, display: "flex", alignItems: "center", gap: theme.spacing.lg, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: theme.fontSizes.base, color: theme.colors.textPrimary, fontWeight: 700 }}>CHAIN BUILDER</span>
                <div style={{ flex: 1, display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
                  {chainBuilder.chainBuilderPath.length === 0 ? (
                    <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textMuted }}>Click techniques to build a custom actor's technique set…</span>
                  ) : chainBuilder.chainBuilderPath.map((tid, i) => (
                    <React.Fragment key={tid}>
                      {i > 0 && <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.purple }}>{"→"}</span>}
                      <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, background: "#a855f720", padding: "3px 7px", borderRadius: theme.radii.sm, fontFamily: '"JetBrains Mono", monospace' }}>{tid}</span>
                    </React.Fragment>
                  ))}
                </div>
                <input type="text" value={chainBuilder.chainBuilderName} onChange={e => chainBuilder.setChainBuilderName(e.target.value)}
                  placeholder="Chain name…" aria-label="Custom chain name" style={{ ...theme.inputBase, padding: "5px 10px", width: "140px" }} />
                <button onClick={chainBuilder.undoStep} disabled={chainBuilder.chainBuilderPath.length === 0}
                  style={{ ...theme.buttonBase, background: "transparent", color: theme.colors.textMuted, border: "1px solid " + theme.colors.border, opacity: chainBuilder.chainBuilderPath.length === 0 ? 0.3 : 1 }}>UNDO</button>
                <button onClick={chainBuilder.clearPath} style={{ ...theme.buttonBase, background: "transparent", color: theme.colors.textMuted, border: "1px solid " + theme.colors.border }}>CLEAR</button>
                <button onClick={chainBuilder.saveChain} disabled={chainBuilder.chainBuilderPath.length < 2}
                  style={{ ...theme.buttonBase, background: chainBuilder.chainBuilderPath.length < 2 ? theme.colors.border : theme.colors.purple, color: "#fff", border: "none" }}>SAVE</button>
              </div>
            )}
            {(data.loading || (!dataset && data.loadError)) && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,26,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
                <div style={{ textAlign: "center", color: theme.colors.textBody }}>
                  {data.loadError ? (
                    <>
                      <div style={{ fontSize: theme.fontSizes.stat, marginBottom: theme.spacing.md }}>{"⚠"} Could not load ATT&CK data</div>
                      <div style={{ fontSize: theme.fontSizes.base, color: theme.colors.textMuted }}>{data.loadError}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: theme.fontSizes.stat, animation: "stix-pulse 1.5s ease-in-out infinite" }}>Loading ATT&CK v{cfg.attackVersion}…</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ flexShrink: 0, background: theme.colors.bg, borderTop: "1px solid " + theme.colors.borderSubtle }}>
            <div style={{ display: "flex", gap: theme.spacing.xl, padding: "6px 24px 3px", flexWrap: "wrap", alignItems: "center", fontSize: theme.fontSizes.small, color: theme.colors.textSecondary }}>
              <span style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Legend</span>
              <span><svg width="18" height="12" aria-hidden><path d="M3 9 A5 5 0 1 1 13 5" fill="none" stroke={ENCODING.success} strokeWidth={2} /></svg> residual success (arc length)</span>
              <span><svg width="18" height="12" aria-hidden><path d="M2 10 A7 7 0 1 1 15 4" fill="none" stroke={ENCODING.detection} strokeWidth={1.5} /></svg> detection coverage</span>
              <span><svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="3.5" fill={ENCODING.prevention} /></svg> mitigation in place</span>
              <span>size = share of residual attacker activity · number = actors using it</span>
              {focus && hoverDefense && <span><svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="5.5" fill="none" stroke={focus.color} strokeDasharray="3,2" /></svg> touched by {hoverDefense.label}</span>}
              {blindSpotSet && <span><svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="5.5" fill="none" stroke="#d03b3b" strokeDasharray="2,3" /></svg> blind spot</span>}
              {gateMarkers && <span>{"✂"} cut · {"◐"} narrowed · {"○"} open = stage status for {focused?.c.name}</span>}
            </div>
            <div style={{ display: "flex", gap: theme.spacing.sm, padding: "3px 24px 6px", flexWrap: "wrap", alignItems: "center" }}>
              {cfg.tactics.map((tac, i) => {
                const isNewPhase = i > 0 && tac.phase !== cfg.tactics[i - 1].phase;
                return (
                  <React.Fragment key={tac.id}>
                    {i > 0 && <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textFaint, margin: "0 2px" }}>{isNewPhase ? "→" : "·"}</span>}
                    <span style={{ fontSize: theme.fontSizes.small, color: theme.colors.textBody, padding: "2px 8px", background: tac.color + "26", borderRadius: theme.radii.sm, whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, background: tac.color, marginRight: 5 }} />{tac.name}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Bottom panels */}
          {showBottomPanels && (
            <div style={{
              height: panelHeight, flexShrink: 0,
              display: "flex", flexDirection: "column", background: theme.colors.bg, borderTop: "1px solid " + theme.colors.borderSubtle,
            }}>
              <div onMouseDown={startDividerDrag} onTouchStart={startDividerDragTouch}
                style={{ height: 16, flexShrink: 0, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none" }}>
                <div style={{ width: 48, height: 4, background: theme.colors.textFaint, borderRadius: 2 }} />
              </div>
              <div role="tablist" style={{ display: "flex", flexShrink: 0, borderBottom: "1px solid " + theme.colors.borderSubtle, background: theme.colors.bgPanel, padding: "0 12px" }}>
                {tabs.map(tab => (
                  <button key={tab.id} role="tab" aria-selected={bottomTab === tab.id} onClick={() => setBottomTab(tab.id)} style={{
                    background: bottomTab === tab.id ? theme.colors.bgCard : "transparent", border: "none",
                    borderBottom: bottomTab === tab.id ? "2px solid " + theme.colors.textSecondary : "2px solid transparent",
                    color: bottomTab === tab.id ? theme.colors.textPrimary : theme.colors.textMuted,
                    padding: "8px 18px", fontSize: theme.fontSizes.base, fontWeight: bottomTab === tab.id ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {tab.label}
                    <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint }}>{tab.shortcut}</span>
                    {tab.count !== null && <span style={{ fontSize: theme.fontSizes.tiny, background: theme.colors.bgSurface, color: theme.colors.textSecondary, padding: "1px 7px", borderRadius: theme.radii.pill, fontWeight: 600 }}>{tab.count}</span>}
                    {tab.popped && <span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint }}>⧉</span>}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                {tabs.filter(t => t.id === bottomTab).map(tab => (
                  <div key={tab.id} style={{ padding: tab.popped ? 0 : "12px 20px", height: "100%" }}>
                    {tab.popped ? (
                      <>
                        <PopoutPlaceholder label={tab.title} onRestore={() => setPopout(p => ({ ...p, [tab.id]: false }))} />
                        <PopoutPanel title={tab.title} width={tab.w} height={tab.h} onClose={() => setPopout(p => ({ ...p, [tab.id]: false }))}>
                          {tab.id === 'chains' ? chainsPanel(true) : tab.content}
                        </PopoutPanel>
                      </>
                    ) : tab.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Docked sidebar */}
        {sidebarPanel && (
          <aside className="ab-sidebar" aria-label={SIDEBAR_TABS.find(t => t.id === sidebarPanel)?.label} style={{
            display: "flex", flexDirection: "column", background: theme.colors.bgPanel, borderLeft: "1px solid " + theme.colors.border,
          }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid " + theme.colors.borderSubtle, background: theme.colors.bgCard, flexShrink: 0, gap: 2, flexWrap: "wrap" }}>
              {SIDEBAR_TABS.map(tab => (
                <button key={tab.id} onClick={() => setSidebarPanel(tab.id)} aria-pressed={sidebarPanel === tab.id} style={{
                  background: sidebarPanel === tab.id ? tab.color + "18" : "transparent", border: "none",
                  borderBottom: sidebarPanel === tab.id ? "2px solid " + tab.color : "2px solid transparent",
                  color: sidebarPanel === tab.id ? theme.colors.textPrimary : theme.colors.textMuted,
                  padding: "6px 10px", fontSize: theme.fontSizes.small, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {tab.label}<span style={{ fontSize: theme.fontSizes.micro, color: theme.colors.textFaint, marginLeft: 4 }}>{tab.key}</span>
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={() => setSidebarPanel(null)} title="Close (Esc)" aria-label="Close panel" style={{
                background: "transparent", border: "1px solid " + theme.colors.border, borderRadius: theme.radii.sm,
                color: theme.colors.textMuted, cursor: "pointer", padding: "3px 9px", fontSize: theme.fontSizes.base, fontFamily: "inherit",
              }}>{"✕"}</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }} onMouseLeave={() => setHoverDefense(null)}>
              {!dataset || !vocabulary ? <div style={{ color: theme.colors.textMuted }}>Loading…</div> : (
                <>
                  {sidebarPanel === "plan" && (
                    <PlanPanel rm={rm} budget={budget} setBudget={setBudget} orgSize={orgSize} setOrgSize={setOrgSize}
                      postureEmpty={defenses.posture.prevent.size === 0 && defenses.posture.detect.size === 0 && !env.environmentProfile}
                      vocabulary={vocab} setVocabulary={setVocab} implementedBy={implementedBy}
                      onOpenDefenses={() => setSidebarPanel("defenses")}
                      fullCostOf={fullCostOf} onSetCost={setCost} hasCostOverrides={Object.keys(costOverrides).length > 0} onResetCosts={() => setCostOverrides({})}
                      previewPlan={previewPlan} setPreviewPlan={setPreviewPlan}
                      onMarkInPlace={items => { defenses.addItems(items); setHoverDefense(null); }} onHoverItem={hoverItem}
                      onExportPlan={exports.exportPlanCSV} onExportBoard={exports.exportBoardReport} onOpenModel={() => setSidebarPanel("model")}
                      optimality={optimality} />
                  )}
                  {sidebarPanel === "defenses" && (
                    <DefensesPanel cfg={cfg} vocabulary={vocabulary!} setVocabulary={setVocab} d3fend={d3fend} rm={rm} posture={defenses.posture}
                      togglePrevent={defenses.togglePrevent} setDetect={defenses.setDetect} toggleBlocked={defenses.toggleBlocked}
                      applyPreset={defenses.applyPreset} importFromAttack={defenses.importFromAttack} attackPostureSize={defenses.attackPostureSize}
                      clearPosture={defenses.clear} techName={id => techById.get(id)?.name ?? id}
                      fullCostOf={fullCostOf} onSetCost={setCost} onHoverDefense={setHoverDefense} onSelectTech={setSelectedTech} />
                  )}
                  {sidebarPanel === "model" && (
                    <ModelPanel cfg={cfg} rm={rm} params={params} setParams={setParams}
                      gates={gates.map(g => g.id)} setGates={g => setGatesByFw(prev => ({ ...prev, [framework]: g }))}
                      includeSoftware={includeSoftware} setIncludeSoftware={setIncludeSoftware}
                      includeCampaigns={includeCampaigns} setIncludeCampaigns={setIncludeCampaigns}
                      compareAnalysis={compareAnalysis} otherFramework={otherFramework} />
                  )}
                  {sidebarPanel === "gaps" && (
                    <BlindSpotsPanel cfg={cfg} rm={rm} blindSpots={blindSpots} techById={techById} vocabulary={vocabulary!} onSelectTech={setSelectedTech} />
                  )}
                  {sidebarPanel === "executive" && executive(false)}
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {popout.executive && (
        <PopoutPanel title="Executive Summary" width={640} height={820} onClose={() => setPopout(p => ({ ...p, executive: false }))}>
          {executive(true)}
        </PopoutPanel>
      )}

      {env.exposureSummary && env.environmentProfile && (
        <ExposureSummaryPanel exposureSummary={env.exposureSummary} environmentProfile={env.environmentProfile}
          onEdit={() => env.setShowProfileWizard(true)} onExport={exports.exportCoverageCSV} onClear={() => env.setEnvironmentProfile(null)} />
      )}

      {env.showProfileWizard && (
        <ProfileWizard
          coverageKB={coverageKB}
          activeChains={candidateChains}
          currentProfile={env.environmentProfile}
          onApply={profile => { env.setEnvironmentProfile(profile); env.setShowProfileWizard(false); }}
          onClose={() => env.setShowProfileWizard(false)}
        />
      )}

      {showHelpGuide && <HelpGuide onClose={() => setShowHelpGuide(false)} />}
    </div>
  );
}
