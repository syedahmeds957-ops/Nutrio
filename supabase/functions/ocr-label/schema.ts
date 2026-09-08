import { z } from 'zod';

export const OCRLabelResultSchema = z.object({
  productName: z.string().min(2).max(120),
  brand: z.string().max(80).optional(),
  servingSizeText: z.string().min(1).max(60),
  servingSizeGrams: z.number().positive(),
  caloriesPerServing: z.number().nonnegative(),
  caloriesPer100g: z.number().nonnegative(),
  proteinGramsPer100g: z.number().nonnegative(),
  fatGramsPer100g: z.number().nonnegative(),
  carbGramsPer100g: z.number().nonnegative(),
  fibreGramsPer100g: z.number().nonnegative().optional(),
  sodiumMgPer100g: z.number().nonnegative().optional(),
  confidence: z.number().min(0).max(1),
  isMathConsistent: z.boolean(),
});

export type OCRLabelResult = z.infer<typeof OCRLabelResultSchema>;

export const OCRLabelRequestSchema = z.object({
  imageBase64: z.string().min(20).optional(),
  imageUrl: z.string().url().optional(),
  hintText: z.string().max(100).optional(),
}).refine((data) => Boolean(data.imageBase64 || data.imageUrl), {
  message: 'Must provide either imageBase64 or imageUrl.',
});

export type OCRLabelRequest = z.infer<typeof OCRLabelRequestSchema>;
