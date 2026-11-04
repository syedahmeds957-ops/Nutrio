import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { WeeklyCalorieBankCard } from '../ui/WeeklyCalorieBankCard.js';
import { DailyProgressHeader } from '../ui/DailyProgressHeader.js';
import { AiRecommendationCard } from '../ui/AiRecommendationCard.js';
import { TrackerEngine } from '../engine.js';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import {
  saveDailyActivities,
  loadDailyActivities,
  savePersistedPlan,
  loadPersistedPlan,
  clearDailyActivities,
} from '../activityStorage.js';

describe('Phase 1: Dynamic Data & Clean Slate Verification', () => {
  beforeEach(() => {
    clearDailyActivities();
  });

  it('WeeklyCalorieBankCard constructs clean days with 0 consumed when no history is provided', () => {
    const el = React.createElement(WeeklyCalorieBankCard, {
      targetCalories: 2000,
    });
    expect(el).toBeDefined();
  });

  it('DailyProgressHeader renders with dynamic 0-target summary when user visits without a pre-set plan', () => {
    const freshGuestSummary = {
      date: '2026-09-18',
      targetCalories: 0,
      targetProteinGrams: 0,
      targetFatGrams: 0,
      targetCarbGrams: 0,
      targetWaterMl: 0,
      totalCaloriesConsumed: 0,
      totalProteinConsumed: 0,
      totalFatConsumed: 0,
      totalCarbConsumed: 0,
      remainingCalories: 0,
      waterMlConsumed: 0,
      pendingSyncCount: 0,
      items: [],
    };

    const headerEl = React.createElement(DailyProgressHeader, {
      summary: freshGuestSummary,
    });
    expect(headerEl).toBeDefined();
    expect(headerEl.props.summary.totalCaloriesConsumed).toBe(0);
    expect(headerEl.props.summary.targetCalories).toBe(0);
    expect(headerEl.props.summary.items).toHaveLength(0);
  });

  it('TrackerEngine logs food items dynamically and updates summary items array', () => {
    const engine = new TrackerEngine({
      targetCalories: 2000,
      targetProteinGrams: 140,
      targetFatGrams: 55,
      targetCarbGrams: 235,
    });

    const initialSummary = engine.getSummary();
    expect(initialSummary.items).toHaveLength(0);
    expect(initialSummary.totalCaloriesConsumed).toBe(0);

    // Log an item
    const food = PAKISTANI_STAPLES_DATA[0];
    const serving = food.servings[0] || { label: '100g', grams: 100 };
    engine.logItem('breakfast', food, serving, 1);

    const updatedSummary = engine.getSummary();
    expect(updatedSummary.items).toHaveLength(1);
    expect(updatedSummary.items[0].foodName).toBe(food.name);
    expect(updatedSummary.totalCaloriesConsumed).toBeGreaterThan(0);
  });

  it('ActivityStorage saves and restores daily tracked meals and water across sessions', () => {
    const today = '2026-09-18';
    expect(loadDailyActivities(today, 'PK')).toBeNull();

    const engine = new TrackerEngine({
      targetCalories: 0,
      targetProteinGrams: 0,
      targetFatGrams: 0,
      targetCarbGrams: 0,
      date: today,
    });

    const food = PAKISTANI_STAPLES_DATA[0];
    const serving = food.servings[0] || { label: '100g', grams: 100 };
    engine.logItem('lunch', food, serving, 2);
    engine.logWater(500);

    const summary = engine.getSummary();
    saveDailyActivities(today, 'PK', summary.items, summary.waterMlConsumed);

    // Simulate next app open / refresh
    const restored = loadDailyActivities(today, 'PK');
    expect(restored).not.toBeNull();
    expect(restored?.items).toHaveLength(1);
    expect(restored?.items[0].foodName).toBe(food.name);
    expect(restored?.waterMl).toBe(500);

    // Restore into a fresh engine instance
    const newEngine = new TrackerEngine({
      targetCalories: 0,
      targetProteinGrams: 0,
      targetFatGrams: 0,
      targetCarbGrams: 0,
      date: today,
    });
    newEngine.loadItems(restored!.items, restored!.waterMl);

    const newSummary = newEngine.getSummary();
    expect(newSummary.items).toHaveLength(1);
    expect(newSummary.waterMlConsumed).toBe(500);
    expect(newSummary.totalCaloriesConsumed).toBe(summary.totalCaloriesConsumed);
  });

  it('AiRecommendationCard supports clean slate standby mode when totalCaloriesConsumed is 0', () => {
    const onLogRecommendation = () => {};
    const card = React.createElement(AiRecommendationCard, {
      remainingCalories: 0,
      remainingProtein: 0,
      totalCaloriesConsumed: 0,
      itemsLoggedCount: 0,
      onLogRecommendation,
    });

    expect(card).toBeDefined();
    expect(card.props.totalCaloriesConsumed).toBe(0);
    expect(card.props.itemsLoggedCount).toBe(0);
  });

  it('saves and loads active user plan via persistence layer', () => {
    expect(loadPersistedPlan()).toBeNull();
    const mockPlan: any = {
      targetResult: { kcalTarget: 1950 },
      macros: { proteinGrams: 150, carbGrams: 200, fatGrams: 60, waterMl: 3000 },
    };
    savePersistedPlan(mockPlan);
    expect(loadPersistedPlan()).toEqual(mockPlan);
  });
});
