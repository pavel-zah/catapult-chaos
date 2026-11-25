import type { CatDefinition } from '../types';

const BOUNCY = {
  restitution: 0.56,
  frictionAir: 0.008,
  superRestitution: 0.97,
  superFrictionAir: 0.003,
  superDurationMs: 1200,
  boostFactor: 1.35,
  boostKick: 5,
  boostLift: 4,
} as const;

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
  restitution: BOUNCY.restitution,
  friction: 0.25,
  allowAbilityAfterCollision: true,
  onAbilityActivate: ({ cat, physics, setAbilityDuration }) => {
    setAbilityDuration(BOUNCY.superDurationMs);
    cat.body.restitution = BOUNCY.superRestitution;
    cat.body.frictionAir = BOUNCY.superFrictionAir;
    const velocity = cat.body.velocity;
    physics.setVelocityCapped(cat.body, {
      x: velocity.x * BOUNCY.boostFactor + Math.sign(velocity.x || 1) * BOUNCY.boostKick,
      y: velocity.y * BOUNCY.boostFactor - BOUNCY.boostLift,
    });
  },
  onAbilityEnd: ({ cat }) => {
    cat.body.restitution = BOUNCY.restitution;
    cat.body.frictionAir = BOUNCY.frictionAir;
  },
};
