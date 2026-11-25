import type { Vector } from 'matter-js';
import type { Camera } from './Camera';

export interface PointerSample {
  screen: Vector;
  world: Vector;
  deltaScreen: Vector;
  pointerType: string;
}

interface InputHandlers {
  down: (sample: PointerSample) => void;
  move: (sample: PointerSample) => void;
  up: (sample: PointerSample) => void;
}

/** Pointer Events cover mouse, pen and touch with the same world-coordinate pipeline. */
export class InputManager {
  private activePointer: number | null = null;
  private previousScreen: Vector = { x: 0, y: 0 };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly handlers: InputHandlers,
  ) {
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private sample(event: PointerEvent): PointerSample {
    const rect = this.canvas.getBoundingClientRect();
    const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const sample = {
      screen,
      world: this.camera.screenToWorld(screen),
      deltaScreen: {
        x: screen.x - this.previousScreen.x,
        y: screen.y - this.previousScreen.y,
      },
      pointerType: event.pointerType,
    };
    this.previousScreen = screen;
    return sample;
  }

  private onDown = (event: PointerEvent): void => {
    if (this.activePointer !== null) return;
    event.preventDefault();
    this.activePointer = event.pointerId;
    this.canvas.setPointerCapture(event.pointerId);
    const rect = this.canvas.getBoundingClientRect();
    this.previousScreen = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.handlers.down(this.sample(event));
  };

  private onMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer) return;
    event.preventDefault();
    this.handlers.move(this.sample(event));
  };

  private onUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer) return;
    event.preventDefault();
    this.handlers.up(this.sample(event));
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.activePointer = null;
  };
}
