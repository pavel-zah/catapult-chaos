import type { LevelData } from './schema';

export const level04: LevelData = {
  id: 'level04',
  name: '4 — Засов на кнопке',
  description: 'Кнопка на полу поднимает тяжёлый засов. Сначала нажми, потом бей по крепости.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: ['classic', 'bouncy', 'anvil', 'classic'],
  starThresholds: { twoStars: 1800, threeStars: 2600 },
  goals: [{ type: 'destroy_targets' }, { type: 'bonus_fish', gadgetId: 'fish-4' }],
  blocks: [
    { id: 'floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'fort-leg-l', type: 'wood', x: 1310, y: 886, width: 36, height: 188 },
    { id: 'fort-leg-r', type: 'glass', x: 1540, y: 886, width: 30, height: 188 },
    { id: 'fort-roof', type: 'wood', x: 1425, y: 778, width: 280, height: 30 },
    { id: 'shelf', type: 'static', x: 1720, y: 838, width: 220, height: 26 },
    { id: 'crate', type: 'wood', x: 1610, y: 944, width: 82, height: 72 },
  ],
  targets: [
    { id: 'vacuum-inner', type: 'vacuum', x: 1425, y: 942 },
    { id: 'vacuum-roof', type: 'vacuum', x: 1425, y: 725 },
    { id: 'vacuum-shelf', type: 'vacuum', x: 1720, y: 787 },
  ],
  gadgets: [
    {
      id: 'button-gate', type: 'button', x: 760, y: 959, channelId: 'gate',
      mode: 'once', impulseThreshold: 18,
    },
    {
      id: 'door-gate', type: 'door', x: 1120, y: 800, width: 42, height: 360,
      channelId: 'gate', openOffset: { x: 0, y: -410 }, moveSpeed: 10,
    },
    { id: 'fish-4', type: 'bonus_fish', x: 1720, y: 500, radius: 31 },
  ],
};
