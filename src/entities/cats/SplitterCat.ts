import type { CatDefinition } from '../types';

export const splitterCat: CatDefinition = {
  id: 'splitter',
  name: 'Кот-Матрёшка',
  shortName: 'Матрёшка',
  description: 'Разделяется на четырёх быстрых котят.',
  abilityName: 'Котята-веер',
  abilityHint: 'Клик до первого удара: разделиться на четырёх котят',
  color: '#fb85b5',
  accent: '#a92c67',
  radius: 38,
  mass: 16,
  restitution: 0.3,
  friction: 0.38,
  allowAbilityAfterCollision: false,
  onAbilityActivate: ({ cat, spawnSplitCats }) => {
    spawnSplitCats(cat.body, 4);
  },
};
