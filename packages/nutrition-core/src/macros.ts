import { MacroSplitInput, MacroSplitResult } from './types.js';

export const KCAL_PER_GRAM_PROTEIN = 4;
export const KCAL_PER_GRAM_CARB = 4;
export const KCAL_PER_GRAM_FAT = 9;

export function calculateMacros(input: MacroSplitInput): MacroSplitResult {
  const {
    kcalTarget,
    weightKg,
    goal,
    bodyFatPct,
    proteinMultiplier,
    fatMinPct = 0.2,
    fatMinGPerKg = 0.6,
    ambientTempHigh = false,
  } = input;

  if (kcalTarget <= 0 || weightKg <= 0) {
    throw new Error('Kcal target and weight must be strictly positive.');
  }

  // 1. Effective weight base (use Lean Body Mass if body fat % is high > 30%)
  const effectiveWeightKg =
    bodyFatPct !== undefined && bodyFatPct > 30
      ? weightKg * (1 - bodyFatPct / 100) * 1.2 // adjusted weight for obese individuals
      : weightKg;

  // 2. Protein calculation
  // Cutting: 2.0-2.4 g/kg | Maintain: 1.8 g/kg | Gain: 1.8-2.0 g/kg
  const defaultProteinMultiplier =
    goal === 'lose' ? 2.0 : goal === 'gain' ? 1.9 : 1.8;
  const pMult = proteinMultiplier ?? defaultProteinMultiplier;
  const proteinGrams = Math.round(effectiveWeightKg * pMult);
  const proteinKcal = proteinGrams * KCAL_PER_GRAM_PROTEIN;

  // 3. Fat calculation (Hormonal Floor: >= 20% kcal AND >= 0.6 g/kg)
  const minFatFromWeightGrams = Math.round(weightKg * fatMinGPerKg);
  const minFatFromPercentageKcal = Math.round(kcalTarget * fatMinPct);
  const minFatKcal = Math.max(
    minFatFromWeightGrams * KCAL_PER_GRAM_FAT,
    minFatFromPercentageKcal
  );

  // Standard fat allotment: ~25% of total kcal, respecting hormonal minimums
  const standardFatKcal = Math.round(kcalTarget * 0.25);
  const targetFatKcal = Math.max(minFatKcal, standardFatKcal);
  const fatGrams = Math.round(targetFatKcal / KCAL_PER_GRAM_FAT);
  const fatKcal = fatGrams * KCAL_PER_GRAM_FAT;

  // 4. Carbs: Remainder of calories
  const remainingKcal = Math.max(0, kcalTarget - (proteinKcal + fatKcal));
  const carbGrams = Math.round(remainingKcal / KCAL_PER_GRAM_CARB);
  const carbKcal = carbGrams * KCAL_PER_GRAM_CARB;

  // 5. Fibre: 14g per 1000 kcal
  const fibreGrams = Math.round((kcalTarget / 1000) * 14);

  // 6. Water: 30-35 ml/kg base (40 ml/kg during hot summers like Lahore)
  const waterRate = ambientTempHigh ? 40 : 35;
  const waterMl = Math.round(weightKg * waterRate);

  return {
    kcalTarget,
    proteinGrams,
    proteinKcal,
    proteinPct: Number(((proteinKcal / kcalTarget) * 100).toFixed(1)),
    fatGrams,
    fatKcal,
    fatPct: Number(((fatKcal / kcalTarget) * 100).toFixed(1)),
    carbGrams,
    carbKcal,
    carbPct: Number(((carbKcal / kcalTarget) * 100).toFixed(1)),
    fibreGrams,
    waterMl,
  };
}
