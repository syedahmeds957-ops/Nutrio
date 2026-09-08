import { z } from 'zod';

export const AssessmentNarrativeSchema = z.object({
  summary: z.string().min(20).max(500),
  whyThisNumber: z.string().min(20).max(600),
  highestLeverageChanges: z
    .array(z.string().min(10).max(300))
    .min(3)
    .max(3),
  culturalLifestyleInsight: z.string().min(20).max(500),
  weekByWeekExpectation: z.string().min(20).max(500),
});

export type AssessmentNarrative = z.infer<typeof AssessmentNarrativeSchema>;

export const AssessmentResponseSchema = z.object({
  success: z.boolean(),
  targets: z.object({
    bmr: z.number(),
    tdee: z.number(),
    targetCalories: z.number(),
    targetProteinGrams: z.number(),
    targetFatGrams: z.number(),
    targetCarbGrams: z.number(),
    targetFibreGrams: z.number(),
    targetWaterMl: z.number(),
    calculationMethod: z.string(),
  }),
  narrative: AssessmentNarrativeSchema,
  safetyFlags: z.array(z.string()),
  culturalMetrics: z.object({
    dailyChaiSugarKcal: z.number(),
    weeklyChaiSugarKcal: z.number(),
    isHighChaiIntake: z.boolean(),
    isSedentaryWorker: z.boolean(),
    isNightShift: z.boolean(),
  }),
  generatedBy: z.enum(['groq_llm', 'deterministic_fallback']),
});

export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;
