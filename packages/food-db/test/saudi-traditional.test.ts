import { describe, it, expect } from 'vitest';
import { SAUDI_TRADITIONAL_FOODS } from '../src/data/saudi-traditional.data.js';

describe('Saudi Traditional Food Catalog (Task 2.1)', () => {
  it('contains at least 30 core authentic Saudi dishes with bilingual Arabic', () => {
    expect(SAUDI_TRADITIONAL_FOODS.length).toBeGreaterThanOrEqual(30);
    const kabsa = SAUDI_TRADITIONAL_FOODS.find((f) => f.name.includes('Kabsa'));
    expect(kabsa).toBeDefined();
    expect(kabsa?.nameAr).toBeDefined();
    expect(kabsa?.region).toBe('SA');
  });

  it('enforces Atwater energy balance (P*4 + C*4 + F*9 = kcal +- 6) on all items', () => {
    for (const food of SAUDI_TRADITIONAL_FOODS) {
      const calcKcal = food.protein100g * 4 + food.carb100g * 4 + food.fat100g * 9;
      expect(
        Math.abs(calcKcal - food.kcal100g),
        `${food.id} (${food.name}): calc ${calcKcal} vs declared ${food.kcal100g}`
      ).toBeLessThanOrEqual(6);
    }
  });

  it('includes authentic Saudi regional staples: Gahwa, Sukari Dates, and Mutabbaq', () => {
    const gahwa = SAUDI_TRADITIONAL_FOODS.find((f) => f.name.toLowerCase().includes('gahwa'));
    const dates = SAUDI_TRADITIONAL_FOODS.find(
      (f) => f.name.toLowerCase().includes('date') || f.name.toLowerCase().includes('sukari')
    );
    const mutabbaq = SAUDI_TRADITIONAL_FOODS.find((f) => f.name.toLowerCase().includes('mutabbaq'));
    const saleeg = SAUDI_TRADITIONAL_FOODS.find((f) => f.name.toLowerCase().includes('saleeg'));
    const jareesh = SAUDI_TRADITIONAL_FOODS.find((f) => f.name.toLowerCase().includes('jareesh'));
    const masoub = SAUDI_TRADITIONAL_FOODS.find((f) => f.name.toLowerCase().includes('masoub') || f.name.toLowerCase().includes("ma'soub"));

    expect(gahwa).toBeDefined();
    expect(dates).toBeDefined();
    expect(mutabbaq).toBeDefined();
    expect(saleeg).toBeDefined();
    expect(jareesh).toBeDefined();
    expect(masoub).toBeDefined();
  });
});
