import Matter from 'matter-js';
import type { CatDefinition } from '../types';

export const anvilCat: CatDefinition = {
  id: 'anvil',
  name: 'Кот-Наковальня',
  shortName: 'Наковальня',
  description: 'Тяжелеет в шесть раз и падает отвесно.',
  abilityName: 'Гравитационный пресс',
  abilityHint: 'Клик в полёте: стоп вбок → тяжёлое падение вниз',
  color: '#64748b',
  accent: '#273449',
  radius: 43,
  mass: 28,
  restitution: 0.08,
  friction: 0.75,
  allowAbilityAfterCollision: false,
  onAbilityActivate: ({ cat }) => {
    Matter.Body.setVelocity(cat.body, { x: 0, y: Math.max(8, Math.abs(cat.body.velocity.y)) });
    Matter.Body.setAngularVelocity(cat.body, 0);
    Matter.Body.setMass(cat.body, cat.body.mass * 6);
    cat.body.restitution = 0.03;
  },
};
