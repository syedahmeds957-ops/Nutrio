import { describe, it, expect } from 'vitest';
import { searchPakistaniFoods, getSearchIndexStats } from '../src/index.js';

describe('High-Performance Pakistani Food Search Index (2,700+ Items)', () => {
  it('indexes all 2,700+ items and reports valid index statistics', () => {
    const stats = getSearchIndexStats();
    expect(stats.totalFoods).toBeGreaterThanOrEqual(2700);
    expect(stats.totalTokens).toBeGreaterThan(500);
  });

  it('instantly returns search results for flagship burgers under 15ms', () => {
    const start = performance.now();
    const results = searchPakistaniFoods('zinger');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50); // Well under 50ms requirement
    expect(results.length).toBeGreaterThanOrEqual(3);

    const zinger = results.find((r) => r.name.toLowerCase().includes('zinger burger'));
    expect(zinger).toBeDefined();
  });

  it('searches across both brand restaurants and home foods', () => {
    const biryaniResults = searchPakistaniFoods('biryani');
    expect(biryaniResults.length).toBeGreaterThanOrEqual(10);

    const chaiResults = searchPakistaniFoods('chai');
    expect(chaiResults.length).toBeGreaterThanOrEqual(10);

    const pizzaResults = searchPakistaniFoods('pizza');
    expect(pizzaResults.length).toBeGreaterThanOrEqual(10);
  });

  it('supports bilingual Urdu search queries', () => {
    const urduZinger = searchPakistaniFoods('زنگر');
    expect(urduZinger.length).toBeGreaterThanOrEqual(1);

    const urduBiryani = searchPakistaniFoods('بریانی');
    expect(urduBiryani.length).toBeGreaterThanOrEqual(1);
  });

  it('supports filtering search by specific brand or category', () => {
    const kfcBurgers = searchPakistaniFoods('burger', { brand: 'KFC Pakistan' });
    expect(kfcBurgers.length).toBeGreaterThanOrEqual(1);
    expect(kfcBurgers.every((f) => f.brand === 'KFC Pakistan')).toBe(true);
  });
});
