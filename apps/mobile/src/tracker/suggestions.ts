import type { NormalizedFood, ServingUnit } from '@nutrio/food-db';
import { foodDb } from '../catalogue/index.js';
import type { Region } from '../common/region/index.js';

export type SuggestionSize = 'light' | 'medium' | 'full';

interface SuggestionPart {
  /** Exact catalogue name. */
  foodName: string;
  /** Start of the serving's label, e.g. "1 skewer". */
  serving: string;
  quantity: number;
}

/**
 * The dashboard's meal suggestions, as catalogue entries. Each used to carry
 * its own hand-typed calories and a display name the dashboard matched with
 * `includes`, so "Al Tazaj Half Farrouj (نصف فروج)" matched nothing and the
 * first food in the catalogue, chicken tikka, was logged in its place.
 */
const SUGGESTIONS: Record<Region, Record<SuggestionSize, SuggestionPart[]>> = {
  PK: {
    light: [
      { foodName: 'Boiled Egg (Whole)', serving: '1 egg', quantity: 1 },
      { foodName: 'Cucumber (Raw)', serving: 'Half cucumber', quantity: 1 },
    ],
    medium: [
      { foodName: 'Daal Chana (Cooked)', serving: '1 katori', quantity: 1 },
      { foodName: 'Roti / Chapati (Whole Wheat)', serving: '1 medium roti', quantity: 1 },
    ],
    full: [
      { foodName: 'Chicken Boti (Grilled)', serving: '1 skewer', quantity: 1.5 },
      { foodName: 'Roti / Chapati (Whole Wheat)', serving: '1 medium roti', quantity: 1 },
      { foodName: 'Mint Raita (Podina Yogurt Dip)', serving: '1 standard serving', quantity: 0.5 },
    ],
  },
  SA: {
    light: [
      { foodName: 'Almarai Low Fat Fresh Laban', serving: '1 Glass', quantity: 1 },
      { foodName: 'Boiled Egg (Whole)', serving: '1 egg', quantity: 1 },
    ],
    medium: [
      { foodName: 'Saudi Style Shakshuka', serving: '1 Plate', quantity: 1 },
      { foodName: 'Tamees Bread (Afghani/Saudi Oven Flatbread)', serving: 'Quarter Tamees', quantity: 1 },
    ],
    full: [
      { foodName: 'Al Tazaj Half Charcoal Grilled Farrouj Meal', serving: 'Half Farrouj', quantity: 1 },
      { foodName: 'Green Salad (No Dressing)', serving: '1 small bowl', quantity: 1 },
      { foodName: 'Al Tazaj Tahina Sesame Dip', serving: '1 Tahina Cup', quantity: 0.5 },
    ],
  },
};

export interface SuggestionItem {
  food: NormalizedFood;
  serving: ServingUnit;
  quantity: number;
}

export interface Suggestion {
  size: SuggestionSize;
  items: SuggestionItem[];
  calories: number;
  proteinGrams: number;
}

const resolve = (region: Region, size: SuggestionSize): Suggestion | null => {
  const pool = region === 'SA' ? foodDb().ALL_SAUDI_FOODS : foodDb().PAKISTANI_STAPLES_DATA;
  const items: SuggestionItem[] = [];
  for (const part of SUGGESTIONS[region][size]) {
    const food = pool.find((f) => f.name === part.foodName);
    const serving = food?.servings.find((s) => s.label.startsWith(part.serving));
    // All or nothing: a plate missing one of its foods is not what the card describes.
    if (!food || !serving) return null;
    items.push({ food, serving, quantity: part.quantity });
  }
  const sum = (per100: (f: NormalizedFood) => number) =>
    items.reduce((s, i) => s + (per100(i.food) * i.serving.grams * i.quantity) / 100, 0);
  return {
    size,
    items,
    calories: Math.round(sum((f) => f.kcal100g)),
    proteinGrams: Math.round(sum((f) => f.protein100g) * 10) / 10,
  };
};

/**
 * The largest suggestion that fits in the calories left, so the card's
 * "fits within your remaining" is true; the light one when nothing fits.
 * Every number comes from food-db.
 */
export function suggestionFor(region: Region, remainingCalories: number): Suggestion | null {
  const sizes: SuggestionSize[] = ['full', 'medium', 'light'];
  const resolved = sizes.map((size) => resolve(region, size)).filter((s): s is Suggestion => !!s);
  return resolved.find((s) => s.calories <= remainingCalories) ?? resolved[resolved.length - 1] ?? null;
}
