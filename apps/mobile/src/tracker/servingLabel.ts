/**
 * Serving labels live in the catalogue in English ("1 small bowl (150g)", or
 * with a local name in brackets, "1 Plate / Portion (نفر)"). For Arabic readers
 * this puts them in Arabic: a bracketed Arabic name is used as it is, and the
 * unit and food words we know are translated. A label with a word we cannot
 * translate is returned untouched rather than half-translated, so an unknown
 * label can never crash or print a mix of the two languages.
 *
 * Shape handled: [count] [half] [adjectives] noun [adjectives] [with extra]
 * ("2 large roti", "1 cup chopped", "3 tenders with dip", "1/2 kg handi").
 * Arabic puts adjectives after the noun and they agree with it, so each noun
 * carries its gender and, where it has one, a plural for counts of 2 to 10.
 */

interface Noun {
  ar: string;
  /** Used for counts of 2 to 10 (and for a plural English word with no count). */
  pl?: string;
  /** Adjectives agree with the noun's gender. */
  feminine: boolean;
}

const noun = (ar: string, feminine = false, pl?: string): Noun => ({ ar, feminine, pl });

const NOUNS: Record<string, Noun> = {
  // Containers and measures
  bowl: noun('وعاء', false, 'أوعية'),
  plate: noun('طبق', false, 'أطباق'),
  platter: noun('طبق', false, 'أطباق'),
  'steak platter': noun('طبق ستيك', false, 'أطباق ستيك'),
  'fish platter': noun('طبق سمك', false, 'أطباق سمك'),
  'prawn platter': noun('طبق روبيان', false, 'أطباق روبيان'),
  'feast platter': noun('طبق وليمة', false, 'أطباق وليمة'),
  'feast plate': noun('طبق وليمة', false, 'أطباق وليمة'),
  'dessert plate': noun('طبق حلويات', false, 'أطباق حلويات'),
  'entree plate': noun('طبق رئيسي', false, 'أطباق رئيسية'),
  'entree serving': noun('طبق رئيسي', false, 'أطباق رئيسية'),
  entree: noun('طبق رئيسي', false, 'أطباق رئيسية'),
  'noodle bowl': noun('وعاء نودلز', false, 'أوعية نودلز'),
  'pasta bowl': noun('وعاء باستا', false, 'أوعية باستا'),
  'wok bowl': noun('وعاء ووك', false, 'أوعية ووك'),
  glass: noun('كوب', false, 'أكواب'),
  'glass bottle': noun('كوب أو زجاجة'),
  cup: noun('كوب', false, 'أكواب'),
  mug: noun('مج'),
  'chai cup': noun('كوب شاي', false, 'أكواب شاي'),
  'dip cup': noun('كوب صلصة', false, 'أكواب صلصة'),
  finjan: noun('فنجان', false, 'فناجين'),
  'finjan cup': noun('فنجان', false, 'فناجين'),
  'dallah flask': noun('دلة', true, 'دلال'),
  slice: noun('شريحة', true, 'شرائح'),
  'tart slice': noun('شريحة تارت', true, 'شرائح تارت'),
  piece: noun('قطعة', true, 'قطع'),
  pc: noun('قطعة', true, 'قطع'),
  pcs: noun('قطعة', true, 'قطع'),
  'boti pc': noun('قطعة بوتي', true, 'قطع بوتي'),
  'boti pcs': noun('قطع بوتي', true, 'قطع بوتي'),
  'kabab piece': noun('قطعة كباب', true, 'قطع كباب'),
  'block piece': noun('قطعة', true, 'قطع'),
  'wing piece': noun('قطعة جناح', true, 'قطع جناح'),
  'thigh piece': noun('قطعة فخذ', true, 'قطع فخذ'),
  'chest piece': noun('قطعة صدر', true, 'قطع صدر'),
  'drumstick piece': noun('قطعة ساق دجاج', true, 'قطع ساق دجاج'),
  portion: noun('حصة', true, 'حصص'),
  'egg portion': noun('حصة بيض', true, 'حصص بيض'),
  serving: noun('حصة', true, 'حصص'),
  'standard serving': noun('حصة قياسية', true, 'حصص قياسية'),
  'pan portion': noun('حصة المقلاة', true),
  tbsp: noun('ملعقة كبيرة', true),
  tsp: noun('ملعقة صغيرة', true),
  tablespoon: noun('ملعقة كبيرة', true, 'ملاعق كبيرة'),
  teaspoon: noun('ملعقة صغيرة', true, 'ملاعق صغيرة'),
  handful: noun('حفنة', true, 'حفنات'),
  scoop: noun('مغرفة', true, 'مغارف'),
  basket: noun('سلة', true, 'سلال'),
  block: noun('قالب', false, 'قوالب'),
  box: noun('علبة', true, 'علب'),
  carton: noun('كرتونة', true, 'كرتونات'),
  jar: noun('برطمان', false, 'برطمانات'),
  tub: noun('علبة', true, 'علب'),
  tin: noun('علبة', true, 'علب'),
  sachet: noun('ظرف', false, 'أظرف'),
  packet: noun('عبوة', true, 'عبوات'),
  shaker: noun('شيكر', false, 'شيكر'),
  litre: noun('لتر', false, 'لترات'),
  pot: noun('علبة', true, 'علب'),
  can: noun('علبة', true, 'علب'),
  bottle: noun('زجاجة', true, 'زجاجات'),
  pack: noun('عبوة', true, 'عبوات'),
  bar: noun('لوح', false, 'ألواح'),
  skewer: noun('سيخ', false, 'أسياخ'),
  seekh: noun('سيخ', false, 'أسياخ'),
  skillet: noun('مقلاة', true, 'مقالي'),
  handi: noun('هاندي'),
  'kg handi': noun('كيلو هاندي'),
  matka: noun('ماتكا'),
  katori: noun('كاتوري'),
  'katori small bowl': noun('كاتوري أو وعاء صغير'),
  'katori kernels': noun('كاتوري حبوب'),
  bunch: noun('حزمة', true, 'حزم'),
  cube: noun('مكعب', false, 'مكعبات'),
  square: noun('مربع', false, 'مربعات'),
  wedge: noun('شريحة', true, 'شرائح'),
  stick: noun('أصبع', false, 'أصابع'),
  pat: noun('قطعة', true, 'قطع'),
  halves: noun('أنصاف'),
  quarter: noun('ربع', false, 'أرباع'),
  'leg quarter': noun('ربع فخذ', false, 'أرباع فخذ'),

  // Bread, rice dishes, snacks
  naan: noun('نان'),
  roti: noun('روتي'),
  'ghar ki roti': noun('روتي منزلي'),
  phulka: noun('فولكا'),
  puri: noun('بوري'),
  kulcha: noun('كلتشا'),
  paratha: noun('باراثا', true),
  'saj bread': noun('خبز صاج'),
  idli: noun('إدلي'),
  dosa: noun('دوسا', true),
  pancake: noun('فطيرة بان كيك', true, 'فطائر بان كيك'),
  samosa: noun('سمبوسة', true, 'سمبوسات'),
  pakora: noun('باكورا', true),
  tikki: noun('تيكي'),
  cutlet: noun('كتلت'),
  kofta: noun('كفتة', true, 'كفتة'),
  kabab: noun('كباب', false, 'كباب'),
  kebab: noun('كباب', false, 'كباب'),
  'chapli kabab': noun('كباب شابلي'),
  'shami kabab': noun('كباب شامي'),
  'bun kabab': noun('بن كباب'),
  dumpling: noun('دمبلنغ', false, 'دمبلنغ'),
  wonton: noun('ونتون', false, 'ونتون'),
  sandwich: noun('ساندويتش', false, 'ساندويتشات'),
  sub: noun('ساندويتش', false, 'ساندويتشات'),
  'hot dog': noun('هوت دوغ', false, 'هوت دوغ'),
  wrap: noun('راب', false, 'رابات'),
  'twister wrap': noun('تويستر راب', false, 'تويستر راب'),
  calzone: noun('كالزوني'),
  pie: noun('فطيرة', true, 'فطائر'),
  burger: noun('برغر', false, 'برغر'),
  patty: noun('قرص برغر', false, 'أقراص برغر'),
  bun: noun('خبز برغر'),
  roll: noun('لفة', true, 'لفات'),
  'cream roll': noun('رول كريمة', false, 'رول كريمة'),
  'dinner roll': noun('رول عشاء', false, 'رول عشاء'),
  breadstick: noun('أصبع خبز', false, 'أصابع خبز'),
  'cheesy stick': noun('أصبع جبن', false, 'أصابع جبن'),
  nugget: noun('ناجت', false, 'ناجتس'),
  tender: noun('تندر', false, 'تندرز'),
  'arancini ball': noun('كرة أرانتشيني', true, 'كرات أرانتشيني'),
  fries: noun('بطاطس مقلية', true),
  salad: noun('سلطة', true, 'سلطات'),
  ladoo: noun('لادو'),
  omelette: noun('أومليت'),

  // Sweets and baking
  jalebi: noun('جليبي'),
  'gulab jamun': noun('جلاب جامون'),
  'kala jamun': noun('كالا جامون'),
  rasgulla: noun('رس غولا'),
  kulfi: noun('كلفي'),
  'gol gappa': noun('غول غابا'),
  brownie: noun('براوني', false, 'براوني'),
  donut: noun('دونات', false, 'دونات'),
  cookie: noun('كوكي', false, 'كوكيز'),
  biscuit: noun('بسكويت', false, 'بسكويت'),
  rusk: noun('رسك', false, 'رسك'),
  cake: noun('كعكة', true, 'كعكات'),
  'molten cake': noun('كيكة لافا', true, 'كيكات لافا'),

  // Meat, fish, eggs
  egg: noun('بيضة', true, 'بيضات'),
  'egg white': noun('بياض بيض'),
  yolk: noun('صفار', false, 'صفار'),
  wing: noun('جناح', false, 'أجنحة'),
  drumstick: noun('ساق دجاج', true, 'سيقان دجاج'),
  thigh: noun('فخذ', false, 'أفخاذ'),
  breast: noun('صدر', false, 'صدور'),
  fillet: noun('فيليه', false, 'فيليه'),
  'fish fillet': noun('فيليه سمك', false, 'فيليه سمك'),
  steak: noun('ستيك', false, 'ستيك'),
  chop: noun('ريشة', true, 'ريش'),
  sausage: noun('نقانق', false, 'نقانق'),
  prawn: noun('روبيان', false, 'روبيان'),

  // Fruit, vegetables, nuts
  avocado: noun('أفوكادو'),
  lemon: noun('ليمونة', true, 'ليمونات'),
  cucumber: noun('خيار'),
  mango: noun('مانجا', true, 'مانجا'),
  pear: noun('كمثرى', true, 'كمثريات'),
  peach: noun('خوخة', true, 'خوخات'),
  plum: noun('برقوقة', true, 'برقوقات'),
  guava: noun('جوافة', true, 'جوافات'),
  fig: noun('تينة', true, 'تينات'),
  date: noun('تمرة', true, 'تمرات'),
  strawberry: noun('فراولة', true, 'فراولات'),
  pomegranate: noun('رمانة', true, 'رمانات'),
  mooli: noun('فجل'),
  baingan: noun('باذنجان'),
  beetroot: noun('شمندر'),
  capsicum: noun('فلفل حلو'),
  cob: noun('كوز ذرة', false, 'كيزان ذرة'),
  almond: noun('لوز'),
  cashew: noun('كاجو'),
  pistachio: noun('فستق'),
};

