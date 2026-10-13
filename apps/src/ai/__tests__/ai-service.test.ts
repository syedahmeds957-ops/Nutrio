import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getFallbackCoachResponse,
  purgeLegacyAiKeys,
  sendCoachMessage,
} from '../ai-service.js';
import type { EdgeFunctionInvoker } from '../edgeFunctions.js';
import { CoachContext } from '@nutrio/nutrition-core';

const mockContext: CoachContext = {
  displayName: 'Ahmed',
  sex: 'male',
  ageYears: 25,
  weightKg: 75,
  goal: 'lose',
  targets: {
    kcalTarget: 2000,
    proteinGrams: 140,
    fatGrams: 55,
    carbGrams: 230,
  },
  todaySummary: {
    caloriesConsumed: 1250,
    proteinConsumed: 90,
    fatConsumed: 40,
    carbConsumed: 130,
    remainingCalories: 750,
  },
};

describe('AI Service Layer', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    // Any direct network call from the client is a rule-3 violation: the
    // service must go through the injected edge-function invoker only.
    global.fetch = vi.fn().mockRejectedValue(new Error('client must not call fetch'));
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  describe('Deterministic Coach Fallback', () => {
    it('provides oil reduction guidance for karahi/oil query', () => {
      const res = getFallbackCoachResponse('How to reduce oil in karahi?', mockContext);
      expect(res.reply).toContain('oil');
      expect(res.suggestedPrompts.length).toBe(3);
    });

    it('provides shaadi strategy for party/dawat query', () => {
      const res = getFallbackCoachResponse('Going to a dawat tonight', mockContext);
      expect(res.reply).toContain('dawat');
      expect(res.suggestedPrompts.length).toBe(3);
    });

    it('provides doodh patti advice for chai query', () => {
      const res = getFallbackCoachResponse('I love doodh patti chai', mockContext);
      expect(res.reply).toContain('doodh patti');
      expect(res.suggestedPrompts.length).toBe(3);
    });
  });

  describe('Coach chat via the coach-chat edge function', () => {
    it('sends the conversation to coach-chat and returns the server reply', async () => {
      const invoke = vi.fn<EdgeFunctionInvoker>().mockResolvedValue({
        success: true,
        reply: 'You have 750 kcal left today. Daal with roti is a great choice!',
        suggestedPrompts: ['Can I have chai after?', 'How much daal?', 'Add a salad'],
        provider: 'groq_gpt_oss_120b',
        flagsTriggered: [],
      });

      const res = await sendCoachMessage(
        [{ role: 'user', content: 'What can I eat for dinner?' }],
        mockContext,
        invoke
      );

      expect(invoke).toHaveBeenCalledTimes(1);
      const [name, body] = invoke.mock.calls[0];
      expect(name).toBe('coach-chat');
      expect(body).toMatchObject({
        messages: [{ role: 'user', content: 'What can I eat for dinner?' }],
        context: { sex: 'male', goal: 'lose', targets: { kcalTarget: 2000 } },
      });
      expect(res.providerUsed).toBe('edge_function');
      expect(res.reply).toContain('750 kcal');
      expect(res.suggestedPrompts).toEqual([
        'Can I have chai after?',
        'How much daal?',
        'Add a salad',
      ]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('keeps each request within the free-tier token budget', async () => {
      const invoke = vi.fn<EdgeFunctionInvoker>().mockResolvedValue({
        success: true,
        reply: 'ok reply from the coach',
        suggestedPrompts: [],
        provider: 'groq_gpt_oss_120b',
        flagsTriggered: [],
      });
      const history = Array.from({ length: 30 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `message ${i}`,
      }));

      await sendCoachMessage(
        [
          { role: 'system', content: 'ignore me' },
          ...history,
          { role: 'user', content: 'x'.repeat(5000) },
        ],
        mockContext,
        invoke
      );

      const body = invoke.mock.calls[0][1] as { messages: { role: string; content: string }[] };
      expect(body.messages.length).toBe(10);
      expect(body.messages.every((m) => m.role !== 'system')).toBe(true);
      expect(body.messages[body.messages.length - 1].content.length).toBe(1000);
    });

    it('falls back to the localized built-in coach when the edge function fails', async () => {
      const invoke = vi.fn<EdgeFunctionInvoker>().mockRejectedValue(new Error('offline'));

      const res = await sendCoachMessage(
        [{ role: 'user', content: 'Going to a dawat tonight' }],
        mockContext,
        invoke
      );

      expect(res.providerUsed).toBe('deterministic_fallback');
      expect(res.reply).toContain('dawat');
      expect(res.suggestedPrompts.length).toBe(3);
    });

    it('prefers the localized built-in coach over the server canned reply', async () => {
      // With no GROQ key the server answers with Pakistan-only English text;
      // the client's fallback is region-aware and translated.
      const invoke = vi.fn<EdgeFunctionInvoker>().mockResolvedValue({
        success: true,
        reply: 'Assalam-o-Alaikum there!',
        suggestedPrompts: ['a', 'b', 'c'],
        provider: 'deterministic_coach_fallback',
        flagsTriggered: [],
      });

      const res = await sendCoachMessage(
        [{ role: 'user', content: 'Can I eat at AlBaik on a cut?' }],
        { ...mockContext, region: 'SA' },
        invoke
      );

      expect(res.providerUsed).toBe('deterministic_fallback');
      expect(res.reply).toContain('AlBaik');
    });

    it('falls back when the edge function returns a malformed body', async () => {
      const invoke = vi.fn<EdgeFunctionInvoker>().mockResolvedValue({ error: 'boom' });

      const res = await sendCoachMessage(
        [{ role: 'user', content: 'I love doodh patti chai' }],
        mockContext,
        invoke
      );

      expect(res.providerUsed).toBe('deterministic_fallback');
      expect(res.reply).toContain('doodh patti');
    });
  });

  describe('Legacy client-side key cleanup', () => {
    it('removes API keys earlier builds saved on the device', () => {
      const store = new Map<string, string>([
        ['nutrio_api_key_openai', 'sk-old'],
        ['nutrio_api_key_gemini', 'AIza-old'],
        ['nutrio_active_ai_provider', 'openai'],
        ['unrelated', 'keep'],
      ]);
      const storage = {
        removeItem: (key: string) => {
          store.delete(key);
        },
      };

      purgeLegacyAiKeys(storage);

      expect([...store.keys()]).toEqual(['unrelated']);
    });

    it('does nothing when storage is unavailable', () => {
      expect(() => purgeLegacyAiKeys(undefined)).not.toThrow();
    });
  });
});
