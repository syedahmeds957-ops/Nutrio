import { z } from 'zod';

/** Upper bounds that keep one request inside the Groq free-tier token budget. */
export const MAX_CATALOGUE_NAMES = 400;
export const MAX_INGREDIENTS = 20;
/** Ingredients looked up in USDA per dish; bounds the record-picking prompt. */
export const MAX_USDA_LOOKUPS = 6;
/** A single ingredient past this is a model error, not a recipe. */
export const MAX_INGREDIENT_GRAMS = 1000;
/** One serving heavier than this is a family pot, not a portion. */
export const MAX_SERVING_GRAMS = 1500;

/**
 * The app sends the dish the user typed and the names of the plain foods in
 * its own catalogue. The model prefers those names, so most ingredients map to
 * a food whose nutrition the app already holds.
 */
export const DishBreakdownRequestSchema = z.object({
  dishName: z.string().trim().min(2).max(80),
  region: z.enum(['PK', 'SA']).default('PK'),
  catalogueNames: z.array(z.string().min(1).max(80)).min(1).max(MAX_CATALOGUE_NAMES),
});

export type DishBreakdownRequest = z.infer<typeof DishBreakdownRequestSchema>;

export const DishIngredientSchema = z.object({
  /** Exactly one of the request's `catalogueNames`. */
  name: z.string().min(1).max(80),
  grams: z.number().positive().max(MAX_INGREDIENT_GRAMS),
});

export type DishIngredient = z.infer<typeof DishIngredientSchema>;

/** Values per 100 g, copied from a USDA FoodData Central record. */
export const UsdaPer100gSchema = z.object({
  kcal: z.number().min(0).max(902),
  protein: z.number().min(0).max(100),
  carbs: z.number().min(0).max(100),
  fat: z.number().min(0).max(100),
  fibre: z.number().min(0).max(100),
  sugar: z.number().min(0).max(100),
  sodiumMg: z.number().min(0).max(40_000),
  satFat: z.number().min(0).max(100),
});

export type UsdaPer100g = z.infer<typeof UsdaPer100gSchema>;

/** An ingredient the catalogue lacks, valued from the USDA record it matched. */
export const UsdaIngredientSchema = z.object({
  /** What the dish needed, e.g. "coconut milk". */
  name: z.string().min(1).max(80),
  grams: z.number().positive().max(MAX_INGREDIENT_GRAMS),
  fdcId: z.number().int().positive(),
  /** The USDA record's own name, kept with the ingredient so its values stay traceable. */
  description: z.string().min(1).max(120),
  per100g: UsdaPer100gSchema,
});

export type UsdaIngredient = z.infer<typeof UsdaIngredientSchema>;

/**
 * Nutrition numbers appear only inside `usdaIngredients`, copied from USDA
 * records by the server; the model never supplies one. The app computes
 * everything else from its catalogue.
 */
export const DishBreakdownResponseSchema = z.object({
  success: z.literal(true),
  /** The dish as the model understood it, e.g. "Chicken Malai Handi". */
  dishName: z.string().min(1).max(80),
  /** One serving in words, e.g. "1 plate (about 350 g)". */
  servingDescription: z.string().max(120),
  /** Ingredients named from the app's catalogue. */
  ingredients: z.array(DishIngredientSchema).max(MAX_INGREDIENTS),
  usdaIngredients: z.array(UsdaIngredientSchema).max(MAX_USDA_LOOKUPS),
  /** Ingredients no trusted source could value; the app shows them as not counted. */
  notCounted: z.array(DishIngredientSchema).max(MAX_INGREDIENTS),
  /** Whether the answer used a live web search or the model's own knowledge. */
  usedWebSearch: z.boolean(),
});

export type DishBreakdownResponse = z.infer<typeof DishBreakdownResponseSchema>;
