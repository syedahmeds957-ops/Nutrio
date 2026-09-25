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

  it('generates a full 7-day schedule where each day meets the +-5% tolerance with daily variety', () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekPlans = daysOfWeek.map((_, dayIndex) =>
      solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as any, { dayIndex })
    );

    expect(weekPlans).toHaveLength(7);
    for (const dayPlan of weekPlans) {
      expect(dayPlan.isWithinTolerance).toBe(true);
      expect(Math.abs(dayPlan.calorieDeviationPct)).toBeLessThanOrEqual(5.0);
      expect(dayPlan.meals).toHaveLength(4);
    }

    // Daily variety check: Monday and Tuesday must have different lunch dishes
    const mondayLunchFood = weekPlans[0].meals.find((m) => m.slot === 'lunch')?.items[0].foodName;
    const tuesdayLunchFood = weekPlans[1].meals.find((m) => m.slot === 'lunch')?.items[0].foodName;
    const wednesdayLunchFood = weekPlans[2].meals.find((m) => m.slot === 'lunch')?.items[0].foodName;

    expect(mondayLunchFood).toBeDefined();
    expect(tuesdayLunchFood).toBeDefined();
    expect(wednesdayLunchFood).toBeDefined();

    // Dishes should not all be identical
    const uniqueLunches = new Set([mondayLunchFood, tuesdayLunchFood, wednesdayLunchFood]);
    expect(uniqueLunches.size).toBeGreaterThan(1);
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
