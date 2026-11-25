import type { CatDefinition } from './types';

export class CatRegistry {
  private definitions = new Map<string, CatDefinition>();

  register(definition: CatDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Cat "${definition.id}" is already registered.`);
    }
    this.definitions.set(definition.id, definition);
  }

  get(id: string): CatDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`Unknown cat "${id}".`);
    return definition;
  }

  all(): CatDefinition[] {
    return [...this.definitions.values()];
  }
}
