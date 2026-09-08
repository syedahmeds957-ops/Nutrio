import { describe, expect, it } from 'vitest';
import {
  generateMealSwaps,
  MealPlanSolverInput,
  solveDailyMealPlan,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';

describe('Mobile Weekly Meal Plan & Swap Engine (Task 2.6)', () => {
  const solverInput: MealPlanSolverInput = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    dietPreference: 'halal_omnivore',
    budgetTierPKR: 'standard_3500_7000',
  };

  it('generates a full 7-day schedule where each day meets the +-5% tolerance', () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekPlans = daysOfWeek.map(() =>
      solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as any)
    );

    expect(weekPlans).toHaveLength(7);
    for (const dayPlan of weekPlans) {
      expect(dayPlan.isWithinTolerance).toBe(true);
      expect(Math.abs(dayPlan.calorieDeviationPct)).toBeLessThanOrEqual(5.0);
      expect(dayPlan.meals).toHaveLength(4);
    }
  });

  it('swaps a meal slot and preserves day-level macro tolerance', () => {
    const dayPlan = solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as any);
    const lunchSlot = dayPlan.meals.find((m) => m.slot === 'lunch')!;

    const swaps = generateMealSwaps(
      lunchSlot,
      solverInput,
      PAKISTANI_STAPLES_DATA as any
    );

    expect(swaps.options).toHaveLength(3);
    const chosenOption = swaps.options[0];

    // Verify option is within +-5% of original meal
    expect(Math.abs(chosenOption.calorieDeltaPct)).toBeLessThanOrEqual(5.0);

    // Apply swap to day plan
    const updatedMeals = dayPlan.meals.map((m) => {
      if (m.slot === 'lunch') {
        return {
          ...m,
          title: chosenOption.title,
          actualCalories: chosenOption.calories,
          items: chosenOption.items,
        };
      }
      return m;
    });

    const newActualCalories = updatedMeals.reduce((s, m) => s + m.actualCalories, 0);
    const newDeviationPct = Number(
      (((newActualCalories - dayPlan.targetCalories) / dayPlan.targetCalories) * 100).toFixed(1)
    );

    expect(Math.abs(newDeviationPct)).toBeLessThanOrEqual(5.0);
  });
});
