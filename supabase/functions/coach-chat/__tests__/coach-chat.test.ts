import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleCoachChatRequest } from '../index.js';
import { CoachChatRequestSchema, CoachChatResponseSchema } from '../schema.js';
import { buildSwapInstructions, coachChatService } from '../service.js';

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

describe('coach-chat workouts and swaps', () => {
  const context = {
    sex: 'male' as const,
    ageYears: 30,
    weightKg: 80,
    goal: 'maintain' as const,
    targets: { kcalTarget: 2200, proteinGrams: 140, fatGrams: 70, carbGrams: 250 },
  };
  const workout = {
    location: 'gym' as const,
    sessionsPlannedThisWeek: 4,
    sessionsDoneThisWeek: 1,
    today: { title: 'Lower body A', exercises: ['Barbell back squat'] },
    ramadan: false,
  };
  const swapRequest = {
    exerciseId: 'barbell-back-squat',
    exerciseName: 'Barbell back squat',
    candidates: [
      { id: 'leg-press', name: 'Leg press', jointLoads: ['knee' as const] },
      { id: 'glute-bridge', name: 'Glute bridge', jointLoads: [] },
    ],
  };
  const request = { messages: [{ role: 'user' as const, content: 'Yes, swap it.' }], context: { ...context, workout }, swapRequest };
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });
  const groqSays = (content: string) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content } }] }) });
    global.fetch = fetchMock;
    return fetchMock;
  };

  it('accepts region, a workout and a swap request, and keeps them through validation', () => {
    const parsed = CoachChatRequestSchema.parse({ ...request, context: { ...request.context, region: 'SA' } });
    expect(parsed.context.region).toBe('SA');
    expect(parsed.context.workout).toEqual(workout);
    expect(parsed.swapRequest).toEqual(swapRequest);
  });

  it('rejects a bad region, a bad joint and more than 8 candidates', () => {
    expect(CoachChatRequestSchema.safeParse({ ...request, context: { ...context, region: 'US' } }).success).toBe(false);
    const badJoint = { ...swapRequest, candidates: [{ id: 'x', name: 'X', jointLoads: ['elbow'] }] };
    expect(CoachChatRequestSchema.safeParse({ ...request, swapRequest: badJoint }).success).toBe(false);
    const nine = { ...swapRequest, candidates: Array.from({ length: 9 }, (_, i) => ({ id: `e${i}`, name: `E${i}`, jointLoads: [] })) };
    expect(CoachChatRequestSchema.safeParse({ ...request, swapRequest: nine }).success).toBe(false);
  });

  it('sends the Saudi prompt when the app says the user is in Saudi Arabia', async () => {
    const fetchMock = groqSays('Ok.');
    await coachChatService(CoachChatRequestSchema.parse({ messages: request.messages, context: { ...context, region: 'SA' } }), 'gsk_test');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content).toContain('Saudi Arabian, Gulf');
  });

  it('adds the workout and swap blocks only when they are sent', async () => {
    const withBoth = groqSays('Ok.');
    await coachChatService(request, 'gsk_test');
    const system = JSON.parse(withBoth.mock.calls[0][1].body).messages[0].content;
    expect(system).toContain('WORKOUT PLAN:');
    expect(system).toContain('EXERCISE BEING DISCUSSED: Barbell back squat');
    expect(system).toContain('- leg-press: Leg press (loads knees)');
    expect(system).toContain('- glute-bridge: Glute bridge (no joint flagged)');

    const plain = groqSays('Ok.');
    await coachChatService({ messages: request.messages, context }, 'gsk_test');
    const plainSystem = JSON.parse(plain.mock.calls[0][1].body).messages[0].content;
    expect(plainSystem).not.toContain('WORKOUT PLAN');
    expect(plainSystem).not.toContain('EXERCISE BEING DISCUSSED');
  });

  it('tells the model when there is no safe alternative', () => {
    expect(buildSwapInstructions({ ...swapRequest, candidates: [] })).toContain('there is no safe alternative');
  });

  it('returns a proposed swap from the candidates, with the line taken out of the reply', async () => {
    groqSays('Glute bridge is easier on the knee.\nSWAP: {"toId": "glute-bridge", "reason": "Easier on the knee."}\nSUGGESTIONS: ["Will this still work my glutes?"]');
    const result = await coachChatService(request, 'gsk_test');
    expect(result.reply).toBe('Glute bridge is easier on the knee.');
    expect(result.proposedSwap).toEqual({ toId: 'glute-bridge', reason: 'Easier on the knee.' });
    expect(result.suggestedPrompts).toEqual(['Will this still work my glutes?']);
    expect(CoachChatResponseSchema.parse(result).proposedSwap).toBeDefined();
  });

  it('finds the swap line after SUGGESTIONS or inside a code fence', async () => {
    groqSays('Done.\nSUGGESTIONS: ["Is this ok for my knee?"]\nSWAP: {"toId": "glute-bridge", "reason": "Kinder to knees."}');
    const after = await coachChatService(request, 'gsk_test');
    expect(after.proposedSwap?.toId).toBe('glute-bridge');
    expect(after.suggestedPrompts).toEqual(['Is this ok for my knee?']);

    groqSays('Done.\n```json\nSWAP: {"toId": "leg-press", "reason": "Machine support."}\n```\nSUGGESTIONS: ["Ok?"]');
    const fenced = await coachChatService(request, 'gsk_test');
    expect(fenced.proposedSwap?.toId).toBe('leg-press');
    expect(fenced.reply).toBe('Done.');
  });

  it('uses the reason as the answer when the model sends only the SWAP line', async () => {
    groqSays('SWAP: {"toId": "glute-bridge", "reason": "Glute bridges spare your knees."}\nSUGGESTIONS: ["Ok?"]');
    const result = await coachChatService(request, 'gsk_test');
    expect(result.proposedSwap?.toId).toBe('glute-bridge');
    expect(result.reply).toBe('Glute bridges spare your knees.');
    expect(result.provider).toBe('groq_gpt_oss_120b');
  });

  it('drops a swap that is not a candidate, or malformed, and flags it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    groqSays('Try deadlifts.\nSWAP: {"toId": "barbell-deadlift", "reason": "x"}');
    const foreign = await coachChatService(request, 'gsk_test');
    expect(foreign.proposedSwap).toBeUndefined();
    expect(foreign.reply).toBe('Try deadlifts.');
    expect(foreign.flagsTriggered).toContain('SWAP_NOT_IN_CANDIDATES');
    expect(warn).toHaveBeenCalled();

    groqSays('Hmm.\nSWAP: {toId: glute-bridge}');
    const malformed = await coachChatService(request, 'gsk_test');
    expect(malformed.proposedSwap).toBeUndefined();
    expect(malformed.reply).toBe('Hmm.');
  });

  it('never returns a swap when the app did not ask about an exercise', async () => {
    groqSays('Ok.\nSWAP: {"toId": "glute-bridge", "reason": "x"}');
    const result = await coachChatService({ messages: request.messages, context }, 'gsk_test');
    expect(result.proposedSwap).toBeUndefined();
    expect(result.reply).toBe('Ok.');
  });

  it('never proposes a swap from the offline fallback', async () => {
    const result = await coachChatService(request);
    expect(result.provider).toBe('deterministic_coach_fallback');
    expect(result.proposedSwap).toBeUndefined();
  });
});
