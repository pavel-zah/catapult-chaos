import type { CatRegistry } from '../CatRegistry';
import { classicCat } from './ClassicCat';
import { anvilCat } from './AnvilCat';
import { bouncyCat } from './BouncyCat';
import { splitterCat } from './SplitterCat';
import { magnetCat } from './MagnetCat';

export function registerDefaultCats(registry: CatRegistry): void {
  [classicCat, anvilCat, bouncyCat, splitterCat, magnetCat].forEach((cat) => registry.register(cat));
}
