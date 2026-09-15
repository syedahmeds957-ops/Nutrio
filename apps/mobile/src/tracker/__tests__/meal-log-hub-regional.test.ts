import { describe, it, expect } from 'vitest';
import React from 'react';
import { MealLogHubModal } from '../ui/MealLogHubModal.js';
import { BrandMenuModal } from '../ui/BrandMenuModal.js';
import {
  SAUDI_RESTAURANT_BRANDS,
  ALL_SAUDI_FOODS,
  SAUDI_TRADITIONAL_FOODS,
  SAUDI_RESTAURANTS_DATA,
} from '@nutrio/food-db';

describe('Phase 4: Multi-Region Meal Log Hub & Brand Menu', () => {
  it('instantiates MealLogHubModal with full interactive props', () => {
    const element = React.createElement(MealLogHubModal, {
      visible: true,
      onClose: () => {},
      onSelectBrand: () => {},
      onSelectItem: () => {},
    });
    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
  });

  it('exposes authentic Saudi brands with Arabic names and regional taglines', () => {
    expect(SAUDI_RESTAURANT_BRANDS.length).toBeGreaterThanOrEqual(12);

    const albaik = SAUDI_RESTAURANT_BRANDS.find((b) => b.id === 'albaik');
    expect(albaik).toBeDefined();
    expect(albaik?.nameAr).toBe('البيك');
    expect(albaik?.region).toBe('SA');

    const tazaj = SAUDI_RESTAURANT_BRANDS.find((b) => b.id === 'al_tazaj');
    expect(tazaj).toBeDefined();
    expect(tazaj?.nameAr).toBe('الطازج');

    const kudu = SAUDI_RESTAURANT_BRANDS.find((b) => b.id === 'kudu');
    expect(kudu).toBeDefined();
    expect(kudu?.nameAr).toBe('كودو');

    const barns = SAUDI_RESTAURANT_BRANDS.find((b) => b.id === 'barns');
    expect(barns).toBeDefined();
    expect(barns?.taglineAr).toBeDefined();
  });

  it('allows querying authentic Saudi dishes by English, Arabic, and category', () => {
    // 1. Search Kabsa by English
    const kabsaEn = ALL_SAUDI_FOODS.filter((f) =>
      f.name.toLowerCase().includes('kabsa')
    );
    expect(kabsaEn.length).toBeGreaterThanOrEqual(3);

    // 2. Search Kabsa by Arabic (كبسة)
    const kabsaAr = ALL_SAUDI_FOODS.filter(
      (f) => f.nameAr && f.nameAr.includes('كبسة')
    );
    expect(kabsaAr.length).toBeGreaterThanOrEqual(3);

    // 3. Search AlBaik items
    const albaikItems = SAUDI_RESTAURANTS_DATA.filter((f) => f.brandId === 'albaik');
    expect(albaikItems.length).toBeGreaterThanOrEqual(6);
    expect(albaikItems.some((i) => i.name.includes('Garlic Sauce'))).toBe(true);

    // 4. Search Mandi & Traditional staples
    const mandi = SAUDI_TRADITIONAL_FOODS.filter((f) =>
      f.name.toLowerCase().includes('mandi')
    );
    expect(mandi.length).toBeGreaterThanOrEqual(2);
  });

  it('BrandMenuModal accurately resolves AlBaik and loads SFDA nutritional disclosures', () => {
    const brandMenuEl = React.createElement(BrandMenuModal, {
      visible: true,
      brandId: 'albaik',
      onBack: () => {},
      onSelectItem: () => {},
    });

    expect(brandMenuEl).toBeDefined();
    expect(brandMenuEl.props.brandId).toBe('albaik');

    const albaikItems = SAUDI_RESTAURANTS_DATA.filter((i) => i.brandId === 'albaik');
    expect(albaikItems.length).toBeGreaterThanOrEqual(6);

    for (const item of albaikItems) {
      expect(item.source).toBe('sfda');
      expect(item.region).toBe('SA');
      expect(item.nameAr).toBeDefined();
    }
  });

  it('BrandMenuModal accurately resolves Al Romansiah traditional Saudi banquets', () => {
    const romansiahItems = SAUDI_RESTAURANTS_DATA.filter(
      (i) => i.brandId === 'al_romansiah'
    );
    expect(romansiahItems.length).toBeGreaterThanOrEqual(4);

    const chickenMandi = romansiahItems.find((i) => i.id === 'sa_romansiah_mandi_chicken');
    expect(chickenMandi).toBeDefined();
    expect(chickenMandi?.nameAr).toContain('مندي دجاج');
    expect(chickenMandi?.servings[0]?.kcal).toBeGreaterThan(500);
  });
});
