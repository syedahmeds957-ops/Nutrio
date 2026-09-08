import { describe, expect, it } from 'vitest';
import { handlePlanGenerateRequest } from '../index.js';
import { PlanGenerateResponseSchema } from '../schema.js';

describe('Plan Generation Edge Function (Task 2.5)', () => {
  it('handles CORS preflight OPTIONS request with 200 OK', async () => {
    const req = new Request('http://localhost/plan-generate', {
      method: 'OPTIONS',
    });
    const res = await handlePlanGenerateRequest(req);
    expect(res.status).toBe(200);
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/plan-generate', { method: 'GET' });
    const res = await handlePlanGenerateRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects invalid request payload with 400 Bad Request', async () => {
    const req = new Request('http://localhost/plan-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetCalories: -500 }),
    });
    const res = await handlePlanGenerateRequest(req);
    expect(res.status).toBe(400);
  });

  it('generates a verified plan strictly within +-5% tolerance with cultural guidance', async () => {
    const req = new Request('http://localhost/plan-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCalories: 2000,
        targetProteinGrams: 140,
        targetFatGrams: 55,
        targetCarbGrams: 235,
        dietPreference: 'halal_omnivore',
        budgetTierPKR: 'standard_3500_7000',
      }),
    });

    const res = await handlePlanGenerateRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const validation = PlanGenerateResponseSchema.safeParse(json);
    expect(validation.success).toBe(true);

    expect(json.success).toBe(true);
    expect(json.plan.isWithinTolerance).toBe(true);
    expect(Math.abs(json.plan.calorieDeviationPct)).toBeLessThanOrEqual(5.0);
    expect(json.culturalNarrative.length).toBeGreaterThan(20);
    expect(json.cookingAdvice.length).toBeGreaterThan(15);
  });

  it('supports Family Mode in edge function', async () => {
    const req = new Request('http://localhost/plan-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCalories: 2000,
        targetProteinGrams: 140,
        targetFatGrams: 55,
        targetCarbGrams: 235,
        dietPreference: 'halal_omnivore',
        budgetTierPKR: 'standard_3500_7000',
        familyMode: {
          familyDishName: 'Chicken Karahi',
          familyMealSlot: 'dinner',
        },
      }),
    });

    const res = await handlePlanGenerateRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.isFamilyModeActive).toBe(true);
    expect(json.plan.isWithinTolerance).toBe(true);
  });

  it('supports Ramadan Mode in edge function', async () => {
    const req = new Request('http://localhost/plan-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCalories: 1900,
        targetProteinGrams: 130,
        targetFatGrams: 50,
        targetCarbGrams: 230,
        dietPreference: 'halal_omnivore',
        budgetTierPKR: 'standard_3500_7000',
        isRamadanMode: true,
      }),
    });

    const res = await handlePlanGenerateRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.isRamadanModeActive).toBe(true);
    expect(json.culturalNarrative).toContain('Ramadan');
  });
});
