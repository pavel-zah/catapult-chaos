import type { BlockRegistry } from './BlockRegistry';
import { DEFAULT_BLOCKS } from './BlockRegistry';

export function registerDefaultBlocks(registry: BlockRegistry): void {
  DEFAULT_BLOCKS.forEach((block) => registry.register(block));
}
