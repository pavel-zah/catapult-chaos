import Matter from 'matter-js';
import { attachMetadata } from '../types';
import { defineGadgetFactory } from '../GadgetRegistry';

export const createBonusFish = defineGadgetFactory('bonus_fish', (spawn, { physics, events }) => {
  const radius = spawn.radius ?? 31;
  const body = attachMetadata(Matter.Bodies.circle(spawn.x, spawn.y, radius, {
    isStatic: true,
    isSensor: true,
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'bonus_fish', hp: 1,
    maxHp: 1, damageThreshold: Infinity, bornAt: 0, width: radius * 2, height: radius * 2,
  });
  physics.add(body);
  let collected = false;

  return {
    id: spawn.id,
    type: 'bonus_fish',
    bodies: [body],
    onCollisionStart: (other) => {
      if (collected || other.isStatic || other.isSensor) return;
      collected = true;
      physics.remove(body);
      events.emit('gadget:bonus', { gadgetId: spawn.id, position: { ...body.position } });
      events.emit('audio:play', { sound: 'collect' });
      events.emit('game:score-popup', { position: { ...body.position }, text: 'ЗОЛОТАЯ РЫБКА!', color: '#fde047' });
    },
    render: ({ ctx, now }) => {
      if (collected) return;
      ctx.save();
      ctx.translate(body.position.x, body.position.y + Math.sin(now * 0.004 + body.id) * 7);
      ctx.rotate(Math.sin(now * 0.003) * 0.1);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-radius * 0.75, 0);
      ctx.lineTo(-radius * 1.55, -radius * 0.7);
      ctx.lineTo(-radius * 1.55, radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff7cc';
      ctx.beginPath();
      ctx.arc(radius * 0.45, -radius * 0.12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f2d20';
      ctx.beginPath();
      ctx.arc(radius * 0.48, -radius * 0.12, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };
});
