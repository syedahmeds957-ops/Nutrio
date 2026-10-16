import { z } from 'zod';

/** Upper bounds that keep one request inside the Groq free-tier token budget. */
export const MAX_CATALOGUE_NAMES = 400;
export const MAX_INGREDIENTS = 20;
/** A single ingredient past this is a model error, not a recipe. */
export const MAX_INGREDIENT_GRAMS = 1000;
/** One serving heavier than this is a family pot, not a portion. */
export const MAX_SERVING_GRAMS = 1500;

/**
 * The app sends the dish the user typed and the names of the plain foods in
 * its own catalogue. The model may only answer with those names, so every
 * ingredient it returns maps to a food whose nutrition the app already holds.
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

/**
 * Deliberately carries no calorie or macro fields. The app computes them from
 * its catalogue (Hard Rule 1: nutrient values never come from a model).
 */
export const DishBreakdownResponseSchema = z.object({
  success: z.literal(true),
  /** The dish as the model understood it, e.g. "Chicken Malai Handi". */
  dishName: z.string().min(1).max(80),
  /** One serving in words, e.g. "1 plate (about 350 g)". */
  servingDescription: z.string().max(120),
  ingredients: z.array(DishIngredientSchema).min(1).max(MAX_INGREDIENTS),
  /** Whether the answer used a live web search or the model's own knowledge. */
  usedWebSearch: z.boolean(),
});

export type DishBreakdownResponse = z.infer<typeof DishBreakdownResponseSchema>;
