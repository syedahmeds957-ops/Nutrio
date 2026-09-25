import { describe, expect, it } from 'vitest';
import { validateWeighIn, WeightTrendEngine } from '../engine.js';

describe('Weight Trend & Closed-Loop Adaptive TDEE (Task 1.6)', () => {
  it('validates weigh-in numbers within realistic physiological boundaries', () => {
    expect(validateWeighIn(0).isValid).toBe(false);
    expect(validateWeighIn(20).isValid).toBe(false);
    expect(validateWeighIn(350).isValid).toBe(false);
    expect(validateWeighIn(80.5).isValid).toBe(true);
  });

  it('applies EWMA smoothing (alpha=0.25) to filter acute scale fluctuations', () => {
    const engine = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2400,
      bmr: 1750,
    });

    // Day 1: 80.0 kg
    engine.logWeighIn(80.0, '2026-09-01');
    let summary = engine.getSummary();
    expect(summary.currentWeightKg).toBe(80.0);
    expect(summary.currentEWMAKg).toBe(80.0);

    // Day 2: 82.0 kg (acute water jump +2.0 kg from salt/rice)
    engine.logWeighIn(82.0, '2026-09-02');
    summary = engine.getSummary();
    expect(summary.currentWeightKg).toBe(82.0);
    // 0.25 * 82 + 0.75 * 80 = 20.5 + 60 = 80.5 kg
    expect(summary.currentEWMAKg).toBe(80.5);

    // Day 3: 79.0 kg (water drops off)
    engine.logWeighIn(79.0, '2026-09-03');
    summary = engine.getSummary();
    expect(summary.currentWeightKg).toBe(79.0);
    // 0.25 * 79 + 0.75 * 80.5 = 19.75 + 60.375 = 80.13 kg
    expect(summary.currentEWMAKg).toBe(80.13);
  });

  it('detects single-day water retention spikes and offers cultural reassurance', () => {
    const engine = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2200,
      bmr: 1600,
    });

    engine.logWeighIn(75.0, '2026-09-01');
    const spikeCheck = engine.checkSpikeWarning(77.5); // +2.5 kg spike

    expect(spikeCheck.hasSpike).toBe(true);
    expect(spikeCheck.message).toContain('water-weight fluctuation');
    expect(spikeCheck.message).toContain('EWMA algorithm filters this noise');
  });

  it('integrates closed-loop adaptive TDEE and protects against under-logging', () => {
    const engine = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2500,
      bmr: 1800,
    });

    // Populate 14 days of logs with implausibly low intake (< 1.1 * 1800 = 1980 kcal)
    for (let i = 1; i <= 14; i++) {
      const day = i < 10 ? `0${i}` : `${i}`;
      engine.logWeighIn(85.0, `2026-09-${day}`);
      engine.logIntake(1200, `2026-09-${day}`); // 1200 kcal is far below 1.1x BMR
    }

    const summary = engine.getSummary();
    const adaptive = summary.adaptiveTDEE;

    // Must trigger under-logging safeguard
    expect(adaptive.isUnderLogging).toBe(true);
    expect(adaptive.explanation).toContain('implausibly low (<1.1x BMR)');
    // Blended TDEE must NOT crash below formula TDEE
    expect(adaptive.blendedTDEE).toBe(2500);
  });
});
