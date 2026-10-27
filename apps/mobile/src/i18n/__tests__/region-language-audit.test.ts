import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as foodDb from '@nutrio/food-db';
import { authErrorKey } from '../../auth/authErrors.js';
import { i18n, initI18n } from '../config.js';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

const ARABIC = /[؀-ۿ]/;
const flat = (o: unknown, p = ''): Array<[string, string]> =>
  Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === 'object' && v ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]],
  );

describe('PK shows no Arabic', () => {
  it('has no Arabic text in the English catalogue', () => {
    expect(flat(en).filter(([, v]) => ARABIC.test(v)).map(([k]) => k)).toEqual([]);
  });

  it('offers no language switcher in the profile sheet', () => {
    const src = readFileSync(resolve(__dirname, '../../tracker/ui/ProfileSheet.tsx'), 'utf8');
    expect(ARABIC.test(src)).toBe(false);
    expect(src).not.toMatch(/setLanguagePreference|languageChoice/);
  });

  it('lists no Arabic in PK catalogue names, brands or tag lines', () => {
    const foods = foodDb.getFoodsForRegion('PK');
    expect(foods.filter((f) => ARABIC.test(f.name) || ARABIC.test(f.brand ?? '')).length).toBe(0);
    expect(foodDb.getBrandsForRegion('PK').filter((b) => ARABIC.test(b.name) || ARABIC.test(b.tagline ?? '')).length).toBe(0);
  });

  it('keeps Arabic out of the PK coach prompt and asks for English only', async () => {
    const { buildCoachSystemPrompt } = await import('@nutrio/nutrition-core');
    const base = { displayName: 'Ali', ageYears: 30, sex: 'male', weightKg: 80, goal: 'lose', targets: { kcalTarget: 2000, proteinGrams: 150, carbGrams: 200, fatGrams: 60 } } as never;
    const pk = buildCoachSystemPrompt({ ...(base as object), region: 'PK' } as never);
    expect(pk).toMatch(/English only/);
    expect(ARABIC.test(pk)).toBe(false);
    const sa = buildCoachSystemPrompt({ ...(base as object), region: 'SA' } as never);
    expect(sa).toMatch(/Arabic only/);
  });
});

describe('SA shows no English UI text', () => {
  it('translates every English key into Arabic', () => {
    const arKeys = new Set(flat(ar).map(([k]) => k.replace(/_(zero|one|two|few|many|other)$/, '')));
    const missing = flat(en).map(([k]) => k.replace(/_(zero|one|two|few|many|other)$/, '')).filter((k) => !arKeys.has(k));
    expect(missing).toEqual([]);
  });

  it('has no Latin words in Arabic strings except known terms', () => {
    const allowed = new Set(['BMR', 'TDEE', 'NEAT', 'EZ', 'Nutrio', 'kcal', 'PKR', 'SAR', 'AI', 'g', 'kg', 'ml', 'cm', 'RIR', 'AlBaik', 'Kudu']);
    const bad = flat(ar).filter(([, v]) => {
      const words = v.replace(/\{\{[^}]*\}\}/g, '').match(/[A-Za-z]{2,}/g) ?? [];
      return words.some((w) => !allowed.has(w));
    });
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it('shows auth errors as translated text in both languages', () => {
    for (const msg of ['Unable to reach authentication server. Please check...', 'Invalid email or password. x', 'Name is required', 'something odd from the server']) {
      const key = authErrorKey(msg);
      initI18n('ar');
      expect(ARABIC.test(i18n.t(key))).toBe(true);
      initI18n('en');
      expect(ARABIC.test(i18n.t(key))).toBe(false);
    }
  });
});
