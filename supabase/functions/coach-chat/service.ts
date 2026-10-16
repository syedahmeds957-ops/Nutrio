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

// Reasoning plus a short reply; Groq's documented default for gpt-oss.
const COACH_MAX_COMPLETION_TOKENS = 1024;

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
        'How much oil should I use when cooking for 4 people?',
        'Is olive oil better than ghee for cooking?',
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
        'How do I log food I ate at a dawat?',
        'What should I pick at a BBQ restaurant?',
        'Should I skip lunch before a big dinner?',
      ],
    };
  }

  if (query.includes('chai') || query.includes('tea') || query.includes('doodh patti')) {
    return {
      reply: `Traditional doodh patti made with whole milk and 2 spoons of sugar can easily pack 180-220 kcal per cup!
If you drink 2-3 cups daily, try switching to 50% milk + 50% water (half doodh, half paani) with half a spoon of sugar or stevia. That saves ~300 kcal a day without giving up your chai ritual.`,
      suggestedPrompts: [
        'Are 3 cups of chai a day too many?',
        'What can I have with chai instead of biscuits?',
        'How do I stop craving sweets in the evening?',
      ],
    };
  }

  return {
    reply: `Assalam-o-Alaikum ${context.displayName || 'there'}! You currently have approximately ${remaining} kcal remaining in your daily budget.
Focus on getting quality protein (daal, eggs, chicken) and fibre-rich whole wheat roti while keeping cooking oil measured. What specific meal or routine can I help you adjust today?`,
    suggestedPrompts: [
      'What breakfast will keep me full until lunch?',
      'How can I get more protein without much meat?',
      "I'm still hungry after dinner. What can I eat?",
    ],
  };
}

/** Past this a suggestion is a paragraph, not a tap-to-ask question. */
const MAX_SUGGESTION_CHARS = 90;

/**
 * Keeps only suggestions that read as a question the user would ask. The model
 * sometimes returns topic headings ("High-protein snack ideas") despite the
 * prompt; those are dropped and the defaults stay.
 */
export function isSuggestedQuestion(text: string): boolean {
  const q = text.trim();
  return q.length > 5 && q.length <= MAX_SUGGESTION_CHARS && q.endsWith('?');
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
    'What breakfast will keep me full until lunch?',
    'How can I get more protein without much meat?',
    "I'm still hungry after dinner. What can I eat?",
  ];
  let provider = 'deterministic_coach_fallback';

  if (apiKey) {
    try {
      const promptInstructions = `${systemPrompt}

ANSWER STYLE (strict):
- Answer the exact question in the first sentence. No greeting, no restating the question, no preamble.
- Keep the whole answer under 80 words: 2 to 4 short sentences, or at most 3 short bullet points when listing options.
- Be specific: real foods, amounts and numbers from the user's targets and today's log above. No generic wellness advice.
- Only add an explanation if the user asked "why".

OUTPUT FORMAT REQUIREMENT:
Write the answer as plain text. Then, at the very end, on a new line prefixed with "SUGGESTIONS:", give 3 questions the user is likely to ask you next.
Write them the way a real person types to their nutrition coach: first person, everyday words, under 12 words, each ending with "?", and about what was just discussed or their day (e.g. "Can I have a second roti at dinner?", "What should I eat before the gym?").
Never write topic headings or slogans ("High-protein snack ideas", "Balancing your macros"), never name brands or restaurants, and never repeat a question already asked in this chat.
[Your short, direct answer here]

SUGGESTIONS: ["Question 1?", "Question 2?", "Question 3?"]`;

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
          // gpt-oss is a reasoning model: hidden reasoning tokens share the
          // completion budget, and at the default effort they could use all of
          // it and leave the reply empty. Low effort suits short coaching
          // replies, and leaving the reasoning text out keeps responses small.
          reasoning_effort: 'low',
          include_reasoning: false,
          max_completion_tokens: COACH_MAX_COMPLETION_TOKENS,
        }),
      });

      if (!res.ok) {
        // Never log the key; Groq's error message says what went wrong
        // (invalid key, rate limit, unknown model).
        const detail = await res.text().catch(() => '');
        console.warn(`[coach-chat] Groq returned HTTP ${res.status}: ${detail.slice(0, 300)}`);
      } else {
        const data = await res.json();
        const choice = data.choices?.[0];
        const rawContent = choice?.message?.content;
        if (!rawContent) {
          console.warn(`[coach-chat] Groq sent an empty reply (finish_reason: ${choice?.finish_reason})`);
        }
        if (rawContent) {
          const split = rawContent.split(/SUGGESTIONS:\s*/i);
          reply = split[0].trim();
          if (split[1]) {
            try {
              const parsed = JSON.parse(split[1].trim());
              const questions = Array.isArray(parsed) ? parsed.map(String).filter(isSuggestedQuestion) : [];
              if (questions.length > 0) {
                suggestedPrompts = questions;
              }
            } catch {
              // fallback suggestions preserved
            }
          }
          provider = 'groq_gpt_oss_120b';
        }
      }
    } catch (err) {
      console.warn(`[coach-chat] Groq request failed: ${(err as Error)?.message ?? err}`);
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
