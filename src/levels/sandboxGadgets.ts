import type { LevelData } from './schema';

/** Isolated mechanics test range; never included in campaign progression. */
export const sandboxGadgets: LevelData = {
  id: 'sandbox-gadgets',
  name: 'Песочница гаджетов',
  description: 'Все каналы и физические механики. D показывает связи, R перезапускает сцену.',
  worldBounds: { width: 2720, height: 1200 },
  slingshot: { x: 240, y: 980 },
  queue: [
    'classic', 'anvil', 'bouncy', 'splitter', 'magnet', 'classic',
    'anvil', 'classic', 'bouncy', 'splitter', 'magnet', 'classic',
  ],
  starThresholds: { twoStars: 0, threeStars: 0 },
  sandbox: true,
  goals: [],
  blocks: [
    { id: 'sandbox-floor', type: 'static', x: 1360, y: 1160, width: 2720, height: 80 },
    { id: 'seesaw-stone', type: 'stone', x: 455, y: 780, width: 72, height: 72 },
    { id: 'laser-crate', type: 'wood', x: 2450, y: 300, width: 76, height: 76 },
    { id: 'crate-shelf', type: 'static', x: 2450, y: 350, width: 200, height: 24 },
    { id: 'vacuum-shelf', type: 'static', x: 2100, y: 350, width: 150, height: 24 },
    { id: 'gravity-stone', type: 'stone', x: 1750, y: 950, width: 56, height: 56 },
  ],
  targets: [
    { id: 'sandbox-trapdoor-safe', type: 'treasure_box', x: 1300, y: 750, width: 86, height: 68 },
    { id: 'sandbox-laser-vacuum', type: 'vacuum', x: 2100, y: 300 },
  ],
  gadgets: [
    // Левый блок: качели, плита и дверь.
    { id: 'seesaw-sandbox', type: 'seesaw', x: 560, y: 900, width: 300, height: 24 },
    {
      id: 'plate-blue', type: 'pressure_plate', x: 820, y: 1110, width: 150,
      channelId: 'blue', minMass: 15,
    },
    {
      id: 'door-blue', type: 'door', x: 1000, y: 990, width: 42, height: 260,
      channelId: 'blue', openOffset: { x: 0, y: -285 }, moveSpeed: 8,
    },
    // Центр: красный канал роняет люк и выключает вентилятор по инверсии.
    {
      id: 'trapdoor-sandbox', type: 'trapdoor', x: 1300, y: 800, width: 240, height: 26,
      channelId: 'red', hinge: 'left', material: 'wood',
    },
    {
      id: 'button-red', type: 'button', x: 1400, y: 1099, mode: 'toggle',
      channelId: 'red', impulseThreshold: 20,
    },
    {
      id: 'fan-sandbox', type: 'fan', x: 1720, y: 560, width: 360, height: 300,
      angle: -90, strength: 0.0018, channelId: 'red', invertSignal: true,
    },
    {
      id: 'gravity-sandbox', type: 'gravity_zone', x: 1750, y: 900, width: 360, height: 240,
      gravityScale: -0.5,
    },
    // Правый блок: лазер, верёвка с TNT; зелёный канал выключает лазер.
    {
      id: 'rope-sandbox', type: 'rope', x: 2280, y: 520, anchor: { x: 2280, y: 100 },
      cargo: 'tnt', cargoWidth: 76, cargoHeight: 76,
    },
    {
      id: 'laser-sandbox', type: 'laser', x: 2620, y: 300, angle: 180, maxLength: 900,
      channelId: 'green', invertSignal: true,
    },
    {
      id: 'button-green', type: 'button', x: 2100, y: 1099, mode: 'toggle',
      channelId: 'green', impulseThreshold: 18,
    },
  ],
};
