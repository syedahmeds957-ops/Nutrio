import { describe, expect, it, vi } from 'vitest';
import { getRecipeIngredientFoods, USDA_INGREDIENT_CATEGORY } from '@nutrio/food-db';
import { requestDishBreakdown } from '../dishBreakdown.js';

const COCONUT_MILK = {
  name: 'coconut milk, canned',
  grams: 100,
  fdcId: 170173,
  description: 'Nuts, coconut milk, canned (liquid expressed from grated meat and water)',
  per100g: { kcal: 197, protein: 2, carbs: 2.8, fat: 21.3, fibre: 0, sugar: 0, sodiumMg: 13, satFat: 18.9 },
};

const SERVER_ANSWER = {
  success: true,
  dishName: 'Coconut Chicken Curry',
  servingDescription: '1 bowl (about 300 g)',
  ingredients: [
    { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
    { name: 'Cooking Oil (Any Plain Oil)', grams: 10 },
    { name: 'Onion (Raw)', grams: 50 },
  ],
  usdaIngredients: [COCONUT_MILK],
  notCounted: [],
  usedWebSearch: true,
};

const kcalFor = (name: string, grams: number) => {
  const food = getRecipeIngredientFoods('PK').find((f) => f.name === name)!;
  return Math.round((food.kcal100g * grams) / 100);
};

describe('requestDishBreakdown', () => {
  it('sends the dish and the catalogue names, never asking for numbers', async () => {
    const invoke = vi.fn(async () => SERVER_ANSWER);
    await requestDishBreakdown('coconut chicken curry', 'PK', invoke);

    const [name, body] = invoke.mock.calls[0] as unknown as [string, any];
    expect(name).toBe('dish-breakdown');
    expect(body.dishName).toBe('coconut chicken curry');
    expect(body.catalogueNames).toContain('Cooking Oil (Any Plain Oil)');
  });

  it('values catalogue ingredients from food-db and the rest from their USDA record', async () => {
    const result = await requestDishBreakdown('Coconut Chicken', 'PK', async () => SERVER_ANSWER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const catalogueKcal = SERVER_ANSWER.ingredients.reduce((sum, i) => sum + kcalFor(i.name, i.grams), 0);
    expect(result.recipe.kcalPerServing).toBe(catalogueKcal + 197);
    expect(result.recipe.food.name).toBe('Coconut Chicken');
    const usdaRow = result.recipe.ingredients.find((i) => i.food.category === USDA_INGREDIENT_CATEGORY)!;
    expect(usdaRow.food.sourceRef).toBe('USDA FoodData Central #170173');
  });

  it('ignores any calorie number a server might add outside a USDA record', async () => {
    const result = await requestDishBreakdown('x', 'PK', async () => ({ ...SERVER_ANSWER, calories: 9999 }));
    expect(result.ok && result.recipe.kcalPerServing).not.toBe(9999);
  });

  it('keeps a small uncounted ingredient visible but still adds the dish', async () => {
    const result = await requestDishBreakdown('x', 'PK', async () => ({
      ...SERVER_ANSWER,
      notCounted: [{ name: 'khoya', grams: 10 }],
    }));
    expect(result.ok && result.recipe.notCounted).toEqual([{ name: 'khoya', grams: 10 }]);
  });

  it('refuses a dish whose uncounted part is too large to give an honest number', async () => {
    const result = await requestDishBreakdown('x', 'PK', async () => ({
      ...SERVER_ANSWER,
      notCounted: [{ name: 'khoya', grams: 150 }],
    }));
    expect(result).toEqual({ ok: false, reason: 'incomplete', missing: [{ name: 'khoya', grams: 150 }] });
  });

  it('rejects a USDA record with impossible values', async () => {
    const result = await requestDishBreakdown('x', 'PK', async () => ({
      ...SERVER_ANSWER,
      usdaIngredients: [{ ...COCONUT_MILK, per100g: { ...COCONUT_MILK.per100g, kcal: 5000 } }],
    }));
    expect(result).toEqual({ ok: false, reason: 'unavailable' });
  });

  it.each([
    ['HTTP 401', 'sign_in'],
    ['HTTP 422', 'unknown_dish'],
    ['HTTP 502', 'unavailable'],
    ['Backend not configured', 'unavailable'],
  ])('explains a %s failure as %s', async (message, reason) => {
    const result = await requestDishBreakdown('x dish', 'PK', async () => {
      throw new Error(`Edge function "dish-breakdown" returned ${message}.`);
    });
    expect(result).toEqual({ ok: false, reason });
  });

  it('treats an unexpected body as unavailable', async () => {
    const result = await requestDishBreakdown('x dish', 'PK', async () => ({ nope: true }));
    expect(result).toEqual({ ok: false, reason: 'unavailable' });
  });
});
