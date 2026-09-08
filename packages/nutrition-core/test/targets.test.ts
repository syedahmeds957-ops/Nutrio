import { describe, expect, it } from 'vitest';
import { calculateCalorieTarget } from '../src/targets.js';

describe('Calorie Target Calculations', () => {
  const baseInput = {
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    sex: 'male' as const,
    bmr: 1780,
    tdee: 2450,
  };

  it('calculates maintenance calories correctly (0 delta)', () => {
    const result = calculateCalorieTarget({
      ...baseInput,
      goal: 'maintain',
    });
    expect(result.kcalTarget).toBe(2450);
    expect(result.appliedDelta).toBe(0);
    expect(result.effectiveRateKgPerWeek).toBe(0);
    expect(result.safetyViolations).toHaveLength(0);
  });

  it('calculates fat loss deficit at 0.5 kg/week (7700 kcal/kg rule)', () => {
    // 0.5 kg/week -> (0.5 * 7700) / 7 = 550 kcal/day deficit
    // 2450 - 550 = 1900 kcal target
    const result = calculateCalorieTarget({
      ...baseInput,
      goal: 'lose',
      targetRateKgPerWeek: 0.5,
    });
    expect(result.kcalTarget).toBe(1900);
    expect(result.appliedDelta).toBe(-550);
    expect(result.effectiveRateKgPerWeek).toBe(0.5);
    expect(result.safetyViolations).toHaveLength(0);
  });

  it('caps fat loss rate at 1% of body weight per week', () => {
    // 80kg male -> 1% BW = 0.8 kg/week. User asks for 1.5 kg/week.
    // Use TDEE 3600 so neither BMR floor (1780) nor 25% deficit cap (900 kcal) is triggered.
    const result = calculateCalorieTarget({
      ...baseInput,
      tdee: 3600,
      goal: 'lose',
      targetRateKgPerWeek: 1.5,
    });
    expect(result.effectiveRateKgPerWeek).toBe(0.8);
    expect(result.safetyViolations.some((v) => v.code === 'EXCESSIVE_RATE')).toBe(true);
  });

  it('prevents cut below BMR and clamps to floor', () => {
    // BMR 1780, TDEE 2100. Target rate 0.8kg/wk = 880 kcal deficit.
    // 2100 - 880 = 1220 kcal (far below BMR 1780).
    const result = calculateCalorieTarget({
      ...baseInput,
      tdee: 2100,
      goal: 'lose',
      targetRateKgPerWeek: 0.8,
    });
    expect(result.kcalTarget).toBe(1780); // Clamped to BMR
    expect(result.safetyViolations.some((v) => v.code === 'BELOW_BMR_FLOOR')).toBe(true);
  });

  it('forces maintenance for pregnant user trying to cut', () => {
    const result = calculateCalorieTarget({
      ...baseInput,
      sex: 'female',
      bmr: 1400,
      tdee: 1900,
      goal: 'lose',
      isPregnantOrBreastfeeding: true,
    });
    expect(result.kcalTarget).toBe(1900); // Reset to maintenance
    expect(
      result.safetyViolations.some((v) => v.code === 'PREGNANCY_MAINTENANCE_ONLY')
    ).toBe(true);
  });

  it('flags medical conditions for clinical consultation', () => {
    const result = calculateCalorieTarget({
      ...baseInput,
      goal: 'lose',
      medicalConditions: ['Type 2 Diabetes', 'Hypertension'],
    });
    expect(result.safetyWarnings).toHaveLength(1);
    expect(result.safetyWarnings[0]).toContain('Type 2 Diabetes');
  });
});
