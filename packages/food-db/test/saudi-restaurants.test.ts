import { describe, it, expect } from 'vitest';
import {
  SAUDI_RESTAURANT_BRANDS,
  SAUDI_RESTAURANTS_DATA,
} from '../src/data/saudi-restaurants.data.js';

describe('Saudi Restaurant Chains Catalog (Task 2.2)', () => {
  it('contains at least 12 major Saudi restaurant and cafe brands', () => {
    expect(SAUDI_RESTAURANT_BRANDS.length).toBeGreaterThanOrEqual(12);

    const brandIds = SAUDI_RESTAURANT_BRANDS.map((b) => b.id);
    expect(brandIds).toContain('albaik');
    expect(brandIds).toContain('kudu');
    expect(brandIds).toContain('al_tazaj');
    expect(brandIds).toContain('shawarmer');
    expect(brandIds).toContain('herfy');
    expect(brandIds).toContain('al_romansiah');
    expect(brandIds).toContain('mama_noura');
    expect(brandIds).toContain('maestro_pizza');
    expect(brandIds).toContain('hamburgini');
    expect(brandIds).toContain('bait_al_shawarma');
    expect(brandIds).toContain('barns');
    expect(brandIds).toContain('half_million');
  });

  it('all brands have bilingual Arabic names and region SA', () => {
    for (const brand of SAUDI_RESTAURANT_BRANDS) {
      expect(brand.region).toBe('SA');
      expect(brand.nameAr).toBeDefined();
      expect(brand.nameAr?.length).toBeGreaterThan(0);
      expect(brand.category).toBeDefined();
    }
  });

  it('contains at least 45 verified menu items across the 12 brands', () => {
    expect(SAUDI_RESTAURANTS_DATA.length).toBeGreaterThanOrEqual(45);
  });

  it('all restaurant menu items have Arabic names, region SA, and SFDA source', () => {
    for (const item of SAUDI_RESTAURANTS_DATA) {
      expect(item.region).toBe('SA');
      expect(item.nameAr).toBeDefined();
      expect(item.source).toBe('sfda');
      expect(item.brandId).toBeDefined();
    }
  });

  it('verifies Atwater energy balance (P*4 + C*4 + F*9 = kcal +- 6) on all restaurant items', () => {
    for (const item of SAUDI_RESTAURANTS_DATA) {
      const calcKcal = item.protein100g * 4 + item.carb100g * 4 + item.fat100g * 9;
      expect(
        Math.abs(calcKcal - item.kcal100g),
        `${item.id} (${item.name}): calc ${calcKcal} vs declared ${item.kcal100g}`
      ).toBeLessThanOrEqual(6);
    }
  });

  it('contains key iconic items: AlBaik Garlic Sauce, Kudu Meal, Farrouj Tazaj, Shawarmer Arabo', () => {
    const garlicSauce = SAUDI_RESTAURANTS_DATA.find((i) => i.id === 'sa_albaik_garlic_sauce');
    expect(garlicSauce).toBeDefined();
    expect(garlicSauce?.nameAr).toContain('ثوم');

    const kuduMeal = SAUDI_RESTAURANTS_DATA.find((i) => i.id === 'sa_kudu_chicken_sandwich');
    expect(kuduMeal).toBeDefined();

    const farrouj = SAUDI_RESTAURANTS_DATA.find((i) => i.id === 'sa_tazaj_farrouj_meal');
    expect(farrouj).toBeDefined();

    const arabo = SAUDI_RESTAURANTS_DATA.find((i) => i.id === 'sa_shawarmer_arabo');
    expect(arabo).toBeDefined();
  });
});
