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
import { i18n } from '../i18n/config.js';

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

  if (note.includes('kabsa') || note.includes('mandi') || note.includes('saleeg') || note.includes('madhbi')) {
    return {
      dishDetected: 'Chicken Kabsa',
      cookingMethod: 'Traditional Saudi spiced rice with tender bone-in chicken',
      detectedItems: [
        { detectedName: 'Chicken Kabsa', estimatedGrams: 350 },
      ],
    };
  }

  if (note.includes('albaik') || note.includes('broast') || note.includes('nugget')) {
    return {
      dishDetected: 'AlBaik Chicken Fillet & Garlic Sauce',
      cookingMethod: 'Fried chicken fillet with signature garlic sauce',
      detectedItems: [
        { detectedName: 'AlBaik Chicken Fillet Sandwich', estimatedGrams: 180 },
        { detectedName: 'AlBaik Garlic Sauce', estimatedGrams: 30 },
      ],
    };
  }

  if (note.includes('gahwa') || note.includes('date') || note.includes('sukari') || note.includes('ajwa')) {
    return {
      dishDetected: 'Saudi Gahwa & Sukari Dates',
      cookingMethod: 'Cardamom and saffron infused Arabic coffee with dates',
      detectedItems: [
        { detectedName: 'Saudi Gahwa (Arabic Coffee)', estimatedGrams: 60 },
        { detectedName: 'Sukari Dates (3 pcs)', estimatedGrams: 30 },
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
  const isSaudi = context.region === 'SA';

  // This runs outside React, so it reads the shared i18n instance rather than
  // the hook. Each topic owns a reply plus three follow-up prompts.
  const topic = (key: string, vars?: Record<string, unknown>) => ({
    reply: i18n.t(`coach.fallback.${key}.reply`, vars ?? {}),
    suggestedPrompts: [
      i18n.t(`coach.fallback.${key}.prompts.one`),
      i18n.t(`coach.fallback.${key}.prompts.two`),
      i18n.t(`coach.fallback.${key}.prompts.three`),
    ],
  });

  // 1. AlBaik / Fast Food Advice
  if (query.includes('albaik') || query.includes('broast') || query.includes('nugget') || query.includes('kudu')) {
    return topic('fastFood');
  }

  // 2. Kabsa / Mandi / Social Banquets
  if (
    query.includes('kabsa') ||
    query.includes('mandi') ||
    query.includes('saleeg') ||
    query.includes('madhbi') ||
    (isSaudi && (query.includes('rice') || query.includes('dawat') || query.includes('dinner')))
  ) {
    return topic('banquet');
  }

  // 3. Saudi Gahwa & Dates
  if (query.includes('gahwa') || query.includes('coffee') || query.includes('date') || query.includes('tamr')) {
    return topic('gahwa');
  }

  // 4. Pakistani Oil Reduction
  if (query.includes('oil') || query.includes('karahi') || query.includes('tel') || query.includes('ghee')) {
    return topic('cookingOil');
  }

  // 5. Pakistani Shaadi / Dawat
  if (query.includes('shaadi') || query.includes('dawat') || query.includes('buffet') || query.includes('party')) {
    return topic('dawat');
  }

  // 6. Pakistani Chai
  if (query.includes('chai') || query.includes('tea') || query.includes('doodh patti')) {
    return topic('chai');
  }

  // Default regional greeting
  return topic(isSaudi ? 'greetingSA' : 'greetingPK', {
    name: context.displayName || i18n.t('coach.defaultName'),
    remaining,
  });
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
