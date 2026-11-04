import type { FoodServingItem, NormalizedFood } from '../types.js';

/**
 * Drinks for Saudi chains whose menus list none. Items need an explicit unique `id` (sa_...), `brandId` and `region: 'SA'`, like saudi-restaurants.data.ts.
 *
 * Same rules as restaurant-drinks.data.ts: brand drinks are `menuOnly`, sit in brandCategory
 * 'Beverages & Drinks' and are estimates, never dietitian-approved. Appended last in
 * data/index.ts so no positional id shifts.
 *
 * Every number is COPIED from a Diet & Basics entry (named in the comment on each row of
 * SAUDI_DRINKS; restaurant-drinks-regional.test.ts fails if a value drifts from it). Nothing is
 * invented, and no soda brand is named because these chains' suppliers are not known. Cup sizes
 * (350 ml regular, 500 ml large) are typical sizes, not published by the brands, so every
 * serving here is an estimate. `source` and `verifiedBy` mirror the source entry.
 *
 * `category` is 'Beverages', the category the Saudi catalogue already uses for drinks (there is
 * no 'Saudi Fast Food' category in saudi-restaurants.data.ts).
 */

type DrinkNutrition = Pick<
  NormalizedFood,
  | 'kcal100g'
  | 'protein100g'
  | 'carb100g'
  | 'fat100g'
  | 'fibre100g'
  | 'sugar100g'
  | 'sodiumMg100g'
  | 'satFat100g'
  | 'source'
  | 'verifiedBy'
>;

interface SaudiDrink {
  /** Id slug: the drink's id is `sa_drink_<brandId>_<slug>`. */
  slug: string;
  name: string;
  nameAr: string;
  nutrition: DrinkNutrition;
  servings: FoodServingItem[];
}

const SODA_SERVINGS: FoodServingItem[] = [
  { label: '1 regular (350ml)', grams: 350, isDefault: true },
  { label: '1 large (500ml)', grams: 500, isDefault: false },
];

const SAUDI_DRINKS: SaudiDrink[] = [
  {
    // Diet & Basics: "Regular Cola / Soft Drink".
    slug: 'cola',
    name: 'Cola (Regular)',
    nameAr: 'كولا (عادي)',
    nutrition: {
      kcal100g: 42, protein100g: 0, carb100g: 10.6, fat100g: 0, fibre100g: 0, sugar100g: 10.6,
      sodiumMg100g: 4, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
    },
    servings: SODA_SERVINGS,
  },
  {
    // Diet & Basics: "Diet Soda / Zero Cola".
    slug: 'diet_cola',
    name: 'Diet Cola (Regular)',
    nameAr: 'كولا دايت (عادي)',
    nutrition: {
      kcal100g: 0, protein100g: 0, carb100g: 0, fat100g: 0, fibre100g: 0, sugar100g: 0,
      sodiumMg100g: 10, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
    },
    servings: SODA_SERVINGS,
  },
  {
    // Diet & Basics: "Laban / Ayran".
    slug: 'laban_ayran',
    name: 'Laban / Ayran',
    nameAr: 'لبن / عيران',
    nutrition: {
      kcal100g: 42, protein100g: 3, carb100g: 4.2, fat100g: 1.5, fibre100g: 0, sugar100g: 4.2,
      sodiumMg100g: 200, satFat100g: 1, source: 'saudi_custom', verifiedBy: 'usda_reference',
    },
    servings: [
      { label: '1 glass (250ml)', grams: 250, isDefault: true },
      { label: '1 carton (180ml)', grams: 180, isDefault: false },
    ],
  },
  {
    // Diet & Basics: "Arabic Qahwa (Unsweetened)".
    slug: 'qahwa',
    name: 'Arabic Qahwa (Unsweetened)',
    nameAr: 'قهوة عربية (بدون سكر)',
    nutrition: {
      kcal100g: 2, protein100g: 0.1, carb100g: 0.3, fat100g: 0, fibre100g: 0, sugar100g: 0,
      sodiumMg100g: 2, satFat100g: 0, source: 'saudi_custom', verifiedBy: 'usda_reference',
    },
    servings: [
      { label: '1 finjan (60ml)', grams: 60, isDefault: true },
      { label: '2 finjan (120ml)', grams: 120, isDefault: false },
    ],
  },
  {
    // Diet & Basics: "Water".
    slug: 'mineral_water',
    name: 'Mineral Water (Regular)',
    nameAr: 'مياه معدنية (عادي)',
    nutrition: {
      kcal100g: 0, protein100g: 0, carb100g: 0, fat100g: 0, fibre100g: 0, sugar100g: 0,
      sodiumMg100g: 0, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
    },
    servings: SODA_SERVINGS,
  },
];

/** [brand name, brandId in SAUDI_RESTAURANT_BRANDS] */
const SAUDI_DRINK_BRANDS: ReadonlyArray<readonly [string, string]> = [
  ['AlBaik', 'albaik'],
  ['Al Tazaj', 'al_tazaj'],
  ['Shawarmer', 'shawarmer'],
  ['Maestro Pizza', 'maestro_pizza'],
  ['Hamburgini', 'hamburgini'],
];

export const SAUDI_RESTAURANT_DRINKS_DATA: NormalizedFood[] = SAUDI_DRINK_BRANDS.flatMap(([brand, brandId]) =>
  SAUDI_DRINKS.map((drink) => ({
    id: `sa_drink_${brandId}_${drink.slug}`,
    name: drink.name,
    nameAr: drink.nameAr,
    brand,
    brandId,
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Beverages',
    cuisineTags: ['Saudi', 'Beverage'],
    region: 'SA' as const,
    ...drink.nutrition,
    oilAddedG: 0,
    servings: drink.servings.map((serving) => ({ ...serving })),
  }))
);
