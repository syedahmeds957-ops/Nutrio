import { describe, expect, it } from 'vitest';
import { calculateAdaptiveTDEE, calculateEWMA } from '../src/adaptive.js';

describe('Adaptive TDEE & Weight Smoothing', () => {
  it('correctly computes EWMA series with alpha = 0.25', () => {
    const rawWeights = [80.0, 79.5, 80.2, 79.2];
    // Day 0: 80.0
    // Day 1: 0.25*79.5 + 0.75*80.0 = 19.875 + 60.0 = 79.875 -> 79.88
    // Day 2: 0.25*80.2 + 0.75*79.875 = 20.05 + 59.90625 = 79.95625 -> 79.96
    const ewma = calculateEWMA(rawWeights);
    expect(ewma[0]).toBe(80.0);
    expect(ewma[1]).toBe(79.88);
    expect(ewma[2]).toBe(79.96);
  });

  it('falls back to formula TDEE if fewer than 7 days of logs are present', () => {
    const result = calculateAdaptiveTDEE({
      formulaTDEE: 2400,
      bmr: 1750,
      dailyWeighInsKg: [
        { dayIndex: 1, weightKg: 80 },
        { dayIndex: 2, weightKg: 79.8 },
      ],
      dailyIntakeKcal: [
        { dayIndex: 1, kcal: 1900 },
        { dayIndex: 2, kcal: 1950 },
      ],
    });

    expect(result.blendedTDEE).toBe(2400);
    expect(result.daysLogged).toBe(2);
    expect(result.explanation).toContain('Need at least 7 days');
  });

  it('correctly adapts TDEE over a 14-day logging window', () => {
    // 14 days of logging:
    // User eats 2000 kcal/day.
    // Weight goes from 80.0kg down to 79.0kg (1.0kg loss in 14 days).
    // Observed expenditure: 2000 - (-1.0 * 7700) / 14 = 2000 + 550 = 2550 kcal.
    // Days logged = 14 -> weight factor w = min(0.9, 14/28) = 0.50.
    // Formula TDEE was estimated at 2300 kcal.
    // Blended TDEE: 0.50 * 2550 + 0.50 * 2300 = 1275 + 1150 = 2425 kcal.
    const weighIns = Array.from({ length: 14 }, (_, i) => ({
      dayIndex: i + 1,
      weightKg: Number((80.0 - (i / 13) * 1.0).toFixed(2)),
    }));
    const intakes = Array.from({ length: 14 }, (_, i) => ({
      dayIndex: i + 1,
      kcal: 2000,
    }));

    const result = calculateAdaptiveTDEE({
      formulaTDEE: 2300,
      bmr: 1700,
      dailyWeighInsKg: weighIns,
      dailyIntakeKcal: intakes,
    });

    expect(result.daysLogged).toBe(14);
    expect(result.weightFactor).toBe(0.5);
    expect(result.observedTDEE).toBeGreaterThan(2300);
    expect(result.isUnderLogging).toBe(false);
    expect(result.recommendedKcalDelta).toBeLessThanOrEqual(150); // Respects weekly cap
  });

  it('detects under-logging when observed TDEE < 1.1x BMR and protects calories', () => {
    // User claims to eat 1100 kcal/day, but weight doesn't change (80kg -> 80kg)
    // Observed TDEE: 1100 kcal. But BMR is 1700 kcal (1.1x BMR = 1870 kcal).
    // 1100 < 1870 -> under-logging!
    const weighIns = Array.from({ length: 10 }, (_, i) => ({
      dayIndex: i + 1,
      weightKg: 80.0,
    }));
    const intakes = Array.from({ length: 10 }, (_, i) => ({
      dayIndex: i + 1,
      kcal: 1100,
    }));

    const result = calculateAdaptiveTDEE({
      formulaTDEE: 2400,
      bmr: 1700,
      dailyWeighInsKg: weighIns,
      dailyIntakeKcal: intakes,
    });

    expect(result.isUnderLogging).toBe(true);
    expect(result.blendedTDEE).toBe(2400); // Does NOT slash calories
    expect(result.explanation).toContain('implausibly low');
  });
});
