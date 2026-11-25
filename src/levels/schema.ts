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

interface GadgetBaseConfig {
  id: string;
  x: number;
  y: number;
}

interface ChannelReceiverConfig {
  channelId?: string;
  invertSignal?: boolean;
}

export interface TrampolineSpawnConfig extends GadgetBaseConfig {
  type: 'trampoline';
  width?: number;
  height?: number;
  angle?: number;
}

export interface PortalSpawnConfig extends GadgetBaseConfig {
  type: 'portal';
  pairId: string;
  width?: number;
  height?: number;
  angle?: number;
}

export interface GoalZoneSpawnConfig extends GadgetBaseConfig {
  type: 'goal_zone';
  targetId?: string;
  width?: number;
  height?: number;
  angle?: number;
}

export interface BonusFishSpawnConfig extends GadgetBaseConfig {
  type: 'bonus_fish';
  radius?: number;
}

export interface ButtonSpawnConfig extends GadgetBaseConfig {
  type: 'button';
  channelId: string;
  mode?: 'once' | 'toggle';
  impulseThreshold?: number;
  width?: number;
  height?: number;
}

export interface PressurePlateSpawnConfig extends GadgetBaseConfig {
  type: 'pressure_plate';
  channelId: string;
  minMass?: number;
  width?: number;
  height?: number;
}

export interface DoorSpawnConfig extends GadgetBaseConfig, ChannelReceiverConfig {
  type: 'door';
  width?: number;
  height?: number;
  angle?: number;
  openOffset?: { x: number; y: number };
  moveSpeed?: number;
}

export interface TrapdoorSpawnConfig extends GadgetBaseConfig, ChannelReceiverConfig {
  type: 'trapdoor';
  width?: number;
  height?: number;
  angle?: number;
  hinge?: 'left' | 'right';
  material?: 'wood' | 'metal';
}

export interface FanSpawnConfig extends GadgetBaseConfig, ChannelReceiverConfig {
  type: 'fan';
  width?: number;
  height?: number;
  angle?: number;
  strength?: number;
}

export interface GravityZoneSpawnConfig extends GadgetBaseConfig, ChannelReceiverConfig {
  type: 'gravity_zone';
  width?: number;
  height?: number;
  gravityScale?: number;
}

export interface SeesawSpawnConfig extends GadgetBaseConfig {
  type: 'seesaw';
  width?: number;
  height?: number;
  angle?: number;
  pivotOffset?: { x: number; y: number };
  maxTilt?: number;
}

export interface RopeSpawnConfig extends GadgetBaseConfig {
  type: 'rope';
  anchor: { x: number; y: number };
  targetBlockId?: string;
  cargo?: 'stone' | 'tnt' | 'treasure_box';
  cargoWidth?: number;
  cargoHeight?: number;
}

export interface LaserSpawnConfig extends GadgetBaseConfig, ChannelReceiverConfig {
  type: 'laser';
  angle?: number;
  maxLength?: number;
}

/** Discriminated union: each gadget exposes only its own configuration fields. */
export type GadgetSpawnConfig =
  | TrampolineSpawnConfig
  | PortalSpawnConfig
  | GoalZoneSpawnConfig
  | BonusFishSpawnConfig
  | ButtonSpawnConfig
  | PressurePlateSpawnConfig
  | DoorSpawnConfig
  | TrapdoorSpawnConfig
  | FanSpawnConfig
  | GravityZoneSpawnConfig
  | SeesawSpawnConfig
  | RopeSpawnConfig
  | LaserSpawnConfig;

export interface LevelData {
  id: string;
  name: string;
  description?: string;
  worldBounds: { width: number; height: number };
  slingshot: { x: number; y: number };
  queue: string[];
  starThresholds: { twoStars: number; threeStars: number };
  modifiers?: { gravityScale?: number };
  sandbox?: boolean;
  goals: LevelGoalConfig[];
  blocks: BlockSpawnConfig[];
  targets: TargetSpawnConfig[];
  gadgets: GadgetSpawnConfig[];
}
