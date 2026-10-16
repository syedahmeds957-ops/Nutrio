import { z } from 'zod';
import {
  parseMealItemText,
  parseMealText,
  UNIT_ALIASES,
  WEIGHT_UNITS,
  type ParsedMeal,
  type ParsedMealItem,
} from '@nutrio/food-db';
import { MODELS } from '../_shared/models.js';
import {
  ExtractedMealItemSchema,
  MEAL_UNITS,
  ParseFoodTextRequest,
  ParseFoodTextResponse,
  ParseFoodTextResponseSchema,
} from './schema.js';

/** Past this the deterministic parser answers instead; a slow parse is worse than a plain one. */
export const MODEL_TIMEOUT_MS = 4000;

const SYSTEM_PROMPT = `You split a meal description into food items. Input may be English, Roman Urdu or Urdu.

Return JSON: {"slot": "breakfast"|"lunch"|"dinner"|"snacks_chai" (only if stated), "items": [...]}
Each item: {"name": string, "quantity": number (omit if not stated), "unit": string (omit if not stated), "grams": number (only if the user gave a weight or volume)}

Rules:
1. NEVER output calories, macros or any nutrition number.
2. "name" is the food only. Remove filler ("I had", "khaya", "for breakfast", "with my tea").
3. Keep each food separate: "2 roti aur daal" is two items.
4. Units, when stated, are one of: ${MEAL_UNITS.join(', ')}. Map katora/pyala to bowl, chamach to tbsp.
5. Do not guess quantities or grams the user did not say.`;

/**
 * What the model may return; anything else it adds (calories, say) is dropped.
 * Numbers may arrive as strings ("2") and are coerced; a value that is still
 * invalid rejects the whole answer so the deterministic parser runs instead.
 * Quietly replacing a bad quantity with "1" would log the wrong amount.
 */
const ModelOutputSchema = z.object({
  slot: z.enum(['breakfast', 'lunch', 'dinner', 'snacks_chai']).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        quantity: z.coerce.number().positive().max(100).optional(),
        unit: z.string().max(20).optional(),
        grams: z.coerce.number().positive().max(5000).optional(),
      })
    )
    .min(1)
    .max(20),
});

type ModelItem = z.infer<typeof ModelOutputSchema>['items'][number];

/**
 * A model item as a parsed item. A name that still carries its own amount
 * ("2 roti") is read with the deterministic parser so the "2" is not lost; a
 * weight given as the unit ("200", "g") becomes grams.
 */
function toParsedItem(item: ModelItem): ParsedMealItem {
  const fromName = parseMealItemText(item.name);
  const unitKey = item.unit?.toLowerCase().trim() ?? '';
  const weightFactor = WEIGHT_UNITS[unitKey];
  const unit = UNIT_ALIASES[unitKey] ?? fromName?.unit;

  const nameQuantity = fromName?.quantityGiven ? fromName.quantity : undefined;
  const quantity = weightFactor !== undefined ? undefined : (item.quantity ?? nameQuantity);
  const grams =
    weightFactor !== undefined && item.quantity !== undefined
      ? item.quantity * weightFactor
      : (item.grams ?? fromName?.grams);

  return {
    text: item.name,
    name: fromName?.name ?? item.name.toLowerCase().trim(),
    quantity: quantity ?? 1,
    quantityGiven: quantity !== undefined,
    ...(unit ? { unit } : {}),
    ...(grams !== undefined ? { grams } : {}),
    ...(fromName?.issues ? { issues: fromName.issues } : {}),
    ...(fromName?.literal ? { literal: fromName.literal } : {}),
  };
}

/**
 * The model's split of the sentence, or undefined on any failure — network,
 * timeout, non-JSON, or a shape that fails validation — so the caller falls
 * back to the deterministic parser.
 */
export async function extractWithModel(
  text: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<ParsedMeal | undefined> {
  try {
    const res = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODELS.GROQ.TEXT_FAST,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });
    if (!res.ok) return undefined;

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return undefined;

    const output = ModelOutputSchema.safeParse(JSON.parse(content));
    if (!output.success) return undefined;

    // One bad item rejects the answer: dropping it would lose a food unnoticed.
    const items = output.data.items.map(toParsedItem);
    if (!items.every((i) => ExtractedMealItemSchema.safeParse(i).success)) return undefined;
    return { ...(output.data.slot ? { slot: output.data.slot } : {}), items };
  } catch {
    return undefined;
  }
}

/**
 * Splits a described meal into items. The model handles messy phrasing best;
 * the deterministic parser answers when there is no key or the model fails.
 * Either way the response carries no nutrition: the client resolves items
 * against its own catalogue with `analyzeMealItems`.
 */
export async function parseFoodTextService(
  request: ParseFoodTextRequest,
  apiKey?: string,
  fetchImpl: typeof fetch = fetch
): Promise<ParseFoodTextResponse> {
  const fromModel = apiKey ? await extractWithModel(request.text, apiKey, fetchImpl) : undefined;
  const parsed = fromModel ?? parseMealText(request.text);
  const slot = request.mealSlot ?? parsed.slot;

  return ParseFoodTextResponseSchema.parse({
    success: true,
    originalText: request.text,
    ...(slot ? { slot } : {}),
    items: parsed.items,
    provider: fromModel ? 'groq_nlp_parser' : 'deterministic',
  });
}
