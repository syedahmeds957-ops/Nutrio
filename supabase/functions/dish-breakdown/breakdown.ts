import { z } from 'zod';
import { MODELS } from '../_shared/models.js';
import {
  DishBreakdownRequest,
  DishBreakdownResponse,
  DishBreakdownResponseSchema,
  DishIngredient,
  MAX_INGREDIENT_GRAMS,
  MAX_INGREDIENTS,
  MAX_SERVING_GRAMS,
  MAX_USDA_LOOKUPS,
  UsdaIngredient,
} from './schema.js';
import { searchUsda, UsdaCandidate } from './usda.js';

/** Searching the web is slow; past this the user is better told to try again. */
export const MODEL_TIMEOUT_MS = 25_000;
const PICK_TIMEOUT_MS = 8000;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const systemPrompt = (region: DishBreakdownRequest['region'], catalogueNames: string[]) => `You are a dietitian's recipe assistant for a ${
  region === 'SA' ? 'Saudi' : 'Pakistani'
} food-logging app. The user names a dish that is not in the app's food list. Work out what the dish is and how ONE typical serving is made, then list that serving's ingredients.

Rules:
1. NEVER output calories, macros or any nutrition number. Only ingredient names and grams.
2. When an ingredient is on the CATALOGUE below, copy its name EXACTLY (e.g. cooking oil -> "Cooking Oil (Any Plain Oil)"; chicken in a curry -> the plainest chicken entry).
3. When it is not on the CATALOGUE, give a short generic English name as a nutrition database would list it, with its state: "coconut milk, canned", "chickpea flour", "wheat flour, whole-grain", "lamb, raw". Never a brand.
4. Grams are the edible weight in one serving, including the oil or ghee the dish is cooked in.
5. Leave out spices, salt, garlic, ginger, herbs and anything under 5 g.
6. At most ${MAX_INGREDIENTS} ingredients. One serving should weigh 100 to ${MAX_SERVING_GRAMS} g in total.
7. If you do not recognise the dish even after searching, return {"unknown": true}.

Answer with ONLY this JSON, no other text:
{"dishName": string, "servingDescription": string, "ingredients": [{"name": string, "grams": number}]}

CATALOGUE:
${catalogueNames.join('\n')}`;

const PICK_PROMPT = `For each ingredient of a dish, choose the USDA FoodData Central record that is the SAME food in the same state as used in the dish (raw vs cooked, sweetened vs unsweetened, whole vs skimmed). If no candidate is the same food, choose null. Never choose a merely similar food.

Answer with ONLY JSON: {"choices": [{"index": number, "fdcId": number | null}]}`;

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

