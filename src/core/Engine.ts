import { WORLD } from '../constants';

interface EngineCallbacks {
  fixedUpdate: (stepMs: number, timeMs: number) => void;
  render: (timeMs: number, fps: number) => void;
}

/** requestAnimationFrame renderer with a deterministic 60 Hz Matter simulation. */
export class Engine {
  private animationId = 0;
  private previousTime = 0;
  private accumulator = 0;
  private hitstopRemaining = 0;
  private simulationTime = 0;
  private fps = 60;

  constructor(private readonly callbacks: EngineCallbacks) {}

  get timeMs(): number {
    return this.simulationTime;
  }

  get currentFps(): number {
    return this.fps;
  }

  start(): void {
    this.previousTime = performance.now();
    this.animationId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  hitstop(durationMs: number): void {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs);
  }

  private frame = (now: number): void => {
    const rawDelta = Math.min(now - this.previousTime, WORLD.maxFrameMs);
    this.previousTime = now;
    if (rawDelta > 0) this.fps += ((1000 / rawDelta) - this.fps) * 0.08;

    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= rawDelta;
    } else {
      this.accumulator += rawDelta;
      while (this.accumulator >= WORLD.fixedStepMs) {
        this.simulationTime += WORLD.fixedStepMs;
        this.callbacks.fixedUpdate(WORLD.fixedStepMs, this.simulationTime);
        this.accumulator -= WORLD.fixedStepMs;
      }
    }

    this.callbacks.render(this.simulationTime, this.fps);
    this.animationId = requestAnimationFrame(this.frame);
  };
}
