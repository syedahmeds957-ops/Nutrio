import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const CoachChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  context: z.object({
    displayName: z.string().optional(),
    sex: z.enum(['male', 'female']),
    ageYears: z.number(),
    weightKg: z.number(),
    goal: z.enum(['lose', 'maintain', 'gain']),
    targets: z.object({
      kcalTarget: z.number(),
      proteinGrams: z.number(),
      fatGrams: z.number(),
      carbGrams: z.number(),
      waterMl: z.number().optional(),
    }),
    todaySummary: z
      .object({
        caloriesConsumed: z.number(),
        proteinConsumed: z.number(),
        fatConsumed: z.number(),
        carbConsumed: z.number(),
        remainingCalories: z.number(),
        foodsLoggedToday: z.array(z.string()).optional(),
      })
      .optional(),
    medicalFlags: z.array(z.string()).optional(),
    dietaryPreferences: z.array(z.string()).optional(),
    isRamadanMode: z.boolean().optional(),
  }),
});

export type CoachChatRequest = z.infer<typeof CoachChatRequestSchema>;

export const CoachChatResponseSchema = z.object({
  success: z.boolean(),
  reply: z.string(),
  suggestedPrompts: z.array(z.string()),
  provider: z.string(),
  flagsTriggered: z.array(z.string()),
});

export type CoachChatResponse = z.infer<typeof CoachChatResponseSchema>;
