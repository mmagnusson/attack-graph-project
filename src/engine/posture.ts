// ─── Posture helpers shared by the optimizer and exact search ────────────────

import type { CatalogItem, DefensePosture } from '../types';

export const additionOf = (item: CatalogItem) => ({ prevent: item.preventIds, detect: item.detectIds });

export function withItems(posture: DefensePosture, items: CatalogItem[]): DefensePosture {
  const prevent = new Set(posture.prevent);
  const detect = new Set(posture.detect);
  for (const it of items) {
    it.preventIds.forEach(m => prevent.add(m));
    it.detectIds.forEach(d => detect.add(d));
  }
  return { prevent, detect, blocked: posture.blocked };
}
