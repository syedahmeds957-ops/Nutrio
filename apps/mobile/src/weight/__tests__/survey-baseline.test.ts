import { beforeEach, describe, expect, it } from 'vitest';
import { SURVEY_BASELINE_ID, isSurveyBaseline, withSurveyBaseline } from '../surveyBaseline.js';
import { buildWeighInSeed } from '../weightSeed.js';
import { releaseWeightCache, saveWeighIns } from '../weightStorage.js';
import { weightGlance } from '../weightGlance.js';
import { WeightTrendEngine } from '../engine.js';
import type { WeighInEntry } from '../types.js';

const entry = (id: string, date: string, weightKg: number): WeighInEntry => ({ id, date, weightKg, loggedAt: `${date}T08:00:00Z` });

describe('withSurveyBaseline', () => {
  it('makes the survey weight the first weigh-in for a user who has none', () => {
    const log = withSurveyBaseline([], 62, '2026-10-01');
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ id: SURVEY_BASELINE_ID, date: '2026-10-01', weightKg: 62 });
    expect(isSurveyBaseline(log[0])).toBe(true);
  });

  it('leaves stored weigh-ins alone', () => {
    const stored = [entry('w1', '2026-10-05', 61.5)];
    expect(withSurveyBaseline(stored, 62, '2026-10-01')).toEqual(stored);
  });

  it('adds nothing without a usable survey weight', () => {
    expect(withSurveyBaseline([], null, '2026-10-01')).toEqual([]);
    expect(withSurveyBaseline([], undefined, '2026-10-01')).toEqual([]);
    expect(withSurveyBaseline([], 0, '2026-10-01')).toEqual([]);
  });

  it('does not tag a logged weigh-in as the survey weight', () => {
    expect(isSurveyBaseline(entry('w1', '2026-10-05', 61.5))).toBe(false);
  });
});

describe('the tile and the screen agree', () => {
  beforeEach(() => releaseWeightCache());

  it('both read the survey weight when nothing is logged', () => {
    const seed = buildWeighInSeed(62, '2026-10-01');
    const tile = weightGlance(withSurveyBaseline([], 62, '2026-10-01'));
    expect(seed.map((w) => w.weightKg)).toEqual([62]);
    expect(tile).toMatchObject({ latestKg: 62, latestFromSurvey: true, weekDeltaKg: null });
  });

  it('both move on to the logged weights once there are any', () => {
    saveWeighIns([entry('w1', '2026-10-05', 61.5)]);
    const stored = buildWeighInSeed(62, '2026-10-01');
    expect(stored.map((w) => w.weightKg)).toEqual([61.5]);
    expect(weightGlance(stored)).toMatchObject({ latestKg: 61.5, latestFromSurvey: false });
  });

  it('marks the survey point for the history list and keeps real ones unmarked', () => {
    const engine = new WeightTrendEngine({ weighIns: withSurveyBaseline([], 62, '2026-10-01'), intakeLogs: [], formulaTDEE: 2000, bmr: 1500 });
    engine.logWeighIn(61.4, '2026-10-08');
    const { points } = engine.getSummary();
    expect(points.map((p) => p.fromSurvey ?? false)).toEqual([true, false]);
  });
});
