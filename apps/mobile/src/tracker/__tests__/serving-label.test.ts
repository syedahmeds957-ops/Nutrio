import { describe, expect, it } from 'vitest';
import { localizeServingLabel } from '../servingLabel.js';

describe('localizeServingLabel', () => {
  it('leaves English readers alone', () => {
    expect(localizeServingLabel('1 small bowl (150g)', 'en')).toBe('1 small bowl (150g)');
  });

  it('uses a bracketed Arabic name as it is', () => {
    expect(localizeServingLabel('1 Plate / Portion (نفر)', 'ar')).toBe('1 نفر');
    expect(localizeServingLabel('1 Medium Bowl (صحن وسط)', 'ar')).toBe('1 صحن وسط');
  });

  it('translates common units and agrees adjectives with the noun', () => {
    expect(localizeServingLabel('1 small bowl (150g)', 'ar')).toBe('1 وعاء صغير');
    expect(localizeServingLabel('1 small portion (100g)', 'ar')).toBe('1 حصة صغيرة');
    expect(localizeServingLabel('2 tbsp (30g)', 'ar')).toBe('2 ملعقة كبيرة');
    expect(localizeServingLabel('1 glass (250ml)', 'ar')).toBe('1 كوب');
    expect(localizeServingLabel('Half Plate', 'ar')).toBe('نصف طبق');
  });

  it('returns a label with an unknown word unchanged', () => {
    expect(localizeServingLabel('1 bazinga burger (200g)', 'ar')).toBe('1 bazinga burger (200g)');
  });
});
