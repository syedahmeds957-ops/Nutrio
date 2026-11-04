import { describe, it, expect } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  RETIRED_DUPLICATE_IDS,
  resolveFoodId,
  findPakistaniFoodByName,
  DERIVED_VARIANT_FOODS,
  deriveMeatVariant,
  SLOW_COOKED_CURRIES_DATA,
} from '../src/data/index.js';
import { getFoodVariants, searchPakistaniFoods } from '../src/index.js';

const catalog = ALL_EXPANDED_PAKISTANI_FOODS;
const byName = (name: string) => {
  const food = catalog.find((f) => f.name === name);
  if (!food) throw new Error(`missing ${name}`);
  return food;
};
const atwater = (f: { protein100g: number; carb100g: number; fat100g: number }) =>
  4 * f.protein100g + 4 * f.carb100g + 9 * f.fat100g;

describe('duplicate retirement', () => {
  it('drops every retired duplicate from the catalogue', () => {
    const ids = new Set(catalog.map((f) => f.id));
    for (const retired of Object.keys(RETIRED_DUPLICATE_IDS)) {
      expect(ids.has(retired), retired).toBe(false);
    }
  });

  it('points every retired id at a food that is still in the catalogue', () => {
    const ids = new Set(catalog.map((f) => f.id));
    for (const retired of Object.keys(RETIRED_DUPLICATE_IDS)) {
      expect(ids.has(resolveFoodId(retired)), retired).toBe(true);
    }
  });

  it('leaves live ids unchanged', () => {
    expect(resolveFoodId('pak_food_187')).toBe('pak_food_187');
  });

  it('resolves a retired dish name to its replacement', () => {
    expect(findPakistaniFoodByName('Lassi Namkeen')?.name).toBe('Salted Lassi');
    expect(findPakistaniFoodByName('Aloo Gosht (Mutton Shorba)')?.id).toBe('pak_food_187');
    expect(findPakistaniFoodByName('No Such Dish')).toBeUndefined();
  });

  it('keeps ids unique', () => {
    const ids = catalog.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps no two home dishes under the same name', () => {
    const names = catalog
      .filter((f) => !f.brand || f.brand === 'Ghar ka Khana')
      .map((f) => f.name.toLowerCase().trim());
    const repeated = names.filter((n, i) => names.indexOf(n) !== i);
    expect(repeated).toEqual([]);
  });

  it('does not renumber the positional ids of foods that stay', () => {
    expect(byName('Aloo Gosht (Mutton Shorba)').id).toBe('pak_food_187');
    expect(byName('Palak Gosht (Mutton in Spinach)').id).toBe('pak_food_199');
  });
});

