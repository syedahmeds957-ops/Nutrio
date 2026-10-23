import { NormalizedFood, RegionCode } from '../types.js';
import { rankFoods, RankedFood } from '../search-index.js';
import { normalizeToken, synonymsOf } from '../search-normalize.js';

export type MatchStatus = 'matched' | 'ambiguous' | 'unknown';

/**
 * How the item reached its food: every name word given (`exact`), all query
 * words present but the name says more (`whole_words`), or only after a typo
 * correction (`typo`).
 */
export type MatchCertainty = 'exact' | 'whole_words' | 'typo';

export interface MealItemMatch {
  status: MatchStatus;
  /** The best food — for `ambiguous`, the pre-selected choice the user must confirm. */
  food?: NormalizedFood;
  certainty?: MatchCertainty;
  /**
   * The food's name says more than the item did, or names a different dish
   * last: "bacon" → "BBQ Smokey Bacon & Cheese Burger", "lime" → "Fresh Lime
   * Soda". The word is genuinely in the name, but whether it is what was eaten
   * is a guess, so the review screen confirms it.
   */
  loose?: boolean;
  /** Next-best foods, for the review screen's "not this?" list. */
  alternatives: NormalizedFood[];
}

/**
 * Words that never make a food name more specific than the query: joining
 * words, and plain-cooking words — "rice" is "Plain Boiled Basmati Rice", not
 * a different dish from it.
 */
const NEUTRAL_WORDS = new Set(
  [
    'ka', 'ki', 'ke', 'kay', 'with', 'and', 'of', 'in', 'the', 'plain', 'regular', 'simple', 'style',
    'boiled', 'steamed', 'cooked', 'basmati', 'raw', 'home', 'homestyle', 'desi', 'fresh',
  ].map(normalizeToken)
);

/**
 * Candidates considered for ordering. Generous on purpose: search ranks
 * "Seekh Kabab Karahi" (name starts with the query) above "Beef Seekh Kebab",
 * and a small pool cut the plain kebabs before specificity could pick them.
 */
const CANDIDATE_POOL = 80;
const MAX_ALTERNATIVES = 4;
/** A score lead this large (the "name starts with the query" bonus) settles a tie on specificity. */
const DECISIVE_SCORE_GAP = 40;
/**
 * Equally close foods within this calorie spread are the same answer for
 * logging — "roti" as Roti / Chapati or Plain Roti differs by 5% — so asking
 * would only add a tap. Greek yogurt non-fat vs full-fat (59 vs 97) still asks.
 */
const SAME_ANSWER_KCAL_SPREAD = 0.1;

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(normalizeToken)
    .filter((w) => !NEUTRAL_WORDS.has(w));

interface Specificity {
  ranked: RankedFood;
  /**
   * The food's last name word is the query's last word. Dish names put the
   * dish last in English and Urdu alike — Aloo *Samosa*, Samosa *Chaat*, Daal
   * *Chawal* — so for "samosa" a samosa outranks a chaat that starts with one.
   */
  headMatches: boolean;
  /** Name words outside parentheses that the query did not ask for. */
  extraMain: number;
  /** Words inside parentheses the query did not ask for. */
  extraDetail: number;
}

/**
 * How much more a food's name says than the query. A name with "/" lists
 * synonyms ("Roti / Chapati", "Plain Yogurt / Dahi"), so each side is scored on
 * its own and the closest counts: "dahi" is an exact name, not a dish with an
 * extra word "yogurt". Each of the food's `aliases` counts as a side too.
 */
