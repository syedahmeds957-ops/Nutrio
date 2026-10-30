import {
  enforceCalorieFloors,
  validateClinicalSafety,
} from './safety.js';
import { CalorieTargetResult, SafetyViolation, TargetCalculationInput } from './types.js';

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

/** Which limit kept the target from reaching the pace the user picked. */
export type PaceLimitReason =
  /** The absolute minimum intake (1,200 kcal women / 1,500 kcal men). */
  | 'absoluteFloor'
  /** The calories the body burns at rest (BMR). */
  | 'bmr'
  /** Never more than 25% below what the user burns. */
  | 'maxDeficit'
  /** Loss capped at 1% of body weight a week. */
  | 'maxLossRate'
  /** Gain capped at 0.5 kg a week. */
  | 'maxGainRate';

export interface PaceLimit {
  /** True when the plan cannot move as fast as the pace the user picked. */
  limited: boolean;
  /** The limit that binds, or null when the picked pace is met. */
  reason: PaceLimitReason | null;
  requestedRateKgPerWeek: number;
  effectiveRateKgPerWeek: number;
  /** Daily kcal change the picked pace needs (negative for loss). */
  requestedDailyDelta: number;
  /** Daily kcal change the target actually applies. */
  appliedDailyDelta: number;
}

// Rates are rounded to 0.01 kg; anything inside that is the same pace.
const PACE_TOLERANCE_KG = 0.005;

const CLINICAL_GOAL_BLOCKS: SafetyViolation['code'][] = [
  'UNDERWEIGHT_CUT_DISABLED',
  'AGE_UNDER_18_CUT_DISABLED',
  'PREGNANCY_MAINTENANCE_ONLY',
];

/**
 * Compares the pace the user picked with what `calculateCalorieTarget`
 * actually allows, so a screen can say when a safety limit slows the plan.
 *
 * Pure and derived only from the stored result, so it also works on plans
 * saved before this existed. The requested rate is passed in because the
 * rate caps are applied before the result's `originalRequestedDelta`.
 */
export function describePaceLimit(
  requestedRateKgPerWeek: number,
  result: Pick<CalorieTargetResult, 'appliedDelta' | 'effectiveRateKgPerWeek' | 'safetyViolations'>,
  goal: 'lose' | 'maintain' | 'gain'
): PaceLimit {
  const requested = goal === 'maintain' ? 0 : Math.max(0, requestedRateKgPerWeek);
  const effective = Math.abs(result.effectiveRateKgPerWeek);
  const sign = goal === 'lose' ? -1 : 1;
  const requestedDailyDelta =
    goal === 'maintain' ? 0 : sign * Math.round((requested * KCAL_PER_KG_BODYFAT) / 7);

  const codes = new Set(result.safetyViolations.map((v) => v.code));
  // A clinical block replaces the goal with maintenance; that is not a pace
  // limit and has its own explanation.
  const goalOverridden = CLINICAL_GOAL_BLOCKS.some((code) => codes.has(code));
  const limited = !goalOverridden && requested > 0 && effective < requested - PACE_TOLERANCE_KG;

  let reason: PaceLimitReason | null = null;
  if (limited) {
    // The floors are applied in order (25% cap, then BMR, then the absolute
    // floor); the last one that raised the target is the one that binds.
    if (codes.has('BELOW_ABSOLUTE_FLOOR')) reason = 'absoluteFloor';
    else if (codes.has('BELOW_BMR_FLOOR')) reason = 'bmr';
    else if (codes.has('EXCESSIVE_DEFICIT')) reason = 'maxDeficit';
    else reason = goal === 'gain' ? 'maxGainRate' : 'maxLossRate';
  }

  return {
    limited,
    reason,
    requestedRateKgPerWeek: requested,
    effectiveRateKgPerWeek: effective,
    requestedDailyDelta,
    appliedDailyDelta: result.appliedDelta,
  };
}
