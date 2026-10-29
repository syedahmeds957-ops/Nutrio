import { describe, expect, it } from 'vitest';
import { ALL_FOODS_CATALOG } from '@nutrio/food-db';
import { localizeServingLabel, servingDisplayLabel, withoutAmountBracket } from '../servingLabel.js';

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
    expect(localizeServingLabel('1 zorblax burger (200g)', 'ar')).toBe('1 zorblax burger (200g)');
  });
});

describe('withoutAmountBracket', () => {
  it('drops a bracketed weight or volume and nothing else', () => {
    expect(withoutAmountBracket('1 glass (250ml)')).toBe('1 glass');
    expect(withoutAmountBracket('1 small bowl (150g)')).toBe('1 small bowl');
    expect(withoutAmountBracket('1 Plate / Portion (نفر)')).toBe('1 Plate / Portion (نفر)');
  });
});

describe('localizeServingLabel, wider catalogue vocabulary', () => {
  const ar = (label: string) => servingDisplayLabel(label, 'ar');

  it('a bare adjective is a whole item', () => {
    expect(ar('1 medium (118g)')).toBe('1 حبة متوسطة');
    expect(ar('1 small')).toBe('1 حبة صغيرة');
  });
  it('bare amounts and fractions', () => {
    expect(ar('100g')).toBe('100 غ');
    expect(ar('250 ml')).toBe('250 مل');
    expect(ar('1/2 kg handi (400g)')).toBe('1/2 كيلو هاندي');
    expect(ar('1 half avocado')).toBe('نصف أفوكادو');
  });
  it('nouns after the number, with plurals for 2 to 10', () => {
    expect(ar('1 cup')).toBe('1 كوب');
    expect(ar('3 cups')).toBe('3 أكواب');
    expect(ar('4 skewers (200g)')).toBe('4 أسياخ');
    expect(ar('1 katori')).toBe('1 كاتوري');
    expect(ar('6 wings (200g)')).toBe('6 أجنحة');
  });
  it('adjectives agree with the noun, plural nouns take the feminine', () => {
    expect(ar('1 regular cup (180g)')).toBe('1 كوب عادي');
    expect(ar('2 large cups')).toBe('2 أكواب كبيرة');
    expect(ar('1 medium mango')).toBe('1 مانجا متوسطة');
    expect(ar('1 cup chopped (180g)')).toBe('1 كوب مفروم');
  });
  it('with-phrases and comma extras', () => {
    expect(ar('3 tenders with dip (180g)')).toBe('3 تندرز مع صلصة غمس');
    expect(ar('1 plate, 2 eggs')).toBe('1 طبق مع بيضتين');
  });
  it('a bracketed Arabic name loses its weight and does not repeat a number', () => {
    expect(ar('1 Glass (كوب لبن - 200ml)')).toBe('1 كوب لبن');
    expect(localizeServingLabel('3 Finjans (٣ فناجيل - 120ml)', 'ar')).toBe('٣ فناجيل');
  });
  it('unknown or odd text is untouched and never throws', () => {
    for (const odd of ['', '   ', '1', '(', '1 cup (1.5 tsp sugar, default)', '1 zorblax', '0.5 / 2', 'with', ', ,']) {
      expect(() => localizeServingLabel(odd, 'ar')).not.toThrow();
    }
    expect(ar('1 zorblax (50g)')).toBe('1 zorblax');
    expect(ar('')).toBe('');
  });
  it('every catalogue label is fully Arabic except a few free-text ones', () => {
    const left = new Set<string>();
    for (const f of ALL_FOODS_CATALOG) {
      for (const s of f.servings ?? []) {
        const out = ar(s.label || s.description || '');
        if (/[A-Za-z]/.test(out)) left.add(s.label || s.description || '');
      }
    }
    expect([...left]).toEqual(['1 cup (1.5 tsp sugar, default)']);
  });
});
