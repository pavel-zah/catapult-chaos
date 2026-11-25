import Matter from 'matter-js';
import { attachMetadata } from '../types';
import { defineGadgetFactory } from '../GadgetRegistry';

export const createTrampoline = defineGadgetFactory('trampoline', (spawn, { physics, events }) => {
  const width = spawn.width ?? 170;
  const height = spawn.height ?? 26;
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    angle: (spawn.angle ?? 0) * Math.PI / 180,
    friction: 0.35,
    restitution: 0.25,
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'trampoline', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);
  let compression = 0;

  return {
    id: spawn.id,
    type: 'trampoline',
    bodies: [body],
    onCollisionStart: (other) => {
      if (other.isStatic || other.isSensor) return;
      const angle = body.angle;
      const normal = { x: Math.sin(angle), y: -Math.cos(angle) };
      const boost = 23;
      physics.setVelocityCapped(other, {
        x: other.velocity.x * 0.65 + normal.x * boost,
        y: other.velocity.y * 0.65 + normal.y * boost,
      });
      Matter.Sleeping.set(other, false);
      compression = 1;
      events.emit('audio:play', { sound: 'boing' });
      events.emit('game:score-popup', { position: { ...body.position }, text: 'БОИНГ!', color: '#7dd3fc' });
    },
    update: (dtMs) => {
      compression *= Math.exp(-dtMs * 0.012);
    },
    render: ({ ctx }) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 7;
      for (let x = -width * 0.35; x <= width * 0.35; x += width * 0.35) {
        ctx.beginPath();
        ctx.moveTo(x, height / 2);
        ctx.lineTo(x - 9, height / 2 + 18 + compression * 10);
        ctx.lineTo(x + 9, height / 2 + 32 + compression * 10);
        ctx.stroke();
      }
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2 + compression * 9, width, height, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  };
});
