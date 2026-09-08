import { describe, expect, it } from 'vitest';
import {
  resolveDetectedFood,
  resolveDetectedPlate,
} from '../src/vision-resolver.js';
import { SolverFoodCandidate } from '../src/solver.js';

const testFoodPool: SolverFoodCandidate[] = [
  {
    name: 'Roti / Chapati (Whole Wheat)',
    nameUr: 'روٹی / چپاتی',
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
    name: 'Chicken Karahi',
    nameUr: 'چکن کڑاہی',
    category: 'Curries & Stews',
    cuisineTags: ['Pakistani'],
    kcal100g: 195,
    protein100g: 16.5,
    carb100g: 3.5,
    fat100g: 12.8,
    fibre100g: 1.0,
    sugar100g: 1.8,
    oilAddedG: 18,
    servings: [{ label: '1 katori (200g)', grams: 200, isDefault: true }],
  },
  {
    name: 'Steamed Basmati Rice',
    nameUr: 'ابلے ہوئے چاول',
    category: 'Breads & Grains',
    cuisineTags: ['Pakistani'],
    kcal100g: 130,
    protein100g: 2.7,
    carb100g: 28.2,
    fat100g: 0.3,
    fibre100g: 0.4,
    sugar100g: 0.1,
    oilAddedG: 0,
    servings: [{ label: '1 plate (200g)', grams: 200, isDefault: true }],
  },
];

describe('Multimodal Nutrition Resolution Core (Task 3.1)', () => {
  it('resolves detected food item with exact detected grams and DB-grounded macros', () => {
    const resolved = resolveDetectedFood(
      { detectedName: 'Chicken Karahi', estimatedGrams: 250 },
      testFoodPool
    );

    expect(resolved.matchedFoodName).toBe('Chicken Karahi');
    expect(resolved.resolvedGrams).toBe(250);
    expect(resolved.portionSource).toBe('detected_grams');
    // 250g * 1.95 kcal/g = 488 kcal
    expect(resolved.calories).toBe(488);
    expect(resolved.proteinGrams).toBe(41.3);
    expect(resolved.oilAddedG).toBe(45);
  });

  it('resolves portion sizes (S / M / L) against default serving grams', () => {
    const resolvedS = resolveDetectedFood(
      { detectedName: 'Roti', portionSize: 'S' },
      testFoodPool
    );
    const resolvedM = resolveDetectedFood(
      { detectedName: 'Roti', portionSize: 'M' },
      testFoodPool
    );
    const resolvedL = resolveDetectedFood(
      { detectedName: 'Roti', portionSize: 'L' },
      testFoodPool
    );

    // Default roti is 45g. S = 34g, M = 45g, L = 61g
    expect(resolvedS.resolvedGrams).toBeLessThan(resolvedM.resolvedGrams);
    expect(resolvedL.resolvedGrams).toBeGreaterThan(resolvedM.resolvedGrams);
    expect(resolvedM.resolvedGrams).toBe(45);
  });

  it('resolves multi-item plate, applies confidence band, and never returns a bare number', () => {
    const plate = resolveDetectedPlate(
      [
        { detectedName: 'Chicken Karahi', estimatedGrams: 200 },
        { detectedName: 'Chapati', estimatedGrams: 90 }, // 2 rotis
      ],
      testFoodPool
    );

    // 200g Karahi (390 kcal) + 90g Roti (239 kcal) = 629 kcal
    expect(plate.totalCalories).toBe(629);
    expect(plate.confidence).toBe('high');
    expect(plate.calorieBand.displayEstimate).toContain('±10%');
    expect(plate.calorieBand.min).toBeLessThan(plate.totalCalories);
    expect(plate.calorieBand.max).toBeGreaterThan(plate.totalCalories);
    expect(plate.items).toHaveLength(2);
  });

  it('applies learned per-dish calibration multiplier from user correction loop', () => {
    // 15% upward calibration on Karahi
    const plate = resolveDetectedPlate(
      [{ detectedName: 'Chicken Karahi', estimatedGrams: 200 }],
      testFoodPool,
      { karahi: 1.15 }
    );

    // Normal 200g = 390 kcal. With 1.15x factor (390 * 1.15 = 448.5) = 448 kcal
    expect(plate.totalCalories).toBe(448);
  });
});
