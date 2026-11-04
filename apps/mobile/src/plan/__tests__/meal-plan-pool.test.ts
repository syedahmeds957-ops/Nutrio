import { describe, expect, it } from 'vitest';
import { PlanDietPreference, solveDailyMealPlan } from '@nutrio/nutrition-core';
import { mealPlanFoodPool } from '../mealPlanPool.js';

const DIETS: PlanDietPreference[] = [
  'halal_omnivore',
  'halal_meat_moderate',
  'vegetarian_desi',
  'eggetarian',
  'vegan',
];

describe('mealPlanFoodPool', () => {
  it.each(['PK', 'SA'] as const)('keeps restaurant menus, desserts and sauces out of the %s plan pool', (region) => {
    const pool = mealPlanFoodPool(region);
    expect(pool.length).toBeGreaterThan(0);
    for (const food of pool) {
      expect(food.brand ?? food.brandId).toBeUndefined();
      expect(['Pakistani Fast Food', 'Sweets & Desserts', 'Desserts', 'Condiments']).not.toContain(food.category);
    }
  });

  it('gives Saudi plans the Saudi diet foods, not only the traditional dishes', () => {
    const saudi = mealPlanFoodPool('SA');
    expect(saudi.some((f) => f.category === 'Diet & Basics')).toBe(true);
    expect(saudi.some((f) => /khubz|bread|tamees/i.test(f.name))).toBe(true);
  });

  it.each(['PK', 'SA'] as const)('builds every %s diet for every day without throwing', (region) => {
    const pool = mealPlanFoodPool(region);
    for (const dietPreference of DIETS) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const plan = solveDailyMealPlan(
          { targetCalories: 1800, targetProteinGrams: 110, targetFatGrams: 55, targetCarbGrams: 210, dietPreference },
          pool,
          { dayIndex, region }
        );
        expect(plan.meals).toHaveLength(4);
        if (!plan.insufficientFoodPool) {
          expect(plan.isWithinTolerance, `${region} ${dietPreference} day ${dayIndex}`).toBe(true);
        }
      }
    }
  });
});
