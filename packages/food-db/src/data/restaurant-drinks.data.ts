import type { NormalizedFood } from '../types.js';

/**
 * USDA reference rows per 100 ml (shared by every chain below, same figures as the
 * KFC rows above). Cup sizes are typical fountain sizes, not a brand-published spec,
 * so every item built from them is an estimate.
 */
const DRINK_ROWS = [
  { key: 'cola', usda: 'carbonated beverage, cola', kcal100g: 42, carb100g: 10.6, sugar100g: 10.6, sodiumMg100g: 4 },
  { key: 'lemonLime', usda: 'lemon-lime soda', kcal100g: 41, carb100g: 10.4, sugar100g: 10.4, sodiumMg100g: 10 },
  { key: 'orange', usda: 'orange soda', kcal100g: 48, carb100g: 12.3, sugar100g: 12.3, sodiumMg100g: 10 },
  { key: 'dietCola', usda: 'low-calorie cola', kcal100g: 0, carb100g: 0, sugar100g: 0, sodiumMg100g: 10 },
  { key: 'water', usda: 'plain bottled water', kcal100g: 0, carb100g: 0, sugar100g: 0, sodiumMg100g: 2 },
] as const;

type DrinkKey = (typeof DRINK_ROWS)[number]['key'];
type DrinkNames = Record<DrinkKey, { name: string; nameUr: string }>;

/** Generic names: used wherever the supplier is not certain, so no soda brand is claimed. */
const GENERIC_NAMES: DrinkNames = {
  cola: { name: 'Cola (Regular)', nameUr: 'کولا' },
  lemonLime: { name: 'Lemon-Lime Soda (Regular)', nameUr: 'لیمن لائم سوڈا' },
  orange: { name: 'Orange Soda (Regular)', nameUr: 'اورنج سوڈا' },
  dietCola: { name: 'Diet Cola (Regular)', nameUr: 'ڈائٹ کولا' },
  water: { name: 'Mineral Water (Regular)', nameUr: 'منرل واٹر' },
};

/** McDonald's Pakistan pours the Coca-Cola range. */
const COCA_COLA_NAMES: DrinkNames = {
  cola: { name: 'Coca-Cola (Regular)', nameUr: 'کوکا کولا' },
  lemonLime: { name: 'Sprite (Regular)', nameUr: 'اسپرائٹ' },
  orange: { name: 'Fanta (Regular)', nameUr: 'فانٹا' },
  dietCola: { name: 'Coca-Cola Zero (Regular)', nameUr: 'کوکا کولا زیرو' },
  water: GENERIC_NAMES.water,
};

function chainDrinks(brand: string, style: string, names: DrinkNames): NormalizedFood[] {
  return DRINK_ROWS.map((row) => ({
    name: names[row.key].name,
    nameUr: names[row.key].nameUr,
    brand,
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: [brand, style, 'Pakistani', 'Beverage'],
    kcal100g: row.kcal100g,
    protein100g: 0,
    carb100g: row.carb100g,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: row.sugar100g,
    sodiumMg100g: row.sodiumMg100g,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 regular (350ml)', grams: 350, isDefault: true },
      { label: '1 large (500ml)', grams: 500, isDefault: false },
    ],
  }));
}

const FAST = 'Fast-Food';
const PIZZA = 'Pizza';
const g = GENERIC_NAMES;

/** Chains whose menus list no drinks. Names are generic except McDonald's (Coca-Cola range). */
const CHAIN_BRANDS: { brand: string; style: string; names: DrinkNames }[] = [
  { brand: "McDonald's Pakistan", style: FAST, names: COCA_COLA_NAMES },
  ...[
    "Hardee's", 'Cheezious', 'Savour Foods', 'Kababjees', 'OPTP', 'Johnny & Jugnu', 'Ranchers Cafe',
    'Daily Deli Co.', 'Howdy', 'Texas Chicken Pakistan', 'Burger Lab', "Clucky's", "Big Moe's Diner",
    'Buntoos', 'Kababjees Fried Chicken',
  ].map((brand) => ({ brand, style: FAST, names: g })),
  ...[
    'Broadway Pizza', 'Pizza Max', "Domino's Pakistan", 'Pizza Hut Pakistan', '14th Street Pizza Co.',
    'California Pizza', "Papa John's Pakistan", 'Tehzeeb Pizza & Italian', 'NY212 Pizza', "Gino's Pizza",
    'Pizzalicious',
  ].map((brand) => ({ brand, style: PIZZA, names: g })),
];

