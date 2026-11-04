import { describe, expect, it } from 'vitest';
import { filterFoodPool, MealPlanSolverInput, solveDailyMealPlan } from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';

/**
 * Runs against the real 3,030-item catalogue, not a fixture.
 *
 * The bug this guards was invisible to fixtures: the filter matched English
 * words against dish names that are written in Urdu, and checked for food
 * categories ("Meat", "Barbecue") that do not exist in this catalogue at all.
 * A fixture built from tidy English names would have passed while 140 real
 * meat and fish dishes sat in the vegetarian pool.
 */
describe('Meal plans honour the survey diet preference', () => {
  const base = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
  };

  const MEAT_OR_FISH =
    /keema|qeema|kofta|kabab|kebab|sajji|gosht|boti|haleem|paya|seekh|shami|murgh|chicken|beef|mutton|nihari|maghaz|kaleji|fish|machli|prawn|jhinga|shrimp|tikka/i;
  const EGG = /egg|anda|omelette|bhurji|khagina|nargisi|tamago|frittata|menemen/i;
  const DAIRY = /milk|doodh|dahi|yogurt|lassi|paneer|cheese|malai|kheer|firni|ghee|butter|cream|chai|kulfi/i;

  const poolFor = (dietPreference: string) =>
    filterFoodPool(PAKISTANI_STAPLES_DATA as never, {
      ...base,
      dietPreference,
    } as MealPlanSolverInput);

  const weekFoods = (dietPreference: string) => {
    const week = [0, 1, 2, 3, 4, 5, 6].map((dayIndex) =>
      solveDailyMealPlan({ ...base, dietPreference } as MealPlanSolverInput, PAKISTANI_STAPLES_DATA as never, {
        dayIndex,
        region: 'PK',
      })
    );
    return {
      week,
      names: [...new Set(week.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodName))))],
    };
  };

  it('leaves no meat or fish in the vegetarian pool', () => {
    const leaked = poolFor('vegetarian_desi').filter((f) => MEAT_OR_FISH.test(f.name));
    expect(leaked.map((f) => f.name)).toEqual([]);
  });

  it('never serves a vegetarian meat, fish or egg across a whole week', () => {
    const { names } = weekFoods('vegetarian_desi');
    expect(names.filter((n) => MEAT_OR_FISH.test(n))).toEqual([]);
    expect(names.filter((n) => EGG.test(n))).toEqual([]);
  });

  it('never serves an eggetarian meat or fish, but does serve eggs', () => {
    const { names } = weekFoods('eggetarian');
    expect(names.filter((n) => MEAT_OR_FISH.test(n))).toEqual([]);
    expect(names.some((n) => EGG.test(n))).toBe(true);
  });

  it('never serves a vegan any animal product across a whole week', () => {
    const { names } = weekFoods('vegan');
    expect(names.filter((n) => MEAT_OR_FISH.test(n))).toEqual([]);
    expect(names.filter((n) => EGG.test(n))).toEqual([]);
    expect(names.filter((n) => DAIRY.test(n))).toEqual([]);
  });

  it('still hits the calorie target on every restricted diet', () => {
    // A correct filter is worth nothing if it shrinks the pool so far that the
    // solver can no longer build a plan that meets the user's targets.
    for (const pref of ['vegetarian_desi', 'eggetarian', 'vegan']) {
      const { week } = weekFoods(pref);
      for (const day of week) {
        expect(Math.abs(day.calorieDeviationPct), `${pref}: ${day.calorieDeviationPct}%`).toBeLessThanOrEqual(5);
      }
    }
  });

  it('leaves the omnivore pool untouched', () => {
    expect(poolFor('halal_omnivore')).toHaveLength(PAKISTANI_STAPLES_DATA.length);
  });

  it('never reaches outside the filtered pool for a fallback dish', () => {
    // The default bread fell back to `foodPool[0]` — unfiltered — and the first
    // entry in this catalogue is Chicken Tikka.
    for (const pref of ['vegetarian_desi', 'eggetarian', 'vegan']) {
      const allowed = new Set(poolFor(pref).map((f) => f.name));
      const { names } = weekFoods(pref);
      for (const name of names) {
        expect(allowed.has(name), `${pref} served "${name}" from outside its pool`).toBe(true);
      }
    }
  });
});