/** A bare adjective ("1 medium (118g)") is a whole item: "1 حبة متوسطة". */
const ITEM: Noun = noun('حبة', true, 'حبات');

const ADJECTIVES: Record<string, { m: string; f: string }> = {
  small: { m: 'صغير', f: 'صغيرة' },
  medium: { m: 'متوسط', f: 'متوسطة' },
  large: { m: 'كبير', f: 'كبيرة' },
  big: { m: 'كبير', f: 'كبيرة' },
  jumbo: { m: 'جامبو', f: 'جامبو' },
  side: { m: 'جانبي', f: 'جانبية' },
  regular: { m: 'عادي', f: 'عادية' },
  standard: { m: 'قياسي', f: 'قياسية' },
  tall: { m: 'طويل', f: 'طويلة' },
  double: { m: 'مزدوج', f: 'مزدوجة' },
  single: { m: 'فردي', f: 'فردية' },
  full: { m: 'كامل', f: 'كاملة' },
  whole: { m: 'كامل', f: 'كاملة' },
  loaded: { m: 'محمّل', f: 'محمّلة' },
  main: { m: 'رئيسي', f: 'رئيسية' },
  royal: { m: 'ملكي', f: 'ملكية' },
  family: { m: 'عائلي', f: 'عائلية' },
  sharing: { m: 'للمشاركة', f: 'للمشاركة' },
  vegetarian: { m: 'نباتي', f: 'نباتية' },
  dry: { m: 'جاف', f: 'جافة' },
  hot: { m: 'ساخن', f: 'ساخنة' },
  fresh: { m: 'طازج', f: 'طازجة' },
  fried: { m: 'مقلي', f: 'مقلية' },
  baked: { m: 'مخبوز', f: 'مخبوزة' },
  roast: { m: 'مشوي', f: 'مشوية' },
  crispy: { m: 'مقرمش', f: 'مقرمشة' },
  cheesy: { m: 'بالجبن', f: 'بالجبن' },
  tempura: { m: 'تمبورا', f: 'تمبورا' },
  clay: { m: 'فخاري', f: 'فخارية' },
  ceramic: { m: 'خزفي', f: 'خزفية' },
  sliced: { m: 'مقطع شرائح', f: 'مقطعة شرائح' },
  chopped: { m: 'مفروم', f: 'مفرومة' },
  cubed: { m: 'مقطع مكعبات', f: 'مقطعة مكعبات' },
  diced: { m: 'مقطع مكعبات', f: 'مقطعة مكعبات' },
  shredded: { m: 'مبشور', f: 'مبشورة' },
  grated: { m: 'مبشور', f: 'مبشورة' },
  cooked: { m: 'مطبوخ', f: 'مطبوخة' },
  mashed: { m: 'مهروس', f: 'مهروسة' },
  shelled: { m: 'مقشر', f: 'مقشرة' },
  drained: { m: 'مصفى', f: 'مصفاة' },
  chunks: { m: 'قطع', f: 'قطع' },
  seeds: { m: 'بذور', f: 'بذور' },
  florets: { m: 'زهرات', f: 'زهرات' },
  // Menu names, said the way the menu says them.
  bazinga: { m: 'بازينغا', f: 'بازينغا' },
  krunch: { m: 'كرانش', f: 'كرانش' },
  stacker: { m: 'ستاكر', f: 'ستاكر' },
  supreme: { m: 'سوبريم', f: 'سوبريم' },
};

