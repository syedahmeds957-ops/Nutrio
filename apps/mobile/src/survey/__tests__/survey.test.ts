import { describe, expect, it } from 'vitest';
import {
  bridgeSurveyToNutritionCore,
  estimateWeeklyExerciseKcal,
  LifestyleSurveyPayload,
  SurveyStateEngine,
  validateBasics,
  validateHealthClinical,
  validateLifestyleDesi,
} from '../index.js';

describe('Survey Validation & Step Logic', () => {
  it('validates basics correctly and rejects invalid inputs', () => {
    const invalid = validateBasics({ ageYears: 8, heightCm: 80, weightKg: 20 });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.sex).toBeDefined();
    expect(invalid.errors.ageYears).toBeDefined();
    expect(invalid.errors.heightCm).toBeDefined();
    expect(invalid.errors.weightKg).toBeDefined();

    const valid = validateBasics({
      sex: 'male',
      ageYears: 28,
      heightCm: 175,
      weightKg: 78,
    });
    expect(valid.isValid).toBe(true);
    expect(Object.keys(valid.errors)).toHaveLength(0);
  });

  it('enforces mandatory medical disclaimer in clinical step', () => {
    const withoutDisclaimer = validateHealthClinical({
      medicalConditions: ['diabetes_type_2'],
      isPregnantOrBreastfeeding: false,
      medicalDisclaimerAccepted: false,
    });
    expect(withoutDisclaimer.isValid).toBe(false);
    expect(withoutDisclaimer.errors.medicalDisclaimerAccepted).toBeDefined();

    const withDisclaimer = validateHealthClinical({
      medicalConditions: ['diabetes_type_2'],
      isPregnantOrBreastfeeding: false,
      medicalDisclaimerAccepted: true,
    });
    expect(withDisclaimer.isValid).toBe(true);
  });

  it('validates Pakistani lifestyle inputs including chai with sugar', () => {
    const invalidChai = validateLifestyleDesi({
      sleepHoursPerNight: 7,
      stressRating: 3,
      chaiWithSugarCupsPerDay: -1,
      dailyWaterLitres: 2.5,
      whoCooksAtHome: 'family_traditional',
    });
    expect(invalidChai.isValid).toBe(false);

    const valid = validateLifestyleDesi({
      sleepHoursPerNight: 7,
      stressRating: 3,
      chaiWithSugarCupsPerDay: 4, // 4 cups a day
      dailyWaterLitres: 2.5,
      whoCooksAtHome: 'family_traditional',
    });
    expect(valid.isValid).toBe(true);
  });
});

describe('SurveyStateEngine Navigation & Persistence', () => {
  it('prevents advancing if the current step has errors', () => {
    const engine = new SurveyStateEngine();
    expect(engine.getCurrentStep()).toBe('basics');

    // Attempt to advance without filling basics
    const advanced = engine.nextStep();
    expect(advanced).toBe(false);
    expect(engine.getCurrentStep()).toBe('basics');
    expect(Object.keys(engine.getErrors()).length).toBeGreaterThan(0);
  });

  it('advances through steps and serializes a complete survey', () => {
    const engine = new SurveyStateEngine();

    // Step 1: Basics
    engine.setBasics({
      sex: 'male',
      ageYears: 29,
      heightCm: 178,
      weightKg: 82,
    });
    expect(engine.nextStep()).toBe(true);
    expect(engine.getCurrentStep()).toBe('occupational');

    // Step 2: Occupational
    engine.setOccupational({
      jobCategory: 'desk_sedentary',
      workingHoursPerDay: 8,
      shiftPattern: 'regular_day',
      dailySittingHours: 9,
      commuteType: 'bike_motorbike',
    });
    expect(engine.nextStep()).toBe(true);
    expect(engine.getCurrentStep()).toBe('exercise');

    // Step 3: Exercise
    engine.setExercise({
      trainingType: 'gym_resistance',
      frequencyDaysPerWeek: 4,
      sessionDurationMins: 50,
      intensity: 'moderate',
    });
    expect(engine.nextStep()).toBe(true);
    expect(engine.getCurrentStep()).toBe('lifestyle_desi');

    // Step 4: Lifestyle Desi
    engine.setLifestyleDesi({
      sleepHoursPerNight: 6.5,
      stressRating: 3,
      chaiWithSugarCupsPerDay: 3,
      eatingOutTimesPerWeek: 2,
      whoCooksAtHome: 'family_traditional',
      dailyWaterLitres: 2.0,
      lateNightEating: true,
      smoker: false,
    });
    expect(engine.nextStep()).toBe(true);
    expect(engine.getCurrentStep()).toBe('health_clinical');

    // Step 5: Health & Clinical
    engine.setHealthClinical({
      medicalConditions: ['none'],
      isPregnantOrBreastfeeding: false,
      medicalDisclaimerAccepted: true,
    });
    expect(engine.nextStep()).toBe(true);
    expect(engine.getCurrentStep()).toBe('preferences_budget');

    // Step 6: Preferences & Budget
    engine.setPreferencesBudget({
      dietPreference: 'halal_omnivore',
      dislikedFoods: ['karela'],
      budgetTierPKR: 'standard_3500_7000',
    });

    expect(engine.isComplete()).toBe(true);
    const payload = engine.serializePayload();
    expect(payload.version).toBe(1);
    expect(payload.basics.weightKg).toBe(82);
    expect(payload.lifestyleDesi.chaiWithSugarCupsPerDay).toBe(3);
  });
});

