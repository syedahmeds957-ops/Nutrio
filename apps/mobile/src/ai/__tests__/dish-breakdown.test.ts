import { describe, expect, it, vi } from 'vitest';
import { getRecipeIngredientFoods } from '@nutrio/food-db';
import { requestDishBreakdown } from '../dishBreakdown.js';

const SERVER_ANSWER = {
  success: true,
  dishName: 'Chicken Malai Handi',
  servingDescription: '1 bowl (about 250 g)',
  ingredients: [
    { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
    { name: 'Malai / Fresh Cream', grams: 40 },
    { name: 'Cooking Oil (Any Plain Oil)', grams: 10 },
    { name: 'Onion (Raw)', grams: 50 },
  ],
  usedWebSearch: true,
};

const kcalFor = (name: string, grams: number) => {
  const food = getRecipeIngredientFoods('PK').find((f) => f.name === name)!;
  return Math.round((food.kcal100g * grams) / 100);
};

describe('requestDishBreakdown', () => {
  it('sends the dish and the catalogue names, never asking for numbers', async () => {
    const invoke = vi.fn(async () => SERVER_ANSWER);
    await requestDishBreakdown('chicken malai handi', 'PK', invoke);

    const [name, body] = invoke.mock.calls[0] as unknown as [string, any];
    expect(name).toBe('dish-breakdown');
    expect(body.dishName).toBe('chicken malai handi');
    expect(body.catalogueNames).toContain('Cooking Oil (Any Plain Oil)');
  });

  it('prices the dish from the food database, keeping the name the user typed', async () => {
    const result = await requestDishBreakdown('Malai Handi', 'PK', async () => SERVER_ANSWER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expected = SERVER_ANSWER.ingredients.reduce((sum, i) => sum + kcalFor(i.name, i.grams), 0);
    expect(result.recipe.kcalPerServing).toBe(expected);
    expect(result.recipe.food.name).toBe('Malai Handi');
    expect(result.recipe.food.source).toBe('user');
  });

  it('ignores any calorie number a server might add', async () => {
    const result = await requestDishBreakdown('Malai Handi', 'PK', async () => ({
      ...SERVER_ANSWER,
      calories: 9999,
    }));
    expect(result.ok && result.recipe.kcalPerServing).not.toBe(9999);
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
