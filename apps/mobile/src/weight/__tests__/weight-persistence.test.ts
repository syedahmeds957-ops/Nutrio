import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadWeighIns,
  saveWeighIns,
  releaseWeightCache,
} from '../weightStorage.js';
import { buildWeighInSeed, datesInRange, CALIBRATION_WINDOW_DAYS } from '../weightSeed.js';
import { WeightTrendEngine } from '../engine.js';

const clearStorage = () => {
  releaseWeightCache();
  try {
    window.localStorage.clear();
  } catch {
    // No localStorage in this runner; the in-memory mirror is enough.
  }
};

describe('Weigh-in persistence', () => {
  beforeEach(clearStorage);

  it('keeps every weigh-in the user records', () => {
    // The reported bug: logged 2-3 times, only one row ever appeared.
    const engine = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2341,
      bmr: 1951,
    });

    engine.logWeighIn(104, '2026-09-28');
    saveWeighIns(engine.getWeighIns());
    engine.logWeighIn(103.4, '2026-09-29');
    saveWeighIns(engine.getWeighIns());
    engine.logWeighIn(103.1, '2026-09-30');
    saveWeighIns(engine.getWeighIns());

    const reloaded = loadWeighIns();
    expect(reloaded).toHaveLength(3);
    expect(reloaded.map((w) => w.weightKg)).toEqual([104, 103.4, 103.1]);
  });

  it('survives the screen being closed and reopened', () => {
    const first = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2341,
      bmr: 1951,
    });
    first.logWeighIn(104, '2026-09-29');
    saveWeighIns(first.getWeighIns());

    // A fresh engine, as if the user navigated away and came back.
    const reopened = new WeightTrendEngine({
      weighIns: loadWeighIns(),
      intakeLogs: [],
      formulaTDEE: 2341,
      bmr: 1951,
    });
    reopened.logWeighIn(103.2, '2026-09-30');
    saveWeighIns(reopened.getWeighIns());

    expect(loadWeighIns()).toHaveLength(2);
  });

  it('computes real progress once more than one weigh-in exists', () => {
    // "na hi koi progress mei add hova" — net change stayed 0 because there
    // was only ever one point to compare.
    const engine = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2341,
      bmr: 1951,
    });
    engine.logWeighIn(104, '2026-09-23');
    engine.logWeighIn(102.5, '2026-09-30');

    const summary = engine.getSummary();
    expect(summary.startWeightKg).toBe(104);
    expect(summary.currentWeightKg).toBe(102.5);
    expect(summary.totalDeltaKg).toBeLessThan(0);
    expect(summary.points).toHaveLength(2);
  });

  it('keeps one entry per date, so re-logging today corrects rather than duplicates', () => {
    const engine = new WeightTrendEngine({
      weighIns: [],
      intakeLogs: [],
      formulaTDEE: 2341,
      bmr: 1951,
    });
    engine.logWeighIn(104, '2026-09-30');
    engine.logWeighIn(103.8, '2026-09-30');
    saveWeighIns(engine.getWeighIns());

    const reloaded = loadWeighIns();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].weightKg).toBe(103.8);
  });
});

describe('Weigh-in seeding', () => {
  beforeEach(clearStorage);

  it('uses the stored log when one exists, instead of fabricating a baseline', () => {
    saveWeighIns([
      { id: 'w1', date: '2026-09-28', weightKg: 104, loggedAt: '2026-09-28T08:00:00Z' },
      { id: 'w2', date: '2026-09-30', weightKg: 102.9, loggedAt: '2026-09-30T08:00:00Z' },
    ]);

    const seed = buildWeighInSeed(99, '2026-09-30');
    expect(seed).toHaveLength(2);
    // The survey weight must not overwrite what the user actually recorded.
    expect(seed.map((w) => w.weightKg)).not.toContain(99);
  });

  it('falls back to the survey weight only for a user who has never weighed in', () => {
    const seed = buildWeighInSeed(104, '2026-09-30');
    expect(seed).toHaveLength(1);
    expect(seed[0].weightKg).toBe(104);
    expect(seed[0].date).toBe('2026-09-30');
  });
});

describe('Calibration window dates', () => {
  it('walks back from today, oldest first', () => {
    expect(datesInRange('2026-09-28', '2026-09-30', 28)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
    ]);
  });

  it('never reads beyond the calibration window', () => {
    const dates = datesInRange('2026-01-01', '2026-09-30', CALIBRATION_WINDOW_DAYS);
    expect(dates).toHaveLength(CALIBRATION_WINDOW_DAYS);
    expect(dates[dates.length - 1]).toBe('2026-09-30');
  });

  it('handles a history that starts today', () => {
    expect(datesInRange('2026-09-30', '2026-09-30', 28)).toEqual(['2026-09-30']);
  });

  it('returns nothing when the start date is after today', () => {
    expect(datesInRange('2026-10-05', '2026-09-30', 28)).toEqual([]);
  });
});
