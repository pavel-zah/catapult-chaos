import type { BlockDefinition } from './types';

export class BlockRegistry {
  private definitions = new Map<string, BlockDefinition>();

  register(definition: BlockDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Block "${definition.id}" is already registered.`);
    }
    this.definitions.set(definition.id, definition);
  }

  get(id: string): BlockDefinition {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`Unknown block "${id}".`);
    return definition;
  }
}

export const DEFAULT_BLOCKS: BlockDefinition[] = [
  {
    id: 'glass', name: 'Стекло', density: 0.0015, hp: 20, damageThreshold: 7,
    restitution: 0.12, friction: 0.25, color: '#a5f3fc', stroke: '#e0f2fe',
    particleColor: '#cffafe', score: 100,
  },
  {
    id: 'wood', name: 'Дерево', density: 0.0028, hp: 65, damageThreshold: 16,
    restitution: 0.08, friction: 0.65, color: '#b97842', stroke: '#713f21',
    particleColor: '#d6a06b', score: 150,
  },
  {
    id: 'stone', name: 'Камень', density: 0.006, hp: 145, damageThreshold: 34,
    restitution: 0.03, friction: 0.8, color: '#7b8494', stroke: '#424b5c',
    particleColor: '#aab2c0', score: 250,
  },
  {
    id: 'tnt', name: 'Динамит', density: 0.002, hp: 24, damageThreshold: 9,
    restitution: 0.1, friction: 0.55, color: '#e64b45', stroke: '#7f1d1d',
    particleColor: '#fb923c', score: 200,
    explosion: {
      radius: 235,
      impulse: 23,
      baseDamage: 95,
      minDamage: 25,
      chainDelaysMs: [80, 100, 120],
    },
  },
  {
    id: 'static', name: 'Несокрушимая платформа', density: 0.005, hp: Infinity,
    damageThreshold: Infinity, restitution: 0.05, friction: 0.85,
    color: '#3e4c59', stroke: '#202b36', particleColor: '#64748b', score: 0, isStatic: true,
  },
];
