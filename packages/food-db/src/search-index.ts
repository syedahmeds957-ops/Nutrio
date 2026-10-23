import { NormalizedFood, RegionCode } from './types.js';
import { ALL_EXPANDED_PAKISTANI_FOODS, ALL_SAUDI_FOODS } from './data/index.js';
import { closestWords, normalizeToken, stem, synonymsOf } from './search-normalize.js';

export interface SearchOptions {
  brand?: string;
  category?: string;
  limit?: number;
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s؀-ۿ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** The forms a word is indexed and compared under: as typed, and spelling-folded. */
function wordForms(word: string): string[] {
  const stemmed = stem(word);
  const canonical = normalizeToken(word);
  return stemmed === canonical ? [stemmed] : [stemmed, canonical];
}

export const DIET_BASICS_CATEGORY = 'Diet & Basics';

export function isDietBasic(food: NormalizedFood): boolean {
  return food.category === DIET_BASICS_CATEGORY;
}

/**
 * Lifts plain single-ingredient foods above prepared-dish matches, so "egg"
 * surfaces the boiled egg before Egg Fried Rice. Sized to clear the +80
 * name-prefix bonus (diet items are named "Boiled Egg", not "Egg Boiled", so
 * they rarely earn it) while staying under the +150 exact-match bonus — a
 * search for a real dish by name still returns that dish first.
 */
const DIET_BASIC_RANK_BOOST = 50;
const DEFAULT_LIMIT = 40;
const PREFIX_MIN = 3;
const PREFIX_MAX = 6;

/** How one region's catalog differs: its native-script name and brand rules. */
interface RegionCatalog {
  foods: NormalizedFood[];
  scriptName: (food: NormalizedFood) => string | undefined;
  scriptNameBonus: number;
  matchesBrand: (food: NormalizedFood, brand: string) => boolean;
}

interface SearchIndex {
  tokens: Map<string, number[]>;
  /** Spelling-folded name words, for typo correction. */
  vocabulary: Set<string>;
  /** Each food's name as spelling-folded words joined by spaces. */
  canonicalNames: string[];
  /** Each food's `aliases`, folded the same way. */
  canonicalAliases: string[][];
  /**
   * Per food, every form of the words a search may match it on: its name,
   * aliases, native-script name and brand. Category words are deliberately absent —
   * "curry" should find dishes called curry, not everything filed under one.
   */
  matchWords: Set<string>[];
  /** The same, without the brand. */
  dishWords: Set<string>[];
}

const PK_CATALOG: RegionCatalog = {
  foods: ALL_EXPANDED_PAKISTANI_FOODS,
  scriptName: (food) => food.nameUr,
  scriptNameBonus: 60,
  matchesBrand: (food, brand) => food.brand === brand,
};

const SA_CATALOG: RegionCatalog = {
  foods: ALL_SAUDI_FOODS,
  scriptName: (food) => food.nameAr,
  scriptNameBonus: 80,
  matchesBrand: (food, brand) => food.brand === brand || food.brandId === brand,
};

const indexCache = new Map<RegionCatalog, SearchIndex>();

function addNameWordTokens(tokens: Set<string>, word: string): void {
  for (const form of [word, ...wordForms(word)]) {
    tokens.add(form);
    for (let l = PREFIX_MIN; l <= Math.min(PREFIX_MAX, form.length); l++) {
      tokens.add(form.slice(0, l));
    }
  }
}

function buildIndex(catalog: RegionCatalog): SearchIndex {
  const tokens = new Map<string, number[]>();
  const vocabulary = new Set<string>();
  const canonicalNames: string[] = [];
  const canonicalAliases: string[][] = [];
  const matchWords: Set<string>[] = [];
  const dishWords: Set<string>[] = [];

  catalog.foods.forEach((food, i) => {
    const foodTokens = new Set<string>();
    const nameWords = tokenize(food.name);
    const aliasWords = (food.aliases ?? []).flatMap(tokenize);

    for (const word of [...nameWords, ...aliasWords]) {
      addNameWordTokens(foodTokens, word);
      vocabulary.add(normalizeToken(word));
    }
    canonicalNames.push(nameWords.map(normalizeToken).join(' '));
    canonicalAliases.push((food.aliases ?? []).map((alias) => tokenize(alias).map(normalizeToken).join(' ')));
    const withForms = (words: string[]) => new Set(words.flatMap((word) => [word, ...wordForms(word)]));
    const dish = withForms([...nameWords, ...aliasWords, ...tokenize(catalog.scriptName(food) ?? '')]);
    dishWords.push(dish);
    matchWords.push(new Set([...dish, ...withForms(tokenize(food.brand ?? ''))]));

    // Only what `matchWords` can match on: indexing categories or tags would
    // just produce candidates that `keepFullMatches` always drops.
    const otherText = [catalog.scriptName(food) ?? '', food.brand ?? ''];
    for (const text of otherText) {
      for (const word of tokenize(text)) {
        foodTokens.add(word);
        for (const form of wordForms(word)) foodTokens.add(form);
      }
    }

    for (const token of foodTokens) {
      const list = tokens.get(token);
      if (list) list.push(i);
      else tokens.set(token, [i]);
    }
  });

  return { tokens, vocabulary, canonicalNames, canonicalAliases, matchWords, dishWords };
}

function getIndex(catalog: RegionCatalog): SearchIndex {
  let index = indexCache.get(catalog);
  if (!index) {
    index = buildIndex(catalog);
    indexCache.set(catalog, index);
  }
  return index;
}

/**
 * One query word resolved against the index: the forms it may appear under in
 * a food name (including typo corrections), and the foods it hit.
 */
interface ResolvedQueryWord {
  forms: Set<string>;
  hits: Set<number>;
  /** True when the word matched only after a typo correction. */
  corrected: boolean;
}

function lookup(index: SearchIndex, forms: Iterable<string>): Set<number> {
  const hits = new Set<number>();
  for (const form of forms) {
    for (const idx of index.tokens.get(form) ?? []) hits.add(idx);
  }
  return hits;
}

function resolveQueryWord(index: SearchIndex, word: string): ResolvedQueryWord {
  const forms = new Set([...wordForms(word), ...synonymsOf(normalizeToken(word))]);
  const hits = lookup(index, forms);
  if (hits.size > 0) return { forms, hits, corrected: false };

  // Nothing matched as typed, spelling-folded or translated: try the nearest real words.
  const corrections = closestWords(normalizeToken(word), index.vocabulary);
  for (const correction of corrections) forms.add(correction);
  return { forms, hits: lookup(index, corrections), corrected: corrections.length > 0 };
}

interface Candidate {
  idx: number;
  food: NormalizedFood;
  score: number;
}

const hasWholeWord = (words: Set<string>, { forms }: ResolvedQueryWord) =>
  [...forms].some((form) => words.has(form));

const hasWordStartingWith = (words: Set<string>, { forms }: ResolvedQueryWord) =>
  [...forms].some((form) => form.length >= PREFIX_MIN && [...words].some((w) => w.startsWith(form)));

/**
 * Keeps only foods that every query word actually names. Whole words in the
 * dish name first; then allowing the brand ("kfc zinger"), so a biryani from a
 * restaurant called "… Karahi" does not answer "chicken karahi"; then words
 * being typed ("chick" → chicken); failing all, nothing. A dish matching only
 * some of the words — palak dishes and kofta dishes for "palak kofta" — is not
 * what was searched for, so it is never offered as a fallback.
 */
function keepFullMatches(
  candidates: Candidate[],
  queryWords: ResolvedQueryWord[],
  index: SearchIndex,
  allowPrefix: boolean
): Candidate[] {
  for (const words of [index.dishWords, index.matchWords]) {
    const wholeWord = candidates.filter(({ idx }) =>
      queryWords.every((qw) => hasWholeWord(words[idx], qw))
    );
    if (wholeWord.length > 0) return wholeWord;
  }
  if (!allowPrefix) return [];

  return candidates.filter(({ idx }) =>
    queryWords.every(
      (qw) => hasWholeWord(index.matchWords[idx], qw) || hasWordStartingWith(index.matchWords[idx], qw)
    )
  );
}

/** Query words that pick a meat, as opposed to naming the dish. */
const MEAT_WORDS = new Set(['chicken', 'murgh', 'beef', 'mutton', 'goat', 'bakra'].map(normalizeToken));

/** Hand-entered dishes, as opposed to variants derived from them. */
const isPrimaryVariant = (food: NormalizedFood) => food.verifiedBy !== 'composed';

/**
 * One result per dish, at the rank of its best-matching variant. The card
 * starts on the variant the query asked for ("palak chicken"), or on the
 * original dish when the query names no meat — "qeema matar" should open on
 * the hand-entered beef keema, not whichever variant's name happened to
 * contain the words in typed order.
 */
function collapseVariants(ranked: Candidate[], queryWords: ResolvedQueryWord[]): Candidate[] {
  const namesMeat = queryWords.some(({ forms }) => [...forms].some((f) => MEAT_WORDS.has(f)));
  const seenGroups = new Set<string>();
  const result: Candidate[] = [];

  for (const candidate of ranked) {
    const group = candidate.food.variantGroup;
    if (!group) {
      result.push(candidate);
      continue;
    }
    if (seenGroups.has(group)) continue;
    seenGroups.add(group);

    const primary = namesMeat
      ? undefined
      : ranked.find((c) => c.food.variantGroup === group && isPrimaryVariant(c.food));
    result.push(primary ?? candidate);
  }
  return result;
}

const EXACT_NAME_BONUS = 150;

function nameMatchBonus(canonicalName: string, canonicalQuery: string): number {
  if (canonicalName === canonicalQuery) return EXACT_NAME_BONUS;
  if (canonicalName.startsWith(canonicalQuery)) return 80;
  if (canonicalName.includes(canonicalQuery)) return 40;
  return 0;
}

function passesFilters(catalog: RegionCatalog, food: NormalizedFood, options?: SearchOptions): boolean {
  if (options?.brand && !catalog.matchesBrand(food, options.brand)) return false;
  if (
    options?.category &&
    food.brandCategory !== options.category &&
    food.category !== options.category
  ) {
    return false;
  }
  return true;
}

/** A ranked food, with whether reaching it needed a typo correction. */
export interface RankedFood {
  food: NormalizedFood;
  score: number;
  typoCorrected: boolean;
}

interface RankOptions extends SearchOptions {
  /** Let a word being typed match the start of a name word ("chick" → chicken). */
  allowPrefix: boolean;
}

function rankCatalog(catalog: RegionCatalog, query: string, options: RankOptions): RankedFood[] {
  const rawQ = query.trim().toLowerCase();
  const words = tokenize(rawQ);
  if (words.length === 0) return [];

  const index = getIndex(catalog);
  const queryWords = words.map((word) => resolveQueryWord(index, word));
  const typoCorrected = queryWords.some(({ corrected }) => corrected);
  const canonicalQuery = words.map(normalizeToken).join(' ');

  const matchScores = new Map<number, number>();
  for (const { hits } of queryWords) {
    for (const idx of hits) matchScores.set(idx, (matchScores.get(idx) ?? 0) + 10);
  }

  const candidates: Candidate[] = [];
  for (const [idx, baseScore] of matchScores.entries()) {
    const food = catalog.foods[idx];
    if (!passesFilters(catalog, food, options)) continue;

    const scriptName = catalog.scriptName(food);
    const score =
      baseScore +
      Math.max(
        nameMatchBonus(index.canonicalNames[idx], canonicalQuery),
        // Only an alias said in full: "cold" is not a request for a cold drink.
        index.canonicalAliases[idx].includes(canonicalQuery) ? EXACT_NAME_BONUS : 0
      ) +
      (scriptName && scriptName.includes(rawQ) ? catalog.scriptNameBonus : 0) +
      (isDietBasic(food) ? DIET_BASIC_RANK_BOOST : 0);

    candidates.push({ idx, food, score });
  }

  const ranked = keepFullMatches(candidates, queryWords, index, options.allowPrefix).sort(
    (a, b) => b.score - a.score
  );
  return collapseVariants(ranked, queryWords).map(({ food, score }) => ({ food, score, typoCorrected }));
}

function searchCatalog(
  catalog: RegionCatalog,
  query: string,
  options?: SearchOptions
): NormalizedFood[] {
  if (!query.trim()) {
    return options?.brand
      ? catalog.foods.filter((f) => catalog.matchesBrand(f, options.brand as string))
      : [];
  }
  return rankCatalog(catalog, query, { ...options, allowPrefix: true })
    .slice(0, options?.limit || DEFAULT_LIMIT)
    .map((r) => r.food);
}

export function searchPakistaniFoods(query: string, options?: SearchOptions): NormalizedFood[] {
  return searchCatalog(PK_CATALOG, query, options);
}

export function searchSaudiFoods(query: string, options?: SearchOptions): NormalizedFood[] {
  return searchCatalog(SA_CATALOG, query, options);
}

/**
 * Every food whose name contains every word of `query` (spelling-folded or
 * typo-corrected), best first, one per variant group. Unlike search there is
 * no completion of half-typed words: a food logger must never treat "egg" as
 * "eggplant".
 */
export function rankFoods(query: string, region: RegionCode = 'PK'): RankedFood[] {
  return rankCatalog(region === 'SA' ? SA_CATALOG : PK_CATALOG, query, { allowPrefix: false });
}

/**
 * The plain single-ingredient foods for a region, for showing as the default
 * list before the user has typed a search.
 */
export function getDietBasicsForRegion(region: RegionCode = 'PK'): NormalizedFood[] {
  const catalog = region === 'SA' ? ALL_SAUDI_FOODS : ALL_EXPANDED_PAKISTANI_FOODS;
  return catalog.filter(isDietBasic);
}

export function searchFoodsByRegion(
  query: string,
  region: RegionCode = 'PK',
  options?: SearchOptions
): NormalizedFood[] {
  if (region === 'SA') {
    return searchSaudiFoods(query, options);
  }
  return searchPakistaniFoods(query, options);
}

export function getSearchIndexStats() {
  const indexPK = getIndex(PK_CATALOG);
  const indexSA = getIndex(SA_CATALOG);
  return {
    totalFoods: ALL_EXPANDED_PAKISTANI_FOODS.length,
    totalTokens: indexPK.tokens.size,
    totalFoodsPK: ALL_EXPANDED_PAKISTANI_FOODS.length,
    totalTokensPK: indexPK.tokens.size,
    totalFoodsSA: ALL_SAUDI_FOODS.length,
    totalTokensSA: indexSA.tokens.size,
  };
}
