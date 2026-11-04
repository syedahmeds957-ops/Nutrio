import type { DailyMealPlanResult } from '@nutrio/nutrition-core';

/** How far a macro can drift from its target before the plan says so. */
export const MACRO_TOLERANCE = 0.15;

export interface MacroStatus {
  actual: number;
  target: number;
  /** Signed grams from target: negative is short, positive is over. */
  gapGrams: number;
  isOff: boolean;
}

const status = (actual: number, target: number): MacroStatus => {
  const gapGrams = Math.round(actual - target);
  return {
    actual,
    target,
    gapGrams,
    isOff: target > 0 && Math.abs(actual - target) / target > MACRO_TOLERANCE,
  };
};

/**
 * Each macro of a planned day against its target. The solver only guarantees
 * calories (within 5%), so the plan screen shows the macros it missed instead
 * of a single calorie badge that read as "on target".
 */
export function planMacroStatus(plan: DailyMealPlanResult) {
  return {
    protein: status(plan.actualProteinGrams, plan.targetProteinGrams),
    carbs: status(plan.actualCarbGrams, plan.targetCarbGrams),
    fat: status(plan.actualFatGrams, plan.targetFatGrams),
  };
}
