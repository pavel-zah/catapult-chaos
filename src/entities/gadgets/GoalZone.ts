import Matter from 'matter-js';
import { GOAL_HOLD_MS } from '../../constants';
import { attachMetadata, type GameBody } from '../types';
import { defineGadgetFactory } from '../GadgetRegistry';

export const createGoalZone = defineGadgetFactory('goal_zone', (spawn, { physics, events }) => {
  const width = spawn.width ?? 240;
  const height = spawn.height ?? 110;
  const body = attachMetadata(Matter.Bodies.rectangle(spawn.x, spawn.y, width, height, {
    isStatic: true,
    isSensor: true,
    angle: (spawn.angle ?? 0) * Math.PI / 180,
  }), {
    entityId: spawn.id, kind: 'gadget', typeId: 'goal_zone', hp: Infinity,
    maxHp: Infinity, damageThreshold: Infinity, bornAt: 0, width, height,
  });
  physics.add(body);
  const inside = new Set<GameBody>();
  let holdMs = 0;
  let achieved = false;
  const matches = (other: GameBody): boolean => other.game.kind === 'treasure'
    && (!spawn.targetId || other.game.entityId === spawn.targetId);

  return {
    id: spawn.id,
    type: 'goal_zone',
    bodies: [body],
    onCollisionStart: (other) => {
      if (matches(other)) inside.add(other);
    },
    onCollisionEnd: (other) => {
      inside.delete(other);
    },
    update: (dtMs) => {
      if (achieved) return;
      holdMs = inside.size > 0 ? holdMs + dtMs : 0;
      if (holdMs >= GOAL_HOLD_MS) {
        achieved = true;
        events.emit('gadget:goal', { gadgetId: spawn.id, targetId: spawn.targetId ?? '' });
        events.emit('audio:play', { sound: 'collect' });
        events.emit('game:score-popup', { position: { ...body.position }, text: 'ДОСТАВЛЕНО!', color: '#86efac' });
      }
    },
    render: ({ ctx, now }) => {
      const progress = achieved ? 1 : Math.min(1, holdMs / GOAL_HOLD_MS);
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = `rgb(74 222 128 / ${0.1 + Math.sin(now * 0.005) * 0.035})`;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 5;
      ctx.setLineDash([18, 12]);
      ctx.lineDashOffset = -now * 0.025;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      ctx.setLineDash([]);
      ctx.fillStyle = '#bbf7d0';
      ctx.font = '800 23px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(achieved ? 'ГОТОВО!' : 'ЗОНА ДОСТАВКИ', 0, 8);
      ctx.fillStyle = '#166534';
      ctx.fillRect(-width / 2, height / 2 + 10, width, 8);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(-width / 2, height / 2 + 10, width * progress, 8);
      ctx.restore();
    },
  };
});
