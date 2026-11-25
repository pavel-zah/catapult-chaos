import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';
import { channelColor, drawChannelIndicator } from './gadgetUtils';

const DOOR = {
  width: 42,
  height: 260,
  moveSpeed: 7,
} as const;

export const createDoor = defineGadgetFactory('door', (spawn, { physics, channels }) => {
  const width = spawn.width ?? DOOR.width;
  const height = spawn.height ?? DOOR.height;
  const closed = { x: spawn.x, y: spawn.y };
  const offset = spawn.openOffset ?? { x: 0, y: -height - 20 };
  const opened = { x: closed.x + offset.x, y: closed.y + offset.y };
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    angle: (spawn.angle ?? 0) * Math.PI / 180,
    friction: 0.75,
    label: 'gadget:door',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'door', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);
  let enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal, false);

  return {
    id: spawn.id,
    type: 'door',
    bodies: [body],
    update: (dtMs) => {
      enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal, false);
      const target = enabled ? opened : closed;
      const delta = Matter.Vector.sub(target, body.position);
      const distance = Matter.Vector.magnitude(delta);
      if (distance < 0.01) return;
      const maxStep = (spawn.moveSpeed ?? DOOR.moveSpeed) * dtMs / (1000 / 60);
      const position = distance <= maxStep
        ? target
        : Matter.Vector.add(body.position, Matter.Vector.mult(delta, maxStep / distance));
      Matter.Body.setPosition(body, position);
    },
    render: ({ ctx }) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = enabled ? '#426b78' : '#465569';
      ctx.strokeStyle = enabled ? channelColor(spawn.channelId ?? '') : '#94a3b8';
      ctx.lineWidth = 4;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      ctx.strokeStyle = '#ffffff30';
      ctx.lineWidth = 2;
      for (let y = -height / 2 + 20; y < height / 2; y += 34) {
        ctx.beginPath();
        ctx.moveTo(-width / 2 + 6, y);
        ctx.lineTo(width / 2 - 6, y);
        ctx.stroke();
      }
      drawChannelIndicator(ctx, spawn.channelId, enabled, 0, -height / 2 + 16);
      ctx.restore();
    },
  };
});
