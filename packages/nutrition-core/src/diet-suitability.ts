/**
 * Whether a dish is suitable for a user's declared diet.
 *
 * This replaces a filter that asked `food.category.includes('Meat')` and
 * `food.name.includes('Chicken')`. Both failed, for different reasons:
 *
 *   - No category in the catalogue is called "Meat" or "Barbecue". The real
 *     names are "BBQ & Grills", "Karahi & Handi", "Slow-Cooked Curries", so
 *     that check could never match anything, ever.
 *   - The name checks were English-only, but the dishes are named in Urdu.
 *     "Keema", "Kofta", "Sajji", "Paya", "Seekh Kabab" contain none of the
 *     words being looked for.
 *
 * The result was 140 unmistakable meat and fish dishes sitting in the
 * vegetarian pool, and a vegetarian user being served Nargisi Kofta.
 *
 * This is a health and trust boundary rather than a cosmetic filter, so it
 * errs toward exclusion: an ambiguous dish is treated as containing whatever
 * it might contain unless something in the name positively marks it otherwise.
 */

export type AnimalContent = 'meat' | 'fish' | 'egg' | 'dairy';

export interface DietClassifiable {
  name: string;
  category: string;
  cuisineTags?: string[];
}

/** Matches a whole word or a word within a longer name, case-insensitively. */
function matchesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Unmistakable flesh. Urdu and English both, because the catalogue mixes them
 * freely — "Beef Nihari" and "Aloo Gosht" sit in the same category.
 */
const MEAT_TERMS = [
  'chicken', 'murgh', 'broast', 'beef', 'veal', 'mutton', 'lamb', 'goat',
  'bakra', 'dumba', 'camel', 'hashi', 'gosht', 'keema', 'qeema', 'mince',
  'kofta', 'kabab', 'kebab', 'boti', 'sajji', 'seekh', 'shami', 'chapli',
  'nihari', 'paya', 'siri', 'maghaz', 'kaleji', 'liver', 'gurda', 'ojri',
  'katakat', 'taka tak', 'haleem', 'daleem', 'harees', 'jareesh', 'brain',
  'trotter', 'bong', 'nalli', 'raan', 'chops', 'steak', 'sausage', 'salami',
  'bacon', 'ham ', 'pepperoni', 'wings', 'drumstick', 'farrouj', 'tawook',
  'shawarma', 'kabsa', 'mandi', 'madhbi', 'bukhari', 'kunna', 'pasanday',
  'pasanda', 'landi', 'khadda', 'shinwari', 'kalmi', 'reshmi', 'undercut',
  'pork', 'meat', 'poultry',
] as const;

const FISH_TERMS = [
  'fish', 'machli', 'machhli', 'rahu', 'surmai', 'pomfret', 'hammour',
  'salmon', 'tuna', 'sardine', 'mackerel', 'anchovy', 'prawn', 'jhinga',
  'shrimp', 'crab', 'kekra', 'squid', 'calamari', 'oyster', 'seafood',
] as const;

const EGG_TERMS = [
  'egg', 'anda', 'ande', 'andey', 'omelette', 'omelet', 'bhurji', 'khagina',
  'shakshuka', 'nargisi', 'ghotala', 'mayonnaise', 'mayo', 'tamago',
  'frittata', 'menemen', 'benedict', 'gyeran', 'chawanmushi', 'deviled',
] as const;

const DAIRY_TERMS = [
  'milk', 'doodh', 'dahi', 'yogurt', 'yoghurt', 'lassi', 'raita', 'paneer',
  'cheese', 'cheddar', 'mozzarella', 'halloumi', 'labneh', 'laban', 'cream',
  'malai', 'butter', 'makhan', 'ghee', 'khoya', 'mawa', 'kheer', 'firni',
  'rabri', 'rabdi', 'kulfi', 'falooda', 'thandai', 'sardai', 'skyr', 'quark',
  'condensed', 'latte', 'cappuccino', 'custard', 'chaas', 'buttermilk', 'whey',
] as const;

/**
 * Words that usually accompany meat but genuinely appear on vegetable dishes
 * too — "Sabzi Karahi", "Paneer Tikka", "Vegetable Biryani". They only count
 * as meat when nothing else in the name marks the dish as plant-based.
 */
