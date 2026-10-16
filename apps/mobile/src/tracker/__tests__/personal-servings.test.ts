import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_EXPANDED_PAKISTANI_FOODS } from '@nutrio/food-db';
import {
  clearPersonalServing,
  defaultServingFor,
  getPersonalServing,
  parseGramsInput,
  PERSONAL_SERVING_ID,
  releasePersonalServingCache,
  savePersonalServing,
  servingNutrition,
  withPersonalServing,
} from '../personalServings.js';
import { calculateCustomizedMacros } from '../ui/ItemCustomizerModal.js';
import { foodKey } from '../ui/useMealBasket.js';

const roti = ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.name === 'Roti / Chapati (Whole Wheat)')!;

describe('parseGramsInput', () => {
  it.each([
    ['137', 137],
    ['137g', 137],
    ['137.5 g', 137.5],
    ['12,5', 12.5],
    ['1.2kg', 1200],
    [' 60 grams ', 60],
    ['5', 5],
  ])('reads "%s" as %s g', (text, grams) => {
    expect(parseGramsInput(text)).toBe(grams);
  });

  it.each(['', 'abc', '0', '-20', '3001', '4kg', '1.2.3', '20 cups'])('rejects "%s"', (text) => {
    expect(parseGramsInput(text)).toBeNull();
  });
});

describe('personal standard servings', () => {
  beforeEach(() => {
    releasePersonalServingCache();
    try {
      window.localStorage.clear();
    } catch {
      // No localStorage in this runner; the in-memory mirror is enough.
    }
  });

  it('saves and reads back a serving for one food only', () => {
    savePersonalServing(foodKey(roti), 60);
    expect(getPersonalServing(foodKey(roti))?.grams).toBe(60);
    expect(getPersonalServing('some_other_food')).toBeUndefined();
  });

  it('replaces an earlier saved serving', () => {
    savePersonalServing(foodKey(roti), 60);
    savePersonalServing(foodKey(roti), 70);
    expect(getPersonalServing(foodKey(roti))?.grams).toBe(70);
  });

  it.each([0, -5, 3001, Number.NaN])('refuses %s g', (grams) => {
    expect(savePersonalServing(foodKey(roti), grams)).toBeNull();
    expect(getPersonalServing(foodKey(roti))).toBeUndefined();
  });

  it('resets to the standard serving', () => {
    savePersonalServing(foodKey(roti), 60);
    clearPersonalServing(foodKey(roti));
    expect(getPersonalServing(foodKey(roti))).toBeUndefined();
  });

  it('puts the saved serving first, as the only default, keeping the standard ones', () => {
    const mine = withPersonalServing(roti, savePersonalServing(foodKey(roti), 60)!, 'My serving');
    expect(mine.servings[0]).toMatchObject({ label: 'My serving (60g)', grams: 60, isDefault: true, personalId: PERSONAL_SERVING_ID });
    expect(mine.servings.filter((s) => s.isDefault)).toHaveLength(1);
    expect(mine.servings.slice(1).map((s) => s.label)).toEqual(roti.servings.map((s) => s.label));
  });

  it('leaves the food untouched when nothing is saved', () => {
    expect(withPersonalServing(roti, undefined, 'My serving')).toBe(roti);
  });

  it('logs from the saved serving: 2 × my 60g roti', () => {
    const mine = withPersonalServing(roti, savePersonalServing(foodKey(roti), 60)!, 'My serving');
    const macros = calculateCustomizedMacros(mine, 2, {}, null, 0);
    expect(macros.calories).toBe(Math.round((roti.kcal100g * 120) / 100));
  });
});

describe('one-tap logging paths', () => {
  beforeEach(() => releasePersonalServingCache());

  it('use the saved serving once there is one', () => {
    expect(defaultServingFor(roti, foodKey(roti), 'My serving')?.grams).toBe(45);
    savePersonalServing(foodKey(roti), 60);
    expect(defaultServingFor(roti, foodKey(roti), 'My serving')?.grams).toBe(60);
  });

  it('show a serving’s calories, not the per-100g figure, when the serving has none of its own', () => {
    // Aloo Gosht's 200g serving carries no kcal; the card used to print 146 (per 100g).
    const curry = ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.name === 'Aloo Gosht (Mutton Shorba)')!;
    const nutrition = servingNutrition(curry, curry.servings[0]);
    expect(nutrition.kcal).toBe(curry.kcal100g * 2);
  });
});

describe('custom weight', () => {
  it('computes macros from the typed grams, not the serving', () => {
    const macros = calculateCustomizedMacros(roti, 1, {}, 137, 0);
    expect(macros.calories).toBe(Math.round((roti.kcal100g * 137) / 100));
  });

  it('handles a few grams (5g of ghee is a real entry)', () => {
    const ghee = ALL_EXPANDED_PAKISTANI_FOODS.find((f) => f.name === 'Ghee')!;
    expect(calculateCustomizedMacros(ghee, 1, {}, 5, 0).calories).toBe(Math.round((ghee.kcal100g * 5) / 100));
  });
});
