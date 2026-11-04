import { describe, expect, it } from 'vitest';
import { ALL_EXPANDED_PAKISTANI_FOODS, RESTAURANT_DRINKS_DATA } from '../src/index.js';

type Row = { kcal: number; carb: number; sodium: number };
type Expected = [string, Row][];

const COLA: Row = { kcal: 42, carb: 10.6, sodium: 4 };
const LEMON_LIME: Row = { kcal: 41, carb: 10.4, sodium: 10 };
const ORANGE: Row = { kcal: 48, carb: 12.3, sodium: 10 };
const DIET: Row = { kcal: 0, carb: 0, sodium: 10 };
const WATER: Row = { kcal: 0, carb: 0, sodium: 2 };

const GENERIC: Expected = [
  ['Cola (Regular)', COLA],
  ['Lemon-Lime Soda (Regular)', LEMON_LIME],
  ['Orange Soda (Regular)', ORANGE],
  ['Diet Cola (Regular)', DIET],
  ['Mineral Water (Regular)', WATER],
];
const MCDONALDS: Expected = [
  ['Coca-Cola (Regular)', COLA],
  ['Sprite (Regular)', LEMON_LIME],
  ['Fanta (Regular)', ORANGE],
  ['Coca-Cola Zero (Regular)', DIET],
  ['Mineral Water (Regular)', WATER],
];
const KFC: Expected = [
  ['Pepsi (Regular)', COLA],
  ['7UP (Regular)', LEMON_LIME],
  ['Mirinda (Regular)', ORANGE],
  ['Pepsi Black / Diet (Regular)', DIET],
  ['Mineral Water (Regular)', WATER],
];

const GENERIC_BRANDS = [
  "Hardee's", 'Cheezious', 'Broadway Pizza', 'Savour Foods', 'Kababjees', 'OPTP',
  'Johnny & Jugnu', 'Ranchers Cafe', 'Daily Deli Co.', 'Howdy', 'Texas Chicken Pakistan', 'Burger Lab',
  "Clucky's", "Big Moe's Diner", 'Buntoos', 'Kababjees Fried Chicken',
  'Pizza Max', "Domino's Pakistan", 'Pizza Hut Pakistan', '14th Street Pizza Co.', 'California Pizza',
  "Papa John's Pakistan", 'Tehzeeb Pizza & Italian', 'NY212 Pizza', "Gino's Pizza", 'Pizzalicious',
];
const BRANDS: [string, Expected][] = [
  ['KFC Pakistan', KFC],
  ["McDonald's Pakistan", MCDONALDS],
  ...GENERIC_BRANDS.map((brand): [string, Expected] => [brand, GENERIC]),
];

const drinksOf = (brand: string) => RESTAURANT_DRINKS_DATA.filter((food) => food.brand === brand);

describe('chain drinks', () => {
  it("cover KFC, McDonald's and 26 generic-named chains, five drinks each", () => {
    expect(BRANDS).toHaveLength(28);
    expect(new Set(BRANDS.map(([brand]) => brand)).size).toBe(28);
    expect(RESTAURANT_DRINKS_DATA).toHaveLength(28 * 5);
  });

  it.each(BRANDS)('%s: exactly the five intended drinks with the USDA reference values', (brand, expected) => {
    const drinks = drinksOf(brand);
    expect(drinks.map((food) => food.name)).toEqual(expected.map(([name]) => name));
    expect(new Set(drinks.map((food) => food.name)).size).toBe(drinks.length);
    drinks.forEach((food, i) => {
      const row = expected[i][1];
      expect(food.kcal100g, `${brand} ${food.name} kcal`).toBe(row.kcal);
      expect(food.carb100g, `${brand} ${food.name} carb`).toBe(row.carb);
      expect(food.sugar100g, `${brand} ${food.name} sugar`).toBe(row.carb);
      expect(food.sodiumMg100g, `${brand} ${food.name} sodium`).toBe(row.sodium);
      expect(food.protein100g).toBe(0);
      expect(food.fat100g).toBe(0);
      expect(food.fibre100g).toBe(0);
      expect(food.satFat100g).toBe(0);
    });
  });

  it.each(BRANDS)('%s: menu-only USDA-reference estimates in the drinks category with two sizes', (brand) => {
    for (const food of drinksOf(brand)) {
      expect(food.menuOnly).toBe(true);
      expect(food.verifiedBy).toBe('usda_reference');
      expect(food.source).toBe('usda');
      expect(food.brandCategory).toBe('Beverages & Drinks');
      expect(food.category).toBe('Pakistani Fast Food');
      expect(food.cuisineTags).toContain('Beverage');
      expect(food.oilAddedG).toBe(0);
      expect(food.nameUr).toBeTruthy();
      expect(food.aliases ?? []).toEqual([]);
      expect(food.servings).toEqual([
        { label: '1 regular (350ml)', grams: 350, isDefault: true },
        { label: '1 large (500ml)', grams: 500, isDefault: false },
      ]);
    }
  });

  it("claim a soda brand only for KFC (Pepsi family) and McDonald's (Coca-Cola family)", () => {
    const sodaBrand = /pepsi|7up|mirinda|coca|sprite|fanta/i;
    for (const [brand] of BRANDS) {
      const claims = drinksOf(brand).some((food) => sodaBrand.test(food.name));
      expect(claims, brand).toBe(brand === 'KFC Pakistan' || brand === "McDonald's Pakistan");
    }
  });

  it('match what the catalogue holds as drinks for these brands', () => {
    for (const [brand] of BRANDS) {
      const inCatalogue = ALL_EXPANDED_PAKISTANI_FOODS.filter(
        (food) => food.brand === brand && food.brandCategory === 'Beverages & Drinks'
      );
      expect(inCatalogue.map((food) => food.name), brand).toEqual(drinksOf(brand).map((food) => food.name));
    }
  });
});
