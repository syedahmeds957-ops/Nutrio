import { z } from 'zod';

export const ParseFoodTextRequestSchema = z.object({
  text: z.string().min(2).max(500),
  mealSlot: z
    .enum(['breakfast', 'lunch', 'dinner', 'snacks_chai'])
    .optional(),
  calibrationFactors: z.record(z.string(), z.number()).optional(),
});

export type ParseFoodTextRequest = z.infer<typeof ParseFoodTextRequestSchema>;

export const ParsedFoodItemCandidateSchema = z.object({
  detectedName: z.string(),
  quantity: z.number().default(1),
  unit: z.string().optional(),
  estimatedGrams: z.number().optional(),
});

export type ParsedFoodItemCandidate = z.infer<
  typeof ParsedFoodItemCandidateSchema
>;

export const ParseFoodTextResponseSchema = z.object({
  success: z.boolean(),
  originalText: z.string(),
  detectedItems: z.array(ParsedFoodItemCandidateSchema),
  resolution: z.object({
    totalCalories: z.number(),
    calorieBand: z.object({
      min: z.number(),
      max: z.number(),
      displayEstimate: z.string(),
    }),
    totalProteinGrams: z.number(),
    totalFatGrams: z.number(),
    totalCarbGrams: z.number(),
    totalFibreGrams: z.number(),
    totalOilAddedG: z.number(),
    confidence: z.enum(['high', 'medium', 'low']),
    items: z.array(
      z.object({
        detectedName: z.string(),
        matchedFoodName: z.string(),
        matchedFoodNameUr: z.string().optional(),
        category: z.string(),
        servingLabel: z.string(),
        servingGrams: z.number(),
        resolvedGrams: z.number(),
        calories: z.number(),
        proteinGrams: z.number(),
        fatGrams: z.number(),
        carbGrams: z.number(),
        fibreGrams: z.number(),
        oilAddedG: z.number(),
        matchScore: z.number(),
        portionSource: z.enum([
          'user_grams',
          'detected_grams',
          'portion_size',
          'default_serving',
        ]),
      })
    ),
  }),
  provider: z.string(),
});

export type ParseFoodTextResponse = z.infer<typeof ParseFoodTextResponseSchema>;
