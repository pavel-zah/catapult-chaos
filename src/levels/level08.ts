import type { LevelData } from './schema';

export const level08: LevelData = {
  id: 'level08',
  name: '8 — Сейф под вентилятором',
  description: 'Вентилятор не пускает сейф в зону. Кнопка его выключит, но сейф хрупкий — толкай мягко.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['magnet', 'classic', 'bouncy', 'classic'],
  starThresholds: { twoStars: 1400, threeStars: 2200 },
  goals: [
    { type: 'deliver_to_zone', targetId: 'treasure-8', zoneId: 'goal-8' },
    { type: 'bonus_fish', gadgetId: 'fish-8' },
  ],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'start-shelf', type: 'static', x: 1080, y: 982, width: 300, height: 22 },
    { id: 'crate', type: 'wood', x: 1520, y: 930, width: 90, height: 90 },
    { id: 'glass-support', type: 'glass', x: 1650, y: 886, width: 30, height: 188 },
  ],
  targets: [
    { id: 'treasure-8', type: 'treasure_box', x: 1080, y: 931, width: 96, height: 78 },
  ],
  gadgets: [
    {
      id: 'button-safe', type: 'button', x: 520, y: 959, channelId: 'safe',
      mode: 'once', impulseThreshold: 18,
    },
    {
      id: 'fan-safe', type: 'fan', x: 1240, y: 830, width: 200, height: 200,
      angle: 180, strength: 0.02, channelId: 'safe', invertSignal: true,
    },
    { id: 'goal-8', type: 'goal_zone', targetId: 'treasure-8', x: 1270, y: 931, width: 260, height: 110 },
    { id: 'fish-8', type: 'bonus_fish', x: 1350, y: 520, radius: 31 },
  ],
};
