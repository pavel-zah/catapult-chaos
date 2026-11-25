import type { LevelData } from './schema';

export const level01: LevelData = {
  id: 'level01',
  name: '1 — Большой кухонный бум',
  description: 'Стекло, дерево и два баллончика TNT. Найди красивую цепную реакцию!',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 230, y: 825 },
  queue: ['classic', 'classic', 'anvil', 'bouncy'],
  starThresholds: { twoStars: 1800, threeStars: 2700 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-1' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'glass-leg-l', type: 'glass', x: 1240, y: 886, width: 28, height: 188 },
    { id: 'wood-leg-r', type: 'wood', x: 1430, y: 886, width: 34, height: 188 },
    { id: 'roof', type: 'wood', x: 1335, y: 776, width: 300, height: 30 },
    { id: 'tnt-a', type: 'tnt', x: 1320, y: 942, width: 72, height: 72 },
    { id: 'shelf', type: 'static', x: 1630, y: 864, width: 300, height: 28 },
    { id: 'glass-b', type: 'glass', x: 1570, y: 930, width: 80, height: 24, angle: 90 },
    { id: 'tnt-b', type: 'tnt', x: 1660, y: 944, width: 72, height: 72 },
    { id: 'crate', type: 'wood', x: 1630, y: 814, width: 92, height: 72 },
  ],
  targets: [
    { id: 'vacuum-roof', type: 'vacuum', x: 1330, y: 721 },
    { id: 'vacuum-floor', type: 'vacuum', x: 1530, y: 942 },
    { id: 'vacuum-shelf', type: 'vacuum', x: 1740, y: 810 },
  ],
  gadgets: [
    { id: 'fish-1', type: 'bonus_fish', x: 1780, y: 600, radius: 31 },
  ],
};
