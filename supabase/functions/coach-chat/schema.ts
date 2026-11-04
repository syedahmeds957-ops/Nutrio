import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const JointLoadSchema = z.enum(['knee', 'lower_back', 'shoulder', 'wrist']);

/** The exercise the user opened the coach about, and the only swaps the app allows for it. */
export const SwapRequestSchema = z.object({
  exerciseId: z.string().min(1).max(80),
  exerciseName: z.string().min(1).max(120),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        name: z.string().min(1).max(120),
        jointLoads: z.array(JointLoadSchema).max(4),
      })
    )
    .max(8),
});

export type SwapRequest = z.infer<typeof SwapRequestSchema>;

export const CoachChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  swapRequest: SwapRequestSchema.optional(),
  context: z.object({
    displayName: z.string().optional(),
    region: z.enum(['PK', 'SA']).optional(),
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
    workout: z
      .object({
        location: z.enum(['home_none', 'home_equipment', 'gym']),
        sessionsPlannedThisWeek: z.number().int().min(0).max(7),
        sessionsDoneThisWeek: z.number().int().min(0).max(14),
        today: z
          .object({
            title: z.string().max(80),
            exercises: z.array(z.string().max(120)).max(12),
          })
          .optional(),
        ramadan: z.boolean(),
      })
      .optional(),
  }),
});

export type CoachChatRequest = z.infer<typeof CoachChatRequestSchema>;

export const CoachChatResponseSchema = z.object({
  success: z.boolean(),
  reply: z.string(),
  suggestedPrompts: z.array(z.string()),
  provider: z.string(),
  flagsTriggered: z.array(z.string()),
  /** Only ever one of the request's candidates; the app still asks the user before applying it. */
  proposedSwap: z
    .object({
      toId: z.string(),
      reason: z.string().max(300),
    })
    .optional(),
});

export type CoachChatResponse = z.infer<typeof CoachChatResponseSchema>;
