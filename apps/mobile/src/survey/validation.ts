import {
  StepValidationResult,
  SurveyBasics,
  SurveyExercise,
  SurveyHealthClinical,
  SurveyLifestyleDesi,
  SurveyOccupational,
  SurveyPreferences,
} from './types.js';

export function validateBasics(data: Partial<SurveyBasics>): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.sex) {
    errors.sex = 'Biological sex is needed to estimate your calories.';
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

  const sittingHours = data.dailySittingHours ?? 8;
  if (sittingHours < 0 || sittingHours > 24) {
    errors.dailySittingHours = 'Sitting hours must be between 0 and 24.';
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
    errors.frequencyDaysPerWeek = 'Choose how many days a week you train (0 to 7).';
  }

  if (
    data.sessionDurationMins === undefined ||
    data.sessionDurationMins < 0 ||
    data.sessionDurationMins > 360
  ) {
    errors.sessionDurationMins = 'Enter how long a session lasts, in minutes (0 to 360).';
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

  const chaiCups = data.chaiWithSugarCupsPerDay ?? 2;
  if (chaiCups < 0 || chaiCups > 25) {
    errors.chaiWithSugarCupsPerDay = 'Please specify daily sweetened tea/chai cups (0 or more).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateHealthClinical(
  data: Partial<SurveyHealthClinical>,
  sex?: SurveyBasics['sex']
): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.medicalDisclaimerAccepted) {
    errors.medicalDisclaimerAccepted =
      'You must acknowledge the clinical disclaimer to proceed.';
  }

  // Men are never asked and are recorded as "no"; women must answer.
  if (sex === 'female' && typeof data.isPregnantOrBreastfeeding !== 'boolean') {
    errors.isPregnantOrBreastfeeding =
      'Please indicate pregnancy or active lactation status for nutritional safety.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePreferences(
  data: Partial<SurveyPreferences>
): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!data.dietPreference) {
    errors.dietPreference = 'Please select your preferred dietary pattern.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
