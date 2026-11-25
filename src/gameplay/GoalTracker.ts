import type { EventBus } from '../core/EventBus';
import type { LevelData, LevelGoalConfig } from '../levels/schema';

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

  /** Сколько обязательных целей ещё не выполнено; бонусная рыбка не учитывается. */
  get goalsLeft(): number {
    if (!this.level) return 0;
    return this.level.goals.filter((goal) => !this.isGoalDone(goal)).length;
  }

  isWon(): boolean {
    if (!this.level || this.failed) return false;
    return this.level.goals.every((goal) => this.isGoalDone(goal));
  }

  stars(score: number): number {
    if (!this.level || !this.isWon()) return 0;
    if (score >= this.level.starThresholds.threeStars) return 3;
    if (score >= this.level.starThresholds.twoStars) return 2;
    return 1;
  }

  private isGoalDone(goal: LevelGoalConfig): boolean {
    if (goal.type === 'destroy_targets') {
      if (!goal.targetIds) return this.remainingTargets.size === 0;
      return goal.targetIds.every((id) => !this.remainingTargets.has(id));
    }
    if (goal.type === 'deliver_to_zone') return this.deliveredZones.has(goal.zoneId);
    return true;
  }
}
