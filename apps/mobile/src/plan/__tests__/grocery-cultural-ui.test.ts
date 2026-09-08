import { describe, expect, it } from 'vitest';
import {
  adaptPlanForFamilyMode,
  generateRamadanPlan,
  generateWeeklyGroceryList,
  MealPlanSolverInput,
  solveDailyMealPlan,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';

describe('Mobile Grocery List & Cultural Modes Flow (Task 2.7)', () => {
  const solverInput: MealPlanSolverInput = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    dietPreference: 'halal_omnivore',
    budgetTierPKR: 'standard_3500_7000',
  };

  it('generates a categorized weekly grocery list with PKR budget evaluation', () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekPlans = days.map(() =>
      solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as any)
    );

    const grocery = generateWeeklyGroceryList(weekPlans, 'standard_3500_7000');

    expect(grocery.weekDaysCount).toBe(7);
    expect(grocery.categories.length).toBeGreaterThanOrEqual(3);
    expect(grocery.estimatedTotalCostPKR).toBeGreaterThan(0);
    expect(grocery.maxBudgetPKR).toBe(7000);

    // Verify key categories exist
    const catTitles = grocery.categories.map((c) => c.title);
    expect(catTitles).toContain('Atta & Grains');
    expect(catTitles).toContain('Cooking Oil & Pantry');

    // Verify raw yields conversion
    const grainsCat = grocery.categories.find((c) => c.category === 'atta_and_grains')!;
    expect(grainsCat.items.length).toBeGreaterThan(0);
    expect(grainsCat.items[0].quantityAmount).toBeGreaterThan(0);
  });

  it('seamlessly integrates Pakistani Family Mode into mobile plan workflow', () => {
    const basePlan = solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as any);

    const adapted = adaptPlanForFamilyMode(
      basePlan,
      {
        familyDishName: 'Chicken Karahi',
        familyMealSlot: 'dinner',
      },
      solverInput,
      PAKISTANI_STAPLES_DATA as any
    );

    expect(adapted.isFamilyModeActive).toBe(true);
    expect(adapted.plan.isWithinTolerance).toBe(true);
    expect(Math.abs(adapted.plan.calorieDeviationPct)).toBeLessThanOrEqual(5.0);

    const dinnerSlot = adapted.plan.meals.find((m) => m.slot === 'dinner')!;
    expect(dinnerSlot.items.some((i) => i.foodName.includes('Karahi'))).toBe(true);
  });

  it('seamlessly integrates Ramadan Fasting Mode into mobile plan workflow', () => {
    const ramadan = generateRamadanPlan(
      solverInput,
      PAKISTANI_STAPLES_DATA as any,
      3000
    );

    expect(ramadan.isRamadanMode).toBe(true);
    expect(ramadan.suhoor.slot).toBe('breakfast');
    expect(ramadan.iftar.slot).toBe('dinner');
    expect(ramadan.postTarawihSnack.slot).toBe('snacks_chai');
    expect(ramadan.hydrationWindows).toHaveLength(5);
  });
});
