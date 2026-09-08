import {
  enforceCalorieFloors,
  validateClinicalSafety,
} from './safety.js';
import { CalorieTargetResult, TargetCalculationInput } from './types.js';

export const KCAL_PER_KG_BODYFAT = 7700;

export function calculateCalorieTarget(
  input: TargetCalculationInput
): CalorieTargetResult {
  const {
    weightKg,
    heightCm,
    ageYears,
    sex,
    bmr,
    tdee,
    goal,
    targetRateKgPerWeek,
    isPregnantOrBreastfeeding,
    medicalConditions,
  } = input;

  const safetyWarnings: string[] = [];

  // 1. Clinical safety validation
  const clinicalCheck = validateClinicalSafety(
    weightKg,
    heightCm,
    ageYears,
    goal,
    isPregnantOrBreastfeeding
  );

  let activeGoal = goal;
  const violations = [...clinicalCheck.violations];

  if (!clinicalCheck.allowed) {
    // Fall back to maintenance
    activeGoal = 'maintain';
  }

  // 2. Check for medical conditions
  if (medicalConditions && medicalConditions.length > 0) {
    safetyWarnings.push(
      `Medical condition flags detected (${medicalConditions.join(
        ', '
      )}). Dietary recommendations require physician consultation.`
    );
  }

  // 3. Determine requested weekly change rate
  let requestedRateKg = targetRateKgPerWeek ?? 0;
  if (activeGoal === 'maintain') {
    requestedRateKg = 0;
  } else if (activeGoal === 'lose') {
    if (requestedRateKg <= 0) {
      // Default to moderate 0.75% body weight per week
      requestedRateKg = Number((weightKg * 0.0075).toFixed(2));
    }
    // Cap fat loss rate at 1% of body weight per week to prevent lean mass loss
    const maxSafeRate = Number((weightKg * 0.01).toFixed(2));
    if (requestedRateKg > maxSafeRate) {
      violations.push({
        code: 'EXCESSIVE_RATE',
        message: `Requested loss rate of ${requestedRateKg} kg/wk exceeds the 1% BW safety limit (${maxSafeRate} kg/wk).`,
        remedy: `Clamped rate to safe upper bound of ${maxSafeRate} kg/wk.`,
      });
      requestedRateKg = maxSafeRate;
    }
  } else if (activeGoal === 'gain') {
    if (requestedRateKg <= 0) {
      // Default lean gain rate ~0.25 kg/week
      requestedRateKg = 0.25;
    }
    // Cap gain rate at 0.5 kg/week to minimize fat accrual
    if (requestedRateKg > 0.5) {
      requestedRateKg = 0.5;
    }
  }

  // 4. Calculate daily caloric delta
  const dailyKcalDelta =
    activeGoal === 'maintain'
      ? 0
      : activeGoal === 'lose'
      ? -Math.round((requestedRateKg * KCAL_PER_KG_BODYFAT) / 7)
      : Math.round((requestedRateKg * KCAL_PER_KG_BODYFAT) / 7);

  const candidateKcal = tdee + dailyKcalDelta;

  // 5. Enforce floors for cutting goals
  if (activeGoal === 'lose') {
    const floorCheck = enforceCalorieFloors(candidateKcal, bmr, tdee, sex);
    violations.push(...floorCheck.violations);

    const appliedDelta = floorCheck.clampedKcal - tdee;
    const effectiveRate = Number(
      ((-appliedDelta * 7) / KCAL_PER_KG_BODYFAT).toFixed(2)
    );

    return {
      kcalTarget: floorCheck.clampedKcal,
      originalRequestedDelta: dailyKcalDelta,
      appliedDelta,
      effectiveRateKgPerWeek: effectiveRate,
      deficitPct: floorCheck.deficitPct,
      safetyViolations: violations,
      safetyWarnings,
    };
  }

  return {
    kcalTarget: Math.round(candidateKcal),
    originalRequestedDelta: dailyKcalDelta,
    appliedDelta: dailyKcalDelta,
    effectiveRateKgPerWeek: requestedRateKg,
    deficitPct: 0,
    safetyViolations: violations,
    safetyWarnings,
  };
}
