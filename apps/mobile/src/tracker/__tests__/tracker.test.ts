import { describe, expect, it } from 'vitest';
import { calculateNutrientsForGrams, TrackerEngine } from '../engine.js';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';

describe('Daily Tracker Engine & Offline Queue (Task 1.5)', () => {
  const rotiFood = PAKISTANI_STAPLES_DATA.find((f) => f.name.includes('Roti'))!;
  const biryaniFood = PAKISTANI_STAPLES_DATA.find((f) => f.name.includes('Biryani'))!;
  const chaiFood = PAKISTANI_STAPLES_DATA.find((f) => f.name.includes('Chai'))!;

  it('strictly computes calories and macros from food database using (grams / 100) rule', () => {
    // Roti: 265 kcal / 100g
    // 1 medium roti = 45g -> 265 * 0.45 = 119.25 -> 119 kcal
    const singleRoti = calculateNutrientsForGrams(rotiFood, 45);
    expect(singleRoti.calories).toBe(119);
    expect(singleRoti.proteinGrams).toBe(4);

    // 2 rotis = 90g -> 265 * 0.90 = 238.5 -> 239 kcal
    const twoRotis = calculateNutrientsForGrams(rotiFood, 90);
    expect(twoRotis.calories).toBe(239);
    expect(twoRotis.proteinGrams).toBe(8.1);
  });

  it('logs items to specific meal slots with offline pending sync status', () => {
    const engine = new TrackerEngine({
      targetCalories: 2000,
      targetProteinGrams: 150,
      targetFatGrams: 60,
      targetCarbGrams: 215,
      targetWaterMl: 3000,
    });

    const rotiServing = rotiFood.servings[0]; // 45g
    const loggedRoti = engine.logItem('breakfast', rotiFood, rotiServing, 2);

    expect(loggedRoti.mealSlot).toBe('breakfast');
    expect(loggedRoti.totalGrams).toBe(90);
    expect(loggedRoti.calories).toBe(239);
    expect(loggedRoti.syncStatus).toBe('pending');

    // Check breakfast slot
    const breakfastItems = engine.getItemsBySlot('breakfast');
    expect(breakfastItems).toHaveLength(1);
    expect(breakfastItems[0].foodName).toBe(rotiFood.name);

    // Check daily summary
    const summary = engine.getSummary();
    expect(summary.totalCaloriesConsumed).toBe(239);
    expect(summary.remainingCalories).toBe(2000 - 239);
    expect(summary.pendingSyncCount).toBe(1);
  });

  it('tracks multiple meal slots, chai sugar, water, and deletion', () => {
    const engine = new TrackerEngine({
      targetCalories: 1900,
      targetProteinGrams: 140,
      targetFatGrams: 55,
      targetCarbGrams: 210,
    });

    // 1. Log Lunch: 1 plate Biryani (350g)
    const biryaniServing = biryaniFood.servings[0]; // 350g
    const loggedBiryani = engine.logItem('lunch', biryaniFood, biryaniServing, 1);

    // 2. Log Snacks: 1 cup Chai (150g)
    const chaiServing = chaiFood.servings[0]; // 150g
    engine.logItem('snacks_chai', chaiFood, chaiServing, 1);

    // 3. Log Water: 500 ml
    engine.logWater(500);

    let summary = engine.getSummary();
    expect(summary.items).toHaveLength(2);
    expect(summary.waterMlConsumed).toBe(500);
    expect(summary.totalCaloriesConsumed).toBeGreaterThan(600);

    // 4. Delete Biryani
    const deleted = engine.deleteItem(loggedBiryani.id);
    expect(deleted).toBe(true);

    summary = engine.getSummary();
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0].foodName).toContain('Chai');
  });

  it('manages offline sync queue: marks items synced or failed', () => {
    const engine = new TrackerEngine({
      targetCalories: 1800,
      targetProteinGrams: 120,
      targetFatGrams: 50,
      targetCarbGrams: 210,
    });

    const item1 = engine.logItem('breakfast', rotiFood, rotiFood.servings[0], 1);
    const item2 = engine.logItem('lunch', biryaniFood, biryaniFood.servings[0], 1);

    expect(engine.getPendingQueue()).toHaveLength(2);

    // Mark item1 synced
    engine.markSynced([item1.id]);
    expect(engine.getPendingQueue()).toHaveLength(1);
    expect(engine.getPendingQueue()[0].id).toBe(item2.id);

    // Mark item2 failed
    engine.markFailed([item2.id]);
    expect(engine.getPendingQueue()).toHaveLength(0);
    expect(engine.getItemsBySlot('lunch')[0].syncStatus).toBe('failed');
  });
});
