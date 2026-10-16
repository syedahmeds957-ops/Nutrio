import {
  composeRecipeFood,
  getRecipeIngredientFoods,
  type ComposedRecipe,
  type RegionCode,
} from '@nutrio/food-db';
import { EdgeFunctionInvoker, invokeEdgeFunction } from './edgeFunctions.js';

/** Why a dish could not be added, each with its own message on screen. */
export type DishBreakdownFailure = 'sign_in' | 'unknown_dish' | 'unavailable';

export type DishBreakdownResult =
  | { ok: true; recipe: ComposedRecipe; servingDescription: string; usedWebSearch: boolean }
  | { ok: false; reason: DishBreakdownFailure };

interface DishBreakdownBody {
  dishName: string;
  servingDescription: string;
  ingredients: { name: string; grams: number }[];
  usedWebSearch: boolean;
}

function isDishBreakdownBody(value: unknown): value is DishBreakdownBody {
  const v = value as DishBreakdownBody;
  return (
    !!v &&
    typeof v.dishName === 'string' &&
    typeof v.servingDescription === 'string' &&
    typeof v.usedWebSearch === 'boolean' &&
    Array.isArray(v.ingredients) &&
    v.ingredients.every((i) => typeof i?.name === 'string' && typeof i?.grams === 'number')
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
 * then prices it from the catalogue here on the device.
 *
 * The server answers with ingredient names and grams only; every calorie and
 * macro is computed by `composeRecipeFood` from food-db values (Hard Rule 1).
 * The dish keeps the name the user typed, since that is what they will search
 * for next time.
 */
export async function requestDishBreakdown(
  dishName: string,
  region: RegionCode,
  invoke: EdgeFunctionInvoker = invokeEdgeFunction
): Promise<DishBreakdownResult> {
  const catalogueRegion = region === 'SA' ? 'SA' : 'PK';
  const catalogueNames = getRecipeIngredientFoods(catalogueRegion).map((f) => f.name);

  let body: unknown;
  try {
    body = await invoke('dish-breakdown', { dishName, region: catalogueRegion, catalogueNames });
  } catch (err) {
    console.warn('[dishBreakdown] dish-breakdown failed:', (err as Error)?.message);
    return { ok: false, reason: failureFor(err) };
  }
  if (!isDishBreakdownBody(body)) return { ok: false, reason: 'unavailable' };

  const recipe = composeRecipeFood({
    name: dishName,
    ingredients: body.ingredients,
    servingLabel: body.servingDescription || undefined,
    region: catalogueRegion,
  });
  if (!recipe) return { ok: false, reason: 'unavailable' };

  return {
    ok: true,
    recipe,
    servingDescription: body.servingDescription,
    usedWebSearch: body.usedWebSearch,
  };
}
