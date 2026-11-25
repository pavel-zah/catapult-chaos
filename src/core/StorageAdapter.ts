export interface LevelProgress {
  stars: number;
  bestScore: number;
  bonusFish: boolean;
}

export interface GameProgress {
  version: 1;
  levels: Record<string, LevelProgress>;
  unlockedCats: string[];
}

export const EMPTY_PROGRESS: GameProgress = {
  version: 1,
  levels: {},
  unlockedCats: ['classic', 'anvil', 'bouncy', 'splitter', 'magnet'],
};

/** Replace this adapter with a Yandex Games SDK implementation without touching gameplay. */
export interface IStorageAdapter {
  load(): Promise<GameProgress>;
  save(progress: GameProgress): Promise<void>;
}

export class LocalStorageAdapter implements IStorageAdapter {
  constructor(private readonly key = 'catapult-chaos-progress-v1') {}

  async load(): Promise<GameProgress> {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return structuredClone(EMPTY_PROGRESS);
      const parsed = JSON.parse(raw) as Partial<GameProgress>;
      return {
        version: 1,
        levels: parsed.levels ?? {},
        unlockedCats: parsed.unlockedCats ?? [...EMPTY_PROGRESS.unlockedCats],
      };
    } catch {
      return structuredClone(EMPTY_PROGRESS);
    }
  }

  async save(progress: GameProgress): Promise<void> {
    try {
      localStorage.setItem(this.key, JSON.stringify(progress));
    } catch {
      // Private browsing or storage quotas must never interrupt a level.
    }
  }
}
