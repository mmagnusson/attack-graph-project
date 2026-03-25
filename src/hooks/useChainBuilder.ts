// ─── useChainBuilder — custom attack chain builder state ─────────────────────

import { useState, useCallback } from 'react';

export function useChainBuilder() {
  const [chainBuilderMode, setChainBuilderMode] = useState(false);
  const [chainBuilderPath, setChainBuilderPath] = useState<string[]>([]);
  const [chainBuilderName, setChainBuilderName] = useState("");
  const [customChains, setCustomChains] = useState<any[]>(() => {
    try {
      const s = localStorage.getItem("attackBreaker_customChains");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const saveChain = useCallback(() => {
    if (chainBuilderPath.length < 2) return;
    const name = chainBuilderName.trim() || ("Custom Chain " + (customChains.length + 1));
    const newChain = {
      name, description: "Custom chain", sector: "all",
      path: [...chainBuilderPath], severity: 0.5, custom: true,
    };
    setCustomChains(prev => {
      const next = [...prev, newChain];
      try { localStorage.setItem("attackBreaker_customChains", JSON.stringify(next)); } catch {}
      return next;
    });
    setChainBuilderPath([]);
    setChainBuilderName("");
  }, [chainBuilderPath, chainBuilderName, customChains.length]);

  const addTechToPath = useCallback((techId: string) => {
    if (!chainBuilderPath.includes(techId)) {
      setChainBuilderPath(prev => [...prev, techId]);
    }
  }, [chainBuilderPath]);

  const undoStep = useCallback(() => {
    setChainBuilderPath(prev => prev.slice(0, -1));
  }, []);

  const clearPath = useCallback(() => {
    setChainBuilderPath([]);
  }, []);

  const resetBuilder = useCallback(() => {
    setChainBuilderMode(false);
    setChainBuilderPath([]);
    setChainBuilderName("");
  }, []);

  return {
    chainBuilderMode, setChainBuilderMode,
    chainBuilderPath, setChainBuilderPath,
    chainBuilderName, setChainBuilderName,
    customChains, setCustomChains,
    saveChain, addTechToPath, undoStep, clearPath, resetBuilder,
  };
}
