/**
 * Units people describe meals in, in English, Roman Urdu and Urdu, and the
 * grams each means when the food itself has no serving of that kind.
 */
export type MealUnit =
  | 'piece'
  | 'katori'
  | 'bowl'
  | 'plate'
  | 'cup'
  | 'glass'
  | 'tbsp'
  | 'tsp'
  | 'slice'
  | 'pao'
  | 'handful'
  | 'can'
  | 'bottle'
  | 'serving';

export const UNIT_ALIASES: Readonly<Record<string, MealUnit>> = {
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  adad: 'piece',
  dana: 'piece',
  katori: 'katori',
  katoori: 'katori',
  katorian: 'katori',
  pyali: 'katori',
  bowl: 'bowl',
  bowls: 'bowl',
  katora: 'bowl',
  pyala: 'bowl',
  piyala: 'bowl',
  plate: 'plate',
  plates: 'plate',
  cup: 'cup',
  cups: 'cup',
  mug: 'cup',
  glass: 'glass',
  glasses: 'glass',
  gilas: 'glass',
  glaas: 'glass',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  spoon: 'tbsp',
  spoons: 'tbsp',
  chamach: 'tbsp',
  chammach: 'tbsp',
  chamcha: 'tbsp',
  chamchay: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  slice: 'slice',
  slices: 'slice',
  tukra: 'slice',
  pao: 'pao',
  paao: 'pao',
  handful: 'handful',
  handfuls: 'handful',
  mutthi: 'handful',
  muthi: 'handful',
  can: 'can',
  cans: 'can',
  tin: 'can',
  bottle: 'bottle',
  bottles: 'bottle',
  botal: 'bottle',
  'کین': 'can',
  'بوتل': 'bottle',
  'کٹوری': 'katori',
  'پیالہ': 'bowl',
  'پلیٹ': 'plate',
  'کپ': 'cup',
  'گلاس': 'glass',
  'چمچ': 'tbsp',
  'ٹکڑا': 'slice',
  'پاؤ': 'pao',
  serving: 'serving',
  servings: 'serving',
  portion: 'serving',
  portions: 'serving',
};

/**
 * Grams for one unit when the food has no serving of that kind. A katori is
 * the small home bowl; a bowl or katora the larger one. A pao is a quarter
 * seer, 250g. A handful is about 28g of nuts or dried fruit. Spoons are a
 * level tablespoon / teaspoon by weight of a typical food (oil, sugar and
 * ghee are close enough for logging). A can is the 330 ml soft-drink can; a
 * bottle the 500 ml one.
 */
export const UNIT_DEFAULT_GRAMS: Readonly<Record<Exclude<MealUnit, 'piece' | 'serving'>, number>> = {
  katori: 150,
  bowl: 250,
  plate: 350,
  cup: 200,
  glass: 250,
  tbsp: 15,
  tsp: 5,
  slice: 30,
  pao: 250,
  handful: 28,
  can: 330,
  bottle: 500,
};

/** Serving-label words that mean a food already defines this unit. */
export const UNIT_SERVING_PATTERN: Readonly<Partial<Record<MealUnit, RegExp>>> = {
  katori: /\b(katori|bowl)\b/i,
  bowl: /\b(bowl|katori|katora)\b/i,
  plate: /\bplate\b/i,
  cup: /\b(cup|mug)\b/i,
  glass: /\bglass\b/i,
  slice: /\bslice\b/i,
  tbsp: /\b(tbsp|tablespoon|spoon)\b/i,
  tsp: /\b(tsp|teaspoon)\b/i,
  can: /\b(can|tin)\b/i,
  bottle: /\bbottle\b/i,
};

/** Weight units, turned straight into grams by the parser. */
export const WEIGHT_UNITS: Readonly<Record<string, number>> = {
  g: 1,
  gm: 1,
  gms: 1,
  gr: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilo: 1000,
  ml: 1,
  l: 1000,
  litre: 1000,
  liter: 1000,
};

/** Spoken and written quantities, including Urdu fractions (dedh = 1½). */
export const NUMBER_WORDS: Readonly<Record<string, number>> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  dozen: 12,
  half: 0.5,
  ek: 1,
  aik: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  chay: 6,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  aadha: 0.5,
  adha: 0.5,
  aadhi: 0.5,
  adhi: 0.5,
  pauna: 0.75,
  pona: 0.75,
  sawa: 1.25,
  dedh: 1.5,
  dhai: 2.5,
  dhaai: 2.5,
  adhai: 2.5,
  'ایک': 1,
  'دو': 2,
  'تین': 3,
  'چار': 4,
  'پانچ': 5,
  'آدھا': 0.5,
  'آدھی': 0.5,
  '½': 0.5,
  '¼': 0.25,
};