/** What follows "with" (or a comma): "3 tenders with dip", "1 plate, 2 eggs". */
const TAILS: Record<string, string> = {
  dip: 'صلصة غمس',
  fries: 'بطاطس مقلية',
  raita: 'رايتا',
  rabri: 'ربري',
  'chili oil': 'زيت الفلفل',
  marinara: 'مارينارا',
  spinach: 'سبانخ',
  'jasmine rice': 'أرز ياسمين',
  'brown rice': 'أرز بني',
  'baked potato': 'بطاطس مشوية',
  mash: 'هريس البطاطس',
  'mashed potatoes': 'هريس البطاطس',
  sauce: 'صلصة',
  veggies: 'خضار',
  '2 shami': 'كبابين شامي',
  '1 egg': 'بيضة',
  '2 eggs': 'بيضتين',
};

const AMOUNT_UNITS: Record<string, string> = { g: 'غ', kg: 'كغ', ml: 'مل', l: 'ل' };

const ARABIC_LETTERS = /[؀-ۿ]/;

/** Leading count: "2", "1.5" or "1/2", but not the "2" of "2-egg" or the "100" of "100g". */
const COUNT = /^\s*(\d+(?:\.\d+)?(?:\/\d+)?)(?![\d/.\-]|[a-z])/i;

