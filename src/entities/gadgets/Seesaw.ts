import Matter from 'matter-js';
import { defineGadgetFactory } from '../GadgetRegistry';
import { attachMetadata } from '../types';

const SEESAW = {
  width: 300,
  height: 24,
  density: 0.004,
  friction: 0.8,
  maxTilt: 40,
  supportHeight: 65,
} as const;

export const createSeesaw = defineGadgetFactory('seesaw', (spawn, { physics }) => {
  const width = spawn.width ?? SEESAW.width;
  const height = spawn.height ?? SEESAW.height;
  const initialAngle = (spawn.angle ?? 0) * Math.PI / 180;
  const pivotOffset = spawn.pivotOffset ?? { x: 0, y: 0 };
  const pivot = Matter.Vector.add(spawn, Matter.Vector.rotate(pivotOffset, initialAngle));
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    angle: initialAngle,
    density: SEESAW.density,
    friction: SEESAW.friction,
    restitution: 0.05,
    label: 'gadget:seesaw',
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'seesaw', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  const pivotConstraint = Matter.Constraint.create({
    pointA: pivot,
    bodyB: body,
    pointB: pivotOffset,
    stiffness: 1,
    length: 0,
    damping: 0.08,
  });
  physics.add(body);
  physics.addConstraint(pivotConstraint);
  const maxTilt = (spawn.maxTilt ?? SEESAW.maxTilt) * Math.PI / 180;

  return {
    id: spawn.id,
    type: 'seesaw',
    bodies: [body],
    update: () => {
      const relative = Math.atan2(
        Math.sin(body.angle - initialAngle),
        Math.cos(body.angle - initialAngle),
      );
      if (Math.abs(relative) <= maxTilt) return;
      Matter.Body.setAngle(body, initialAngle + Math.sign(relative) * maxTilt);
      Matter.Body.setAngularVelocity(body, -body.angularVelocity * 0.15);
    },
    render: ({ ctx }) => {
      ctx.save();
      ctx.translate(pivot.x, pivot.y);
      ctx.fillStyle = '#495668';
      ctx.strokeStyle = '#202b3a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-SEESAW.supportHeight * 0.65, SEESAW.supportHeight);
      ctx.lineTo(SEESAW.supportHeight * 0.65, SEESAW.supportHeight);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = '#b97842';
      ctx.strokeStyle = '#713f21';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f1c66d';
      ctx.beginPath();
      ctx.arc(pivotOffset.x, pivotOffset.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };
});
