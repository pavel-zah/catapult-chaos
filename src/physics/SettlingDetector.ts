import { SETTLING } from '../constants';
import type { GameBody } from '../entities/types';

export class SettlingDetector {
  private launchedAt = 0;
  private firstImpactAt: number | null = null;
  private stableSince: number | null = null;
  private active = false;

  start(now: number): void {
    this.launchedAt = now;
    this.firstImpactAt = null;
    this.stableSince = null;
    this.active = true;
  }

  stop(): void {
    this.active = false;
  }

  notifyImpact(now: number): void {
    if (this.active && this.firstImpactAt === null) this.firstImpactAt = now;
  }

  update(bodies: GameBody[], now: number): boolean {
    if (!this.active) return false;
    const moving = bodies.some((body) =>
      !body.isSleeping
      && (Math.hypot(body.velocity.x, body.velocity.y) > SETTLING.speedThreshold
        || Math.abs(body.angularVelocity) > SETTLING.angularSpeedThreshold),
    );

    if (moving) this.stableSince = null;
    else if (this.stableSince === null) this.stableSince = now;

    const stableLongEnough = this.stableSince !== null && now - this.stableSince >= SETTLING.stableMs;
    const impactTimedOut = this.firstImpactAt !== null
      && now - this.firstImpactAt >= SETTLING.timeoutAfterImpactMs;
    const absoluteTimedOut = now - this.launchedAt >= SETTLING.absoluteTimeoutMs;
    if (stableLongEnough || impactTimedOut || absoluteTimedOut) {
      this.stop();
      return true;
    }
    return false;
  }
}
