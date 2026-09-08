import {
  DetectedFoodItem,
  resolveDetectedPlate,
} from '@nutrio/nutrition-core';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { MODELS } from '../_shared/models.js';
import {
  ParsedFoodItemCandidate,
  ParseFoodTextRequest,
  ParseFoodTextResponse,
  ParseFoodTextResponseSchema,
} from './schema.js';

// Number words in Roman Urdu and Urdu
const NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  aik: 1,
  one: 1,
  '1': 1,
  ایک: 1,
  do: 2,
  two: 2,
  '2': 2,
  دو: 2,
  teen: 3,
  three: 3,
  '3': 3,
  تین: 3,
  char: 4,
  chaar: 4,
  four: 4,
  '4': 4,
  چار: 4,
  paanch: 5,
  five: 5,
  '5': 5,
  پانچ: 5,
  aadha: 0.5,
  aadhi: 0.5,
  half: 0.5,
};

/**
 * Deterministic fallback parser for Pakistani / Desi meal phrases.
 */
export function parseFoodTextFallback(text: string): ParsedFoodItemCandidate[] {
  const lower = text.toLowerCase();
  const segments = lower
    .split(/,|\baur\b|\band\b|\bsaath\b|\bplus\b|\bwith\b|\b&\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates: ParsedFoodItemCandidate[] = [];

  for (const segment of segments) {
    let quantity = 1;
    const tokens = segment.split(/\s+/);

    for (const token of tokens) {
      if (NUMBER_WORDS[token] !== undefined) {
        quantity = NUMBER_WORDS[token];
        break;
      }
    }

    // Clean segment by removing quantifier words and units
    const cleanName = segment
      .replace(
        /\b(ek|aik|do|teen|char|chaar|paanch|one|two|three|four|five|aadha|aadhi|half|\d+)\b/gi,
        ''
      )
      .replace(
        /\b(katori|bowl|plate|cup|glass|serving|servings|piece|pieces|slice|slices|chamach|spoon)\b/gi,
        ''
      )
      .trim();

    if (cleanName.length >= 2) {
      candidates.push({
        detectedName: cleanName,
        quantity,
      });
    }
  }

  if (candidates.length === 0 && text.trim().length >= 2) {
    candidates.push({
      detectedName: text.trim(),
      quantity: 1,
    });
  }

  return candidates;
}

export async function parseFoodTextService(
  request: ParseFoodTextRequest,
  apiKey?: string
): Promise<ParseFoodTextResponse> {
  let detectedCandidates = parseFoodTextFallback(request.text);
  let provider = 'deterministic_regex';

  if (apiKey) {
    try {
      const systemPrompt = `You are an expert Pakistani culinary and multilingual NLP entity parser.
Extract food items and quantities from the user's meal query (which may be in Roman Urdu, Urdu, or English).

CRITICAL RULES:
1. NEVER output or estimate calories or macronutrient numbers.
2. Return strictly valid JSON array of objects:
[
  { "detectedName": "Roti", "quantity": 2, "unit": "pieces" },
  { "detectedName": "Chicken Karahi", "quantity": 1, "unit": "katori" }
]`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.GROQ.CHAT_NARRATIVE,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: request.text },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const items = Array.isArray(parsed)
            ? parsed
            : parsed.items || parsed.foods;
          if (Array.isArray(items) && items.length > 0) {
            detectedCandidates = items.map((i: any) => ({
              detectedName: String(i.detectedName || i.name),
              quantity: Number(i.quantity) || 1,
              unit: i.unit ? String(i.unit) : undefined,
              estimatedGrams: i.estimatedGrams ? Number(i.estimatedGrams) : undefined,
            }));
            provider = 'groq_nlp_parser';
          }
        }
      }
    } catch {
      // Gracefully fall back to deterministic regex parser
    }
  }

  // Ground against food DB via nutrition-core resolver
  const detectedItems: DetectedFoodItem[] = detectedCandidates.map((c) => ({
    detectedName: c.detectedName,
    estimatedGrams: c.estimatedGrams,
    servingMultiplier: c.quantity,
  }));

  const resolution = resolveDetectedPlate(
    detectedItems,
    PAKISTANI_STAPLES_DATA as any,
    request.calibrationFactors || {}
  );

  const response: ParseFoodTextResponse = {
    success: true,
    originalText: request.text,
    detectedItems: detectedCandidates,
    resolution,
    provider,
  };

  return ParseFoodTextResponseSchema.parse(response);
}
