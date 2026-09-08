import { describe, expect, it } from 'vitest';
import { handleCoachChatRequest } from '../index.js';
import { CoachChatResponseSchema } from '../schema.js';

describe('AI Nutritionist Coach Edge Function (Task 4.2)', () => {
  const dummyContext = {
    displayName: 'Fatima',
    sex: 'female' as const,
    ageYears: 29,
    weightKg: 68,
    goal: 'lose' as const,
    targets: {
      kcalTarget: 1600,
      proteinGrams: 110,
      fatGrams: 45,
      carbGrams: 185,
      waterMl: 2800,
    },
    todaySummary: {
      caloriesConsumed: 1100,
      proteinConsumed: 75,
      fatConsumed: 35,
      carbConsumed: 120,
      remainingCalories: 500,
      foodsLoggedToday: ['1 Roti', '1 Katori Daal'],
    },
    medicalFlags: ['PCOS'],
  };

  it('handles CORS preflight OPTIONS request with 200 OK', async () => {
    const req = new Request('http://localhost/coach-chat', { method: 'OPTIONS' });
    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(200);
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/coach-chat', { method: 'GET' });
    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects invalid request bodies with 400 Bad Request', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(400);
  });

  it('answers desi cooking oil questions and returns structured suggested prompts', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'How can I reduce oil when cooking Chicken Karahi?',
          },
        ],
        context: dummyContext,
      }),
    });

    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const validation = CoachChatResponseSchema.safeParse(json);
    expect(validation.success).toBe(true);

    expect(json.success).toBe(true);
    expect(json.reply).toContain('oil');
    expect(json.suggestedPrompts).toHaveLength(3);
    expect(json.flagsTriggered).toHaveLength(0);
  });

  it('handles shaadi/dawat harm-reduction queries', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'I have a shaadi dinner tonight, how should I eat?',
          },
        ],
        context: dummyContext,
      }),
    });

    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.reply).toContain('shaadi');
    expect(json.suggestedPrompts.length).toBeGreaterThanOrEqual(1);
  });
});
