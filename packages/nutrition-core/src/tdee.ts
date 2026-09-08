import { ActivityLevel, TDEECalculationInput, TDEEResult } from './types.js';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

/**
 * Derives activity multiplier from wearable/pedometer step counts.
 * Step data materially improves accuracy over self-reported sliders.
 */
export function getStepMultiplier(steps: number): number {
  if (steps < 5000) return 1.2;
  if (steps < 7500) return 1.375;
  if (steps < 11000) return 1.55;
  if (steps < 15000) return 1.725;
  return 1.9;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * Supports:
 * 1. Standard activity factor
 * 2. Split occupational factor + weekly exercise kcal
 * 3. Wearable step count override
 */
export function calculateTDEE(input: TDEECalculationInput): TDEEResult {
  const { bmr, activityLevel, occupationalFactor, weeklyExerciseKcal, dailyStepCount } =
    input;

  if (bmr <= 0) {
    throw new Error('BMR must be strictly positive.');
  }

  // 1. Wearable step count override takes precedence if present
  if (dailyStepCount !== undefined && dailyStepCount > 0) {
    const stepMultiplier = getStepMultiplier(dailyStepCount);
    return {
      tdee: Math.round(bmr * stepMultiplier),
      method: 'step_override',
      baseMultiplier: stepMultiplier,
    };
  }

  // 2. Occupational split + exercise expenditure
  if (
    occupationalFactor !== undefined &&
    weeklyExerciseKcal !== undefined &&
    weeklyExerciseKcal >= 0
  ) {
    const dailyExerciseKcal = weeklyExerciseKcal / 7;
    const tdee = bmr * occupationalFactor + dailyExerciseKcal;
    return {
      tdee: Math.round(tdee),
      method: 'occupational_split',
      baseMultiplier: occupationalFactor,
    };
  }

  // 3. Standard activity multiplier
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return {
    tdee: Math.round(bmr * multiplier),
    method: 'standard_multiplier',
    baseMultiplier: multiplier,
  };
}
