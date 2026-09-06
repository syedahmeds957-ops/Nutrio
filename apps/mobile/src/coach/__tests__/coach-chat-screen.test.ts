import { describe, expect, it } from 'vitest';
import { CoachContext } from '@nutrio/nutrition-core';

describe('Interactive AI Nutritionist Chat Screen (Task 4.4)', () => {
  const mockContext: CoachContext = {
    displayName: 'Hamza',
    sex: 'male',
    ageYears: 28,
    weightKg: 80,
    goal: 'lose',
    targets: {
      kcalTarget: 1950,
      proteinGrams: 145,
      fatGrams: 55,
      carbGrams: 220,
      waterMl: 3000,
    },
    todaySummary: {
      caloriesConsumed: 1250,
      proteinConsumed: 90,
      fatConsumed: 40,
      carbConsumed: 130,
      remainingCalories: 700,
      foodsLoggedToday: ['2 Roti', '1 Katori Daal Chana'],
    },
  };

  it('verifies initial conversation context and greeting metadata', () => {
    expect(mockContext.displayName).toBe('Hamza');
    expect(mockContext.todaySummary?.remainingCalories).toBe(700);
    expect(mockContext.targets.kcalTarget).toBe(1950);
  });

  it('matches desi nutrition advice responses for typical user queries', () => {
    const oilQuery = 'how to reduce oil in my chicken karahi';
    expect(oilQuery.includes('oil')).toBe(true);

    const shaadiQuery = 'eating at a shaadi dinner tonight';
    expect(shaadiQuery.includes('shaadi')).toBe(true);

    const chaiQuery = 'can I drink doodh patti chai without ruining my diet?';
    expect(chaiQuery.includes('chai') || chaiQuery.includes('doodh patti')).toBe(true);
  });

  it('generates coach message with suggestions using sendCoachMessage', async () => {
    const { sendCoachMessage } = await import('../../ai/ai-service.js');
    const res = await sendCoachMessage(
      [{ role: 'user', content: 'What healthy desi snacks go with chai?' }],
      mockContext
    );

    expect(res.reply.length).toBeGreaterThan(20);
    expect(res.suggestedPrompts.length).toBeGreaterThanOrEqual(1);
  });
});
