import { describe, expect, it } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  ALL_RESTAURANT_BRANDS,
  ALL_SAUDI_FOODS,
  DESI_RESTAURANT_DRINKS_DATA,
  DIET_BASICS_CATALOG,
  SAUDI_RESTAURANT_BRANDS,
  SAUDI_RESTAURANT_DRINKS_DATA,
} from '../src/index.js';
import type { NormalizedFood } from '../src/index.js';

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
const SAUDI_BRANDS = ['AlBaik', 'Al Tazaj', 'Shawarmer', 'Maestro Pizza', 'Hamburgini'];

const DESI_NAMES = ['Sweet Lassi', 'Salted Lassi', 'Doodh Patti Chai', 'Cola (Regular)', 'Mineral Water (Regular)'];
const CHINESE_FINE_DINING_NAMES = [
  'Green Tea',
  'Cola (Regular)',
  'Diet Cola (Regular)',
  'Mineral Water (Regular)',
  'Fresh Lime Soda (Sweetened)',
];
const SAUDI_NAMES = [
  'Cola (Regular)',
  'Diet Cola (Regular)',
  'Laban / Ayran',
  'Arabic Qahwa (Unsweetened)',
  'Mineral Water (Regular)',
];

/** The Diet & Basics entry each drink's numbers must equal. */
const SOURCE_ENTRY: Record<string, string> = {
  'Sweet Lassi': 'Sweet Lassi',
  'Salted Lassi': 'Salted Lassi',
  'Doodh Patti Chai': 'Chai (With Sugar)',
  'Cola (Regular)': 'Regular Cola / Soft Drink',
  'Diet Cola (Regular)': 'Diet Soda / Zero Cola',
  'Mineral Water (Regular)': 'Water',
  'Green Tea': 'Green Tea (No Sugar)',
  'Fresh Lime Soda (Sweetened)': 'Fresh Lime Soda (Sweetened)',
  'Laban / Ayran': 'Laban / Ayran',
  'Arabic Qahwa (Unsweetened)': 'Arabic Qahwa (Unsweetened)',
};

/** Sodas and water use the 350 / 500 ml sizes; every other drink keeps its source entry's servings. */
const SODA_SIZED = new Set(['Cola (Regular)', 'Diet Cola (Regular)', 'Mineral Water (Regular)']);

const NUTRIENT_KEYS = [
  'kcal100g',
  'protein100g',
  'carb100g',
  'fat100g',
  'fibre100g',
  'sugar100g',
  'sodiumMg100g',
  'satFat100g',
] as const;

const sourceOf = (drinkName: string): NormalizedFood => {
  const entryName = SOURCE_ENTRY[drinkName];
  const matches = DIET_BASICS_CATALOG.filter((food) => food.name === entryName);
  if (matches.length !== 1) throw new Error(`Expected one Diet & Basics entry named "${entryName}", got ${matches.length}`);
  return matches[0];
};

const drinksOf = (list: NormalizedFood[], brand: string) => list.filter((food) => food.brand === brand);

const expectedFor = (brand: string): string[] =>
  DESI_BRANDS.includes(brand) ? DESI_NAMES : CHINESE_FINE_DINING_BRANDS.includes(brand) ? CHINESE_FINE_DINING_NAMES : SAUDI_NAMES;

const allBrands = [...DESI_BRANDS, ...CHINESE_FINE_DINING_BRANDS, ...SAUDI_BRANDS];

