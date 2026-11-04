import { describe, expect, it } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  ALL_RESTAURANT_BRANDS,
  ALL_SAUDI_FOODS,
  CALORIFY_BRANDS,
  DESI_RESTAURANT_DRINKS_DATA,
  RESTAURANT_DRINKS_DATA,
  SAUDI_RESTAURANT_DRINKS_DATA,
  searchPakistaniFoods,
} from '../src/index.js';

describe('KFC Pakistan drinks', () => {
  const kfc = CALORIFY_BRANDS.find((brand) => brand.id === 'kfc')!;
  const drinks = ALL_EXPANDED_PAKISTANI_FOODS.filter(
    (food) => food.brand === 'KFC Pakistan' && food.brandCategory === 'Beverages & Drinks'
  );

  it('are in the KFC menu, under a category the menu lists', () => {
    expect(drinks.map((food) => food.name)).toEqual(
      RESTAURANT_DRINKS_DATA.filter((food) => food.brand === 'KFC Pakistan').map((food) => food.name)
    );
    expect(kfc.categories).toContain('Beverages & Drinks');
  });

  it('carry USDA-reference estimates with a regular and a large size, never a dietitian approval', () => {
    for (const food of drinks) {
      expect(food.verifiedBy).toBe('usda_reference');
      expect(food.servings.map((serving) => serving.label)).toEqual(['1 regular (350ml)', '1 large (500ml)']);
      expect(food.kcal100g).toBeGreaterThanOrEqual(0);
    }
    expect(drinks.find((food) => food.name.startsWith('Mineral Water'))!.kcal100g).toBe(0);
    expect(drinks.find((food) => food.name.startsWith('Pepsi (Regular)'))!.kcal100g).toBeGreaterThan(30);
  });

  it('do not renumber any other food: the Pakistani catalogue ids stay unique and the drinks come last', () => {
    const ids = ALL_EXPANDED_PAKISTANI_FOODS.map((food) => food.id);
    expect(new Set(ids).size).toBe(ids.length);
    const lastDrinkIdx = ids.indexOf(drinks[drinks.length - 1].id);
    const earlier = ALL_EXPANDED_PAKISTANI_FOODS.slice(0, ids.indexOf(drinks[0].id));
    expect(earlier.some((food) => food.brand === 'KFC Pakistan' && food.brandCategory === 'Beverages & Drinks')).toBe(false);
    expect(lastDrinkIdx).toBeGreaterThan(0);
  });
});

describe('brand drinks (all lists)', () => {
  const lists = [
    ['PK chains', RESTAURANT_DRINKS_DATA],
    ['PK desi', DESI_RESTAURANT_DRINKS_DATA],
    ['SA', SAUDI_RESTAURANT_DRINKS_DATA],
  ] as const;

  it.each(lists)('%s: every drink is menu-only, sourced, in the drinks category, with a real brand', (_name, list) => {
    const brandNames = new Set(ALL_RESTAURANT_BRANDS.map((brand) => brand.name));
    for (const food of list) {
      expect(food.menuOnly).toBe(true);
      expect(food.brandCategory).toBe('Beverages & Drinks');
      // USDA reference for sodas, water and tea; composed for lassi, chai and the like, copied from their Diet & Basics entry.
      expect(['usda_reference', 'composed']).toContain(food.verifiedBy);
      expect(brandNames.has(food.brand!), `${food.brand} is not a registered brand`).toBe(true);
      expect(food.servings.length).toBeGreaterThan(0);
      expect(food.kcal100g).toBeGreaterThanOrEqual(0);
      expect(food.kcal100g).toBeLessThan(80);
    }
  });

  it('give every brand that has drinks a drinks tab, and no brand a drinks tab with nothing in it', () => {
    const everyFood = [...ALL_EXPANDED_PAKISTANI_FOODS, ...ALL_SAUDI_FOODS];
    const drinkBrands = new Set(
      [...RESTAURANT_DRINKS_DATA, ...DESI_RESTAURANT_DRINKS_DATA, ...SAUDI_RESTAURANT_DRINKS_DATA].map((food) => food.brand)
    );
    for (const name of drinkBrands) {
      expect(ALL_RESTAURANT_BRANDS.find((brand) => brand.name === name)?.categories, name).toContain('Beverages & Drinks');
    }
    for (const brand of ALL_RESTAURANT_BRANDS.filter((b) => b.categories?.includes('Beverages & Drinks'))) {
      const items = everyFood.filter((food) => food.brand === brand.name && food.brandCategory === 'Beverages & Drinks');
      expect(items.length, `${brand.name} lists a drinks tab with no drinks`).toBeGreaterThan(0);
    }
  });

  it('keep ids unique across the Pakistani and Saudi catalogues', () => {
    for (const foods of [ALL_EXPANDED_PAKISTANI_FOODS, ALL_SAUDI_FOODS]) {
      const ids = foods.map((food) => food.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('stay out of the general food search but show up when searching inside their brand', () => {
    expect(searchPakistaniFoods('pepsi', {}).some((food) => food.brand === 'KFC Pakistan')).toBe(false);
    expect(searchPakistaniFoods('pepsi', { brand: 'KFC Pakistan' }).length).toBeGreaterThan(0);
  });
});
