import {
  analyzeMealItems,
  parseMealText,
  type AnalyzedMeal,
  type MealSlotHint,
  type ParsedMealItem,
  type RegionCode,
} from '@nutrio/food-db';
import { EdgeFunctionInvoker, invokeEdgeFunction } from './edgeFunctions.js';

export interface DescribedMeal {
  analysis: AnalyzedMeal;
  /** Who split the sentence: the model, or the on-device parser. */
  splitBy: 'model' | 'device';
}

interface ParseFoodTextBody {
  slot?: MealSlotHint;
  items: ParsedMealItem[];
}

const SLOTS: ReadonlySet<string> = new Set(['breakfast', 'lunch', 'dinner', 'snacks_chai']);

function isParseFoodTextBody(value: unknown): value is ParseFoodTextBody {
  const v = value as ParseFoodTextBody;
  return (
    !!v &&
    (v.slot === undefined || SLOTS.has(v.slot)) &&
    Array.isArray(v.items) &&
    v.items.length > 0 &&
    v.items.every(
      (i) =>
        typeof i?.name === 'string' &&
        typeof i?.text === 'string' &&
        typeof i?.quantity === 'number' &&
        typeof i?.quantityGiven === 'boolean'
    )
  );
}

/**
 * "in breakfast i had 4 egg whites and 2 whole eggs and salad" → foods,
 * amounts and the rows the user must confirm.
 *
 * The parse-food-text edge function only splits the sentence (it handles messy
 * phrasing best); it returns no nutrition. Matching and every number happen
 * here against the local catalogue. When the function is unreachable, or the
 * user is a guest, the on-device parser splits it instead, so this never fails.
 */
export async function describeMeal(
  text: string,
  region: RegionCode,
  invoke: EdgeFunctionInvoker = invokeEdgeFunction
): Promise<DescribedMeal> {
  const trimmed = text.trim();
  try {
    const body = await invoke('parse-food-text', { text: trimmed });
    if (isParseFoodTextBody(body)) {
      return { analysis: analyzeMealItems(body.items, region, body.slot), splitBy: 'model' };
    }
  } catch (err) {
    console.warn('[mealText] parse-food-text failed; using the on-device parser:', (err as Error)?.message);
  }
  const { slot, items } = parseMealText(trimmed);
  return { analysis: analyzeMealItems(items, region, slot), splitBy: 'device' };
}
