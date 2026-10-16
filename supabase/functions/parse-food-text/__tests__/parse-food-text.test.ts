import { describe, expect, it, vi } from 'vitest';
import { analyzeMealItems } from '@nutrio/food-db';
import type { MealUnit } from '@nutrio/food-db';
import { handleParseFoodTextRequest } from '../index.js';
import { parseFoodTextService } from '../parser.js';
import { MEAL_UNITS, ParseFoodTextResponseSchema } from '../schema.js';

const post = (body: unknown) =>
  handleParseFoodTextRequest(
    new Request('http://localhost/parse-food-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );

/** A fetch that answers like Groq's chat endpoint with `content` as the message. */
const modelReturning = (content: string) =>
  vi.fn(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })
  ) as unknown as typeof fetch;

describe('parse-food-text: HTTP handling', () => {
  it('answers CORS preflight', async () => {
    const res = await handleParseFoodTextRequest(new Request('http://localhost/x', { method: 'OPTIONS' }));
    expect(res.status).toBe(200);
  });

  it('rejects GET', async () => {
    const res = await handleParseFoodTextRequest(new Request('http://localhost/x', { method: 'GET' }));
    expect(res.status).toBe(405);
  });

  it('rejects empty text', async () => {
    expect((await post({ text: '' })).status).toBe(400);
  });

  it('returns items and no nutrition numbers', async () => {
    const res = await post({ text: 'do roti aur ek katori daal chana' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(ParseFoodTextResponseSchema.safeParse(json).success).toBe(true);
    expect(JSON.stringify(json)).not.toMatch(/kcal|calorie|protein/i);
  });
});

describe('parse-food-text: deterministic fallback (no API key)', () => {
  it('splits the sentence that used to log White Shadi Korma', async () => {
    const result = await parseFoodTextService({
      text: 'in breakfast i had 4 egg white and 2 whole egg and greek yogurt',
    });
    expect(result.provider).toBe('deterministic');
    expect(result.slot).toBe('breakfast');
    expect(result.items.map((i) => [i.name, i.quantity])).toEqual([
      ['egg white', 4],
      ['whole egg', 2],
      ['greek yogurt', 1],
    ]);

    const meal = analyzeMealItems(result.items);
    expect(meal.items[0].match.food?.name).toBe('Egg White (Boiled)');
    expect(meal.totals.kcal).toBeLessThan(400);
  });

  it('grounds Roman Urdu items in the catalogue', async () => {
    const result = await parseFoodTextService({ text: 'do roti aur ek katori daal chana' });
    const meal = analyzeMealItems(result.items);
    expect(meal.items[0].portion?.grams).toBe(90); // 2 × 45g roti
    expect(meal.items[1].parsed.unit).toBe('katori');
  });

  it.each(['100 roti', '0 roti', 'coffee with 0 sugar', '10 kg rice', `${'very long description '.repeat(10)}roti`])(
    'answers "%s" instead of failing — amounts are flagged on the client',
    async (text) => {
      const res = await post({ text });
      expect(res.status).toBe(200);
    }
  );

  it('lets the request override the detected slot', async () => {
    const result = await parseFoodTextService({ text: 'breakfast 2 roti', mealSlot: 'lunch' });
    expect(result.slot).toBe('lunch');
  });
});

describe('parse-food-text: with the model', () => {
  it('uses the model split when it is valid', async () => {
    const fetchImpl = modelReturning(
      JSON.stringify({ slot: 'dinner', items: [{ name: 'Chicken Karahi', quantity: 1, unit: 'katori' }] })
    );
    const result = await parseFoodTextService({ text: 'raat ko ek katori karahi' }, 'key', fetchImpl);
    expect(result.provider).toBe('groq_nlp_parser');
    expect(result.slot).toBe('dinner');
    expect(result.items).toEqual([
      { text: 'Chicken Karahi', name: 'chicken karahi', quantity: 1, quantityGiven: true, unit: 'katori' },
    ]);
  });

  it('drops any nutrition numbers the model adds', async () => {
    const fetchImpl = modelReturning(
      JSON.stringify({ items: [{ name: 'roti', quantity: 2, calories: 900, protein: 40 }] })
    );
    const result = await parseFoodTextService({ text: '2 roti' }, 'key', fetchImpl);
    expect(JSON.stringify(result)).not.toMatch(/calories|protein|900/);
  });

  it('maps unit words to known units and ignores unknown ones', async () => {
    const fetchImpl = modelReturning(
      JSON.stringify({ items: [{ name: 'daal', unit: 'Chamach' }, { name: 'rice', unit: 'bucket' }] })
    );
    const result = await parseFoodTextService({ text: 'daal and rice' }, 'key', fetchImpl);
    expect(result.items[0].unit).toBe('tbsp');
    expect(result.items[1].unit).toBeUndefined();
  });

  it('reads numbers sent as strings', async () => {
    const fetchImpl = modelReturning(JSON.stringify({ items: [{ name: 'roti', quantity: '2' }] }));
    const result = await parseFoodTextService({ text: 'do roti' }, 'key', fetchImpl);
    expect(result.items[0]).toMatchObject({ name: 'roti', quantity: 2, quantityGiven: true });
  });

  it('turns a weight given as the unit into grams', async () => {
    const fetchImpl = modelReturning(JSON.stringify({ items: [{ name: 'chicken', quantity: 200, unit: 'g' }] }));
    const result = await parseFoodTextService({ text: '200g chicken' }, 'key', fetchImpl);
    expect(result.items[0]).toMatchObject({ name: 'chicken', grams: 200, quantityGiven: false });
  });

  it('keeps an amount the model left inside the name', async () => {
    const fetchImpl = modelReturning(JSON.stringify({ items: [{ name: '2 roti' }] }));
    const result = await parseFoodTextService({ text: '2 roti' }, 'key', fetchImpl);
    expect(result.items[0]).toMatchObject({ name: 'roti', quantity: 2, quantityGiven: true });
  });

  it.each([
    ['a zero quantity', modelReturning(JSON.stringify({ items: [{ name: 'roti', quantity: 0 }] }))],
    ['a negative quantity', modelReturning(JSON.stringify({ items: [{ name: 'roti', quantity: -2 }] }))],
    ['a non-numeric quantity', modelReturning(JSON.stringify({ items: [{ name: 'roti', quantity: 'two' }] }))],
    ['an oversized weight', modelReturning(JSON.stringify({ items: [{ name: 'roti', grams: 6000 }] }))],
    ['malformed JSON', modelReturning('not json')],
    ['an empty item list', modelReturning(JSON.stringify({ items: [] }))],
    ['an HTTP error', vi.fn(async () => new Response('busy', { status: 503 })) as unknown as typeof fetch],
    ['a network failure or timeout', vi.fn(async () => { throw new Error('timeout'); }) as unknown as typeof fetch],
  ])('falls back to the deterministic parser on %s', async (_label, fetchImpl) => {
    const result = await parseFoodTextService({ text: '2 roti aur daal' }, 'key', fetchImpl);
    expect(result.provider).toBe('deterministic');
    expect(result.items.map((i) => i.name)).toEqual(['roti', 'daal']);
  });
});

describe('parse-food-text: unit list', () => {
  it('matches the units food-db understands', () => {
    // A compile-time check that every MealUnit is listed, and nothing else.
    const listed: readonly MealUnit[] = MEAL_UNITS;
    const all: Record<MealUnit, true> = {
      piece: true, katori: true, bowl: true, plate: true, cup: true, glass: true,
      tbsp: true, tsp: true, slice: true, pao: true, handful: true, serving: true,
    };
    expect([...listed].sort()).toEqual(Object.keys(all).sort());
  });
});
