import {
  BiologicalSex,
  CalorieTargetResult,
  GoalType,
  MacroSplitResult,
} from '@nutrio/nutrition-core';

export interface AssessmentNarrative {
  summary: string;
  whyThisNumber: string;
  highestLeverageChanges: string[];
  culturalLifestyleInsight: string;
  weekByWeekExpectation: string;
}

export interface PlanUserContext {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
  bmr: number;
  tdee: number;
  bodyFatPct?: number;
  isPregnantOrBreastfeeding?: boolean;
  medicalConditions?: string[];
  chaiSugarKcalPerDay: number;
  weeklyChaiSugarKcal: number;
  /**
   * Cups of the daily ritual (chai, or gahwa with dates) from the survey, so a
   * screen can price them for its region. Absent on plans saved before it.
   */
  ritualCupsPerDay?: number;
  isNightShift: boolean;
  dailySittingHours: number;
}

export interface GoalSelectionState {
  goal: GoalType;
  targetRateKgPerWeek: number;
  targetWeightKg?: number;
}

export interface PlanProjection {
  currentWeightKg: number;
  targetWeightKg?: number;
  totalKgToChange?: number;
  weeklyRateKg: number;
  estimatedWeeks?: number;
  projectedDate?: string;
  isRealistic: boolean;
  pacingAdvice: string;
  /** Selects the translated advice; absent on plans saved before it existed. */
  pacingAdviceKey?: 'maintain' | 'aggressive' | 'optimal' | 'gentle' | 'rapidGain' | 'leanGain';
}

export interface ComputedUserPlan {
  region?: 'PK' | 'SA';
  userContext: PlanUserContext;
  goalSelection: GoalSelectionState;
  targetResult: CalorieTargetResult;
  macros: MacroSplitResult;
  projection: PlanProjection;
  narrative?: AssessmentNarrative;
  /**
   * Day key of the last accepted weekly recalibration. Logs up to this day were
   * already used to set `userContext.tdee`; the next check-in reads only later
   * days, so the same evidence is never applied twice.
   */
  recalibratedAt?: string;
  /**
   * The formula TDEE from onboarding, kept once a recalibration has replaced
   * `userContext.tdee`, so history can tell the estimate from the measurement.
   */
  formulaTdee?: number;
}
