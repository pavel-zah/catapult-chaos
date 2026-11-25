import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';
import { drawChannelIndicator } from './gadgetUtils';

const TRAPDOOR = {
  width: 220,
  height: 26,
  density: 0.006,
  friction: 0.75,
} as const;

export const createTrapdoor = defineGadgetFactory('trapdoor', (spawn, context) => {
  const { physics, channels, events } = context;
  const width = spawn.width ?? TRAPDOOR.width;
  const height = spawn.height ?? TRAPDOOR.height;
  const initialAngle = (spawn.angle ?? 0) * Math.PI / 180;
  const hingeSide = spawn.hinge === 'right' ? 1 : -1;
  const localHinge = { x: hingeSide * width / 2, y: 0 };
  const hinge = Matter.Vector.add(spawn, Matter.Vector.rotate(localHinge, initialAngle));
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    angle: initialAngle,
    density: TRAPDOOR.density,
    friction: TRAPDOOR.friction,
    label: 'gadget:trapdoor',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'trapdoor', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  Matter.Body.setStatic(body, true);
  const hingeConstraint = Matter.Constraint.create({
    pointA: hinge,
    bodyB: body,
    pointB: localHinge,
    stiffness: 1,
    length: 0,
    damping: 0.08,
  });
  physics.add(body);
  physics.addConstraint(hingeConstraint);
  let opened = false;

  return {
    id: spawn.id,
    type: 'trapdoor',
    bodies: [body],
    update: () => {
      if (opened || !channels.receiverSignal(spawn.channelId, spawn.invertSignal, false)) return;
      opened = true;
      Matter.Body.setStatic(body, false);
      Matter.Sleeping.set(body, false);
      events.emit('audio:play', {
        sound: spawn.material === 'metal' ? 'stone' : 'wood', intensity: 0.65,
      });
    },
    render: ({ ctx }) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = spawn.material === 'metal' ? '#64748b' : '#9a633b';
      ctx.strokeStyle = '#2b3442';
      ctx.lineWidth = 4;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      ctx.fillStyle = '#d6b47c';
      for (let x = -width / 2 + 18; x < width / 2; x += 42) {
        ctx.beginPath();
        ctx.arc(x, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      drawChannelIndicator(ctx, spawn.channelId, opened, 0, 0);
      ctx.restore();
      ctx.fillStyle = '#f1c66d';
      ctx.strokeStyle = '#46351f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hinge.x, hinge.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    },
  };
});
