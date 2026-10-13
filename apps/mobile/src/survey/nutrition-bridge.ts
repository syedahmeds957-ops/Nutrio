import {
  BMRCalculationInput,
  calculateBMR,
  calculateTDEE,
  TDEECalculationInput,
  validateClinicalSafety,
} from '@nutrio/nutrition-core';
import {
  JobCategory,
  LifestyleSurveyPayload,
  TrainingType,
  WorkoutIntensity,
} from './types.js';

export const JOB_OCCUPATIONAL_FACTORS: Record<JobCategory, number> = {
  desk_sedentary: 1.2,
  standing_light: 1.35,
  active_walking: 1.5,
  heavy_manual_labor: 1.75,
};

export const KCAL_PER_CUP_CHAI_SUGAR = 65; // ~1.5 tsp sugar (30 kcal) + whole milk (35 kcal)

export function estimateWeeklyExerciseKcal(
  trainingType: TrainingType,
  frequencyDaysPerWeek: number,
  sessionDurationMins: number,
  intensity: WorkoutIntensity
): number {
  if (trainingType === 'none' || frequencyDaysPerWeek === 0) return 0;

  const kcalPerMin =
    {
      gym_resistance: 6.5,
      cardio_running: 10.0,
      sports_cricket_football: 8.0,
      home_calisthenics: 5.5,
      daily_brisk_walking: 4.0,
      none: 0,
    }[trainingType] ?? 5.0;

  const intensityMultiplier =
    intensity === 'light' ? 0.8 : intensity === 'high' ? 1.25 : 1.0;

  const kcalPerSession = sessionDurationMins * kcalPerMin * intensityMultiplier;
  return Math.round(kcalPerSession * frequencyDaysPerWeek);
}

export function bridgeSurveyToNutritionCore(survey: LifestyleSurveyPayload) {
  const { basics, occupational, exercise, lifestyleDesi, healthClinical } = survey;

  // 1. Calculate BMR
  const bmrInput: BMRCalculationInput = {
    weightKg: basics.weightKg,
    heightCm: basics.heightCm,
    ageYears: basics.ageYears,
    sex: basics.sex,
    bodyFatPct: basics.bodyFatPct,
  };
  const bmrResults = calculateBMR(bmrInput);

  // 2. Estimate exercise and occupational TDEE
  const occupationalFactor = JOB_OCCUPATIONAL_FACTORS[occupational.jobCategory] || 1.2;
  const weeklyExerciseKcal = estimateWeeklyExerciseKcal(
    exercise.trainingType,
    exercise.frequencyDaysPerWeek,
    exercise.sessionDurationMins,
    exercise.intensity
  );

  const tdeeInput: TDEECalculationInput = {
    bmr: bmrResults.selectedBMR,
    activityLevel: 'moderate',
    occupationalFactor,
    weeklyExerciseKcal,
  };
  const tdeeResults = calculateTDEE(tdeeInput);

  // 3. Clinical safety check
  const clinicalCheck = validateClinicalSafety(
    basics.weightKg,
    basics.heightCm,
    basics.ageYears,
    'lose', // default initial check for fat loss eligibility
    healthClinical.isPregnantOrBreastfeeding
  );

  // 4. Pakistani cultural lifestyle calculations
  const chaiCups = lifestyleDesi.chaiWithSugarCupsPerDay ?? 2;
  const dailyChaiKcal = chaiCups * KCAL_PER_CUP_CHAI_SUGAR;
  const weeklyChaiKcal = dailyChaiKcal * 7;
  const sittingHours = occupational.dailySittingHours ?? 8;

  return {
    bmrResults,
    tdeeResults,
    clinicalCheck,
    culturalMetrics: {
      dailyChaiKcal,
      weeklyChaiKcal,
      isHighChaiIntake: chaiCups >= 3,
      isNightShift: occupational.shiftPattern === 'night_shift',
      isSedentaryWorker: sittingHours >= 8,
    },
  };
};
