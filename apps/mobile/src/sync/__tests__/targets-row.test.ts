import { describe, expect, it } from 'vitest';
import { buildTargetsRow, planFromTargetsRow, rebuildPlanFromTargetsRow } from '../targetsRow.js';
import { computePlan } from '../../plan/engine.js';
import { planUserContextFromSurvey } from '../../plan/userContext.js';
import type { PlanUserContext } from '../../plan/types.js';
import type { LifestyleSurveyPayload } from '../../survey/types.js';

const userContext: PlanUserContext = {
  weightKg: 62,
  heightCm: 160,
  ageYears: 41,
  sex: 'female',
  bmr: 1300,
  tdee: 1900,
  chaiSugarKcalPerDay: 130,
  weeklyChaiSugarKcal: 910,
  isNightShift: false,
  dailySittingHours: 8,
};
const plan = { ...computePlan(userContext, { goal: 'maintain', targetRateKgPerWeek: 0 }), region: 'PK' as const };

describe('buildTargetsRow', () => {
  it('stores the full plan alongside the summary columns', () => {
    const row = buildTargetsRow('profile-1', plan);

    expect(row).toMatchObject({
      user_id: 'profile-1',
      bmr: 1300,
      tdee_formula: 1900,
      tdee_adaptive: null,
      goal: 'maintain',
      kcal_target: Math.round(plan.targetResult.kcalTarget),
      method: 'rule',
      generated_by: 'rule',
      plan,
    });
  });

  it('records a recalibrated plan as adaptive, keeping the formula TDEE separate', () => {
    const recalibrated = {
      ...plan,
      userContext: { ...plan.userContext, tdee: 2050 },
      formulaTdee: 1900,
      recalibratedAt: '2026-10-14',
    };

    const row = buildTargetsRow('profile-1', recalibrated);

    expect(row).toMatchObject({
      tdee_formula: 1900,
      tdee_adaptive: 2050,
      method: 'adaptive',
      generated_by: 'adaptive',
    });
  });
});

describe('planFromTargetsRow', () => {
  it('restores exactly the plan that was stored', () => {
    expect(planFromTargetsRow(buildTargetsRow('profile-1', plan))).toEqual(plan);
  });

  it('restores nothing rather than inventing a profile when no plan was stored', () => {
    // Summary columns alone lack sex, age and height; filling those in with
    // defaults is how a restored plan used to describe someone else.
    expect(planFromTargetsRow({ kcal_target: 1800, goal: 'lose' })).toBeNull();
    expect(planFromTargetsRow(null)).toBeNull();
  });

  it('rejects a stored plan that is missing required parts', () => {
    expect(planFromTargetsRow({ plan: { userContext: userContext } })).toBeNull();
  });
});

describe('rebuildPlanFromTargetsRow', () => {
  const survey: LifestyleSurveyPayload = {
    version: 1,
    basics: { sex: 'male', ageYears: 28, heightCm: 175, weightKg: 78, waistCm: 88 },
    occupational: {
      jobCategory: 'desk_sedentary',
      workingHoursPerDay: 8,
      shiftPattern: 'regular_day',
      dailySittingHours: 7,
      commuteType: 'car_cab',
    },
    exercise: { trainingType: 'gym_resistance', frequencyDaysPerWeek: 4, sessionDurationMins: 60, intensity: 'moderate' },
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
  const accepted = computePlan(planUserContextFromSurvey(survey), { goal: 'lose', targetRateKgPerWeek: 0.5 });
  /** A row as builds before 2026-10-13 saved it: the summary, no plan. */
  const oldRow = () => {
    const { plan: _plan, ...summary } = buildTargetsRow('profile-1', accepted);
    return summary;
  };

  it('rebuilds the accepted plan from the survey and the saved goal', () => {
    const rebuilt = rebuildPlanFromTargetsRow(oldRow(), survey)!;
    expect(rebuilt.targetResult.kcalTarget).toBe(accepted.targetResult.kcalTarget);
    expect(rebuilt.macros).toEqual(accepted.macros);
    expect(rebuilt.goalSelection.goal).toBe('lose');
    // and it is complete enough to be read back as a stored plan
    expect(planFromTargetsRow({ plan: rebuilt })).toEqual(rebuilt);
  });

  it('refuses when the survey no longer reproduces the saved calories', () => {
    const changed = { ...survey, basics: { ...survey.basics, weightKg: 95 } };
    expect(rebuildPlanFromTargetsRow(oldRow(), changed)).toBeNull();
  });

  it('refuses a recalibrated row, whose TDEE came from logged intake', () => {
    expect(rebuildPlanFromTargetsRow({ ...oldRow(), tdee_adaptive: 2500 }, survey)).toBeNull();
  });

  it('needs the survey and a known goal', () => {
    expect(rebuildPlanFromTargetsRow(oldRow(), null)).toBeNull();
    expect(rebuildPlanFromTargetsRow({ ...oldRow(), goal: 'bulk' }, survey)).toBeNull();
    expect(rebuildPlanFromTargetsRow(null, survey)).toBeNull();
  });
});
