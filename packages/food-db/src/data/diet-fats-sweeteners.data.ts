import { NormalizedFood } from '../types.js';

/**
 * Fats and sweeteners that get added on top of a finished dish.
 *
 * Deliberately short. Every prepared dish in this catalogue already carries the
 * oil it was cooked in inside its own macros (see `oilAddedG`), so a shelf of
 * cooking oils would mostly invite double-counting. And nutritionally all plain
 * oils are the same food — sunflower, canola, mustard and coconut are each
 * ~900 kcal/100g of pure fat, so four rows would say nothing four times. One
 * generic entry covers the case that matters: logging a dish the catalogue
 * doesn't have, ingredient by ingredient.
 *
 * What earns a row here is what a person *adds* and can see: ghee on a roti,
 * butter on toast, spoons of sugar in chai. Those are never in the dish's own
 * figures, and they are where the unlogged calories actually are.
 *
 * Servings are teaspoons and tablespoons throughout — nobody measures ghee in
 * grams, and a 100g default would be absurd for all six.
 */
export const DIET_FATS_SWEETENERS_DATA: NormalizedFood[] = [
  {
    name: 'Desi Ghee',
    nameUr: 'دیسی گھی',
    nameAr: 'سمن بلدي',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Fat', 'Basics', 'Pakistani'],
    kcal100g: 896,
    protein100g: 0,
    carb100g: 0,
    fat100g: 99.5,
    fibre100g: 0,
    sugar100g: 0,
    sodiumMg100g: 2,
    satFat100g: 62,
    source: 'pak_custom',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 tsp (5g)', labelUr: '1 چھوٹا چمچ', labelAr: 'ملعقة صغيرة', grams: 5, isDefault: true },
      { label: '1 tbsp (14g)', labelUr: '1 کھانے کا چمچ', labelAr: 'ملعقة كبيرة', grams: 14, isDefault: false },
      { label: '2 tbsp (28g)', grams: 28, isDefault: false },
    ],
  },
  {
    // 734, not USDA's 717 — butter's stated energy uses food-specific factors.
    // The catalogue rule is the Atwater-derived figure so kcal always
    // reconciles with the macro totals.
    name: 'Butter',
    nameUr: 'مکھن',
    nameAr: 'زبدة',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Fat', 'Basics'],
    kcal100g: 734,
    protein100g: 0.9,
    carb100g: 0.1,
    fat100g: 81.1,
    fibre100g: 0,
    sugar100g: 0.1,
    sodiumMg100g: 643,
    satFat100g: 51.4,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 tsp (5g)', labelUr: '1 چھوٹا چمچ', labelAr: 'ملعقة صغيرة', grams: 5, isDefault: true },
      { label: '1 tbsp (14g)', labelUr: '1 کھانے کا چمچ', labelAr: 'ملعقة كبيرة', grams: 14, isDefault: false },
      { label: '1 pat (7g)', grams: 7, isDefault: false },
    ],
  },
  {
    // One entry for every plain cooking oil. Sunflower, canola, corn, mustard
    // and coconut are all ~900 kcal of pure fat per 100g; separating them would
    // add rows without adding a single different number.
    name: 'Cooking Oil (Any Plain Oil)',
    nameUr: 'کھانا پکانے کا تیل',
    nameAr: 'زيت الطهي',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Fat', 'Basics'],
    kcal100g: 900,
    protein100g: 0,
    carb100g: 0,
    fat100g: 100,
    fibre100g: 0,
    sugar100g: 0,
    sodiumMg100g: 0,
    satFat100g: 13,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 tsp (5g)', labelUr: '1 چھوٹا چمچ', labelAr: 'ملعقة صغيرة', grams: 5, isDefault: true },
      { label: '1 tbsp (14g)', labelUr: '1 کھانے کا چمچ', labelAr: 'ملعقة كبيرة', grams: 14, isDefault: false },
      { label: '2 tbsp (28g)', grams: 28, isDefault: false },
    ],
  },
  {
    name: 'Sugar (White)',
    nameUr: 'چینی',
    nameAr: 'سكر أبيض',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Sweetener', 'Basics'],
    kcal100g: 400,
    protein100g: 0,
    carb100g: 100,
    fat100g: 0,
    fibre100g: 0,
    sugar100g: 100,
    sodiumMg100g: 0,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 tsp (4g)', labelUr: '1 چھوٹا چمچ', labelAr: 'ملعقة صغيرة', grams: 4, isDefault: true },
      { label: '2 tsp (8g)', labelUr: '2 چھوٹے چمچ', grams: 8, isDefault: false },
      { label: '1 tbsp (12g)', grams: 12, isDefault: false },
    ],
  },
  {
    name: 'Gur / Jaggery',
    nameUr: 'گڑ',
    nameAr: 'سكر القصب الخام',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Sweetener', 'Basics', 'Pakistani'],
    kcal100g: 395,
    protein100g: 0.4,
    carb100g: 98,
    fat100g: 0.1,
    fibre100g: 0,
    sugar100g: 85,
    sodiumMg100g: 30,
    satFat100g: 0,
    source: 'pak_custom',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 small piece (10g)', labelUr: '1 چھوٹا ٹکڑا', labelAr: 'قطعة صغيرة', grams: 10, isDefault: true },
      { label: '1 piece (20g)', grams: 20, isDefault: false },
    ],
  },
  {
    // 331, not USDA's 304 — same fibre/sugar energy-factor divergence.
    name: 'Honey',
    nameUr: 'شہد',
    nameAr: 'عسل',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Sweetener', 'Basics'],
    kcal100g: 331,
    protein100g: 0.3,
    carb100g: 82.4,
    fat100g: 0,
    fibre100g: 0.2,
    sugar100g: 82.1,
    sodiumMg100g: 4,
    satFat100g: 0,
    source: 'usda',
    verifiedBy: 'usda_reference',
    oilAddedG: 0,
    servings: [
      { label: '1 tsp (7g)', labelUr: '1 چھوٹا چمچ', labelAr: 'ملعقة صغيرة', grams: 7, isDefault: true },
      { label: '1 tbsp (21g)', labelUr: '1 کھانے کا چمچ', labelAr: 'ملعقة كبيرة', grams: 21, isDefault: false },
    ],
  },
];
