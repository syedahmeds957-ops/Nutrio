import { z } from 'zod';

export const EstimatePhotoRequestSchema = z.object({
  imageBase64: z.string().min(10),
  referenceObject: z
    .enum(['spoon', 'hand', 'plate', 'phone', 'none'])
    .optional(),
  contextNote: z.string().max(200).optional(),
  calibrationFactors: z.record(z.string(), z.number()).optional(),
});

export type EstimatePhotoRequest = z.infer<typeof EstimatePhotoRequestSchema>;

export const DetectedVisionItemSchema = z.object({
  detectedName: z.string(),
  estimatedGrams: z.number().optional(),
  portionSize: z.enum(['S', 'M', 'L']).optional(),
});

export type DetectedVisionItem = z.infer<typeof DetectedVisionItemSchema>;

export const EstimatePhotoResponseSchema = z.object({
  success: z.boolean(),
  dishDetected: z.string(),
  cookingMethod: z.string(),
  detectedItems: z.array(DetectedVisionItemSchema),
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

export type EstimatePhotoResponse = z.infer<typeof EstimatePhotoResponseSchema>;