const AMBIGUOUS_MEAT_TERMS = [
  'karahi', 'handi', 'biryani', 'pulao', 'tikka', 'korma', 'qorma', 'curry',
  'salan', 'roast', 'tandoori', 'burger', 'shorba', 'yakhni', 'stew',
  'breast', 'thigh', 'fillet', 'grilled', 'bbq', 'barbecue',
] as const;

/** Positive plant markers that settle an ambiguous name. */
const PLANT_TERMS = [
  'sabzi', 'vegetable', 'veg ', 'aloo', 'potato', 'gobi', 'cauliflower',
  'cabbage', 'bhindi', 'okra', 'palak', 'spinach', 'karela', 'tori',
  'zucchini', 'baingan', 'eggplant', 'brinjal', 'matar', 'peas', 'lauki',
  'gourd', 'shalgam', 'turnip', 'mooli', 'radish', 'chukandar', 'beetroot',
  'kaddu', 'pumpkin', 'mushroom', 'soya', 'tofu', 'tempeh', 'daal', 'dal ',
  'chana', 'lobia', 'rajma', 'mash', 'moong', 'masoor', 'arhar', 'chickpea',
  'lentil', 'bean', 'quinoa', 'salad', 'fruit', 'mixed veg', 'corn',
] as const;

/**
 * Categories that are meat-dominant enough that a dish inside them is assumed
 * to contain meat unless its name says otherwise. This is the check the old
 * filter was reaching for and never found.
 */
const MEAT_DOMINANT_CATEGORIES = ['BBQ & Grills', 'Karahi & Handi'] as const;

export interface AnimalContentVerdict {
  contains: ReadonlySet<AnimalContent>;
  /**
   * True when nothing identified the dish either way. Restrictive diets treat
   * this as unsafe; an omnivore does not care.
   */
  isUnidentified: boolean;
}

/** What animal products a dish contains, as far as we can tell from its name. */
export function classifyAnimalContent(food: DietClassifiable): AnimalContentVerdict {
  const name = food.name.toLowerCase();
  const tags = (food.cuisineTags ?? []).map((t) => t.toLowerCase());
  const contains = new Set<AnimalContent>();

  // Tags first: the Diet & Basics catalogue carries explicit ones, and an
  // explicit tag beats any guess made from the name.
  if (tags.includes('chicken') || tags.includes('beef') || tags.includes('mutton')) {
    contains.add('meat');
  }
  if (tags.includes('seafood')) contains.add('fish');
  if (tags.includes('dairy')) contains.add('dairy');

  if (matchesAny(name, MEAT_TERMS)) contains.add('meat');
  if (matchesAny(name, FISH_TERMS)) contains.add('fish');
  if (matchesAny(name, EGG_TERMS)) contains.add('egg');
  if (matchesAny(name, DAIRY_TERMS)) contains.add('dairy');

  const looksPlant = matchesAny(name, PLANT_TERMS) || tags.includes('vegetarian');

  // Ambiguous names and meat-dominant categories only resolve to meat when
  // nothing marks the dish as plant-based.
  if (!looksPlant && !contains.has('meat')) {
    const ambiguousName = matchesAny(name, AMBIGUOUS_MEAT_TERMS);
    const meatCategory = MEAT_DOMINANT_CATEGORIES.some((c) => food.category === c);
    if (ambiguousName || meatCategory) contains.add('meat');
  }

  return {
    contains,
    isUnidentified: contains.size === 0 && !looksPlant,
  };
}

export type DietPreferenceLike = string;

/**
 * Whether a dish may be served to someone on this diet.
 *
 * Unidentified dishes are refused for every restrictive diet. A plan that
 * quietly serves a vegetarian something it could not classify is worse than a
 * plan built from a smaller, certain pool.
 */
export function isSuitableForDiet(
  food: DietClassifiable,
  dietPreference: DietPreferenceLike
): boolean {
  if (dietPreference !== 'vegan' && dietPreference !== 'vegetarian_desi' && dietPreference !== 'eggetarian') {
    // Omnivore: everything in the catalogue is already halal.
    return true;
  }

  const { contains, isUnidentified } = classifyAnimalContent(food);
  if (isUnidentified) return false;

  if (contains.has('meat') || contains.has('fish')) return false;
  if (dietPreference === 'eggetarian') return true;
  if (contains.has('egg')) return false;
  if (dietPreference === 'vegetarian_desi') return true;
  // Vegan
  return !contains.has('dairy');
}
