import { FoodModifier, NormalizedFood } from '../types.js';
import { DRESSING_MODIFIERS } from './diet-dressings.data.js';

/**
 * Add-on modifiers: the spoon of ghee, the sugar in the chai, the slice of
 * cheese. Things a person puts on food *after* the dish's own macros were
 * settled, and which therefore appear in no dish's figures.
 *
 * Attached as modifiers rather than shipped as more catalogue rows, because a
 * modifier scales. Ten entries here reach every one of the ~280 Diet & Basics
 * foods; ten new rows would have covered ten foods. It also avoids the
 * combinatorial version of the same catalogue — "Roti", "Roti with Ghee",
 * "Roti with Extra Ghee" — which is how a food database stops being usable.
 *
 * Every figure is derived from the matching standalone food in
 * diet-fats-sweeteners.data.ts and diet-dairy.data.ts at the stated weight, so
 * logging "roti + 1 tsp ghee" and logging "roti" and "1 tsp ghee" separately
 * can never disagree. A test asserts exactly that.
 */

/** Fats people add to savoury food: roti, rice, daal, sabzi, meat. */
export const FAT_MODIFIERS: FoodModifier[] = [
  {
    id: 'addon_ghee_tsp',
    name: '+ 1 tsp Desi Ghee',
    nameUr: '+ 1 چھوٹا چمچ دیسی گھی',
    nameAr: '+ ملعقة صغيرة سمن',
    calories: 45,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 5,
  },
  {
    id: 'addon_ghee_tbsp',
    name: '+ 1 tbsp Desi Ghee',
    nameUr: '+ 1 کھانے کا چمچ دیسی گھی',
    nameAr: '+ ملعقة كبيرة سمن',
    calories: 125,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 13.9,
  },
  {
    id: 'addon_butter_tsp',
    name: '+ 1 tsp Butter',
    nameUr: '+ 1 چھوٹا چمچ مکھن',
    nameAr: '+ ملعقة صغيرة زبدة',
    calories: 37,
    proteinGrams: 0.1,
    carbGrams: 0,
    fatGrams: 4.1,
  },
  {
    id: 'addon_oil_tsp',
    name: '+ 1 tsp Cooking Oil',
    nameUr: '+ 1 چھوٹا چمچ تیل',
    nameAr: '+ ملعقة صغيرة زيت',
    calories: 45,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 5,
  },
  {
    id: 'addon_oil_tbsp',
    name: '+ 1 tbsp Cooking Oil',
    nameUr: '+ 1 کھانے کا چمچ تیل',
    nameAr: '+ ملعقة كبيرة زيت',
    calories: 126,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 14,
  },
];

/** Sweeteners people add to chai, coffee, dahi, oats, fruit. */
export const SWEETENER_MODIFIERS: FoodModifier[] = [
  {
    id: 'addon_sugar_tsp',
    name: '+ 1 tsp Sugar',
    nameUr: '+ 1 چھوٹا چمچ چینی',
    nameAr: '+ ملعقة صغيرة سكر',
    calories: 16,
    proteinGrams: 0,
    carbGrams: 4,
    fatGrams: 0,
  },
  {
    id: 'addon_sugar_2tsp',
    name: '+ 2 tsp Sugar',
    nameUr: '+ 2 چھوٹے چمچ چینی',
    nameAr: '+ ملعقتان صغيرتان سكر',
    calories: 32,
    proteinGrams: 0,
    carbGrams: 8,
    fatGrams: 0,
  },
  {
    id: 'addon_honey_tsp',
    name: '+ 1 tsp Honey',
    nameUr: '+ 1 چھوٹا چمچ شہد',
    nameAr: '+ ملعقة صغيرة عسل',
    calories: 23,
    proteinGrams: 0,
    carbGrams: 5.8,
    fatGrams: 0,
  },
  {
    id: 'addon_gur_piece',
    name: '+ 1 piece Gur',
    nameUr: '+ 1 ٹکڑا گڑ',
    nameAr: '+ قطعة سكر قصب',
    calories: 39,
    proteinGrams: 0,
    carbGrams: 9.8,
    fatGrams: 0,
  },
];

