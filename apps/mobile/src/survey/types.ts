import { BiologicalSex } from '@nutrio/nutrition-core';

export type SurveyStepId =
  | 'basics'
  | 'occupational'
  | 'exercise'
  | 'lifestyle_desi'
  | 'health_clinical'
  | 'preferences_budget';

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

export interface SurveyOccupational {
  jobCategory: JobCategory;
  workingHoursPerDay: number;
  shiftPattern: ShiftPattern;
  dailySittingHours: number;
  commuteType: 'bike_motorbike' | 'car_cab' | 'public_transport' | 'walking' | 'work_from_home';
}

export type TrainingType =
  | 'none'
  | 'gym_resistance'
  | 'cardio_running'
  | 'home_calisthenics'
  | 'sports_cricket_football'
  | 'daily_brisk_walking';

export type WorkoutIntensity = 'light' | 'moderate' | 'high';

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

export interface SurveyLifestyleDesi {
  sleepHoursPerNight: number;
  stressRating: 1 | 2 | 3 | 4 | 5;
  chaiWithSugarCupsPerDay: number; // Critical 300-600 kcal/day lever in Pakistan
  eatingOutTimesPerWeek: number;
  whoCooksAtHome: HomeCookingStyle;
  dailyWaterLitres: number;
  lateNightEating: boolean;
  smoker: boolean;
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

export type BudgetTierPKR =
  | 'budget_under_3500' // < 3500 PKR/week
  | 'standard_3500_7000' // 3500-7000 PKR/week
  | 'premium_above_7000'; // > 7000 PKR/week

export interface SurveyPreferencesBudget {
  dietPreference: DietPreference;
  dislikedFoods: string[];
  budgetTierPKR: BudgetTierPKR;
}

export interface LifestyleSurveyPayload {
  version: number;
  completedAt?: string;
  basics: SurveyBasics;
  occupational: SurveyOccupational;
  exercise: SurveyExercise;
  lifestyleDesi: SurveyLifestyleDesi;
  healthClinical: SurveyHealthClinical;
  preferencesBudget: SurveyPreferencesBudget;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
