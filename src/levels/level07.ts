import type { LevelData } from './schema';

export const level07: LevelData = {
  id: 'level07',
  name: '7 — Ангар невесомости',
  description: 'Портал забрасывает кота в зону невесомости, оттуда видно дальние полки.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['classic', 'splitter', 'bouncy', 'anvil'],
  starThresholds: { twoStars: 1900, threeStars: 2700 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-7' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'wall', type: 'static', x: 1060, y: 780, width: 56, height: 400 },
    { id: 'high-shelf', type: 'static', x: 1500, y: 520, width: 220, height: 26 },
    { id: 'low-shelf', type: 'static', x: 1700, y: 806, width: 220, height: 26 },
  ],
  targets: [
    { id: 'vacuum-high', type: 'vacuum', x: 1500, y: 469 },
    { id: 'vacuum-floor', type: 'vacuum', x: 1330, y: 942 },
    { id: 'vacuum-low-shelf', type: 'vacuum', x: 1700, y: 755 },
  ],
  gadgets: [
    { id: 'portal-in', type: 'portal', pairId: 'portal-out', x: 780, y: 810, angle: 0 },
    { id: 'portal-out', type: 'portal', pairId: 'portal-in', x: 900, y: 500, angle: 0 },
    {
      id: 'gravity-zone', type: 'gravity_zone', x: 1050, y: 330, width: 600,
      height: 420, gravityScale: -0.4,
    },
    { id: 'trampoline-7', type: 'trampoline', x: 1570, y: 956, width: 160, angle: 15 },
    { id: 'fish-7', type: 'bonus_fish', x: 1780, y: 480, radius: 31 },
  ],
};
