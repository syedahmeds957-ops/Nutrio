import { describe, expect, it } from 'vitest';
import { MealPlanSolverInput, solveDailyMealPlan } from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA, SAUDI_TRADITIONAL_FOODS } from '@nutrio/food-db';

/**
 * The Diet & Basics catalogue is region-neutral: foul medames, labneh, qahwa
 * and tabbouleh all merge into the *Pakistani* pool as well as the Saudi one.
 *
 * The solver used to decide which regional plan to build by asking whether the
 * pool contained any Saudi food at all, so those few entries turned a Pakistani
 * user's whole week into "Saudi Protein Breakfast" and "Traditional Saudi
 * Lunch" — with nihari and sajji still listed underneath. These tests run
 * against the real catalogues, not a fixture, because a fixture is exactly what
 * failed to catch it.
 */
describe('Meal plan region selection', () => {
  const solverInput: MealPlanSolverInput = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    dietPreference: 'halal_omnivore',
  };

  const titlesFor = (pool: unknown, region: 'PK' | 'SA') =>
    solveDailyMealPlan(solverInput, pool as never, { dayIndex: 0, region }).meals.map(
      (m) => m.title
    );

  it('builds a Pakistani week from the Pakistani pool', () => {
    for (const title of titlesFor(PAKISTANI_STAPLES_DATA, 'PK')) {
      expect(title, `"${title}" is a Saudi title in a Pakistani plan`).not.toMatch(/saudi/i);
    }
  });

  it('builds a Saudi week from the Saudi pool', () => {
    expect(titlesFor(SAUDI_TRADITIONAL_FOODS, 'SA').join(' | ')).toMatch(/saudi/i);
  });

  it('keeps every day of the Pakistani week Pakistani', () => {
    // The bug showed up on a single day's card; the rotation must not
    // reintroduce it later in the week.
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const plan = solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as never, {
        dayIndex,
        region: 'PK',
      });
      for (const meal of plan.meals) {
        expect(meal.title, `day ${dayIndex}: "${meal.title}"`).not.toMatch(/saudi/i);
      }
    }
  });

  it('does not flip to Saudi just because the pool carries region-neutral diet foods', () => {
    // Without an explicit region the solver falls back to a majority test.
    // The Pakistani pool holds a handful of Saudi diet items, and that must
    // stay a minority verdict.
    const inferred = solveDailyMealPlan(solverInput, PAKISTANI_STAPLES_DATA as never, {
      dayIndex: 0,
    });
    for (const meal of inferred.meals) {
      expect(meal.title, `inferred: "${meal.title}"`).not.toMatch(/saudi/i);
    }
  });

  it('still infers Saudi correctly when no region is passed', () => {
    const inferred = solveDailyMealPlan(solverInput, SAUDI_TRADITIONAL_FOODS as never, {
      dayIndex: 0,
    });
    expect(inferred.meals.map((m) => m.title).join(' | ')).toMatch(/saudi/i);
  });

  it('confirms the Pakistani pool really does carry Saudi-tagged diet foods', () => {
    // If this ever goes to zero the tests above stop proving anything, because
    // the condition that caused the bug would no longer exist.
    const saudiTagged = (PAKISTANI_STAPLES_DATA as { cuisineTags?: string[] }[]).filter((f) =>
      f.cuisineTags?.some((t) => t.toLowerCase() === 'saudi')
    );
    expect(saudiTagged.length).toBeGreaterThan(0);
    expect(saudiTagged.length * 2).toBeLessThan(PAKISTANI_STAPLES_DATA.length);
  });
});