describe('meat variants', () => {
  it('offers Mutton, Beef and Chicken for Aloo Gosht', () => {
    const labels = getFoodVariants(byName('Aloo Gosht (Mutton Shorba)')).map((f) => f.variantLabel);
    expect(labels).toEqual(['Mutton', 'Beef', 'Chicken']);
  });

  it.each([
    'Palak Gosht (Mutton in Spinach)',
    'Bhindi Gosht (Okra with Meat)',
    'Shaljam Gosht (Turnip & Mutton)',
    'Arvi Gosht (Colocasia & Mutton Gravy)',
    'Karela Gosht (Bitter Gourd & Mutton)',
    'Kofta Curry (Beef Meatballs)',
    'Matar Keema (Minced Beef with Peas)',
  ])('offers three meats for %s', (name) => {
    const variants = getFoodVariants(byName(name));
    expect(new Set(variants.map((f) => f.variantLabel))).toEqual(
      new Set(['Mutton', 'Beef', 'Chicken'])
    );
  });

  it('returns no variants for a dish that has none', () => {
    expect(getFoodVariants(byName('Daal Chawal Combo'))).toEqual([]);
  });

  it('labels derived foods as composed, never dietitian approved', () => {
    expect(DERIVED_VARIANT_FOODS.length).toBeGreaterThanOrEqual(25);
    for (const food of DERIVED_VARIANT_FOODS) {
      expect(food.verifiedBy, food.name).toBe('composed');
      expect(food.sourceRef, food.name).toMatch(/derived from/i);
    }
  });

  it('keeps derived calories consistent with their macros', () => {
    for (const food of DERIVED_VARIANT_FOODS) {
      expect(Math.abs(food.kcal100g - atwater(food)), food.name).toBeLessThanOrEqual(1);
    }
  });

  it('makes chicken versions leaner than mutton versions', () => {
    for (const group of new Set(DERIVED_VARIANT_FOODS.map((f) => f.variantGroup))) {
      const members = catalog.filter((f) => f.variantGroup === group);
      const chicken = members.find((f) => f.variantLabel === 'Chicken');
      const mutton = members.find((f) => f.variantLabel === 'Mutton');
      if (chicken && mutton) expect(chicken.fat100g, String(group)).toBeLessThan(mutton.fat100g);
    }
  });

  it('lands near the hand-entered Chicken Kofta Curry when derived from the beef one', () => {
    const beef = SLOW_COOKED_CURRIES_DATA.find((f) => f.name === 'Kofta Curry (Beef Meatballs)')!;
    const handEntered = SLOW_COOKED_CURRIES_DATA.find((f) => f.name === 'Chicken Kofta Curry')!;
    const derived = deriveMeatVariant(beef, { from: 'beef', to: 'chicken', form: 'mince' });
    expect(Math.abs(derived.kcal100g - handEntered.kcal100g) / handEntered.kcal100g).toBeLessThan(0.15);
  });

  it('adds the missing combinations, including Palak Kofta', () => {
    for (const name of [
      'Palak Kofta (Beef Meatballs in Spinach)',
      'Matar Gosht (Mutton & Peas)',
      'Lauki Gosht (Bottle Gourd & Mutton)',
      'Karela Keema (Bitter Gourd & Beef Mince)',
      'Gobhi Keema (Cauliflower & Beef Mince)',
    ]) {
      expect(() => byName(name)).not.toThrow();
    }
  });
});

describe('search precision', () => {
  const names = (q: string) => searchPakistaniFoods(q).map((f) => f.name.toLowerCase());

  it('shows Aloo Gosht once, not once per meat', () => {
    const results = searchPakistaniFoods('aloo gosht');
    expect(results.filter((f) => f.variantGroup === 'aloo-gosht')).toHaveLength(1);
  });

  it('opens on the original dish when the query names no meat', () => {
    expect(searchPakistaniFoods('qeema matar')[0].name).toBe('Matar Keema (Minced Beef with Peas)');
    expect(searchPakistaniFoods('aloo gosht')[0].name).toBe('Aloo Gosht (Mutton Shorba)');
  });

  it('opens on the meat the query names', () => {
    expect(searchPakistaniFoods('palak chicken')[0].variantLabel).toBe('Chicken');
    expect(searchPakistaniFoods('keema matar chicken')[0].variantLabel).toBe('Chicken');
  });

  it('finds Palak Kofta first', () => {
    expect(names('palak kofta')[0]).toContain('palak kofta');
  });

  it('lists only dishes containing every searched word', () => {
    for (const q of ['palak kofta', 'chicken karahi', 'aloo palak']) {
      const words = q.split(' ');
      for (const n of names(q)) {
        for (const w of words) expect(n, `${q} → ${n}`).toContain(w);
      }
    }
  });

  it('returns nothing rather than near-misses for an unknown dish', () => {
    expect(searchPakistaniFoods('palak pizza')).toEqual([]);
    expect(searchPakistaniFoods('xyzqwe')).toEqual([]);
  });

  it('does not match on category alone', () => {
    // "Slow-Cooked Curries" is a category, not a dish name.
    expect(names('slow').every((n) => n.includes('slow'))).toBe(true);
  });

  it('still completes a word being typed', () => {
    expect(names('chick').length).toBeGreaterThan(5);
    expect(names('chick').every((n) => n.includes('chick'))).toBe(true);
  });
});