describe('Nutrition Bridge Calculation', () => {
  const sampleSurvey: LifestyleSurveyPayload = {
    version: 1,
    basics: {
      sex: 'male',
      ageYears: 30,
      heightCm: 180,
      weightKg: 80,
    },
    occupational: {
      jobCategory: 'desk_sedentary',
      workingHoursPerDay: 9,
      shiftPattern: 'regular_day',
      dailySittingHours: 9,
      commuteType: 'car_cab',
    },
    exercise: {
      trainingType: 'gym_resistance',
      frequencyDaysPerWeek: 4,
      sessionDurationMins: 60,
      intensity: 'moderate',
    },
    lifestyleDesi: {
      sleepHoursPerNight: 6,
      stressRating: 4,
      chaiWithSugarCupsPerDay: 4, // 4 cups * 65 kcal = 260 kcal/day
      eatingOutTimesPerWeek: 3,
      whoCooksAtHome: 'family_traditional',
      dailyWaterLitres: 2.0,
      lateNightEating: true,
      smoker: false,
    },
    healthClinical: {
      medicalConditions: ['hypertension'],
      isPregnantOrBreastfeeding: false,
      medicalDisclaimerAccepted: true,
    },
    preferencesBudget: {
      dietPreference: 'halal_omnivore',
      dislikedFoods: [],
      budgetTierPKR: 'standard_3500_7000',
    },
  };

  it('calculates weekly exercise calories accurately', () => {
    // Gym resistance, 4 days, 60 mins, moderate: 60 * 6.5 * 1.0 = 390 kcal/session * 4 = 1560 kcal/week
    const weeklyKcal = estimateWeeklyExerciseKcal(
      'gym_resistance',
      4,
      60,
      'moderate'
    );
    expect(weeklyKcal).toBe(1560);
  });

  it('bridges survey into deterministic BMR, TDEE, and Pakistani lifestyle levers', () => {
    const bridged = bridgeSurveyToNutritionCore(sampleSurvey);

    // BMR check (80kg, 180cm, 30yo male = 1780 kcal)
    expect(bridged.bmrResults.selectedBMR).toBe(1780);

    // TDEE: Occupational desk (1.2) * 1780 + (1560 / 7 = 222.8) = 2136 + 223 = 2359 kcal
    expect(bridged.tdeeResults.tdee).toBe(2359);
    expect(bridged.tdeeResults.method).toBe('occupational_split');

    // Cultural Metrics:
    // 4 cups chai with sugar = 260 kcal/day = 1820 kcal/week
    expect(bridged.culturalMetrics.dailyChaiKcal).toBe(260);
    expect(bridged.culturalMetrics.weeklyChaiKcal).toBe(1820);
    expect(bridged.culturalMetrics.isHighChaiIntake).toBe(true);
    expect(bridged.culturalMetrics.isSedentaryWorker).toBe(true);
  });
});
