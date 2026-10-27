import { describe, expect, it } from 'vitest';
import { ALL_FOODS_CATALOG } from '@nutrio/food-db';

import { localizeServingLabel, servingDisplayLabel } from '../servingLabel';

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

describe('serving labels by effective language', () => {
  it('PK drops a bracketed Arabic name', () => {
    expect(localizeServingLabel('1 Plate / Portion (نفر)', 'en')).toBe('1 Plate / Portion');
    expect(servingDisplayLabel('Half Plate (نصف نفر) (150g)', 'en')).toBe('Half Plate');
  });
  it('SA uses the bracketed Arabic name', () => {
    expect(localizeServingLabel('1 Plate / Portion (نفر)', 'ar')).toBe('1 نفر');
  });
  it('no catalogue serving label shows Arabic in PK', () => {
    for (const f of ALL_FOODS_CATALOG) {
      for (const s of f.servings ?? []) {
        expect(hasArabic(servingDisplayLabel(s.label || s.description || '', 'en'))).toBe(false);
      }
    }
  });
});
