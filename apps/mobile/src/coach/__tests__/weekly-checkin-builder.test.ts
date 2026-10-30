import { describe, expect, it } from 'vitest';
import { MAX_WEEKLY_ADJUSTMENT_KCAL } from '@nutrio/nutrition-core';
import { buildWeeklyCheckIn } from '../weeklyCheckIn.js';
import { computePlan } from '../../plan/engine.js';
import { addDaysToKey } from '../../common/dateKey.js';
import type { PlanUserContext } from '../../plan/types.js';
import type { DailyIntakeLog, WeighInEntry } from '../../weight/types.js';
import { generateWeeklyPlan, type Weekday, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';

const TODAY = '2026-10-14';

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
const plan = computePlan(userContext, { goal: 'maintain', targetRateKgPerWeek: 0 });

/** One entry per day, oldest first, ending today. */
function days<T>(count: number, make: (date: string, i: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => make(addDaysToKey(TODAY, i - (count - 1)), i));
}
const intake = (count: number, kcal: number): DailyIntakeLog[] =>
  days(count, (date) => ({ date, kcal }));
const weighIns = (count: number, weightFor: (i: number) => number): WeighInEntry[] =>
  days(count, (date, i) => ({
    id: `w${i}`,
    date,
    weightKg: weightFor(i),
    loggedAt: `${date}T08:00:00Z`,
  }));

describe('buildWeeklyCheckIn', () => {
  it('asks for more logging and keeps the target when there is too little data', () => {
    const result = buildWeeklyCheckIn({ plan, weighIns: [], intakeLogs: [], today: TODAY });

    expect(result.status).toBe('needs_more_data');
    expect(result.metrics).toMatchObject({
      daysLogged: 0,
      adherenceRatePct: 0,
      meanDailyIntake: 0,
      weightDeltaKg: 0,
      tdeeDelta: 0,
      targetDelta: 0,
      oldKcalTarget: plan.targetResult.kcalTarget,
      newKcalTarget: plan.targetResult.kcalTarget,
    });
    expect(result.proposedPlan.targetResult.kcalTarget).toBe(plan.targetResult.kcalTarget);
  });

  it('reports only the last 7 days in the weekly figures', () => {
    // 10 days logged: 3 older days at 3000 kcal, then 7 days at 1800.
    const logs = [...intake(10, 1800)];
    logs[0] = { ...logs[0], kcal: 3000 };
    logs[1] = { ...logs[1], kcal: 3000 };
    logs[2] = { ...logs[2], kcal: 3000 };

    const result = buildWeeklyCheckIn({
      plan,
      weighIns: weighIns(10, () => 62),
      intakeLogs: logs,
      today: TODAY,
    });

    expect(result.metrics.daysLogged).toBe(7);
    expect(result.metrics.adherenceRatePct).toBe(100);
    expect(result.metrics.meanDailyIntake).toBe(1800);
  });

  it('measures the week’s weight change on the smoothed trend', () => {
    const result = buildWeeklyCheckIn({
      plan,
      weighIns: weighIns(14, (i) => 63 - i * 0.1),
      intakeLogs: intake(14, 1900),
      today: TODAY,
    });

    expect(result.metrics.weightDeltaKg).toBeLessThan(0);
    expect(result.metrics.currentEWMAWeightKg).toBeLessThan(63);
  });

  it('raises the target, capped per week, when weight falls faster than intake explains', () => {
    // Eating the formula TDEE yet losing ~0.1 kg/day: true expenditure is higher.
    const result = buildWeeklyCheckIn({
      plan,
      weighIns: weighIns(14, (i) => 63 - i * 0.1),
      intakeLogs: intake(14, 1900),
      today: TODAY,
    });

    expect(result.status).toBe('adjusted');
    expect(result.metrics.oldTDEE).toBe(1900);
    expect(result.metrics.tdeeDelta).toBe(MAX_WEEKLY_ADJUSTMENT_KCAL);
    expect(result.metrics.newTDEE).toBe(1900 + MAX_WEEKLY_ADJUSTMENT_KCAL);
    expect(result.metrics.newKcalTarget).toBeGreaterThan(plan.targetResult.kcalTarget);
    expect(result.metrics.targetDelta).toBe(
      result.metrics.newKcalTarget - result.metrics.oldKcalTarget
    );
    // The accepted plan carries the recalibrated TDEE, so next week's check-in
    // measures from here instead of stacking the same correction again.
    expect(result.proposedPlan.userContext.tdee).toBe(1900 + MAX_WEEKLY_ADJUSTMENT_KCAL);
    expect(result.proposedPlan.targetResult.kcalTarget).toBe(result.metrics.newKcalTarget);
    expect(result.proposedPlan.recalibratedAt).toBe(TODAY);
    expect(result.proposedPlan.formulaTdee).toBe(1900);
  });

  it('never cuts calories when the log implies implausibly low expenditure', () => {
    // 600 kcal/day with a flat weight means meals are going unlogged.
    const result = buildWeeklyCheckIn({
      plan,
      weighIns: weighIns(10, () => 62),
      intakeLogs: intake(10, 600),
      today: TODAY,
    });

    expect(result.status).toBe('under_logging');
    expect(result.metrics.targetDelta).toBe(0);
    expect(result.proposedPlan.targetResult.kcalTarget).toBe(plan.targetResult.kcalTarget);
  });

  it('reports on track when the trend matches the plan', () => {
    const result = buildWeeklyCheckIn({
      plan,
      weighIns: weighIns(14, () => 62),
      intakeLogs: intake(14, 1900),
      today: TODAY,
    });

    expect(result.status).toBe('on_track');
    expect(result.metrics.targetDelta).toBe(0);
  });

  it("does not reapply evidence that an accepted recalibration already used", () => {
    const recalibrated = { ...plan, recalibratedAt: addDaysToKey(TODAY, -3) };

    // The same 14 days that justified the last correction.
    const result = buildWeeklyCheckIn({
      plan: recalibrated,
      weighIns: weighIns(14, (i) => 63 - i * 0.1),
      intakeLogs: intake(14, 1900),
      today: TODAY,
    });

    // Only 3 days have been logged since, so nothing new can be concluded yet.
    expect(result.status).toBe("needs_more_data");
    expect(result.metrics.targetDelta).toBe(0);
    expect(result.proposedPlan).toBe(recalibrated);
  });

  it("pairs intake with weigh-ins by date, not by position", () => {
    // Weighed on even days, logged meals on odd days: no day has both.
    const all = days(14, (date, i) => ({ date, i }));
    const result = buildWeeklyCheckIn({
      plan,
      weighIns: all
        .filter(({ i }) => i % 2 === 0)
        .map(({ date, i }) => ({ id: "w" + i, date, weightKg: 63 - i * 0.1, loggedAt: date })),
      intakeLogs: all.filter(({ i }) => i % 2 === 1).map(({ date }) => ({ date, kcal: 1900 })),
      today: TODAY,
    });

    expect(result.status).toBe("needs_more_data");
  });
});

describe('buildWeeklyCheckIn training', () => {
  // TODAY is Wednesday 14 October; the check-in's 7 days run Thursday 8 to today.
  const SETTINGS: WorkoutSettings = {
    goal: 'general',
    experience: 'some',
    location: 'gym',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: ['mon', 'wed', 'thu'],
    sessionMinutes: 45,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: false },
  };
  const workoutPlan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-01' });
  const session = (day: Weekday) => workoutPlan.sessions.find((s) => s.day === day)!;
  const log = (day: Weekday, dateKey: string): WorkoutLog => ({
    dateKey,
    day,
    template: session(day).template,
    exercises: [],
    startedAt: `${dateKey}T08:00:00Z`,
  });
  const training = (logs: WorkoutLog[], region: string | undefined = 'PK', planned = workoutPlan) =>
    buildWeeklyCheckIn({ plan, weighIns: [], intakeLogs: [], today: TODAY, workouts: { plan: planned, logs, region } }).metrics.training;

  it("counts the week's sessions and what was missed; today's isn't missed yet", () => {
    expect(training([log('mon', '2026-10-12')])).toEqual({
      planned: 3,
      done: 1,
      missed: [{ template: session('thu').template, variant: session('thu').variant }],
    });
  });

  it('credits a missed session done later that week, but not next week’s session started early', () => {
    // Thursday 8's session done on Saturday 10 ("Do it today"): it counts.
    expect(training([log('thu', '2026-10-10')])?.done).toBe(1);
    // A Thursday session logged on Tuesday 13 is next Thursday's, started early.
    expect(training([log('thu', '2026-10-13')])?.done).toBe(0);
  });

  it("follows the region's week: Sunday start for SA, Monday for PK and everywhere else", () => {
    // Monday 12's session logged on Sunday 11: the same week only when weeks start on Sunday.
    const logs = [log('mon', '2026-10-11')];
    expect(training(logs, 'SA')?.done).toBe(1);
    expect(training(logs, 'PK')?.done).toBe(0);
    expect(training(logs, undefined)?.done).toBe(0);
    expect(training(logs, 'AE')?.done).toBe(0);
  });

  it('ignores logs dated after today, and days before the plan began unless done', () => {
    expect(training([log('mon', '2026-10-15')])?.done).toBe(0);
    const newer = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-13' });
    expect(training([], 'PK', newer)).toEqual({ planned: 1, done: 0, missed: [] });
    // ...unless that earlier session was done: Monday 12's, done on Tuesday 13.
    const mondayOfNewer = { ...log('mon', '2026-10-13'), template: newer.sessions.find((x) => x.day === 'mon')!.template };
    expect(training([mondayOfNewer], 'PK', newer)).toMatchObject({ planned: 2, done: 1, missed: [] });
  });

  it('is absent without a workout plan, or when no session falls in the week', () => {
    expect(buildWeeklyCheckIn({ plan, weighIns: [], intakeLogs: [], today: TODAY }).metrics.training).toBeUndefined();
    const restToday = generateWeeklyPlan({ ...SETTINGS, trainingDays: ['fri', 'sat'] }, { seed: 5, today: TODAY });
    expect(training([], 'PK', restToday)).toBeUndefined();
  });

  it('never changes the calorie maths', () => {
    const input = {
      plan,
      weighIns: weighIns(14, (i) => 62 - i * 0.05),
      intakeLogs: intake(14, 1700),
      today: TODAY,
    };
    const without = buildWeeklyCheckIn(input);
    const withWorkouts = buildWeeklyCheckIn({ ...input, workouts: { plan: workoutPlan, logs: [log('mon', '2026-10-12')], region: 'PK' } });
    const { training: _training, ...metrics } = withWorkouts.metrics;
    expect(withWorkouts.status).toBe(without.status);
    expect(withWorkouts.proposedPlan).toEqual(without.proposedPlan);
    expect(metrics).toEqual(without.metrics);
  });
});
