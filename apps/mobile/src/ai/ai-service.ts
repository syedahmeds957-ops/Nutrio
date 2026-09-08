import {
  buildCoachSystemPrompt,
  CoachContext,
} from '@nutrio/nutrition-core';
import {
  AiProviderConfig,
  CoachChatMessage,
  CoachChatResult,
  PhotoAnalysisResult,
  VisionDetectedItem,
} from './types.js';
import { resolveAiConfig } from './apiKeyStorage.js';

const DESI_VISION_SYSTEM_PROMPT = `You are a specialized Pakistani and South Asian culinary vision expert.
Analyze this meal photo and identify the dish, cooking technique, and estimated grams for each food item.

CRITICAL RULES:
1. NEVER output or estimate calorie numbers or macronutrient numbers.
2. Estimate the mass in grams for each food component realistically based on visual portion size.
3. Output strictly valid JSON with keys:
{
  "dishDetected": "Name of main dish",
  "cookingMethod": "Description of preparation (e.g. tarka tempered, karahi shallow fried, tandoor baked)",
  "items": [
    { "detectedName": "Chicken Karahi", "estimatedGrams": 200 },
    { "detectedName": "Roti / Chapati (Whole Wheat)", "estimatedGrams": 90 }
  ]
}`;

export function getFallbackVisionDetection(contextNote?: string): {
  dishDetected: string;
  cookingMethod: string;
  detectedItems: VisionDetectedItem[];
} {
  const note = (contextNote || '').toLowerCase();

  if (note.includes('biryani') || note.includes('pulao') || note.includes('rice')) {
    return {
      dishDetected: 'Chicken Biryani',
      cookingMethod: 'Dum cooked layered basmati rice with marinated chicken',
      detectedItems: [
        { detectedName: 'Chicken Biryani (Karachi Style)', estimatedGrams: 350 },
      ],
    };
  }

  if (note.includes('daal') || note.includes('lentil') || note.includes('chana') || note.includes('chawal')) {
    return {
      dishDetected: 'Daal Chana & Roti',
      cookingMethod: 'Tarka tempered lentils with tandoor whole wheat roti',
      detectedItems: [
        { detectedName: 'Daal Chana Tadka', estimatedGrams: 150 },
        { detectedName: 'Roti / Chapati (Whole Wheat)', estimatedGrams: 90 },
      ],
    };
  }

  if (note.includes('egg') || note.includes('anda') || note.includes('omelette') || note.includes('paratha')) {
    return {
      dishDetected: 'Desi Omelette & Paratha',
      cookingMethod: 'Pan-fried Pakistani spiced omelette with whole wheat paratha',
      detectedItems: [
        { detectedName: 'Pakistani Omelette (Pyaz Mirch)', estimatedGrams: 100 },
        { detectedName: 'Paratha (Whole Wheat, 1 tsp oil)', estimatedGrams: 90 },
      ],
    };
  }

  if (note.includes('nihari') || note.includes('beef') || note.includes('mutton')) {
    return {
      dishDetected: 'Beef Nihari & Naan',
      cookingMethod: 'Slow-cooked aromatic stew with ginger, green chilies and roghni naan',
      detectedItems: [
        { detectedName: 'Beef Nihari', estimatedGrams: 250 },
        { detectedName: 'Naan (Tandoori)', estimatedGrams: 100 },
      ],
    };
  }

  // Default balanced Pakistani household plate
  return {
    dishDetected: 'Chicken Karahi & Whole Wheat Roti',
    cookingMethod: 'Wok-seared chicken in tomato-ginger gravy with whole wheat chapati',
    detectedItems: [
      { detectedName: 'Chicken Karahi', estimatedGrams: 200 },
      { detectedName: 'Roti / Chapati (Whole Wheat)', estimatedGrams: 90 },
    ],
  };
}

