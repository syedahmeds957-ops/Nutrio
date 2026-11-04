import { NormalizedFood, FoodServingItem } from '../types.js';
import { SLOW_COOKED_CURRIES_DATA } from './slow-cooked-curries.data.js';

/**
 * Meat and vegetable variants of home curries, derived from an existing dish
 * rather than typed in.
 *
 * Most meat curries were listed with one meat — Palak Gosht with mutton only,
 * Kofta Curry with beef only — though every household cooks them with
 * whichever is at hand. Each variant here starts from that dish and swaps one
 * ingredient: the meat's share of the dish is estimated from its protein, and
 * the difference between the two meats' cooked composition is applied to that
 * share. Gravy, oil and salt are left as they were. Values are therefore
 * `composed` estimates, not dietitian-reviewed figures, and say so.
 */

export type Meat = 'mutton' | 'beef' | 'chicken';
export type MeatForm = 'cut' | 'mince';

interface Composition {
  protein: number;
  fat: number;
  satFat: number;
}

/**
 * Cooked, edible portion, per 100g — approximate USDA FoodData Central values.
 * Curry cut: chicken is "broilers, meat only, stewed"; beef is braised stew
 * meat, lean and fat; mutton averages goat (roasted) and lamb (lean and fat),
 * since Pakistani "mutton" is sold as either. Mince: 85% lean beef, ground
 * lamb and ground chicken, each pan-browned.
 */
const MEAT_COMPOSITION: Record<MeatForm, Record<Meat, Composition>> = {
  cut: {
    mutton: { protein: 25.8, fat: 12.0, satFat: 4.9 },
    beef: { protein: 28.0, fat: 13.0, satFat: 5.2 },
    chicken: { protein: 27.3, fat: 6.7, satFat: 1.8 },
  },
  mince: {
    mutton: { protein: 24.8, fat: 19.7, satFat: 8.1 },
    beef: { protein: 25.9, fat: 15.6, satFat: 6.1 },
    chicken: { protein: 23.3, fat: 10.9, satFat: 3.0 },
  },
};

/** Share of a meat curry's protein that comes from the meat, not gravy or vegetables. */
const MEAT_PROTEIN_SHARE = 0.85;
/** Bounds on the estimated meat share, so an unusual base cannot swing a swap wildly. */
const MIN_MEAT_SHARE = 0.15;
const MAX_MEAT_SHARE = 0.6;

export type Vegetable = 'cauliflower' | 'peas' | 'bottle_gourd';

interface VegetableComposition {
  protein: number;
  carb: number;
  fibre: number;
  sugar: number;
}

/** Boiled, per 100g — approximate USDA FoodData Central values. */
const VEGETABLE_COMPOSITION: Record<Vegetable, VegetableComposition> = {
  cauliflower: { protein: 1.8, carb: 4.1, fibre: 2.3, sugar: 2.1 },
  peas: { protein: 5.4, carb: 15.6, fibre: 5.5, sugar: 5.9 },
  bottle_gourd: { protein: 0.6, carb: 3.7, fibre: 1.2, sugar: 1.7 },
};

/** Typical vegetable share by weight of a sabzi-gosht curry. */
const VEGETABLE_SHARE = 0.3;

export interface MeatSwap {
  from: Meat;
  to: Meat;
  /** Form the new dish uses; the base is assumed to use the same unless `fromForm` says otherwise. */
  form: MeatForm;
  fromForm?: MeatForm;
}

