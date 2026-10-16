import { MealUnit, NUMBER_WORDS, UNIT_ALIASES, WEIGHT_UNITS } from './units.js';

export type MealSlotHint = 'breakfast' | 'lunch' | 'dinner' | 'snacks_chai';

/**
 * Something about the amount the parser could not settle on its own. Each one
 * makes the review screen ask rather than guess.
 */
export type ParseIssue =
  /** A second number beside the quantity ("2 roti 3"). */
  | 'extra_number'
  /** A range ("2-3 roti"). */
  | 'range'
  /** Zero, or a fraction over zero ("0 roti", "1/0"). */
  | 'invalid_quantity'
  /** A count and a weight that may or may not multiply ("2 roti 100g"). */
  | 'count_with_weight';

/** One item as the user described it, before any catalogue lookup. */
export interface ParsedMealItem {
  /** The segment as typed, for showing back on the review screen. */
  text: string;
  /** What to look up: the segment without quantity, unit or filler words. */
  name: string;
  quantity: number;
  /** False when no number was given ("greek yogurt" rather than "1 greek yogurt"). */
  quantityGiven: boolean;
  unit?: MealUnit;
  /** Set when the user gave a weight or volume ("200g", "250 ml"). */
  grams?: number;
  issues?: ParseIssue[];
  /**
   * The same segment read with its number and unit words kept as part of the
   * name — "four cheese pizza", "half fry egg", "pao bhaji". The analyser uses
   * it when it names a food outright.
   */
  literal?: Omit<ParsedMealItem, 'literal'>;
}

export interface ParsedMeal {
  slot?: MealSlotHint;
  items: ParsedMealItem[];
}

const SLOTS: ReadonlyArray<readonly [string, MealSlotHint]> = [
  ['breakfast|nashta|nashtay|nashtey|subah', 'breakfast'],
  ['lunch|dopahar|dopehar', 'lunch'],
  ['dinner|supper|raat', 'dinner'],
  ['snacks?|evening tea|chai time', 'snacks_chai'],
];
const ANY_SLOT = SLOTS.map(([words]) => words).join('|');
const SLOT_OF = (word: string) => SLOTS.find(([words]) => new RegExp(`^(?:${words})$`).test(word))?.[1];

/**
 * A slot word counts only as a phrase — "for dinner", "nashtay mein", or the
 * very start of the text ("dinner: aloo gosht") — so "2 dinner rolls" is not a
 * slot and "breakfast cereal for dinner" is dinner.
 */
const SLOT_WITH_PREPOSITION = new RegExp(
  `\\b(?:in|for|at|during)\\s+(?:my\\s+)?(${ANY_SLOT})\\b(?:\\s+(?:mein|main|me|mai|ko))?|\\b(${ANY_SLOT})\\s+(?:mein|main|me|mai|ko)\\b`,
  'g'
);
const SLOT_AT_START = new RegExp(`^\\s*(${ANY_SLOT})\\b\\s*:?`);

/** Words that carry no food: pronouns, eating verbs (English and Roman Urdu), hedges. */
const FILLER_WORDS = new Set([
  'i', 'ive', "i've", 'we', 'my', 'me', 'had', 'have', 'has', 'ate', 'eat', 'eaten', 'eating',
  'took', 'take', 'drank', 'drink', 'drinking', 'also', 'then', 'today', 'just', 'only', 'some',
  'about', 'around', 'approx', 'approximately', 'like', 'the', 'of', 'was', 'were', 'is',
  'aaj', 'maine', 'mainay', 'mene', 'ne', 'khaya', 'khayi', 'khaye', 'khai', 'kha', 'liya',
  'li', 'liye', 'piya', 'pi', 'pee', 'peeya', 'bhi', 'tha', 'thi', 'thay', 'hai', 'hain',
]);

/**
 * Item separators: punctuation and joining words. A full stop or comma
 * separates only outside a number, so "1.5kg" and "1,5 roti" stay one amount.
 */
const SEPARATORS = /[;+&\n]|(?<!\d),|,(?!\d)|(?<!\d)\.|\.(?!\d)|\b(?:and|aur|plus|with|along with|sath|saath|then)\b|\s+اور\s+/;

