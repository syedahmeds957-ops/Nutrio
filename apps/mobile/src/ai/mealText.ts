import type { AnalyzedMeal, MealSlotHint, ParsedMealItem, RegionCode } from '@nutrio/food-db';
import { foodDb } from '../catalogue/index.js';
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

// Meal words the on-device parser doesn't know (it reads English and Roman Urdu).
const ARABIC_MEAL_WORD = /فطور|إفطار|افطار|غداء|عشاء|سناك|وجبة خفيفة/;

/**
 * The model tends to guess a meal from the foods ("daal and roti" → lunch).
 * A guess must never replace the meal the user already picked, so its slot
 * counts only when the sentence itself names one.
 */
function namedSlot(text: string, modelSlot: MealSlotHint | undefined): MealSlotHint | undefined {
  const fromDevice = foodDb().parseMealText(text).slot;
  if (fromDevice) return modelSlot ?? fromDevice;
  return ARABIC_MEAL_WORD.test(text) ? modelSlot : undefined;
}

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
      return { analysis: foodDb().analyzeMealItems(body.items, region, namedSlot(trimmed, body.slot)), splitBy: 'model' };
    }
  } catch (err) {
    console.warn('[mealText] parse-food-text failed; using the on-device parser:', (err as Error)?.message);
  }
  const { slot, items } = foodDb().parseMealText(trimmed);
  return { analysis: foodDb().analyzeMealItems(items, region, slot), splitBy: 'device' };
}
