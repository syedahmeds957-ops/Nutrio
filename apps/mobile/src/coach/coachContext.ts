import { CoachContext } from '@nutrio/nutrition-core';
import type { ComputedUserPlan } from '../plan/types.js';
import type { LifestyleSurveyPayload } from '../survey/types.js';
import type { DailyTrackerSummary } from '../tracker/types.js';

// Survey answer meaning "no conditions"; not a flag the coach should act on.
const NO_CONDITION = 'none';

export interface CoachContextInput {
  plan: ComputedUserPlan;
  survey?: LifestyleSurveyPayload | null;
  summary?: DailyTrackerSummary | null;
  displayName: string;
  region: 'PK' | 'SA';
}

/**
 * What the coach is told about the user, taken only from what they told us.
 *
 * The accepted plan is the source of truth for the profile and targets. Diet
 * and conditions come from the survey when it is on hand; anything unknown is
 * left out rather than filled with a guess, since a wrong guess (a diet, a sex,
 * a goal) is worse advice than none.
 */
export function buildCoachContext({
  plan,
  survey,
  summary,
  displayName,
  region,
}: CoachContextInput): CoachContext {
  const conditions =
    survey?.healthClinical?.medicalConditions ?? plan.userContext.medicalConditions ?? [];
  const diet = survey?.preferencesBudget?.dietPreference;

  return {
    displayName,
    region,
    sex: plan.userContext.sex,
    ageYears: plan.userContext.ageYears,
    weightKg: plan.userContext.weightKg,
    goal: plan.goalSelection.goal,
    targets: {
      kcalTarget: plan.targetResult.kcalTarget,
      proteinGrams: plan.macros.proteinGrams,
      fatGrams: plan.macros.fatGrams,
      carbGrams: plan.macros.carbGrams,
      waterMl: plan.macros.waterMl,
    },
    todaySummary: summary
      ? {
          caloriesConsumed: summary.totalCaloriesConsumed,
          proteinConsumed: summary.totalProteinConsumed,
          fatConsumed: summary.totalFatConsumed,
          carbConsumed: summary.totalCarbConsumed,
          remainingCalories: summary.remainingCalories,
          foodsLoggedToday: summary.items.map((item) => item.foodName),
        }
      : {
          caloriesConsumed: 0,
          proteinConsumed: 0,
          fatConsumed: 0,
          carbConsumed: 0,
          remainingCalories: plan.targetResult.kcalTarget,
          foodsLoggedToday: [],
        },
    medicalFlags: conditions.filter((condition) => condition !== NO_CONDITION),
    dietaryPreferences: diet ? [diet] : [],
  };
}
