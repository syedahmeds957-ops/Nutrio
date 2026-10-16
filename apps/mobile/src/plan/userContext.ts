import { bridgeSurveyToNutritionCore } from '../survey/nutrition-bridge.js';
import type { LifestyleSurveyPayload } from '../survey/types.js';
import type { PlanUserContext } from './types.js';

/**
 * The plan inputs a survey describes: body, metabolism (BMR, TDEE from
 * nutrition-core), and the lifestyle figures the plan screens show.
 *
 * Shared by the plan wizard and the sign-in restore, so a plan rebuilt from a
 * saved goal uses exactly the inputs the wizard used when it was accepted.
 */
export function planUserContextFromSurvey(
  payload: LifestyleSurveyPayload,
  bridged: ReturnType<typeof bridgeSurveyToNutritionCore> = bridgeSurveyToNutritionCore(payload)
): PlanUserContext {
  return {
    weightKg: payload.basics.weightKg,
    heightCm: payload.basics.heightCm,
    ageYears: payload.basics.ageYears,
    sex: payload.basics.sex,
    bmr: bridged.bmrResults.selectedBMR,
    tdee: bridged.tdeeResults.tdee,
    bodyFatPct: payload.basics.bodyFatPct,
    isPregnantOrBreastfeeding: payload.healthClinical.isPregnantOrBreastfeeding,
    medicalConditions: payload.healthClinical.medicalConditions,
    chaiSugarKcalPerDay: bridged.culturalMetrics.dailyChaiKcal ?? 130,
    weeklyChaiSugarKcal: bridged.culturalMetrics.weeklyChaiKcal ?? 910,
    isNightShift: bridged.culturalMetrics.isNightShift ?? false,
    dailySittingHours: payload.occupational.dailySittingHours ?? 8,
  };
}