export function getFallbackCoachResponse(
  userQuery: string,
  context: CoachContext
): { reply: string; suggestedPrompts: string[] } {
  const query = userQuery.toLowerCase();
  const remaining = context.todaySummary?.remainingCalories ?? 500;

  if (query.includes('oil') || query.includes('karahi') || query.includes('tel') || query.includes('ghee')) {
    return {
      reply: `In traditional Pakistani handis like Chicken Karahi, free-pouring cooking oil often adds 30-50g of hidden fat (270-450 kcal) to the pot.\n\n💡 Pro Habit: Use a tablespoon (1 tbsp = 14g, ~120 kcal) for the entire family handi, or simmer tomatoes early to create a rich, silky gravy with minimal oil.`,
      suggestedPrompts: [
        'How many spoons of oil should I use for 4 people?',
        'Can I use mustard oil or olive oil for desi cooking?',
        'What should I eat for dinner tonight?',
      ],
    };
  }

  if (query.includes('shaadi') || query.includes('dawat') || query.includes('buffet') || query.includes('party')) {
    return {
      reply: `For shaadi or dawat nights, use the "Desi Harm-Reduction" strategy:\n1. Fill half your plate first with grilled proteins (chicken tikka, seekh kabab) and fresh cucumber/onion salad.\n2. Pick ONE primary carb: either 1 naan OR 1 small cup of biryani, not both.\n3. Drink 2 glasses of water before eating, and enjoy 1 small piece of sweet (gulab jamun/kheer) mindfully.`,
      suggestedPrompts: [
        'How do I log food if I eat out at a dawat?',
        'What is the best choice at a BBQ restaurant?',
        'Can I skip lunch before a heavy dinner?',
      ],
    };
  }

  if (query.includes('chai') || query.includes('tea') || query.includes('doodh patti')) {
    return {
      reply: `Traditional doodh patti made with whole milk and 2 teaspoons of sugar easily packs 180-220 kcal per cup!\n\n💡 Try the "half doodh, half paani" technique (50% milk + 50% water) with half a spoon of sugar or stevia. If you drink 2-3 cups a day, this saves ~300 kcal without giving up your chai ritual.`,
      suggestedPrompts: [
        'Is green tea or kehwa better for fat loss?',
        'What healthy desi snacks can I have with chai?',
        'How do I control evening sugar cravings?',
      ],
    };
  }

  return {
    reply: `Assalam-o-Alaikum ${context.displayName || 'there'}! You currently have approximately ${remaining} kcal remaining in your daily budget.\n\nFocus on getting lean protein (daal, eggs, chicken) and fibre-rich whole wheat roti while keeping cooking oil measured. What specific meal or habit can I help you optimize today?`,
    suggestedPrompts: [
      'How to reduce oil in everyday cooking?',
      'High protein Pakistani breakfast ideas',
      'Tips for dining out at dawats',
    ],
  };
}

export async function analyzeMealPhoto(
  imageBase64: string,
  contextNote?: string,
  customConfig?: AiProviderConfig
): Promise<PhotoAnalysisResult> {
  const config = customConfig || resolveAiConfig();

  // Normalize base64
  const cleanBase64 = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;
  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  // 1. OpenAI Vision
  if (config.provider === 'openai' && config.apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: DESI_VISION_SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this South Asian meal photo. Note: ${contextNote || 'None'}. Return JSON strictly matching the schema.`,
                },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.dishDetected && Array.isArray(parsed.items)) {
            return {
              dishDetected: parsed.dishDetected,
              cookingMethod: parsed.cookingMethod || 'Prepared meal',
              detectedItems: parsed.items.map((i: any) => ({
                detectedName: String(i.detectedName || i.name || 'Desi dish'),
                estimatedGrams: Number(i.estimatedGrams || i.grams || 150),
              })),
              providerUsed: 'openai',
            };
          }
        }
      }
    } catch {
      // fallback on failure
    }
  }

  // 2. Google Gemini Vision
  if (config.provider === 'gemini' && config.apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${
        config.model || 'gemini-1.5-flash'
      }:generateContent?key=${config.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: DESI_VISION_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Analyze this South Asian meal photo. Note: ${contextNote || 'None'}. Output valid JSON.`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.dishDetected && Array.isArray(parsed.items)) {
            return {
              dishDetected: parsed.dishDetected,
              cookingMethod: parsed.cookingMethod || 'Prepared meal',
              detectedItems: parsed.items.map((i: any) => ({
                detectedName: String(i.detectedName || i.name || 'Desi dish'),
                estimatedGrams: Number(i.estimatedGrams || i.grams || 150),
              })),
              providerUsed: 'gemini',
            };
          }
        }
      }
    } catch {
      // fallback on failure
    }
  }

  // 3. Fallback
  const fallback = getFallbackVisionDetection(contextNote);
  return {
    ...fallback,
    providerUsed: 'deterministic_fallback',
  };
}

