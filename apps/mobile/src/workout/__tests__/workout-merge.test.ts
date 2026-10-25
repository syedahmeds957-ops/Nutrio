import { describe, expect, it } from 'vitest';
import { generateWeeklyPlan, type WeeklyWorkoutPlan, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';
import { mergeWorkoutLogs, pickWorkoutPlan, planSavedAt } from '../workoutMerge.js';

const SETTINGS: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'fri'],
  sessionMinutes: 45,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};

const plan = (updatedAt?: string): WeeklyWorkoutPlan => ({
  ...generateWeeklyPlan(SETTINGS, { seed: 1, today: '2026-10-19', now: '2026-10-19T08:00:00.000Z' }),
  ...(updatedAt ? { updatedAt } : {}),
});

function log(dateKey: string, day: WorkoutLog['day'], finishedAt: string, reps = 10): WorkoutLog {
  return {
    dateKey,
    day,
    template: 'upper',
    exercises: [{ slotId: 'upper-a:horizontal_push:0', exerciseId: 'barbell-bench-press', sets: [{ reps, loadKg: 40, done: true }] }],
    startedAt: `${dateKey}T10:00:00.000Z`,
    finishedAt,
  };
}

describe('pickWorkoutPlan', () => {
  it('keeps the newer save, whichever side it is on', () => {
    expect(pickWorkoutPlan(plan('2026-10-24T10:00:00.000Z'), { plan: plan(), updatedAt: '2026-10-23T10:00:00+00:00' })).toBe('local');
    expect(pickWorkoutPlan(plan('2026-10-22T10:00:00.000Z'), { plan: plan(), updatedAt: '2026-10-23T10:00:00+00:00' })).toBe('remote');
  });

  it('compares instants, not strings: Postgres "+00:00" and the device "Z" for the same moment match', () => {
    expect(pickWorkoutPlan(plan('2026-10-23T10:00:00.000Z'), { plan: plan(), updatedAt: '2026-10-23T10:00:00+00:00' })).toBe('same');
    // Same moment in Pakistan time: a string compare would call this newer.
    expect(pickWorkoutPlan(plan('2026-10-23T10:00:00.000Z'), { plan: plan(), updatedAt: '2026-10-23T15:00:00+05:00' })).toBe('same');
  });

  it('falls back to the creation time for a plan saved before sync', () => {
    const old = plan();
    expect(planSavedAt(old)).toBe('2026-10-19T08:00:00.000Z');
    expect(pickWorkoutPlan(old, { plan: plan(), updatedAt: '2026-10-20T08:00:00+00:00' })).toBe('remote');
  });

  it('pushes a device-only plan up, restores a cloud-only one, and does nothing with neither', () => {
    expect(pickWorkoutPlan(plan(), null)).toBe('local');
    expect(pickWorkoutPlan(null, { plan: plan(), updatedAt: '2026-10-20T08:00:00+00:00' })).toBe('remote');
    expect(pickWorkoutPlan(null, null)).toBe('same');
  });
});

describe('mergeWorkoutLogs', () => {
  const CUTOFF = '2025-10-24';

  it('joins workouts from both sides, newest first, and pushes only what the cloud lacks', () => {
    const remote = [log('2026-10-20', 'mon', '2026-10-20T11:00:00.000Z')];
    const local = [log('2026-10-22', 'wed', '2026-10-22T11:00:00.000Z'), log('2026-10-20', 'mon', '2026-10-20T11:00:00.000Z')];
    const { logs, pushDates } = mergeWorkoutLogs(local, remote, CUTOFF);
    expect(logs.map((l) => l.dateKey)).toEqual(['2026-10-22', '2026-10-20']);
    expect(pushDates).toEqual(['2026-10-22']);
  });

  it('keeps the copy finished last when both sides have the same workout', () => {
    const remoteNewer = mergeWorkoutLogs(
      [log('2026-10-20', 'mon', '2026-10-20T11:00:00.000Z', 8)],
      [log('2026-10-20', 'mon', '2026-10-20T11:30:00.000Z', 12)],
      CUTOFF
    );
    expect(remoteNewer.logs).toHaveLength(1);
    expect(remoteNewer.logs[0].exercises[0].sets[0].reps).toBe(12);
    expect(remoteNewer.pushDates).toEqual([]);

    const localNewer = mergeWorkoutLogs(
      [log('2026-10-20', 'mon', '2026-10-20T11:30:00.000Z', 12)],
      [log('2026-10-20', 'mon', '2026-10-20T11:00:00.000Z', 8)],
      CUTOFF
    );
    expect(localNewer.logs[0].exercises[0].sets[0].reps).toBe(12);
    expect(localNewer.pushDates).toEqual(['2026-10-20']);
  });

  it('keeps two sessions done on one date apart (a missed Monday done on Wednesday)', () => {
    // Both are 'upper' workouts; only the planned day tells them apart.
    const remote = [log('2026-10-22', 'wed', '2026-10-22T11:00:00.000Z')];
    const local = [log('2026-10-22', 'mon', '2026-10-22T18:00:00.000Z'), ...remote];
    const { logs, pushDates } = mergeWorkoutLogs(local, remote, CUTOFF);
    expect(logs.map((l) => l.day).sort()).toEqual(['mon', 'wed']);
    expect(pushDates).toEqual(['2026-10-22']);
  });

  it('drops workouts older than the device keeps, from either side', () => {
    const { logs, pushDates } = mergeWorkoutLogs(
      [log('2025-10-01', 'mon', '2025-10-01T11:00:00.000Z')],
      [log('2025-09-01', 'mon', '2025-09-01T11:00:00.000Z'), log('2026-10-20', 'mon', '2026-10-20T11:00:00.000Z')],
      CUTOFF
    );
    expect(logs.map((l) => l.dateKey)).toEqual(['2026-10-20']);
    expect(pushDates).toEqual([]);
  });
});
