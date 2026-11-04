import type { FoodServingItem, NormalizedFood } from '../types.js';

/**
 * Drinks for Pakistani BBQ, desi, Chinese and fine-dining brands whose menus list none.
 *
 * Same rules as restaurant-drinks.data.ts: brand drinks are `menuOnly`, sit in brandCategory
 * 'Beverages & Drinks' and are estimates, never dietitian-approved. Appended last in
 * data/index.ts so no positional id shifts.
 *
 * Every number is COPIED from a Diet & Basics entry (named in the comment on each row of
 * DRINK_NUTRITION; restaurant-drinks-regional.test.ts fails if a value drifts from it). Nothing
 * is invented, and no soda brand is named because these restaurants' suppliers are not known.
 * Cup sizes (350 ml regular, 500 ml large) are typical sizes, not published by the brands, so
 * every serving here is an estimate. `verifiedBy` mirrors the source entry: `usda_reference`
 * for the USDA-sourced sodas, water and green tea, `composed` for the Pakistani composed
 * drinks (lassi, chai, fresh lime soda).
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

const SODA_SERVINGS: FoodServingItem[] = [
  { label: '1 regular (350ml)', grams: 350, isDefault: true },
  { label: '1 large (500ml)', grams: 500, isDefault: false },
];

interface DesiDrink {
  name: string;
  nameUr: string;
  nutrition: DrinkNutrition;
  servings: FoodServingItem[];
}

const DRINK_NUTRITION = {
  // Diet & Basics: "Sweet Lassi".
  sweetLassi: {
    kcal100g: 72, protein100g: 2.5, carb100g: 11, fat100g: 2, fibre100g: 0, sugar100g: 10.8,
    sodiumMg100g: 40, satFat100g: 1.2, source: 'pak_custom', verifiedBy: 'composed',
  },
  // Diet & Basics: "Salted Lassi".
  saltedLassi: {
    kcal100g: 45, protein100g: 2.8, carb100g: 3.6, fat100g: 2.2, fibre100g: 0, sugar100g: 3.4,
    sodiumMg100g: 310, satFat100g: 1.3, source: 'pak_custom', verifiedBy: 'composed',
  },
  // Diet & Basics: "Chai (With Sugar)".
  chaiWithSugar: {
    kcal100g: 53, protein100g: 1.6, carb100g: 7.7, fat100g: 1.7, fibre100g: 0, sugar100g: 7.7,
    sodiumMg100g: 22, satFat100g: 1, source: 'pak_custom', verifiedBy: 'composed',
  },
  // Diet & Basics: "Regular Cola / Soft Drink".
  regularCola: {
    kcal100g: 42, protein100g: 0, carb100g: 10.6, fat100g: 0, fibre100g: 0, sugar100g: 10.6,
    sodiumMg100g: 4, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
  },
  // Diet & Basics: "Diet Soda / Zero Cola".
  dietCola: {
    kcal100g: 0, protein100g: 0, carb100g: 0, fat100g: 0, fibre100g: 0, sugar100g: 0,
    sodiumMg100g: 10, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
  },
  // Diet & Basics: "Water".
  water: {
    kcal100g: 0, protein100g: 0, carb100g: 0, fat100g: 0, fibre100g: 0, sugar100g: 0,
    sodiumMg100g: 0, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
  },
  // Diet & Basics: "Green Tea (No Sugar)".
  greenTea: {
    kcal100g: 1, protein100g: 0, carb100g: 0.2, fat100g: 0, fibre100g: 0, sugar100g: 0,
    sodiumMg100g: 1, satFat100g: 0, source: 'usda', verifiedBy: 'usda_reference',
  },
  // Diet & Basics: "Fresh Lime Soda (Sweetened)".
  freshLimeSoda: {
    kcal100g: 36, protein100g: 0, carb100g: 9, fat100g: 0, fibre100g: 0, sugar100g: 8.8,
    sodiumMg100g: 20, satFat100g: 0, source: 'pak_custom', verifiedBy: 'composed',
  },
} satisfies Record<string, DrinkNutrition>;

// Servings are the source entry's own (lassi, chai, green tea, fresh lime) or the 350/500 ml
// soda sizes (colas, water).
const SWEET_LASSI: DesiDrink = {
  name: 'Sweet Lassi',
  nameUr: 'میٹھی لسی',
  nutrition: DRINK_NUTRITION.sweetLassi,
  servings: [
    { label: '1 glass (250ml)', grams: 250, isDefault: true },
    { label: '1 small glass (180ml)', grams: 180, isDefault: false },
  ],
};
const SALTED_LASSI: DesiDrink = {
  name: 'Salted Lassi',
  nameUr: 'نمکین لسی',
  nutrition: DRINK_NUTRITION.saltedLassi,
  servings: [
    { label: '1 glass (250ml)', grams: 250, isDefault: true },
    { label: '1 small glass (180ml)', grams: 180, isDefault: false },
  ],
};
const DOODH_PATTI_CHAI: DesiDrink = {
  name: 'Doodh Patti Chai',
  nameUr: 'دودھ پتی چائے',
  nutrition: DRINK_NUTRITION.chaiWithSugar,
  servings: [
    { label: '1 chai cup (150ml)', grams: 150, isDefault: true },
    { label: '1 large mug (250ml)', grams: 250, isDefault: false },
  ],
};
const COLA: DesiDrink = {
  name: 'Cola (Regular)',
  nameUr: 'کولا (ریگولر)',
  nutrition: DRINK_NUTRITION.regularCola,
  servings: SODA_SERVINGS,
};
const DIET_COLA: DesiDrink = {
  name: 'Diet Cola (Regular)',
  nameUr: 'ڈائٹ کولا (ریگولر)',
  nutrition: DRINK_NUTRITION.dietCola,
  servings: SODA_SERVINGS,
};
const MINERAL_WATER: DesiDrink = {
  name: 'Mineral Water (Regular)',
  nameUr: 'منرل واٹر (ریگولر)',
  nutrition: DRINK_NUTRITION.water,
  servings: SODA_SERVINGS,
};
const GREEN_TEA: DesiDrink = {
  name: 'Green Tea',
  nameUr: 'سبز چائے',
  nutrition: DRINK_NUTRITION.greenTea,
  servings: [
    { label: '1 cup (240ml)', grams: 240, isDefault: true },
    { label: '1 mug (350ml)', grams: 350, isDefault: false },
  ],
};
const FRESH_LIME_SODA: DesiDrink = {
  name: 'Fresh Lime Soda (Sweetened)',
  nameUr: 'فریش لائم سوڈا (میٹھا)',
  nutrition: DRINK_NUTRITION.freshLimeSoda,
  servings: [{ label: '1 glass (250ml)', grams: 250, isDefault: true }],
};

/** BBQ, biryani, nihari, karahi and desi dining brands. */
const DESI_SET: DesiDrink[] = [SWEET_LASSI, SALTED_LASSI, DOODH_PATTI_CHAI, COLA, MINERAL_WATER];
/** Chinese and fine-dining brands. */
const CHINESE_FINE_DINING_SET: DesiDrink[] = [GREEN_TEA, COLA, DIET_COLA, MINERAL_WATER, FRESH_LIME_SODA];

