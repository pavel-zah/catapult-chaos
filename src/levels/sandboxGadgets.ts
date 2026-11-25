import type { LevelData } from './schema';

/** Isolated mechanics test range; never included in campaign progression. */
export const sandboxGadgets: LevelData = {
  id: 'sandbox-gadgets',
  name: 'Песочница гаджетов',
  description: 'Все каналы и физические механики. D показывает связи, R перезапускает сцену.',
  worldBounds: { width: 1920, height: 1080 },
  slingshot: { x: 220, y: 825 },
  queue: [
    'classic', 'anvil', 'bouncy', 'splitter', 'magnet', 'classic',
    'anvil', 'classic', 'bouncy', 'splitter', 'magnet', 'classic',
  ],
  starThresholds: { twoStars: 0, threeStars: 0 },
  sandbox: true,
  goals: [],
  blocks: [
    { id: 'sandbox-floor', type: 'static', x: 960, y: 1020, width: 1920, height: 80 },
    { id: 'seesaw-stone', type: 'stone', x: 405, y: 724, width: 72, height: 72 },
    { id: 'laser-crate', type: 'wood', x: 1450, y: 252, width: 76, height: 76 },
    { id: 'crate-shelf', type: 'static', x: 1450, y: 312, width: 210, height: 24 },
    { id: 'vacuum-shelf', type: 'static', x: 970, y: 312, width: 150, height: 24 },
  ],
  targets: [
    { id: 'sandbox-trapdoor-safe', type: 'treasure_box', x: 750, y: 650, width: 86, height: 68 },
    { id: 'sandbox-laser-vacuum', type: 'vacuum', x: 970, y: 256 },
  ],
  gadgets: [
    { id: 'seesaw-sandbox', type: 'seesaw', x: 500, y: 800, width: 290, height: 24 },
    {
      id: 'trapdoor-sandbox', type: 'trapdoor', x: 740, y: 716, width: 230, height: 26,
      channelId: 'red', hinge: 'left', material: 'wood',
    },
    {
      id: 'button-red', type: 'button', x: 470, y: 958, mode: 'once',
      channelId: 'red', impulseThreshold: 20,
    },
    {
      id: 'plate-blue', type: 'pressure_plate', x: 650, y: 966, width: 140,
      channelId: 'blue', minMass: 15,
    },
    {
      id: 'door-blue', type: 'door', x: 900, y: 850, width: 42, height: 260,
      channelId: 'blue', openOffset: { x: 0, y: -285 }, moveSpeed: 8,
    },
    {
      id: 'fan-sandbox', type: 'fan', x: 1340, y: 820, width: 380, height: 300,
      angle: -90, strength: 0.0018, channelId: 'red', invertSignal: true,
    },
    {
      id: 'gravity-sandbox', type: 'gravity_zone', x: 1510, y: 510, width: 360, height: 300,
      gravityScale: -0.5,
    },
    {
      id: 'rope-sandbox', type: 'rope', x: 1150, y: 430, anchor: { x: 1150, y: 80 },
      cargo: 'tnt', cargoWidth: 76, cargoHeight: 76,
    },
    {
      id: 'laser-sandbox', type: 'laser', x: 1770, y: 250, angle: 180, maxLength: 900,
      channelId: 'green', invertSignal: true,
    },
    {
      id: 'button-green', type: 'button', x: 1850, y: 958, mode: 'toggle',
      channelId: 'green', impulseThreshold: 18,
    },
  ],
};
