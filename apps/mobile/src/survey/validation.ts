import {
  StepValidationResult,
  SurveyBasics,
  SurveyExercise,
  SurveyHealthClinical,
  SurveyLifestyleDesi,
  SurveyOccupational,
  SurveyPreferencesBudget,
} from './types.js';

export function validateBasics(data: Partial<SurveyBasics>): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.sex) {
    errors.sex = 'Biological sex is required for metabolic BMR calculation.';
  }

  if (data.ageYears === undefined || data.ageYears < 12 || data.ageYears > 100) {
    errors.ageYears = 'Please enter a valid age between 12 and 100.';
  }

  if (data.heightCm === undefined || data.heightCm < 100 || data.heightCm > 250) {
    errors.heightCm = 'Please enter a valid height between 100 cm and 250 cm.';
  }

  if (data.weightKg === undefined || data.weightKg < 30 || data.weightKg > 300) {
    errors.weightKg = 'Please enter a valid weight between 30 kg and 300 kg.';
  }

  if (data.bodyFatPct !== undefined && (data.bodyFatPct < 3 || data.bodyFatPct > 65)) {
    errors.bodyFatPct = 'Body fat percentage must be between 3% and 65%.';
  }

  if (data.waistCm !== undefined && (data.waistCm < 40 || data.waistCm > 220)) {
    errors.waistCm = 'Waist circumference must be between 40 cm and 220 cm.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateOccupational(
  data: Partial<SurveyOccupational>
): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.jobCategory) {
    errors.jobCategory = 'Please select your primary job / daily work activity.';
  }

  const workingHours = data.workingHoursPerDay ?? 8;
  if (workingHours < 0 || workingHours > 24) {
    errors.workingHoursPerDay = 'Working hours must be between 0 and 24.';
  }

  const sittingHours = data.dailySittingHours ?? 8;
  if (sittingHours < 0 || sittingHours > 24) {
    errors.dailySittingHours = 'Sitting hours must be between 0 and 24.';
  }

  if (!data.shiftPattern) {
    errors.shiftPattern = 'Please select your typical work shift pattern.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateExercise(
  data: Partial<SurveyExercise>
): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.trainingType) {
    errors.trainingType = 'Please select your exercise or workout type.';
  }

  if (data.trainingType === 'none') {
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  if (
    data.frequencyDaysPerWeek === undefined ||
    data.frequencyDaysPerWeek < 0 ||
    data.frequencyDaysPerWeek > 7
  ) {
    errors.frequencyDaysPerWeek = 'Workout frequency must be between 0 and 7 days per week.';
  }

  if (
    data.sessionDurationMins === undefined ||
    data.sessionDurationMins < 0 ||
    data.sessionDurationMins > 360
  ) {
    errors.sessionDurationMins = 'Session duration must be between 0 and 360 minutes.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLifestyleDesi(
  data: Partial<SurveyLifestyleDesi>
): StepValidationResult {
  const errors: Record<string, string> = {};

  const sleepHours = data.sleepHoursPerNight ?? 7;
  if (sleepHours < 2 || sleepHours > 16) {
    errors.sleepHoursPerNight = 'Please enter typical sleep duration between 2 and 16 hours.';
  }

  const stressRating = data.stressRating ?? 3;
  if (stressRating < 1 || stressRating > 5) {
    errors.stressRating = 'Stress rating must be between 1 (low) and 5 (extreme).';
  }

  const chaiCups = data.chaiWithSugarCupsPerDay ?? 2;
  if (chaiCups < 0 || chaiCups > 25) {
    errors.chaiWithSugarCupsPerDay = 'Please specify daily sweetened tea/chai cups (0 or more).';
  }

  const waterLitres = data.dailyWaterLitres ?? 2.5;
  if (waterLitres < 0.5 || waterLitres > 15) {
    errors.dailyWaterLitres = 'Daily water intake must be between 0.5 and 15 litres.';
  }

  if (!data.whoCooksAtHome) {
    errors.whoCooksAtHome = 'Please select how meals are typically prepared at home.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateHealthClinical(
  data: Partial<SurveyHealthClinical>
): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.medicalDisclaimerAccepted) {
    errors.medicalDisclaimerAccepted =
      'You must acknowledge the clinical disclaimer to proceed.';
  }

  // isPregnantOrBreastfeeding defaults to false if unselected
  const isPregnant = data.isPregnantOrBreastfeeding ?? false;
  if (typeof isPregnant !== 'boolean') {
    errors.isPregnantOrBreastfeeding =
      'Please indicate pregnancy or active lactation status for nutritional safety.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePreferencesBudget(
  data: Partial<SurveyPreferencesBudget>
): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.dietPreference) {
    errors.dietPreference = 'Please select your preferred dietary pattern.';
  }

  if (!data.budgetTierPKR) {
    errors.budgetTierPKR = 'Please select a weekly grocery budget tier.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
