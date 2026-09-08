import { describe, expect, it } from 'vitest';
import { solveDailyMealPlan } from '../src/solver.js';
import { adaptPlanForFamilyMode, generateRamadanPlan } from '../src/cultural-modes.js';
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
    name: 'Chicken Korma (Shahi)',
    category: 'Curries & Meat Dishes',
    cuisineTags: ['Pakistani'],
    kcal100g: 210,
    protein100g: 15.0,
    carb100g: 4.8,
    fat100g: 14.5,
    fibre100g: 1.0,
    sugar100g: 2.2,
    oilAddedG: 20,
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

describe('Pakistani Family Mode & Ramadan Mode Adapters (Task 2.4)', () => {
  it('adapts meal plan for family handi and recalibrates daily calories within +-5%', () => {
    const solverInput = {
      targetCalories: 2000,
      targetProteinGrams: 140,
      targetFatGrams: 55,
      targetCarbGrams: 235,
      dietPreference: 'halal_omnivore' as const,
      budgetTierPKR: 'standard_3500_7000' as const,
    };

    const basePlan = solveDailyMealPlan(solverInput, testFoodPool);

    const adaptedResult = adaptPlanForFamilyMode(
      basePlan,
      {
        familyDishName: 'Chicken Korma',
        familyMealSlot: 'dinner',
      },
      solverInput,
      testFoodPool
    );

    expect(adaptedResult.isFamilyModeActive).toBe(true);
    expect(adaptedResult.familyDishName).toBe('Chicken Korma (Shahi)');
    expect(adaptedResult.guidanceNote.length).toBeGreaterThan(10);
    expect(adaptedResult.portionAdvice.length).toBeGreaterThan(10);

    // Verify dinner now contains family dish
    const dinnerSlot = adaptedResult.plan.meals.find((m) => m.slot === 'dinner')!;
    expect(dinnerSlot.items.some((i) => i.foodName.includes('Korma'))).toBe(true);

    // Verify tolerance remains within +-5%
    expect(adaptedResult.plan.isWithinTolerance).toBe(true);
    expect(Math.abs(adaptedResult.plan.calorieDeviationPct)).toBeLessThanOrEqual(5.0);
  });

  it('generates a 3-slot Ramadan plan with structured hydration pacing', () => {
    const solverInput = {
      targetCalories: 2000,
      targetProteinGrams: 130,
      targetFatGrams: 50,
      targetCarbGrams: 250,
      dietPreference: 'halal_omnivore' as const,
      budgetTierPKR: 'standard_3500_7000' as const,
    };

    const ramadanPlan = generateRamadanPlan(solverInput, testFoodPool, 3000);

    expect(ramadanPlan.isRamadanMode).toBe(true);
    expect(ramadanPlan.suhoor).toBeDefined();
    expect(ramadanPlan.iftar).toBeDefined();
    expect(ramadanPlan.postTarawihSnack).toBeDefined();

    // Check hydration schedule
    expect(ramadanPlan.totalWaterMl).toBe(3000);
    expect(ramadanPlan.hydrationWindows).toHaveLength(5);
    const sumWater = ramadanPlan.hydrationWindows.reduce((s, w) => s + w.recommendedMl, 0);
    expect(sumWater).toBe(3000);

    // Check advice content
    expect(ramadanPlan.suhoorAdvice).toContain('satiety');
    expect(ramadanPlan.iftarAdvice).toContain('dates');
  });
});
