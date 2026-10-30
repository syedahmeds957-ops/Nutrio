import { UsdaPer100g } from './schema.js';

/**
 * USDA FoodData Central: the US government's lab-measured food composition
 * database, public domain (CC0). Used only for ingredients the app's own
 * catalogue lacks, so every number in a dish is still a measured value, never
 * one a model produced.
 *
 * The generic reference foods (Foundation and SR Legacy; Branded rows are
 * single products, not ingredients) are imported into our own `usda.foods`
 * table by scripts/import-usda.mjs, so a search needs no data.gov key and has
 * no hourly cap. The function searches it through the search_usda_foods RPC.
 */
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
 * Per-100 g values of one FDC record, or undefined when it lacks energy or
 * a macro, or the values are physically impossible (more than 100 g of
 * macronutrients in 100 g of food, more energy than pure fat).
 * scripts/import-usda.mjs runs every record through this before storing it.
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

/** The project's own API and a key that may call search_usda_foods (service role only). */
export interface UsdaDatabase {
  url: string;
  key: string;
}

/** One search_usda_foods row; per100gFrom() checked its values at import. */
interface UsdaRow {
  fdc_id: number;
  data_type: string;
  description: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium_mg: number;
  sat_fat: number;
}

/**
 * The FDC records for an ingredient name, best match first. Throws on a
 * network or HTTP failure so the caller can mark the ingredient not counted
 * rather than guess.
 */
export async function searchUsda(
  query: string,
  db: UsdaDatabase,
  fetchImpl: typeof fetch = fetch
): Promise<UsdaCandidate[]> {
  const res = await fetchImpl(`${db.url}/rest/v1/rpc/search_usda_foods`, {
    method: 'POST',
    // Secret keys (sb_secret_...) are not JWTs, so they go on `apikey` only;
    // the gateway rejects one sent as a Bearer token.
    headers: { 'Content-Type': 'application/json', apikey: db.key },
    body: JSON.stringify({ query, max_results: FDC_CANDIDATES_PER_QUERY }),
    signal: AbortSignal.timeout(FDC_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`USDA food search returned HTTP ${res.status}`);
  const rows = (await res.json()) as UsdaRow[];

  return rows.map((row) => ({
    fdcId: row.fdc_id,
    description: row.description.slice(0, 120),
    dataType: row.data_type,
    per100g: {
      kcal: Number(row.kcal),
      protein: Number(row.protein),
      carbs: Number(row.carbs),
      fat: Number(row.fat),
      fibre: Number(row.fibre),
      sugar: Number(row.sugar),
      sodiumMg: Number(row.sodium_mg),
      satFat: Number(row.sat_fat),
    },
  }));
}
