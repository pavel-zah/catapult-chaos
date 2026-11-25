import type { LevelData } from './schema';

export const level03: LevelData = {
  id: 'level03',
  name: '3 — Четвёртый ход',
  description: 'Портал ведёт в тыл. Матрёшка зачистит полки, Магнит соберёт и разбросает укрепления.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['splitter', 'magnet', 'classic', 'splitter'],
  starThresholds: { twoStars: 2000, threeStars: 3000 },
  modifiers: { gravityScale: 0.9 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-3' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'front-wall', type: 'stone', x: 1200, y: 800, width: 52, height: 360 },
    { id: 'fort-floor', type: 'wood', x: 1530, y: 892, width: 570, height: 30 },
    { id: 'back-wall', type: 'static', x: 1810, y: 790, width: 45, height: 390 },
    { id: 'glass-a', type: 'glass', x: 1450, y: 938, width: 30, height: 94 },
    { id: 'glass-b', type: 'glass', x: 1640, y: 938, width: 30, height: 94 },
    { id: 'inner-roof', type: 'wood', x: 1545, y: 774, width: 330, height: 28 },
    { id: 'tnt-3', type: 'tnt', x: 1710, y: 944, width: 72, height: 72 },
    { id: 'high-shelf', type: 'static', x: 1530, y: 510, width: 390, height: 26 },
  ],
  targets: [
    { id: 'vacuum-inner-a', type: 'vacuum', x: 1390, y: 835 },
    { id: 'vacuum-inner-b', type: 'vacuum', x: 1600, y: 835 },
    { id: 'vacuum-high', type: 'vacuum', x: 1600, y: 455 },
  ],
  gadgets: [
    { id: 'portal-a', type: 'portal', pairId: 'portal-b', x: 800, y: 810, angle: 0 },
    { id: 'portal-b', type: 'portal', pairId: 'portal-a', x: 1350, y: 590, angle: 0 },
    { id: 'fish-3', type: 'bonus_fish', x: 1780, y: 350, radius: 31 },
  ],
};
