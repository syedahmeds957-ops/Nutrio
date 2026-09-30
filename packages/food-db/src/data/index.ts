import { NormalizedFood, RestaurantBrand, RegionCode } from '../types.js';
import { BBQ_GRILLS_DATA } from './bbq-grills.data.js';
import { KARAHI_HANDI_DATA } from './karahi-handi.data.js';
import { RICE_BIRYANI_DATA } from './rice-biryani.data.js';
import { SLOW_COOKED_CURRIES_DATA } from './slow-cooked-curries.data.js';
import { NASHTA_BREAKFAST_DATA } from './nashta-breakfast.data.js';
import { STREET_FOOD_CHAAT_DATA } from './street-food-chaat.data.js';
import { VEGETABLES_DAAL_DATA } from './vegetables-daal.data.js';
import { PAKISTANI_FAST_FOOD_DATA } from './pakistani-fast-food.data.js';
import { SWEETS_DESSERTS_DATA } from './sweets-desserts.data.js';
import { BEVERAGES_DRINKS_DATA } from './beverages-drinks.data.js';
import { CALORIFY_RESTAURANTS_DATA, CALORIFY_BRANDS } from './calorify-restaurants.data.js';
import {
  PAKISTANI_EXPANDED_BRANDS,
  PAKISTANI_EXPANDED_RESTAURANTS_DATA,
} from './pakistani-restaurants-expanded.data.js';
import { SAUDI_TRADITIONAL_FOODS } from './saudi-traditional.data.js';
import {
  SAUDI_RESTAURANT_BRANDS,
  SAUDI_RESTAURANTS_DATA,
} from './saudi-restaurants.data.js';
import { DIET_BASICS_DATA } from './diet-basics.data.js';
import { DIET_BEVERAGES_DATA } from './diet-beverages.data.js';
import { DIET_SALADS_DATA } from './diet-salads.data.js';
import { DIET_DRESSINGS_DATA, DRESSING_MODIFIERS } from './diet-dressings.data.js';
import { DIET_ARABIC_DATA } from './diet-arabic.data.js';
import { DIET_PAKISTANI_DATA } from './diet-pakistani.data.js';
import { DIET_SOUPS_DATA } from './diet-soups.data.js';
import { DIET_BREAKFAST_DATA } from './diet-breakfast.data.js';
import { DIET_SNACKS_DATA } from './diet-snacks.data.js';
import { DIET_EGGS_DATA } from './diet-eggs.data.js';
import { DIET_FATS_SWEETENERS_DATA } from './diet-fats-sweeteners.data.js';
import { DIET_FRUITS_DATA } from './diet-fruits.data.js';
import { DIET_LEGUMES_DATA } from './diet-legumes.data.js';
import { DIET_VEGETABLES_DATA } from './diet-vegetables.data.js';
import { DIET_MEAT_DATA } from './diet-meat.data.js';
import { DIET_SEAFOOD_DATA } from './diet-seafood.data.js';
import { DIET_DAIRY_DATA } from './diet-dairy.data.js';
import { DIET_GRAINS_DATA } from './diet-grains.data.js';
import { DIET_NUTS_SEEDS_DATA } from './diet-nuts-seeds.data.js';
import {
  getDietAddOnModifiers,
  resolveLegacyBasicsClass,
  type DietAddOnClass,
} from './diet-modifiers.data.js';

