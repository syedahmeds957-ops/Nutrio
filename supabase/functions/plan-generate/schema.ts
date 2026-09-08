import { z } from 'zod';

export const PlanGenerateRequestSchema = z.object({
  targetCalories: z.number().positive().min(1000).max(5000),
  targetProteinGrams: z.number().positive().min(30).max(350),
  targetFatGrams: z.number().positive().min(20).max(200),
  targetCarbGrams: z.number().positive().min(30).max(600),
  dietPreference: z.enum([
    'halal_omnivore',
    'halal_meat_moderate',
    'vegetarian_desi',
    'eggetarian',
    'vegan',
  ]),
  budgetTierPKR: z.enum([
    'budget_under_3500',
    'standard_3500_7000',
    'premium_above_7000',
  ]),
  dislikedFoods: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  isRamadanMode: z.boolean().optional(),
  familyMode: z
    .object({
      familyDishName: z.string().min(2),
      familyMealSlot: z.enum(['lunch', 'dinner']),
    })
    .optional(),
});

export type PlanGenerateRequest = z.infer<typeof PlanGenerateRequestSchema>;

export const PlannedMealItemSchema = z.object({
  foodName: z.string(),
  foodNameUr: z.string().optional(),
  category: z.string(),
  servingLabel: z.string(),
  servingGrams: z.number(),
  quantity: z.number(),
  totalGrams: z.number(),
  calories: z.number(),
  proteinGrams: z.number(),
  fatGrams: z.number(),
  carbGrams: z.number(),
  fibreGrams: z.number(),
  oilAddedG: z.number(),
});

export const PlannedMealSlotSchema = z.object({
  slot: z.enum(['breakfast', 'lunch', 'dinner', 'snacks_chai']),
  title: z.string(),
  targetCalories: z.number(),
  actualCalories: z.number(),
  items: z.array(PlannedMealItemSchema),
});

export const PlanGenerateResponseSchema = z.object({
  success: z.boolean(),
  plan: z.object({
    targetCalories: z.number(),
    actualCalories: z.number(),
    calorieDeviationPct: z.number(),
    targetProteinGrams: z.number(),
    actualProteinGrams: z.number(),
    targetFatGrams: z.number(),
    actualFatGrams: z.number(),
    targetCarbGrams: z.number(),
    actualCarbGrams: z.number(),
    totalFibreGrams: z.number(),
    totalOilAddedG: z.number(),
    meals: z.array(PlannedMealSlotSchema),
    isWithinTolerance: z.boolean(),
    budgetTier: z.string(),
    dietPreference: z.string(),
  }),
  culturalNarrative: z.string(),
  cookingAdvice: z.string(),
  hydrationAdvice: z.string(),
  isFamilyModeActive: z.boolean(),
  isRamadanModeActive: z.boolean(),
  provider: z.string(),
});

export type PlanGenerateResponse = z.infer<typeof PlanGenerateResponseSchema>;
