import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleDishBreakdownRequest, usdaDatabaseFromEnv } from '../index.js';
import { breakDownDish, extractJsonObject, resolveExternal, splitIngredients } from '../breakdown.js';
import { per100gFrom, searchUsda } from '../usda.js';
import { DishBreakdownResponseSchema } from '../schema.js';

const CATALOGUE = [
  'Grilled Chicken Breast (Skinless)',
  'Cooking Oil (Any Plain Oil)',
  'Onion (Raw)',
  'Tomato (Raw)',
  'Malai / Fresh Cream',
];

/** A token whose payload says `role`; the gateway has already checked the signature. */
const tokenFor = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`;

const post = (body: unknown, role = 'authenticated') =>
  handleDishBreakdownRequest(
    new Request('http://localhost/dish-breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFor(role)}` },
      body: JSON.stringify(body),
    })
  );

const groqMessage = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

/**
 * search_usda_foods rows for "coconut milk canned": the first is the wrong
 * food, as it was in USDA's own API search.
 */
const USDA_COCONUT = [
  {
    fdc_id: 170171,
    data_type: 'SR Legacy',
    description: 'Nuts, coconut cream, canned, sweetened',
    kcal: 357,
    protein: 1.2,
    carbs: 53.2,
    fat: 16.3,
    fibre: 0,
    sugar: 0,
    sodium_mg: 0,
    sat_fat: 0,
  },
  {
    fdc_id: 170173,
    data_type: 'SR Legacy',
    description: 'Nuts, coconut milk, canned (liquid expressed from grated meat and water)',
    kcal: 197,
    protein: 2.0,
    carbs: 2.8,
    fat: 21.3,
    fibre: 0,
    sugar: 0,
    sodium_mg: 0,
    sat_fat: 18.9,
  },
];

const USDA_DB = { url: 'https://project.supabase.co', key: 'sb_secret_test' };

/**
 * A fetch that answers Groq and the USDA search by URL: Groq replies are
 * queued in order (a number is an HTTP error status), the search answers with
 * `usda`.
 */
const fakeNetwork = (groqReplies: (string | number)[], usda: unknown = USDA_COCONUT) => {
  const queue = [...groqReplies];
  return vi.fn(async (url: string) => {
    if (String(url).endsWith('/rest/v1/rpc/search_usda_foods')) {
      return new Response(JSON.stringify(usda), { status: 200 });
    }
    const next = queue.shift();
    if (typeof next === 'number') return new Response('error', { status: next });
    return groqMessage(next ?? 'no reply queued');
  }) as unknown as typeof fetch;
};

