import Matter from 'matter-js';
import type { CatDefinition } from '../types';

const MAGNET_RADIUS = 330;

export const magnetCat: CatDefinition = {
  id: 'magnet',
  name: 'Кот-Магнит',
  shortName: 'Магнит',
  description: 'Притягивает конструкцию, затем мощно отталкивает.',
  abilityName: 'Магнитный импульс',
  abilityHint: 'Клик: притяжение 0,8 с, затем отталкивающий взрыв',
  color: '#a78bfa',
  accent: '#5b21b6',
  radius: 37,
  mass: 17,
  restitution: 0.25,
  friction: 0.4,
  allowAbilityAfterCollision: true,
  onAbilityActivate: ({ setAbilityDuration }) => {
    setAbilityDuration(800);
  },
  onAbilityUpdate: ({ cat, physics }, dtMs) => {
    const step = dtMs / 16.6667;
    for (const body of physics.dynamicBodies) {
      if (body.id === cat.body.id || !['block', 'target', 'treasure'].includes(body.game.kind)) continue;
      const delta = Matter.Vector.sub(cat.body.position, body.position);
      const distance = Math.max(1, Matter.Vector.magnitude(delta));
      if (distance >= MAGNET_RADIUS) continue;
      const direction = Matter.Vector.div(delta, distance);
      const pull = 0.72 * step * (0.45 + 0.55 * (1 - distance / MAGNET_RADIUS));
      physics.setVelocityCapped(body, {
        x: body.velocity.x + direction.x * pull,
        y: body.velocity.y + direction.y * pull,
      });
      Matter.Sleeping.set(body, false);
    }
  },
  onAbilityEnd: ({ cat, physics, events }) => {
    physics.applyRadialImpulse(cat.body.position, MAGNET_RADIUS, 19, cat.body.id);
    events.emit('game:score-popup', {
      position: { ...cat.body.position },
      text: 'МАГНИТ!',
      color: '#d8b4fe',
    });
  },
};
