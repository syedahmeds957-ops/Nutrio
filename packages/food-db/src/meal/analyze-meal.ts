import { RegionCode } from '../types.js';
import { MealItemMatch, matchMealItem } from './match-meal-item.js';
import { MealSlotHint, ParsedMealItem, parseMealText } from './parse-meal-text.js';
import { ResolvedPortion, resolvePortion } from './portion.js';

export type MealItemFlag =
  | 'unknown_food'
  | 'ambiguous_food'
  /** The food's name adds to what was said ("bacon" → a bacon burger). */
  | 'loose_match'
  | 'typo_corrected'
  /** The parser could not settle the amount (a range, a stray number, zero). */
  | 'unclear_quantity'
  | 'needs_portion'
  | 'implausible_amount';

export type MealFlag = 'implausible_meal' | 'nothing_recognised';

export type MealItemConfidence = 'high' | 'medium' | 'low';

export interface MealItemNutrition {
  kcal: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface AnalyzedMealItem {
  parsed: ParsedMealItem;
  match: MealItemMatch;
  /** Absent when the food is unknown. */
  portion?: ResolvedPortion;
  nutrition?: MealItemNutrition;
  flags: MealItemFlag[];
  /** Absent when the food is unknown: there is nothing to be confident in. */
  confidence?: MealItemConfidence;
}

export interface AnalyzedMeal {
  slot?: MealSlotHint;
  items: AnalyzedMealItem[];
  /** Sum over the items that resolved to a food. */
  totals: MealItemNutrition;
  flags: MealFlag[];
  /** True when anything needs the user before the meal can be logged. */
  needsReview: boolean;
}

/** Above these, an amount is far more likely a misreading than a meal. */
export const PLAUSIBILITY_LIMITS = {
  itemKcal: 1500,
  itemGrams: 1500,
  pieceGrams: 400,
  mealKcal: 3000,
} as const;

/**
 * Flags that stop "Log meal" until the user acts on the row. Every way the
 * pipeline can be unsure is here: the rule is that nothing it guessed is ever
 * logged without a tap.
 */
const BLOCKING_FLAGS: ReadonlySet<MealItemFlag> = new Set([
  'unknown_food',
  'ambiguous_food',
  'loose_match',
  'typo_corrected',
  'unclear_quantity',
  'needs_portion',
  'implausible_amount',
]);

export const isBlockingFlag = (flag: MealItemFlag) => BLOCKING_FLAGS.has(flag);

const round1 = (n: number) => Math.round(n * 10) / 10;

function nutritionFor(match: MealItemMatch, portion: ResolvedPortion): MealItemNutrition | undefined {
  const { food } = match;
  if (!food) return undefined;
  const factor = portion.grams / 100;
  return {
    kcal: Math.round(food.kcal100g * factor),
    proteinGrams: round1(food.protein100g * factor),
    carbGrams: round1(food.carb100g * factor),
    fatGrams: round1(food.fat100g * factor),
  };
}

function isImplausible(parsed: ParsedMealItem, portion: ResolvedPortion, kcal: number): boolean {
  if (kcal > PLAUSIBILITY_LIMITS.itemKcal || portion.grams > PLAUSIBILITY_LIMITS.itemGrams) return true;
  const perPiece = portion.grams / Math.max(parsed.quantity, 1);
  return parsed.quantityGiven && parsed.quantity > 1 && perPiece > PLAUSIBILITY_LIMITS.pieceGrams;
}

function confidenceFor(flags: MealItemFlag[], portion: ResolvedPortion): MealItemConfidence {
  if (flags.some(isBlockingFlag)) return 'low';
  if (portion.certainty === 'default_serving' || portion.certainty === 'unit_default') return 'medium';
  return 'high';
}

/** A match that needs no confirmation: decided, word for word, no typo. */
const isOutright = (match: MealItemMatch) =>
  match.status === 'matched' && !match.loose && match.certainty !== 'typo';

/**
 * Chooses how to read the item. "four cheese lover pizza" is a pizza, not four
 * of something; "half fry egg" is a fried egg, not half of one. When the
 * literal reading names a food outright it wins; otherwise the number and
 * unit words are the amount.
 */
function chooseReading(parsed: ParsedMealItem, region: RegionCode): { parsed: ParsedMealItem; match: MealItemMatch } {
  const asAmount = { parsed, match: matchMealItem(parsed.name, region) };
  if (!parsed.literal) return asAmount;
  const literalMatch = matchMealItem(parsed.literal.name, region);
  return isOutright(literalMatch) && !isOutright(asAmount.match)
    ? { parsed: parsed.literal, match: literalMatch }
    : asAmount;
}

/** One described item → catalogue food → grams → nutrition, with what needs checking. */
export function analyzeMealItem(item: ParsedMealItem, region: RegionCode = 'PK'): AnalyzedMealItem {
  const { parsed, match } = chooseReading(item, region);
  const parseFlags: MealItemFlag[] = parsed.issues?.length ? ['unclear_quantity'] : [];

  if (match.status === 'unknown' || !match.food) {
    return { parsed, match, flags: ['unknown_food', ...parseFlags] };
  }

  const portion = resolvePortion(match.food, parsed);
  const nutrition = nutritionFor(match, portion)!;

  const flags: MealItemFlag[] = [...parseFlags];
  if (match.status === 'ambiguous') flags.push('ambiguous_food');
  if (match.loose) flags.push('loose_match');
  if (match.certainty === 'typo') flags.push('typo_corrected');
  if (portion.certainty === 'needs_portion') flags.push('needs_portion');
  if (isImplausible(parsed, portion, nutrition.kcal)) flags.push('implausible_amount');

  return { parsed, match, portion, nutrition, flags, confidence: confidenceFor(flags, portion) };
}

/** Items already split (by the edge function's model, say) → an analysed meal. */
export function analyzeMealItems(
  items: ParsedMealItem[],
  region: RegionCode = 'PK',
  slot?: MealSlotHint
): AnalyzedMeal {
  const analyzed = items.map((item) => analyzeMealItem(item, region));
  const totals = analyzed.reduce<MealItemNutrition>(
    (sum, { nutrition }) =>
      nutrition
        ? {
            kcal: sum.kcal + nutrition.kcal,
            proteinGrams: round1(sum.proteinGrams + nutrition.proteinGrams),
            carbGrams: round1(sum.carbGrams + nutrition.carbGrams),
            fatGrams: round1(sum.fatGrams + nutrition.fatGrams),
          }
        : sum,
    { kcal: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
  );

  const flags: MealFlag[] = [];
  if (analyzed.length === 0) flags.push('nothing_recognised');
  if (totals.kcal > PLAUSIBILITY_LIMITS.mealKcal) flags.push('implausible_meal');

  return {
    ...(slot ? { slot } : {}),
    items: analyzed,
    totals,
    flags,
    needsReview: flags.length > 0 || analyzed.some(({ flags: f }) => f.some(isBlockingFlag)),
  };
}

/**
 * A described meal, end to end, with no language model: "in breakfast i had
 * 4 egg white and 2 whole egg and greek yogurt" → three items, grams, totals,
 * and which rows the review screen must ask about.
 */
export function analyzeMealText(text: string, region: RegionCode = 'PK'): AnalyzedMeal {
  const { slot, items } = parseMealText(text);
  return analyzeMealItems(items, region, slot);
}
