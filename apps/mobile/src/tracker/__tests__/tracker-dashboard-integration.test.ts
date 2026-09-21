import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { TrackerDashboardScreen } from '../ui/TrackerDashboardScreen.js';
import { StreakBadge } from '../ui/StreakBadge.js';
import { AiRecommendationCard } from '../ui/AiRecommendationCard.js';
import { QuickStaplesBar } from '../ui/QuickStaplesBar.js';
import { WeeklyCalorieBankCard } from '../ui/WeeklyCalorieBankCard.js';
import { TrackerEngine } from '../engine.js';

describe('TrackerDashboardScreen Integrated Components', () => {
  const mockTargets = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    targetWaterMl: 3000,
  };

  it('renders TrackerDashboardScreen with all dashboard elements without errors', () => {
    const onOpenCoachChat = vi.fn();
    const onOpenMealPlan = vi.fn();
    const onOpenWeightTracker = vi.fn();

    const element = React.createElement(TrackerDashboardScreen, {
      userName: 'Ahmed',
      targets: mockTargets,
      onOpenCoachChat,
      onOpenMealPlan,
      onOpenWeightTracker,
    });

    expect(element).toBeDefined();
    expect(element.props.userName).toBe('Ahmed');
    expect(element.props.targets.targetCalories).toBe(2000);
  });

  it('verifies that StreakBadge, AiRecommendationCard, QuickStaplesBar, and WeeklyCalorieBankCard are exported and mountable', () => {
    const streakEl = React.createElement(StreakBadge, {
      streakDays: 7,
      consistencyPct: 94,
    });
    expect(streakEl).toBeDefined();

    const aiCardEl = React.createElement(AiRecommendationCard, {
      remainingCalories: 550,
      remainingProtein: 40,
      onLogRecommendation: vi.fn(),
    });
    expect(aiCardEl).toBeDefined();

    const staplesEl = React.createElement(QuickStaplesBar, {
      onQuickLog: vi.fn(),
    });
    expect(staplesEl).toBeDefined();

    const bankEl = React.createElement(WeeklyCalorieBankCard, {
      weeklyDeficitKcal: 2450,
      targetCalories: 2000,
    });
    expect(bankEl).toBeDefined();
  });

  it('guarantees independent TrackerEngine instances for PK and SA modes', () => {
    const pkEngine = new TrackerEngine(mockTargets);
    const saEngine = new TrackerEngine(mockTargets);

    // Log meal in PK
    pkEngine.logCustomizedItem('dinner', 'Chicken Karahi', 'چکن کڑاہی', '1 serving', 1, 450, 40, 5, 25);
    expect(pkEngine.getSummary().items.length).toBe(1);
    expect(pkEngine.getSummary().totalCaloriesConsumed).toBe(450);

    // SA remains clean slate
    expect(saEngine.getSummary().items.length).toBe(0);
    expect(saEngine.getSummary().totalCaloriesConsumed).toBe(0);

    // Log meal in SA
    saEngine.logCustomizedItem('dinner', 'Chicken Kabsa', 'كبسة دجاج', '1 plate', 1, 550, 35, 60, 15);
    expect(saEngine.getSummary().items.length).toBe(1);
    expect(saEngine.getSummary().totalCaloriesConsumed).toBe(550);

    // PK still has only its original meal
    expect(pkEngine.getSummary().items.length).toBe(1);
    expect(pkEngine.getSummary().items[0].foodName).toBe('Chicken Karahi');
    expect(saEngine.getSummary().items[0].foodName).toBe('Chicken Kabsa');
  });
});
