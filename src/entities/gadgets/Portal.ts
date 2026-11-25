import Matter from 'matter-js';
import { PORTAL_COOLDOWN_MS } from '../../constants';
import { attachMetadata, type GameBody } from '../types';
import { defineGadgetFactory } from '../GadgetRegistry';

const lastTeleport = new WeakMap<GameBody, number>();

export const createPortal = defineGadgetFactory('portal', (spawn, { physics, events, getGadget }) => {
  const width = spawn.width ?? 44;
  const height = spawn.height ?? 140;
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    isSensor: true,
    angle: (spawn.angle ?? 0) * Math.PI / 180,
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'portal', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);

  return {
    id: spawn.id,
    type: 'portal',
    bodies: [body],
    onCollisionStart: (other, now) => {
      if (other.isStatic || other.isSensor || !spawn.pairId) return;
      const previous = lastTeleport.get(other) ?? -Infinity;
      if (now - previous < PORTAL_COOLDOWN_MS) return;
      const pair = getGadget(spawn.pairId);
      const exit = pair?.bodies[0];
      if (!pair || !exit || exit.id === body.id) return;

      lastTeleport.set(other, now);
      const rotation = exit.angle - body.angle;
      const entryNormal = { x: Math.cos(body.angle), y: Math.sin(body.angle) };
      const exitNormal = { x: Math.cos(exit.angle), y: Math.sin(exit.angle) };
      const travelSign = Math.sign(Matter.Vector.dot(other.velocity, entryNormal)) || 1;
      const clearance = (other.circleRadius ?? Math.max(other.game.width ?? 30, other.game.height ?? 30) / 2) + 64;
      Matter.Body.setPosition(other, {
        x: exit.position.x + exitNormal.x * clearance * travelSign,
        y: exit.position.y + exitNormal.y * clearance * travelSign,
      });
      // Cap first, then rotate: the second capped call preserves the resulting speed exactly.
      physics.setVelocityCapped(other, other.velocity);
      const velocity = Matter.Vector.rotate(other.velocity, rotation);
      physics.setVelocityCapped(other, velocity);
      Matter.Body.setAngle(other, other.angle + rotation);
      Matter.Sleeping.set(other, false);
      events.emit('audio:play', { sound: 'portal' });
      events.emit('game:score-popup', { position: { ...exit.position }, text: 'ВЖУХ!', color: '#c4b5fd' });
    },
    render: ({ ctx, now }) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle + Math.PI / 2);
      const pulse = 1 + Math.sin(now * 0.006 + body.id) * 0.05;
      ctx.scale(pulse, pulse);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#8b5cf6';
      ctx.shadowColor = '#c4b5fd';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(0, 0, height / 2, width / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#67e8f9';
      ctx.setLineDash([16, 13]);
      ctx.lineDashOffset = -now * 0.04;
      ctx.beginPath();
      ctx.ellipse(0, 0, height / 2 - 11, width / 2 - 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  };
});