/**
 * Drinks for restaurant menus that list none (KFC Pakistan, then 27 more chains built from one USDA table below). Kept out of
 * calorify-restaurants.data.ts, whose rows are all dietitian-approved: these are
 * USDA reference figures per 100 ml for the drink type with typical fountain cup
 * sizes, so they are estimates and say so (`usda_reference`).
 *
 * Foods get positional ids across the Pakistani catalogue (pak_food_N), so this list
 * is appended last in data/index.ts: adding to it never renumbers another food.
 */
export const RESTAURANT_DRINKS_DATA: NormalizedFood[] = [
  {
    // USDA: carbonated beverage, cola.
    name: 'Pepsi (Regular)',
    nameUr: 'پیپسی',
    brand: 'KFC Pakistan',
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: ['KFC', 'Fast-Food', 'Pakistani', 'Beverage'],
    kcal100g: 42,
    protein100g: 0,
    carb100g: 10.6,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: 10.6,
    sodiumMg100g: 4,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 regular (350ml)', grams: 350, isDefault: true },
      { label: '1 large (500ml)', grams: 500, isDefault: false },
    ],
  },
  {
    // USDA: lemon-lime soda.
    name: '7UP (Regular)',
    nameUr: 'سیون اپ',
    brand: 'KFC Pakistan',
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: ['KFC', 'Fast-Food', 'Pakistani', 'Beverage'],
    kcal100g: 41,
    protein100g: 0,
    carb100g: 10.4,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: 10.4,
    sodiumMg100g: 10,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 regular (350ml)', grams: 350, isDefault: true },
      { label: '1 large (500ml)', grams: 500, isDefault: false },
    ],
  },
  {
    // USDA: orange soda.
    name: 'Mirinda (Regular)',
    nameUr: 'مرنڈا',
    brand: 'KFC Pakistan',
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: ['KFC', 'Fast-Food', 'Pakistani', 'Beverage'],
    kcal100g: 48,
    protein100g: 0,
    carb100g: 12.3,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: 12.3,
    sodiumMg100g: 10,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 regular (350ml)', grams: 350, isDefault: true },
      { label: '1 large (500ml)', grams: 500, isDefault: false },
    ],
  },
  {
    // USDA: low-calorie cola.
    name: 'Pepsi Black / Diet (Regular)',
    nameUr: 'پیپسی بلیک',
    brand: 'KFC Pakistan',
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: ['KFC', 'Fast-Food', 'Pakistani', 'Beverage'],
    kcal100g: 0,
    protein100g: 0,
    carb100g: 0,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: 0,
    sodiumMg100g: 10,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 regular (350ml)', grams: 350, isDefault: true },
      { label: '1 large (500ml)', grams: 500, isDefault: false },
    ],
  },
  {
    // Plain bottled water.
    name: 'Mineral Water (Regular)',
    nameUr: 'منرل واٹر',
    brand: 'KFC Pakistan',
    brandCategory: 'Beverages & Drinks',
    menuOnly: true,
    category: 'Pakistani Fast Food',
    cuisineTags: ['KFC', 'Fast-Food', 'Pakistani', 'Beverage'],
    kcal100g: 0,
    protein100g: 0,
    carb100g: 0,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: 0,
    sodiumMg100g: 2,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 regular (350ml)', grams: 350, isDefault: true },
      { label: '1 large (500ml)', grams: 500, isDefault: false },
    ],
  },

  ...CHAIN_BRANDS.flatMap(({ brand, style, names }) => chainDrinks(brand, style, names)),
];