export * from './bbq-grills.data.js';
export * from './karahi-handi.data.js';
export * from './rice-biryani.data.js';
export * from './slow-cooked-curries.data.js';
export * from './nashta-breakfast.data.js';
export * from './street-food-chaat.data.js';
export * from './vegetables-daal.data.js';
export * from './pakistani-fast-food.data.js';
export * from './sweets-desserts.data.js';
export * from './beverages-drinks.data.js';
export * from './calorify-restaurants.data.js';
export * from './pakistani-restaurants-expanded.data.js';
export * from './saudi-traditional.data.js';
export * from './saudi-restaurants.data.js';
export * from './diet-basics.data.js';
export * from './diet-beverages.data.js';
export * from './diet-salads.data.js';
export * from './diet-dressings.data.js';
export * from './diet-arabic.data.js';
export * from './diet-pakistani.data.js';
export * from './diet-soups.data.js';
export * from './diet-breakfast.data.js';
export * from './diet-snacks.data.js';
export * from './diet-eggs.data.js';
export * from './diet-fats-sweeteners.data.js';
export * from './diet-fruits.data.js';
export * from './diet-legumes.data.js';
export * from './diet-vegetables.data.js';
export * from './diet-meat.data.js';
export * from './diet-seafood.data.js';
export * from './diet-dairy.data.js';
export * from './diet-grains.data.js';
export * from './diet-nuts-seeds.data.js';
export * from './diet-modifiers.data.js';

export const PAKISTANI_RESTAURANT_BRANDS: RestaurantBrand[] = [
  ...CALORIFY_BRANDS,
  ...PAKISTANI_EXPANDED_BRANDS,
];

// Unified brands list across all supported regions
export const ALL_RESTAURANT_BRANDS: RestaurantBrand[] = [
  ...PAKISTANI_RESTAURANT_BRANDS,
  ...SAUDI_RESTAURANT_BRANDS,
];

/**
 * Diet & Basics foods, shared by every region. Ids are assigned here once so the
 * same item keeps one identity in both regional catalogues.
 *
 * Each source file gets its own id prefix rather than one running counter over
 * the concatenation: a counter would renumber every later item whenever a food
 * is inserted into an earlier file, silently breaking the ids already written
 * into users' saved diaries.
 */
const withDietIds = (
  data: NormalizedFood[],
  prefix: string,
  /**
   * Which add-ons this file's foods offer. A file is the right place to decide
   * it because each one is single-purpose — every row in diet-beverages is
   * something you might sugar, every row in diet-vegetables is something you
   * might put ghee on. The one exception is `diet_basic`, which predates the
   * split and mixes categories, so it resolves per item instead.
   */
  addOns: DietAddOnClass | ((food: NormalizedFood) => DietAddOnClass)
): NormalizedFood[] =>
  data.map((item, idx) => {
    const cls = typeof addOns === 'function' ? addOns(item) : addOns;
    const modifiers = item.modifiers ?? getDietAddOnModifiers(cls);
    return {
      ...item,
      id: item.id || `${prefix}_${idx + 1}`,
      region: 'GLOBAL' as RegionCode,
      // Left undefined rather than set to [] so `getDishCustomizationModifiers`
      // can still fall back to its taxonomy for anything we classify as 'none'.
      ...(modifiers.length > 0 ? { modifiers } : {}),
    };
  });

export const DIET_BASICS_CATALOG: NormalizedFood[] = [
  ...withDietIds(DIET_BASICS_DATA, 'diet_basic', resolveLegacyBasicsClass),
  ...withDietIds(DIET_BEVERAGES_DATA, 'diet_bev', 'sweet'),
  ...withDietIds(DIET_SALADS_DATA, 'diet_salad', 'salad'),
  // The add-ons themselves: nothing sensible to add to a spoon of ghee.
  ...withDietIds(DIET_DRESSINGS_DATA, 'diet_dress', 'none'),
  ...withDietIds(DIET_ARABIC_DATA, 'diet_arab', 'savoury'),
  ...withDietIds(DIET_PAKISTANI_DATA, 'diet_pk', 'savoury'),
  ...withDietIds(DIET_SOUPS_DATA, 'diet_soup', 'savoury'),
  // Oats, smoothies, yogurt bowls — the one savoury entry (the egg-white
  // omelette) is close enough that offering it honey costs nothing.
  ...withDietIds(DIET_BREAKFAST_DATA, 'diet_brk', 'sweet'),
  ...withDietIds(DIET_SNACKS_DATA, 'diet_snack', 'none'),
  ...withDietIds(DIET_EGGS_DATA, 'diet_egg', 'savoury'),
  ...withDietIds(DIET_FATS_SWEETENERS_DATA, 'diet_fat', 'none'),
  ...withDietIds(DIET_FRUITS_DATA, 'diet_fruit', 'sweet'),
  ...withDietIds(DIET_LEGUMES_DATA, 'diet_leg', 'savoury'),
  ...withDietIds(DIET_VEGETABLES_DATA, 'diet_veg', 'savoury'),
  ...withDietIds(DIET_MEAT_DATA, 'diet_meat', 'savoury'),
  ...withDietIds(DIET_SEAFOOD_DATA, 'diet_sea', 'savoury'),
  // Mixed: cheddar and malai want nothing, dahi and flavoured yogurt are
  // sweetened. The sweet set is the safe default — sugaring cheese is odd but
  // harmless, whereas offering ghee on yogurt would be actively wrong.
  ...withDietIds(DIET_DAIRY_DATA, 'diet_dairy', 'sweet'),
  ...withDietIds(DIET_GRAINS_DATA, 'diet_grain', 'savoury'),
  ...withDietIds(DIET_NUTS_SEEDS_DATA, 'diet_nut', 'none'),
];

