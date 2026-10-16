import { NormalizedFood, RegionCode } from '../types.js';
import { getDietBasicsForRegion } from '../search-index.js';

/** The category a user's own dishes are filed under. */
export const USER_DISH_CATEGORY = 'My Dishes';

/** Fats eaten as the cooking medium; their whole weight is the dish's added oil. */
const PURE_FAT_MIN_FAT_100G = 80;

/**
 * The plain single-ingredient foods a dish may be broken into. A model naming
 * an unknown dish's ingredients is limited to this list, so each one resolves
 * to a catalogue food whose nutrition is already known.
 */
export function getRecipeIngredientFoods(region: RegionCode = 'PK'): NormalizedFood[] {
  return getDietBasicsForRegion(region);
}

export interface RecipeIngredientInput {
  /** A name from `getRecipeIngredientFoods`. */
  name: string;
  grams: number;
}

export interface RecipeIngredient {
  food: NormalizedFood;
  grams: number;
  kcal: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface ComposedRecipe {
  /** The dish as a catalogue food: per-100 g values and a one-serving default. */
  food: NormalizedFood;
  ingredients: RecipeIngredient[];
  /** Input names the catalogue does not hold; they add nothing to the totals. */
  unmatched: string[];
  servingGrams: number;
  kcalPerServing: number;
}

export interface ComposeRecipeInput {
  /** What the user calls the dish; becomes the food's name. */
  name: string;
  ingredients: RecipeIngredientInput[];
  servingLabel?: string;
  region?: RegionCode;
  /** Stable id for the stored dish; generated when absent. */
  id?: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Builds a food from catalogue ingredients. Every number is computed here from
 * the ingredients' own per-100 g values: the breakdown supplies only names and
 * grams, so no nutrient figure ever comes from a model.
 *
 * Returns undefined when no ingredient resolves, since a dish with nothing in
 * it cannot be logged honestly.
 */
export function composeRecipeFood(input: ComposeRecipeInput): ComposedRecipe | undefined {
  const region = input.region ?? 'PK';
  const byName = new Map(getRecipeIngredientFoods(region).map((f) => [f.name, f]));

  const ingredients: RecipeIngredient[] = [];
  const unmatched: string[] = [];
  for (const { name, grams } of input.ingredients) {
    const food = byName.get(name);
    if (!food || !(grams > 0)) {
      unmatched.push(name);
      continue;
    }
    const factor = grams / 100;
    ingredients.push({
      food,
      grams,
      kcal: Math.round(food.kcal100g * factor),
      proteinGrams: round1(food.protein100g * factor),
      carbGrams: round1(food.carb100g * factor),
      fatGrams: round1(food.fat100g * factor),
    });
  }

  const servingGrams = ingredients.reduce((sum, i) => sum + i.grams, 0);
  if (ingredients.length === 0 || servingGrams <= 0) return undefined;

  // Each nutrient per 100 g of the finished dish: the ingredients' total of it,
  // spread over the serving's weight.
  const per100g = (pick: (f: NormalizedFood) => number) =>
    round1(ingredients.reduce((sum, i) => sum + (pick(i.food) * i.grams) / 100, 0) * (100 / servingGrams));

  const oilGrams = ingredients.reduce(
    (sum, i) =>
      sum +
      (i.food.fat100g >= PURE_FAT_MIN_FAT_100G ? i.grams : (i.food.oilAddedG * i.grams) / 100),
    0
  );

  const food: NormalizedFood = {
    id: input.id ?? `user_dish_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    category: USER_DISH_CATEGORY,
    cuisineTags: [],
    region,
    kcal100g: Math.round(per100g((f) => f.kcal100g)),
    protein100g: per100g((f) => f.protein100g),
    carb100g: per100g((f) => f.carb100g),
    fat100g: per100g((f) => f.fat100g),
    fibre100g: per100g((f) => f.fibre100g),
    sugar100g: per100g((f) => f.sugar100g),
    sodiumMg100g: Math.round(per100g((f) => f.sodiumMg100g)),
    satFat100g: per100g((f) => f.satFat100g),
    source: 'user',
    isRecipe: true,
    oilAddedG: round1((oilGrams * 100) / servingGrams),
    servings: [
      {
        label: input.servingLabel?.trim() || `1 serving (${servingGrams}g)`,
        grams: servingGrams,
        isDefault: true,
      },
    ],
  };

  return {
    food,
    ingredients,
    unmatched,
    servingGrams,
    kcalPerServing: ingredients.reduce((sum, i) => sum + i.kcal, 0),
  };
}