export async function sendCoachMessage(
  messages: CoachChatMessage[],
  context: CoachContext,
  customConfig?: AiProviderConfig
): Promise<CoachChatResult> {
  const config = customConfig || resolveAiConfig();
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const safeContext: CoachContext = {
    ...context,
    displayName: context.displayName || 'Client',
    ageYears: context.ageYears ?? 28,
    sex: context.sex ?? 'male',
    weightKg: context.weightKg ?? 70,
    goal: context.goal || 'maintain',
    targets: context.targets || {
      kcalTarget: 2000,
      proteinGrams: 140,
      fatGrams: 55,
      carbGrams: 230,
    },
  };
  const systemPrompt = buildCoachSystemPrompt(safeContext);

  const promptWithInstructions = `${systemPrompt}

OUTPUT FORMAT REQUIREMENT:
Respond in conversational text. At the very end, provide exactly 3 short follow-up prompts on a new line prefixed with "SUGGESTIONS:":
[Your natural conversational advice here]

SUGGESTIONS: ["Question 1", "Question 2", "Question 3"]`;

  // 1. OpenAI
  if (config.provider === 'openai' && config.apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: promptWithInstructions },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return parseCoachResponseText(content, 'openai');
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. Gemini
  if (config.provider === 'gemini' && config.apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${
        config.model || 'gemini-1.5-flash'
      }:generateContent?key=${config.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: promptWithInstructions }],
          },
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return parseCoachResponseText(text, 'gemini');
        }
      }
    } catch {
      // fallback
    }
  }

  // 3. Fallback
  const fallback = getFallbackCoachResponse(lastUserMsg, context);
  return {
    reply: fallback.reply,
    suggestedPrompts: fallback.suggestedPrompts,
    providerUsed: 'deterministic_fallback',
  };
}

function parseCoachResponseText(
  rawText: string,
  provider: 'openai' | 'gemini'
): CoachChatResult {
  const suggestionsIndex = rawText.indexOf('SUGGESTIONS:');
  if (suggestionsIndex !== -1) {
    const reply = rawText.substring(0, suggestionsIndex).trim();
    const suggestionsPart = rawText.substring(suggestionsIndex + 'SUGGESTIONS:'.length).trim();
    try {
      const parsed = JSON.parse(suggestionsPart);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          reply,
          suggestedPrompts: parsed.map(String).slice(0, 3),
          providerUsed: provider,
        };
      }
    } catch {
      // try line splitting
      const lines = suggestionsPart
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.]+\s*/, '').replace(/["[\]]/g, '').trim())
        .filter(Boolean);
      if (lines.length > 0) {
        return {
          reply,
          suggestedPrompts: lines.slice(0, 3),
          providerUsed: provider,
        };
      }
    }
    return {
      reply,
      suggestedPrompts: [
        'How to reduce oil in cooking?',
        'High protein Pakistani meal ideas',
        'Tips for dining at dawats',
      ],
      providerUsed: provider,
    };
  }

  return {
    reply: rawText.trim(),
    suggestedPrompts: [
      'How to reduce oil in cooking?',
      'High protein Pakistani meal ideas',
      'Tips for dining at dawats',
    ],
    providerUsed: provider,
  };
}
