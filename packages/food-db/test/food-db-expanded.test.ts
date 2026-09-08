import { describe, it, expect } from 'vitest';
import {
  PAKISTANI_STAPLES_DATA,
  BBQ_GRILLS_DATA,
  KARAHI_HANDI_DATA,
  RICE_BIRYANI_DATA,
  SLOW_COOKED_CURRIES_DATA,
  NASHTA_BREAKFAST_DATA,
  STREET_FOOD_CHAAT_DATA,
  VEGETABLES_DAAL_DATA,
  PAKISTANI_FAST_FOOD_DATA,
  SWEETS_DESSERTS_DATA,
  BEVERAGES_DRINKS_DATA,
  CALORIFY_RESTAURANTS_DATA,
} from '../src/index.js';

describe('Expanded Pakistani Restaurant & Food Database (500+ Items)', () => {
  it('contains at least 500 verified Pakistani dishes', () => {
    expect(PAKISTANI_STAPLES_DATA.length).toBeGreaterThanOrEqual(2700);
  });

  it('correctly populates all 10 modular category files', () => {
    expect(BBQ_GRILLS_DATA.length).toBe(55);
    expect(KARAHI_HANDI_DATA.length).toBe(65);
    expect(RICE_BIRYANI_DATA.length).toBe(55);
    expect(SLOW_COOKED_CURRIES_DATA.length).toBe(50);
    expect(NASHTA_BREAKFAST_DATA.length).toBe(47);
    expect(STREET_FOOD_CHAAT_DATA.length).toBe(65);
    expect(VEGETABLES_DAAL_DATA.length).toBe(55);
    expect(PAKISTANI_FAST_FOOD_DATA.length).toBe(50);
    expect(SWEETS_DESSERTS_DATA.length).toBe(45);
    expect(BEVERAGES_DRINKS_DATA.length).toBe(40);
  });

  it('ensures 100% of items have dietitian sign-off and valid metadata', () => {
    for (const food of PAKISTANI_STAPLES_DATA) {
      expect(food.verifiedBy).toBe('dietitian_approved');
      expect(food.source).toBe('pak_custom');
      expect(food.name.length).toBeGreaterThan(2);
      expect(food.nameUr).toBeDefined();
      expect(food.category.length).toBeGreaterThan(2);
      expect(food.cuisineTags.length).toBeGreaterThan(0);
      expect(food.oilAddedG).toBeGreaterThanOrEqual(0);
    }
  });

  it('enforces non-negative macronutrients and Atwater energy balance', () => {
    for (const food of PAKISTANI_STAPLES_DATA) {
      expect(food.protein100g).toBeGreaterThanOrEqual(0);
      expect(food.carb100g).toBeGreaterThanOrEqual(0);
      expect(food.fat100g).toBeGreaterThanOrEqual(0);
      expect(food.kcal100g).toBeGreaterThanOrEqual(0);
      expect(food.sodiumMg100g).toBeGreaterThanOrEqual(0);

      // Atwater verification: P*4 + C*4 + F*9 = Kcal (+- 5 kcal rounding margin)
      const expectedKcal = Math.round(
        food.protein100g * 4 + food.carb100g * 4 + food.fat100g * 9
      );
      expect(Math.abs(food.kcal100g - expectedKcal)).toBeLessThanOrEqual(5);
    }
  });

  it('guarantees every item has at least one default serving portion in local units', () => {
    for (const food of PAKISTANI_STAPLES_DATA) {
      expect(food.servings.length).toBeGreaterThan(0);
      const defaultServing = food.servings.find((s) => s.isDefault);
      expect(defaultServing).toBeDefined();
      expect(defaultServing!.grams).toBeGreaterThan(0);
      expect(defaultServing!.label.length).toBeGreaterThan(2);
    }
  });
});
