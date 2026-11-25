import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata, type GameBody } from '../types';
import type { PhysicsWorld } from '../../physics/PhysicsWorld';
import { drawChannelIndicator } from './gadgetUtils';

const LASER = {
  emitterRadius: 24,
  maxLength: 1000,
  rayWidth: 3,
  beamWidth: 7,
  coreWidth: 2,
  sparkCount: 6,
} as const;

interface LaserHit {
  body: GameBody;
  position: Matter.Vector;
  distance: number;
}

/** Matter.Query.ray also exposes the hit body as `collision.body`, which the typings omit. */
type RayCollision = Matter.Collision & { body?: Matter.Body };

export const createLaser = defineGadgetFactory('laser', (spawn, { physics, events, channels }) => {
  const angle = (spawn.angle ?? 0) * Math.PI / 180;
  const maxLength = spawn.maxLength ?? LASER.maxLength;
  const origin = { x: spawn.x, y: spawn.y };
  const body = attachMetadata(Matter.Bodies.circle(spawn.x, spawn.y, LASER.emitterRadius, {
    isStatic: true,
    isSensor: true,
    label: 'gadget:laser',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'laser', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0,
    width: LASER.emitterRadius * 2, height: LASER.emitterRadius * 2,
  });
  physics.add(body);
  let enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal);
  let beamEnd = { ...origin };
  let hit: LaserHit | null = null;

  return {
    id: spawn.id,
    type: 'laser',
    bodies: [body],
    update: (_dtMs, now) => {
      enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal);
      if (!enabled) {
        hit = null;
        beamEnd = { ...origin };
        return;
      }
      hit = castLaser(physics, origin, angle, maxLength, spawn.id);
      beamEnd = hit?.position ?? {
        x: origin.x + Math.cos(angle) * maxLength,
        y: origin.y + Math.sin(angle) * maxLength,
      };
      if (hit) {
        events.emit('gadget:laser-hit', {
          gadgetId: spawn.id,
          body: hit.body,
          position: hit.position,
          now,
        });
      }
    },
    render: ({ ctx, now }) => {
      ctx.save();
      ctx.translate(origin.x, origin.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#2f3b50';
      ctx.strokeStyle = enabled ? '#fb7185' : '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-28, -21, 56, 42, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = enabled ? '#fff1f2' : '#475569';
      ctx.beginPath();
      ctx.arc(23, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (enabled) {
        const pulse = 0.82 + Math.sin(now * 0.018) * 0.18;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#fb315d';
        ctx.shadowColor = '#fb7185';
        ctx.shadowBlur = 20;
        ctx.lineWidth = LASER.beamWidth;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(beamEnd.x, beamEnd.y);
        ctx.stroke();
        ctx.strokeStyle = '#fff7f8';
        ctx.shadowBlur = 4;
        ctx.lineWidth = LASER.coreWidth;
        ctx.stroke();
        ctx.restore();
        if (hit) drawSparks(ctx, hit.position, now);
      }
      drawChannelIndicator(ctx, spawn.channelId, enabled, origin.x, origin.y - 42);
    },
  };
});

function castLaser(
  physics: PhysicsWorld,
  origin: Matter.Vector,
  angle: number,
  maxLength: number,
  emitterId: string,
): LaserHit | null {
  const end = {
    x: origin.x + Math.cos(angle) * maxLength,
    y: origin.y + Math.sin(angle) * maxLength,
  };
  const candidates = physics.bodies.filter((body) => {
    if (body.game.destroyed || body.game.entityId === emitterId) return false;
    if (body.game.kind === 'block' && body.game.typeId === 'glass') return false;
    return !body.isSensor || (body.game.kind === 'gadget' && body.game.typeId === 'rope');
  });
  const hitBodies = new Set<GameBody>(Matter.Query.ray(candidates, origin, end, LASER.rayWidth)
    .map((collision) => ((collision as RayCollision).body ?? collision.bodyA) as GameBody));
  let nearest: LaserHit | null = null;
  for (const body of hitBodies) {
    for (let index = 0; index < body.vertices.length; index += 1) {
      const a = body.vertices[index];
      const b = body.vertices[(index + 1) % body.vertices.length];
      const ratio = segmentIntersection(origin, end, a, b);
      if (ratio === null) continue;
      const distance = ratio * maxLength;
      if (nearest && distance >= nearest.distance) continue;
      nearest = {
        body,
        distance,
        position: {
          x: origin.x + (end.x - origin.x) * ratio,
          y: origin.y + (end.y - origin.y) * ratio,
        },
      };
    }
  }
  return nearest;
}

function segmentIntersection(
  start: Matter.Vector,
  end: Matter.Vector,
  a: Matter.Vector,
  b: Matter.Vector,
): number | null {
  const ray = Matter.Vector.sub(end, start);
  const edge = Matter.Vector.sub(b, a);
  const denominator = cross(ray, edge);
  if (Math.abs(denominator) < 0.000001) return null;
  const relative = Matter.Vector.sub(a, start);
  const rayRatio = cross(relative, edge) / denominator;
  const edgeRatio = cross(relative, ray) / denominator;
  return rayRatio >= 0 && rayRatio <= 1 && edgeRatio >= 0 && edgeRatio <= 1 ? rayRatio : null;
}

function cross(a: Matter.Vector, b: Matter.Vector): number {
  return a.x * b.y - a.y * b.x;
}

function drawSparks(ctx: CanvasRenderingContext2D, position: Matter.Vector, now: number): void {
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 2;
  for (let index = 0; index < LASER.sparkCount; index += 1) {
    const angle = index * Math.PI * 2 / LASER.sparkCount + now * 0.009;
    const inner = 5 + Math.sin(now * 0.02 + index) * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * (inner + 9), Math.sin(angle) * (inner + 9));
    ctx.stroke();
  }
  ctx.restore();
}
