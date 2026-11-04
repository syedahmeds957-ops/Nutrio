import { describe, it, expect } from 'vitest';
import { getStapleDefinitions, resolveStaple } from '../staples.js';

describe('quick staple resolution', () => {
  it('logs the egg chip as a boiled egg, not a kofta', () => {
    const egg = getStapleDefinitions('PK').find((s) => s.id === 'egg')!;
    const { food } = resolveStaple(egg, 'PK');

    expect(food.name).toBe('Boiled Egg (Whole)');
    expect(food.name).not.toMatch(/kofta/i);
  });

  it('never falls back to an unrelated dish when nothing matches', () => {
    const unknown = {
      id: 'unknown',
      foodName: 'A Dish That Does Not Exist',
      name: 'Mystery Snack',
      calories: 123,
      proteinGrams: 4,
      fatGrams: 2,
      carbGrams: 18,
      icon: 'utensils' as const,
    };
    const { food, calories } = resolveStaple(unknown, 'PK');

    // Its own macros, not foodPool[0].
    expect(food.name).toBe('Mystery Snack');
    expect(calories).toBe(123);
  });

  it.each(['PK', 'SA'] as const)(
    'resolves every %s chip to a food whose name it claims',
    (region) => {
      for (const staple of getStapleDefinitions(region)) {
        const { food, serving, calories } = resolveStaple(staple, region);
        const expected = (staple.foodName || staple.name).toLowerCase();

        expect(food.name.toLowerCase()).toBe(expected);
        expect(serving.grams).toBeGreaterThan(0);
        expect(calories).toBeGreaterThanOrEqual(0);
      }
    }
  );

  it.each(['PK', 'SA'] as const)(
    'keeps the %s chip calories within a serving of what is logged',
    (region) => {
      for (const staple of getStapleDefinitions(region)) {
        const { food, serving, calories } = resolveStaple(staple, region);
        // The chip shows `calories`, and the logger multiplies the same serving
        // by the same quantity, so the two cannot drift apart.
        expect(calories).toBe(Math.round((food.kcal100g * serving.grams) / 100));
      }
    }
  );
});
