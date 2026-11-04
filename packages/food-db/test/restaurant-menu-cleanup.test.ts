import { describe, expect, it } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  ALL_RESTAURANT_BRANDS,
  ALL_SAUDI_FOODS,
  PAKISTANI_EXPANDED_BRANDS,
  PAKISTANI_EXPANDED_RESTAURANTS_DATA,
  RETIRED_DUPLICATE_IDS,
  RETIRED_SPECIAL_COPIES,
  resolveFoodId,
} from '../src/index.js';

describe('"Special <dish>" clones on the generated restaurant menus', () => {
  const visible = ALL_EXPANDED_PAKISTANI_FOODS.filter((food) => food.brand);
  const visibleKeys = new Set(visible.map((food) => `${food.brand}||${food.name}`));

  it('are retired, each in favour of the plain dish on the same menu', () => {
    const byId = new Map(PAKISTANI_EXPANDED_RESTAURANTS_DATA.map((food) => [food.id, food]));
    expect(Object.keys(RETIRED_SPECIAL_COPIES).length).toBeGreaterThan(700);
    for (const [id, baseId] of Object.entries(RETIRED_SPECIAL_COPIES)) {
      const clone = byId.get(id);
      const base = byId.get(baseId);
      expect(clone, `${id} is not in the data`).toBeDefined();
      expect(base, `${baseId} is not in the data`).toBeDefined();
      expect(clone!.name).toBe(`Special ${base!.name}`);
      expect(clone!.brand).toBe(base!.brand);
      expect(RETIRED_DUPLICATE_IDS[baseId], `${baseId} is itself retired`).toBeUndefined();
      expect(resolveFoodId(id)).toBe(baseId);
    }
  });

  it('no longer show on a menu next to the dish they copy', () => {
    const leftovers = visible.filter(
      (food) => food.name.startsWith('Special ') && visibleKeys.has(`${food.brand}||${food.name.replace(/^Special /, '')}`)
    );
    expect(leftovers.map((food) => `${food.brand}: ${food.name}`)).toEqual([]);
  });

  it('keep every plain dish, and every "Special" dish that has no plain twin', () => {
    const retiredNames = new Set(Object.keys(RETIRED_SPECIAL_COPIES));
    const kept = PAKISTANI_EXPANDED_RESTAURANTS_DATA.filter((food) => !retiredNames.has(food.id as string));
    expect(kept.length).toBe(PAKISTANI_EXPANDED_RESTAURANTS_DATA.length - retiredNames.size);
    expect(kept.some((food) => food.name.startsWith('Special '))).toBe(true);
  });
});

describe('brand menus', () => {
  const everyFood = [...ALL_EXPANDED_PAKISTANI_FOODS, ...ALL_SAUDI_FOODS];

  it('flag the generated template menus as estimates, and nothing else', () => {
    const generated = new Set(PAKISTANI_EXPANDED_BRANDS.map((brand) => brand.id));
    for (const brand of ALL_RESTAURANT_BRANDS) {
      expect(Boolean(brand.estimatedMenu), brand.name).toBe(generated.has(brand.id));
    }
  });

  it('state the true item count in the tagline', () => {
    for (const brand of ALL_RESTAURANT_BRANDS) {
      const match = brand.tagline.match(/^(\d+) items/);
      if (!match) continue;
      const count = everyFood.filter((food) => food.brand === brand.name).length;
      expect(Number(match[1]), `${brand.name}: tagline says ${match[1]}, menu has ${count}`).toBe(count);
    }
  });
});
