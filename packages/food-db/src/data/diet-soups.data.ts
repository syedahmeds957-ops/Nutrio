import { NormalizedFood } from '../types.js';

/**
 * Soups — a category the catalogue had none of at all.
 *
 * Worth their own file because they are the best volume-per-calorie food a diet
 * catalogue can offer: a 250ml bowl of yakhni is filling at 60 kcal. The
 * corn and hot & sour variants are thickened with cornflour, which is where
 * their calories actually come from, so they are priced well above the clear ones.
 *
 * Default serving is 1 bowl (250ml) throughout. `grams` carries millilitres, as
 * in diet-beverages.data.ts — these are water-based at roughly 1 g/ml.
 */
export const DIET_SOUPS_DATA: NormalizedFood[] = [
  {
    name: 'Chicken Yakhni (Clear Broth)',
    nameUr: 'چکن یخنی',
    nameAr: 'مرق دجاج صافي',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Basics', 'Pakistani'],
    kcal100g: 24,
    protein100g: 3.1,
    carb100g: 1.2,
    fat100g: 0.8,
    fibre100g: 0.1,
    sugar100g: 0.5,
    sodiumMg100g: 340,
    satFat100g: 0.2,
    source: 'pak_custom',
    verifiedBy: 'composed',
    oilAddedG: 0,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 mug (350ml)', grams: 350, isDefault: false },
    ],
  },
  {
    // Thickened with cornflour and finished with egg — the corn and the starch
    // are where this one's calories sit, not the chicken.
    name: 'Chicken Corn Soup',
    nameUr: 'چکن کارن سوپ',
    nameAr: 'شوربة دجاج بالذرة',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Basics', 'Pakistani'],
    kcal100g: 56,
    protein100g: 3.8,
    carb100g: 8.2,
    fat100g: 0.9,
    fibre100g: 0.6,
    sugar100g: 1.8,
    sodiumMg100g: 420,
    satFat100g: 0.2,
    source: 'pak_custom',
    verifiedBy: 'composed',
    oilAddedG: 0,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 small bowl (180ml)', grams: 180, isDefault: false },
    ],
  },
  {
    // Suffixed: street-food-chaat.data.ts already owns the plain
    // "Hot & Sour Soup" name, and a second one would shadow it in the fuzzy
    // `name.includes` lookups other callers rely on.
    name: 'Hot & Sour Soup (Light)',
    nameUr: 'ہاٹ اینڈ سار سوپ (ہلکا)',
    nameAr: 'شوربة حارة وحامضة',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Basics'],
    kcal100g: 51,
    protein100g: 3.2,
    carb100g: 7.4,
    fat100g: 0.9,
    fibre100g: 0.8,
    sugar100g: 1.6,
    sodiumMg100g: 480,
    satFat100g: 0.2,
    source: 'pak_custom',
    verifiedBy: 'composed',
    oilAddedG: 1,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 small bowl (180ml)', grams: 180, isDefault: false },
    ],
  },
  {
    name: 'Vegetable Soup',
    nameUr: 'سبزیوں کا سوپ',
    nameAr: 'شوربة خضار',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Vegetable', 'Basics'],
    kcal100g: 33,
    protein100g: 1.2,
    carb100g: 6.1,
    fat100g: 0.4,
    fibre100g: 1.3,
    sugar100g: 2.4,
    sodiumMg100g: 310,
    satFat100g: 0.1,
    source: 'usda',
    verifiedBy: 'composed',
    oilAddedG: 1,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 mug (350ml)', grams: 350, isDefault: false },
    ],
  },
  {
    name: 'Chicken Vegetable Soup',
    nameUr: 'چکن سبزی سوپ',
    nameAr: 'شوربة دجاج بالخضار',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Protein', 'Basics'],
    kcal100g: 44,
    protein100g: 4.3,
    carb100g: 5.2,
    fat100g: 0.8,
    fibre100g: 1,
    sugar100g: 1.9,
    sodiumMg100g: 360,
    satFat100g: 0.2,
    source: 'usda',
    verifiedBy: 'composed',
    oilAddedG: 1,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 mug (350ml)', grams: 350, isDefault: false },
    ],
  },
  {
    name: 'Daal Shorba (Lentil Soup)',
    nameUr: 'دال شوربہ',
    nameAr: 'شوربة عدس',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Protein', 'Basics', 'Pakistani'],
    kcal100g: 66,
    protein100g: 4.1,
    carb100g: 10.2,
    fat100g: 0.8,
    fibre100g: 2.2,
    sugar100g: 1.1,
    sodiumMg100g: 330,
    satFat100g: 0.1,
    source: 'pak_custom',
    verifiedBy: 'composed',
    oilAddedG: 2,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 small bowl (180ml)', grams: 180, isDefault: false },
    ],
  },
  {
    name: 'Tomato Soup',
    nameUr: 'ٹماٹر کا سوپ',
    nameAr: 'شوربة طماطم',
    category: 'Diet & Basics',
    cuisineTags: ['Diet', 'Soup', 'Basics'],
    kcal100g: 42,
    protein100g: 1.1,
    carb100g: 7.6,
    fat100g: 0.9,
    fibre100g: 1,
    sugar100g: 4.6,
    sodiumMg100g: 380,
    satFat100g: 0.2,
    source: 'usda',
    verifiedBy: 'composed',
    oilAddedG: 1,
    servings: [
      { label: '1 bowl (250ml)', labelUr: '1 پیالہ', labelAr: 'وعاء واحد', grams: 250, isDefault: true },
      { label: '1 mug (350ml)', grams: 350, isDefault: false },
    ],
  },
];