const COCONUT_CURRY = JSON.stringify({
  dishName: 'Coconut Chicken Curry',
  servingDescription: '1 bowl (about 300 g)',
  ingredients: [
    { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
    { name: 'coconut milk, canned', grams: 100 },
    { name: 'Cooking Oil (Any Plain Oil)', grams: 10 },
    { name: 'Onion (Raw)', grams: 40 },
  ],
});

const PICK_COCONUT_MILK = JSON.stringify({ choices: [{ index: 0, fdcId: 170173 }] });

const request = { dishName: 'coconut chicken curry', region: 'PK' as const, catalogueNames: CATALOGUE };
const keys = { groq: 'groq-key', usda: USDA_DB };

describe('dish-breakdown: HTTP handling', () => {
  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  it('answers CORS preflight', async () => {
    const res = await handleDishBreakdownRequest(new Request('http://localhost/x', { method: 'OPTIONS' }));
    expect(res.status).toBe(200);
  });

  it('rejects GET', async () => {
    const res = await handleDishBreakdownRequest(new Request('http://localhost/x', { method: 'GET' }));
    expect(res.status).toBe(405);
  });

  it('refuses the anon key: each call spends the shared Groq quota', async () => {
    expect((await post(request, 'anon')).status).toBe(401);
  });

  it('rejects a request without a catalogue', async () => {
    expect((await post({ dishName: 'karahi', catalogueNames: [] })).status).toBe(400);
  });

  it('says it is not configured when there is no Groq key', async () => {
    expect((await post(request)).status).toBe(503);
  });
});

describe('dish-breakdown: splitting the model answer', () => {
  it('separates catalogue names from ingredients the catalogue lacks', () => {
    const outcome = splitIngredients(JSON.parse(COCONUT_CURRY), CATALOGUE);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;
    expect(outcome.dish.catalogue.map((i) => i.name)).toEqual([
      'Grilled Chicken Breast (Skinless)',
      'Cooking Oil (Any Plain Oil)',
      'Onion (Raw)',
    ]);
    expect(outcome.dish.external).toEqual([{ name: 'coconut milk, canned', grams: 100 }]);
  });

  it('merges an ingredient listed twice', () => {
    const outcome = splitIngredients(
      {
        dishName: 'Karahi',
        ingredients: [
          { name: 'Cooking Oil (Any Plain Oil)', grams: 5 },
          { name: 'Cooking Oil (Any Plain Oil)', grams: 7 },
        ],
      },
      CATALOGUE
    );
    expect(outcome.kind === 'ok' && outcome.dish.catalogue).toEqual([
      { name: 'Cooking Oil (Any Plain Oil)', grams: 12 },
    ]);
  });

  it('rejects a serving that weighs more than a person eats', () => {
    const outcome = splitIngredients(
      { dishName: 'Biryani pot', ingredients: [{ name: 'Onion (Raw)', grams: 900 }, { name: 'rice', grams: 900 }] },
      CATALOGUE
    );
    expect(outcome.kind).toBe('failed');
  });

  it('passes on a dish the model does not recognise', () => {
    expect(splitIngredients({ unknown: true }, CATALOGUE).kind).toBe('unknown_dish');
  });

  it('reads JSON wrapped in a code fence or a sentence', () => {
    expect(extractJsonObject('Here you go:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(extractJsonObject('no json here')).toBeUndefined();
  });
});

describe('dish-breakdown: valuing what the catalogue lacks from USDA', () => {
  it('reads per-100 g values, including Atwater energy on Foundation foods', () => {
    expect(
      per100gFrom({
        foodNutrients: [
          { nutrientId: 2047, value: 357 },
          { nutrientId: 1003, value: 11.4 },
          { nutrientId: 1004, value: 1.52 },
          { nutrientId: 1005, value: 74.4 },
        ],
      })
    ).toMatchObject({ kcal: 357, protein: 11.4, fat: 1.5, carbs: 74.4 });
  });

  it('drops a record with impossible values', () => {
    expect(
      per100gFrom({
        foodNutrients: [
          { nutrientId: 1008, value: 300 },
          { nutrientId: 1003, value: 80 },
          { nutrientId: 1004, value: 30 },
          { nutrientId: 1005, value: 20 },
        ],
      })
    ).toBeUndefined();
  });

  it('uses the record the model confirmed, not USDA top search hit', async () => {
    const { usdaIngredients, notCounted } = await resolveExternal(
      'Coconut Chicken Curry',
      [{ name: 'coconut milk, canned', grams: 100 }],
      keys,
      fakeNetwork([PICK_COCONUT_MILK])
    );
    expect(notCounted).toEqual([]);
    expect(usdaIngredients).toEqual([
      expect.objectContaining({ fdcId: 170173, grams: 100, per100g: expect.objectContaining({ kcal: 197 }) }),
    ]);
  });

  it('ignores a record id USDA never offered', async () => {
    const { usdaIngredients, notCounted } = await resolveExternal(
      'x',
      [{ name: 'coconut milk, canned', grams: 100 }],
      keys,
      fakeNetwork([JSON.stringify({ choices: [{ index: 0, fdcId: 999999 }] })])
    );
    expect(usdaIngredients).toEqual([]);
    expect(notCounted).toEqual([{ name: 'coconut milk, canned', grams: 100 }]);
  });

  it('marks an ingredient not counted when no record is the same food', async () => {
    const { notCounted } = await resolveExternal(
      'x',
      [{ name: 'khoya', grams: 30 }],
      keys,
      fakeNetwork([JSON.stringify({ choices: [{ index: 0, fdcId: null }] })])
    );
    expect(notCounted).toEqual([{ name: 'khoya', grams: 30 }]);
  });

  it('marks everything not counted without database access, rather than guessing', async () => {
    const fetchImpl = fakeNetwork([]);
    const { notCounted } = await resolveExternal('x', [{ name: 'khoya', grams: 30 }], { groq: 'k' }, fetchImpl);
    expect(notCounted).toEqual([{ name: 'khoya', grams: 30 }]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('dish-breakdown: searching the imported USDA foods', () => {
  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEYS;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('calls the search RPC with the key on apikey only, never as a Bearer token', async () => {
    const fetchImpl = fakeNetwork([]);
    const candidates = await searchUsda('coconut milk, canned', USDA_DB, fetchImpl);

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://project.supabase.co/rest/v1/rpc/search_usda_foods');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', apikey: 'sb_secret_test' });
    expect(JSON.parse(init.body)).toEqual({ query: 'coconut milk, canned', max_results: 5 });
    expect(candidates[1]).toEqual({
      fdcId: 170173,
      dataType: 'SR Legacy',
      description: 'Nuts, coconut milk, canned (liquid expressed from grated meat and water)',
      per100g: { kcal: 197, protein: 2, carbs: 2.8, fat: 21.3, fibre: 0, sugar: 0, sodiumMg: 0, satFat: 18.9 },
    });
  });

  it('throws on an HTTP error so the ingredient is not counted', async () => {
    const fetchImpl = vi.fn(async () => new Response('denied', { status: 401 })) as unknown as typeof fetch;
    await expect(searchUsda('ghee', USDA_DB, fetchImpl)).rejects.toThrow('HTTP 401');
  });

  it('prefers the secret key over the legacy service-role key', () => {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy-jwt';
    expect(usdaDatabaseFromEnv()?.key).toBe('legacy-jwt');

    process.env.SUPABASE_SECRET_KEYS = JSON.stringify({ default: 'sb_secret_abc' });
    expect(usdaDatabaseFromEnv()).toEqual({ url: 'https://project.supabase.co', key: 'sb_secret_abc' });
  });

  it('has no database without the project URL', () => {
    process.env.SUPABASE_SECRET_KEYS = JSON.stringify({ default: 'sb_secret_abc' });
    expect(usdaDatabaseFromEnv()).toBeUndefined();
  });
});

describe('dish-breakdown: end to end with mocked services', () => {
  it('returns catalogue names, USDA values and nothing from the model', async () => {
    const outcome = await breakDownDish(request, keys, fakeNetwork([COCONUT_CURRY, PICK_COCONUT_MILK]));
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;
    expect(DishBreakdownResponseSchema.safeParse(outcome.response).success).toBe(true);
    expect(outcome.response.ingredients).toHaveLength(3);
    expect(outcome.response.usdaIngredients[0].fdcId).toBe(170173);
    expect(outcome.response.usedWebSearch).toBe(true);
  });

  it('drops any calorie field the model adds', async () => {
    const withCalories = JSON.stringify({ ...JSON.parse(COCONUT_CURRY), calories: 640, kcal: 640 });
    const outcome = await breakDownDish(request, keys, fakeNetwork([withCalories, PICK_COCONUT_MILK]));
    expect(outcome.kind === 'ok' && JSON.stringify(outcome.response)).not.toMatch(/640/);
  });

  it('asks again without web search when the search call fails', async () => {
    const fetchImpl = fakeNetwork([400, COCONUT_CURRY, PICK_COCONUT_MILK]);
    const outcome = await breakDownDish(request, keys, fetchImpl);
    expect(outcome.kind === 'ok' && outcome.response.usedWebSearch).toBe(false);
    const secondBody = JSON.parse((fetchImpl as any).mock.calls[1][1].body);
    expect(secondBody.tools).toBeUndefined();
  });

  it('gives up when both attempts fail', async () => {
    const outcome = await breakDownDish(request, keys, fakeNetwork([500, 'not json']));
    expect(outcome.kind).toBe('failed');
  });
});
