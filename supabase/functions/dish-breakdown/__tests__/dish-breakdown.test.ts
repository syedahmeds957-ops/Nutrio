import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleDishBreakdownRequest } from '../index.js';
import { breakDownDish, extractJsonObject, toResponse } from '../breakdown.js';
import { DishBreakdownResponseSchema } from '../schema.js';

const CATALOGUE = [
  'Grilled Chicken Breast (Skinless)',
  'Cooking Oil (Any Plain Oil)',
  'Onion (Raw)',
  'Tomato (Raw)',
  'Malai / Fresh Cream',
];

/** A token whose payload says `role`; the gateway has already checked the signature. */
const tokenFor = (role: string) =>
  `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`;

const post = (body: unknown, role = 'authenticated') =>
  handleDishBreakdownRequest(
    new Request('http://localhost/dish-breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFor(role)}` },
      body: JSON.stringify(body),
    })
  );

/** A fetch that answers like Groq's chat endpoint, one queued reply per call. */
const groqReplying = (...replies: (string | number)[]) => {
  const queue = [...replies];
  return vi.fn(async () => {
    const next = queue.shift();
    if (typeof next === 'number') return new Response('error', { status: next });
    return new Response(JSON.stringify({ choices: [{ message: { content: next } }] }), { status: 200 });
  }) as unknown as typeof fetch;
};

const MALAI_HANDI = JSON.stringify({
  dishName: 'Chicken Malai Handi',
  servingDescription: '1 bowl (about 300 g)',
  ingredients: [
    { name: 'Grilled Chicken Breast (Skinless)', grams: 150 },
    { name: 'Malai / Fresh Cream', grams: 40 },
    { name: 'Cooking Oil (Any Plain Oil)', grams: 10 },
    { name: 'Onion (Raw)', grams: 50 },
    { name: 'Tomato (Raw)', grams: 30 },
  ],
});

const request = { dishName: 'chicken malai handi', region: 'PK' as const, catalogueNames: CATALOGUE };

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

describe('dish-breakdown: validating the model answer', () => {
  it('returns names and grams only, never nutrition numbers', () => {
    const outcome = toResponse(
      { ...JSON.parse(MALAI_HANDI), calories: 520, protein: 40 },
      CATALOGUE,
      true
    );
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;
    expect(DishBreakdownResponseSchema.safeParse(outcome.response).success).toBe(true);
    expect(JSON.stringify(outcome.response)).not.toMatch(/kcal|calorie|protein|carb/i);
  });

  it('drops an ingredient the catalogue does not hold instead of guessing', () => {
    const outcome = toResponse(
      {
        dishName: 'Malai Handi',
        ingredients: [
          { name: 'Onion (Raw)', grams: 50 },
          { name: 'Chicken Thigh Raw', grams: 150 },
        ],
      },
      CATALOGUE,
      false
    );
    expect(outcome.kind === 'ok' && outcome.response.ingredients).toEqual([
      { name: 'Onion (Raw)', grams: 50 },
    ]);
  });

  it('merges an ingredient listed twice', () => {
    const outcome = toResponse(
      {
        dishName: 'Karahi',
        ingredients: [
          { name: 'Cooking Oil (Any Plain Oil)', grams: 5 },
          { name: 'Cooking Oil (Any Plain Oil)', grams: 7 },
        ],
      },
      CATALOGUE,
      false
    );
    expect(outcome.kind === 'ok' && outcome.response.ingredients).toEqual([
      { name: 'Cooking Oil (Any Plain Oil)', grams: 12 },
    ]);
  });

  it('rejects a serving that weighs more than a person eats', () => {
    const outcome = toResponse(
      {
        dishName: 'Biryani pot',
        ingredients: [
          { name: 'Onion (Raw)', grams: 900 },
          { name: 'Tomato (Raw)', grams: 900 },
        ],
      },
      CATALOGUE,
      false
    );
    expect(outcome.kind).toBe('failed');
  });

  it('passes on a dish the model does not recognise', () => {
    expect(toResponse({ unknown: true }, CATALOGUE, true).kind).toBe('unknown_dish');
  });

  it('reads JSON wrapped in a code fence or a sentence', () => {
    expect(extractJsonObject('Here you go:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(extractJsonObject('no json here')).toBeUndefined();
  });
});

describe('dish-breakdown: calling the model', () => {
  it('uses web search on the first attempt', async () => {
    const fetchImpl = groqReplying(MALAI_HANDI);
    const outcome = await breakDownDish(request, 'key', fetchImpl);
    expect(outcome.kind === 'ok' && outcome.response.usedWebSearch).toBe(true);
    const body = JSON.parse((fetchImpl as any).mock.calls[0][1].body);
    expect(body.tools).toEqual([{ type: 'browser_search' }]);
  });

  it('asks again without web search when the search call fails', async () => {
    const fetchImpl = groqReplying(400, MALAI_HANDI);
    const outcome = await breakDownDish(request, 'key', fetchImpl);
    expect(outcome.kind === 'ok' && outcome.response.usedWebSearch).toBe(false);
    const body = JSON.parse((fetchImpl as any).mock.calls[1][1].body);
    expect(body.tools).toBeUndefined();
  });

  it('gives up when both attempts fail', async () => {
    const outcome = await breakDownDish(request, 'key', groqReplying(500, 'not json'));
    expect(outcome.kind).toBe('failed');
  });
});
