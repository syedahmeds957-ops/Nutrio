import { z } from 'zod';

export const DayIntakeSchema = z.object({
  date: z.string(),
  kcal: z.number().nonnegative(),
});

export const DayWeightSchema = z.object({
  date: z.string(),
  weightKg: z.number().positive(),
});

export const WeeklyReviewRequestSchema = z.object({
  userId: z.string().optional(),
  displayName: z.string().optional(),
  currentTDEE: z.number().positive(),
  currentKcalTarget: z.number().positive(),
  bmr: z.number().positive(),
  goal: z.enum(['lose', 'maintain', 'gain']),
  dailyIntakes: z.array(DayIntakeSchema).min(1).max(30),
  dailyWeights: z.array(DayWeightSchema).min(1).max(30),
  previousEWMAWeightKg: z.number().positive().optional(),
});

export type WeeklyReviewRequest = z.infer<typeof WeeklyReviewRequestSchema>;

export const WeeklyReviewResponseSchema = z.object({
  success: z.boolean(),
  metrics: z.object({
    daysLogged: z.number(),
    meanDailyIntake: z.number(),
    currentEWMAWeightKg: z.number(),
    weightDeltaKg: z.number(),
    adherenceRatePct: z.number(),
    oldTDEE: z.number(),
    newTDEE: z.number(),
    tdeeDelta: z.number(),
    oldKcalTarget: z.number(),
    newKcalTarget: z.number(),
    targetDelta: z.number(),
  }),
  narrative: z.object({
    headline: z.string(),
    summaryText: z.string(),
    keyActionLever: z.string(),
  }),
  provider: z.string(),
});

export type WeeklyReviewResponse = z.infer<typeof WeeklyReviewResponseSchema>;
