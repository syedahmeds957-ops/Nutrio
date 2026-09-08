import { describe, it, expect } from 'vitest';
import {
  ALL_EXPANDED_PAKISTANI_FOODS,
  PAKISTANI_RESTAURANT_BRANDS,
} from '../src/index.js';

describe('Pakistani Restaurant Catalog: 2,700+ Menu Items & 60+ Brands', () => {
  it('contains at least 2,700 total verified menu items', () => {
    expect(ALL_EXPANDED_PAKISTANI_FOODS.length).toBeGreaterThanOrEqual(2700);
  });

  it('contains at least 60 authentic Pakistani restaurant and cafe brands', () => {
    expect(PAKISTANI_RESTAURANT_BRANDS.length).toBeGreaterThanOrEqual(60);

    const brandNames = new Set(PAKISTANI_RESTAURANT_BRANDS.map((b) => b.name));
    // Fast Food
    expect(brandNames.has('KFC Pakistan')).toBe(true);
    expect(brandNames.has('McDonald\'s Pakistan')).toBe(true);
    expect(brandNames.has('Johnny & Jugnu')).toBe(true);
    expect(brandNames.has('Ranchers Cafe')).toBe(true);
    expect(brandNames.has('Daily Deli Co.')).toBe(true);
    expect(brandNames.has('Burger Lab')).toBe(true);

    // Pizza
    expect(brandNames.has('Broadway Pizza')).toBe(true);
    expect(brandNames.has('Domino\'s Pakistan')).toBe(true);
    expect(brandNames.has('Pizza Hut Pakistan')).toBe(true);
    expect(brandNames.has('14th Street Pizza Co.')).toBe(true);

    // Desi BBQ & Karahi
    expect(brandNames.has('Savour Foods')).toBe(true);
    expect(brandNames.has('Student Biryani')).toBe(true);
    expect(brandNames.has('Bundu Khan')).toBe(true);
    expect(brandNames.has('Butt Karahi (Lakshmi Chowk)')).toBe(true);
    expect(brandNames.has('Kolachi Restaurant (Do Darya)')).toBe(true);
    expect(brandNames.has('LalQila Restaurant')).toBe(true);
    expect(brandNames.has('BBQ Tonight')).toBe(true);

    // Chai & Cafes
    expect(brandNames.has('Quetta Chai Dhaba (Peshawar/Karachi)')).toBe(true);
    expect(brandNames.has('Chaaye Khana')).toBe(true);
    expect(brandNames.has('Gloria Jean\'s Coffees Pakistan')).toBe(true);
    expect(brandNames.has('Layers Bakeshop')).toBe(true);
    expect(brandNames.has('Tehzeeb Bakers')).toBe(true);

    // Asian & Continental
    expect(brandNames.has('Ginsoy Extreme Chinese')).toBe(true);
    expect(brandNames.has('Chop Chop Wok')).toBe(true);
    expect(brandNames.has('The Monal (Islamabad / Rawalpindi)')).toBe(true);
  });

  it('ensures 100% of the 2,700+ items have strictly unique IDs (no duplicates)', () => {
    const idSet = new Set<string>();
    const duplicateIds: string[] = [];

    for (const food of ALL_EXPANDED_PAKISTANI_FOODS) {
      if (!food.id) continue;
      if (idSet.has(food.id)) {
        duplicateIds.push(food.id);
      }
      idSet.add(food.id);
    }

    expect(duplicateIds).toEqual([]);
    expect(idSet.size).toBe(ALL_EXPANDED_PAKISTANI_FOODS.length);
  });

  it('enforces Atwater energy balance (P*4 + C*4 + F*9 = kcal +- 5) on all 2,700+ items', () => {
    for (const food of ALL_EXPANDED_PAKISTANI_FOODS) {
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

  it('ensures all items have bilingual Urdu name, valid serving portion, and dietitian approval', () => {
    for (const food of ALL_EXPANDED_PAKISTANI_FOODS) {
      expect(food.name.length).toBeGreaterThan(1);
      expect(food.nameUr).toBeDefined();
      expect(food.nameUr?.length).toBeGreaterThan(1);
      expect(food.verifiedBy).toBe('dietitian_approved');
      expect(food.servings.length).toBeGreaterThan(0);
      const servingKcal = food.servings[0].kcal ?? Math.round((food.kcal100g * food.servings[0].grams) / 100);
      expect(servingKcal).toBeGreaterThanOrEqual(0);
    }
  });
});
