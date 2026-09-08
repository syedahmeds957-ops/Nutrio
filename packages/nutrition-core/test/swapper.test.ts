import { describe, expect, it } from 'vitest';
import { solveDailyMealPlan } from '../src/solver.js';
import { generateMealSwaps } from '../src/swapper.js';
import { SolverFoodCandidate } from '../src/solver.js';

const testFoodPool: SolverFoodCandidate[] = [
  {
    name: 'Roti / Chapati (Whole Wheat)',
    category: 'Breads & Grains',
    cuisineTags: ['Pakistani'],
    kcal100g: 265,
    protein100g: 9.0,
    carb100g: 52.0,
    fat100g: 1.8,
    fibre100g: 7.0,
    sugar100g: 0.5,
    oilAddedG: 0,
    servings: [{ label: '1 medium roti (45g)', grams: 45, isDefault: true }],
  },
  {
    name: 'Plain Paratha',
    category: 'Breads & Grains',
    cuisineTags: ['Pakistani', 'Breakfast'],
    kcal100g: 360,
    protein100g: 6.8,
    carb100g: 46.0,
    fat100g: 16.5,
    fibre100g: 4.2,
    sugar100g: 0.8,
    oilAddedG: 14,
    servings: [{ label: '1 medium paratha (80g)', grams: 80, isDefault: true }],
  },
  {
    name: 'Steamed Basmati Rice',
    category: 'Breads & Grains',
    cuisineTags: ['Pakistani'],
    kcal100g: 130,
    protein100g: 2.7,
    carb100g: 28.2,
    fat100g: 0.3,
    fibre100g: 0.4,
    sugar100g: 0.1,
    oilAddedG: 0,
    servings: [{ label: '1 katori (150g)', grams: 150, isDefault: true }],
  },
  {
    name: 'Boiled Egg',
    category: 'Breakfast & Eggs',
    cuisineTags: ['Pakistani'],
    kcal100g: 155,
    protein100g: 12.6,
    carb100g: 1.1,
    fat100g: 10.6,
    fibre100g: 0,
    sugar100g: 1.1,
    oilAddedG: 0,
    servings: [{ label: '1 large egg (50g)', grams: 50, isDefault: true }],
  },
  {
    name: 'Chicken Karahi',
    category: 'Curries & Meat Dishes',
    cuisineTags: ['Pakistani'],
    kcal100g: 195,
    protein100g: 16.5,
    carb100g: 3.5,
    fat100g: 12.8,
    fibre100g: 1.0,
    sugar100g: 1.8,
    oilAddedG: 18,
    servings: [{ label: '1 serving (200g)', grams: 200, isDefault: true }],
  },
  {
    name: 'Chicken Tikka Breast',
    category: 'Barbecue & Grills',
    cuisineTags: ['Pakistani', 'BBQ'],
    kcal100g: 150,
    protein100g: 26.5,
    carb100g: 1.8,
    fat100g: 4.2,
    fibre100g: 0.4,
    sugar100g: 0.4,
    oilAddedG: 4,
    servings: [{ label: '1 breast piece (200g)', grams: 200, isDefault: true }],
  },
  {
    name: 'Beef Seekh Kebab',
    category: 'Barbecue & Grills',
    cuisineTags: ['Pakistani'],
    kcal100g: 220,
    protein100g: 19.5,
    carb100g: 3.5,
    fat100g: 14.0,
    fibre100g: 0.8,
    sugar100g: 0.8,
    oilAddedG: 10,
    servings: [{ label: '1 skewer (80g)', grams: 80, isDefault: true }],
  },
  {
    name: 'Daal Chana Tadka',
    category: 'Daals & Pulses',
    cuisineTags: ['Pakistani'],
    kcal100g: 135,
    protein100g: 6.8,
    carb100g: 17.5,
    fat100g: 4.5,
    fibre100g: 4.8,
    sugar100g: 1.2,
    oilAddedG: 8,
    servings: [{ label: '1 katori (150g)', grams: 150, isDefault: true }],
  },
  {
    name: 'Bhindi Masala Fry',
    category: 'Vegetables & Sabzi',
    cuisineTags: ['Pakistani'],
    kcal100g: 120,
    protein100g: 2.8,
    carb100g: 9.5,
    fat100g: 8.0,
    fibre100g: 3.2,
    sugar100g: 2.0,
    oilAddedG: 12,
    servings: [{ label: '1 katori (140g)', grams: 140, isDefault: true }],
  },
  {
    name: 'Shami Kebab',
    category: 'Snacks',
    cuisineTags: ['Pakistani'],
    kcal100g: 210,
    protein100g: 16.5,
    carb100g: 12.0,
    fat100g: 10.8,
    fibre100g: 3.2,
    sugar100g: 0.8,
    oilAddedG: 8,
    servings: [{ label: '1 piece (55g)', grams: 55, isDefault: true }],
  },
  {
    name: 'Karak Chai without Sugar',
    category: 'Beverages',
    cuisineTags: ['Pakistani'],
    kcal100g: 35,
    protein100g: 2.1,
    carb100g: 3.2,
    fat100g: 1.6,
    fibre100g: 0,
    sugar100g: 3.2,
    oilAddedG: 0,
    servings: [{ label: '1 cup (150ml)', grams: 150, isDefault: true }],
  },
];

