import { BMRCalculationInput, BMRResults } from './types.js';

/**
 * Calculates BMR using standard peer-reviewed equations:
 * 1. Mifflin-St Jeor (default general population)
 * 2. Katch-McArdle (when body fat % is provided)
 * 3. Cunningham (athletic/LBM-based comparison)
 * 4. Harris-Benedict (revised Roza & Shizgal 1984)
 */
export function calculateBMR(input: BMRCalculationInput): BMRResults {
  const { weightKg, heightCm, ageYears, sex, bodyFatPct } = input;

  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) {
    throw new Error('Weight, height, and age must be strictly positive numbers.');
  }

  // 1. Mifflin-St Jeor (1990)
  const mifflinStJeor =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;

  // 4. Harris-Benedict (revised Roza & Shizgal 1984)
  const harrisBenedict =
    sex === 'male'
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;

  let katchMcArdle: number | undefined;
  let cunningham: number | undefined;

  if (bodyFatPct !== undefined && bodyFatPct > 0 && bodyFatPct < 100) {
    const lbmKg = weightKg * (1 - bodyFatPct / 100);
    katchMcArdle = 370 + 21.6 * lbmKg;
    cunningham = 500 + 22 * lbmKg;
  }

  // Use Katch-McArdle if reliable body fat is provided, otherwise default to Mifflin-St Jeor
  const useKatch = katchMcArdle !== undefined;

  return {
    mifflinStJeor: Math.round(mifflinStJeor),
    katchMcArdle: katchMcArdle !== undefined ? Math.round(katchMcArdle) : undefined,
    cunningham: cunningham !== undefined ? Math.round(cunningham) : undefined,
    harrisBenedict: Math.round(harrisBenedict),
    selectedBMR: Math.round(useKatch ? (katchMcArdle as number) : mifflinStJeor),
    methodUsed: useKatch ? 'katch_mcardle' : 'mifflin_st_jeor',
  };
}
