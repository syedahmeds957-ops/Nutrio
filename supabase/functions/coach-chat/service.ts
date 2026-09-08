import {
  buildCoachSystemPrompt,
  CoachContext,
  validateCoachResponse,
} from '@nutrio/nutrition-core';
import { MODELS } from '../_shared/models.js';
import {
  CoachChatRequest,
  CoachChatResponse,
  CoachChatResponseSchema,
} from './schema.js';

function getFallbackCoachResponse(
  userQuery: string,
  context: CoachContext
): { reply: string; suggestedPrompts: string[] } {
  const query = userQuery.toLowerCase();
  const remaining = context.todaySummary?.remainingCalories ?? 500;

  if (query.includes('oil') || query.includes('karahi') || query.includes('tel')) {
    return {
      reply: `In traditional Pakistani handis like Chicken Karahi, cooks often free-pour oil, adding 30-50g of hidden fat (270-450 kcal).
A game-changing habit: measure oil using a tablespoon (1 tbsp = 14g, ~120 kcal) for the entire family pot, or add tomatoes early to create a rich gravy without excess ghee.`,
      suggestedPrompts: [
        'How many spoons of oil should I use for 4 people?',
        'Can I use olive oil or mustard oil for desi cooking?',
        'What should I eat for dinner tonight?',
      ],
    };
  }

  if (query.includes('shaadi') || query.includes('dawat') || query.includes('buffet')) {
    return {
      reply: `For shaadi or dawat nights, use the "Desi Harm-Reduction" strategy:
1. Fill half your plate first with grilled proteins (tikka, seekh kabab) and fresh salad.
2. Pick ONE carb: either 1 naan OR 1 scoop of biryani, not both.
3. Have 1 piece of sweet (gulab jamun/kheer) mindfully, and drink 2 glasses of water before eating.`,
      suggestedPrompts: [
        'How do I log food if I eat out at a dawat?',
        'What is the best choice at a BBQ restaurant?',
        'Can I skip lunch before a heavy dinner?',
      ],
    };
  }

  if (query.includes('chai') || query.includes('tea') || query.includes('doodh patti')) {
    return {
      reply: `Traditional doodh patti made with whole milk and 2 spoons of sugar can easily pack 180-220 kcal per cup!
If you drink 2-3 cups daily, try switching to 50% milk + 50% water (half doodh, half paani) with half a spoon of sugar or stevia. That saves ~300 kcal a day without giving up your chai ritual.`,
      suggestedPrompts: [
        'Is green tea or kehwa better for fat loss?',
        'What healthy desi snacks can I have with chai?',
        'How do I control evening sugar cravings?',
      ],
    };
  }

  return {
    reply: `Assalam-o-Alaikum ${context.displayName || 'there'}! You currently have approximately ${remaining} kcal remaining in your daily budget.
Focus on getting quality protein (daal, eggs, chicken) and fibre-rich whole wheat roti while keeping cooking oil measured. What specific meal or routine can I help you adjust today?`,
    suggestedPrompts: [
      'How to reduce oil in everyday cooking?',
      'High protein Pakistani breakfast ideas',
      'Tips for dining out at dawats',
    ],
  };
}

export async function coachChatService(
  request: CoachChatRequest,
  apiKey?: string
): Promise<CoachChatResponse> {
  const systemPrompt = buildCoachSystemPrompt(request.context as CoachContext);
  const lastUserMessage =
    [...request.messages].reverse().find((m) => m.role === 'user')?.content || '';

  let reply = '';
  let suggestedPrompts: string[] = [
    'How to reduce oil in desi cooking?',
    'What healthy desi snacks go with chai?',
    'Tips for dining at a shaadi or dawat',
  ];
  let provider = 'deterministic_coach_fallback';

  if (apiKey) {
    try {
      const promptInstructions = `${systemPrompt}

OUTPUT FORMAT REQUIREMENT:
Respond in conversational text, then at the very end, provide 3 short follow-up prompts on a new line prefixed with "SUGGESTIONS:":
[Your natural advice here]

SUGGESTIONS: ["Prompt 1", "Prompt 2", "Prompt 3"]`;

      const messages = [
        { role: 'system', content: promptInstructions },
        ...request.messages,
      ];

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.GROQ.CHAT_NARRATIVE,
          messages,
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          const split = rawContent.split(/SUGGESTIONS:\s*/i);
          reply = split[0].trim();
          if (split[1]) {
            try {
              const parsed = JSON.parse(split[1].trim());
              if (Array.isArray(parsed) && parsed.length > 0) {
                suggestedPrompts = parsed.map(String);
              }
            } catch {
              // fallback suggestions preserved
            }
          }
          provider = 'groq_gpt_oss_120b';
        }
      }
    } catch {
      // Fallback
    }
  }

  if (!reply) {
    const fallback = getFallbackCoachResponse(
      lastUserMessage,
      request.context as CoachContext
    );
    reply = fallback.reply;
    suggestedPrompts = fallback.suggestedPrompts;
  }

  // Enforce clinical safety guardrail
  const validation = validateCoachResponse(reply);

  const response: CoachChatResponse = {
    success: true,
    reply: validation.sanitizedText,
    suggestedPrompts: suggestedPrompts.slice(0, 3),
    provider,
    flagsTriggered: validation.flagsTriggered,
  };

  return CoachChatResponseSchema.parse(response);
}
