import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveMealPreset,
  loadMealPresets,
  deleteMealPreset,
  recordFoodUsage,
  getMostLoggedFoodIds,
  getFoodUsageCounts,
  releasePresetCache,
  MAX_PRESETS,
} from '../mealPresets.js';

describe('Meal presets', () => {
  beforeEach(() => {
    releasePresetCache();
    try {
      window.localStorage.clear();
    } catch {
      // No localStorage in this runner; the in-memory mirror is enough.
    }
  });

  it('saves a stacked basket as a re-loggable combo', () => {
    const preset = saveMealPreset('My usual breakfast', [
      { foodId: 'diet_basic_1', foodName: 'Boiled Egg (Whole)', quantity: 2 },
      { foodId: 'diet_basic_18', foodName: 'Greek Yogurt (Plain, Non-Fat)', quantity: 1 },
    ]);

    expect(preset).not.toBeNull();
    expect(preset!.entries).toHaveLength(2);
    expect(loadMealPresets()[0].name).toBe('My usual breakfast');
  });

  it('refuses a preset with no name or no items, rather than saving an empty row', () => {
    expect(saveMealPreset('  ', [{ foodId: 'x', foodName: 'X', quantity: 1 }])).toBeNull();
    expect(saveMealPreset('Empty', [])).toBeNull();
    expect(loadMealPresets()).toHaveLength(0);
  });

  it('updates rather than duplicates when the same name is saved again', () => {
    saveMealPreset('Breakfast', [{ foodId: 'a', foodName: 'A', quantity: 1 }]);
    saveMealPreset('breakfast', [
      { foodId: 'a', foodName: 'A', quantity: 1 },
      { foodId: 'b', foodName: 'B', quantity: 2 },
    ]);

    const presets = loadMealPresets();
    expect(presets).toHaveLength(1);
    expect(presets[0].entries).toHaveLength(2);
  });

  it('keeps the newest first and caps the list', () => {
    for (let i = 0; i < MAX_PRESETS + 5; i++) {
      saveMealPreset(`Combo ${i}`, [{ foodId: `f${i}`, foodName: `F${i}`, quantity: 1 }]);
    }
    const presets = loadMealPresets();
    expect(presets).toHaveLength(MAX_PRESETS);
    expect(presets[0].name).toBe(`Combo ${MAX_PRESETS + 4}`);
  });

  it('deletes one preset without touching the others', () => {
    saveMealPreset('Keep', [{ foodId: 'a', foodName: 'A', quantity: 1 }]);
    const doomed = saveMealPreset('Drop', [{ foodId: 'b', foodName: 'B', quantity: 1 }])!;

    deleteMealPreset(doomed.id);

    const names = loadMealPresets().map((p) => p.name);
    expect(names).toEqual(['Keep']);
  });
});

describe('Food usage counts', () => {
  beforeEach(() => {
    releasePresetCache();
    try {
      window.localStorage.clear();
    } catch {
      // No localStorage in this runner.
    }
  });

  it('ranks the foods this user actually repeats', () => {
    recordFoodUsage(['egg', 'chai']);
    recordFoodUsage(['egg']);
    recordFoodUsage(['egg', 'roti']);

    expect(getMostLoggedFoodIds(3)).toEqual(['egg', 'chai', 'roti']);
    expect(getFoodUsageCounts()['egg']).toBe(3);
  });

  it('respects the requested list length', () => {
    recordFoodUsage(['a', 'b', 'c', 'd']);
    expect(getMostLoggedFoodIds(2)).toHaveLength(2);
  });

  it('ignores empty ids instead of counting a blank entry', () => {
    recordFoodUsage(['', '']);
    expect(getMostLoggedFoodIds()).toHaveLength(0);
  });

  it('starts empty for a user who has logged nothing', () => {
    expect(getMostLoggedFoodIds()).toEqual([]);
  });
});
