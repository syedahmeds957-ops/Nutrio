import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { computePlan, replanWithGoal } from '../engine.js';
import { PlanWorkflowScreen } from '../ui/PlanWorkflowScreen.js';
import { GoalSelectionView, initialSelectionGoal, initialSelectionRate, initialTargetWeight } from '../ui/GoalSelectionView.js';
import type { ComputedUserPlan, PlanUserContext } from '../types.js';

// The test account's shape: a 104 kg man whose survey gives BMR 1,951 and a
// burn of 2,341, and who later accepted a workout target update that counts
// his training (burn 2,525). The accepted plan is what Today shows.
const surveyContext: PlanUserContext = {
  weightKg: 104,
  heightCm: 180,
  ageYears: 30,
  sex: 'male',
  bmr: 1951,
  tdee: 2341,
  chaiSugarKcalPerDay: 80,
  weeklyChaiSugarKcal: 560,
  isNightShift: false,
  dailySittingHours: 11,
};
const goal = { goal: 'lose' as const, targetRateKgPerWeek: 0.5, targetWeightKg: 92 };
const savedPlan: ComputedUserPlan = {
  ...computePlan({ ...surveyContext, tdee: 2525, trainingWeeklyKcal: 1290 }, goal),
  region: 'PK',
  recalibratedAt: '2026-10-20',
  formulaTdee: 2341,
};

const render = (el: React.ReactElement) => {
  initI18n('en');
  return renderToStaticMarkup(React.createElement(RegionProvider, null, el));
};

describe('reviewing saved targets', () => {
  it('shows the saved plan, the same target the dashboard reads', () => {
    expect(savedPlan.targetResult.kcalTarget).toBe(1975);
    // Rebuilding from the survey (the old behaviour) gives a different number.
    expect(computePlan(surveyContext, goal).targetResult.kcalTarget).toBe(1951);

    const html = render(
      React.createElement(PlanWorkflowScreen, {
        userContext: surveyContext,
        existingPlan: savedPlan,
        onPlanAccepted: () => {},
        onCancel: () => {},
      })
    );
    expect(html).toContain('1,975');
    expect(html).not.toContain('1,951<');
    // The saved plan reaches its pace, so no safety-limit line either.
    expect(html).not.toContain('You picked');
  });

  it('applies a new goal to the saved plan’s own inputs', () => {
    const adjusted = replanWithGoal(savedPlan, { ...goal, targetRateKgPerWeek: 0.25 });
    expect(adjusted.userContext.tdee).toBe(2525);
    expect(adjusted.targetResult.kcalTarget).toBe(2525 - 275);
    expect(adjusted).toMatchObject({ region: 'PK', recalibratedAt: '2026-10-20', formulaTdee: 2341 });
  });
});

describe('goal screen prefill', () => {
  it('opens on the saved goal weight, pace and goal', () => {
    const html = render(
      React.createElement(GoalSelectionView, {
        context: savedPlan.userContext,
        initialSelection: { goal: 'lose', targetRateKgPerWeek: 0.25, targetWeightKg: 92 },
        onConfirmGoal: () => {},
        onBack: () => {},
      })
    );
    expect(html).toContain('value="92"');
    expect(html).not.toContain('value="99"');
    expect(html).toContain('Weekly pace: 0.25 kg / week');
  });

  it('keeps the defaults for a first setup', () => {
    const html = render(
      React.createElement(GoalSelectionView, { context: surveyContext, onConfirmGoal: () => {}, onBack: () => {} })
    );
    expect(html).toContain('value="99"');
    expect(html).toContain('Weekly pace: 0.5 kg / week');
  });

  it('falls back sensibly when the saved values no longer apply', () => {
    expect(initialSelectionGoal({ goal: 'lose', targetRateKgPerWeek: 0.5 }, true)).toBe('maintain');
    expect(initialSelectionGoal({ goal: 'gain', targetRateKgPerWeek: 0.25 }, false)).toBe('gain');
    expect(initialSelectionRate({ goal: 'maintain', targetRateKgPerWeek: 0 }, 1.04)).toBe(0.5);
    expect(initialSelectionRate({ goal: 'lose', targetRateKgPerWeek: 1 }, 0.62)).toBe(0.5);
    expect(initialTargetWeight({ goal: 'maintain', targetRateKgPerWeek: 0 }, 'maintain', 70)).toBe('70');
    expect(initialTargetWeight(undefined, 'gain', 70)).toBe('74');
  });
});
