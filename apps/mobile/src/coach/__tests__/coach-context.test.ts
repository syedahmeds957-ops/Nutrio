import { describe, expect, it } from 'vitest';
import { buildCoachContext } from '../coachContext.js';
import { computePlan } from '../../plan/engine.js';
import type { PlanUserContext } from '../../plan/types.js';
import type { DailyTrackerSummary } from '../../tracker/types.js';
import type { LifestyleSurveyPayload } from '../../survey/types.js';

const userContext: PlanUserContext = {
  weightKg: 62,
  heightCm: 160,
  ageYears: 41,
  sex: 'female',
  bmr: 1300,
  tdee: 1900,
  medicalConditions: ['type2_diabetes'],
  chaiSugarKcalPerDay: 130,
  weeklyChaiSugarKcal: 910,
  isNightShift: false,
  dailySittingHours: 8,
};

const plan = computePlan(userContext, { goal: 'maintain', targetRateKgPerWeek: 0 });

describe('buildCoachContext', () => {
  it('describes the user from their plan, never from stock defaults', () => {
    const ctx = buildCoachContext({ plan, displayName: 'Ayesha', region: 'PK' });

    expect(ctx).toMatchObject({
      displayName: 'Ayesha',
      region: 'PK',
      sex: 'female',
      ageYears: 41,
      weightKg: 62,
      goal: 'maintain',
      targets: {
        kcalTarget: plan.targetResult.kcalTarget,
        proteinGrams: plan.macros.proteinGrams,
        fatGrams: plan.macros.fatGrams,
        carbGrams: plan.macros.carbGrams,
      },
      medicalFlags: ['type2_diabetes'],
    });
  });

  it('leaves the diet unstated rather than assuming halal omnivore', () => {
    const ctx = buildCoachContext({ plan, displayName: 'Ayesha', region: 'PK' });
    expect(ctx.dietaryPreferences).toEqual([]);
  });

  it('takes diet and conditions from the survey when it is available', () => {
    const survey = {
      healthClinical: { medicalConditions: ['none', 'hypertension'] },
      preferencesBudget: { dietPreference: 'vegetarian_desi', dislikedFoods: [] },
    } as unknown as LifestyleSurveyPayload;

    const ctx = buildCoachContext({ plan, survey, displayName: 'Ayesha', region: 'SA' });

    expect(ctx.dietaryPreferences).toEqual(['vegetarian_desi']);
    expect(ctx.medicalFlags).toEqual(['hypertension']);
  });

  it("reports today's intake from the tracker summary", () => {
    const summary = {
      totalCaloriesConsumed: 900,
      totalProteinConsumed: 50,
      totalFatConsumed: 30,
      totalCarbConsumed: 100,
      remainingCalories: 800,
      items: [{ foodName: 'Daal Chana' }, { foodName: 'Roti' }],
    } as unknown as DailyTrackerSummary;

    const ctx = buildCoachContext({ plan, summary, displayName: 'Ayesha', region: 'PK' });

    expect(ctx.todaySummary).toEqual({
      caloriesConsumed: 900,
      proteinConsumed: 50,
      fatConsumed: 30,
      carbConsumed: 100,
      remainingCalories: 800,
      foodsLoggedToday: ['Daal Chana', 'Roti'],
    });
  });

  it('treats a day with nothing logged as the full target remaining', () => {
    const ctx = buildCoachContext({ plan, displayName: 'Ayesha', region: 'PK' });

    expect(ctx.todaySummary).toEqual({
      caloriesConsumed: 0,
      proteinConsumed: 0,
      fatConsumed: 0,
      carbConsumed: 0,
      remainingCalories: plan.targetResult.kcalTarget,
      foodsLoggedToday: [],
    });
  });
});
