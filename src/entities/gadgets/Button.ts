import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';
import { channelColor, drawChannelIndicator } from './gadgetUtils';

const BUTTON = {
  width: 92,
  height: 42,
  impulseThreshold: 24,
  cooldownMs: 260,
  compressionDecay: 0.018,
} as const;

export const createButton = defineGadgetFactory('button', (spawn, context) => {
  const { physics, events, channels } = context;
  const width = spawn.width ?? BUTTON.width;
  const height = spawn.height ?? BUTTON.height;
  const threshold = spawn.impulseThreshold ?? BUTTON.impulseThreshold;
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    friction: 0.7,
    restitution: 0.08,
    label: 'gadget:button',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'button', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);

  let active = false;
  let completed = false;
  let lastActivation = -Infinity;
  let compression = 0;
  channels.setSource(spawn.channelId, spawn.id, false);

  return {
    id: spawn.id,
    type: 'button',
    bodies: [body],
    onCollisionStart: (other, now, impulse) => {
      if (completed || other.isStatic || other.isSensor || impulse < threshold) return;
      if (now - lastActivation < BUTTON.cooldownMs) return;
      lastActivation = now;
      active = spawn.mode === 'toggle' ? !active : true;
      completed = spawn.mode !== 'toggle';
      compression = 1;
      channels.setSource(spawn.channelId, spawn.id, active);
      events.emit('audio:play', { sound: 'click', intensity: 1.2 });
      events.emit('game:score-popup', {
        position: { x: body.position.x, y: body.position.y - height },
        text: active ? 'КЛИК!' : 'СБРОС', color: channelColor(spawn.channelId),
      });
    },
    update: (dtMs) => {
      compression *= Math.exp(-dtMs * BUTTON.compressionDecay);
    },
    render: ({ ctx }) => {
      const color = channelColor(spawn.channelId);
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.fillStyle = '#293548';
      ctx.strokeStyle = '#101827';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = active ? color : '#a7b2c3';
      ctx.shadowColor = color;
      ctx.shadowBlur = active ? 20 : 0;
      ctx.beginPath();
      ctx.roundRect(
        -width * 0.36,
        -height * 0.62 + compression * 9,
        width * 0.72,
        height * 0.45,
        7,
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      drawChannelIndicator(ctx, spawn.channelId, active, width * 0.35, 0);
      ctx.restore();
    },
  };
});
