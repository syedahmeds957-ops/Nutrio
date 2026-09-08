import { BiologicalSex, GoalType, SafetyViolation } from './types.js';

export const ABSOLUTE_FLOOR_FEMALE = 1200;
export const ABSOLUTE_FLOOR_MALE = 1500;
export const MAX_DEFICIT_PERCENT = 0.25; // 25% max deficit

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function validateClinicalSafety(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  goal: GoalType,
  isPregnantOrBreastfeeding?: boolean
): { allowed: boolean; violations: SafetyViolation[] } {
  const violations: SafetyViolation[] = [];
  const bmi = calculateBMI(weightKg, heightCm);

  // 1. Underweight check (BMI < 18.5)
  if (bmi < 18.5 && goal === 'lose') {
    violations.push({
      code: 'UNDERWEIGHT_CUT_DISABLED',
      message: `BMI of ${bmi} indicates an underweight status. Weight loss is clinically unsafe.`,
      remedy: 'Select maintenance or gentle weight gain to reach a healthy weight range.',
    });
  }

  // 2. Age under 18 cut check
  if (ageYears < 18 && goal === 'lose') {
    violations.push({
      code: 'AGE_UNDER_18_CUT_DISABLED',
      message: 'Nutrient/calorie restriction under age 18 requires professional paediatric supervision.',
      remedy: 'Goal restricted to maintenance or consultation with a registered paediatrician.',
    });
  }

  // 3. Pregnancy / Breastfeeding check
  if (isPregnantOrBreastfeeding && goal === 'lose') {
    violations.push({
      code: 'PREGNANCY_MAINTENANCE_ONLY',
      message: 'Active caloric restriction is contraindicated during pregnancy or active lactation.',
      remedy: 'Goal reset to maintenance with nutrient-dense focus.',
    });
  }

  return {
    allowed: violations.length === 0,
    violations,
  };
}

export function enforceCalorieFloors(
  candidateKcal: number,
  bmr: number,
  tdee: number,
  sex: BiologicalSex
): {
  clampedKcal: number;
  violations: SafetyViolation[];
  deficitPct: number;
} {
  const violations: SafetyViolation[] = [];
  const absoluteFloor = sex === 'male' ? ABSOLUTE_FLOOR_MALE : ABSOLUTE_FLOOR_FEMALE;
  const maxDeficitKcal = Math.round(tdee * (1 - MAX_DEFICIT_PERCENT));

  let finalKcal = candidateKcal;

  // 1. Deficit cannot exceed 25% of TDEE
  if (candidateKcal < maxDeficitKcal) {
    violations.push({
      code: 'EXCESSIVE_DEFICIT',
      message: `Candidate intake of ${candidateKcal} kcal exceeds the safe 25% deficit limit.`,
      remedy: `Clamped candidate intake to 25% deficit floor (${maxDeficitKcal} kcal).`,
    });
    finalKcal = maxDeficitKcal;
  }

  // 2. Cannot fall below calculated BMR (metabolic preservation)
  if (finalKcal < bmr) {
    violations.push({
      code: 'BELOW_BMR_FLOOR',
      message: `Target of ${finalKcal} kcal falls below resting BMR of ${bmr} kcal.`,
      remedy: `Raised calorie floor to resting BMR (${bmr} kcal).`,
    });
    finalKcal = bmr;
  }

  // 3. Cannot fall below absolute clinical floors (1200 F / 1500 M)
  if (finalKcal < absoluteFloor) {
    violations.push({
      code: 'BELOW_ABSOLUTE_FLOOR',
      message: `Target of ${finalKcal} kcal falls below the biological minimum floor of ${absoluteFloor} kcal.`,
      remedy: `Raised calorie floor to absolute floor (${absoluteFloor} kcal).`,
    });
    finalKcal = absoluteFloor;
  }

  const deficitPct = tdee > 0 ? Number(((tdee - finalKcal) / tdee).toFixed(3)) : 0;

  return {
    clampedKcal: Math.round(finalKcal),
    violations,
    deficitPct,
  };
}
