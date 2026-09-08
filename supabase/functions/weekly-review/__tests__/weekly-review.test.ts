import { describe, expect, it } from 'vitest';
import { handleWeeklyReviewRequest } from '../index.js';
import { WeeklyReviewResponseSchema } from '../schema.js';

describe('Weekly Adaptive Check-In Edge Function (Task 4.3)', () => {
  const mock7DayIntakes = [
    { date: '2026-08-25', kcal: 1800 },
    { date: '2026-08-26', kcal: 1850 },
    { date: '2026-08-27', kcal: 1780 },
    { date: '2026-08-28', kcal: 1920 },
    { date: '2026-08-29', kcal: 1830 },
    { date: '2026-08-30', kcal: 1800 },
    { date: '2026-08-31', kcal: 1810 },
  ];

  const mock7DayWeights = [
    { date: '2026-08-25', weightKg: 80.5 },
    { date: '2026-08-26', weightKg: 80.4 },
    { date: '2026-08-27', weightKg: 80.3 },
    { date: '2026-08-28', weightKg: 80.2 },
    { date: '2026-08-29', weightKg: 80.1 },
    { date: '2026-08-30', weightKg: 80.0 },
    { date: '2026-08-31', weightKg: 79.9 },
  ];

  it('handles CORS preflight OPTIONS request with 200 OK', async () => {
    const req = new Request('http://localhost/weekly-review', { method: 'OPTIONS' });
    const res = await handleWeeklyReviewRequest(req);
    expect(res.status).toBe(200);
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/weekly-review', { method: 'GET' });
    const res = await handleWeeklyReviewRequest(req);
    expect(res.status).toBe(405);
  });

  it('rejects invalid request bodies with 400 Bad Request', async () => {
    const req = new Request('http://localhost/weekly-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyIntakes: [] }),
    });
    const res = await handleWeeklyReviewRequest(req);
    expect(res.status).toBe(400);
  });

  it('calculates 7-day adaptive TDEE delta, adherence score, and generates weekly narrative', async () => {
    const req = new Request('http://localhost/weekly-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Bilal',
        currentTDEE: 2300,
        currentKcalTarget: 1800,
        bmr: 1550,
        goal: 'lose',
        dailyIntakes: mock7DayIntakes,
        dailyWeights: mock7DayWeights,
        previousEWMAWeightKg: 80.5,
      }),
    });

    const res = await handleWeeklyReviewRequest(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const validation = WeeklyReviewResponseSchema.safeParse(json);
    expect(validation.success).toBe(true);

    expect(json.success).toBe(true);
    expect(json.metrics.daysLogged).toBe(7);
    expect(json.metrics.meanDailyIntake).toBeGreaterThan(1700);
    expect(json.metrics.adherenceRatePct).toBeGreaterThan(80);
    expect(json.metrics.newKcalTarget).toBeGreaterThanOrEqual(1550); // BMR floor

    expect(json.narrative.headline).toBeDefined();
    expect(json.narrative.summaryText).toContain('7');
    expect(json.narrative.keyActionLever).toBeDefined();
  });
});