describe('regional restaurant drinks', () => {
  it('cover 23 distinct, registered brands', () => {
    expect(new Set(allBrands).size).toBe(23);
    const registered = new Set(ALL_RESTAURANT_BRANDS.map((brand) => brand.name));
    for (const brand of allBrands) expect(registered.has(brand), `${brand} is not a registered brand`).toBe(true);
  });

  it('list no drinks for any other brand', () => {
    const own = new Set([...DESI_BRANDS, ...CHINESE_FINE_DINING_BRANDS]);
    expect(DESI_RESTAURANT_DRINKS_DATA.filter((food) => !own.has(food.brand!))).toEqual([]);
    expect(SAUDI_RESTAURANT_DRINKS_DATA.filter((food) => !SAUDI_BRANDS.includes(food.brand!))).toEqual([]);
  });

  it.each(allBrands)('%s has exactly its intended drinks, with unique names', (brand) => {
    const list = SAUDI_BRANDS.includes(brand) ? SAUDI_RESTAURANT_DRINKS_DATA : DESI_RESTAURANT_DRINKS_DATA;
    const names = drinksOf(list, brand).map((food) => food.name);
    expect(names).toEqual(expectedFor(brand));
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(allBrands)('%s shows its drinks in the catalogue for its region', (brand) => {
    const foods = SAUDI_BRANDS.includes(brand) ? ALL_SAUDI_FOODS : ALL_EXPANDED_PAKISTANI_FOODS;
    const shown = foods.filter((food) => food.brand === brand && food.brandCategory === 'Beverages & Drinks');
    expect(shown.map((food) => food.name)).toEqual(expectedFor(brand));
  });
});

describe('regional restaurant drinks: numbers come from Diet & Basics', () => {
  const everyDrink = [...DESI_RESTAURANT_DRINKS_DATA, ...SAUDI_RESTAURANT_DRINKS_DATA];

  it('has 5 drinks for each of the 23 brands', () => {
    expect(DESI_RESTAURANT_DRINKS_DATA).toHaveLength((DESI_BRANDS.length + CHINESE_FINE_DINING_BRANDS.length) * 5);
    expect(SAUDI_RESTAURANT_DRINKS_DATA).toHaveLength(SAUDI_BRANDS.length * 5);
  });

  it.each(everyDrink.map((food) => [`${food.brand} / ${food.name}`, food] as const))(
    '%s equals its source entry',
    (_label, food) => {
      const source = sourceOf(food.name);
      for (const key of NUTRIENT_KEYS) expect(food[key], key).toBe(source[key]);
      expect(food.source).toBe(source.source);
      expect(food.verifiedBy).toBe(source.verifiedBy);
      expect(food.oilAddedG).toBe(0);
      if (SODA_SIZED.has(food.name)) {
        expect(food.servings).toEqual([
          { label: '1 regular (350ml)', grams: 350, isDefault: true },
          { label: '1 large (500ml)', grams: 500, isDefault: false },
        ]);
      } else {
        // The catalogue adds generic half / double portions to some entries; ours are the source's
        // own cup sizes, so each must exist in the source with the same grams and default flag.
        const sourceServings = source.servings.map(({ label, grams, isDefault }) => ({ label, grams, isDefault }));
        for (const serving of food.servings) expect(sourceServings).toContainEqual(serving);
        expect(food.servings.find((serving) => serving.isDefault)!.label).toBe(
          source.servings.find((serving) => serving.isDefault)!.label
        );
      }
      expect(food.servings.filter((serving) => serving.isDefault)).toHaveLength(1);
    }
  );

  it('uses generic names: no soda brand, no aliases', () => {
    for (const food of everyDrink) {
      expect(food.aliases).toBeUndefined();
      expect(food.name).not.toMatch(/pepsi|coke|coca|7up|sprite|fanta|mirinda|dew|nestle|aquafina|dasani/i);
    }
  });
});

describe('regional restaurant drinks: shape invariants', () => {
  it('Pakistani drinks are menu-only PK items with Urdu names', () => {
    for (const food of DESI_RESTAURANT_DRINKS_DATA) {
      expect(food.menuOnly).toBe(true);
      expect(food.brandCategory).toBe('Beverages & Drinks');
      expect(food.category).toBe('Pakistani Fast Food');
      expect(food.region).toBe('PK');
      expect(food.nameUr, food.name).toBeTruthy();
    }
  });

  it('Saudi drinks are menu-only SA items with a unique explicit id, the brand id and an Arabic name', () => {
    const brandIds = new Map(SAUDI_RESTAURANT_BRANDS.map((brand) => [brand.name, brand.id]));
    const ids = SAUDI_RESTAURANT_DRINKS_DATA.map((food) => food.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const food of SAUDI_RESTAURANT_DRINKS_DATA) {
      expect(food.id).toMatch(/^sa_drink_/);
      expect(food.id!.startsWith(`sa_drink_${food.brandId}_`)).toBe(true);
      expect(food.brandId).toBe(brandIds.get(food.brand!));
      expect(food.menuOnly).toBe(true);
      expect(food.brandCategory).toBe('Beverages & Drinks');
      expect(food.category).toBe('Beverages');
      expect(food.region).toBe('SA');
      expect(food.cuisineTags).toEqual(expect.arrayContaining(['Saudi', 'Beverage']));
      expect(food.nameAr, food.name).toBeTruthy();
    }
  });

  it('Saudi drink ids do not collide with any other Saudi food', () => {
    const ids = ALL_SAUDI_FOODS.map((food) => food.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
