import type { LevelData } from './schema';

export const level07: LevelData = {
  id: 'level07',
  name: '7 — Ангар невесомости',
  description: 'В невесомости вакуумы и динамит висят на месте. Попади по динамиту — ударная волна соберёт оба.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['classic', 'bouncy', 'anvil', 'classic'],
  starThresholds: { twoStars: 1700, threeStars: 2400 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-7' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'tnt-zero', type: 'tnt', x: 950, y: 450, width: 72, height: 72 },
  ],
  targets: [
    { id: 'vacuum-zero-a', type: 'vacuum', x: 810, y: 450 },
    { id: 'vacuum-zero-b', type: 'vacuum', x: 1090, y: 450 },
    { id: 'vacuum-floor', type: 'vacuum', x: 1690, y: 942 },
  ],
  gadgets: [
    {
      id: 'gravity-zone', type: 'gravity_zone', x: 950, y: 475, width: 500,
      height: 450, gravityScale: 0,
    },
    { id: 'fish-7', type: 'bonus_fish', x: 1000, y: 640, radius: 31 },
  ],
};
