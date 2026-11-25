import type { LevelData } from './schema';

export const level06: LevelData = {
  id: 'level06',
  name: '6 — Лазерный раскрой',
  description: 'Разбей ящик на пути луча: лазер перережет верёвку, и динамит рухнет на склад.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['classic', 'anvil', 'bouncy', 'splitter'],
  starThresholds: { twoStars: 1900, threeStars: 2700 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-6' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'beam-shelf', type: 'static', x: 760, y: 372, width: 180, height: 20 },
    { id: 'beam-crate', type: 'wood', x: 760, y: 328, width: 68, height: 68 },
    { id: 'crate-left', type: 'wood', x: 1150, y: 930, width: 86, height: 96 },
    { id: 'crate-right', type: 'wood', x: 1530, y: 930, width: 90, height: 90 },
    { id: 'high-shelf', type: 'static', x: 1700, y: 846, width: 200, height: 26 },
  ],
  targets: [
    { id: 'vacuum-near', type: 'vacuum', x: 1330, y: 942 },
    { id: 'vacuum-mid', type: 'vacuum', x: 1420, y: 942 },
    { id: 'vacuum-shelf', type: 'vacuum', x: 1700, y: 795 },
  ],
  gadgets: [
    { id: 'laser-6', type: 'laser', x: 250, y: 320, angle: 0, maxLength: 1400 },
    {
      id: 'rope-6', type: 'rope', x: 1250, y: 460,
      anchor: { x: 1250, y: 140 }, cargo: 'tnt', cargoWidth: 76, cargoHeight: 76,
    },
    { id: 'fish-6', type: 'bonus_fish', x: 1620, y: 520, radius: 31 },
  ],
};
