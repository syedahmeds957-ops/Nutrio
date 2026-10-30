import { describe, expect, it } from 'vitest';
import * as foodDb from '@nutrio/food-db';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

const PLURAL = /_(zero|one|two|few|many|other)$/;
const base = (key: string) => key.replace(PLURAL, '');
const form = (key: string) => PLURAL.exec(key)?.[1] ?? 'bare';

function flat(node: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) Object.assign(out, flat(v, key));
    else out[key] = String(v);
  }
  return out;
}

const vars = (s: string) =>
  [...new Set((s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((x) => x.replace(/\s/g, '')))].sort().join(',');

/** base key -> { form -> text } */
function group(f: Record<string, string>) {
  const g: Record<string, Record<string, string>> = {};
  for (const [k, v] of Object.entries(f)) (g[base(k)] ??= {})[form(k)] = v;
  return g;
}

const enFlat = flat(en);
const arFlat = flat(ar);
const enG = group(enFlat);
const arG = group(arFlat);

describe('en/ar locale parity', () => {
  it('defines exactly the same keys in both files (plural forms folded)', () => {
    expect(Object.keys(enG).filter((k) => !(k in arG))).toEqual([]);
    expect(Object.keys(arG).filter((k) => !(k in enG))).toEqual([]);
  });

  it('uses the same interpolation variables for every key', () => {
    const mismatched = Object.keys(enG).filter((k) => {
      const e = Object.values(enG[k]).map(vars).join(',');
      const a = Object.values(arG[k] ?? {}).map(vars).join(',');
      const set = (s: string) => [...new Set(s.split(',').filter(Boolean))].sort().join(',');
      return set(e) !== set(a);
    });
    expect(mismatched).toEqual([]);
  });

  it('keeps variables identical between matching exact keys', () => {
    const bad = Object.keys(enFlat).filter((k) => k in arFlat && vars(enFlat[k]) !== vars(arFlat[k]));
    expect(bad).toEqual([]);
  });

  it('gives every Arabic plural key all six plural forms', () => {
    const six = ['zero', 'one', 'two', 'few', 'many', 'other'];
    const incomplete = Object.entries(arG)
      .filter(([, forms]) => Object.keys(forms).some((f) => f !== 'bare'))
      .filter(([k, forms]) => !six.every((f) => f in forms) && !('bare' in forms && 'few' in forms && k.startsWith('workout.calories.')))
      .map(([k]) => k);
    expect(incomplete).toEqual([]);
  });

  it('gives every English plural key an "other" form', () => {
    const incomplete = Object.entries(enG)
      .filter(([, forms]) => Object.keys(forms).some((f) => f !== 'bare'))
      .filter(([, forms]) => !('other' in forms))
      .map(([k]) => k);
    expect(incomplete).toEqual([]);
  });

  it('labels every restaurant-menu category in both languages', () => {
    const cats = new Set<string>(['All', 'Other']);
    const brands = [
      ...(foodDb.PAKISTANI_RESTAURANT_BRANDS ?? []),
      ...(foodDb.SAUDI_RESTAURANT_BRANDS ?? []),
    ] as Array<{ categories?: string[] }>;
    brands.forEach((b) => b.categories?.forEach((c) => cats.add(c)));
    const items = [
      ...(foodDb.SAUDI_RESTAURANTS_DATA ?? []),
      ...(foodDb.ALL_EXPANDED_PAKISTANI_FOODS ?? []),
      ...(foodDb.SAUDI_TRADITIONAL_FOODS ?? []),
    ] as Array<{ brandCategory?: string; category?: string }>;
    items.forEach((i) => {
      if (i.brandCategory) cats.add(i.brandCategory);
      if (i.category) cats.add(i.category);
    });
    const missing = [...cats].filter((c) => !(`tracker.brandGroups.${c}` in arFlat) || !(`tracker.brandGroups.${c}` in enFlat));
    expect(missing).toEqual([]);
  });
});
