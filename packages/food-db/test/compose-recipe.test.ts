import { describe, expect, it } from 'vitest';
import {
  composeRecipeFood,
  foodFromUsdaRecord,
  getRecipeIngredientFoods,
  MAX_UNCOUNTED_SHARE,
  USER_DISH_CATEGORY,
} from '../src/index.js';

const named = (name: string) => {
  const food = getRecipeIngredientFoods('PK').find((f) => f.name === name);
  if (!food) throw new Error(`catalogue has no "${name}"`);
  return food;
};

const MALAI_HANDI = [
  { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
  { name: 'Malai / Fresh Cream', grams: 40 },
  { name: 'Cooking Oil (Any Plain Oil)', grams: 10 },
  { name: 'Onion (Raw)', grams: 50 },
];

describe('composeRecipeFood', () => {
  it('limits ingredients to plain catalogue foods', () => {
    const foods = getRecipeIngredientFoods('PK');
    expect(foods.length).toBeGreaterThan(100);
    expect(foods.some((f) => f.name === 'Cooking Oil (Any Plain Oil)')).toBe(true);
  });

  it('takes every number from the catalogue, summed per ingredient', () => {
    const recipe = composeRecipeFood({ name: 'Chicken Malai Handi', ingredients: MALAI_HANDI })!;
    const expectedKcal = MALAI_HANDI.reduce(
      (sum, i) => sum + Math.round((named(i.name).kcal100g * i.grams) / 100),
      0
    );
    expect(recipe.kcalPerServing).toBe(expectedKcal);
    expect(recipe.servingGrams).toBe(250);
    // Logging the default serving gives back the serving's calories, within rounding.
    expect(Math.abs((recipe.food.kcal100g * 250) / 100 - expectedKcal)).toBeLessThanOrEqual(2);
  });

  it('files the dish as the user own food with one default serving', () => {
    const { food } = composeRecipeFood({
      name: '  Chicken Malai Handi ',
      ingredients: MALAI_HANDI,
      servingLabel: '1 bowl',
    })!;
    expect(food.name).toBe('Chicken Malai Handi');
    expect(food.source).toBe('user');
    expect(food.category).toBe(USER_DISH_CATEGORY);
    expect(food.isRecipe).toBe(true);
    expect(food.id).toMatch(/^user_dish_/);
    expect(food.servings).toEqual([{ label: '1 bowl', grams: 250, isDefault: true }]);
  });

  it('counts the cooking fat as the dish added oil', () => {
    const { food } = composeRecipeFood({ name: 'x', ingredients: MALAI_HANDI })!;
    // 10 g of oil across a 250 g serving.
    expect(food.oilAddedG).toBe(4);
  });

  it('reports names it cannot resolve and leaves them out of the totals', () => {
    const recipe = composeRecipeFood({
      name: 'x',
      ingredients: [...MALAI_HANDI, { name: 'Imaginary Spice Mix', grams: 20 }],
    })!;
    expect(recipe.notCounted).toEqual([{ name: 'Imaginary Spice Mix', grams: 20 }]);
    expect(recipe.uncountedShare).toBeCloseTo(20 / 270);
    expect(recipe.servingGrams).toBe(250);
  });

  it('values an ingredient the catalogue lacks from its USDA record', () => {
    // USDA FoodData Central #170173: coconut milk, canned (SR Legacy).
    const coconutMilk = foodFromUsdaRecord({
      fdcId: 170173,
      description: 'Nuts, coconut milk, canned (liquid expressed from grated meat and water)',
      per100g: { kcal: 197, protein: 2, carbs: 2.8, fat: 21.3, fibre: 0, sugar: 0, sodiumMg: 13, satFat: 18.9 },
    });
    expect(coconutMilk.source).toBe('usda');
    expect(coconutMilk.sourceRef).toBe('USDA FoodData Central #170173');

    const recipe = composeRecipeFood({
      name: 'Coconut chicken',
      ingredients: [
        { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
        { name: 'coconut milk, canned', grams: 100, food: coconutMilk },
      ],
    })!;
    const chicken = Math.round((named('Grilled Chicken Breast (Skinless)').kcal100g * 150) / 100);
    expect(recipe.kcalPerServing).toBe(chicken + 197);
    expect(recipe.notCounted).toEqual([]);
    expect(recipe.uncountedShare).toBe(0);
  });

  it('carries ingredients given as not counted into the share', () => {
    const recipe = composeRecipeFood({
      name: 'x',
      ingredients: MALAI_HANDI,
      notCounted: [{ name: 'khoya', grams: 50 }],
    })!;
    expect(recipe.uncountedShare).toBeCloseTo(50 / 300);
    expect(recipe.uncountedShare).toBeGreaterThan(MAX_UNCOUNTED_SHARE);
  });

  it('refuses a dish with nothing it can resolve', () => {
    expect(composeRecipeFood({ name: 'x', ingredients: [{ name: 'Nope', grams: 100 }] })).toBeUndefined();
  });
});
