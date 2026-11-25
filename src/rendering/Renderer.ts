import type { Vector } from 'matter-js';
import type { Camera } from '../core/Camera';
import type { ParticleSystem } from '../core/ParticleSystem';
import type { Slingshot } from '../gameplay/Slingshot';
import type { LevelData } from '../levels/schema';
import type { CatRegistry } from '../entities/CatRegistry';
import type { BlockRegistry } from '../entities/BlockRegistry';
import type { CatEntity, GadgetInstance, GameBody } from '../entities/types';
import { CatRenderer } from './CatRenderer';
import { DebugRenderer } from './DebugRenderer';

export interface RenderModel {
  level: LevelData;
  bodies: GameBody[];
  cats: Map<number, CatEntity>;
  gadgets: Map<string, GadgetInstance>;
  slingshot: Slingshot;
  gravityScale: number;
  previousTrails: Vector[][];
  currentTrail: Vector[];
  particles: ParticleSystem;
  now: number;
  fps: number;
  debug: boolean;
}

export class Renderer {
  private catRenderer = new CatRenderer();
  private debugRenderer = new DebugRenderer();
  private width = 1;
  private height = 1;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly cats: CatRegistry,
    private readonly blocks: BlockRegistry,
  ) {}

  render(model: RenderModel): void {
    this.resize();
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const background = ctx.createLinearGradient(0, 0, 0, this.height);
    background.addColorStop(0, '#172745');
    background.addColorStop(0.6, '#35547a');
    background.addColorStop(1, '#c58366');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    this.camera.apply(ctx);
    this.drawWorldBackground(ctx, model.level);
    this.drawTrails(ctx, model.previousTrails, model.currentTrail);
    for (const gadget of model.gadgets.values()) gadget.render?.({ ctx, now: model.now });
    this.drawSlingshotBack(ctx, model.slingshot);

    for (const body of model.bodies) {
      if (body.game.destroyed || body.game.kind !== 'block') continue;
      this.drawBlock(ctx, body);
    }
    for (const body of model.bodies) {
      if (body.game.destroyed) continue;
      if (body.game.kind === 'target') this.drawVacuum(ctx, body);
      if (body.game.kind === 'treasure') this.drawTreasure(ctx, body);
    }
    for (const cat of model.cats.values()) {
      if (!cat.body.game.destroyed) this.catRenderer.render(ctx, cat, this.cats.get(cat.typeId), model.now);
    }

    this.drawSlingshotFront(ctx, model.slingshot);
    if (model.slingshot.dragging) this.drawTrajectory(ctx, model.slingshot, model.gravityScale);
    model.particles.render(ctx);
    if (model.debug) this.debugRenderer.render(ctx, model.bodies);
    ctx.restore();

    if (model.debug) this.debugRenderer.renderScreen(ctx, this.width, model.fps, model.bodies.length);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(this.width * this.dpr);
    const pixelHeight = Math.round(this.height * this.dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.camera.resize(this.width, this.height);
  }

  private drawWorldBackground(ctx: CanvasRenderingContext2D, level: LevelData): void {
    const { width, height } = level.worldBounds;
    ctx.fillStyle = '#f7dfb488';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#ffffff12';
    ctx.lineWidth = 2;
    for (let x = 0; x <= width; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 120) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.fillStyle = '#1e293b33';
    for (let x = 420; x < width; x += 520) {
      ctx.beginPath();
      ctx.arc(x, 150, 65, 0, Math.PI * 2);
      ctx.arc(x + 70, 150, 48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#26374a';
    ctx.fillRect(0, height - 55, width, 55);
  }

  private drawBlock(ctx: CanvasRenderingContext2D, body: GameBody): void {
    const definition = this.blocks.get(body.game.typeId);
    const width = body.game.width ?? 40;
    const height = body.game.height ?? 40;
    const hpRatio = Math.max(0, body.game.hp / body.game.maxHp);
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = definition.color;
    ctx.strokeStyle = definition.stroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, Math.min(7, height / 5));
    ctx.fill();
    ctx.stroke();

    if (body.game.typeId === 'glass') {
      ctx.strokeStyle = '#ffffff99';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-width * 0.35, height * 0.3);
      ctx.lineTo(width * 0.25, -height * 0.35);
      ctx.stroke();
    } else if (body.game.typeId === 'wood') {
      ctx.strokeStyle = '#713f2166';
      ctx.lineWidth = 2;
      for (const y of [-0.22, 0.22]) {
        ctx.beginPath(); ctx.moveTo(-width * 0.4, height * y); ctx.lineTo(width * 0.4, height * y); ctx.stroke();
      }
    } else if (body.game.typeId === 'stone' || body.game.typeId === 'static') {
      ctx.fillStyle = '#ffffff20';
      for (const x of [-0.35, 0.35]) {
        ctx.beginPath(); ctx.arc(width * x, 0, Math.min(6, height * 0.15), 0, Math.PI * 2); ctx.fill();
      }
    } else if (body.game.typeId === 'tnt') {
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(-width / 2, -height * 0.17, width, height * 0.34);
      ctx.fillStyle = '#7f1d1d';
      ctx.font = `900 ${Math.min(28, height * 0.35)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 1);
    }

    if (hpRatio < 0.72 && body.game.typeId !== 'static') {
      ctx.strokeStyle = body.game.typeId === 'glass' ? '#f0fdff' : '#292524';
      ctx.lineWidth = 2.5;
      const cracks = hpRatio < 0.35 ? 4 : 2;
      for (let index = 0; index < cracks; index += 1) {
        const x = (index - (cracks - 1) / 2) * width * 0.18;
        ctx.beginPath();
        ctx.moveTo(x, -height * 0.45);
        ctx.lineTo(x + width * 0.08, -height * 0.08);
        ctx.lineTo(x - width * 0.05, height * 0.13);
        ctx.lineTo(x + width * 0.07, height * 0.45);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawVacuum(ctx: CanvasRenderingContext2D, body: GameBody): void {
    const radius = body.circleRadius ?? 38;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(0, -4, radius * 0.67, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(-radius * 0.25, -radius * 0.17, 5, 0, Math.PI * 2); ctx.arc(radius * 0.25, -radius * 0.17, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-radius * 0.28, radius * 0.32); ctx.lineTo(radius * 0.28, radius * 0.32); ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('VAK-9000', 0, radius * 0.65);
    ctx.restore();
  }

  private drawTreasure(ctx: CanvasRenderingContext2D, body: GameBody): void {
    const width = body.game.width ?? 96;
    const height = body.game.height ?? 78;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = '#8b4c28';
    ctx.strokeStyle = '#422006';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(-width / 2, -height / 2, width, height, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6c344';
    ctx.fillRect(-width * 0.09, -height / 2, width * 0.18, height);
    ctx.fillRect(-width / 2, -height * 0.08, width, height * 0.16);
    ctx.beginPath(); ctx.roundRect(-10, -4, 20, 25, 4); ctx.fill();
    ctx.fillStyle = '#422006'; ctx.beginPath(); ctx.arc(0, 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  private drawSlingshotBack(ctx: CanvasRenderingContext2D, slingshot: Slingshot): void {
    const { x, y } = slingshot.anchor;
    ctx.strokeStyle = '#4a2617';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 35, y + 145); ctx.lineTo(x - 12, y + 28); ctx.lineTo(x - 48, y - 55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 12, y + 28); ctx.lineTo(x + 48, y - 55); ctx.stroke();
    const loaded = slingshot.loadedBody;
    if (loaded) {
      ctx.strokeStyle = '#35251f';
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(x - 48, y - 55); ctx.lineTo(loaded.position.x, loaded.position.y); ctx.stroke();
    }
  }

  private drawSlingshotFront(ctx: CanvasRenderingContext2D, slingshot: Slingshot): void {
    const loaded = slingshot.loadedBody;
    if (!loaded) return;
    const { x, y } = slingshot.anchor;
    ctx.strokeStyle = '#5b3829';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x + 48, y - 55); ctx.lineTo(loaded.position.x, loaded.position.y); ctx.stroke();
  }

  private drawTrajectory(ctx: CanvasRenderingContext2D, slingshot: Slingshot, gravityScale: number): void {
    ctx.fillStyle = '#fff9c9cc';
    slingshot.trajectory(gravityScale).forEach((point, index) => {
      ctx.globalAlpha = Math.max(0.2, 1 - index / 28);
      ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(3, 7 - index * 0.15), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  private drawTrails(ctx: CanvasRenderingContext2D, previous: Vector[][], current: Vector[]): void {
    previous.forEach((trail, trailIndex) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.globalAlpha = 0.15 + trailIndex * 0.06;
      trail.forEach((point, index) => {
        if (index % 2 !== 0) return;
        ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, Math.PI * 2); ctx.fill();
      });
    });
    ctx.fillStyle = '#fef3c7';
    ctx.globalAlpha = 0.35;
    current.forEach((point) => { ctx.beginPath(); ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
}
