/**
 * Roman Urdu has no standard spelling: the same dish is typed "aloo gosht",
 * "aalu ghosht" or "alu gosht". These rules fold the common variants onto one
 * canonical form so the index and the query meet in the middle. The forms are
 * never shown to users — they only need to agree with each other, not read well.
 */
const SPELLING_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^keb/, 'kab'], // kebab → kabab
  [/q/g, 'k'], // qeema → keema, qorma → korma
  [/([gbd])h/g, '$1'], // ghosht → gosht, gobhi → gobi, dhaba → daba
  [/oo/g, 'u'], // aloo → alu
  [/ee/g, 'i'], // keema → kima
  [/([a-z])\1+/g, '$1'], // aalu → alu, tikka → tika, saalan → salan
];

/** Plural / oblique endings: kofte, koftay, chanay → kofta, chana. */
const TRAILING_VOWEL = /(ay|ey|e|y)$/;
const MIN_LENGTH_FOR_TRAILING_FOLD = 4;
const LATIN_WORD = /^[a-z0-9_]+$/;

/** Folds simple plurals so "eggs" and "egg" find each other. */
export function stem(word: string): string {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

export function canonicalWord(word: string): string {
  if (!LATIN_WORD.test(word)) return word;
  const folded = SPELLING_RULES.reduce((w, [pattern, replacement]) => w.replace(pattern, replacement), word);
  return folded.length >= MIN_LENGTH_FOR_TRAILING_FOLD ? folded.replace(TRAILING_VOWEL, 'a') : folded;
}

/** The form every indexed word and query word is compared in. */
export function normalizeToken(word: string): string {
  return canonicalWord(stem(word));
}

/**
 * Roman Urdu and English names for the same ingredient. Catalogue names mix
 * the two ("Boiled Egg", "Anda Bhurji"), so a query word also matches its
 * counterpart: "do anday" can find eggs, "doodh" can find milk. Added
 * alongside the word, never instead of it — "aloo gosht" still needs "aloo".
 */
const SYNONYM_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['anda', 'egg'],
  ['doodh', 'milk'],
  ['chawal', 'rice'],
  ['murgh', 'chicken'],
  ['machli', 'fish'],
  ['dahi', 'yogurt'],
  ['chai', 'tea'],
  ['pani', 'water'],
  ['kela', 'banana'],
  ['seb', 'apple'],
  ['aam', 'mango'],
  ['gajar', 'carrot'],
  ['palak', 'spinach'],
  ['gobhi', 'cauliflower'],
  ['aloo', 'potato'],
  ['matar', 'peas'],
  ['pyaz', 'onion'],
  ['tamatar', 'tomato'],
  ['chana', 'chickpea'],
  ['daal', 'lentil'],
  ['makhan', 'butter'],
  ['cheeni', 'sugar'],
  ['shehad', 'honey'],
  ['keema', 'mince'],
  ['khajoor', 'date'],
  ['kheera', 'cucumber'],
  // Spellings that collide with number words (chay = 6, dhai = 2½).
  ['chay', 'chai'],
  ['dhai', 'dahi'],
];

const SYNONYMS: ReadonlyMap<string, readonly string[]> = SYNONYM_PAIRS.reduce((map, [a, b]) => {
  const [x, y] = [normalizeToken(a), normalizeToken(b)];
  map.set(x, [...(map.get(x) ?? []), y]);
  map.set(y, [...(map.get(y) ?? []), x]);
  return map;
}, new Map<string, string[]>());

/** Other names for a normalized word (other language, or a colliding spelling). */
export function synonymsOf(normalized: string): readonly string[] {
  return SYNONYMS.get(normalized) ?? [];
}

/**
 * Typos allowed for a word of this length: none for very short words (too many
 * false hits), one for ordinary words, two for long ones like "biryani".
 */
export function allowedTypos(word: string): number {
  if (word.length >= 7) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

/**
 * Optimal-string-alignment distance ≤ maxEdits: insertions, deletions,
 * substitutions and adjacent swaps ("karhai" → "karahi") each cost one.
 */
export function isWithinEditDistance(a: string, b: string, maxEdits: number): boolean {
  if (Math.abs(a.length - b.length) > maxEdits) return false;

  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      row.push(value);
    }
    prevPrev = prev;
    prev = row;
  }
  return prev[b.length] <= maxEdits;
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * The vocabulary words closest to a word that matched nothing, or [] when
 * nothing is within its typo budget. Only same-first-letter words are tried:
 * people rarely mistype the first letter, and it keeps the scan cheap.
 *
 * Among equally close words, only those sharing the longest start with what
 * was typed are kept: "bhajia" is one edit from "bajra", "baji" and "bujia",
 * but it was heading for bhaji, not millet roti.
 */
export function closestWords(word: string, vocabulary: Iterable<string>): string[] {
  const budget = allowedTypos(word);
  if (budget === 0) return [];

  for (let edits = 1; edits <= budget; edits++) {
    const matches: string[] = [];
    for (const candidate of vocabulary) {
      if (candidate[0] === word[0] && isWithinEditDistance(word, candidate, edits)) {
        matches.push(candidate);
      }
    }
    if (matches.length > 0) {
      const longest = Math.max(...matches.map((m) => commonPrefixLength(word, m)));
      return matches.filter((m) => commonPrefixLength(word, m) === longest);
    }
  }
  return [];
}
