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
}

export interface ComputedUserPlan {
  userContext: PlanUserContext;
  goalSelection: GoalSelectionState;
  targetResult: CalorieTargetResult;
  macros: MacroSplitResult;
  projection: PlanProjection;
  narrative?: AssessmentNarrative;
}
