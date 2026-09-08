import { describe, expect, it } from 'vitest';
import { TrackerEngine } from '../engine.js';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { ResolvedFoodItem } from '@nutrio/nutrition-core';

describe('Unified Multimodal Meal Logging Workflow (Task 3.6)', () => {
  const targets = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    targetWaterMl: 3000,
  };

  it('logs a single food item from search into active tracker engine', () => {
    const engine = new TrackerEngine(targets);
    const roti = PAKISTANI_STAPLES_DATA.find((f) => f.name.includes('Roti'))!;

    engine.logItem('breakfast', roti, roti.servings[0], 2);

    const summary = engine.getSummary();
    expect(summary.totalCaloriesConsumed).toBeGreaterThan(200);
    expect(summary.totalProteinConsumed).toBeGreaterThan(7);
    expect(engine.getItemsBySlot('breakfast')).toHaveLength(1);
  });

  it('logs multi-item plate from voice/photo review modal into active diary', () => {
    const engine = new TrackerEngine(targets);

    const plateItems: ResolvedFoodItem[] = [
      {
        detectedName: 'Chicken Karahi',
        matchedFoodName: 'Chicken Karahi',
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

    // Simulate handleConfirmPlateItems
    for (const item of plateItems) {
      const found =
        PAKISTANI_STAPLES_DATA.find((f) => f.name.includes(item.matchedFoodName)) ||
        PAKISTANI_STAPLES_DATA[0];
      const serving = found.servings[0] || {
        label: item.servingLabel,
        grams: item.servingGrams,
      };
      const qty = item.resolvedGrams / serving.grams;
      engine.logItem('dinner', found, serving, Number(qty.toFixed(1)));
    }

    const summary = engine.getSummary();
    // 390 + 239 = 629 kcal
    expect(summary.totalCaloriesConsumed).toBeGreaterThan(600);
    expect(summary.totalFatConsumed).toBeGreaterThan(20);
    expect(engine.getItemsBySlot('dinner')).toHaveLength(2);
  });

  it('resolves AI photo vision detection into nutritional plate and logs into lunch', async () => {
    const engine = new TrackerEngine(targets);
    const { resolveDetectedPlate } = await import('@nutrio/nutrition-core');

    // Simulate AI Vision detections
    const visionDetections = [
      { detectedName: 'Chicken Biryani', estimatedGrams: 350, portionSize: 'M' as const },
    ];

    const resolution = resolveDetectedPlate(visionDetections, PAKISTANI_STAPLES_DATA as any);
    expect(resolution.items.length).toBeGreaterThanOrEqual(1);

    const biryani = resolution.items[0];
    expect(biryani.calories).toBeGreaterThan(400);

    // Log to lunch
    const found = PAKISTANI_STAPLES_DATA.find((f) => f.name === biryani.matchedFoodName)!;
    const serving = found.servings[0];
    engine.logItem('lunch', found, serving, biryani.resolvedGrams / serving.grams);

    const summary = engine.getSummary();
    expect(summary.totalCaloriesConsumed).toBeGreaterThan(400);
    expect(engine.getItemsBySlot('lunch')).toHaveLength(1);
  });
});
