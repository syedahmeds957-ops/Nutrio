import { UsdaPer100g } from './schema.js';

/**
 * USDA FoodData Central: the US government's lab-measured food composition
 * database, public domain (CC0). Used only for ingredients the app's own
 * catalogue lacks, so every number in a dish is still a measured value, never
 * one a model produced.
 */
const FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
/** Generic reference foods only; Branded rows are single products, not ingredients. */
const FDC_DATA_TYPES = ['Foundation', 'SR Legacy'];
export const FDC_CANDIDATES_PER_QUERY = 5;
const FDC_TIMEOUT_MS = 6000;

/** FDC nutrient ids. Foundation foods report energy as Atwater (2047/2048), not 1008. */
const NUTRIENT = {
  energy: [1008, 2047, 2048],
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fibre: 1079,
  sugar: 2000,
  sodium: 1093,
  satFat: 1258,
} as const;

export interface UsdaCandidate {
  fdcId: number;
  description: string;
  dataType: string;
  per100g: UsdaPer100g;
}

interface FdcNutrient {
  nutrientId?: number;
  value?: number;
  unitName?: string;
}

interface FdcFood {
  fdcId?: number;
  description?: string;
  dataType?: string;
  foodNutrients?: FdcNutrient[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Per-100 g values of one FDC search hit, or undefined when it lacks energy or
 * a macro, or the values are physically impossible (more than 100 g of
 * macronutrients in 100 g of food, more energy than pure fat).
 */
export function per100gFrom(food: FdcFood): UsdaPer100g | undefined {
  const nutrients = food.foodNutrients ?? [];
  const value = (id: number) => {
    const n = nutrients.find((x) => x.nutrientId === id);
    return typeof n?.value === 'number' && Number.isFinite(n.value) ? n.value : undefined;
  };

  const kcal = NUTRIENT.energy.map(value).find((v) => v !== undefined);
  const protein = value(NUTRIENT.protein);
  const fat = value(NUTRIENT.fat);
  const carbs = value(NUTRIENT.carbs);
  if (kcal === undefined || protein === undefined || fat === undefined || carbs === undefined) {
    return undefined;
  }
  if (kcal < 0 || kcal > 902 || protein < 0 || fat < 0 || carbs < 0 || protein + fat + carbs > 100.5) {
    return undefined;
  }

  return {
    kcal: Math.round(kcal),
    protein: round1(protein),
    carbs: round1(carbs),
    fat: round1(fat),
    fibre: round1(value(NUTRIENT.fibre) ?? 0),
    sugar: round1(value(NUTRIENT.sugar) ?? 0),
    sodiumMg: Math.round(value(NUTRIENT.sodium) ?? 0),
    satFat: round1(value(NUTRIENT.satFat) ?? 0),
  };
}

/**
 * The usable FDC records for an ingredient name, best search rank first.
 * Throws on a network or HTTP failure so the caller can mark the ingredient
 * not counted rather than guess.
 */
export async function searchUsda(
  query: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<UsdaCandidate[]> {
  const res = await fetchImpl(`${FDC_SEARCH_URL}?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, dataType: FDC_DATA_TYPES, pageSize: FDC_CANDIDATES_PER_QUERY }),
    signal: AbortSignal.timeout(FDC_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`FoodData Central returned HTTP ${res.status}`);
  const data = (await res.json()) as { foods?: FdcFood[] };

  const candidates: UsdaCandidate[] = [];
  for (const food of data.foods ?? []) {
    const per100g = per100gFrom(food);
    if (!per100g || typeof food.fdcId !== 'number' || !food.description) continue;
    candidates.push({
      fdcId: food.fdcId,
      description: food.description.slice(0, 120),
      dataType: food.dataType ?? '',
      per100g,
    });
  }
  return candidates;
}
