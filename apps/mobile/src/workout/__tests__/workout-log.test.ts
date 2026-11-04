import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutLog } from '@nutrio/workout-core';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import type { AuthSession } from '../../auth/types.js';
import {
  flushWorkoutLogWrites,
  hydrateWorkoutLogs,
  loadWorkoutLogs,
  releaseWorkoutLogCache,
  saveWorkoutLog,
} from '../workoutLogStorage.js';

function sessionFor(id: string): AuthSession {
  return {
    token: `tok_${id}`,
    user: { id, name: id, email: `${id}@nutrio.app`, isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  };
}

function log(dateKey: string, day: WorkoutLog['day'] = 'mon', reps = 10): WorkoutLog {
  return {
    dateKey,
    day,
    template: 'full_a',
    exercises: [{ slotId: 'full_a:squat:0', exerciseId: 'barbell-squat', sets: [{ reps, loadKg: 60, done: true }] }],
    rating: 'right',
    startedAt: `${dateKey}T10:00:00.000Z`,
    finishedAt: `${dateKey}T11:00:00.000Z`,
  };
}

const TODAY = '2026-10-22';

describe('workout log storage', () => {
  beforeEach(async () => {
    releaseWorkoutLogCache();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('keeps logs newest first', () => {
    saveAuthSession(sessionFor('log_order'));
    saveWorkoutLog(log('2026-10-19'), TODAY);
    saveWorkoutLog(log('2026-10-21', 'wed'), TODAY);
    saveWorkoutLog(log('2026-10-20', 'tue'), TODAY);
    expect(loadWorkoutLogs().map((l) => l.dateKey)).toEqual(['2026-10-21', '2026-10-20', '2026-10-19']);
  });

  it('replaces the same session saved again on the same date', () => {
    saveAuthSession(sessionFor('log_replace'));
    saveWorkoutLog(log(TODAY, 'thu', 8), TODAY);
    saveWorkoutLog(log(TODAY, 'thu', 12), TODAY);
    expect(loadWorkoutLogs()).toHaveLength(1);
    expect(loadWorkoutLogs()[0].exercises[0].sets[0].reps).toBe(12);
  });

  it('keeps two sessions done on one date (a missed day made up today)', () => {
    saveAuthSession(sessionFor('log_two'));
    saveWorkoutLog(log(TODAY, 'thu'), TODAY);
    saveWorkoutLog(log(TODAY, 'tue'), TODAY);
    expect(loadWorkoutLogs()).toHaveLength(2);
  });

  it('drops logs older than a year', () => {
    saveAuthSession(sessionFor('log_prune'));
    saveWorkoutLog(log('2025-10-01'), '2025-10-01');
    saveWorkoutLog(log('2025-10-30'), '2025-10-30');
    saveWorkoutLog(log(TODAY, 'thu'), TODAY);
    expect(loadWorkoutLogs().map((l) => l.dateKey)).toEqual([TODAY, '2025-10-30']);
  });

  it('survives a cold start by rehydrating from durable storage', async () => {
    saveAuthSession(sessionFor('log_cold'));
    saveWorkoutLog(log('2026-10-19'), TODAY);
    saveWorkoutLog(log('2026-10-21', 'wed'), TODAY);
    await flushWorkoutLogWrites();

    releaseWorkoutLogCache();
    await hydrateWorkoutLogs();
    expect(loadWorkoutLogs().map((l) => l.dateKey)).toEqual(['2026-10-21', '2026-10-19']);
  });

  it('keeps each account’s logs separate and drops them from memory on logout', async () => {
    saveAuthSession(sessionFor('log_a'));
    saveWorkoutLog(log('2026-10-19'), TODAY);
    await flushWorkoutLogWrites();

    saveAuthSession(sessionFor('log_b'));
    expect(loadWorkoutLogs()).toEqual([]);

    releaseWorkoutLogCache();
    saveAuthSession(sessionFor('log_a'));
    await hydrateWorkoutLogs();
    expect(loadWorkoutLogs()).toHaveLength(1);
  });

  it('ignores a corrupted stored value', async () => {
    saveAuthSession(sessionFor('log_bad'));
    await AsyncStorage.setItem('nutrio_workout_logs_log_bad', '{not json');
    await hydrateWorkoutLogs();
    expect(loadWorkoutLogs()).toEqual([]);
  });
});
