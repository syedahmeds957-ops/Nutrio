import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import type { AuthSession } from '../../auth/types.js';
import {
  clearWorkoutPlan,
  flushWorkoutWrites,
  hydrateWorkoutPlan,
  loadWorkoutPlan,
  releaseWorkoutCache,
  saveWorkoutPlan,
} from '../workoutStorage.js';

function sessionFor(id: string): AuthSession {
  return {
    token: `tok_${id}`,
    user: { id, name: id, email: `${id}@nutrio.app`, isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  };
}

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

const makePlan = (seed: number) => generateWeeklyPlan(SETTINGS, { seed, today: '2026-10-19' });

describe('workout plan storage', () => {
  beforeEach(async () => {
    releaseWorkoutCache();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('reads back the plan it saved', () => {
    saveAuthSession(sessionFor('user_save'));
    const plan = makePlan(1);
    saveWorkoutPlan(plan);
    expect(loadWorkoutPlan()).toEqual(plan);
  });

  it('survives a cold start by rehydrating from durable storage', async () => {
    saveAuthSession(sessionFor('user_cold'));
    const plan = makePlan(2);
    saveWorkoutPlan(plan);
    await flushWorkoutWrites();

    releaseWorkoutCache();
    await hydrateWorkoutPlan();
    expect(loadWorkoutPlan()).toEqual(plan);
  });

  it('keeps each account’s plan separate on a shared device', async () => {
    saveAuthSession(sessionFor('user_a'));
    const planA = makePlan(3);
    saveWorkoutPlan(planA);

    saveAuthSession(sessionFor('user_b'));
    expect(loadWorkoutPlan()).toBeNull();
    const planB = makePlan(4);
    saveWorkoutPlan(planB);

    saveAuthSession(sessionFor('user_a'));
    expect(loadWorkoutPlan()?.seed).toBe(3);
    saveAuthSession(sessionFor('user_b'));
    expect(loadWorkoutPlan()?.seed).toBe(4);
  });

  it('keeps a guest plan apart from signed-in plans', async () => {
    await clearAuthSession();
    saveWorkoutPlan(makePlan(5));
    saveAuthSession(sessionFor('user_after_guest'));
    expect(loadWorkoutPlan()).toBeNull();
  });

  it('drops the cached copy on logout but keeps the durable one for the next sign-in', async () => {
    saveAuthSession(sessionFor('user_logout'));
    saveWorkoutPlan(makePlan(6));
    await flushWorkoutWrites();

    releaseWorkoutCache();
    await hydrateWorkoutPlan();
    expect(loadWorkoutPlan()?.seed).toBe(6);
  });

  it('treats a corrupt or foreign stored value as no plan', async () => {
    saveAuthSession(sessionFor('user_corrupt'));
    await AsyncStorage.setItem('nutrio_workout_plan_user_corrupt', '{not json');
    await hydrateWorkoutPlan();
    expect(loadWorkoutPlan()).toBeNull();

    releaseWorkoutCache();
    await AsyncStorage.setItem('nutrio_workout_plan_user_corrupt', JSON.stringify({ version: 99, sessions: [] }));
    await hydrateWorkoutPlan();
    expect(loadWorkoutPlan()).toBeNull();
  });

  it('forgets the plan when cleared', async () => {
    saveAuthSession(sessionFor('user_clear'));
    saveWorkoutPlan(makePlan(7));
    clearWorkoutPlan();
    await flushWorkoutWrites();
    expect(loadWorkoutPlan()).toBeNull();
    releaseWorkoutCache();
    await hydrateWorkoutPlan();
    expect(loadWorkoutPlan()).toBeNull();
  });
});
