import { describe, expect, it } from 'vitest';
import { computePlan, computeProjection } from '../engine.js';
import { PlanUserContext } from '../types.js';

describe('Plan Engine & Goal Selection Logic (Task 1.4)', () => {
  const baseContext: PlanUserContext = {
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    sex: 'male',
    bmr: 1780,
    tdee: 2450,
    chaiSugarKcalPerDay: 260,
    weeklyChaiSugarKcal: 1820,
    isNightShift: false,
    dailySittingHours: 8,
  };

  it('computes a complete fat loss plan adhering to 7700 kcal/kg rule', () => {
    // 0.5 kg/week loss -> (0.5 * 7700) / 7 = 550 kcal deficit
    // 2450 - 550 = 1900 kcal target
    const plan = computePlan(baseContext, {
      goal: 'lose',
      targetRateKgPerWeek: 0.5,
      targetWeightKg: 75,
    });

    expect(plan.targetResult.kcalTarget).toBe(1900);
    expect(plan.targetResult.appliedDelta).toBe(-550);
    expect(plan.macros.proteinGrams).toBeGreaterThanOrEqual(140);
    expect(plan.macros.fatGrams).toBeGreaterThanOrEqual(48); // min 0.6g/kg
    expect(plan.macros.fatPct).toBeGreaterThanOrEqual(20); // hormonal floor >= 20% kcal

    // Projection check: 80kg -> 75kg = 5kg / 0.5 = 10 weeks
    expect(plan.projection.estimatedWeeks).toBe(10);
    expect(plan.projection.isRealistic).toBe(true);
    expect(plan.projection.pacingAdvice).toContain('Optimal fat loss pace');
  });

  it('enforces safety floors: prevents cut below resting BMR', () => {
    // High deficit request on a low TDEE:
    // TDEE 2000, BMR 1780. Requesting 1.0 kg/wk deficit (1100 kcal).
    // Candidate = 2000 - 1100 = 900 kcal.
    // Must be clamped to BMR (1780 kcal)!
    const plan = computePlan(
      { ...baseContext, tdee: 2000 },
      { goal: 'lose', targetRateKgPerWeek: 1.0 }
    );

    expect(plan.targetResult.kcalTarget).toBe(1780);
    expect(
      plan.targetResult.safetyViolations.some(
        (v) => v.code === 'BELOW_BMR_FLOOR'
      )
    ).toBe(true);
  });

  it('disables weight-loss goal if user is underweight (BMI < 18.5)', () => {
    // Underweight: 45kg, 165cm -> BMI 16.5
    const underweightContext: PlanUserContext = {
      ...baseContext,
      weightKg: 45,
      heightCm: 165,
      bmr: 1200,
      tdee: 1600,
    };

    const plan = computePlan(underweightContext, {
      goal: 'lose',
      targetRateKgPerWeek: 0.5,
    });

    // Must reset to maintenance (0 delta)
    expect(plan.targetResult.kcalTarget).toBe(1600);
    expect(
      plan.targetResult.safetyViolations.some(
        (v) => v.code === 'UNDERWEIGHT_CUT_DISABLED'
      )
    ).toBe(true);
  });

  it('computes timeline projection and warns about aggressive pace', () => {
    // 80kg person losing 1.5 kg/week -> 1.5 / 80 = 1.875% BW/wk (>1% max safe rate)
    const projection = computeProjection(80, 'lose', 1.5, 70);
    expect(projection.isRealistic).toBe(false);
    expect(projection.pacingAdvice).toContain('Aggressive pace');
    expect(projection.estimatedWeeks).toBe(7); // 10kg / 1.5 = 6.67 -> 7 weeks
  });

  it('handles weight maintenance with 0 delta and stabilizing advice', () => {
    const plan = computePlan(baseContext, {
      goal: 'maintain',
      targetRateKgPerWeek: 0,
    });

    expect(plan.targetResult.kcalTarget).toBe(baseContext.tdee);
    expect(plan.targetResult.appliedDelta).toBe(0);
    expect(plan.projection.pacingAdvice).toContain('Steady weight maintenance');
  });
});
