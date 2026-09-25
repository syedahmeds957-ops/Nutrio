import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerUser,
  authenticateUser,
  clearAuthSession,
  markSurveyCompleted,
  hasCompletedSurveyLocally,
  getAuthSession,
  flushDurableWrites,
} from '../authStorage.js';
import {
  savePersistedPlan,
  hydratePersistedPlan,
  releaseLocalUserCache,
  clearDailyActivities,
} from '../../tracker/activityStorage.js';
import { ComputedUserPlan } from '../../plan/types.js';

const mockPlan = {
  userContext: { weightKg: 82, heightCm: 178, ageYears: 31, sex: 'male', bmr: 1780, tdee: 2450 },
  goalSelection: { goal: 'lose', targetRateKgPerWeek: 0.5 },
  targetResult: { kcalTarget: 1950, deficitKcal: 500, isSafe: true },
  macros: { proteinGrams: 160, fatGrams: 65, carbGrams: 180, waterMl: 3000 },
  projection: { currentWeightKg: 82, targetWeightKg: 76, weeklyRateKg: 0.5, isRealistic: true },
} as unknown as ComputedUserPlan;

describe('Onboarding survives a logout/login cycle', () => {
  beforeEach(async () => {
    await clearDailyActivities();
    await clearAuthSession();
  });

  it('does not ask a returning user to redo the survey', async () => {
    const credentials = { name: 'Asad', email: 'returning@nutrio.app', password: 'secret123' };

    const registration = await registerUser(credentials);
    expect(registration.session?.user.surveyCompleted).toBe(false);

    await markSurveyCompleted();
    expect(getAuthSession()?.user.surveyCompleted).toBe(true);

    // Logout: memory caches go, durable per-user records stay.
    releaseLocalUserCache();
    await clearAuthSession();
    await flushDurableWrites();
    expect(getAuthSession()).toBeNull();

    const relogin = await authenticateUser({
      email: credentials.email,
      password: credentials.password,
    });
    expect(relogin.user.surveyCompleted).toBe(true);
  });

  it('records completion locally so a failed remote write cannot lose it', async () => {
    await registerUser({ name: 'Sara', email: 'sara@nutrio.app', password: 'secret123' });
    const userId = getAuthSession()!.user.id;

    await markSurveyCompleted();

    expect(hasCompletedSurveyLocally({ id: userId })).toBe(true);
    expect(hasCompletedSurveyLocally({ email: 'SARA@nutrio.app' })).toBe(true);
    expect(hasCompletedSurveyLocally({ email: 'someone-else@nutrio.app' })).toBe(false);
  });

  it('keeps the computed plan on the device after logout', async () => {
    await registerUser({ name: 'Bilal', email: 'bilal@nutrio.app', password: 'secret123' });
    savePersistedPlan(mockPlan);

    releaseLocalUserCache();
    await clearAuthSession();

    await authenticateUser({ email: 'bilal@nutrio.app', password: 'secret123' });
    const restored = await hydratePersistedPlan();
    expect(restored?.targetResult.kcalTarget).toBe(1950);
  });

  it('does not hand one account the other account plan', async () => {
    await registerUser({ name: 'First', email: 'first@nutrio.app', password: 'secret123' });
    savePersistedPlan(mockPlan);

    releaseLocalUserCache();
    await clearAuthSession();

    await registerUser({ name: 'Second', email: 'second@nutrio.app', password: 'secret123' });
    expect(await hydratePersistedPlan()).toBeNull();
  });
});
