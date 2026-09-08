import { OFFProduct } from './types.js';

export const PAKISTAN_POPULAR_BRANDS = [
  'shan',
  'national',
  'olpers',
  'nurpur',
  'peek freans',
  'lu',
  'tapal',
  'lipton',
  'mezan',
  'dalda',
  'shezan',
  'mitchells',
  'ahmed',
  'habib',
  'knorr',
  'maggi',
  'nestle',
  'lays',
  'kurkure',
  'kelloggs',
  'coca-cola',
  'pepsi',
  'engro',
  'fauji',
  'youngs',
];

export interface RawOFFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  countries_tags?: string[];
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
}

/**
 * Filters and transforms an Open Food Facts product entry.
 * Keeps storage within the ~15MB budget by preserving only PK-relevant brands and foods.
 */
export function filterAndTransformOFFProduct(
  raw: RawOFFProduct
): OFFProduct | null {
  if (!raw.code || !raw.product_name) return null;

  const brandLower = (raw.brands || '').toLowerCase();
  const countries = (raw.countries_tags || []).map((c) => c.toLowerCase());

  const isSoldInPK =
    countries.some((c) => c.includes('pakistan') || c.includes('pk')) ||
    PAKISTAN_POPULAR_BRANDS.some((b) => brandLower.includes(b));

  if (!isSoldInPK) return null;

  const nutriments = raw.nutriments || {};
  const kcal = nutriments['energy-kcal_100g'] ?? 0;
  const protein = nutriments.proteins_100g ?? 0;
  const carbs = nutriments.carbohydrates_100g ?? 0;
  const fat = nutriments.fat_100g ?? 0;

  return {
    barcode: raw.code,
    name: raw.product_name,
    brand: raw.brands,
    nutrients: {
      kcal100g: Number(kcal.toFixed(1)),
      protein100g: Number(protein.toFixed(1)),
      carb100g: Number(carbs.toFixed(1)),
      fat100g: Number(fat.toFixed(1)),
      fibre100g: nutriments.fiber_100g ? Number(nutriments.fiber_100g.toFixed(1)) : undefined,
      sugar100g: nutriments.sugars_100g ? Number(nutriments.sugars_100g.toFixed(1)) : undefined,
      sodiumMg100g: nutriments.sodium_100g ? Number((nutriments.sodium_100g * 1000).toFixed(1)) : undefined,
    },
  };
}
