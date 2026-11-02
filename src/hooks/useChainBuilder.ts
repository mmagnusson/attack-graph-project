// ─── useChainBuilder — custom attack chain builder state ─────────────────────

import { useState, useCallback } from 'react';
import type { AttackChain } from '../types';
import { readStored, writeStored } from './usePersistentState';

const STORAGE_KEY = "attackBreaker_customChains";

/** Accepts both the current shape and pre-v2 saved chains ({ name, path, custom: true, ... }) */
function migrate(raw: unknown): AttackChain[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is { name?: unknown; path?: unknown; id?: unknown } => !!c && typeof c === 'object')
    .filter(c => Array.isArray(c.path) && c.path.every(t => typeof t === 'string'))
    .map((c, i) => ({
      id: typeof c.id === 'string' ? c.id : 'custom-' + i,
      name: typeof c.name === 'string' ? c.name.slice(0, 80) : 'Custom Chain ' + (i + 1),
      kind: 'custom' as const,
      description: 'Custom chain',
      path: c.path as string[],
      viaSoftware: [],
      sectors: [],
      aliases: [],
    }));
}

export function useChainBuilder() {
  const [chainBuilderMode, setChainBuilderMode] = useState(false);
  const [chainBuilderPath, setChainBuilderPath] = useState<string[]>([]);
  const [chainBuilderName, setChainBuilderName] = useState("");
  const [customChains, setCustomChainsState] = useState<AttackChain[]>(() => migrate(readStored<unknown>(STORAGE_KEY, [])));

  const setCustomChains = useCallback((fn: (prev: AttackChain[]) => AttackChain[]) => {
    setCustomChainsState(prev => {
      const next = fn(prev);
      writeStored(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const saveChain = useCallback(() => {
    if (chainBuilderPath.length < 2) return;
    const name = chainBuilderName.trim() || ("Custom Chain " + (customChains.length + 1));
    const chain: AttackChain = {
      id: 'custom-' + Date.now().toString(36), name, kind: 'custom', description: 'Custom chain',
      path: [...chainBuilderPath], viaSoftware: [], sectors: [], aliases: [],
    };
    setCustomChains(prev => [...prev, chain]);
    setChainBuilderPath([]);
    setChainBuilderName("");
  }, [chainBuilderPath, chainBuilderName, customChains.length, setCustomChains]);

  const removeChain = useCallback((id: string) => setCustomChains(prev => prev.filter(c => c.id !== id)), [setCustomChains]);

  const addTechToPath = useCallback((techId: string) => {
    setChainBuilderPath(prev => (prev.includes(techId) ? prev : [...prev, techId]));
  }, []);

  const undoStep = useCallback(() => setChainBuilderPath(prev => prev.slice(0, -1)), []);
  const clearPath = useCallback(() => setChainBuilderPath([]), []);

  const resetBuilder = useCallback(() => {
    setChainBuilderMode(false);
    setChainBuilderPath([]);
    setChainBuilderName("");
  }, []);

  return {
    chainBuilderMode, setChainBuilderMode,
    chainBuilderPath, setChainBuilderPath,
    chainBuilderName, setChainBuilderName,
    customChains, removeChain,
    saveChain, addTechToPath, undoStep, clearPath, resetBuilder,
  };
}
