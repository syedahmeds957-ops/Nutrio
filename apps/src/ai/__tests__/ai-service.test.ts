import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeMealPhoto,
  getFallbackCoachResponse,
  getFallbackVisionDetection,
  sendCoachMessage,
} from '../ai-service.js';
import {
  saveOpenAiKey,
  saveGeminiKey,
  getStoredOpenAiKey,
  getStoredGeminiKey,
  setActiveAiProvider,
} from '../apiKeyStorage.js';
import { CoachContext } from '@nutrio/nutrition-core';

describe('AI Service Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    saveOpenAiKey('');
    saveGeminiKey('');
    setActiveAiProvider('auto');
  });

  describe('API Key Storage', () => {
    it('stores and retrieves OpenAI and Gemini keys', () => {
      saveOpenAiKey('sk-test-openai-123');
      expect(getStoredOpenAiKey()).toBe('sk-test-openai-123');

      saveGeminiKey('AIzaSyTestGemini456');
      expect(getStoredGeminiKey()).toBe('AIzaSyTestGemini456');
    });
  });

  describe('Deterministic Vision Fallback', () => {
    it('detects Biryani from context note', () => {
      const res = getFallbackVisionDetection('Chicken biryani from ammi');
      expect(res.dishDetected).toContain('Biryani');
      expect(res.detectedItems[0].detectedName).toContain('Biryani');
    });

    it('detects Daal & Roti from context note', () => {
      const res = getFallbackVisionDetection('Daal chana with 2 rotis');
      expect(res.dishDetected).toContain('Daal');
      expect(res.detectedItems.length).toBe(2);
    });

    it('returns default Karahi & Roti when no note matches', () => {
      const res = getFallbackVisionDetection('random meal plate');
      expect(res.dishDetected).toContain('Chicken Karahi');
      expect(res.detectedItems.length).toBeGreaterThan(0);
    });
  });

  describe('Deterministic Coach Fallback', () => {
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

  describe('OpenAI Vision Integration', () => {
    it('calls OpenAI vision and parses structured dishes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  dishDetected: 'Mutton Karahi',
                  cookingMethod: 'Wok fried in tomatoes',
                  items: [
                    { detectedName: 'Mutton Karahi', estimatedGrams: 220 },
                    { detectedName: 'Roti', estimatedGrams: 80 },
                  ],
                }),
              },
            },
          ],
        }),
      });

      const res = await analyzeMealPhoto('data:image/jpeg;base64,12345', 'lunch', {
        provider: 'openai',
        apiKey: 'sk-test',
      });

      expect(res.providerUsed).toBe('openai');
      expect(res.dishDetected).toBe('Mutton Karahi');
      expect(res.detectedItems.length).toBe(2);
      expect(res.detectedItems[0].estimatedGrams).toBe(220);
    });
  });

  describe('Coach Chat Live Integration', () => {
    it('parses suggestions from assistant response text', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: `You have 750 kcal left today. A plate of daal with whole wheat roti is a great choice!\n\nSUGGESTIONS: ["Can I have chai after?", "How much daal?", "Add a salad"]`,
              },
            },
          ],
        }),
      });

      const mockContext: CoachContext = {
        displayName: 'Ahmed',
        sex: 'male',
        ageYears: 25,
        weightKg: 75,
        goal: 'lose',
        targets: { kcalTarget: 2000, proteinGrams: 140, fatGrams: 55, carbGrams: 230 },
      };

      const res = await sendCoachMessage(
        [{ role: 'user', content: 'What can I eat for dinner?' }],
        mockContext,
        { provider: 'openai', apiKey: 'sk-test' }
      );

      expect(res.providerUsed).toBe('openai');
      expect(res.reply).toContain('750 kcal');
      expect(res.suggestedPrompts).toEqual([
        'Can I have chai after?',
        'How much daal?',
        'Add a salad',
      ]);
    });
  });
});
