import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';
import { drawChannelIndicator, overlappingDynamicBodies } from './gadgetUtils';

const GRAVITY_ZONE = {
  width: 320,
  height: 280,
  gravityScale: 0,
  dampingPerSecond: 0.32,
  bubbleCount: 15,
} as const;

export const createGravityZone = defineGadgetFactory('gravity_zone', (spawn, context) => {
  const { physics, channels } = context;
  const width = spawn.width ?? GRAVITY_ZONE.width;
  const height = spawn.height ?? GRAVITY_ZONE.height;
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    isSensor: true,
    label: 'gadget:gravity_zone',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'gravity_zone', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);
  let enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal);

  return {
    id: spawn.id,
    type: 'gravity_zone',
    bodies: [body],
    update: (dtMs) => {
      enabled = channels.receiverSignal(spawn.channelId, spawn.invertSignal);
      if (!enabled) return;
      const customScale = spawn.gravityScale ?? GRAVITY_ZONE.gravityScale;
      const gravity = physics.engine.gravity;
      const damping = Math.exp(-GRAVITY_ZONE.dampingPerSecond * dtMs / 1000);
      for (const target of overlappingDynamicBodies(body, physics)) {
        Matter.Body.applyForce(target, target.position, {
          x: target.mass * gravity.x * gravity.scale * (customScale - 1),
          y: target.mass * gravity.y * gravity.scale * (customScale - 1),
        });
        physics.setVelocityCapped(target, {
          x: target.velocity.x * damping,
          y: target.velocity.y * damping,
        });
        Matter.Sleeping.set(target, false);
      }
    },
    render: ({ ctx, now }) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.fillStyle = enabled ? '#a78bfa20' : '#64748b0d';
      ctx.strokeStyle = enabled ? '#c4b5fd88' : '#64748b55';
      ctx.lineWidth = 3;
      ctx.setLineDash([13, 10]);
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      ctx.setLineDash([]);
      if (enabled) {
        for (let index = 0; index < GRAVITY_ZONE.bubbleCount; index += 1) {
          const x = -width / 2 + ((index * 83.7) % width);
          const speed = 0.018 + (index % 4) * 0.005;
          const y = height / 2 - ((now * speed + index * 61) % (height + 30));
          const radius = 3 + index % 5;
          ctx.fillStyle = '#ddd6fe55';
          ctx.strokeStyle = '#ede9fe99';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x + Math.sin(now * 0.001 + index) * 8, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#ede9fe';
      ctx.font = '800 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`g = ${spawn.gravityScale ?? GRAVITY_ZONE.gravityScale}`, 0, 7);
      ctx.restore();
      drawChannelIndicator(
        ctx,
        spawn.channelId,
        enabled,
        body.position.x + width / 2 - 14,
        body.position.y - height / 2 + 14,
      );
    },
  };
});
