import type { ComposedRecipe, RegionCode, UsdaRecord } from '@nutrio/food-db';
import { foodDb } from '../catalogue/index.js';
import { EdgeFunctionInvoker, invokeEdgeFunction } from './edgeFunctions.js';

/** Why a dish could not be added, each with its own message on screen. */
export type DishBreakdownFailure = 'sign_in' | 'unknown_dish' | 'unavailable';

export type DishBreakdownResult =
  | { ok: true; recipe: ComposedRecipe; servingDescription: string; usedWebSearch: boolean }
  /**
   * Too much of the dish could not be valued from a trusted source to give an
   * honest number; `missing` names what was not counted.
   */
  | { ok: false; reason: 'incomplete'; missing: { name: string; grams: number }[] }
  | { ok: false; reason: DishBreakdownFailure };

interface NamedGrams {
  name: string;
  grams: number;
}

interface UsdaIngredientBody extends NamedGrams, UsdaRecord {}

interface DishBreakdownBody {
  dishName: string;
  servingDescription: string;
  ingredients: NamedGrams[];
  usdaIngredients: UsdaIngredientBody[];
  notCounted: NamedGrams[];
  usedWebSearch: boolean;
}

const isNamedGrams = (i: unknown): i is NamedGrams =>
  typeof (i as NamedGrams)?.name === 'string' && typeof (i as NamedGrams)?.grams === 'number';

const PER_100G_FIELDS = ['kcal', 'protein', 'carbs', 'fat', 'fibre', 'sugar', 'sodiumMg', 'satFat'] as const;

const isUsdaIngredient = (i: unknown): i is UsdaIngredientBody => {
  const v = i as UsdaIngredientBody;
  return (
    isNamedGrams(v) &&
    typeof v.fdcId === 'number' &&
    typeof v.description === 'string' &&
    !!v.per100g &&
    PER_100G_FIELDS.every((k) => typeof v.per100g[k] === 'number' && v.per100g[k] >= 0) &&
    v.per100g.kcal <= 902
  );
};

function isDishBreakdownBody(value: unknown): value is DishBreakdownBody {
  const v = value as DishBreakdownBody;
  return (
    !!v &&
    typeof v.dishName === 'string' &&
    typeof v.servingDescription === 'string' &&
    typeof v.usedWebSearch === 'boolean' &&
    Array.isArray(v.ingredients) &&
    v.ingredients.every(isNamedGrams) &&
    Array.isArray(v.usdaIngredients) &&
    v.usdaIngredients.every(isUsdaIngredient) &&
    Array.isArray(v.notCounted) &&
    v.notCounted.every(isNamedGrams)
  );
}

function failureFor(err: unknown): DishBreakdownFailure {
  const status = Number((err as Error)?.message?.match(/HTTP (\d{3})/)?.[1]);
  if (status === 401) return 'sign_in';
  if (status === 422) return 'unknown_dish';
  return 'unavailable';
}

/**
 * Asks the dish-breakdown edge function how one serving of `dishName` is made,
 * then values it here on the device.
 *
 * The model supplies only ingredient names and grams. Catalogue ingredients are
 * valued from food-db; the rest carry the values of the USDA FoodData Central
 * record the server matched them to (Hard Rule 1: never a model's number). If
 * too much of the dish has no trusted value, it is refused rather than
 * undercounted. The dish keeps the name the user typed, since that is what they
 * will search for next time.
 */
export async function requestDishBreakdown(
  dishName: string,
  region: RegionCode,
  invoke: EdgeFunctionInvoker = invokeEdgeFunction
): Promise<DishBreakdownResult> {
  const catalogueRegion = region === 'SA' ? 'SA' : 'PK';
  const catalogueNames = foodDb().getRecipeIngredientFoods(catalogueRegion).map((f) => f.name);

  let body: unknown;
  try {
    body = await invoke('dish-breakdown', { dishName, region: catalogueRegion, catalogueNames });
  } catch (err) {
    console.warn('[dishBreakdown] dish-breakdown failed:', (err as Error)?.message);
    return { ok: false, reason: failureFor(err) };
  }
  if (!isDishBreakdownBody(body)) return { ok: false, reason: 'unavailable' };

  const recipe = foodDb().composeRecipeFood({
    name: dishName,
    ingredients: [
      ...body.ingredients.map(({ name, grams }) => ({ name, grams })),
      ...body.usdaIngredients.map((u) => ({ name: u.name, grams: u.grams, food: foodDb().foodFromUsdaRecord(u) })),
    ],
    notCounted: body.notCounted.map(({ name, grams }) => ({ name, grams })),
    servingLabel: body.servingDescription || undefined,
    region: catalogueRegion,
  });
  if (!recipe) {
    return body.notCounted.length > 0
      ? { ok: false, reason: 'incomplete', missing: body.notCounted }
      : { ok: false, reason: 'unavailable' };
  }
  if (recipe.uncountedShare > foodDb().MAX_UNCOUNTED_SHARE) {
    return { ok: false, reason: 'incomplete', missing: recipe.notCounted };
  }

  return {
    ok: true,
    recipe,
    servingDescription: body.servingDescription,
    usedWebSearch: body.usedWebSearch,
  };
}
