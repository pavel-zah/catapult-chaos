import type { Body, Vector } from 'matter-js';
import type { EventBus } from '../core/EventBus';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { ChannelSystem } from '../gameplay/ChannelSystem';

export type EntityKind = 'cat' | 'block' | 'target' | 'treasure' | 'gadget' | 'boundary';
export type CatEmotion = 'idle' | 'aiming' | 'flying' | 'ability' | 'hit';

export interface BodyMetadata {
  entityId: string;
  kind: EntityKind;
  typeId: string;
  hp: number;
  maxHp: number;
  damageThreshold: number;
  destroyed: boolean;
  bornAt: number;
  width?: number;
  height?: number;
}

export type GameBody = Body & { game: BodyMetadata };

export interface CatEntity {
  body: GameBody;
  typeId: string;
  emotion: CatEmotion;
  emotionUntil: number;
  abilityUsed: boolean;
  abilityEndsAt: number;
  abilityFinished: boolean;
  hasCollided: boolean;
  isKitten: boolean;
}

export interface CatAbilityContext {
  cat: CatEntity;
  now: number;
  physics: PhysicsWorld;
  events: EventBus;
  schedule: (delayMs: number, callback: () => void) => void;
  spawnSplitCats: (body: GameBody, count: number) => void;
  setAbilityDuration: (durationMs: number) => void;
}

export interface CatDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  abilityName: string;
  abilityHint: string;
  color: string;
  accent: string;
  radius: number;
  mass: number;
  restitution: number;
  friction: number;
  allowAbilityAfterCollision: boolean;
  onAbilityActivate?: (ctx: CatAbilityContext) => void;
  onAbilityUpdate?: (ctx: CatAbilityContext, dtMs: number) => void;
  onAbilityEnd?: (ctx: CatAbilityContext) => void;
}

export interface ExplosionDefinition {
  radius: number;
  impulse: number;
  baseDamage: number;
  minDamage: number;
  chainDelaysMs: readonly number[];
}

export interface BlockDefinition {
  id: string;
  name: string;
  density: number;
  hp: number;
  damageThreshold: number;
  restitution: number;
  friction: number;
  color: string;
  stroke: string;
  particleColor: string;
  score: number;
  isStatic?: boolean;
  explosion?: ExplosionDefinition;
}

export interface GadgetRenderContext {
  ctx: CanvasRenderingContext2D;
  now: number;
}

export interface GadgetInstance {
  id: string;
  type: string;
  bodies: GameBody[];
  update?: (dtMs: number, now: number) => void;
  render?: (context: GadgetRenderContext) => void;
  onCollisionStart?: (other: GameBody, now: number, impulse: number) => void;
  onCollisionEnd?: (other: GameBody, now: number) => void;
  onLaserHit?: (now: number) => void;
}

export interface GadgetFactoryContext {
  physics: PhysicsWorld;
  events: EventBus;
  channels: ChannelSystem;
  getGadget: (id: string) => GadgetInstance | undefined;
  getBody: (entityId: string) => GameBody | undefined;
}

export interface ScheduledAction {
  dueAt: number;
  callback: () => void;
}

export function attachMetadata(
  body: Body,
  metadata: Omit<BodyMetadata, 'destroyed'> & { destroyed?: boolean },
): GameBody {
  const gameBody = body as GameBody;
  gameBody.game = { ...metadata, destroyed: metadata.destroyed ?? false };
  return gameBody;
}

export function isGameBody(body: Body): body is GameBody {
  return 'game' in body;
}

export function bodyPosition(body: Body): Vector {
  return { x: body.position.x, y: body.position.y };
}