describe('One-Tap Macro-Matched Meal Swapper (Task 2.2)', () => {
  it('generates exactly 3 macro-matched alternatives within +-5% of original calories for lunch', () => {
    const solverInput = {
      targetCalories: 2000,
      targetProteinGrams: 140,
      targetFatGrams: 55,
      targetCarbGrams: 235,
      dietPreference: 'halal_omnivore' as const,
      budgetTierPKR: 'standard_3500_7000' as const,
    };

    const plan = solveDailyMealPlan(solverInput, testFoodPool);
    const lunchMeal = plan.meals.find((m) => m.slot === 'lunch')!;

    const swapResult = generateMealSwaps(lunchMeal, solverInput, testFoodPool);

    expect(swapResult.originalSlot).toBe('lunch');
    expect(swapResult.options).toHaveLength(3);

    for (const option of swapResult.options) {
      expect(option.optionId.length).toBeGreaterThan(0);
      expect(option.title.length).toBeGreaterThan(0);
      expect(option.items.length).toBeGreaterThan(0);

      // Must be within +-5% of the original meal calories
      expect(Math.abs(option.calorieDeltaPct)).toBeLessThanOrEqual(5.0);
      expect(option.calories).toBeGreaterThan(0);
      expect(option.proteinGrams).toBeGreaterThan(0);
    }
  });

  it('generates 3 breakfast swap options matching breakfast target', () => {
    const solverInput = {
      targetCalories: 1900,
      targetProteinGrams: 130,
      targetFatGrams: 50,
      targetCarbGrams: 230,
      dietPreference: 'halal_omnivore' as const,
      budgetTierPKR: 'standard_3500_7000' as const,
    };

    const plan = solveDailyMealPlan(solverInput, testFoodPool);
    const breakfastMeal = plan.meals.find((m) => m.slot === 'breakfast')!;

    const swapResult = generateMealSwaps(breakfastMeal, solverInput, testFoodPool);

    expect(swapResult.originalSlot).toBe('breakfast');
    expect(swapResult.options).toHaveLength(3);

    for (const option of swapResult.options) {
      expect(Math.abs(option.calorieDeltaPct)).toBeLessThanOrEqual(5.0);
    }
  });

  it('preserves vegetarian boundaries when swapping meals on a vegetarian diet', () => {
    const solverInput = {
      targetCalories: 1800,
      targetProteinGrams: 90,
      targetFatGrams: 45,
      targetCarbGrams: 260,
      dietPreference: 'vegetarian_desi' as const,
      budgetTierPKR: 'budget_under_3500' as const,
    };

    const plan = solveDailyMealPlan(solverInput, testFoodPool);
    const dinnerMeal = plan.meals.find((m) => m.slot === 'dinner')!;

    const swapResult = generateMealSwaps(dinnerMeal, solverInput, testFoodPool);

    expect(swapResult.options).toHaveLength(3);
    for (const option of swapResult.options) {
      const optionFoods = option.items.map((i) => i.foodName);
      expect(optionFoods.some((f) => f.includes('Chicken'))).toBe(false);
      expect(optionFoods.some((f) => f.includes('Beef'))).toBe(false);
      expect(Math.abs(option.calorieDeltaPct)).toBeLessThanOrEqual(5.0);
    }
  });
});
