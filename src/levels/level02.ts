import type { LevelData } from './schema';

export const level02: LevelData = {
  id: 'level02',
  name: '2 — Крепость под прессом',
  description: 'Батут поможет перелететь стену. Наковальня пробивает камень, Попрыгун — всё остальное.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['anvil', 'bouncy', 'classic', 'anvil'],
  starThresholds: { twoStars: 1800, threeStars: 2800 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-2' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'wall', type: 'static', x: 1030, y: 810, width: 54, height: 340 },
    { id: 'fort-leg-l', type: 'wood', x: 1320, y: 885, width: 38, height: 190 },
    { id: 'fort-leg-r', type: 'glass', x: 1570, y: 885, width: 32, height: 190 },
    { id: 'stone-roof', type: 'stone', x: 1445, y: 764, width: 360, height: 42 },
    { id: 'glass-cap', type: 'glass', x: 1450, y: 704, width: 250, height: 24 },
    { id: 'tower-base', type: 'stone', x: 1750, y: 930, width: 120, height: 100 },
    { id: 'tower-cap', type: 'wood', x: 1750, y: 852, width: 160, height: 28 },
  ],
  targets: [
    { id: 'vacuum-under-roof', type: 'vacuum', x: 1450, y: 941 },
    { id: 'vacuum-tower', type: 'vacuum', x: 1750, y: 797 },
  ],
  gadgets: [
    { id: 'trampoline-2', type: 'trampoline', x: 800, y: 956, width: 190, angle: 12 },
    { id: 'fish-2', type: 'bonus_fish', x: 1150, y: 490, radius: 31 },
  ],
};
