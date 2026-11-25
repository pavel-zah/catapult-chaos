import Matter from 'matter-js';
import { SLINGSHOT } from '../constants';
import type { GameBody } from '../entities/types';

export class Slingshot {
  readonly anchor: Matter.Vector;
  private body: GameBody | null = null;
  private pullVector: Matter.Vector = { x: 0, y: 0 };
  dragging = false;

  constructor(anchor: Matter.Vector) {
    this.anchor = { ...anchor };
  }

  get loadedBody(): GameBody | null {
    return this.body;
  }

  get pull(): Matter.Vector {
    return { ...this.pullVector };
  }

  load(body: GameBody): void {
    this.body = body;
    this.pullVector = { x: 0, y: 0 };
    Matter.Body.setPosition(body, this.anchor);
  }

  begin(pointer: Matter.Vector): boolean {
    if (!this.body) return false;
    const distance = Matter.Vector.magnitude(Matter.Vector.sub(pointer, this.body.position));
    if (distance > Math.max(115, this.body.circleRadius ?? 0) + 45) return false;
    this.dragging = true;
    this.update(pointer);
    return true;
  }

  update(pointer: Matter.Vector): void {
    if (!this.dragging || !this.body) return;
    const raw = Matter.Vector.sub(pointer, this.anchor);
    const length = Matter.Vector.magnitude(raw);
    const limited = length > SLINGSHOT.maxStretch
      ? Matter.Vector.mult(raw, SLINGSHOT.maxStretch / length)
      : raw;
    this.pullVector = limited;
    Matter.Body.setPosition(this.body, Matter.Vector.add(this.anchor, limited));
  }

  release(): Matter.Vector | null {
    if (!this.dragging || !this.body) return null;
    this.dragging = false;
    const stretch = Matter.Vector.magnitude(this.pullVector);
    if (stretch < SLINGSHOT.minStretch) {
      this.pullVector = { x: 0, y: 0 };
      Matter.Body.setPosition(this.body, this.anchor);
      return null;
    }
    const velocity = Matter.Vector.mult(this.pullVector, -SLINGSHOT.launchPower);
    this.pullVector = { x: 0, y: 0 };
    return velocity;
  }

  unload(): void {
    this.body = null;
    this.dragging = false;
    this.pullVector = { x: 0, y: 0 };
  }

  trajectory(gravityScale: number): Matter.Vector[] {
    if (!this.dragging || !this.body) return [];
    const position = { ...this.body.position };
    const velocity = Matter.Vector.mult(this.pullVector, -SLINGSHOT.launchPower);
    const points: Matter.Vector[] = [];
    for (let step = 0; step < SLINGSHOT.trajectorySteps; step += 1) {
      velocity.y += 0.277 * gravityScale;
      position.x += velocity.x;
      position.y += velocity.y;
      if (step % SLINGSHOT.trajectoryStride === 0) points.push({ ...position });
      if (position.y > 1080 || position.x > 1920) break;
    }
    return points;
  }
}
