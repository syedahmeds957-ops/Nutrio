import { describe, expect, it } from 'vitest';
import { solveDailyMealPlan } from '../src/solver.js';
import { generateWeeklyGroceryList } from '../src/grocery.js';
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

describe('Weekly Grocery List Generator & PKR Budget Calculator (Task 2.3)', () => {
  it('aggregates a 7-day meal plan into categorized raw grocery items', () => {
    const singleDayPlan = solveDailyMealPlan(
      {
        targetCalories: 2000,
        targetProteinGrams: 140,
        targetFatGrams: 55,
        targetCarbGrams: 235,
        dietPreference: 'halal_omnivore',
        budgetTierPKR: 'standard_3500_7000',
      },
      testFoodPool
    );

    // Create a 7-day schedule
    const weekPlans = Array(7).fill(singleDayPlan);

    const grocery = generateWeeklyGroceryList(weekPlans, 'standard_3500_7000');

    expect(grocery.weekDaysCount).toBe(7);
    expect(grocery.budgetTier).toBe('standard_3500_7000');
    expect(grocery.maxBudgetPKR).toBe(7000);
    expect(grocery.estimatedTotalCostPKR).toBeGreaterThan(0);
    expect(grocery.categories.length).toBeGreaterThanOrEqual(4);

    // Verify key categories exist
    const categoryKeys = grocery.categories.map((c) => c.category);
    expect(categoryKeys).toContain('atta_and_grains');
    expect(categoryKeys).toContain('dairy_and_eggs');
    expect(categoryKeys).toContain('oils_and_pantry');

    // Verify raw weights and costs
    const attaCat = grocery.categories.find((c) => c.category === 'atta_and_grains')!;
    expect(attaCat.subtotalPKR).toBeGreaterThan(0);
    expect(attaCat.items.some((i) => i.name.includes('Atta'))).toBe(true);

    const oilCat = grocery.categories.find((c) => c.category === 'oils_and_pantry')!;
    expect(oilCat.items.some((i) => i.name.includes('Oil'))).toBe(true);
  });

  it('correctly flags budget adherence and computes budget difference', () => {
    const singleDayPlan = solveDailyMealPlan(
      {
        targetCalories: 1800,
        targetProteinGrams: 90,
        targetFatGrams: 45,
        targetCarbGrams: 240,
        dietPreference: 'vegetarian_desi',
        budgetTierPKR: 'budget_under_3500',
      },
      testFoodPool
    );

    const weekPlans = Array(7).fill(singleDayPlan);
    const grocery = generateWeeklyGroceryList(weekPlans, 'budget_under_3500');

    expect(grocery.maxBudgetPKR).toBe(3500);
    expect(typeof grocery.isWithinBudget).toBe('boolean');
    expect(grocery.budgetDifferencePKR).toBe(grocery.maxBudgetPKR - grocery.estimatedTotalCostPKR);
    expect(grocery.budgetOptimizationTip).toBeDefined();
  });
});
