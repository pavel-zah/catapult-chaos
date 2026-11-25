import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';
import { drawChannelIndicator, overlappingDynamicBodies } from './gadgetUtils';

const FAN = {
  width: 360,
  height: 260,
  strength: 0.0018,
  rotorSpeed: 0.018,
  streamCount: 7,
} as const;

export const createFan = defineGadgetFactory('fan', (spawn, { physics, channels }) => {
  const width = spawn.width ?? FAN.width;
  const height = spawn.height ?? FAN.height;
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    isSensor: true,
    angle: (spawn.angle ?? 0) * Math.PI / 180,
    label: 'gadget:fan_zone',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'fan', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);
  let enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal);
  let rotor = 0;

  return {
    id: spawn.id,
    type: 'fan',
    bodies: [body],
    update: (dtMs) => {
      enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal);
      if (!enabled) return;
      rotor += dtMs * FAN.rotorSpeed;
      const direction = { x: Math.cos(body.angle), y: Math.sin(body.angle) };
      const strength = spawn.strength ?? FAN.strength;
      for (const target of overlappingDynamicBodies(body, physics)) {
        Matter.Body.applyForce(target, target.position, {
          x: direction.x * strength,
          y: direction.y * strength,
        });
        Matter.Sleeping.set(target, false);
      }
    },
    render: ({ ctx, now }) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      if (enabled) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-width / 2, -height / 2, width, height);
        ctx.clip();
        ctx.strokeStyle = '#bae6fd55';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        for (let index = 0; index < FAN.streamCount; index += 1) {
          const y = -height / 2 + (index + 0.5) * height / FAN.streamCount;
          const offset = (now * 0.22 + index * 67) % (width + 120);
          const x = -width / 2 + offset - 60;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 80, y);
          ctx.stroke();
        }
        ctx.restore();
      }
      const hubX = -width / 2;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(hubX, 0, Math.min(54, height * 0.22), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.rotate(rotor);
      ctx.fillStyle = enabled ? '#7dd3fc' : '#64748b';
      for (let index = 0; index < 4; index += 1) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(hubX + 23, 0, 26, 10, 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate(-rotor);
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(hubX, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      drawChannelIndicator(ctx, spawn.channelId, enabled, hubX, -65);
      ctx.restore();
    },
  };
});