const WEIGHT = /^(\d+(?:\.\d+)?)\s*(g|gm|gms|gr|gram|grams|kg|kilo|ml|l|litre|liter)$/;
const NUMBER = /^\d+(?:\.\d+)?$/;
const FRACTION = /^(\d+)\/(\d+)$/;
const RANGE = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/;
const TIMES = /^(?:x|×)$/;
const UNICODE_FRACTIONS: Readonly<Record<string, number>> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

/** Urdu (۰–۹) and Arabic-Indic (٠–٩) digits read as ASCII. */
const toAsciiDigits = (text: string) =>
  text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/** "one and a half", "do aur aadha" → "1.5" before "and"/"aur" can split them. */
function joinSpokenHalves(text: string): string {
  return text.replace(
    /\b([a-z]+|\d+)\s+(?:and|aur)\s+(?:a\s+)?(?:half|aadha|aadhi)\b/g,
    (whole, word: string) => {
      const n = NUMBER.test(word) ? Number(word) : NUMBER_WORDS[word];
      return n !== undefined && n >= 1 ? String(n + 0.5) : whole;
    }
  );
}

function detectSlot(text: string): { slot?: MealSlotHint; rest: string } {
  let slot: MealSlotHint | undefined;
  let rest = text.replace(SLOT_WITH_PREPOSITION, (_m, a?: string, b?: string) => {
    slot ??= SLOT_OF(a ?? b ?? '');
    return ' ';
  });
  rest = rest.replace(SLOT_AT_START, (_m, word: string) => {
    slot ??= SLOT_OF(word);
    return ' ';
  });
  return { ...(slot ? { slot } : {}), rest };
}

type Token =
  | { kind: 'weight'; grams: number }
  | { kind: 'number'; value: number; spoken: boolean; raw: string }
  | { kind: 'range'; value: number }
  | { kind: 'invalid' }
  | { kind: 'unit'; unit: MealUnit; raw: string }
  | { kind: 'times' }
  | { kind: 'filler' }
  | { kind: 'word'; raw: string };

function classify(raw: string): Token {
  const weight = raw.match(WEIGHT);
  if (weight) return { kind: 'weight', grams: Number(weight[1]) * WEIGHT_UNITS[weight[2]] };
  if (NUMBER.test(raw)) return { kind: 'number', value: Number(raw), spoken: false, raw };
  if (UNICODE_FRACTIONS[raw] !== undefined) return { kind: 'number', value: UNICODE_FRACTIONS[raw], spoken: false, raw };
  const fraction = raw.match(FRACTION);
  if (fraction) {
    return Number(fraction[2]) === 0
      ? { kind: 'invalid' }
      : { kind: 'number', value: Number(fraction[1]) / Number(fraction[2]), spoken: false, raw };
  }
  const range = raw.match(RANGE);
  if (range) return { kind: 'range', value: (Number(range[1]) + Number(range[2])) / 2 };
  if (TIMES.test(raw)) return { kind: 'times' };
  if (NUMBER_WORDS[raw] !== undefined) return { kind: 'number', value: NUMBER_WORDS[raw], spoken: true, raw };
  if (UNIT_ALIASES[raw]) return { kind: 'unit', unit: UNIT_ALIASES[raw], raw };
  if (FILLER_WORDS.has(raw)) return { kind: 'filler' };
  return { kind: 'word', raw };
}

/** Joins "200 g" → "200g", "1 1/2" → "1.5" and "3 ½" → "3.5" so each is one token. */
function joinTokens(raw: string[]): string[] {
  const joined: string[] = [];
  for (const token of raw) {
    const previous = joined[joined.length - 1];
    if (previous && NUMBER.test(previous)) {
      if (WEIGHT_UNITS[token] !== undefined) {
        joined[joined.length - 1] = `${previous}${token}`;
        continue;
      }
      const fraction = token.match(FRACTION);
      const unicode = UNICODE_FRACTIONS[token];
      if ((fraction && Number(fraction[2]) !== 0 && Number(fraction[1]) < Number(fraction[2])) || unicode !== undefined) {
        const part = unicode ?? Number(fraction![1]) / Number(fraction![2]);
        joined[joined.length - 1] = String(Number(previous) + part);
        continue;
      }
    }
    joined.push(token);
  }
  return joined;
}

