import type { LevelData } from './schema';

export const level04: LevelData = {
  id: 'level04',
  name: '4 — Операция «Сейф»',
  description: 'Доставь сейф в зелёную зону и не разбей его. Магнит решает, батут помогает.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['magnet', 'classic', 'bouncy', 'magnet'],
  starThresholds: { twoStars: 1400, threeStars: 2300 },
  goals: [
    { type: 'deliver_to_zone', targetId: 'treasure-4', zoneId: 'goal-4' },
    { type: 'bonus_fish', gadgetId: 'fish-4' },
  ],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'start-shelf', type: 'static', x: 1190, y: 982, width: 300, height: 22 },
    { id: 'glass-bumper', type: 'glass', x: 1430, y: 900, width: 24, height: 130, angle: -18 },
    { id: 'soft-crate', type: 'wood', x: 1770, y: 932, width: 90, height: 96 },
  ],
  targets: [
    { id: 'treasure-4', type: 'treasure_box', x: 1190, y: 922, width: 96, height: 78 },
  ],
  gadgets: [
    { id: 'trampoline-4', type: 'trampoline', x: 1480, y: 956, width: 180, angle: 20 },
    { id: 'goal-4', type: 'goal_zone', targetId: 'treasure-4', x: 1660, y: 922, width: 250, height: 116 },
    { id: 'fish-4', type: 'bonus_fish', x: 1510, y: 650, radius: 31 },
  ],
};