export interface VegetableSwap {
  from: Vegetable;
  to: Vegetable;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const atLeast = (n: number, floor: number) => Math.max(floor, round1(n));
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const kcalFromMacros = (protein: number, carb: number, fat: number) =>
  Math.round(4 * protein + 4 * carb + 9 * fat);

/** Base macros only: a per-serving kcal copied from the base would be the base's. */
const stripServingMacros = (serving: FoodServingItem): FoodServingItem => ({
  label: serving.label,
  ...(serving.labelUr ? { labelUr: serving.labelUr } : {}),
  grams: serving.grams,
  isDefault: serving.isDefault,
});

/** The base dish with its meat swapped; name and provenance are the caller's to set. */
export function deriveMeatVariant(base: NormalizedFood, swap: MeatSwap): NormalizedFood {
  const from = MEAT_COMPOSITION[swap.fromForm ?? swap.form][swap.from];
  const to = MEAT_COMPOSITION[swap.form][swap.to];
  const share = clamp((base.protein100g * MEAT_PROTEIN_SHARE) / from.protein, MIN_MEAT_SHARE, MAX_MEAT_SHARE);

  const protein100g = atLeast(base.protein100g + share * (to.protein - from.protein), 0.1);
  const fat100g = atLeast(base.fat100g + share * (to.fat - from.fat), 0.1);
  const satFat100g = atLeast(base.satFat100g + share * (to.satFat - from.satFat), 0.1);

  return {
    ...base,
    protein100g,
    fat100g,
    satFat100g,
    kcal100g: kcalFromMacros(protein100g, base.carb100g, fat100g),
    servings: base.servings.map(stripServingMacros),
  };
}

/** The base dish with its main vegetable swapped. */
export function deriveVegetableVariant(base: NormalizedFood, swap: VegetableSwap): NormalizedFood {
  const from = VEGETABLE_COMPOSITION[swap.from];
  const to = VEGETABLE_COMPOSITION[swap.to];
  const delta = (key: keyof VegetableComposition) => VEGETABLE_SHARE * (to[key] - from[key]);

  const protein100g = atLeast(base.protein100g + delta('protein'), 0.1);
  const carb100g = atLeast(base.carb100g + delta('carb'), 0.1);

  return {
    ...base,
    protein100g,
    carb100g,
    fibre100g: atLeast(base.fibre100g + delta('fibre'), 0),
    sugar100g: atLeast(base.sugar100g + delta('sugar'), 0),
    kcal100g: kcalFromMacros(protein100g, carb100g, base.fat100g),
    servings: base.servings.map(stripServingMacros),
  };
}

export type VariantLabel = 'Mutton' | 'Beef' | 'Chicken';

const LABEL_FOR_MEAT: Record<Meat, VariantLabel> = {
  mutton: 'Mutton',
  beef: 'Beef',
  chicken: 'Chicken',
};

/** Hand-entered dishes that belong to a variant group, by exact name. */
export const EXISTING_VARIANT_MEMBERS: ReadonlyArray<{
  name: string;
  group: string;
  label: VariantLabel;
}> = [
  { name: 'Aloo Gosht (Mutton Shorba)', group: 'aloo-gosht', label: 'Mutton' },
  { name: 'Aloo Gosht (Beef Shorba)', group: 'aloo-gosht', label: 'Beef' },
  { name: 'Palak Gosht (Mutton in Spinach)', group: 'palak-gosht', label: 'Mutton' },
  // "with Meat": the macros match the mutton curries beside it.
  { name: 'Bhindi Gosht (Okra with Meat)', group: 'bhindi-gosht', label: 'Mutton' },
  { name: 'Shaljam Gosht (Turnip & Mutton)', group: 'shaljam-gosht', label: 'Mutton' },
  { name: 'Arvi Gosht (Colocasia & Mutton Gravy)', group: 'arvi-gosht', label: 'Mutton' },
  { name: 'Karela Gosht (Bitter Gourd & Mutton)', group: 'karela-gosht', label: 'Mutton' },
  { name: 'Gobhi Gosht (Mutton & Cauliflower)', group: 'gobhi-gosht', label: 'Mutton' },
  { name: 'Methi Gosht (Fenugreek Mutton)', group: 'methi-gosht', label: 'Mutton' },
  { name: 'Achari Gosht (Pickled Mutton Gravy)', group: 'achari-gosht', label: 'Mutton' },
  { name: 'Achari Chicken', group: 'achari-gosht', label: 'Chicken' },
  { name: 'Bhuna Gosht (Beef Semi-Dry)', group: 'bhuna-gosht', label: 'Beef' },
  { name: 'Kofta Curry (Beef Meatballs)', group: 'kofta-curry', label: 'Beef' },
  { name: 'Chicken Kofta Curry', group: 'kofta-curry', label: 'Chicken' },
  { name: 'Matar Keema (Minced Beef with Peas)', group: 'keema-matar', label: 'Beef' },
  { name: 'Aloo Keema (Ground Beef with Potatoes)', group: 'aloo-keema', label: 'Beef' },
];

interface DerivedSpec {
  name: string;
  nameUr: string;
  base: string;
  meat?: MeatSwap;
  vegetable?: VegetableSwap;
  group?: string;
}

const muttonCutTo = (to: Meat): MeatSwap => ({ from: 'mutton', to, form: 'cut' });
const beefMinceTo = (to: Meat): MeatSwap => ({ from: 'beef', to, form: 'mince' });

const DERIVED_SPECS: DerivedSpec[] = [
  // Meat variants of existing dishes
  { name: 'Aloo Chicken (Chicken & Potato Shorba)', nameUr: 'آلو چکن', base: 'Aloo Gosht (Mutton Shorba)', meat: muttonCutTo('chicken'), group: 'aloo-gosht' },
  { name: 'Palak Gosht (Beef in Spinach)', nameUr: 'پالک گوشت (بیف)', base: 'Palak Gosht (Mutton in Spinach)', meat: muttonCutTo('beef'), group: 'palak-gosht' },
  { name: 'Palak Chicken (Chicken in Spinach)', nameUr: 'پالک چکن', base: 'Palak Gosht (Mutton in Spinach)', meat: muttonCutTo('chicken'), group: 'palak-gosht' },
  { name: 'Bhindi Gosht (Okra with Beef)', nameUr: 'بھنڈی گوشت (بیف)', base: 'Bhindi Gosht (Okra with Meat)', meat: muttonCutTo('beef'), group: 'bhindi-gosht' },
  { name: 'Bhindi Chicken (Okra with Chicken)', nameUr: 'بھنڈی چکن', base: 'Bhindi Gosht (Okra with Meat)', meat: muttonCutTo('chicken'), group: 'bhindi-gosht' },
  { name: 'Shaljam Gosht (Turnip & Beef)', nameUr: 'شلجم گوشت (بیف)', base: 'Shaljam Gosht (Turnip & Mutton)', meat: muttonCutTo('beef'), group: 'shaljam-gosht' },
  { name: 'Shaljam Chicken (Turnip & Chicken)', nameUr: 'شلجم چکن', base: 'Shaljam Gosht (Turnip & Mutton)', meat: muttonCutTo('chicken'), group: 'shaljam-gosht' },
  { name: 'Arvi Gosht (Colocasia & Beef Gravy)', nameUr: 'اروی گوشت (بیف)', base: 'Arvi Gosht (Colocasia & Mutton Gravy)', meat: muttonCutTo('beef'), group: 'arvi-gosht' },
  { name: 'Arvi Chicken (Colocasia & Chicken Gravy)', nameUr: 'اروی چکن', base: 'Arvi Gosht (Colocasia & Mutton Gravy)', meat: muttonCutTo('chicken'), group: 'arvi-gosht' },
  { name: 'Karela Gosht (Bitter Gourd & Beef)', nameUr: 'کریلے گوشت (بیف)', base: 'Karela Gosht (Bitter Gourd & Mutton)', meat: muttonCutTo('beef'), group: 'karela-gosht' },
  { name: 'Karela Chicken (Bitter Gourd & Chicken)', nameUr: 'کریلے چکن', base: 'Karela Gosht (Bitter Gourd & Mutton)', meat: muttonCutTo('chicken'), group: 'karela-gosht' },
  { name: 'Gobhi Gosht (Beef & Cauliflower)', nameUr: 'گوبھی گوشت (بیف)', base: 'Gobhi Gosht (Mutton & Cauliflower)', meat: muttonCutTo('beef'), group: 'gobhi-gosht' },
  { name: 'Gobhi Chicken (Chicken & Cauliflower)', nameUr: 'گوبھی چکن', base: 'Gobhi Gosht (Mutton & Cauliflower)', meat: muttonCutTo('chicken'), group: 'gobhi-gosht' },
  { name: 'Methi Gosht (Fenugreek Beef)', nameUr: 'میتھی گوشت (بیف)', base: 'Methi Gosht (Fenugreek Mutton)', meat: muttonCutTo('beef'), group: 'methi-gosht' },
  { name: 'Methi Chicken (Fenugreek Chicken)', nameUr: 'میتھی چکن', base: 'Methi Gosht (Fenugreek Mutton)', meat: muttonCutTo('chicken'), group: 'methi-gosht' },
  { name: 'Achari Gosht (Pickled Beef Gravy)', nameUr: 'اچاری گوشت (بیف)', base: 'Achari Gosht (Pickled Mutton Gravy)', meat: muttonCutTo('beef'), group: 'achari-gosht' },
  { name: 'Bhuna Gosht (Mutton Semi-Dry)', nameUr: 'بھنا گوشت (مٹن)', base: 'Bhuna Gosht (Beef Semi-Dry)', meat: { from: 'beef', to: 'mutton', form: 'cut' }, group: 'bhuna-gosht' },
  { name: 'Bhuna Chicken (Chicken Semi-Dry)', nameUr: 'بھنا چکن', base: 'Bhuna Gosht (Beef Semi-Dry)', meat: { from: 'beef', to: 'chicken', form: 'cut' }, group: 'bhuna-gosht' },
  { name: 'Kofta Curry (Mutton Meatballs)', nameUr: 'کوفتہ کری (مٹن)', base: 'Kofta Curry (Beef Meatballs)', meat: beefMinceTo('mutton'), group: 'kofta-curry' },
  { name: 'Matar Keema (Minced Mutton with Peas)', nameUr: 'مٹر قیمہ (مٹن)', base: 'Matar Keema (Minced Beef with Peas)', meat: beefMinceTo('mutton'), group: 'keema-matar' },
  { name: 'Chicken Keema Matar (Minced Chicken with Peas)', nameUr: 'چکن قیمہ مٹر', base: 'Matar Keema (Minced Beef with Peas)', meat: beefMinceTo('chicken'), group: 'keema-matar' },
  { name: 'Aloo Keema (Minced Mutton with Potatoes)', nameUr: 'آلو قیمہ (مٹن)', base: 'Aloo Keema (Ground Beef with Potatoes)', meat: beefMinceTo('mutton'), group: 'aloo-keema' },
  { name: 'Aloo Chicken Keema (Minced Chicken with Potatoes)', nameUr: 'آلو چکن قیمہ', base: 'Aloo Keema (Ground Beef with Potatoes)', meat: beefMinceTo('chicken'), group: 'aloo-keema' },

  // Common home combinations that were missing outright
  { name: 'Palak Kofta (Beef Meatballs in Spinach)', nameUr: 'پالک کوفتہ', base: 'Palak Gosht (Mutton in Spinach)', meat: { from: 'mutton', fromForm: 'cut', to: 'beef', form: 'mince' } },
  { name: 'Karela Keema (Bitter Gourd & Beef Mince)', nameUr: 'کریلے قیمہ', base: 'Karela Gosht (Bitter Gourd & Mutton)', meat: { from: 'mutton', fromForm: 'cut', to: 'beef', form: 'mince' } },
  { name: 'Gobhi Keema (Cauliflower & Beef Mince)', nameUr: 'گوبھی قیمہ', base: 'Gobhi Gosht (Mutton & Cauliflower)', meat: { from: 'mutton', fromForm: 'cut', to: 'beef', form: 'mince' } },
  { name: 'Matar Gosht (Mutton & Peas)', nameUr: 'مٹر گوشت', base: 'Gobhi Gosht (Mutton & Cauliflower)', vegetable: { from: 'cauliflower', to: 'peas' } },
  { name: 'Lauki Gosht (Bottle Gourd & Mutton)', nameUr: 'لوکی گوشت', base: 'Gobhi Gosht (Mutton & Cauliflower)', vegetable: { from: 'cauliflower', to: 'bottle_gourd' } },
];

const slug = (name: string) =>
  name.toLowerCase().replace(/\(.*?\)/g, '').trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function describeSwap(spec: DerivedSpec): string {
  const parts: string[] = [];
  if (spec.meat) {
    const fromForm = spec.meat.fromForm ?? spec.meat.form;
    parts.push(`${spec.meat.from} ${fromForm} → ${spec.meat.to} ${spec.meat.form}`);
  }
  if (spec.vegetable) parts.push(`${spec.vegetable.from} → ${spec.vegetable.to}`);
  return `Derived from "${spec.base}" by swapping ${parts.join(' and ')} (USDA reference composition)`;
}

function buildDerivedFood(spec: DerivedSpec): NormalizedFood {
  const base = SLOW_COOKED_CURRIES_DATA.find((f) => f.name === spec.base);
  if (!base) throw new Error(`meat-variants: base dish "${spec.base}" not found`);

  const withMeat = spec.meat ? deriveMeatVariant(base, spec.meat) : base;
  const derived = spec.vegetable ? deriveVegetableVariant(withMeat, spec.vegetable) : withMeat;

  return {
    ...derived,
    id: `pk_variant_${slug(spec.name)}`,
    name: spec.name,
    nameUr: spec.nameUr,
    source: 'pak_custom',
    verifiedBy: 'composed',
    sourceRef: describeSwap(spec),
    ...(spec.group && spec.meat
      ? { variantGroup: spec.group, variantLabel: LABEL_FOR_MEAT[spec.meat.to] }
      : {}),
  };
}

export const DERIVED_VARIANT_FOODS: NormalizedFood[] = DERIVED_SPECS.map(buildDerivedFood);
