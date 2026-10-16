import { FoodServingItem, NormalizedFood } from '../types.js';
import { ParsedMealItem } from './parse-meal-text.js';
import { UNIT_DEFAULT_GRAMS, UNIT_SERVING_PATTERN } from './units.js';

/**
 * Where an item's grams came from, best first. `needs_portion` means the
 * amount is a guess the user must confirm — chiefly a count ("4 kebabs")
 * against a food that only has a generic bowl serving.
 */
export type PortionCertainty =
  | 'exact_grams'
  | 'food_serving'
  | 'unit_default'
  | 'default_serving'
  | 'needs_portion';

export interface ResolvedPortion {
  grams: number;
  /** The serving the amount was counted in, e.g. "1 egg white (33g)". */
  servingLabel: string;
  certainty: PortionCertainty;
}

/** Placeholder servings that say nothing about one piece of the food. */
const GENERIC_SERVING = /standard serving|^half portion|^double portion/i;
/** Serving labels that are containers or weights, not pieces. */
const CONTAINER_SERVING = /\b(katori|bowl|katora|plate|cup|mug|glass|tbsp|tsp|spoon|ml|litre)\b|^\d+\s*g\b/i;

const isGeneric = (s: FoodServingItem) => GENERIC_SERVING.test(s.label);
const defaultServingOf = (food: NormalizedFood) =>
  food.servings.find((s) => s.isDefault) ?? food.servings[0];

/** The food's serving for one piece, if it has one ("1 egg (50g)", "1 seekh (60g)"). */
function pieceServing(food: NormalizedFood): FoodServingItem | undefined {
  const pieces = food.servings.filter((s) => !isGeneric(s) && !CONTAINER_SERVING.test(s.label));
  return pieces.find((s) => s.isDefault) ?? pieces[0];
}

const round = (n: number) => Math.round(n);

/**
 * Turns "how much" into grams for one matched food. A count multiplies a
 * per-piece serving, never a generic 200g bowl: "4 egg white" is 4 × 33g. A
 * container unit uses the food's own serving of that kind when it has one,
 * otherwise a standard size (katori 150g, glass 250g, pao 250g).
 */
export function resolvePortion(food: NormalizedFood, item: ParsedMealItem): ResolvedPortion {
  const { quantity, unit } = item;
  const fallback = defaultServingOf(food);
  const fallbackGrams = fallback?.grams ?? 100;
  const fallbackLabel = fallback?.label ?? '100g';

  if (item.grams !== undefined) {
    return { grams: round(item.grams), servingLabel: `${round(item.grams)}g`, certainty: 'exact_grams' };
  }

  if (unit === 'serving') {
    return { grams: round(fallbackGrams * quantity), servingLabel: fallbackLabel, certainty: 'default_serving' };
  }

  if (unit === 'piece') {
    const piece = pieceServing(food);
    return piece
      ? { grams: round(piece.grams * quantity), servingLabel: piece.label, certainty: 'food_serving' }
      : { grams: round(fallbackGrams * quantity), servingLabel: fallbackLabel, certainty: 'needs_portion' };
  }

  if (unit) {
    const pattern = UNIT_SERVING_PATTERN[unit];
    const own = pattern ? food.servings.find((s) => pattern.test(s.label)) : undefined;
    if (own) return { grams: round(own.grams * quantity), servingLabel: own.label, certainty: 'food_serving' };
    const unitGrams = UNIT_DEFAULT_GRAMS[unit];
    return { grams: round(unitGrams * quantity), servingLabel: `1 ${unit} (${unitGrams}g)`, certainty: 'unit_default' };
  }

  // No unit: a bare count means pieces when the food has them ("2 roti").
  const piece = pieceServing(food);
  if (piece && item.quantityGiven) {
    return { grams: round(piece.grams * quantity), servingLabel: piece.label, certainty: 'food_serving' };
  }
  if (fallback && !isGeneric(fallback)) {
    return { grams: round(fallbackGrams * quantity), servingLabel: fallbackLabel, certainty: 'food_serving' };
  }
  // A generic serving: fine for "chicken karahi", a guess for "3 chicken karahi".
  return {
    grams: round(fallbackGrams * quantity),
    servingLabel: fallbackLabel,
    certainty: item.quantityGiven && quantity !== 1 ? 'needs_portion' : 'default_serving',
  };
}
