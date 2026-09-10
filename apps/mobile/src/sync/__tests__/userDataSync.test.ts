import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveCurrentProfileId,
  syncLifestyleSurvey,
  syncBodyMetrics,
  syncNutritionTargets,
  syncCompleteOnboarding,
} from '../userDataSync.js';
import { saveAuthSession, clearAuthSession } from '../../auth/authStorage.js';
import { LifestyleSurveyPayload } from '../../survey/types.js';
import { ComputedUserPlan } from '../../plan/types.js';

const MOCK_SURVEY: LifestyleSurveyPayload = {
  version: 1,
  basics: {
    sex: 'male',
    ageYears: 28,
    heightCm: 175,
    weightKg: 78,
    waistCm: 88,
  },
  occupational: {
    jobCategory: 'desk_sedentary',
    workingHoursPerDay: 8,
    shiftPattern: 'regular_day',
    dailySittingHours: 7,
    commuteType: 'car_cab',
  },
  exercise: {
    trainingType: 'gym_resistance',
    frequencyDaysPerWeek: 4,
    sessionDurationMins: 60,
    intensity: 'moderate',
  },
  lifestyleDesi: {
    sleepHoursPerNight: 7,
    stressRating: 3,
    chaiWithSugarCupsPerDay: 2,
    eatingOutTimesPerWeek: 2,
    whoCooksAtHome: 'family_traditional',
    dailyWaterLitres: 2.5,
    lateNightEating: false,
    smoker: false,
  },
  healthClinical: {
    medicalConditions: [],
    isPregnantOrBreastfeeding: false,
    medicalDisclaimerAccepted: true,
  },
  preferencesBudget: {
    dietPreference: 'halal_omnivore',
    dislikedFoods: [],
    budgetTierPKR: 'standard_3500_7000',
  },
};

const MOCK_PLAN: ComputedUserPlan = {
  userContext: {
    weightKg: 78,
    heightCm: 175,
    ageYears: 28,
    sex: 'male',
    bmr: 1720,
    tdee: 2360,
    chaiSugarKcalPerDay: 180,
    weeklyChaiSugarKcal: 1260,
    isNightShift: false,
    dailySittingHours: 7,
  },
  goalSelection: {
    goal: 'lose',
    targetRateKgPerWeek: 0.5,
    targetWeightKg: 72,
  },
  targetResult: {
    kcalTarget: 1850,
    deficitKcal: 510,
    isSafe: true,
  } as any,
  macros: {
    proteinGrams: 140,
    fatGrams: 55,
    carbGrams: 195,
    fiberGrams: 28,
    waterMl: 2500,
  } as any,
  projection: {
    currentWeightKg: 78,
    targetWeightKg: 72,
    weeklyRateKg: 0.5,
    isRealistic: true,
    pacingAdvice: 'Sustainable deficit',
  },
};

describe('UserDataSync Service', () => {
  beforeEach(async () => {
    await clearAuthSession();
  });

  it('returns null profile id when user is not logged in', async () => {
    const profileId = await resolveCurrentProfileId();
    expect(profileId).toBeNull();
  });

  it('resolves profile id when user has an active session', async () => {
    saveAuthSession({
      token: 'jwt_123',
      user: {
        id: 'user_456',
        name: 'Talha',
        email: 'talha@nutrio.app',
        isRegistered: true,
        surveyCompleted: false,
      },
      createdAt: new Date().toISOString(),
    });

    const profileId = await resolveCurrentProfileId();
    expect(profileId).toBeDefined();
    expect(profileId).toContain('user_456');
  });

  it('returns failure when attempting sync without active session', async () => {
    const result = await syncCompleteOnboarding(MOCK_SURVEY, MOCK_PLAN);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not authenticated');
  });

  it('successfully executes complete onboarding sync with active session', async () => {
    saveAuthSession({
      token: 'jwt_123',
      user: {
        id: 'user_789',
        name: 'Usman',
        email: 'usman@nutrio.app',
        isRegistered: true,
        surveyCompleted: false,
      },
      createdAt: new Date().toISOString(),
    });

    const result = await syncCompleteOnboarding(MOCK_SURVEY, MOCK_PLAN);
    expect(result.success).toBe(true);
    expect(result.profileId).toBeDefined();
  });
});
