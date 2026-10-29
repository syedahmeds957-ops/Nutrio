import { BiologicalSex, type TrainingType, type WorkoutIntensity } from '@nutrio/nutrition-core';

// Work and training share the `exercise` screen; diet and chai share
// `preferences`. The payload below keeps its six sections.
export type SurveyStepId = 'basics' | 'exercise' | 'health_clinical' | 'preferences';

export interface SurveyBasics {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  waistCm?: number;
}

export type JobCategory =
  | 'desk_sedentary'
  | 'standing_light'
  | 'active_walking'
  | 'heavy_manual_labor';

export type ShiftPattern = 'regular_day' | 'night_shift' | 'rotating_shifts';

// Only the job category and sitting hours are asked and used. The rest are
// kept optional for payloads saved before the survey was shortened.
export interface SurveyOccupational {
  jobCategory: JobCategory;
  workingHoursPerDay?: number;
  shiftPattern?: ShiftPattern;
  dailySittingHours: number;
  commuteType?: 'bike_motorbike' | 'car_cab' | 'public_transport' | 'walking' | 'work_from_home';
}

// The survey's training answers are nutrition-core's exercise types.
export type { TrainingType, WorkoutIntensity };

export interface SurveyExercise {
  trainingType: TrainingType;
  frequencyDaysPerWeek: number; // 0 to 7
  sessionDurationMins: number;
  intensity: WorkoutIntensity;
}

export type HomeCookingStyle =
  | 'self'
  | 'family_traditional'
  | 'cook_maid'
  | 'hostel_mess'
  | 'daily_takeaway';

// Only the chai cups are asked and used. The rest are kept optional for
// payloads saved before the survey was shortened.
export interface SurveyLifestyleDesi {
  sleepHoursPerNight?: number;
  stressRating?: 1 | 2 | 3 | 4 | 5;
  chaiWithSugarCupsPerDay: number; // Critical 300-600 kcal/day lever in Pakistan
  eatingOutTimesPerWeek?: number;
  whoCooksAtHome?: HomeCookingStyle;
  dailyWaterLitres?: number;
  lateNightEating?: boolean;
  smoker?: boolean;
}

export type MedicalConditionFlag =
  | 'diabetes_type_2'
  | 'diabetes_type_1'
  | 'hypertension'
  | 'ckd_renal'
  | 'thyroid_hypo'
  | 'thyroid_hyper'
  | 'pcos'
  | 'none';

export interface SurveyHealthClinical {
  medicalConditions: MedicalConditionFlag[];
  medicationsNotes?: string;
  isPregnantOrBreastfeeding: boolean;
  medicalDisclaimerAccepted: boolean;
}

export type DietPreference =
  | 'halal_omnivore'
  | 'halal_meat_moderate'
  | 'vegetarian_desi'
  | 'vegan'
  | 'eggetarian';

export interface SurveyPreferences {
  dietPreference: DietPreference;
  dislikedFoods: string[];
}

export interface LifestyleSurveyPayload {
  version: number;
  completedAt?: string;
  basics: SurveyBasics;
  occupational: SurveyOccupational;
  exercise: SurveyExercise;
  lifestyleDesi: SurveyLifestyleDesi;
  healthClinical: SurveyHealthClinical;
  /**
   * Named from when this step also asked for a weekly budget. The key stays
   * because it is the shape already stored on devices and in the cloud.
   */
  preferencesBudget: SurveyPreferences;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
