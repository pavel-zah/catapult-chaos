import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata, type GameBody } from '../types';
import type { GadgetFactoryContext } from '../types';
import type { RopeSpawnConfig } from '../../levels/schema';

const ROPE = {
  thickness: 8,
  cargoWidth: 76,
  cargoHeight: 76,
  stiffness: 1,
  damping: 0.04,
} as const;

export const createRope = defineGadgetFactory('rope', (spawn, context) => {
  const cargo = resolveCargo(spawn, context);
  const distance = Matter.Vector.magnitude(Matter.Vector.sub(cargo.position, spawn.anchor));
  const ropeBody = makeRopeBody(spawn, cargo.position, distance);
  const constraint = Matter.Constraint.create({
    pointA: spawn.anchor,
    bodyB: cargo,
    pointB: { x: 0, y: 0 },
    length: distance,
    stiffness: ROPE.stiffness,
    damping: ROPE.damping,
    label: 'gadget:rope_constraint',
  });
  context.physics.add(ropeBody);
  context.physics.addConstraint(constraint);
  let broken = false;

  const cut = (): void => {
    if (broken) return;
    broken = true;
    ropeBody.game.destroyed = true;
    context.physics.removeConstraint(constraint);
    context.physics.remove(ropeBody);
    context.events.emit('gadget:rope-cut', {
      gadgetId: spawn.id,
      position: Matter.Vector.mult(Matter.Vector.add(spawn.anchor, cargo.position), 0.5),
    });
  };

  return {
    id: spawn.id,
    type: 'rope',
    bodies: [ropeBody, cargo],
    onCollisionStart: (other) => {
      if (other.game.kind === 'cat' && !other.isStatic) cut();
    },
    onLaserHit: cut,
    update: () => {
      if (broken) return;
      if (cargo.game.destroyed) {
        cut();
        return;
      }
      const middle = Matter.Vector.mult(Matter.Vector.add(spawn.anchor, cargo.position), 0.5);
      Matter.Body.setPosition(ropeBody, middle);
      Matter.Body.setAngle(ropeBody, Matter.Vector.angle(spawn.anchor, cargo.position));
    },
    render: ({ ctx }) => {
      ctx.strokeStyle = '#c5a16a';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(spawn.anchor.x, spawn.anchor.y);
      if (broken) {
        ctx.lineTo(spawn.anchor.x + 5, spawn.anchor.y + 28);
      } else {
        ctx.lineTo(cargo.position.x, cargo.position.y);
      }
      ctx.stroke();
      ctx.fillStyle = '#8b673e';
      for (const point of [spawn.anchor, ...(broken ? [] : [cargo.position])]) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
});

function resolveCargo(spawn: RopeSpawnConfig, context: GadgetFactoryContext): GameBody {
  if (spawn.targetBlockId) {
    const target = context.getBody(spawn.targetBlockId);
    if (!target) throw new Error(`Rope "${spawn.id}" cannot find "${spawn.targetBlockId}".`);
    return target;
  }
  const type = spawn.cargo ?? 'stone';
  const width = spawn.cargoWidth ?? (type === 'treasure_box' ? 96 : ROPE.cargoWidth);
  const height = spawn.cargoHeight ?? (type === 'treasure_box' ? 78 : ROPE.cargoHeight);
  const treasure = type === 'treasure_box';
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    density: type === 'stone' ? 0.006 : treasure ? 0.0035 : 0.002,
    friction: treasure ? 0.65 : 0.75,
    restitution: 0.05,
    label: treasure ? 'target:treasure_box' : `block:${type}`,
  }), {
    entityId: `${spawn.id}-cargo`,
    kind: treasure ? 'treasure' : 'block',
    typeId: type,
    hp: type === 'stone' ? 145 : treasure ? 120 : 24,
    maxHp: type === 'stone' ? 145 : treasure ? 120 : 24,
    damageThreshold: type === 'stone' ? 34 : treasure ? 42 : 9,
    bornAt: 0,
    width,
    height,
  });
  context.physics.add(body);
  return body;
}

function makeRopeBody(spawn: RopeSpawnConfig, cargoPosition: Matter.Vector, length: number): GameBody {
  const middle = Matter.Vector.mult(Matter.Vector.add(spawn.anchor, cargoPosition), 0.5);
  const bodyLength = Math.max(length, ROPE.thickness);
  return attachMetadata(Matter.Bodies.rectangle(middle.x, middle.y, bodyLength, ROPE.thickness, {
    isStatic: true,
    isSensor: true,
    angle: Matter.Vector.angle(spawn.anchor, cargoPosition),
    label: 'gadget:rope',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'rope', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width: bodyLength, height: ROPE.thickness,
  });
}