/**
 * Drops a bracketed weight or volume from a label ("1 glass (250ml)" becomes
 * "1 glass"), for screens that print the grams themselves; otherwise the
 * amount shows twice, "(250ml)" next to "250g".
 */
export function withoutAmountBracket(label: string): string {
  return label.replace(/\s*\(\s*\d+(?:\.\d+)?\s*(?:g|ml)\s*\)/gi, '').trim();
}

/** Removes a bracketed local-language name: "1 Plate / Portion (نفر)" becomes "1 Plate / Portion". */
function withoutArabicBracket(label: string): string {
  return label.replace(/\s*\([^)]*[؀-ۿ][^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

/** English plural to singular candidates: strawberries, peaches, wings. */
function singulars(word: string): string[] {
  const out: string[] = [];
  if (word.endsWith('ies')) out.push(`${word.slice(0, -3)}y`);
  if (word.endsWith('es')) out.push(word.slice(0, -2));
  if (word.endsWith('s')) out.push(word.slice(0, -1));
  return out;
}

function findNoun(words: string[]): { noun: Noun; pluralWord: boolean } | undefined {
  const key = words.join(' ');
  if (NOUNS[key]) return { noun: NOUNS[key], pluralWord: false };
  const head = words.slice(0, -1);
  for (const s of singulars(words[words.length - 1])) {
    const candidate = NOUNS[[...head, s].join(' ')];
    if (candidate) return { noun: candidate, pluralWord: true };
  }
  return undefined;
}

/** Longest noun at position i (three words, then two, then one), or undefined. */
function nounAt(words: string[], i: number): { noun: Noun; pluralWord: boolean; length: number } | undefined {
  for (const length of [3, 2, 1]) {
    if (i + length > words.length) continue;
    const found = findNoun(words.slice(i, i + length));
    if (found) return { ...found, length };
  }
  return undefined;
}

/** The part after "with" or a comma: a known phrase, or a single known noun. */
function tailArabic(text: string): string | undefined {
  const key = text.trim().toLowerCase();
  if (!key) return undefined;
  if (TAILS[key]) return TAILS[key];
  const found = findNoun(key.split(/\s+/));
  return found?.noun.ar;
}

function translatePhrase(words: string[], count: string | undefined): { phrase: string; dropCount: boolean } | undefined {
  let half = false;
  const adjectives: string[] = [];
  const modifiers: string[] = [];
  let found: { noun: Noun; pluralWord: boolean } | undefined;
  let i = 0;
  while (i < words.length) {
    const eggs = words[i].match(/^(\d+)-(egg|white)$/);
    const at = found ? undefined : nounAt(words, i);
    if (words[i] === 'half') {
      half = true;
      i += 1;
    } else if (at) {
      found = at;
      i += at.length;
    } else if (ADJECTIVES[words[i]]) {
      adjectives.push(words[i]);
      i += 1;
    } else if (eggs) {
      modifiers.push(`من ${eggs[1]} ${eggs[2] === 'egg' ? 'بيض' : 'بياض'}`);
      i += 1;
    } else {
      return undefined;
    }
  }

  // "1 half": only the word half.
  if (!found && half && adjectives.length === 0 && modifiers.length === 0) {
    return { phrase: 'نصف', dropCount: true };
  }
  if (!found && adjectives.length === 0 && modifiers.length === 0) return undefined;
  const chosen = found?.noun ?? ITEM;

  const n = count && !count.includes('/') ? Number(count) : undefined;
  const plural = Boolean(chosen.pl) && (n === undefined ? Boolean(found?.pluralWord) : n >= 2 && n <= 10);
  const feminine = plural ? true : chosen.feminine;

  const adjective = adjectives.map((a) => (feminine ? ADJECTIVES[a].f : ADJECTIVES[a].m)).join(' ');
  const phrase = [half ? 'نصف' : '', plural ? chosen.pl : chosen.ar, adjective, ...modifiers]
    .filter(Boolean)
    .join(' ');
  return { phrase, dropCount: half && count === '1' };
}

export function localizeServingLabel(label: string, language: 'en' | 'ar'): string {
  // English readers (Pakistan) never see Arabic, not even a bracketed name.
  if (language !== 'ar') return withoutArabicBracket(label) || label;

  // A bare amount: "100g", "250 ml".
  const amount = label.match(/^\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l)\s*$/i);
  if (amount) return `${amount[1]} ${AMOUNT_UNITS[amount[2].toLowerCase()]}`;

  const count = label.match(COUNT)?.[1];

  // "1 Medium Bowl (صحن وسط)": the catalogue already has the Arabic name.
  const bracketed = [...label.matchAll(/\(([^)]*)\)/g)]
    .map((m) => m[1].replace(/\s*[-–]\s*\d+(?:\.\d+)?\s*(?:g|ml)\s*$/i, '').trim())
    .find((inner) => ARABIC_LETTERS.test(inner));
  if (bracketed) {
    // "(٣ فناجيل)" already has its own number.
    return count && !/^[\d٠-٩]/.test(bracketed) ? `${count} ${bracketed}` : bracketed;
  }

  // Weights and volumes in brackets are shown separately by the caller.
  const text = label
    .replace(/\(\s*\d+(?:\.\d+)?\s*(?:g|ml)\s*\)/gi, '')
    .replace(COUNT, '')
    .replace(/\s*\/\s*/g, ' ')
    .toLowerCase()
    .trim();

  const [main, ...after] = text.split(',');
  const [head, ...withParts] = main.split(/\s+with\s+/);
  const words = head.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return label;

  const translated = translatePhrase(words, count);
  if (!translated) return label;

  const tails: string[] = [];
  for (const part of [...withParts, ...after]) {
    const ar = tailArabic(part);
    if (!ar) return label;
    tails.push(`مع ${ar}`);
  }

  const phrase = [translated.phrase, ...tails].join(' ');
  return count && !translated.dropCount ? `${count} ${phrase}` : phrase;
}

/** A serving label ready to show: weight bracket dropped, in the effective language. */
export function servingDisplayLabel(label: string, language: 'en' | 'ar'): string {
  return localizeServingLabel(withoutAmountBracket(label), language);
}
