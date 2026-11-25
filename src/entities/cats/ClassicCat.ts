import type { CatDefinition } from '../types';

export const classicCat: CatDefinition = {
  id: 'classic',
  name: 'Рыжий Классик',
  shortName: 'Классик',
  description: 'Универсальный снаряд с небольшим ускорением.',
  abilityName: 'Рывок',
  abilityHint: 'Клик в полёте: рывок по направлению движения',
  color: '#f59e55',
  accent: '#9a4d2d',
  radius: 35,
  mass: 15,
  restitution: 0.36,
  friction: 0.45,
  allowAbilityAfterCollision: false,
  onAbilityActivate: ({ cat, physics }) => {
    const velocity = cat.body.velocity;
    const speed = Math.max(8, Math.hypot(velocity.x, velocity.y));
    const direction = speed > 0.01
      ? { x: velocity.x / speed, y: velocity.y / speed }
      : { x: 1, y: 0 };
    physics.setVelocityCapped(cat.body, {
      x: velocity.x + direction.x * 9,
      y: velocity.y + direction.y * 9,
    });
  },
};
