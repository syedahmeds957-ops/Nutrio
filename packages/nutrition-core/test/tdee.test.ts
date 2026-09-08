import { describe, expect, it } from 'vitest';
import { calculateTDEE, getStepMultiplier } from '../src/tdee.js';

describe('TDEE Calculations', () => {
  const bmr = 1780;

  it('calculates standard activity multipliers correctly', () => {
    // Sedentary (1.2) -> 1780 * 1.2 = 2136
    expect(calculateTDEE({ bmr, activityLevel: 'sedentary' }).tdee).toBe(2136);

    // Light (1.375) -> 1780 * 1.375 = 2447.5 -> 2448
    expect(calculateTDEE({ bmr, activityLevel: 'light' }).tdee).toBe(2448);

    // Moderate (1.55) -> 1780 * 1.55 = 2759
    expect(calculateTDEE({ bmr, activityLevel: 'moderate' }).tdee).toBe(2759);

    // Very active (1.725) -> 1780 * 1.725 = 3070.5 -> 3071
    expect(calculateTDEE({ bmr, activityLevel: 'very_active' }).tdee).toBe(3071);

    // Extra active (1.9) -> 1780 * 1.9 = 3382
    expect(calculateTDEE({ bmr, activityLevel: 'extra_active' }).tdee).toBe(3382);
  });

  it('supports occupational factor + exercise expenditure split', () => {
    // Desk job (1.2) + 2100 kcal weekly exercise (300 kcal/day)
    // TDEE = 1780 * 1.2 + 300 = 2136 + 300 = 2436
    const result = calculateTDEE({
      bmr,
      activityLevel: 'sedentary',
      occupationalFactor: 1.2,
      weeklyExerciseKcal: 2100,
    });
    expect(result.tdee).toBe(2436);
    expect(result.method).toBe('occupational_split');
  });

  it('allows daily step count override from wearables', () => {
    expect(getStepMultiplier(4000)).toBe(1.2);
    expect(getStepMultiplier(6500)).toBe(1.375);
    expect(getStepMultiplier(9000)).toBe(1.55);
    expect(getStepMultiplier(12000)).toBe(1.725);
    expect(getStepMultiplier(16000)).toBe(1.9);

    // 10,000 steps -> 1.55 multiplier
    const result = calculateTDEE({
      bmr,
      activityLevel: 'sedentary',
      dailyStepCount: 10000,
    });
    expect(result.tdee).toBe(2759);
    expect(result.method).toBe('step_override');
  });
});
