import type { MealSlot } from './types.js';
import type { Region } from '../common/region/index.js';
import { slotAllows } from './dietSlotOrder.js';

interface ForYouFood {
  name: string;
  cuisineTags?: string[];
  kcal100g?: number;
  servings?: { label: string; grams: number; kcal?: number; isDefault?: boolean }[];
}

interface ForYouSection<F extends ForYouFood> {
  group: string;
  foods: F[];
}

/** The catalogue's mealtime tag for each slot. */
const SLOT_TAG: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks_chai: 'Snack',
};

const REGION_TAG: Record<Region, string> = { PK: 'Pakistani', SA: 'Saudi' };

/** Add-ons and drinks are not something to open the logger on. */
const SKIPPED_GROUPS = new Set(['extras', 'beverages']);

/**
 * The least a default serving must carry to stand as the meal: a 30 g spoon of
 * dip or a glass of smoothie is not dinner. Snacks have no floor.
 */
const MIN_MEAL_KCAL: Record<MealSlot, number> = { breakfast: 120, lunch: 150, dinner: 150, snacks_chai: 0 };

/** Calories in the serving a tap would log, or null when the catalogue entry does not say. */
function defaultServingKcal(food: ForYouFood): number | null {
  const serving = food.servings?.find((s) => s.isDefault) ?? food.servings?.[0];
  if (!serving) return null;
  if (typeof serving.kcal === 'number') return serving.kcal;
  return typeof food.kcal100g === 'number' ? (serving.grams * food.kcal100g) / 100 : null;
}

/** A drink is poured, not plated: it does not open breakfast, lunch or dinner. */
function isLiquidServing(food: ForYouFood): boolean {
  const serving = food.servings?.find((s) => s.isDefault) ?? food.servings?.[0];
  return Boolean(serving && /\bml\b|\bglass\b/i.test(serving.label));
}

/** The group each meal is most often made of, so a dish beats a loose ingredient. */
const LEADING_GROUPS: Record<MealSlot, string[]> = {
  breakfast: ['meals', 'protein'],
  lunch: ['meals'],
  dinner: ['meals'],
  snacks_chai: ['snacks', 'nuts_seeds'],
};

/**
 * What "For you" opens on for someone with no history: foods of this region
 * that suit this meal, best first. A food scores for its mealtime tag, its
 * region tag and for being a dish rather than a loose ingredient, so Saudi
 * breakfast starts on a Saudi breakfast dish and a snack on a snack, not on
 * the first fruit in the catalogue. Only the choice and order come from here;
 * every number still comes from the catalogue.
 */
export function suggestedForSlot<F extends ForYouFood>(
  sections: ForYouSection<F>[],
  slot: MealSlot,
  region: Region,
  limit = 8
): F[] {
  const scored: { food: F; score: number; order: number }[] = [];
  let order = 0;
  for (const { group, foods } of sections) {
    if (SKIPPED_GROUPS.has(group)) continue;
    for (const food of foods) {
      order += 1;
      if (!slotAllows(group, food, slot)) continue;
      if (slot !== 'snacks_chai') {
        const kcal = defaultServingKcal(food);
        if (kcal !== null && kcal < MIN_MEAL_KCAL[slot]) continue;
        if (isLiquidServing(food)) continue;
      }
      const tags = food.cuisineTags ?? [];
      let score = 0;
      if (tags.includes(SLOT_TAG[slot])) score += 4;
      if (tags.includes(REGION_TAG[region])) score += 3;
      if (LEADING_GROUPS[slot].includes(group)) score += 2;
      // Needs a real reason: the mealtime tag, or a regional dish of the leading kind.
      if (score < 4) continue;
      scored.push({ food, score, order });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.food);
}
