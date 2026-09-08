import { describe, it, expect } from 'vitest';
import {
  DishCustomizationType,
  DISH_MODIFIER_TEMPLATES,
  resolveDishCustomization,
  getDishCustomizationModifiers,
  NormalizedFood,
} from '../src/index.js';

describe('Dish Customization Taxonomy Engine', () => {
  describe('Atwater Energy Factor & Macro Consistency', () => {
    it('verifies all modifier macros strictly adhere to Atwater energy factors (kcal = 4P + 4C + 9F +- 5)', () => {
      for (const [category, modifiers] of Object.entries(DISH_MODIFIER_TEMPLATES)) {
        for (const mod of modifiers) {
          const p = mod.proteinGrams || 0;
          const c = mod.carbGrams || 0;
          const f = mod.fatGrams || 0;
          const calculatedKcal = 4 * p + 4 * c + 9 * f;

          const diff = Math.abs(mod.calories - calculatedKcal);
          expect(
            diff,
            `Modifier ${mod.id} in ${category} exceeds Atwater delta: stated=${mod.calories}, calculated=${calculatedKcal}`
          ).toBeLessThanOrEqual(5);
        }
      }
    });

    it('verifies all modifiers contain bilingual English and Urdu text', () => {
      for (const [category, modifiers] of Object.entries(DISH_MODIFIER_TEMPLATES)) {
        for (const mod of modifiers) {
          expect(mod.name.trim().length, `Modifier ${mod.id} missing English name`).toBeGreaterThan(0);
          expect(mod.nameUr?.trim().length, `Modifier ${mod.id} missing Urdu nameUr`).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Cafe Aylanto Dish Categorization (Bug Regression Fixes)', () => {
    it('accurately resolves Warm Dark Chocolate Tart to WESTERN_DESSERTS (not steaks, not tea)', () => {
      const food: NormalizedFood = {
        name: 'Warm Dark Chocolate Tart with Cream',
        brand: 'Cafe Aylanto',
        brandCategory: 'Artisan Desserts',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto', 'Pakistani'],
        kcal100g: 284,
        protein100g: 4,
        carb100g: 28,
        fat100g: 17.3,
        fibre100g: 1.5,
        sugar100g: 2,
        sodiumMg100g: 450,
        satFat100g: 6.1,
        oilAddedG: 7,
        source: 'pak_custom',
        servings: [{ label: '1 slice (150g)', grams: 150, isDefault: true }],
      };

      const type = resolveDishCustomization(food);
      expect(type).toBe(DishCustomizationType.WESTERN_DESSERTS);

      const mods = getDishCustomizationModifiers(food);
      expect(mods.length).toBeGreaterThan(0);
      expect(mods.some((m) => m.name.includes('Gelato'))).toBe(true);
      expect(mods.some((m) => m.name.includes('Chocolate Drizzle'))).toBe(true);
      expect(mods.some((m) => m.name.toLowerCase().includes('steak'))).toBe(false);
      expect(mods.some((m) => m.name.toLowerCase().includes('sugar'))).toBe(false);
    });

    it('accurately resolves Classic Creme Brulee to WESTERN_DESSERTS', () => {
      const food: NormalizedFood = {
        name: 'Classic Creme Brulee with Caramelized Crust',
        brand: 'Cafe Aylanto',
        brandCategory: 'Artisan Desserts',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto'],
        kcal100g: 235,
        protein100g: 3.6,
        carb100g: 22.9,
        fat100g: 14.3,
        fibre100g: 1.5,
        sugar100g: 2,
        sodiumMg100g: 450,
        satFat100g: 5,
        oilAddedG: 6,
        source: 'pak_custom',
        servings: [{ label: '1 cup', grams: 140, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.WESTERN_DESSERTS);
    });

    it('accurately resolves Mediterranean Salad to SALADS', () => {
      const food: NormalizedFood = {
        name: 'Aylanto Mediterranean Salad with Feta',
        brand: 'Cafe Aylanto',
        brandCategory: 'Salads & Appetizers',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto'],
        kcal100g: 95,
        protein100g: 3.5,
        carb100g: 5,
        fat100g: 7,
        fibre100g: 2,
        sugar100g: 2,
        sodiumMg100g: 400,
        satFat100g: 2,
        oilAddedG: 3,
        source: 'pak_custom',
        servings: [{ label: '1 bowl', grams: 220, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.SALADS);
      const mods = getDishCustomizationModifiers(food);
      expect(mods.some((m) => m.name.includes('Feta'))).toBe(true);
      expect(mods.some((m) => m.name.includes('Croutons'))).toBe(true);
    });

    it('accurately resolves Chicken with Roasted Garlic & Herb Jus to STEAKS_ENTREES (no tea or chai)', () => {
      const food: NormalizedFood = {
        name: 'Chicken with Roasted Garlic & Herb Jus',
        brand: 'Cafe Aylanto',
        brandCategory: 'Gourmet Steaks & Mains',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto'],
        kcal100g: 145,
        protein100g: 18,
        carb100g: 4,
        fat100g: 6,
        fibre100g: 1,
        sugar100g: 1,
        sodiumMg100g: 480,
        satFat100g: 2,
        oilAddedG: 3,
        source: 'pak_custom',
        servings: [{ label: '1 platter', grams: 350, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.STEAKS_ENTREES);
      const mods = getDishCustomizationModifiers(food);
      expect(mods.some((m) => m.name.includes('Peppercorn / Mushroom Jus'))).toBe(true);
      expect(mods.some((m) => m.name.includes('Mashed Potatoes'))).toBe(true);
      expect(mods.some((m) => m.name.toLowerCase().includes('sugar'))).toBe(false);
      expect(mods.some((m) => m.name.toLowerCase().includes('malai'))).toBe(false);
    });

    it('accurately resolves Prawn Linguine to PASTA_ITALIAN', () => {
      const food: NormalizedFood = {
        name: 'Prawn Linguine in Aglio Olio',
        brand: 'Cafe Aylanto',
        brandCategory: 'Pastas & Italian',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto'],
        kcal100g: 160,
        protein100g: 8,
        carb100g: 22,
        fat100g: 4.5,
        fibre100g: 1.5,
        sugar100g: 1.5,
        sodiumMg100g: 420,
        satFat100g: 1.2,
        oilAddedG: 3,
        source: 'pak_custom',
        servings: [{ label: '1 plate', grams: 320, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.PASTA_ITALIAN);
      const mods = getDishCustomizationModifiers(food);
      expect(mods.some((m) => m.name.includes('Parmesan'))).toBe(true);
      expect(mods.some((m) => m.name.includes('Garlic Baguette'))).toBe(true);
    });

    it('accurately resolves Pan Seared Red Snapper to SEAFOOD_MAINS', () => {
      const food: NormalizedFood = {
        name: 'Pan Seared Red Snapper with Citrus Butter',
        brand: 'Cafe Aylanto',
        brandCategory: 'Gourmet Steaks & Mains',
        category: 'Pakistani Fast Food',
        cuisineTags: ['Asian & Continental', 'Cafe Aylanto'],
        kcal100g: 130,
        protein100g: 19,
        carb100g: 2,
        fat100g: 5,
        fibre100g: 0.5,
        sugar100g: 1,
        sodiumMg100g: 400,
        satFat100g: 2,
        oilAddedG: 3,
        source: 'pak_custom',
        servings: [{ label: '1 fillet', grams: 280, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.SEAFOOD_MAINS);
      const mods = getDishCustomizationModifiers(food);
      expect(mods.some((m) => m.name.includes('Lemon Herb Butter'))).toBe(true);
    });
  });

  describe('Traditional Pakistani Brands Customization', () => {
    it('accurately resolves Student Biryani to BIRYANI_RICE with aloo and shami kabab', () => {
      const food: NormalizedFood = {
        name: 'Special Chicken Biryani with Potato',
        brand: 'Student Biryani',
        brandCategory: 'Biryani & Rice Platters',
        category: 'Rice & Biryani',
        cuisineTags: ['Pakistani', 'Student Biryani'],
        kcal100g: 165,
        protein100g: 8.5,
        carb100g: 22,
        fat100g: 4.8,
        fibre100g: 1.2,
        sugar100g: 1,
        sodiumMg100g: 480,
        satFat100g: 1.5,
        oilAddedG: 3,
        source: 'pak_custom',
        servings: [{ label: '1 plate', grams: 350, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.BIRYANI_RICE);
      const mods = getDishCustomizationModifiers(food);
      expect(mods.some((m) => m.name.includes('Potato (Aloo'))).toBe(true);
      expect(mods.some((m) => m.name.includes('Shami Kabab'))).toBe(true);
      expect(mods.some((m) => m.name.toLowerCase().includes('nalli'))).toBe(false);
    });

    it('accurately resolves Javed Nihari to NIHARI_PAYE with nalli and maghaz', () => {
      const food: NormalizedFood = {
        name: 'Special Nalli Nihari',
        brand: 'Javed Nihari',
        brandCategory: 'Traditional Nihari & Paye',
        category: 'Slow-Cooked Curries',
        cuisineTags: ['Pakistani', 'Javed Nihari'],
        kcal100g: 185,
        protein100g: 14,
        carb100g: 3,
        fat100g: 13,
        fibre100g: 0.5,
        sugar100g: 1,
        sodiumMg100g: 520,
        satFat100g: 5,
        oilAddedG: 5,
        source: 'pak_custom',
        servings: [{ label: '1 bowl', grams: 380, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.NIHARI_PAYE);
      const mods = getDishCustomizationModifiers(food);
      expect(mods.some((m) => m.name.includes('Nalli'))).toBe(true);
      expect(mods.some((m) => m.name.includes('Maghaz'))).toBe(true);
      expect(mods.some((m) => m.name.toLowerCase().includes('parmesan'))).toBe(false);
    });
  });

  describe('Non-Customizable Packaged Items (Hide "Make it yours")', () => {
    it('accurately routes Coca Cola 330ml Can to NONE_NON_CUSTOMIZABLE and returns empty modifier array', () => {
      const food: NormalizedFood = {
        name: 'Coca Cola 330ml Can',
        brand: 'Coca Cola',
        brandCategory: 'Beverages',
        category: 'Packaged Drinks',
        cuisineTags: ['Beverages'],
        kcal100g: 42,
        protein100g: 0,
        carb100g: 10.6,
        fat100g: 0,
        fibre100g: 0,
        sugar100g: 10.6,
        sodiumMg100g: 10,
        satFat100g: 0,
        oilAddedG: 0,
        source: 'pak_custom',
        servings: [{ label: '1 can (330ml)', grams: 330, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.NONE_NON_CUSTOMIZABLE);
      const mods = getDishCustomizationModifiers(food);
      expect(mods).toEqual([]);
    });

    it('accurately routes Mineral Water 500ml Bottle to NONE_NON_CUSTOMIZABLE and returns empty modifier array', () => {
      const food: NormalizedFood = {
        name: 'Nestle Pure Life Mineral Water 500ml',
        brand: 'Nestle',
        brandCategory: 'Beverages',
        category: 'Packaged Drinks',
        cuisineTags: ['Beverages'],
        kcal100g: 0,
        protein100g: 0,
        carb100g: 0,
        fat100g: 0,
        fibre100g: 0,
        sugar100g: 0,
        sodiumMg100g: 5,
        satFat100g: 0,
        oilAddedG: 0,
        source: 'pak_custom',
        servings: [{ label: '1 bottle (500ml)', grams: 500, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.NONE_NON_CUSTOMIZABLE);
      expect(getDishCustomizationModifiers(food)).toEqual([]);
    });

    it('accurately routes single dip sauce cup to NONE_NON_CUSTOMIZABLE and returns empty modifier array', () => {
      const food: NormalizedFood = {
        name: 'Mint Chutney Single Dip Cup',
        brand: 'Cheezious',
        brandCategory: 'Sides & Dips',
        category: 'Condiments',
        cuisineTags: ['Cheezious'],
        kcal100g: 45,
        protein100g: 1,
        carb100g: 4,
        fat100g: 2.5,
        fibre100g: 0.5,
        sugar100g: 1,
        sodiumMg100g: 250,
        satFat100g: 0.5,
        oilAddedG: 0,
        source: 'pak_custom',
        servings: [{ label: '1 dip cup (30g)', grams: 30, isDefault: true }],
      };

      expect(resolveDishCustomization(food)).toBe(DishCustomizationType.NONE_NON_CUSTOMIZABLE);
      expect(getDishCustomizationModifiers(food)).toEqual([]);
    });
  });
});
