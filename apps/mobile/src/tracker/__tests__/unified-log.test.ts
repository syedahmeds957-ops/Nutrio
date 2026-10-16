import { describe, expect, it } from 'vitest';
import { TrackerEngine } from '../engine.js';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';

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
});
