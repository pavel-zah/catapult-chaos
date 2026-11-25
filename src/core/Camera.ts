import type { Vector } from 'matter-js';

export type CameraMode = 'overview' | 'follow' | 'manual';

export class Camera {
  private viewport = { width: 1, height: 1 };
  private bounds = { width: 1920, height: 1080 };
  private center: Vector = { x: 960, y: 540 };
  private targetCenter: Vector = { x: 960, y: 540 };
  private zoom = 1;
  private targetZoom = 1;
  private shakeStrength = 0;
  private shakeOffset: Vector = { x: 0, y: 0 };
  private followTarget: (() => Vector | null) | null = null;
  mode: CameraMode = 'overview';

  resize(width: number, height: number): void {
    this.viewport = { width, height };
    this.clampCenter();
  }

  setBounds(width: number, height: number): void {
    this.bounds = { width, height };
    this.overview(true);
  }

  setFollowTarget(provider: () => Vector | null): void {
    this.followTarget = provider;
  }

  get position(): Vector {
    return { ...this.center };
  }

  get scale(): number {
    return this.baseScale * this.zoom;
  }

  private get baseScale(): number {
    return Math.min(this.viewport.width / this.bounds.width, this.viewport.height / this.bounds.height);
  }

  overview(immediate = false): void {
    this.mode = 'overview';
    this.targetCenter = { x: this.bounds.width / 2, y: this.bounds.height / 2 };
    this.targetZoom = 1;
    if (immediate) {
      this.center = { ...this.targetCenter };
      this.zoom = this.targetZoom;
    }
  }

  follow(): void {
    this.mode = 'follow';
    this.targetZoom = 1.16;
  }

  toggleOverview(): void {
    if (this.mode === 'overview') this.follow();
    else this.overview();
  }

  panByScreenDelta(delta: Vector): void {
    this.mode = 'manual';
    this.targetZoom = Math.max(1, this.targetZoom);
    this.targetCenter.x -= delta.x / this.scale;
    this.targetCenter.y -= delta.y / this.scale;
    this.clampTarget();
  }

  shake(strength: number): void {
    this.shakeStrength = Math.min(28, Math.max(this.shakeStrength, strength));
  }

  update(deltaMs: number): void {
    if (this.mode === 'follow') {
      const target = this.followTarget?.();
      if (target) {
        this.targetCenter = {
          x: target.x + 180,
          y: target.y - 70,
        };
      }
    }
    this.clampTarget();
    const smoothing = 1 - Math.exp(-deltaMs * 0.007);
    this.center.x += (this.targetCenter.x - this.center.x) * smoothing;
    this.center.y += (this.targetCenter.y - this.center.y) * smoothing;
    this.zoom += (this.targetZoom - this.zoom) * smoothing;
    this.clampCenter();

    this.shakeStrength *= Math.exp(-deltaMs * 0.014);
    if (this.shakeStrength < 0.05) this.shakeStrength = 0;
    this.shakeOffset = {
      x: (Math.random() * 2 - 1) * this.shakeStrength,
      y: (Math.random() * 2 - 1) * this.shakeStrength,
    };
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.translate(
      this.viewport.width / 2 + this.shakeOffset.x,
      this.viewport.height / 2 + this.shakeOffset.y,
    );
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.center.x, -this.center.y);
  }

  screenToWorld(screen: Vector): Vector {
    return {
      x: (screen.x - this.viewport.width / 2 - this.shakeOffset.x) / this.scale + this.center.x,
      y: (screen.y - this.viewport.height / 2 - this.shakeOffset.y) / this.scale + this.center.y,
    };
  }

  private clampTarget(): void {
    this.targetCenter = this.clamped(this.targetCenter, this.targetZoom);
  }

  private clampCenter(): void {
    this.center = this.clamped(this.center, this.zoom);
  }

  private clamped(point: Vector, zoom: number): Vector {
    const scale = this.baseScale * zoom;
    const halfWidth = this.viewport.width / scale / 2;
    const halfHeight = this.viewport.height / scale / 2;
    return {
      x: halfWidth * 2 >= this.bounds.width
        ? this.bounds.width / 2
        : Math.max(halfWidth, Math.min(this.bounds.width - halfWidth, point.x)),
      y: halfHeight * 2 >= this.bounds.height
        ? this.bounds.height / 2
        : Math.max(halfHeight, Math.min(this.bounds.height - halfHeight, point.y)),
    };
  }
}