/**
 * Reads one segment. Quantity and unit come only from before or after the food
 * name — "2 plate biryani", "biryani 2 plate" — never from inside it, so
 * "kung pao chicken" keeps its "pao". With `literal`, spoken numbers and unit
 * words are kept as name words throughout.
 */
function readSegment(segment: string, literal: boolean): Omit<ParsedMealItem, 'literal'> | undefined {
  const tokens = joinTokens(segment.split(/\s+/).filter(Boolean)).map(classify);
  const isNameWord = (t: Token) =>
    t.kind === 'word' || (literal && ((t.kind === 'number' && t.spoken) || t.kind === 'unit'));
  const first = tokens.findIndex(isNameWord);
  const last = tokens.length - 1 - [...tokens].reverse().findIndex(isNameWord);

  const nameWords: string[] = [];
  const issues = new Set<ParseIssue>();
  let quantity: number | undefined;
  let unit: MealUnit | undefined;
  let grams: number | undefined;
  let times = false;
  /** A lone spoken number or unit word with no food beside it ("chay", "dhai"). */
  let loneWord: string | undefined;

  tokens.forEach((token, i) => {
    const inName = first !== -1 && i >= first && i <= last;
    if (inName) {
      if (token.kind === 'word' || token.kind === 'number' || token.kind === 'unit') nameWords.push(token.raw);
      return;
    }
    switch (token.kind) {
      case 'weight':
        if (grams === undefined) grams = token.grams;
        else issues.add('extra_number');
        break;
      case 'number':
        if (quantity === undefined) {
          quantity = token.value;
          if (token.spoken) loneWord = token.raw;
        } else issues.add('extra_number');
        break;
      case 'range':
        if (quantity === undefined) quantity = token.value;
        issues.add('range');
        break;
      case 'invalid':
        issues.add('invalid_quantity');
        break;
      case 'unit':
        if (!unit) {
          unit = token.unit;
          loneWord = loneWord === undefined && quantity === undefined ? token.raw : undefined;
        }
        break;
      case 'times':
        times = true;
        break;
      default:
        break;
    }
  });

  let name = nameWords.join(' ').trim();
  if (!name) {
    // "chay" (tea) is also the number six, and "dhai" (a misspelling of dahi)
    // is two and a half. Alone in a segment they are the food, not an amount.
    if (!loneWord || tokens.filter((t) => t.kind !== 'filler').length !== 1) return undefined;
    name = loneWord;
    quantity = undefined;
    unit = undefined;
  }

  if (quantity === 0) issues.add('invalid_quantity');
  if (grams !== undefined && quantity !== undefined && quantity !== 1) {
    if (times) grams *= quantity;
    else issues.add('count_with_weight');
  }

  return {
    text: segment.trim(),
    name,
    quantity: quantity ?? 1,
    quantityGiven: quantity !== undefined,
    ...(unit ? { unit } : {}),
    ...(grams !== undefined ? { grams } : {}),
    ...(issues.size > 0 ? { issues: [...issues] } : {}),
  };
}

function parseSegment(segment: string): ParsedMealItem | undefined {
  const read = readSegment(segment, false);
  const literal = readSegment(segment, true);
  if (!read) return literal;
  return literal && literal.name !== read.name ? { ...read, literal } : read;
}

/**
 * Splits a described meal into items without a language model: "in breakfast
 * i had 4 egg white and 2 whole egg and greek yogurt" → breakfast, with
 * egg white ×4, whole egg ×2, greek yogurt ×1. The edge function's model does
 * the same job better on messy input; this is its offline fallback and the
 * reference the golden sentence set is checked against.
 */
export function parseMealText(text: string): ParsedMeal {
  const prepared = joinSpokenHalves(toAsciiDigits(text.toLowerCase().replace(/['’]/g, "'")));
  const { slot, rest } = detectSlot(prepared);

  const items = rest
    .split(SEPARATORS)
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.replace(/[^\p{L}\p{N}\s./½¼¾'×-]/gu, ' ').trim())
    .filter(Boolean)
    .map(parseSegment)
    .filter((item): item is ParsedMealItem => item !== undefined);

  return { ...(slot ? { slot } : {}), items };
}

/** Reads one already-separated item ("2 roti", "1 katori daal") — for a model's item names. */
export function parseMealItemText(text: string): ParsedMealItem | undefined {
  return parseMealText(text).items[0];
}
