import type { GadgetSpawnConfig } from '../levels/schema';
import type { GadgetFactoryContext, GadgetInstance } from './types';

export type GadgetFactory = (spawn: GadgetSpawnConfig, context: GadgetFactoryContext) => GadgetInstance;

export class GadgetRegistry {
  private factories = new Map<string, GadgetFactory>();

  register(type: string, factory: GadgetFactory): void {
    if (this.factories.has(type)) throw new Error(`Gadget "${type}" is already registered.`);
    this.factories.set(type, factory);
  }

  create(spawn: GadgetSpawnConfig, context: GadgetFactoryContext): GadgetInstance {
    const factory = this.factories.get(spawn.type);
    if (!factory) throw new Error(`Unknown gadget "${spawn.type}".`);
    return factory(spawn, context);
  }
}
