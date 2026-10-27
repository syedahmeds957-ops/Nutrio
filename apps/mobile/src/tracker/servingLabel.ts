/**
 * Serving labels live in the catalogue in English ("1 small bowl (150g)", or
 * with a local name in brackets, "1 Plate / Portion (نفر)"). For Arabic readers
 * this puts them in Arabic: a bracketed Arabic name is used as it is, and the
 * common unit words are translated. A label with a word we cannot translate is
 * returned untouched rather than half-translated.
 */

interface Noun {
  ar: string;
  /** Adjectives agree with the noun's gender. */
  feminine: boolean;
}

const NOUNS: Record<string, Noun> = {
  bowl: { ar: 'وعاء', feminine: false },
  plate: { ar: 'طبق', feminine: false },
  glass: { ar: 'كوب', feminine: false },
  cup: { ar: 'كوب', feminine: false },
  mug: { ar: 'مج', feminine: false },
  'chai cup': { ar: 'كوب شاي', feminine: false },
  slice: { ar: 'شريحة', feminine: true },
  slices: { ar: 'شرائح', feminine: true },
  piece: { ar: 'قطعة', feminine: true },
  pieces: { ar: 'قطع', feminine: true },
  portion: { ar: 'حصة', feminine: true },
  serving: { ar: 'حصة', feminine: true },
  'standard serving': { ar: 'حصة قياسية', feminine: true },
  tbsp: { ar: 'ملعقة كبيرة', feminine: true },
  tsp: { ar: 'ملعقة صغيرة', feminine: true },
  handful: { ar: 'حفنة', feminine: true },
  skewer: { ar: 'سيخ', feminine: false },
  egg: { ar: 'بيضة', feminine: true },
  eggs: { ar: 'بيضتان', feminine: true },
  katori: { ar: 'كاتوري', feminine: false },
  roll: { ar: 'لفة', feminine: true },
  burger: { ar: 'برغر', feminine: false },
  sub: { ar: 'ساندويتش', feminine: false },
  paratha: { ar: 'باراثا', feminine: true },
  ladoo: { ar: 'لادو', feminine: false },
  pakora: { ar: 'باكورا', feminine: true },
  seekh: { ar: 'سيخ', feminine: false },
  pot: { ar: 'علبة', feminine: true },
  can: { ar: 'علبة', feminine: true },
  bottle: { ar: 'زجاجة', feminine: true },
  pack: { ar: 'عبوة', feminine: true },
  bar: { ar: 'لوح', feminine: false },
};

const ADJECTIVES: Record<string, { m: string; f: string }> = {
  small: { m: 'صغير', f: 'صغيرة' },
  medium: { m: 'متوسط', f: 'متوسطة' },
  large: { m: 'كبير', f: 'كبيرة' },
  big: { m: 'كبير', f: 'كبيرة' },
  side: { m: 'جانبي', f: 'جانبية' },
};

const ARABIC_LETTERS = /[؀-ۿ]/;

export function localizeServingLabel(label: string, language: 'en' | 'ar'): string {
  if (language !== 'ar') return label;

  const count = label.match(/^\s*(\d+(?:\.\d+)?)\b/)?.[1];

  // "1 Medium Bowl (صحن وسط)": the catalogue already has the Arabic name.
  const bracketed = [...label.matchAll(/\(([^)]*)\)/g)]
    .map((m) => m[1].trim())
    .find((inner) => ARABIC_LETTERS.test(inner));
  if (bracketed) {
    return count ? `${count} ${bracketed}` : bracketed;
  }

  // Weights and volumes in brackets are shown separately by the caller.
  const words = label
    .replace(/\(\s*\d+(?:\.\d+)?\s*(?:g|ml)\s*\)/gi, '')
    .replace(/^\s*\d+(?:\.\d+)?\b/, '')
    .replace(/\s*\/\s*/g, ' ')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let half = false;
  const adjectives: string[] = [];
  let noun: Noun | undefined;
  let i = 0;
  while (i < words.length) {
    const two = `${words[i]} ${words[i + 1] ?? ''}`.trim();
    const three = `${two} ${words[i + 2] ?? ''}`.trim();
    if (words[i] === 'half') {
      half = true;
      i += 1;
    } else if (NOUNS[three] && !noun) {
      noun = NOUNS[three];
      i += 3;
    } else if (NOUNS[two] && !noun) {
      noun = NOUNS[two];
      i += 2;
    } else if (NOUNS[words[i]] && !noun) {
      noun = NOUNS[words[i]];
      i += 1;
    } else if (ADJECTIVES[words[i]]) {
      adjectives.push(words[i]);
      i += 1;
    } else {
      return label;
    }
  }
  if (!noun) return label;

  const adjective = adjectives
    .map((a) => (noun!.feminine ? ADJECTIVES[a].f : ADJECTIVES[a].m))
    .join(' ');
  const phrase = [half ? 'نصف' : '', noun.ar, adjective].filter(Boolean).join(' ');
  return count ? `${count} ${phrase}` : phrase;
}
