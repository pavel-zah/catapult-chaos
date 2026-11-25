import type { Vector } from 'matter-js';
import type { GameBody } from '../entities/types';
import type { GameState } from '../gameplay/GameStateMachine';

export interface GameEvents {
  'physics:collision-start': { a: GameBody; b: GameBody; impulse: number };
  'physics:collision-end': { a: GameBody; b: GameBody };
  'cat:launched': { body: GameBody; catType: string };
  'cat:ability': { body: GameBody; catType: string };
  'block:damaged': { body: GameBody; amount: number };
  'block:destroyed': { body: GameBody; position: Vector; score: number };
  'target:destroyed': { body: GameBody; position: Vector; score: number };
  'treasure:destroyed': { body: GameBody };
  'tnt:exploded': { position: Vector; radius: number };
  'gadget:goal': { gadgetId: string; targetId: string };
  'gadget:bonus': { gadgetId: string; position: Vector };
  'game:score-popup': { position: Vector; text: string; color?: string };
  'game:hitstop': { durationMs: number };
  'game:state': { state: GameState; previous: GameState };
  'audio:play': { sound: SoundName; intensity?: number };
}

export type SoundName =
  | 'stretch'
  | 'launch'
  | 'ability'
  | 'glass'
  | 'wood'
  | 'stone'
  | 'explosion'
  | 'boing'
  | 'portal'
  | 'collect'
  | 'win'
  | 'lose'
  | 'click';

type Listener<T> = (payload: T) => void;

/** Small typed pub/sub bus: gameplay systems never need direct DOM access. */
export class EventBus {
  private listeners = new Map<keyof GameEvents, Set<Listener<never>>>();

  on<K extends keyof GameEvents>(event: K, listener: Listener<GameEvents[K]>): () => void {
    let group = this.listeners.get(event);
    if (!group) {
      group = new Set();
      this.listeners.set(event, group);
    }
    group.add(listener as Listener<never>);
    return () => group?.delete(listener as Listener<never>);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const group = this.listeners.get(event);
    if (!group) return;
    for (const listener of [...group]) {
      (listener as Listener<GameEvents[K]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
