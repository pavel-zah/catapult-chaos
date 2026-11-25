import Matter from 'matter-js';
import type { GameBody } from '../types';
import type { PhysicsWorld } from '../../physics/PhysicsWorld';

const NAMED_CHANNEL_COLORS: Readonly<Record<string, string>> = {
  red: '#fb7185',
  blue: '#60a5fa',
  green: '#4ade80',
  yellow: '#facc15',
};

export function channelColor(channelId: string): string {
  const named = NAMED_CHANNEL_COLORS[channelId.toLowerCase()];
  if (named) return named;
  let hash = 0;
  for (let index = 0; index < channelId.length; index += 1) {
    hash = (hash * 31 + channelId.charCodeAt(index)) | 0;
  }
  return `hsl(${Math.abs(hash) % 360} 85% 65%)`;
}

export function drawChannelIndicator(
  ctx: CanvasRenderingContext2D,
  channelId: string | undefined,
  active: boolean,
  x: number,
  y: number,
): void {
  if (!channelId) return;
  const color = channelColor(channelId);
  ctx.save();
  ctx.fillStyle = '#172033';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = active ? 14 : 0;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (active) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function overlappingDynamicBodies(sensor: GameBody, physics: PhysicsWorld): GameBody[] {
  return Matter.Query.collides(sensor, physics.dynamicBodies).map((collision) => (
    collision.bodyA.id === sensor.id ? collision.bodyB : collision.bodyA
  ) as GameBody);
}
