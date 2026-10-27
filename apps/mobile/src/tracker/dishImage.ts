import type { ImageSourcePropType } from 'react-native';
import { DISH_IMAGES } from './dishImages.generated.js';

/**
 * The photo keys, one per broad kind of dish. A photo of one biryani stands for
 * "Rice & Biryani" but not for eggs or chicken breast, so the generic buckets
 * ("Diet & Basics", "Condiments") deliberately have no photo and fall back to
 * the plain row.
 */
export type DishImageKey = 'drinks' | 'desserts' | 'rice' | 'bbq' | 'breakfast' | 'stews' | 'fast-food';

// Order matters: the first match wins ("Rice & Meat" is rice, not a stew).
const RULES: ReadonlyArray<readonly [DishImageKey, RegExp]> = [
  ['drinks', /drink|beverage|gahwa|juice|coffee|\btea\b/],
  ['desserts', /dessert|sweet/],
  ['rice', /biryani|rice|pulao|kabsa/],
  ['bbq', /bbq|grill|kebab|tikka/],
  ['breakfast', /breakfast|nashta|street|chaat/],
  ['stews', /stew|daal|\bdal\b|curry|karahi|haleem|vegetable/],
  ['fast-food', /fast food|burger|pizza/],
];

export function dishImageKey(category: string | undefined): DishImageKey | undefined {
  if (!category) return undefined;
  const text = category.toLowerCase();
  return RULES.find(([, pattern]) => pattern.test(text))?.[0];
}

/** The bundled photo for a category, or undefined when there is none yet. */
export function dishImageSource(category: string | undefined): ImageSourcePropType | undefined {
  const key = dishImageKey(category);
  return key ? DISH_IMAGES[key] : undefined;
}
