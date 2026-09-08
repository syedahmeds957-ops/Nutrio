import { NormalizedFood } from './types.js';
import { ALL_EXPANDED_PAKISTANI_FOODS } from './data/index.js';

export interface SearchOptions {
  brand?: string;
  category?: string;
  limit?: number;
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Inverted index map: token -> array of item indices
let tokenIndex: Map<string, number[]> | null = null;

function getIndex(): Map<string, number[]> {
  if (tokenIndex) return tokenIndex;
  tokenIndex = new Map();

  for (let i = 0; i < ALL_EXPANDED_PAKISTANI_FOODS.length; i++) {
    const food = ALL_EXPANDED_PAKISTANI_FOODS[i];
    const tokens = new Set<string>();

    for (const word of tokenize(food.name)) {
      tokens.add(word);
      for (let l = 3; l <= Math.min(6, word.length); l++) {
        tokens.add(word.slice(0, l));
      }
    }
    if (food.nameUr) for (const word of tokenize(food.nameUr)) tokens.add(word);
    if (food.brand) for (const word of tokenize(food.brand)) tokens.add(word);
    if (food.category) for (const word of tokenize(food.category)) tokens.add(word);
    if (food.brandCategory) for (const word of tokenize(food.brandCategory)) tokens.add(word);

    for (const token of tokens) {
      let list = tokenIndex.get(token);
      if (!list) {
        list = [];
        tokenIndex.set(token, list);
      }
      list.push(i);
    }
  }
  return tokenIndex;
}

export function searchPakistaniFoods(
  query: string,
  options?: SearchOptions
): NormalizedFood[] {
  const rawQ = query.trim().toLowerCase();
  if (!rawQ) {
    return options?.brand
      ? ALL_EXPANDED_PAKISTANI_FOODS.filter((f) => f.brand === options.brand)
      : [];
  }

  const queryTokens = tokenize(rawQ);
  if (queryTokens.length === 0) return [];

  const index = getIndex();
  const matchScores = new Map<number, number>();

  for (const qToken of queryTokens) {
    const matchingIndices = index.get(qToken) || [];
    for (const idx of matchingIndices) {
      matchScores.set(idx, (matchScores.get(idx) || 0) + 10);
    }
  }

  const candidates: { food: NormalizedFood; score: number }[] = [];

  for (const [idx, baseScore] of matchScores.entries()) {
    const food = ALL_EXPANDED_PAKISTANI_FOODS[idx];

    if (options?.brand && food.brand !== options.brand) continue;
    if (
      options?.category &&
      food.brandCategory !== options.category &&
      food.category !== options.category
    ) {
      continue;
    }

    let score = baseScore;
    const lowerName = food.name.toLowerCase();

    if (lowerName === rawQ) score += 150;
    else if (lowerName.startsWith(rawQ)) score += 80;
    else if (lowerName.includes(rawQ)) score += 40;

    if (food.nameUr && food.nameUr.includes(rawQ)) score += 60;

    candidates.push({ food, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, options?.limit || 40).map((c) => c.food);
}

export function getSearchIndexStats() {
  const index = getIndex();
  return {
    totalFoods: ALL_EXPANDED_PAKISTANI_FOODS.length,
    totalTokens: index.size,
  };
}

