import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleCoachChatRequest } from '../index.js';
import { CoachChatResponseSchema } from '../schema.js';
import { coachChatService } from '../service.js';

// The gateway verifies the signature (verify_jwt); the function reads the role.
function jwt(role: string): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ role, sub: 'user-1' })}.signature`;
}
const SIGNED_IN = { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt('authenticated')}` };

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

  it('rejects the public anon key so it cannot spend the AI quota', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt('anon')}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], context: dummyContext }),
    });
    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(401);
  });

  it('rejects requests with no signed-in user', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], context: dummyContext }),
    });
    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(401);
  });

  it('rejects invalid request bodies with 400 Bad Request', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: SIGNED_IN,
      body: JSON.stringify({ messages: [] }),
    });
    const res = await handleCoachChatRequest(req);
    expect(res.status).toBe(400);
  });

  it('answers desi cooking oil questions and returns structured suggested prompts', async () => {
    const req = new Request('http://localhost/coach-chat', {
      method: 'POST',
      headers: SIGNED_IN,
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
      headers: SIGNED_IN,
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

describe('coachChatService calling Groq', () => {
  const request = {
    messages: [{ role: 'user' as const, content: 'One tip for less oil in karahi?' }],
    context: {
      sex: 'female' as const,
      ageYears: 41,
      weightKg: 62,
      goal: 'maintain' as const,
      targets: { kcalTarget: 1800, proteinGrams: 100, fatGrams: 60, carbGrams: 200 },
    },
  };
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('keeps reasoning short so the reply is not starved of tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ finish_reason: 'stop', message: { content: 'Measure oil with a spoon.\nSUGGESTIONS: ["a","b","c"]' } }],
      }),
    });
    global.fetch = fetchMock;

    const result = await coachChatService(request, 'gsk_test');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ reasoning_effort: 'low', include_reasoning: false });
    expect(body.max_completion_tokens).toBeGreaterThanOrEqual(1024);
    expect(result.provider).toBe('groq_gpt_oss_120b');
    expect(result.reply).toBe('Measure oil with a spoon.');
  });

  it('keeps suggestions that read as questions and drops topic headings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: {
              content:
                'Try a boiled egg.\nSUGGESTIONS: ["High-protein snack ideas", "Can I have two eggs at night?", "What should I eat before the gym?"]',
            },
          },
        ],
      }),
    });

    const result = await coachChatService(request, 'gsk_test');

    expect(result.suggestedPrompts).toEqual(['Can I have two eggs at night?', 'What should I eat before the gym?']);
  });

  it('asks the model for questions in the user own words, without brands', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: 'Ok.' } }] }),
    });
    global.fetch = fetchMock;

    await coachChatService(request, 'gsk_test');

    const system = JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content;
    expect(system).toMatch(/questions the user is likely to ask/);
    expect(system).toMatch(/never name brands/);
  });

  it('asks for a short answer that leads with the direct reply', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: 'Ok.' } }] }),
    });
    global.fetch = fetchMock;

    await coachChatService(request, 'gsk_test');

    const system = JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content;
    expect(system).toMatch(/Answer the exact question in the first sentence/);
    expect(system).toMatch(/under 80 words/);
  });

  it('logs why Groq failed before falling back', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Invalid API Key"}}',
    });

    const result = await coachChatService(request, 'gsk_bad');

    expect(result.provider).toBe('deterministic_coach_fallback');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('401'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid API Key'));
  });

  it('logs an empty reply with its finish reason', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ finish_reason: 'length', message: { content: '' } }] }),
    });

    const result = await coachChatService(request, 'gsk_test');

    expect(result.provider).toBe('deterministic_coach_fallback');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('length'));
  });
});
