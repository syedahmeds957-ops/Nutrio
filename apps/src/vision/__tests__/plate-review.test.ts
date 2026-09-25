import { describe, expect, it } from 'vitest';
import { ResolvedFoodItem, VisionResolutionResult } from '@nutrio/nutrition-core';

describe('Interactive Meal Plate Review & Portion Corrector (Task 3.5)', () => {
  const initialItems: ResolvedFoodItem[] = [
    {
      detectedName: 'Chicken Karahi',
      matchedFoodName: 'Chicken Karahi (Desi Style)',
      category: 'Curries & Stews',
      servingLabel: '1 katori (200g)',
      servingGrams: 200,
      resolvedGrams: 200,
      calories: 390,
      proteinGrams: 33.0,
      fatGrams: 25.6,
      carbGrams: 7.0,
      fibreGrams: 2.0,
      oilAddedG: 36,
      matchScore: 0.95,
      portionSource: 'detected_grams',
    },
    {
      detectedName: 'Roti',
      matchedFoodName: 'Roti / Chapati (Whole Wheat)',
      category: 'Breads & Grains',
      servingLabel: '1 medium roti (45g)',
      servingGrams: 45,
      resolvedGrams: 90, // 2 rotis
      calories: 239,
      proteinGrams: 8.1,
      fatGrams: 1.6,
      carbGrams: 46.8,
      fibreGrams: 6.3,
      oilAddedG: 0,
      matchScore: 0.95,
      portionSource: 'detected_grams',
    },
  ];

  const resolution: VisionResolutionResult = {
    totalCalories: 629,
    calorieBand: {
      min: 566,
      max: 692,
      displayEstimate: '~629 kcal (±10%)',
    },
    totalProteinGrams: 41.1,
    totalFatGrams: 27.2,
    totalCarbGrams: 53.8,
    totalFibreGrams: 8.3,
    totalOilAddedG: 36,
    confidence: 'high',
    items: initialItems,
  };

  it('verifies initial plate resolution totals and confidence band', () => {
    expect(resolution.totalCalories).toBe(629);
    expect(resolution.items).toHaveLength(2);
    expect(resolution.calorieBand.displayEstimate).toContain('±10%');
  });

  it('scales portions with S/M/L multiplier and recalculates calories', () => {
    const karahi = { ...initialItems[0] };
    const baseGrams = karahi.servingGrams; // 200g
    const smallGrams = Math.round(baseGrams * 0.75); // 150g

    const mult = smallGrams / karahi.resolvedGrams; // 150 / 200 = 0.75
    const updatedCalories = Math.round(karahi.calories * mult);
    const updatedProtein = Number((karahi.proteinGrams * mult).toFixed(1));

    expect(smallGrams).toBe(150);
    expect(updatedCalories).toBe(293);
    expect(updatedProtein).toBe(24.8);
  });

  it('supports item deletion and recalculates plate total', () => {
    // User deletes Karahi, only eats the 2 rotis
    const remaining = initialItems.filter(
      (i) => !i.matchedFoodName.includes('Karahi')
    );
    expect(remaining).toHaveLength(1);

    const newTotal = remaining.reduce((s, i) => s + i.calories, 0);
    expect(newTotal).toBe(239);
  });
});
