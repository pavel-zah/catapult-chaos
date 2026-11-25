import type { GadgetRegistry } from '../GadgetRegistry';
import { createTrampoline } from './Trampoline';
import { createPortal } from './Portal';
import { createGoalZone } from './GoalZone';
import { createBonusFish } from './BonusFish';

export function registerDefaultGadgets(registry: GadgetRegistry): void {
  registry.register('trampoline', createTrampoline);
  registry.register('portal', createPortal);
  registry.register('goal_zone', createGoalZone);
  registry.register('bonus_fish', createBonusFish);
}