const PickOutputSchema = z.object({
  choices: z.array(
    z.object({
      index: z.coerce.number().int().min(0),
      fdcId: z.coerce.number().int().positive().nullable(),
    })
  ),
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

export interface SplitDish {
  dishName: string;
  servingDescription: string;
  /** Named from the app's catalogue. */
  catalogue: DishIngredient[];
  /** Everything else, to be valued from USDA or reported as not counted. */
  external: DishIngredient[];
}

export type SplitOutcome =
  | { kind: 'ok'; dish: SplitDish }
  | { kind: 'unknown_dish' }
  | { kind: 'failed' };

/** Same-named rows (oil for the tarka, oil for the gravy) become one. */
function mergeByName(items: DishIngredient[]): DishIngredient[] {
  const grams = new Map<string, { name: string; grams: number }>();
  for (const item of items) {
    const key = item.name.toLowerCase();
    const existing = grams.get(key);
    grams.set(key, { name: existing?.name ?? item.name, grams: (existing?.grams ?? 0) + item.grams });
  }
  return [...grams.values()].map((i) => ({ name: i.name, grams: Math.round(i.grams) }));
}

/** Validates the model's breakdown and splits it into catalogue and other ingredients. */
export function splitIngredients(raw: unknown, catalogueNames: string[]): SplitOutcome {
  if (raw && typeof raw === 'object' && (raw as { unknown?: unknown }).unknown === true) {
    return { kind: 'unknown_dish' };
  }
  const parsed = ModelOutputSchema.safeParse(raw);
  if (!parsed.success) return { kind: 'failed' };

  const ingredients = mergeByName(parsed.data.ingredients);
  const total = ingredients.reduce((sum, i) => sum + i.grams, 0);
  if (total > MAX_SERVING_GRAMS) return { kind: 'failed' };

  const allowed = new Set(catalogueNames);
  return {
    kind: 'ok',
    dish: {
      dishName: parsed.data.dishName,
      servingDescription: parsed.data.servingDescription,
      catalogue: ingredients.filter((i) => allowed.has(i.name)),
      external: ingredients.filter((i) => !allowed.has(i.name)),
    },
  };
}

async function chat(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  fetchImpl: typeof fetch
): Promise<string> {
  const res = await fetchImpl(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Groq returned HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Groq sent no message content');
  return content;
}

/**
 * Picks, per ingredient, which USDA record is the same food. The model only
 * chooses among records the server fetched; an id it was not offered is
 * ignored, so a number can never come from anywhere but USDA.
 */
export async function pickUsdaRecords(
  dishName: string,
  items: { ingredient: DishIngredient; candidates: UsdaCandidate[] }[],
  groqKey: string,
  fetchImpl: typeof fetch
): Promise<Map<number, UsdaCandidate>> {
  const picked = new Map<number, UsdaCandidate>();
  if (items.length === 0) return picked;

  const listing = items
    .map(
      ({ ingredient, candidates }, index) =>
        `Ingredient ${index}: "${ingredient.name}"\n` +
        candidates.map((c) => `  - fdcId ${c.fdcId}: ${c.description}`).join('\n')
    )
    .join('\n\n');

  const content = await chat(
    groqKey,
    {
      model: MODELS.GROQ.TEXT_FAST,
      messages: [
        { role: 'system', content: PICK_PROMPT },
        { role: 'user', content: `Dish: ${dishName}\n\n${listing}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_completion_tokens: 400,
    },
    PICK_TIMEOUT_MS,
    fetchImpl
  );

  const parsed = PickOutputSchema.safeParse(extractJsonObject(content));
  if (!parsed.success) return picked;
  for (const { index, fdcId } of parsed.data.choices) {
    const offered = items[index]?.candidates.find((c) => c.fdcId === fdcId);
    if (offered) picked.set(index, offered);
  }
  return picked;
}

export interface BreakdownKeys {
  groq: string;
  /** A data.gov key for FoodData Central; without one nothing is looked up. */
  usda?: string;
}

/**
 * Values the ingredients the catalogue lacks from USDA FoodData Central. Any
 * ingredient without a confirmed USDA match is returned as not counted; it is
 * never valued by guessing the top search hit.
 */
export async function resolveExternal(
  dishName: string,
  external: DishIngredient[],
  keys: BreakdownKeys,
  fetchImpl: typeof fetch
): Promise<{ usdaIngredients: UsdaIngredient[]; notCounted: DishIngredient[] }> {
  if (external.length === 0) return { usdaIngredients: [], notCounted: [] };
  if (!keys.usda) return { usdaIngredients: [], notCounted: external };

  const toLookUp = external.slice(0, MAX_USDA_LOOKUPS);
  const notCounted = external.slice(MAX_USDA_LOOKUPS);

  const searched = await Promise.all(
    toLookUp.map(async (ingredient) => ({
      ingredient,
      candidates: await searchUsda(ingredient.name, keys.usda as string, fetchImpl).catch((err) => {
        console.warn(`[dish-breakdown] USDA search failed for "${ingredient.name}": ${err?.message ?? err}`);
        return [] as UsdaCandidate[];
      }),
    }))
  );

  const withCandidates = searched.filter((s) => s.candidates.length > 0);
  const picked = await pickUsdaRecords(dishName, withCandidates, keys.groq, fetchImpl).catch((err) => {
    console.warn(`[dish-breakdown] USDA record choice failed: ${err?.message ?? err}`);
    return new Map<number, UsdaCandidate>();
  });

  const usdaIngredients: UsdaIngredient[] = [];
  withCandidates.forEach(({ ingredient }, index) => {
    const record = picked.get(index);
    if (record) {
      usdaIngredients.push({
        name: ingredient.name,
        grams: ingredient.grams,
        fdcId: record.fdcId,
        description: record.description,
        per100g: record.per100g,
      });
    } else {
      notCounted.push(ingredient);
    }
  });
  for (const { ingredient, candidates } of searched) {
    if (candidates.length === 0) notCounted.push(ingredient);
  }
  return { usdaIngredients, notCounted };
}

async function askForBreakdown(
  request: DishBreakdownRequest,
  groqKey: string,
  withWebSearch: boolean,
  fetchImpl: typeof fetch
): Promise<unknown> {
  const content = await chat(
    groqKey,
    {
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
    },
    MODEL_TIMEOUT_MS,
    fetchImpl
  );
  return extractJsonObject(content);
}

export type BreakdownOutcome =
  | { kind: 'ok'; response: DishBreakdownResponse }
  | { kind: 'unknown_dish' }
  | { kind: 'failed' };

/**
 * Breaks an unknown dish into ingredients and values the ones the catalogue
 * lacks from USDA. Tries the breakdown with a live web search first; if that
 * call fails (the tool can be unavailable on some plans), asks again from the
 * model's own knowledge before giving up.
 */
export async function breakDownDish(
  request: DishBreakdownRequest,
  keys: BreakdownKeys,
  fetchImpl: typeof fetch = fetch
): Promise<BreakdownOutcome> {
  for (const withWebSearch of [true, false]) {
    let split: SplitOutcome;
    try {
      split = splitIngredients(
        await askForBreakdown(request, keys.groq, withWebSearch, fetchImpl),
        request.catalogueNames
      );
    } catch (err) {
      console.warn(
        `[dish-breakdown] ${withWebSearch ? 'web search' : 'plain'} attempt failed: ${(err as Error)?.message ?? err}`
      );
      continue;
    }
    if (split.kind === 'unknown_dish') return split;
    if (split.kind === 'failed') continue;

    const { dish } = split;
    const { usdaIngredients, notCounted } = await resolveExternal(
      dish.dishName,
      dish.external,
      keys,
      fetchImpl
    );
    if (dish.catalogue.length === 0 && usdaIngredients.length === 0) return { kind: 'failed' };

    const response = DishBreakdownResponseSchema.safeParse({
      success: true,
      dishName: dish.dishName,
      servingDescription: dish.servingDescription,
      ingredients: dish.catalogue,
      usdaIngredients,
      notCounted,
      usedWebSearch: withWebSearch,
    });
    return response.success ? { kind: 'ok', response: response.data } : { kind: 'failed' };
  }
  return { kind: 'failed' };
}
