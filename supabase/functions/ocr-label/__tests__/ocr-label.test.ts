import { describe, expect, it } from 'vitest';
import { PAKISTANI_STAPLES_DATA } from '@nutrio/food-db';
import { handleOCRLabelRequest } from '../index.js';
import { OCRLabelResultSchema } from '../schema.js';
import { validateNutrientMath } from '../parser.js';

describe('Pakistani Food Dataset v1 Expansion (Task 1.7)', () => {
  it('contains at least 50 authentic Pakistani dishes with complete metadata', () => {
    expect(PAKISTANI_STAPLES_DATA.length).toBeGreaterThanOrEqual(50);

    for (const food of PAKISTANI_STAPLES_DATA) {
      expect(food.name.length).toBeGreaterThan(2);
      expect(food.category.length).toBeGreaterThan(2);
      expect(food.kcal100g).toBeGreaterThanOrEqual(0);
      expect(food.protein100g).toBeGreaterThanOrEqual(0);
      expect(food.fat100g).toBeGreaterThanOrEqual(0);
      expect(food.carb100g).toBeGreaterThanOrEqual(0);
      expect(typeof food.oilAddedG).toBe('number');
      expect(food.servings.length).toBeGreaterThan(0);

      // Desi serving check
      const defaultServing = food.servings.find((s) => s.isDefault);
      expect(defaultServing).toBeDefined();
      expect(defaultServing!.grams).toBeGreaterThan(0);
    }
  });

  it('verifies iconic Pakistani dishes and desi portion sizes', () => {
    const dishNames = PAKISTANI_STAPLES_DATA.map((d) => d.name);

    expect(dishNames.some((n) => n.includes('Roti / Chapati'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Tandoori Naan'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Chicken Biryani'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Chicken Karahi'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Beef Nihari'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Chicken Haleem'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Beef Seekh Kebab'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Chapli Kebab'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Doodh Patti Chai'))).toBe(true);
    expect(dishNames.some((n) => n.includes('Gulab Jamun'))).toBe(true);
  });
});

describe('Nutrition Label OCR Edge Function (Task 1.7)', () => {
  it('handles CORS preflight OPTIONS request', async () => {
    const req = new Request('http://localhost/ocr-label', { method: 'OPTIONS' });
    const res = await handleOCRLabelRequest(req);
    expect(res.status).toBe(200);
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/ocr-label', { method: 'GET' });
    const res = await handleOCRLabelRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects empty payload without image with 400 Bad Request', async () => {
    const req = new Request('http://localhost/ocr-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await handleOCRLabelRequest(req);
    expect(res.status).toBe(400);
  });

  it('processes image payload and returns strictly validated OCRLabelResult', async () => {
    const req = new Request('http://localhost/ocr-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        hintText: "Olper's Milk",
      }),
    });

    const res = await handleOCRLabelRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    const validation = OCRLabelResultSchema.safeParse(json.data);
    expect(validation.success).toBe(true);
    expect(json.data.caloriesPer100g).toBeGreaterThan(0);
    expect(json.data.servingSizeGrams).toBeGreaterThan(0);
  });

  it('validates nutrient math consistency accurately', () => {
    // 3g protein (12 kcal) + 5g fat (45 kcal) + 10g carb (40 kcal) = 97 kcal
    // Reported 100 kcal -> matches within 20%
    expect(validateNutrientMath(3, 5, 10, 100)).toBe(true);

    // Reported 300 kcal for 97 kcal of macros -> inconsistent
    expect(validateNutrientMath(3, 5, 10, 300)).toBe(false);
  });
});
