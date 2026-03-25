// ─── useExportHandlers — CSV, Navigator layer, remediation plan, coverage exports ──

import { useCallback } from 'react';
import { sanitizeCSVCell } from '../engine/graphModel';

interface UseExportHandlersArgs {
  displayTechniques: any[];
  effectiveExposures: Record<string, number>;
  betweenness: Record<string, number>;
  chainCoverage: Record<string, number>;
  filteredChains: any[];
  remediated: Set<string>;
  optimal: { selected: string[]; chainsDisrupted: number; chainsTotal: number };
  chainStatus: any[];
  fwConfig: any;
  deployedControls: Set<string>;
  profileExposures: Record<string, any> | null;
  gapAnalysis: { gaps: any[]; noCoverageCount: number; notDeployedCount: number };
  exposures: Record<string, number>;
  activeTechniques: any[];
  phaseWeighting: boolean;
}

export function useExportHandlers({
  displayTechniques, effectiveExposures, betweenness, chainCoverage,
  filteredChains, remediated, optimal, chainStatus, fwConfig,
  deployedControls, profileExposures, gapAnalysis,
}: UseExportHandlersArgs) {

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

  return { exportCSV, exportNavigatorLayer, exportRemediationPlan, exportCoverageCSV };
}
