import type { AnalyzedMeal, AnalyzedMealItem, MealItemFlag, NormalizedFood, ParsedMealItem, ServingUnit } from '@nutrio/food-db';
import { foodDb } from '../catalogue/index.js';
import { calculateNutrientsForGrams } from './engine.js';

/**
 * A row on the describe-your-meal review screen.
 *
 * - `ready`: matched outright, or the user has confirmed it.
 * - `needs_confirm`: the pipeline guessed (several possible foods, a typo
 *   fixed, an amount it could not pin down); the user must accept or change it.
 * - `unknown`: nothing in the catalogue; the user adds it as their own dish or
 *   removes the row.
 *
 * Nothing guessed is ever logged without a tap (spec R7).
 */
export type DraftRowStatus = 'ready' | 'needs_confirm' | 'unknown';

export interface DraftRow {
  key: string;
  parsed: ParsedMealItem;
  status: DraftRowStatus;
  /** Why the row needs the user, for the label under it. */
  flags: MealItemFlag[];
  food?: NormalizedFood;
  alternatives: NormalizedFood[];
  /** One unit of the amount, e.g. "1 egg white (33g)". */
  serving?: ServingUnit;
  /** How many of `serving`. */
  quantity: number;
}

export interface RowNutrition {
  kcal: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  grams: number;
}

/** Flags that leave a matched row usable once the user has looked at it. */
const NEEDS_CONFIRM: ReadonlySet<MealItemFlag> = new Set([
  'ambiguous_food',
  'loose_match',
  'typo_corrected',
  'unclear_quantity',
  'needs_portion',
  'implausible_amount',
]);

const MAX_QUANTITY = 50;

/**
 * Splits a resolved portion into one unit and a count, so the diary reads
 * "4 × 1 egg white (33g)" rather than "1 × 132 g". A weight the user typed
 * stays as one row of that weight.
 */
function servingFor(
  parsed: ParsedMealItem,
  portion: { grams: number; servingLabel: string; certainty: string }
): { serving: ServingUnit; quantity: number } {
  const count = parsed.quantity > 0 ? parsed.quantity : 1;
  if (portion.certainty === 'exact_grams' || count === 1) {
    const label = portion.certainty === 'exact_grams' ? `${portion.grams}g` : portion.servingLabel;
    return { serving: { label, grams: portion.grams, isDefault: false }, quantity: 1 };
  }
  return {
    serving: { label: portion.servingLabel, grams: Math.round((portion.grams / count) * 10) / 10, isDefault: false },
    quantity: count,
  };
}

function rowFromItem(item: AnalyzedMealItem, index: number): DraftRow {
  const base = {
    key: `row_${index}_${item.parsed.name}`,
    parsed: item.parsed,
    flags: item.flags,
    alternatives: item.match.alternatives,
  };
  if (!item.match.food || !item.portion) {
    return { ...base, status: 'unknown', quantity: item.parsed.quantity || 1 };
  }
  const { serving, quantity } = servingFor(item.parsed, item.portion);
  return {
    ...base,
    status: item.flags.some((f) => NEEDS_CONFIRM.has(f)) ? 'needs_confirm' : 'ready',
    food: item.match.food,
    serving,
    quantity,
  };
}

export function draftFromAnalysis(meal: AnalyzedMeal): DraftRow[] {
  return meal.items.map(rowFromItem);
}

/**
 * The user picked a food for the row: an alternative, or a dish they just
 * added. The amount is worked out again for that food, and the row is ready
 * because the user chose it.
 */
export function chooseFood(row: DraftRow, food: NormalizedFood): DraftRow {
  const portion = foodDb().resolvePortion(food, row.parsed);
  const { serving, quantity } = servingFor(row.parsed, portion);
  const alternatives = [row.food, ...row.alternatives].filter(
    (f): f is NormalizedFood => !!f && (f.id ?? f.name) !== (food.id ?? food.name)
  );
  return { ...row, status: 'ready', flags: [], food, serving, quantity, alternatives };
}

/** The user accepted the pipeline's guess as it stands. */
export function confirmRow(row: DraftRow): DraftRow {
  return row.food ? { ...row, status: 'ready', flags: [] } : row;
}

/** A typed weight past this is a slip of the thumb, not one food. */
export const MAX_ROW_GRAMS = 2000;

/** The user picked one of the food's own servings ("1 katori (150g)"): one of it. */
export function setRowServing(row: DraftRow, serving: ServingUnit): DraftRow {
  if (!row.food || !(serving.grams > 0)) return row;
  return { ...row, serving: { ...serving, isDefault: false }, quantity: 1 };
}

/**
 * The user typed the weight they ate. It replaces the serving with exactly that
 * many grams, so "120" means 120 g however the item was first read.
 */
export function setRowGrams(row: DraftRow, grams: number): DraftRow {
  if (!row.food || !Number.isFinite(grams) || grams <= 0) return row;
  const g = Math.min(MAX_ROW_GRAMS, Math.round(grams));
  return { ...row, serving: { label: `${g}g`, grams: g, isDefault: false }, quantity: 1 };
}

/** The food's own serving sizes worth offering as chips: distinct, real weights, at most `limit`. */
export function servingChoices(row: DraftRow, limit = 4): ServingUnit[] {
  const seen = new Set<string>();
  return (row.food?.servings ?? [])
    .filter((s) => s.grams > 0 && !seen.has(s.label) && seen.add(s.label))
    .slice(0, limit);
}

export function setRowQuantity(row: DraftRow, quantity: number): DraftRow {
  const next = Math.min(MAX_QUANTITY, Math.max(0.5, Math.round(quantity * 2) / 2));
  return { ...row, quantity: next };
}

/** Calories and macros from the catalogue for the row's food and amount. */
export function rowNutrition(row: DraftRow): RowNutrition | undefined {
  if (!row.food || !row.serving) return undefined;
  const grams = Math.round(row.serving.grams * row.quantity);
  const n = calculateNutrientsForGrams(row.food, grams);
  return {
    kcal: n.calories,
    proteinGrams: n.proteinGrams,
    carbGrams: n.carbGrams,
    fatGrams: n.fatGrams,
    grams,
  };
}

export function draftTotals(rows: DraftRow[]): RowNutrition {
  return rows.reduce<RowNutrition>(
    (sum, row) => {
      const n = rowNutrition(row);
      return n
        ? {
            kcal: sum.kcal + n.kcal,
            proteinGrams: sum.proteinGrams + n.proteinGrams,
            carbGrams: sum.carbGrams + n.carbGrams,
            fatGrams: sum.fatGrams + n.fatGrams,
            grams: sum.grams + n.grams,
          }
        : sum;
    },
    { kcal: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0, grams: 0 }
  );
}

/** "Log meal" is allowed only when every row is settled and there is something to log. */
export function canLogDraft(rows: DraftRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.status === 'ready');
}

export interface DraftLogEntry {
  food: NormalizedFood;
  serving: ServingUnit;
  quantity: number;
}

export function toLogEntries(rows: DraftRow[]): DraftLogEntry[] {
  return rows.flatMap((r) =>
    r.status === 'ready' && r.food && r.serving
      ? [{ food: r.food, serving: r.serving, quantity: r.quantity }]
      : []
  );
}
