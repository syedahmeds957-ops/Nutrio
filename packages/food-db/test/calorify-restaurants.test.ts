import { describe, it, expect } from 'vitest';
import {
  CALORIFY_RESTAURANTS_DATA,
  CALORIFY_BRANDS,
  FoodModifier,
  NormalizedFood,
} from '../src/index.js';

describe('Phase 1: Calorify-Style Pakistani Restaurant Menus & Food Database', () => {
  it('exports CALORIFY_RESTAURANTS_DATA with at least 80 brand items across 9 key brands', () => {
    expect(CALORIFY_RESTAURANTS_DATA).toBeDefined();
    expect(CALORIFY_RESTAURANTS_DATA.length).toBeGreaterThanOrEqual(80);

    const brands = new Set(CALORIFY_RESTAURANTS_DATA.map((item) => item.brand));
    expect(brands.has('KFC Pakistan')).toBe(true);
    expect(brands.has('Cheezious')).toBe(true);
    expect(brands.has('Broadway Pizza')).toBe(true);
    expect(brands.has('Hardee\'s')).toBe(true);
    expect(brands.has('Kababjees')).toBe(true);
    expect(brands.has('McDonald\'s Pakistan')).toBe(true);
    expect(brands.has('OPTP')).toBe(true);
    expect(brands.has('Savour Foods')).toBe(true);
    expect(brands.has('Ghar ka Khana')).toBe(true);
  });

  it('matches exact calories for flagship KFC Pakistan items from Calorify', () => {
    const kfcItems = CALORIFY_RESTAURANTS_DATA.filter(
      (item) => item.brand === 'KFC Pakistan'
    );

    const zinger = kfcItems.find((i) => i.name === 'Zinger Burger');
    expect(zinger).toBeDefined();
    expect(zinger?.servings[0]?.kcal).toBe(640);
    expect(zinger?.servings[0]?.proteinGrams).toBe(25);
    expect(zinger?.servings[0]?.carbGrams).toBe(59);
    expect(zinger?.servings[0]?.fatGrams).toBe(35);

    const mighty = kfcItems.find((i) => i.name === 'Mighty Zinger');
    expect(mighty).toBeDefined();
    expect(mighty?.servings[0]?.kcal).toBe(815);

    const stacker = kfcItems.find((i) => i.name === 'Zinger Stacker');
    expect(stacker).toBeDefined();
    expect(stacker?.servings[0]?.kcal).toBe(535);

    const kentucky = kfcItems.find((i) => i.name === 'Kentucky Burger');
    expect(kentucky).toBeDefined();
    expect(kentucky?.servings[0]?.kcal).toBe(810);

    const krunch = kfcItems.find((i) => i.name === 'Krunch Burger');
    expect(krunch).toBeDefined();
    expect(krunch?.servings[0]?.kcal).toBe(405);
  });

  it('provides "Make it yours" order customizer modifiers for customizable items', () => {
    const zinger = CALORIFY_RESTAURANTS_DATA.find(
      (i) => i.brand === 'KFC Pakistan' && i.name === 'Zinger Burger'
    );
    expect(zinger?.modifiers).toBeDefined();
    expect(zinger?.modifiers?.length).toBeGreaterThanOrEqual(4);

    const extraFillet = zinger?.modifiers?.find((m) =>
      m.name.toLowerCase().includes('extra zinger fillet')
    );
    expect(extraFillet).toBeDefined();
    expect(extraFillet?.calories).toBe(305);

    const extraCheese = zinger?.modifiers?.find((m) =>
      m.name.toLowerCase().includes('cheese')
    );
    expect(extraCheese).toBeDefined();
    expect(extraCheese?.calories).toBe(40);

    const mayo = zinger?.modifiers?.find((m) =>
      m.name.toLowerCase().includes('mayo')
    );
    expect(mayo).toBeDefined();
    expect(mayo?.calories).toBe(100);
  });

  it('matches exact calories for Ghar ka Khana staples from Calorify', () => {
    const gharItems = CALORIFY_RESTAURANTS_DATA.filter(
      (item) => item.brand === 'Ghar ka Khana'
    );

    const doodhPatti = gharItems.find((i) => i.name === 'Doodh Patti');
    expect(doodhPatti).toBeDefined();
    expect(doodhPatti?.servings[0]?.kcal).toBe(120);

    const mixedChai = gharItems.find((i) => i.name === 'Mixed Chai (half doodh)');
    expect(mixedChai).toBeDefined();
    expect(mixedChai?.servings[0]?.kcal).toBe(85);

    const greenTea = gharItems.find((i) => i.name === 'Green Tea / Qahwa');
    expect(greenTea).toBeDefined();
    expect(greenTea?.servings[0]?.kcal).toBe(0);

    const andaFried = gharItems.find((i) => i.name === 'Anda (fried)');
    expect(andaFried).toBeDefined();
    expect(andaFried?.servings[0]?.kcal).toBe(220);

    const paratha = gharItems.find((i) => i.name === 'Paratha (plain)');
    expect(paratha).toBeDefined();
    expect(paratha?.servings[0]?.kcal).toBe(260);

    const biryani = gharItems.find((i) => i.name === 'Chicken Biryani');
    expect(biryani).toBeDefined();
    expect(biryani?.servings[0]?.kcal).toBe(480);
  });

  it('enforces Atwater energy balance (P*4 + C*4 + F*9 = kcal +- 5) on 100g basis for all items', () => {
    for (const food of CALORIFY_RESTAURANTS_DATA) {
      expect(food.protein100g).toBeGreaterThanOrEqual(0);
      expect(food.carb100g).toBeGreaterThanOrEqual(0);
      expect(food.fat100g).toBeGreaterThanOrEqual(0);
      expect(food.kcal100g).toBeGreaterThanOrEqual(0);

      const expectedKcal = Math.round(
        food.protein100g * 4 + food.carb100g * 4 + food.fat100g * 9
      );
      expect(Math.abs(food.kcal100g - expectedKcal)).toBeLessThanOrEqual(5);
    }
  });

  it('ensures all items have bilingual Urdu name, dietitian approval, and valid serving', () => {
    for (const food of CALORIFY_RESTAURANTS_DATA) {
      expect(food.name.length).toBeGreaterThan(1);
      expect(food.nameUr).toBeDefined();
      expect(food.nameUr?.length).toBeGreaterThan(1);
      expect(food.verifiedBy).toBe('dietitian_approved');
      expect(food.brand).toBeDefined();
      expect(food.brandCategory).toBeDefined();
      expect(food.servings.length).toBeGreaterThan(0);
      expect(food.servings[0].kcal).toBeGreaterThanOrEqual(0);
    }
  });
});
