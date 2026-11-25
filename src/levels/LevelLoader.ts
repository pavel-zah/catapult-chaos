import Matter from 'matter-js';
import type { CatDefinition, GameBody, GadgetInstance } from '../entities/types';
import type { BlockRegistry } from '../entities/BlockRegistry';
import type { GadgetRegistry } from '../entities/GadgetRegistry';
import type { EventBus } from '../core/EventBus';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { ChannelSystem } from '../gameplay/ChannelSystem';
import { attachMetadata } from '../entities/types';
import type { LevelData } from './schema';

export interface LoadedLevel {
  blocks: GameBody[];
  targets: GameBody[];
  gadgets: Map<string, GadgetInstance>;
}

export function createCatBody(
  definition: CatDefinition,
  position: Matter.Vector,
  now: number,
  scale = 1,
): GameBody {
  const radius = definition.radius * scale;
  const body = attachMetadata(Matter.Bodies.circle(position.x, position.y, radius, {
    restitution: definition.restitution,
    friction: definition.friction,
    frictionAir: 0.008,
    density: 0.003,
    label: `cat:${definition.id}`,
  }), {
    entityId: `cat-${definition.id}-${Math.round(now)}-${Math.round(Math.random() * 100000)}`,
    kind: 'cat', typeId: definition.id, hp: Infinity, maxHp: Infinity,
    damageThreshold: Infinity, bornAt: now, width: radius * 2, height: radius * 2,
  });
  Matter.Body.setMass(body, definition.mass * scale * scale);
  return body;
}

export class LevelLoader {
  constructor(
    private readonly physics: PhysicsWorld,
    private readonly events: EventBus,
    private readonly blocks: BlockRegistry,
    private readonly gadgetRegistry: GadgetRegistry,
    private readonly channels: ChannelSystem,
  ) {}

  load(level: LevelData, now: number): LoadedLevel {
    this.physics.clear();
    this.channels.reset();
    this.physics.setGravity(level.modifiers?.gravityScale ?? 1);
    this.addBoundaries(level);

    const blockBodies = level.blocks.map((spawn) => {
      const definition = this.blocks.get(spawn.type);
      const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, spawn.width, spawn.height, {
        isStatic: definition.isStatic ?? false,
        angle: (spawn.angle ?? 0) * Math.PI / 180,
        density: definition.density,
        restitution: definition.restitution,
        friction: definition.friction,
        label: `block:${spawn.type}`,
      }), {
        entityId: spawn.id,
        kind: 'block',
        typeId: spawn.type,
        hp: definition.hp,
        maxHp: definition.hp,
        damageThreshold: definition.damageThreshold,
        bornAt: now,
        width: spawn.width,
        height: spawn.height,
      });
      this.physics.add(body);
      return body;
    });

    const targetBodies = level.targets.map((spawn) => {
      const isTreasure = spawn.type === 'treasure_box';
      const width = spawn.width ?? (isTreasure ? 96 : 76);
      const height = spawn.height ?? (isTreasure ? 78 : 76);
      const radius = spawn.radius ?? 38;
      const options: Matter.IChamferableBodyDefinition = {
        angle: (spawn.angle ?? 0) * Math.PI / 180,
        density: isTreasure ? 0.0035 : 0.0025,
        restitution: isTreasure ? 0.12 : 0.3,
        friction: 0.65,
        label: `target:${spawn.type}`,
      };
      const rawBody = isTreasure
        ? Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, options)
        : Matter.Bodies.circle(spawn.x, spawn.y, radius, options);
      const hp = isTreasure ? 120 : 34;
      const body = attachMetadata(rawBody, {
        entityId: spawn.id,
        kind: isTreasure ? 'treasure' : 'target',
        typeId: spawn.type,
        hp,
        maxHp: hp,
        damageThreshold: isTreasure ? 42 : 10,
        bornAt: now,
        width: isTreasure ? width : radius * 2,
        height: isTreasure ? height : radius * 2,
      });
      this.physics.add(body);
      return body;
    });

    const gadgets = new Map<string, GadgetInstance>();
    for (const spawn of level.gadgets) {
      const gadget = this.gadgetRegistry.create(spawn, {
        physics: this.physics,
        events: this.events,
        channels: this.channels,
        getGadget: (id) => gadgets.get(id),
        getBody: (entityId) => this.physics.bodies.find((body) => body.game.entityId === entityId),
      });
      gadgets.set(gadget.id, gadget);
    }

    return { blocks: blockBodies, targets: targetBodies, gadgets };
  }

  private addBoundaries(level: LevelData): void {
    const { width, height } = level.worldBounds;
    const definitions = [
      { x: width / 2, y: height + 70, width: width + 300, height: 140 },
      { x: -70, y: height / 2, width: 140, height: height + 400 },
      { x: width + 70, y: height / 2, width: 140, height: height + 400 },
      { x: width / 2, y: -100, width: width + 300, height: 140 },
    ];
    for (const definition of definitions) {
      const body = attachMetadata(Matter.Bodies.rectangle(
        definition.x, definition.y, definition.width, definition.height, { isStatic: true },
      ), {
        entityId: 'boundary', kind: 'boundary', typeId: 'static', hp: Infinity,
        maxHp: Infinity, damageThreshold: Infinity, bornAt: 0,
        width: definition.width, height: definition.height,
      });
      this.physics.add(body);
    }
  }
}
