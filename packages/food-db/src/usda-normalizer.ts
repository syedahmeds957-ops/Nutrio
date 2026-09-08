import { NormalizedFood } from './types.js';

export const USDA_NUTRIENT_IDS = {
  KCAL: 1008,
  PROTEIN: 1003,
  FAT: 1004,
  CARB: 1005,
  FIBER: 1079,
  SUGAR: 2000,
  SODIUM: 1093,
  SAT_FAT: 1258,
} as const;

export interface RawUSDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: { description: string };
  foodNutrients: Array<{
    nutrient: { id: number; name: string };
    amount?: number;
  }>;
}

/**
 * Normalizes USDA FoodData Central items (Foundation and SR Legacy only).
 * Skips Branded Foods to preserve the 500MB database limit.
 */
export function normalizeUSDAFood(raw: RawUSDAFood): NormalizedFood | null {
  // Enforce zero-budget discipline: skip US Branded Foods
  if (raw.dataType !== 'Foundation' && raw.dataType !== 'SR Legacy') {
    return null;
  }

  const nutrientMap = new Map<number, number>();
  for (const item of raw.foodNutrients || []) {
    if (item.nutrient?.id && item.amount !== undefined) {
      nutrientMap.set(item.nutrient.id, item.amount);
    }
  }

  const kcal = nutrientMap.get(USDA_NUTRIENT_IDS.KCAL) ?? 0;
  const protein = nutrientMap.get(USDA_NUTRIENT_IDS.PROTEIN) ?? 0;
  const fat = nutrientMap.get(USDA_NUTRIENT_IDS.FAT) ?? 0;
  const carb = nutrientMap.get(USDA_NUTRIENT_IDS.CARB) ?? 0;
  const fiber = nutrientMap.get(USDA_NUTRIENT_IDS.FIBER) ?? 0;
  const sugar = nutrientMap.get(USDA_NUTRIENT_IDS.SUGAR) ?? 0;
  const sodium = nutrientMap.get(USDA_NUTRIENT_IDS.SODIUM) ?? 0;
  const satFat = nutrientMap.get(USDA_NUTRIENT_IDS.SAT_FAT) ?? 0;

  return {
    name: raw.description,
    category: raw.foodCategory?.description || 'Foundation Foods',
    cuisineTags: ['Raw Ingredient', 'Universal'],
    kcal100g: Number(kcal.toFixed(1)),
    protein100g: Number(protein.toFixed(1)),
    carb100g: Number(carb.toFixed(1)),
    fat100g: Number(fat.toFixed(1)),
    fibre100g: Number(fiber.toFixed(1)),
    sugar100g: Number(sugar.toFixed(1)),
    sodiumMg100g: Number(sodium.toFixed(1)),
    satFat100g: Number(satFat.toFixed(1)),
    source: 'usda',
    sourceRef: `fdc:${raw.fdcId}`,
    verifiedBy: 'USDA',
    confidence: 100,
    oilAddedG: 0,
    servings: [
      { label: '100g standard portion', grams: 100, isDefault: true },
    ],
  };
}
