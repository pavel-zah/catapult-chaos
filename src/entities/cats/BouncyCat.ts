import type { CatDefinition } from '../types';

export const bouncyCat: CatDefinition = {
  id: 'bouncy',
  name: 'Кот-Попрыгун',
  shortName: 'Попрыгун',
  description: 'Резиновый хулиган для пинбольных цепочек.',
  abilityName: 'Суперотскок',
  abilityHint: 'Клик: импульс и максимальная упругость (работает после удара)',
  color: '#54e8bd',
  accent: '#087f70',
  radius: 33,
  mass: 11,
  restitution: 0.56,
  friction: 0.25,
  allowAbilityAfterCollision: true,
  onAbilityActivate: ({ cat, physics }) => {
    cat.body.restitution = 0.97;
    cat.body.frictionAir = 0.003;
    const velocity = cat.body.velocity;
    physics.setVelocityCapped(cat.body, {
      x: velocity.x * 1.35 + Math.sign(velocity.x || 1) * 5,
      y: velocity.y * 1.35 - 4,
    });
  },
};