const DESI_BRANDS = [
  'Student Biryani',
  'Bundu Khan',
  'Butt Karahi (Lakshmi Chowk)',
  'Kolachi Restaurant (Do Darya)',
  'LalQila Restaurant',
  'BBQ Tonight',
  'Ghausia Nalli Biryani',
  'Waris Nihari (Lahore)',
  'Muhammadi Nahari',
  'Javed Nihari (Dastagir Karachi)',
  'Al-Rehman Biryani (Karachi)',
  'Phajja Siri Paye (Lahore)',
  "Salt'n Pepper",
  'Daily Dhaba',
];
const CHINESE_FINE_DINING_BRANDS = ['Ginsoy Extreme Chinese', 'Chop Chop Wok', 'Mei Kong', 'Cafe Aylanto'];

const drinksFor = (brand: string, set: DesiDrink[]): NormalizedFood[] =>
  set.map((drink) => ({
    name: drink.name,
    nameUr: drink.nameUr,
    brand,
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: ['Pakistani', 'Beverage'],
    region: 'PK',
    ...drink.nutrition,
    oilAddedG: 0,
    servings: drink.servings.map((serving) => ({ ...serving })),
  }));

export const DESI_RESTAURANT_DRINKS_DATA: NormalizedFood[] = [
  ...DESI_BRANDS.flatMap((brand) => drinksFor(brand, DESI_SET)),
  ...CHINESE_FINE_DINING_BRANDS.flatMap((brand) => drinksFor(brand, CHINESE_FINE_DINING_SET)),
];
