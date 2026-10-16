import { describe, it, expect } from 'vitest';
import { ALL_EXPANDED_PAKISTANI_FOODS, PIECE_SERVING_FOOD_NAMES } from '../src/data/index.js';

const byName = (name: string) => ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.name === name);
const defaultServing = (name: string) => byName(name)?.servings.find((s) => s.isDefault);

describe('per-piece servings for countable foods', () => {
  it('finds every food the table names, so a rename cannot drop its piece serving', () => {
    const missing = PIECE_SERVING_FOOD_NAMES.filter((name) => !byName(name));
    expect(missing).toEqual([]);
  });

  it('makes the piece serving the single default', () => {
    for (const name of PIECE_SERVING_FOOD_NAMES) {
      const servings = byName(name)!.servings;
      expect(servings.filter((s) => s.isDefault), name).toHaveLength(1);
      expect(servings[0].isDefault, name).toBe(true);
    }
  });

  it('keeps the old generic serving as a second choice', () => {
    const labels = byName('Gulab Jamun (in Warm Sugar Syrup)')!.servings.map((s) => s.label);
    expect(labels).toEqual(['1 gulab jamun (45g)', '1 standard serving (200g)']);
  });

  it('logs one gulab jamun, not 200g of them', () => {
    const food = byName('Gulab Jamun (in Warm Sugar Syrup)')!;
    const kcal = (food.kcal100g * defaultServing(food.name)!.grams) / 100;
    expect(kcal).toBeLessThan(200);
  });

  it.each([
    ['Aloo Samosa (Crispy Fried Potato)', 60, 120],
    ['Shami Kabab (Beef & Daal Chana)', 30, 80],
    ['Jalebi (Crispy Pretzel in Sugar Syrup)', 15, 50],
    ['Aloo Paratha (Stuffed Potato)', 100, 200],
  ])('gives %s a believable piece weight', (name, min, max) => {
    const grams = defaultServing(name)!.grams;
    expect(grams).toBeGreaterThanOrEqual(min);
    expect(grams).toBeLessThanOrEqual(max);
  });

  it('leaves curries on their bowl serving', () => {
    expect(defaultServing('Aloo Gosht (Mutton Shorba)')!.grams).toBe(200);
  });

  it('has a per-piece serving for egg whites and whole eggs', () => {
    expect(defaultServing('Egg White (Boiled)')!.grams).toBe(33);
    expect(defaultServing('Boiled Egg (Whole)')!.grams).toBe(50);
  });
});
