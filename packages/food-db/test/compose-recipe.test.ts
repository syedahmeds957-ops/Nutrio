import { describe, expect, it } from 'vitest';
import {
  composeRecipeFood,
  getRecipeIngredientFoods,
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
    expect(recipe.unmatched).toEqual(['Imaginary Spice Mix']);
    expect(recipe.servingGrams).toBe(250);
  });

  it('refuses a dish with nothing it can resolve', () => {
    expect(composeRecipeFood({ name: 'x', ingredients: [{ name: 'Nope', grams: 100 }] })).toBeUndefined();
  });
});
