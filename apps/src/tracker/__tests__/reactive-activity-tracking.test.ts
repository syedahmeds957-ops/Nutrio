import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { TrackerEngine } from '../engine.js';
import { WaterTrackerCard } from '../ui/WaterTrackerCard.js';
import { DailyProgressHeader } from '../ui/DailyProgressHeader.js';
import { WeeklyCalorieBankCard } from '../ui/WeeklyCalorieBankCard.js';
import { ALL_SAUDI_FOODS, ALL_EXPANDED_PAKISTANI_FOODS } from '@nutrio/food-db';

describe('Phase 5: Activity Tracking & Reactive State Verification', () => {
  const defaultTargets = {
    targetCalories: 2000,
    targetProteinGrams: 150,
    targetFatGrams: 60,
    targetCarbGrams: 215,
    targetWaterMl: 2500,
  };

  it('verifies that a new user starts with a clean slate (0 calories, 0 water, 0 items)', () => {
    const engine = new TrackerEngine(defaultTargets);
    const summary = engine.getSummary();

    expect(summary.totalCaloriesConsumed).toBe(0);
    expect(summary.totalProteinConsumed).toBe(0);
    expect(summary.totalFatConsumed).toBe(0);
    expect(summary.totalCarbConsumed).toBe(0);
    expect(summary.waterMlConsumed).toBe(0);
    expect(summary.remainingCalories).toBe(2000);
    expect(summary.items.length).toBe(0);
  });

  it('dynamically logs meals and reactively updates calories and macronutrients', () => {
    const engine = new TrackerEngine(defaultTargets);
    const kabsa = ALL_SAUDI_FOODS.find((f) => f.name.toLowerCase().includes('kabsa')) || ALL_SAUDI_FOODS[0];
    const serving = kabsa.servings[0] || { label: 'Plate', grams: 350, kcal: 580, proteinGrams: 32, carbGrams: 70, fatGrams: 18 };

    const logged = engine.logItem('lunch', kabsa, serving, 1);
    expect(logged.mealSlot).toBe('lunch');

    const summary = engine.getSummary();
    expect(summary.totalCaloriesConsumed).toBeGreaterThan(0);
    expect(summary.totalCaloriesConsumed).toBe(logged.calories);
    expect(summary.remainingCalories).toBe(2000 - logged.calories);
    expect(summary.totalProteinConsumed).toBe(logged.proteinGrams);
    expect(summary.totalCarbConsumed).toBe(logged.carbGrams);
    expect(summary.totalFatConsumed).toBe(logged.fatGrams);
    expect(summary.items.length).toBe(1);
  });

  it('dynamically logs customized items with specific portion and macro overrides', () => {
    const engine = new TrackerEngine(defaultTargets);

    const customized = engine.logCustomizedItem(
      'dinner',
      'Custom AlBaik Chicken Fillet',
      'البيك ساندوتش فيليه دجاج',
      '1x Custom Sandwich',
      1,
      480,
      35,
      42,
      18
    );

    expect(customized.foodName).toBe('Custom AlBaik Chicken Fillet');
    expect(customized.calories).toBe(480);
    expect(customized.proteinGrams).toBe(35);

    const summary = engine.getSummary();
    expect(summary.totalCaloriesConsumed).toBe(480);
    expect(summary.totalProteinConsumed).toBe(35);
    expect(summary.remainingCalories).toBe(1520);
  });

  it('reactively tracks water hydration (+250ml, +500ml, and decrement)', () => {
    const engine = new TrackerEngine(defaultTargets);

    // Initial state
    expect(engine.getSummary().waterMlConsumed).toBe(0);

    // Drink 1 glass (250 ml)
    engine.logWater(250);
    expect(engine.getSummary().waterMlConsumed).toBe(250);

    // Drink 1 bottle (500 ml)
    engine.logWater(500);
    expect(engine.getSummary().waterMlConsumed).toBe(750);

    // Undo / decrement (-250 ml)
    engine.logWater(-250);
    expect(engine.getSummary().waterMlConsumed).toBe(500);

    // Guard against negative values
    engine.logWater(-1000);
    expect(engine.getSummary().waterMlConsumed).toBe(0);
  });

  it('reverts calories and macros reactively upon item deletion', () => {
    const engine = new TrackerEngine(defaultTargets);
    const zinger = ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.name.toLowerCase().includes('zinger')) || ALL_EXPANDED_PAKISTANI_FOODS[0];
    const serving = zinger.servings[0] || { label: 'Burger', grams: 220, kcal: 490, proteinGrams: 28, carbGrams: 45, fatGrams: 22 };

    const item = engine.logItem('dinner', zinger, serving, 1);
    expect(engine.getSummary().items.length).toBe(1);
    expect(engine.getSummary().totalCaloriesConsumed).toBeGreaterThan(0);

    const deleted = engine.deleteItem(item.id);
    expect(deleted).toBe(true);

    const summaryAfter = engine.getSummary();
    expect(summaryAfter.items.length).toBe(0);
    expect(summaryAfter.totalCaloriesConsumed).toBe(0);
    expect(summaryAfter.remainingCalories).toBe(2000);
  });

  it('renders WaterTrackerCard and handles quick-log callbacks', () => {
    const handleLogWater = vi.fn();
    const element = React.createElement(WaterTrackerCard, {
      waterMlConsumed: 1250,
      targetWaterMl: 2500,
      onLogWater: handleLogWater,
    });

    expect(element).toBeDefined();
    expect(element.props.waterMlConsumed).toBe(1250);
    expect(element.props.targetWaterMl).toBe(2500);
  });

  it('DailyProgressHeader and WeeklyCalorieBankCard update consistently with TrackerEngine summary', () => {
    const engine = new TrackerEngine(defaultTargets);
    engine.logWater(1500);
    const summary = engine.getSummary();

    const headerEl = React.createElement(DailyProgressHeader, { summary });
    expect(headerEl).toBeDefined();
    expect(headerEl.props.summary.remainingCalories).toBe(2000);

    const bankEl = React.createElement(WeeklyCalorieBankCard, {
      targetCalories: summary.targetCalories,
      weeklyDeficitKcal: summary.targetCalories - summary.totalCaloriesConsumed,
    });
    expect(bankEl).toBeDefined();
    expect(bankEl.props.weeklyDeficitKcal).toBe(2000);
  });
});
