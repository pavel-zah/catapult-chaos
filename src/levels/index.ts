import type { GameProgress } from '../core/StorageAdapter';
import type { LevelData } from './schema';
import { level01 } from './level01';
import { level02 } from './level02';
import { level03 } from './level03';
import { level04 } from './level04';
import { sandboxGadgets } from './sandboxGadgets';

export const LEVELS: LevelData[] = [level01, level02, level03, level04];
export const SANDBOX_LEVEL = sandboxGadgets;

export function getLevel(id: string): LevelData | undefined {
  if (id === SANDBOX_LEVEL.id) return SANDBOX_LEVEL;
  return LEVELS.find((level) => level.id === id);
}

export function getNextLevel(id: string): LevelData | undefined {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}

/** Кампания идёт цепочкой: следующий уровень открыт, только если в предыдущем есть хотя бы одна звезда. */
export function isLevelUnlocked(levels: LevelData[], progress: GameProgress, levelId: string): boolean {
  const index = levels.findIndex((level) => level.id === levelId);
  if (index <= 0) return true;
  return (progress.levels[levels[index - 1].id]?.stars ?? 0) > 0;
}
