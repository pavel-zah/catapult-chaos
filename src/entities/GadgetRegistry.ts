import type { GadgetSpawnConfig } from '../levels/schema';
import type { GadgetFactoryContext, GadgetInstance } from './types';

export type GadgetFactory = (spawn: GadgetSpawnConfig, context: GadgetFactoryContext) => GadgetInstance;

/** Keeps factories fully typed while the registry stores one common factory signature. */
export function defineGadgetFactory<T extends GadgetSpawnConfig['type']>(
  type: T,
  factory: (spawn: Extract<GadgetSpawnConfig, { type: T }>, context: GadgetFactoryContext) => GadgetInstance,
): GadgetFactory {
  return (spawn, context) => {
    if (spawn.type !== type) throw new Error(`Gadget "${spawn.id}" must have type "${type}".`);
    return factory(spawn as Extract<GadgetSpawnConfig, { type: T }>, context);
  };
}

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
