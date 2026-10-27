import { describe, expect, it, vi } from 'vitest';
import { describeMeal } from '../mealText.js';

const SENTENCE = 'in breakfast i had 4 eggs white and 2 whole eggs and salad';

describe('describeMeal', () => {
  it('uses the model split when the edge function answers', async () => {
    const invoke = vi.fn(async () => ({
      success: true,
      slot: 'breakfast',
      items: [
        { text: '4 egg whites', name: 'egg white', quantity: 4, quantityGiven: true, unit: 'piece' },
      ],
    }));
    const result = await describeMeal(SENTENCE, 'PK', invoke);
    expect(invoke).toHaveBeenCalledWith('parse-food-text', { text: SENTENCE });
    expect(result.splitBy).toBe('model');
    expect(result.analysis.slot).toBe('breakfast');
    expect(result.analysis.items[0].match.food?.name).toBe('Egg White (Boiled)');
  });

  it('splits on the device when the edge function fails, e.g. for a guest', async () => {
    const result = await describeMeal(SENTENCE, 'PK', async () => {
      throw new Error('Edge function "parse-food-text" returned HTTP 401.');
    });
    expect(result.splitBy).toBe('device');
    expect(result.analysis.slot).toBe('breakfast');
    expect(result.analysis.items).toHaveLength(3);
  });

  it('ignores a malformed body and still answers', async () => {
    const result = await describeMeal(SENTENCE, 'PK', async () => ({ items: 'nope' }));
    expect(result.splitBy).toBe('device');
  });

  describe('the meal the model names', () => {
    const modelSays = (slot: string) => async () => ({
      success: true,
      slot,
      items: [{ text: '2 rotis', name: 'roti', quantity: 2, quantityGiven: true, unit: 'piece' }],
    });

    it('is dropped when the sentence names no meal, so it cannot replace the one the user picked', async () => {
      const result = await describeMeal('2 rotis and daal', 'PK', modelSays('lunch'));
      expect(result.splitBy).toBe('model');
      expect(result.analysis.slot).toBeUndefined();
    });

    it('is kept when the sentence names one', async () => {
      const result = await describeMeal('for dinner i had 2 rotis and daal', 'PK', modelSays('dinner'));
      expect(result.analysis.slot).toBe('dinner');
    });

    it('is kept for an Arabic meal word the on-device parser does not read', async () => {
      const result = await describeMeal('فطور: ٢ خبز وبيض', 'SA', modelSays('breakfast'));
      expect(result.analysis.slot).toBe('breakfast');
    });
  });
});
