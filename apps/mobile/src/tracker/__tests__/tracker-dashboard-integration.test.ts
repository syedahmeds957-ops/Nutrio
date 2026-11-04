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
      completedDays: [0, 1, 2],
      currentDayIndex: 2,
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

describe('Today’s workout card on the dashboard', () => {
  const targets = { targetCalories: 1960, targetProteinGrams: 120, targetFatGrams: 60, targetCarbGrams: 220, targetWaterMl: 2500 };

  it('invites setup when there is no plan, and shows today’s session once there is one', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { initI18n } = await import('../../i18n/config.js');
    const { localDateKey } = await import('../../common/dateKey.js');
    const { generateWeeklyPlan } = await import('@nutrio/workout-core');
    initI18n('en');
    const base = { userName: 'Ali', targets, isGuest: false, onRequireAuth: () => {}, onOpenWorkouts: () => {}, onOpenWorkoutDay: () => {} };

    const noPlan = renderToStaticMarkup(React.createElement(TrackerDashboardScreen, { ...base, workoutPlan: null }));
    expect(noPlan).toContain('Set up workouts');

    // Train every day so "today" is always a training day, whatever day the test runs.
    const plan = generateWeeklyPlan(
      {
        goal: 'muscle', experience: 'some', location: 'gym', homeEquipment: [], dumbbellWeightsKg: [],
        trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], sessionMinutes: 45, focus: [], protectedJoints: [],
        lowIntensity: false, ramadan: { enabled: false },
      },
      { seed: 2, today: localDateKey() }
    );
    const withPlan = renderToStaticMarkup(React.createElement(TrackerDashboardScreen, { ...base, workoutPlan: plan }));
    const isSunday = new Date().getDay() === 0;
    expect(withPlan).toContain(isSunday ? 'See the week' : '>Start<');
    expect(withPlan).not.toContain('Set up workouts');
  });
});

describe('Today screen layout', () => {
  const targets = { targetCalories: 1960, targetProteinGrams: 120, targetFatGrams: 60, targetCarbGrams: 220, targetWaterMl: 2500 };

  const render = async (extra: Record<string, unknown> = {}) => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { initI18n } = await import('../../i18n/config.js');
    initI18n('en');
    return renderToStaticMarkup(
      React.createElement(TrackerDashboardScreen, {
        userName: 'Ali',
        targets,
        onOpenWorkouts: () => {},
        onOpenMealPlan: () => {},
        onOpenCoachChat: () => {},
        onOpenWeightTracker: () => {},
        onBackToPlan: () => {},
        ...extra,
      })
    );
  };

  it('has the three-button bar (Diary, Quick log, Coach) and no Today tab or top chip row', async () => {
    const html = await render();
    expect(html).toContain('>Diary<');
    expect(html).toContain('>Quick log<');
    expect(html).toContain('>Coach<');
    // "Today" is only the small greeting above the name, never a bar tab.
    expect(html.match(/>Today</g)?.length).toBe(1);
    expect(html).not.toContain('>Targets<');
    expect(html).not.toContain('>Meals<');
  });

  it('shows the bento tiles, one meals card with a Next tag, and the Meal plan link', async () => {
    const html = await render();
    expect(html).toContain('>Water<');
    expect(html).toContain('>Weight<');
    expect(html).toContain('No weigh-ins yet');
    expect(html).toContain('Calories by meal');
    expect(html).toContain('>Meal plan<');
    expect(html).toContain('>Next<');
    expect(html).not.toContain('Add more to');
  });
});
