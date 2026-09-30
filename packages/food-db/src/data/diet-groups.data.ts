import { NormalizedFood } from '../types.js';

/**
 * Sections for the Diet & Basics list.
 *
 * The list is ~280 items and was rendered flat, so a tomato, a bottle of olive
 * oil and a plate of daal chawal sat in one undifferentiated scroll. Grouping
 * is what makes an ingredient catalogue usable: you look for "fruit", not for
 * the 41st row.
 *
 * Derived from the id prefix, which already encodes the source file, rather
 * than from a new field on 280 rows. The one exception is `diet_basic`, the
 * original file, which predates the split and mixes fruit, vegetables, dairy,
 * grains and oil under one 'Basics' tag — that one is resolved by tag.
 */
export type DietGroup =
  | 'meals'
  | 'protein'
  | 'vegetables'
  | 'fruits'
  | 'legumes'
  | 'grains'
  | 'dairy'
  | 'soups'
  | 'salads'
  | 'beverages'
  | 'snacks'
  | 'nuts_seeds'
  | 'extras';

/**
 * Display order. Whole meals and proteins first because that is what someone
 * opening the logger is usually looking for; `extras` — oils, sugar, dressings
 * — last, because they are things you add to a dish rather than log alone.
 */
export const DIET_GROUP_ORDER: DietGroup[] = [
  'meals',
  'protein',
  'vegetables',
  'fruits',
  'legumes',
  'grains',
  'dairy',
  'soups',
  'salads',
  'beverages',
  'snacks',
  'nuts_seeds',
  'extras',
];

const GROUP_BY_PREFIX: Record<string, DietGroup> = {
  diet_pk: 'meals',
  diet_arab: 'meals',
  diet_brk: 'meals',
  diet_global: 'meals',
  diet_egg: 'protein',
  diet_meat: 'protein',
  diet_sea: 'protein',
  diet_veg: 'vegetables',
  diet_fruit: 'fruits',
  diet_leg: 'legumes',
  diet_grain: 'grains',
  diet_dairy: 'dairy',
  diet_soup: 'soups',
  diet_salad: 'salads',
  diet_bev: 'beverages',
  diet_snack: 'snacks',
  diet_nut: 'nuts_seeds',
  diet_dress: 'extras',
  diet_fat: 'extras',
};

/** Names in the legacy file that its tags cannot place. */
const LEGACY_EXTRAS = new Set(['Olive Oil', 'Peanut Butter']);
const LEGACY_NUTS = new Set(['Almonds', 'Walnuts']);
const LEGACY_GRAINS = new Set([
  'Boiled White Rice (Plain)',
  'Boiled Brown Rice',
  'Plain Roti / Chapati (No Ghee)',
  'Brown Bread',
  'Oats (Dry)',
  'Boiled Potato',
  'Boiled Sweet Potato',
]);
const LEGACY_LEGUMES = new Set([
  'Boiled Chickpeas (Plain Chana)',
  'Plain Boiled Daal (No Tarka)',
]);
const LEGACY_DAIRY = new Set([
  'Greek Yogurt (Plain, Non-Fat)',
  'Greek Yogurt (Plain, Full Fat)',
  'Plain Yogurt / Dahi',
  'Milk (Full Fat)',
  'Milk (Skim / Low Fat)',
  'Paneer / Cottage Cheese',
  'Low-Fat Cottage Cheese',
]);

/** Which section of the Diet & Basics list a food belongs in. */
export function getDietGroup(food: NormalizedFood): DietGroup {
  const prefix = (food.id ?? '').replace(/_\d+$/, '');
  const byPrefix = GROUP_BY_PREFIX[prefix];
  if (byPrefix) return byPrefix;

  // Legacy diet-basics: named sets first, then tags.
  if (LEGACY_EXTRAS.has(food.name)) return 'extras';
  if (LEGACY_NUTS.has(food.name)) return 'nuts_seeds';
  if (LEGACY_GRAINS.has(food.name)) return 'grains';
  if (LEGACY_LEGUMES.has(food.name)) return 'legumes';
  if (LEGACY_DAIRY.has(food.name)) return 'dairy';

  const tags = food.cuisineTags ?? [];
  if (tags.includes('Fruit')) return 'fruits';
  if (tags.includes('Vegetable')) return 'vegetables';
  if (tags.includes('Protein')) return 'protein';

  return 'extras';
}

export interface DietGroupSection {
  group: DietGroup;
  foods: NormalizedFood[];
}

/** The Diet & Basics list split into display sections, empty groups dropped. */
export function groupDietFoods(foods: NormalizedFood[]): DietGroupSection[] {
  const buckets = new Map<DietGroup, NormalizedFood[]>();
  for (const food of foods) {
    const group = getDietGroup(food);
    const bucket = buckets.get(group);
    if (bucket) bucket.push(food);
    else buckets.set(group, [food]);
  }

  return DIET_GROUP_ORDER.filter((g) => (buckets.get(g)?.length ?? 0) > 0).map((group) => ({
    group,
    foods: buckets.get(group)!,
  }));
}
