import { describe, expect, it } from 'vitest';
import { buildTargetsRow, planFromTargetsRow } from '../targetsRow.js';
import { computePlan } from '../../plan/engine.js';
import type { PlanUserContext } from '../../plan/types.js';

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
