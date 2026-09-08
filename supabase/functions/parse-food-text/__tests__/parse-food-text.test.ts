import { describe, expect, it } from 'vitest';
import { handleParseFoodTextRequest } from '../index.js';
import { ParseFoodTextResponseSchema } from '../schema.js';

describe('Desi Voice & Natural Language Food Parser (Task 3.2)', () => {
  it('handles CORS preflight OPTIONS request with 200 OK', async () => {
    const req = new Request('http://localhost/parse-food-text', {
      method: 'OPTIONS',
    });
    const res = await handleParseFoodTextRequest(req);
    expect(res.status).toBe(200);
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/parse-food-text', { method: 'GET' });
    const res = await handleParseFoodTextRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects empty or invalid text with 400 Bad Request', async () => {
    const req = new Request('http://localhost/parse-food-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    const res = await handleParseFoodTextRequest(req);
    expect(res.status).toBe(400);
  });

  it('parses Roman Urdu phrase and grounds nutrients in Pakistani food DB', async () => {
    const req = new Request('http://localhost/parse-food-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'do roti aur ek katori daal chana',
      }),
    });

    const res = await handleParseFoodTextRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const validation = ParseFoodTextResponseSchema.safeParse(json);
    expect(validation.success).toBe(true);

    expect(json.success).toBe(true);
    expect(json.detectedItems.length).toBeGreaterThanOrEqual(2);

    // Verify nutrients come from DB math
    expect(json.resolution.totalCalories).toBeGreaterThan(300);
    expect(json.resolution.totalProteinGrams).toBeGreaterThan(10);
    expect(json.resolution.calorieBand.displayEstimate).toContain('kcal');

    // Verify items resolved
    const rotiItem = json.resolution.items.find((i: any) =>
      i.matchedFoodName.toLowerCase().includes('roti')
    );
    expect(rotiItem).toBeDefined();
    expect(rotiItem.resolvedGrams).toBe(90); // 2 * 45g
  });

  it('parses English/multilingual query with chicken biryani and chai', async () => {
    const req = new Request('http://localhost/parse-food-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '1 plate chicken biryani with 1 cup chai',
      }),
    });

    const res = await handleParseFoodTextRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.resolution.totalCalories).toBeGreaterThan(500);

    const biryaniItem = json.resolution.items.find((i: any) =>
      i.matchedFoodName.toLowerCase().includes('biryani')
    );
    expect(biryaniItem).toBeDefined();
  });
});
