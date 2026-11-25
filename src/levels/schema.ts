export type LevelGoalConfig =
  | { type: 'destroy_targets'; targetIds?: string[] }
  | { type: 'deliver_to_zone'; targetId: string; zoneId: string }
  | { type: 'bonus_fish'; gadgetId: string };

export interface BlockSpawnConfig {
  id: string;
  type: 'glass' | 'wood' | 'stone' | 'tnt' | 'static';
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
}

export interface TargetSpawnConfig {
  id: string;
  type: 'vacuum' | 'treasure_box';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
}

export interface GadgetSpawnConfig {
  id: string;
  type: 'trampoline' | 'portal' | 'goal_zone' | 'bonus_fish';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;
  pairId?: string;
  targetId?: string;
}

export interface LevelData {
  id: string;
  name: string;
  description?: string;
  worldBounds: { width: number; height: number };
  slingshot: { x: number; y: number };
  queue: string[];
  starThresholds: { twoStars: number; threeStars: number };
  modifiers?: { gravityScale?: number };
  goals: LevelGoalConfig[];
  blocks: BlockSpawnConfig[];
  targets: TargetSpawnConfig[];
  gadgets: GadgetSpawnConfig[];
}
