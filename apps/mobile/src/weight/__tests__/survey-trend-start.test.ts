import { describe, expect, it } from 'vitest';
import { SURVEY_BASELINE_ID, withSurveyTrendStart } from '../surveyBaseline.js';
import { buildWeeklyCheckIn } from '../../coach/weeklyCheckIn.js';
import { computePlan } from '../../plan/engine.js';
import type { PlanUserContext } from '../../plan/types.js';
import type { WeighInEntry } from '../types.js';

const entry = (id: string, date: string, weightKg: number): WeighInEntry => ({ id, date, weightKg, loggedAt: `${date}T08:00:00Z` });

describe('withSurveyTrendStart', () => {
  it('puts the survey weight before a later real weigh-in', () => {
    const log = withSurveyTrendStart([entry('w1', '2026-10-10', 61)], 62, '2026-10-01');
    expect(log.map((w) => [w.id, w.weightKg])).toEqual([[SURVEY_BASELINE_ID, 62], ['w1', 61]]);
  });

  it('does not double-count when a real entry is on the baseline date', () => {
    const stored = [entry('w1', '2026-10-01', 61)];
    expect(withSurveyTrendStart(stored, 62, '2026-10-01')).toEqual(stored);
  });

  it('adds nothing when a real entry is earlier than the baseline date', () => {
    const stored = [entry('w1', '2026-09-20', 63)];
    expect(withSurveyTrendStart(stored, 62, '2026-10-01')).toEqual(stored);
  });

  it('does not add a second baseline when one is already stored', () => {
    const stored = [entry(SURVEY_BASELINE_ID, '2026-10-02', 62), entry('w1', '2026-10-10', 61)];
    expect(withSurveyTrendStart(stored, 62, '2026-10-01')).toEqual(stored);
  });

  it('with no stored entries gives the plain baseline; no usable weight gives nothing', () => {
    expect(withSurveyTrendStart([], 62, '2026-10-01')).toHaveLength(1);
    expect(withSurveyTrendStart([], null, '2026-10-01')).toEqual([]);
    expect(withSurveyTrendStart([entry('w1', '2026-10-10', 61)], null, '2026-10-01')).toHaveLength(1);
  });
});

describe('weekly check-in with the survey weight', () => {
  const ctx: PlanUserContext = {
    weightKg: 62, heightCm: 160, ageYears: 41, sex: 'female', bmr: 1300, tdee: 1900,
    chaiSugarKcalPerDay: 130, weeklyChaiSugarKcal: 910, isNightShift: false, dailySittingHours: 8,
  };
  const plan = computePlan(ctx, { goal: 'maintain', targetRateKgPerWeek: 0 });
  const today = '2026-10-14';
  const real = [entry('w1', '2026-10-13', 60)];

  it('gives a trend from one real weigh-in plus the survey weight', () => {
    const without = buildWeeklyCheckIn({ plan, weighIns: real, intakeLogs: [], today });
    const withSurvey = buildWeeklyCheckIn({ plan, weighIns: real, survey: { weightKg: 62, baselineDate: '2026-09-01' }, intakeLogs: [], today });
    expect(without.metrics.weightDeltaKg).toBe(0);
    expect(withSurvey.metrics.weightDeltaKg).toBeLessThan(0);
  });

  it('leaves the calorie safety result unchanged', () => {
    const a = buildWeeklyCheckIn({ plan, weighIns: real, intakeLogs: [], today });
    const b = buildWeeklyCheckIn({ plan, weighIns: real, survey: { weightKg: 62, baselineDate: '2026-09-01' }, intakeLogs: [], today });
    expect(b.status).toBe(a.status);
    expect(b.metrics.tdeeDelta).toBe(a.metrics.tdeeDelta);
    expect(b.metrics.newKcalTarget).toBe(a.metrics.newKcalTarget);
  });
});
