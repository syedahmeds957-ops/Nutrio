import type { NormalizedFood, ServingUnit } from '@nutrio/food-db';
import { foodDb } from '../catalogue/index.js';
import { calculateNutrientsForGrams } from '../tracker/engine.js';
import { defaultServingFor } from '../tracker/personalServings.js';

/** A catalogue dish a coach reply names, with the one serving a chip would log. */
export interface DishMention {
  food: NormalizedFood;
  serving: ServingUnit;
  /** Calories of that serving, from the catalogue's per-100g value (what logging stores). */
  kcal: number;
  /** The words of the reply that matched, as written. */
  matchedText: string;
}

/** Most chips shown under one reply. */
export const MAX_DISH_MENTIONS = 3;
/** Longest dish name, in words, the scan looks for. */
const MAX_NAME_WORDS = 5;

/** Words that never start or end a dish name; keeps "the chicken karahi" matching "chicken karahi". */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'with', 'in', 'on', 'for', 'to', 'is', 'are', 'it', 'at', 'as', 'by',
  'من', 'في', 'مع', 'و', 'على', 'او', 'أو', 'ال',
]);

/** Splits into lowercase words, dropping punctuation and Arabic diacritics. */
function words(text: string, stripParens = false): string[] {
  return (stripParens ? text.replace(/\(.*?\)/g, ' ') : text)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** One word with a trailing plural folded away, so "samosas" meets "Samosa". */
function singular(word: string): string {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

const keyOf = (ws: string[]): string => ws.map(singular).join(' ');

/** Every name a food answers to: name, aliases and Arabic name, each without any "(style)" suffix. */
function nameKeys(food: NormalizedFood): string[] {
  const keys = new Set<string>();
  for (const name of [food.name, food.nameAr, ...(food.aliases ?? [])]) {
    if (!name) continue;
    const ws = words(name, true);
    if (ws.length > 0 && ws.length <= MAX_NAME_WORDS) keys.add(keyOf(ws));
  }
  return [...keys];
}

type NameIndex = Map<string, NormalizedFood>;
const indexCache = new WeakMap<readonly NormalizedFood[], NameIndex>();

/** name key -> the first catalogue food with that name, so a variant dish resolves the same way every time. */
function indexFoods(foods: readonly NormalizedFood[]): NameIndex {
  const cached = indexCache.get(foods);
  if (cached) return cached;
  const index: NameIndex = new Map();
  for (const food of foods) {
    // A food with no energy (water) is never worth a log chip.
    if (!(food.kcal100g > 0)) continue;
    // A spoonful of oil, ghee or sugar is an ingredient a reply mentions in passing, not a dish it suggests.
    const defaultServing = food.servings.find((sv) => sv.isDefault) ?? food.servings[0];
    if (defaultServing && /\b(tsp|tbsp)\b/i.test(defaultServing.label)) continue;
    for (const key of nameKeys(food)) if (!index.has(key)) index.set(key, food);
  }
  indexCache.set(foods, index);
  return index;
}

function regionFoods(region: 'PK' | 'SA'): readonly NormalizedFood[] {
  const db = foodDb();
  return region === 'SA' ? db.ALL_SAUDI_FOODS : db.ALL_EXPANDED_PAKISTANI_FOODS;
}

/**
 * The catalogue dishes a piece of text names, at most three, longest name first.
 *
 * A dish counts only when its whole name (or a whole alias, or its Arabic
 * name) appears as consecutive words: "chicken karahi" finds Chicken Karahi,
 * while "rice" or "chicken" alone find nothing, because no dish is called that.
 * A longer match uses up its words, so "chicken biryani" never also yields a
 * shorter dish named inside it. Results come back in the order they appear.
 * The food and serving are the catalogue's (or the user's own saved serving);
 * nothing is read from the text but the names.
 *
 * `foods` is for tests; by default the region's catalogue, which must be loaded.
 */
export function findDishMentions(
  text: string,
  region: 'PK' | 'SA',
  options: { foods?: readonly NormalizedFood[]; max?: number; servingLabel?: string } = {},
): DishMention[] {
  const max = options.max ?? MAX_DISH_MENTIONS;
  const tokens = words(text);
  if (tokens.length === 0 || max <= 0) return [];
  const index = indexFoods(options.foods ?? regionFoods(region));

  const used = new Array<boolean>(tokens.length).fill(false);
  const found: { start: number; food: NormalizedFood; matchedText: string }[] = [];
  const seen = new Set<NormalizedFood>();

  for (let n = Math.min(MAX_NAME_WORDS, tokens.length); n >= 1; n--) {
    for (let start = 0; start + n <= tokens.length; start++) {
      const slice = tokens.slice(start, start + n);
      if (STOPWORDS.has(slice[0]) || STOPWORDS.has(slice[n - 1])) continue;
      if (used.slice(start, start + n).some(Boolean)) continue;
      const food = index.get(keyOf(slice));
      if (!food || seen.has(food)) continue;
      for (let i = start; i < start + n; i++) used[i] = true;
      seen.add(food);
      found.push({ start, food, matchedText: slice.join(' ') });
    }
  }

  // Longest names were found first; keep the best `max`, then read them in text order.
  const label = options.servingLabel ?? 'My serving';
  return found
    .slice(0, max)
    .sort((a, b) => a.start - b.start)
    .flatMap(({ food, matchedText }) => {
      const serving = defaultServingFor(food, food.id || food.name, label);
      if (!serving) return [];
      return [{ food, serving, kcal: calculateNutrientsForGrams(food, serving.grams).calories, matchedText }];
    });
}
