import {
  BMRCalculationInput,
  calculateBMR,
  calculateTDEE,
  estimateWeeklyExerciseKcal,
  TDEECalculationInput,
  validateClinicalSafety,
} from '@nutrio/nutrition-core';
import { JobCategory, LifestyleSurveyPayload } from './types.js';
import { ritualCupKcal } from '../common/ritualDrinks.js';

// Lives in nutrition-core now (Hard Rule 2); still offered here for survey callers.
export { estimateWeeklyExerciseKcal };

export const JOB_OCCUPATIONAL_FACTORS: Record<JobCategory, number> = {
  desk_sedentary: 1.2,
  standing_light: 1.35,
  active_walking: 1.5,
  heavy_manual_labor: 1.75,
};


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
  // The survey carries no region, so these stored figures are the Pakistani
  // cup; screens that know the region use `ritualCupsPerDay` instead.
  const dailyChaiKcal = chaiCups * ritualCupKcal('PK');
  const weeklyChaiKcal = dailyChaiKcal * 7;
  const sittingHours = occupational.dailySittingHours ?? 8;

  return {
    bmrResults,
    tdeeResults,
    clinicalCheck,
    culturalMetrics: {
      ritualCupsPerDay: chaiCups,
      dailyChaiKcal,
      weeklyChaiKcal,
      isHighChaiIntake: chaiCups >= 3,
      isNightShift: occupational.shiftPattern === 'night_shift',
      isSedentaryWorker: sittingHours >= 8,
    },
  };
};
