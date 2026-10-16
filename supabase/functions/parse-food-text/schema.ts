import { z } from 'zod';

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks_chai'] as const;

/** Mirrors `MealUnit` in @nutrio/food-db; the parity test keeps them in step. */
export const MEAL_UNITS = [
  'piece',
  'katori',
  'bowl',
  'plate',
  'cup',
  'glass',
  'tbsp',
  'tsp',
  'slice',
  'pao',
  'handful',
  'serving',
] as const;

export const ParseFoodTextRequestSchema = z.object({
  text: z.string().min(2).max(500),
  mealSlot: z.enum(MEAL_SLOTS).optional(),
});

export type ParseFoodTextRequest = z.infer<typeof ParseFoodTextRequestSchema>;

/** Mirrors `ParseIssue` in @nutrio/food-db. */
export const PARSE_ISSUES = ['extra_number', 'range', 'invalid_quantity', 'count_with_weight'] as const;

// Bounds are generous on purpose. Implausible amounts are the client's to flag
// on the review screen; a tight schema here turned "100 roti" into a 500.
const BaseItemSchema = z.object({
  text: z.string().min(1).max(500),
  name: z.string().min(1).max(500),
  quantity: z.number().nonnegative().max(10_000),
  quantityGiven: z.boolean(),
  unit: z.enum(MEAL_UNITS).optional(),
  grams: z.number().nonnegative().max(1_000_000).optional(),
  issues: z.array(z.enum(PARSE_ISSUES)).optional(),
});

/**
 * One item as described — the shape of `ParsedMealItem` in @nutrio/food-db.
 * There are deliberately no calorie or macro fields: the client looks each
 * item up in its catalogue with `analyzeMealItems`, so every number logged
 * comes from the food database, never from a model.
 */
export const ExtractedMealItemSchema = BaseItemSchema.extend({
  literal: BaseItemSchema.optional(),
});

export const ParseFoodTextResponseSchema = z.object({
  success: z.literal(true),
  originalText: z.string(),
  slot: z.enum(MEAL_SLOTS).optional(),
  items: z.array(ExtractedMealItemSchema),
  provider: z.enum(['groq_nlp_parser', 'deterministic']),
});

export type ParseFoodTextResponse = z.infer<typeof ParseFoodTextResponseSchema>;
