import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { computePlan, pacePreview, planPaceLimit } from '../engine.js';
import { planUserContextFromSurvey } from '../userContext.js';
import { GoalSelectionView } from '../ui/GoalSelectionView.js';
import { PlanRevealView } from '../ui/PlanRevealView.js';
import type { LifestyleSurveyPayload } from '../../survey/types.js';

// The audit's sample user: female, 28 y, 165 cm, 62 kg, desk job, 3 gym days.
const survey: LifestyleSurveyPayload = {
  version: 1,
  basics: { sex: 'female', ageYears: 28, heightCm: 165, weightKg: 62 },
  occupational: {
    jobCategory: 'desk_sedentary',
    workingHoursPerDay: 8,
    shiftPattern: 'regular_day',
    dailySittingHours: 8,
    commuteType: 'car_cab',
  },
  exercise: { trainingType: 'gym_resistance', frequencyDaysPerWeek: 3, sessionDurationMins: 60, intensity: 'moderate' },
  lifestyleDesi: {
    sleepHoursPerNight: 7,
    stressRating: 3,
    chaiWithSugarCupsPerDay: 2,
    eatingOutTimesPerWeek: 2,
    whoCooksAtHome: 'family_traditional',
    dailyWaterLitres: 2.5,
    lateNightEating: false,
    smoker: false,
  },
  healthClinical: { medicalConditions: [], isPregnantOrBreastfeeding: false, medicalDisclaimerAccepted: true },
  preferencesBudget: { dietPreference: 'halal_omnivore', dislikedFoods: [] },
};
const context = planUserContextFromSurvey(survey);
const goal = { goal: 'lose' as const, targetRateKgPerWeek: 0.5, targetWeightKg: 57 };

describe('a pace the safety floor cannot reach', () => {
  it('burns 1,787 and gets a 1,350 target at about 0.4 kg/week for the sample user', () => {
    expect(context.bmr).toBe(1350);
    expect(context.tdee).toBe(1787);

    const plan = computePlan(context, goal);
    expect(plan.targetResult.kcalTarget).toBe(1350);
    expect(plan.targetResult.appliedDelta).toBe(-437);
    // 5 kg at 0.4 kg/week, not 10 weeks at the 0.5 that was picked.
    expect(plan.projection.weeklyRateKg).toBe(0.4);
    expect(plan.projection.estimatedWeeks).toBe(13);

    expect(planPaceLimit(plan)).toMatchObject({ limited: true, reason: 'bmr', effectiveRateKgPerWeek: 0.4 });
    expect(pacePreview(context, 'lose', 0.5)).toEqual(planPaceLimit(plan));
    expect(pacePreview(context, 'lose', 0.25).limited).toBe(false);
  });

  it('says so on the goal screen and projects the milestone at the real pace', () => {
    initI18n('en');
    const html = renderToStaticMarkup(
      React.createElement(GoalSelectionView, { context, onConfirmGoal: () => {}, onBack: () => {} })
    );
    expect(html).toContain('Your safety floor limits you to about 0.4 kg/week.');
    expect(html).toContain('13 weeks');
    expect(html).not.toContain('10 weeks');
    // Goal cards and pace chips are radio groups with a checked option.
    expect(html.match(/role="radiogroup"/g)?.length).toBe(2);
    expect(html.match(/role="radio"/g)?.length).toBe(7);
    expect(html.match(/aria-checked="true"/g)?.length).toBe(2);
  });

  it('explains the slower pace on the plan reveal, and stays quiet when there is none', () => {
    initI18n('en');
    const reveal = (rate: number) =>
      renderToStaticMarkup(
        React.createElement(
          RegionProvider,
          null,
          React.createElement(PlanRevealView, {
            plan: computePlan(context, { ...goal, targetRateKgPerWeek: rate }),
            onAcceptPlan: () => {},
            onAdjustGoal: () => {},
          })
        )
      );
    expect(reveal(0.5)).toContain('You picked 0.5 kg/week, but your safety limits allow about 0.4 kg/week');
    expect(reveal(0.25)).not.toContain('You picked');
  });
});
