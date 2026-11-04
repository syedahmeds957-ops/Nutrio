import { describe, expect, it } from 'vitest';
import { calculateBMR } from '../src/bmr.js';
import { calculateCalorieTarget, describePaceLimit } from '../src/targets.js';

describe('describePaceLimit', () => {
  // Audit sample user: female, 28 y, 165 cm, 62 kg, desk job, 3 gym days.
  const sample = {
    weightKg: 62,
    heightCm: 165,
    ageYears: 28,
    sex: 'female' as const,
    bmr: calculateBMR({ weightKg: 62, heightCm: 165, ageYears: 28, sex: 'female' }).selectedBMR,
    tdee: 1787,
  };

  it('reports the at-rest floor slowing a 0.5 kg/week cut to about 0.4 kg/week', () => {
    expect(sample.bmr).toBe(1350);
    const result = calculateCalorieTarget({ ...sample, goal: 'lose', targetRateKgPerWeek: 0.5 });
    // 0.5 kg/week asks for 1,787 - 550 = 1,237; the 25% cap lifts it to 1,340,
    // then the at-rest floor lifts it to 1,350.
    expect(result.kcalTarget).toBe(1350);
    expect(result.appliedDelta).toBe(-437);
    expect(result.effectiveRateKgPerWeek).toBe(0.4);

    const limit = describePaceLimit(0.5, result, 'lose');
    expect(limit).toEqual({
      limited: true,
      reason: 'bmr',
      requestedRateKgPerWeek: 0.5,
      effectiveRateKgPerWeek: 0.4,
      requestedDailyDelta: -550,
      appliedDailyDelta: -437,
    });
  });

  it('is not limited when the picked pace fits inside every floor', () => {
    const result = calculateCalorieTarget({ ...sample, goal: 'lose', targetRateKgPerWeek: 0.25 });
    expect(result.kcalTarget).toBe(1787 - 275);
    const limit = describePaceLimit(0.25, result, 'lose');
    expect(limit.limited).toBe(false);
    expect(limit.reason).toBeNull();
    expect(limit.effectiveRateKgPerWeek).toBe(0.25);
  });

  it('names the 25% cap when it binds above the at-rest floor', () => {
    // TDEE 2600: 0.6 kg/week asks for 2600 - 660 = 1940; the 25% cap is 1950, above BMR 1350.
    const result = calculateCalorieTarget({ ...sample, tdee: 2600, goal: 'lose', targetRateKgPerWeek: 0.6 });
    expect(result.kcalTarget).toBe(1950);
    const limit = describePaceLimit(0.6, result, 'lose');
    expect(limit.limited).toBe(true);
    expect(limit.reason).toBe('maxDeficit');
    expect(limit.effectiveRateKgPerWeek).toBe(0.59);
  });

  it('names the absolute floor when it binds last', () => {
    // Tiny BMR (1100) and TDEE (1400): the 1,200 kcal floor for women binds.
    const result = calculateCalorieTarget({ ...sample, bmr: 1100, tdee: 1400, goal: 'lose', targetRateKgPerWeek: 0.5 });
    expect(result.kcalTarget).toBe(1200);
    expect(describePaceLimit(0.5, result, 'lose').reason).toBe('absoluteFloor');
  });

  it('names the 1% body-weight cap when no floor binds', () => {
    const result = calculateCalorieTarget({ ...sample, tdee: 4000, goal: 'lose', targetRateKgPerWeek: 1 });
    expect(result.effectiveRateKgPerWeek).toBe(0.62);
    const limit = describePaceLimit(1, result, 'lose');
    expect(limit.reason).toBe('maxLossRate');
    expect(limit.requestedDailyDelta).toBe(-1100);
  });

  it('catches the 0.5 kg/week gain cap, which leaves no violation behind', () => {
    const result = calculateCalorieTarget({ ...sample, goal: 'gain', targetRateKgPerWeek: 0.75 });
    expect(result.effectiveRateKgPerWeek).toBe(0.5);
    const limit = describePaceLimit(0.75, result, 'gain');
    expect(limit).toMatchObject({ limited: true, reason: 'maxGainRate', requestedDailyDelta: 825, appliedDailyDelta: 550 });
  });

  it('never reports a limit for maintenance or a clinically blocked cut', () => {
    const maintain = calculateCalorieTarget({ ...sample, goal: 'maintain' });
    expect(describePaceLimit(0.5, maintain, 'maintain').limited).toBe(false);

    const teen = calculateCalorieTarget({ ...sample, ageYears: 16, goal: 'lose', targetRateKgPerWeek: 0.5 });
    expect(describePaceLimit(0.5, teen, 'lose')).toMatchObject({ limited: false, reason: null });
  });
});
