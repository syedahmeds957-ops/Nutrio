import { z } from 'zod';
import { MODELS } from '../_shared/models.js';
import {
  DishBreakdownRequest,
  DishBreakdownResponse,
  DishBreakdownResponseSchema,
  MAX_INGREDIENT_GRAMS,
  MAX_INGREDIENTS,
  MAX_SERVING_GRAMS,
} from './schema.js';

/** Searching the web is slow; past this the user is better told to try again. */
export const MODEL_TIMEOUT_MS = 25_000;

const systemPrompt = (region: DishBreakdownRequest['region'], catalogueNames: string[]) => `You are a dietitian's recipe assistant for a ${
  region === 'SA' ? 'Saudi' : 'Pakistani'
} food-logging app. The user names a dish that is not in the app's food list. Work out what the dish is and how ONE typical serving is made, then express that serving as ingredients chosen from the CATALOGUE below.

Rules:
1. NEVER output calories, macros or any nutrition number. Only ingredient names and grams.
2. Every ingredient "name" must be copied EXACTLY from the CATALOGUE. Pick the closest entry (e.g. raw chicken in a curry -> the plainest chicken entry; cooking oil -> "Cooking Oil (Any Plain Oil)"). Never invent a name.
3. Grams are the cooked, edible weight in one serving, including the oil or ghee the dish is cooked in.
4. Leave out spices, salt, garlic, ginger, herbs and anything under 5 g.
5. At most ${MAX_INGREDIENTS} ingredients. One serving should weigh 100 to ${MAX_SERVING_GRAMS} g in total.
6. If you do not recognise the dish even after searching, return {"unknown": true}.

Answer with ONLY this JSON, no other text:
{"dishName": string, "servingDescription": string, "ingredients": [{"name": string, "grams": number}]}

CATALOGUE:
${catalogueNames.join('\n')}`;

/** What the model may return; any extra field (calories, say) is dropped. */
const ModelOutputSchema = z.object({
  dishName: z.string().trim().min(1).max(80),
  servingDescription: z.string().trim().max(120).default(''),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        grams: z.coerce.number().positive().max(MAX_INGREDIENT_GRAMS),
      })
    )
    .min(1)
    .max(MAX_INGREDIENTS),
});

/**
 * Browser search cannot be combined with Groq's structured-output mode, so the
 * JSON arrives inside ordinary text. Takes the outermost object, tolerating a
 * code fence or a sentence around it.
 */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

export type BreakdownOutcome =
  | { kind: 'ok'; response: DishBreakdownResponse }
  | { kind: 'unknown_dish' }
  | { kind: 'failed' };

/**
 * Validates the model's answer against the catalogue the app sent. A name the
 * catalogue does not hold is dropped rather than guessed at; if that leaves
 * nothing, or the serving weight is implausible, the answer is rejected.
 */
export function toResponse(
  raw: unknown,
  catalogueNames: string[],
  usedWebSearch: boolean
): BreakdownOutcome {
  if (raw && typeof raw === 'object' && (raw as { unknown?: unknown }).unknown === true) {
    return { kind: 'unknown_dish' };
  }
  const parsed = ModelOutputSchema.safeParse(raw);
  if (!parsed.success) return { kind: 'failed' };

  const allowed = new Set(catalogueNames);
  // The same ingredient listed twice (oil for the tarka, oil for the gravy) is one row.
  const grams = new Map<string, number>();
  for (const item of parsed.data.ingredients) {
    if (!allowed.has(item.name)) continue;
    grams.set(item.name, (grams.get(item.name) ?? 0) + item.grams);
  }
  const ingredients = [...grams].map(([name, g]) => ({ name, grams: Math.round(g) }));
  const total = ingredients.reduce((sum, i) => sum + i.grams, 0);
  if (ingredients.length === 0 || total > MAX_SERVING_GRAMS) return { kind: 'failed' };

  const response = DishBreakdownResponseSchema.safeParse({
    success: true,
    dishName: parsed.data.dishName,
    servingDescription: parsed.data.servingDescription,
    ingredients,
    usedWebSearch,
  });
  return response.success ? { kind: 'ok', response: response.data } : { kind: 'failed' };
}

async function askModel(
  request: DishBreakdownRequest,
  apiKey: string,
  withWebSearch: boolean,
  fetchImpl: typeof fetch
): Promise<unknown> {
  const res = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELS.GROQ.DISH_RESEARCH,
      messages: [
        { role: 'system', content: systemPrompt(request.region, request.catalogueNames) },
        { role: 'user', content: request.dishName },
      ],
      temperature: 0.2,
      reasoning_effort: 'low',
      include_reasoning: false,
      max_completion_tokens: 1200,
      ...(withWebSearch ? { tools: [{ type: 'browser_search' }] } : {}),
    }),
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Groq returned HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Groq sent no message content');
  return extractJsonObject(content);
}

/**
 * Breaks an unknown dish into catalogue ingredients. Tries with a live web
 * search first; if that call fails (the tool can be unavailable on some plans),
 * asks again from the model's own knowledge before giving up.
 */
export async function breakDownDish(
  request: DishBreakdownRequest,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<BreakdownOutcome> {
  for (const withWebSearch of [true, false]) {
    try {
      const raw = await askModel(request, apiKey, withWebSearch, fetchImpl);
      const outcome = toResponse(raw, request.catalogueNames, withWebSearch);
      if (outcome.kind !== 'failed') return outcome;
    } catch (err) {
      console.warn(
        `[dish-breakdown] ${withWebSearch ? 'web search' : 'plain'} attempt failed: ${(err as Error)?.message ?? err}`
      );
    }
  }
  return { kind: 'failed' };
}
