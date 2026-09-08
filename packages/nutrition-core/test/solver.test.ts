import { describe, expect, it } from 'vitest';
import { solveDailyMealPlan, filterFoodPool, SolverFoodCandidate } from '../src/solver.js';

// Sample authentic test food pool
const mockFoodPool: SolverFoodCandidate[] = [
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
    name: 'Karela Pyaz Fry',
    category: 'Vegetables & Sabzi',
    cuisineTags: ['Pakistani'],
    kcal100g: 115,
    protein100g: 2.0,
    carb100g: 9.0,
    fat100g: 8.2,
    fibre100g: 3.5,
    sugar100g: 3.5,
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
  {
    name: 'Gulab Jamun (Mithai)',
    category: 'Desserts & Sweets',
    cuisineTags: ['Pakistani'],
    kcal100g: 380,
    protein100g: 5.5,
    carb100g: 58.0,
    fat100g: 15.0,
    fibre100g: 0.8,
    sugar100g: 45.0,
    oilAddedG: 12,
    servings: [{ label: '1 piece (50g)', grams: 50, isDefault: true }],
  },
];

describe('Deterministic Constraint Meal Plan Solver (Task 2.1)', () => {
  it('generates a daily plan strictly within +-5% of calorie target', () => {
    const plan = solveDailyMealPlan(
      {
        targetCalories: 2000,
        targetProteinGrams: 140,
        targetFatGrams: 55,
        targetCarbGrams: 235,
        dietPreference: 'halal_omnivore',
        budgetTierPKR: 'standard_3500_7000',
      },
      mockFoodPool
    );

    // Rule: Must be within 5% tolerance
    expect(plan.isWithinTolerance).toBe(true);
    expect(Math.abs(plan.calorieDeviationPct)).toBeLessThanOrEqual(5.0);
    expect(plan.actualCalories).toBeGreaterThanOrEqual(1900);
    expect(plan.actualCalories).toBeLessThanOrEqual(2100);

    // Must have 4 slots: Breakfast, Lunch, Dinner, Snacks/Chai
    expect(plan.meals).toHaveLength(4);
    expect(plan.meals.map((m) => m.slot)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
      'snacks_chai',
    ]);
  });

  it('filters out animal meats when vegetarian_desi is requested', () => {
    const filtered = filterFoodPool(mockFoodPool, {
      targetCalories: 1800,
      targetProteinGrams: 100,
      targetFatGrams: 50,
      targetCarbGrams: 230,
      dietPreference: 'vegetarian_desi',
      budgetTierPKR: 'budget_under_3500',
    });

    expect(filtered.some((f) => f.name.includes('Chicken'))).toBe(false);
    expect(filtered.some((f) => f.name.includes('Beef'))).toBe(false);
    expect(filtered.some((f) => f.name.includes('Seekh Kebab'))).toBe(false);

    // Solved plan must be strictly vegetarian
    const plan = solveDailyMealPlan(
      {
        targetCalories: 1800,
        targetProteinGrams: 90,
        targetFatGrams: 45,
        targetCarbGrams: 250,
        dietPreference: 'vegetarian_desi',
        budgetTierPKR: 'budget_under_3500',
      },
      mockFoodPool
    );

    const allPlanFoodNames = plan.meals.flatMap((m) => m.items.map((i) => i.foodName));
    expect(allPlanFoodNames.some((n) => n.includes('Chicken'))).toBe(false);
    expect(allPlanFoodNames.some((n) => n.includes('Beef'))).toBe(false);
    expect(plan.isWithinTolerance).toBe(true);
  });

  it('excludes high-sugar desserts for Type 2 Diabetes patients', () => {
    const filtered = filterFoodPool(mockFoodPool, {
      targetCalories: 1900,
      targetProteinGrams: 130,
      targetFatGrams: 50,
      targetCarbGrams: 230,
      dietPreference: 'halal_omnivore',
      budgetTierPKR: 'standard_3500_7000',
      medicalConditions: ['diabetes_type_2'],
    });

    expect(filtered.some((f) => f.name.includes('Gulab Jamun'))).toBe(false);
  });

  it('excludes user disliked foods', () => {
    const filtered = filterFoodPool(mockFoodPool, {
      targetCalories: 2000,
      targetProteinGrams: 140,
      targetFatGrams: 60,
      targetCarbGrams: 220,
      dietPreference: 'halal_omnivore',
      budgetTierPKR: 'standard_3500_7000',
      dislikedFoods: ['karela'],
    });

    expect(filtered.some((f) => f.name.toLowerCase().includes('karela'))).toBe(false);
  });

  it('accurately tracks total oil added across the meal plan', () => {
    const plan = solveDailyMealPlan(
      {
        targetCalories: 2100,
        targetProteinGrams: 140,
        targetFatGrams: 60,
        targetCarbGrams: 250,
        dietPreference: 'halal_omnivore',
        budgetTierPKR: 'standard_3500_7000',
      },
      mockFoodPool
    );

    expect(plan.totalOilAddedG).toBeGreaterThan(0);
    expect(typeof plan.totalOilAddedG).toBe('number');
  });
});
