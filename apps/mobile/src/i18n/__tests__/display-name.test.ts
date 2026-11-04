import { describe, expect, it } from 'vitest';
import { ALL_RESTAURANT_BRANDS, ALL_SAUDI_FOODS, ALL_FOODS_CATALOG } from '@nutrio/food-db';
import { EXERCISES } from '@nutrio/workout-core';

import { brandDisplayName, pickName, pickText } from '../displayName';

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

describe('pickText', () => {
  it('PK (en) never returns Arabic', () => {
    expect(pickText('Chicken Karahi', 'كراهي دجاج', 'en')).toBe('Chicken Karahi');
  });
  it('SA (ar) returns Arabic when present', () => {
    expect(pickText('Kabsa', 'كبسة', 'ar')).toBe('كبسة');
  });
  it('SA falls back to English, never blank', () => {
    expect(pickText('Nihari', undefined, 'ar')).toBe('Nihari');
    expect(pickText('Nihari', '', 'ar')).toBe('Nihari');
    expect(pickText('Nihari', '   ', 'ar')).toBe('Nihari');
  });
});

describe('pickName', () => {
  it('reads a food-style entity', () => {
    expect(pickName({ name: 'Kabsa', nameAr: 'كبسة' }, 'ar')).toBe('كبسة');
    expect(pickName({ name: 'Kabsa', nameAr: 'كبسة' }, 'en')).toBe('Kabsa');
    expect(pickName({ name: 'Nihari' }, 'ar')).toBe('Nihari');
  });
  it('reads an exercise-style entity', () => {
    const name = { en: 'Squat', ar: 'سكوات' };
    expect(pickName({ name }, 'ar')).toBe('سكوات');
    expect(pickName({ name }, 'en')).toBe('Squat');
  });
  it('every catalogue exercise has an English name without Arabic and an Arabic name', () => {
    for (const e of EXERCISES) {
      expect(hasArabic(pickName(e, 'en'))).toBe(false);
      expect(hasArabic(pickName(e, 'ar'))).toBe(true);
    }
  });
  it('every Saudi food shows Arabic in SA and no Arabic in PK', () => {
    for (const f of ALL_SAUDI_FOODS) {
      expect(hasArabic(pickName(f, 'ar'))).toBe(true);
      expect(hasArabic(pickName(f, 'en'))).toBe(false);
    }
  });
  it('no catalogue food is blank in either language', () => {
    for (const f of ALL_FOODS_CATALOG) {
      expect(pickName(f, 'ar').length).toBeGreaterThan(0);
      expect(pickName(f, 'en').length).toBeGreaterThan(0);
    }
  });
});

describe('brandDisplayName', () => {
  it('PK keeps the English brand', () => {
    for (const b of ALL_RESTAURANT_BRANDS) expect(brandDisplayName(b.name, 'en')).toBe(b.name);
  });
  it('SA uses the Arabic brand name where one exists, else English', () => {
    const withAr = ALL_RESTAURANT_BRANDS.find((b) => b.nameAr)!;
    expect(brandDisplayName(withAr.name, 'ar')).toBe(withAr.nameAr);
    const without = ALL_RESTAURANT_BRANDS.find((b) => !b.nameAr)!;
    expect(brandDisplayName(without.name, 'ar')).toBe(without.name);
    expect(brandDisplayName('Some Unknown Place', 'ar')).toBe('Some Unknown Place');
  });
});
