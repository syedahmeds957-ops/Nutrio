import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleDishBreakdownRequest } from '../index.js';
import { breakDownDish, extractJsonObject, resolveExternal, splitIngredients } from '../breakdown.js';
import { per100gFrom } from '../usda.js';
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

/** USDA's real top two hits for "coconut milk canned": the first is the wrong food. */
const USDA_COCONUT = {
  foods: [
    {
      fdcId: 170171,
      dataType: 'SR Legacy',
      description: 'Nuts, coconut cream, canned, sweetened',
      foodNutrients: [
        { nutrientId: 1008, value: 357 },
        { nutrientId: 1003, value: 1.17 },
        { nutrientId: 1004, value: 16.3 },
        { nutrientId: 1005, value: 53.2 },
      ],
    },
    {
      fdcId: 170173,
      dataType: 'SR Legacy',
      description: 'Nuts, coconut milk, canned (liquid expressed from grated meat and water)',
      foodNutrients: [
        { nutrientId: 1008, value: 197 },
        { nutrientId: 1003, value: 2.02 },
        { nutrientId: 1004, value: 21.3 },
        { nutrientId: 1005, value: 2.81 },
        { nutrientId: 1258, value: 18.9 },
      ],
    },
  ],
};

/**
 * A fetch that answers Groq and USDA by URL: Groq replies are queued in order
 * (a number is an HTTP error status), USDA answers with `usda`.
 */
const fakeNetwork = (groqReplies: (string | number)[], usda: unknown = USDA_COCONUT) => {
  const queue = [...groqReplies];
  return vi.fn(async (url: string) => {
    if (String(url).includes('api.nal.usda.gov')) {
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
const keys = { groq: 'groq-key', usda: 'usda-key' };

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

  it('marks everything not counted without a USDA key, rather than guessing', async () => {
    const fetchImpl = fakeNetwork([]);
    const { notCounted } = await resolveExternal('x', [{ name: 'khoya', grams: 30 }], { groq: 'k' }, fetchImpl);
    expect(notCounted).toEqual([{ name: 'khoya', grams: 30 }]);
    expect(fetchImpl).not.toHaveBeenCalled();
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
