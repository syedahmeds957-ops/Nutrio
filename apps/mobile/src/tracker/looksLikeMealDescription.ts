/**
 * Whether what was typed into the hub's search bar reads as a whole meal
 * ("2 rotis and daal") rather than the name of one dish ("chicken karahi").
 *
 * Only decides whether to *offer* the describe card above the search results;
 * the results always stay, so a wrong guess costs one extra row, never a lost
 * search. It is deliberately dependency-free: it must answer on the first
 * keystroke, before the food catalogue has loaded, and it needs the Arabic
 * joiners that food-db's parser does not split on.
 */

// Words that join two foods. Matched as whole tokens, because \b does not
// understand Arabic.
const JOINERS = new Set([
  'and', 'aur', 'plus', 'with', 'along', 'sath', 'saath', 'then',
  'اور', 'مع', 'و', 'ثم',
]);

const SEPARATOR_CHARS = /[;,+&\n،؛|]+/g;

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

const NUMBER_WORDS = new Set([
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'half', 'aik', 'ek', 'do', 'teen', 'char', 'paanch', 'dedh', 'adha',
  'واحد', 'اثنين', 'ثلاثة', 'نص', 'نصف',
]);

const MEAL_WORDS = '(?:breakfast|lunch|dinner|supper|nashta|nashtay|snacks?|فطور|غداء|عشاء)';
// "breakfast: eggs", "lunch - daal"
const SLOT_PREFIX = new RegExp(`^${MEAL_WORDS}\\s*[:\\-–]\\s*\\p{L}`, 'u');
// "i had eggs", "ate a roti"
const FIRST_PERSON = /^(?:i\s+)?(?:had|ate|eaten|have\s+had)\s+\p{L}/u;
// "2 roti", "1.5 cups rice", "½ avocado", "200g chicken", "3x eggs"; not "7up"
const LEADING_QUANTITY = /^(?:\d+(?:[./]\d+)?|[½¼¾])\s*(?:x|×)?\s+\p{L}|^\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l)\b\s*\p{L}/u;

function toAsciiDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= EXTENDED_ARABIC_INDIC_ZERO ? code - EXTENDED_ARABIC_INDIC_ZERO : code - ARABIC_INDIC_ZERO);
  });
}

/** How many foods the text names once split on joiners and punctuation. */
function countSegments(text: string): number {
  let segments = 0;
  let current = false;
  for (const token of text.replace(SEPARATOR_CHARS, ' | ').split(/\s+/)) {
    if (token === '|' || JOINERS.has(token)) {
      if (current) segments += 1;
      current = false;
    } else if (/\p{L}/u.test(token)) {
      current = true;
    }
  }
  return current ? segments + 1 : segments;
}

export function looksLikeMealDescription(text: string): boolean {
  const normalised = toAsciiDigits(text).toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalised) return false;

  if (SLOT_PREFIX.test(normalised) || FIRST_PERSON.test(normalised)) return true;
  if (LEADING_QUANTITY.test(normalised)) return true;

  const first = normalised.split(' ')[0] ?? '';
  if (NUMBER_WORDS.has(first) && normalised.includes(' ')) return true;

  // Two or more foods joined together. "fish and chips" and "mac and cheese"
  // count: they are one dish to a person but two items to the splitter, and
  // the card is only an offer, so the dish still shows in the results below.
  return countSegments(normalised) >= 2;
}
