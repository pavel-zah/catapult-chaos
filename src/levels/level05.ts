import type { LevelData } from './schema';

export const level05: LevelData = {
  id: 'level05',
  name: '5 — Люк по команде',
  description: 'Кнопка роняет люк вместе с вакуумом и выключает вентилятор у правого края.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['bouncy', 'classic', 'anvil', 'classic'],
  starThresholds: { twoStars: 1800, threeStars: 2600 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-5' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
  ],
  targets: [
    { id: 'vacuum-on-hatch', type: 'vacuum', x: 1150, y: 649 },
    { id: 'vacuum-middle', type: 'vacuum', x: 1400, y: 942 },
    { id: 'vacuum-far-right', type: 'vacuum', x: 1850, y: 942 },
  ],
  gadgets: [
    {
      id: 'button-red', type: 'button', x: 620, y: 959, channelId: 'red',
      mode: 'once', impulseThreshold: 18,
    },
    {
      id: 'trapdoor-red', type: 'trapdoor', x: 1150, y: 700, width: 240, height: 26,
      channelId: 'red', hinge: 'left', material: 'metal',
    },
    {
      id: 'fan-red', type: 'fan', x: 1650, y: 730, width: 300, height: 400,
      angle: 180, strength: 0.03, channelId: 'red', invertSignal: true,
    },
    { id: 'fish-5', type: 'bonus_fish', x: 900, y: 470, radius: 31 },
  ],
};
