import type { EventBus } from '../core/EventBus';
import type { LevelData } from '../levels/schema';

export class GoalTracker {
  private level: LevelData | null = null;
  private remainingTargets = new Set<string>();
  private deliveredZones = new Set<string>();
  private failed = false;
  private bonusCollected = false;

  constructor(events: EventBus) {
    events.on('target:destroyed', ({ body }) => {
      this.remainingTargets.delete(body.game.entityId);
    });
    events.on('treasure:destroyed', () => {
      this.failed = true;
    });
    events.on('gadget:goal', ({ gadgetId }) => {
      this.deliveredZones.add(gadgetId);
    });
    events.on('gadget:bonus', () => {
      this.bonusCollected = true;
    });
  }

  configure(level: LevelData): void {
    this.level = level;
    this.failed = false;
    this.bonusCollected = false;
    this.deliveredZones.clear();
    this.remainingTargets = new Set(
      level.targets.filter((target) => target.type === 'vacuum').map((target) => target.id),
    );
  }

  get hasFailed(): boolean {
    return this.failed;
  }

  get hasBonusFish(): boolean {
    return this.bonusCollected;
  }

  get targetsLeft(): number {
    return this.remainingTargets.size;
  }

  isWon(): boolean {
    if (!this.level || this.failed) return false;
    return this.level.goals.every((goal) => {
      if (goal.type === 'destroy_targets') {
        if (!goal.targetIds) return this.remainingTargets.size === 0;
        return goal.targetIds.every((id) => !this.remainingTargets.has(id));
      }
      if (goal.type === 'deliver_to_zone') return this.deliveredZones.has(goal.zoneId);
      return true;
    });
  }

  stars(score: number): number {
    if (!this.level || !this.isWon()) return 0;
    if (score >= this.level.starThresholds.threeStars) return 3;
    if (score >= this.level.starThresholds.twoStars) return 2;
    return 1;
  }
}
