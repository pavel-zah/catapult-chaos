import type { GadgetRegistry } from '../GadgetRegistry';
import { createTrampoline } from './Trampoline';
import { createPortal } from './Portal';
import { createGoalZone } from './GoalZone';
import { createBonusFish } from './BonusFish';
import { createButton } from './Button';
import { createPressurePlate } from './PressurePlate';
import { createDoor } from './Door';
import { createTrapdoor } from './Trapdoor';
import { createFan } from './Fan';
import { createGravityZone } from './GravityZone';
import { createSeesaw } from './Seesaw';
import { createRope } from './Rope';
import { createLaser } from './Laser';

export function registerDefaultGadgets(registry: GadgetRegistry): void {
  registry.register('trampoline', createTrampoline);
  registry.register('portal', createPortal);
  registry.register('goal_zone', createGoalZone);
  registry.register('bonus_fish', createBonusFish);
  registry.register('button', createButton);
  registry.register('pressure_plate', createPressurePlate);
  registry.register('door', createDoor);
  registry.register('trapdoor', createTrapdoor);
  registry.register('fan', createFan);
  registry.register('gravity_zone', createGravityZone);
  registry.register('seesaw', createSeesaw);
  registry.register('rope', createRope);
  registry.register('laser', createLaser);
}