export const ALL_EXPANDED_PAKISTANI_FOODS: NormalizedFood[] = [
  ...BBQ_GRILLS_DATA,
  ...KARAHI_HANDI_DATA,
  ...RICE_BIRYANI_DATA,
  ...SLOW_COOKED_CURRIES_DATA,
  ...NASHTA_BREAKFAST_DATA,
  ...STREET_FOOD_CHAAT_DATA,
  ...VEGETABLES_DAAL_DATA,
  ...PAKISTANI_FAST_FOOD_DATA,
  ...SWEETS_DESSERTS_DATA,
  ...BEVERAGES_DRINKS_DATA,
  ...CALORIFY_RESTAURANTS_DATA,
  ...PAKISTANI_EXPANDED_RESTAURANTS_DATA,
  // Appended, never prepended: plenty of callers resolve a food with a fuzzy
  // `find(f => f.name.includes(...))`, so putting "Plain Roti" ahead of the
  // real Roti would silently repoint those lookups. Diet foods are surfaced
  // by the search ranking boost and the Diet & Basics filter instead.
  ...DIET_BASICS_CATALOG,
].map((item, idx) => ({
  ...item,
  id: item.id || `pak_food_${idx + 1}`,
  region: item.region || 'PK',
}));

export const ALL_SAUDI_FOODS: NormalizedFood[] = [
  ...SAUDI_TRADITIONAL_FOODS,
  ...SAUDI_RESTAURANTS_DATA,
  ...DIET_BASICS_CATALOG,
];

// Deduped by id: the diet basics appear in both regional catalogues, so a
// plain concat would list every one of them twice in the GLOBAL view.
export const ALL_FOODS_CATALOG: NormalizedFood[] = Array.from(
  new Map(
    [...ALL_EXPANDED_PAKISTANI_FOODS, ...ALL_SAUDI_FOODS].map((item) => [item.id ?? item.name, item])
  ).values()
);

const REGIONAL_BRANDS: Record<RegionCode, RestaurantBrand[]> = {
  PK: PAKISTANI_RESTAURANT_BRANDS,
  SA: SAUDI_RESTAURANT_BRANDS,
  GLOBAL: ALL_RESTAURANT_BRANDS,
};

const REGIONAL_FOODS: Record<RegionCode, NormalizedFood[]> = {
  PK: ALL_EXPANDED_PAKISTANI_FOODS,
  SA: ALL_SAUDI_FOODS,
  GLOBAL: ALL_FOODS_CATALOG,
};

export const getBrandsForRegion = (region: RegionCode = 'PK'): RestaurantBrand[] =>
  REGIONAL_BRANDS[region] ?? ALL_RESTAURANT_BRANDS;

export const getFoodsForRegion = (region: RegionCode = 'PK'): NormalizedFood[] =>
  REGIONAL_FOODS[region] ?? ALL_FOODS_CATALOG;