/** Dairy people add on top: cheese on eggs or toast, malai in chai. */
export const DAIRY_ADDON_MODIFIERS: FoodModifier[] = [
  {
    id: 'addon_cheese_slice',
    name: '+ 1 slice Cheese',
    nameUr: '+ 1 سلائس چیز',
    nameAr: '+ شريحة جبن',
    calories: 113,
    proteinGrams: 7,
    carbGrams: 0.4,
    fatGrams: 9.3,
  },
  {
    id: 'addon_malai_tbsp',
    name: '+ 1 tbsp Malai',
    nameUr: '+ 1 چمچ ملائی',
    nameAr: '+ ملعقة قشطة',
    calories: 53,
    proteinGrams: 0.3,
    carbGrams: 0.4,
    fatGrams: 5.6,
  },
];

/**
 * Which add-ons suit a food.
 *
 * - `savoury`  roti, rice, daal, sabzi, meat, eggs — ghee, oil, butter, cheese
 * - `sweet`    chai, coffee, dahi, oats, fruit — sugar, honey, gur
 * - `salad`    the dressings in diet-dressings.data.ts
 * - `none`     the add-ons themselves, plus nuts and snacks. Offering "+1 tsp
 *              ghee" on a jar of ghee is noise, and so is sugaring almonds.
 */
export type DietAddOnClass = 'savoury' | 'sweet' | 'salad' | 'none';

const MODIFIERS_BY_CLASS: Record<DietAddOnClass, FoodModifier[]> = {
  savoury: [...FAT_MODIFIERS, ...DAIRY_ADDON_MODIFIERS],
  sweet: [...SWEETENER_MODIFIERS, DAIRY_ADDON_MODIFIERS[1]],
  salad: DRESSING_MODIFIERS,
  none: [],
};

/**
 * diet-basics.data.ts predates the per-category split, so it files rice, roti,
 * olive oil, almonds and yogurt all under one 'Basics' tag. Tags alone cannot
 * tell "Plain Roti" (wants ghee) from "Olive Oil" (wants nothing), so that one
 * legacy file names its staples explicitly. Every later file is single-purpose
 * and gets its class from the file itself.
 */
const LEGACY_BASICS_SAVOURY = new Set([
  'Boiled White Rice (Plain)',
  'Boiled Brown Rice',
  'Plain Roti / Chapati (No Ghee)',
  'Brown Bread',
  'Boiled Potato',
  'Boiled Sweet Potato',
  'Boiled Chickpeas (Plain Chana)',
  'Plain Boiled Daal (No Tarka)',
]);

const LEGACY_BASICS_SWEET = new Set([
  'Greek Yogurt (Plain, Non-Fat)',
  'Greek Yogurt (Plain, Full Fat)',
  'Plain Yogurt / Dahi',
  'Milk (Full Fat)',
  'Milk (Skim / Low Fat)',
  'Oats (Dry)',
]);

/** Add-on class for an item of the legacy diet-basics file. */
export function resolveLegacyBasicsClass(food: NormalizedFood): DietAddOnClass {
  if (LEGACY_BASICS_SAVOURY.has(food.name)) return 'savoury';
  if (LEGACY_BASICS_SWEET.has(food.name)) return 'sweet';

  const tags = food.cuisineTags;
  if (tags.includes('Fruit')) return 'sweet';
  if (tags.includes('Vegetable')) return 'savoury';
  // Eggs, chicken, fish, paneer — but also whey powder, which is why the
  // sweet set above claims the dairy first.
  if (tags.includes('Protein')) return 'savoury';

  // Almonds, walnuts, peanut butter, olive oil: nothing sensible to add.
  return 'none';
}

/** The modifiers a diet food should offer, for a given add-on class. */
export function getDietAddOnModifiers(cls: DietAddOnClass): FoodModifier[] {
  return MODIFIERS_BY_CLASS[cls];
}

/** Every add-on modifier defined here, for tests and for UI that lists them. */
export const ALL_DIET_ADDON_MODIFIERS: FoodModifier[] = [
  ...FAT_MODIFIERS,
  ...SWEETENER_MODIFIERS,
  ...DAIRY_ADDON_MODIFIERS,
];
