import type { NormalizedFood } from '@nutrio/food-db';
import { foodDb } from '../catalogue/index.js';
import type { Region } from './region/index.js';

/**
 * The catalogue entries behind "a cup" in the survey's daily-ritual question,
 * the quick-log chai chip and describe-a-meal. Each used to carry its own
 * number: the survey assumed 65 kcal a cup, the chip resolved a 200 ml mug at
 * 134 and describe-a-meal matched a 150 ml cup at 80.
 */
export const CHAI_CUP = { foodName: 'Chai (With Sugar)', serving: '1 chai cup (150ml)' } as const;
const GAHWA_FINJAN = { foodName: 'Saudi Gahwa with Cardamom & Saffron', serving: '1 Finjan' } as const;
const COMPANION_DATE = { foodName: 'Sukari Dates (Al-Qassim)', serving: '1 Date' } as const;

function servingKcal(
  pool: NormalizedFood[],
  { foodName, serving }: { foodName: string; serving: string }
): number {
  const food = pool.find((f) => f.name === foodName);
  const unit = food?.servings.find((s) => s.label.startsWith(serving));
  if (!food || !unit) {
    throw new Error(`Ritual drink "${foodName}" (${serving}) is missing from the catalogue`);
  }
  return (food.kcal100g * unit.grams) / 100;
}

const cache: Partial<Record<Region, number>> = {};

/**
 * Calories in one unit of the region's daily ritual, from food-db: a cup of
 * sweet doodh patti in Pakistan, a finjan of gahwa with one date in Saudi
 * Arabia (the survey counts finjans, and a date is served with each).
 */
export function ritualCupKcal(region: Region): number {
  return (cache[region] ??= Math.round(
    region === 'SA'
      ? servingKcal(foodDb().SAUDI_TRADITIONAL_FOODS, GAHWA_FINJAN) + servingKcal(foodDb().SAUDI_TRADITIONAL_FOODS, COMPANION_DATE)
      : servingKcal(foodDb().DIET_BASICS_CATALOG, CHAI_CUP)
  ));
}