function specificity(ranked: RankedFood, query: QueryWords): Specificity {
  // An Urdu or Arabic query is compared with the food's name in that script;
  // against the English name every word would look "extra". Both scripts share
  // letters, so the Urdu or Arabic name that holds the query's words is used.
  const { food } = ranked;
  const scriptNames = [food.nameUr, food.nameAr].filter((n): n is string => !!n);
  const name = query.isScript
    ? (scriptNames.find((n) => query.covers(words(n))) ?? scriptNames[0] ?? food.name)
    : food.name;
  const main = name.replace(/\(.*?\)/g, ' ');
  const detail = (name.match(/\((.*?)\)/g) ?? []).join(' ');
  const extra = (text: string) => words(text).filter((w) => !query.all.has(w)).length;

  // A synonym side only stands for the food if it names everything asked for:
  // "Beef Seekh Kebab / Kabab" is not an exact "kabab" for "seekh kabab".
  const sides = [...main.split('/'), ...(query.isScript ? [] : (food.aliases ?? []))];
  const coveringSides = sides.filter((side) => query.covers(words(side)));
  const candidates = coveringSides.length > 0 ? coveringSides : [main.replace(/\//g, ' ')];
  const extraMain = Math.min(...candidates.map(extra));
  const headMatches = candidates.some((side) => query.head.has(words(side).at(-1) ?? ''));

  return { ranked, headMatches, extraMain, extraDetail: extra(detail) };
}

/** The query's words, each with its synonym, as specificity compares them. */
interface QueryWords {
  all: Set<string>;
  /** The last query word and its synonym. */
  head: Set<string>;
  /** Written in Urdu or Arabic script rather than Latin letters. */
  isScript: boolean;
  /** True when `nameWords` contains every query word (or its synonym). */
  covers: (nameWords: string[]) => boolean;
}

function queryWordsOf(text: string): QueryWords {
  const groups = words(text).map((w) => [w, ...synonymsOf(w)]);
  return {
    all: new Set(groups.flat()),
    head: new Set(groups.at(-1) ?? []),
    isScript: /[؀-ۿ]/.test(text),
    covers: (nameWords) => groups.every((group) => group.some((w) => nameWords.includes(w))),
  };
}

/** True when every food tied with the best gives about the same calories. */
function tiedFoodsAgree(best: Specificity, ordered: Specificity[]): boolean {
  const tied = ordered.filter((s) => s.headMatches === best.headMatches && s.extraMain === best.extraMain);
  const kcal = best.ranked.food.kcal100g;
  return tied.every((s) => Math.abs(s.ranked.food.kcal100g - kcal) <= kcal * SAME_ANSWER_KCAL_SPREAD);
}

const compareSpecificity = (a: Specificity, b: Specificity) =>
  Number(b.headMatches) - Number(a.headMatches) ||
  a.extraMain - b.extraMain ||
  Number(Boolean(a.ranked.food.brand)) - Number(Boolean(b.ranked.food.brand)) ||
  b.ranked.score - a.ranked.score ||
  a.extraDetail - b.extraDetail;

function isDecisive(best: Specificity, runnerUp: Specificity | undefined): boolean {
  if (!runnerUp) return true;
  if (best.headMatches !== runnerUp.headMatches) return true;
  if (best.extraMain < runnerUp.extraMain) return true;
  return best.ranked.score - runnerUp.ranked.score >= DECISIVE_SCORE_GAP;
}

/**
 * The catalogue food an item names, or `unknown`. Never a partial match: every
 * word of the item must be in the food's name (spelling-folded, or one typo
 * away), so "egg white" can never become "White Shadi Korma". Among foods that
 * qualify, the one whose name adds least to what was said wins — "egg white"
 * is "Egg White (Boiled)", not "Egg White Veg Omelette". When two are equally
 * close, the item is `ambiguous` and the review screen asks.
 */
export function matchMealItem(name: string, region: RegionCode = 'PK'): MealItemMatch {
  const ranked = rankFoods(name, region).slice(0, CANDIDATE_POOL);
  if (ranked.length === 0) return { status: 'unknown', alternatives: [] };

  const query = queryWordsOf(name);
  const ordered = ranked.map((r) => specificity(r, query)).sort(compareSpecificity);
  const [best, runnerUp] = ordered;
  const settled = isDecisive(best, runnerUp) || tiedFoodsAgree(best, ordered);

  const certainty: MatchCertainty = best.ranked.typoCorrected
    ? 'typo'
    : best.extraMain === 0 && best.extraDetail === 0
      ? 'exact'
      : 'whole_words';

  return {
    status: settled ? 'matched' : 'ambiguous',
    food: best.ranked.food,
    certainty,
    loose: !best.headMatches || best.extraMain > 0,
    alternatives: distinctByName(ordered.map((s) => s.ranked.food)).slice(1, 1 + MAX_ALTERNATIVES),
  };
}

/**
 * The first food of each name. Restaurants share dish names ("Classic Cold
 * Coffee with Ice Cream" at three cafes), and a list repeating one name gives
 * the user nothing to choose between.
 */
function distinctByName(foods: NormalizedFood[]): NormalizedFood[] {
  const seen = new Set<string>();
  return foods.filter((food) => {
    const key = food.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
