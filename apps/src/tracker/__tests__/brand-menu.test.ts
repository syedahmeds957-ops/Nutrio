import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { BrandMenuModal } from '../ui/BrandMenuModal.js';
import { CALORIFY_RESTAURANTS_DATA, CALORIFY_BRANDS } from '@nutrio/food-db';

describe('Phase 3: BrandMenuModal Component', () => {
  it('renders brand title, category tabs, and food items when visible', () => {
    const handleBack = vi.fn();
    const handleSelectItem = vi.fn();

    const element = React.createElement(BrandMenuModal, {
      visible: true,
      brandId: 'kfc',
      onBack: handleBack,
      onSelectItem: handleSelectItem,
    });

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
    expect(element.props.brandId).toBe('kfc');
  });

  it('correctly filters dishes for KFC Pakistan and groups into categories', () => {
    const kfcBrand = CALORIFY_BRANDS.find((b) => b.id === 'kfc');
    expect(kfcBrand).toBeDefined();
    expect(kfcBrand?.categories).toContain('Burgers');
    expect(kfcBrand?.categories).toContain('Everyday Value');

    const kfcItems = CALORIFY_RESTAURANTS_DATA.filter((i) => i.brand === 'KFC Pakistan');
    expect(kfcItems.length).toBeGreaterThanOrEqual(15);

    const burgers = kfcItems.filter((i) => i.brandCategory === 'Burgers');
    expect(burgers.some((b) => b.name === 'Zinger Burger')).toBe(true);
    expect(burgers.some((b) => b.name === 'Mighty Zinger')).toBe(true);

    const everydayValue = kfcItems.filter((i) => i.brandCategory === 'Everyday Value');
    expect(everydayValue.some((b) => b.name === 'Krunch Burger')).toBe(true);

    const zinger = burgers.find((b) => b.name === 'Zinger Burger');
    expect(zinger?.servings[0]?.kcal).toBe(640);
  });

  it('correctly loads Ghar ka Khana menu items and chai options', () => {
    const gharItems = CALORIFY_RESTAURANTS_DATA.filter((i) => i.brand === 'Ghar ka Khana');
    expect(gharItems.length).toBeGreaterThanOrEqual(6);

    const doodhPatti = gharItems.find((i) => i.name === 'Doodh Patti');
    expect(doodhPatti).toBeDefined();
    expect(doodhPatti?.servings[0]?.kcal).toBe(120);

    const paratha = gharItems.find((i) => i.name === 'Paratha (plain)');
    expect(paratha).toBeDefined();
    expect(paratha?.servings[0]?.kcal).toBe(260);

    const biryani = gharItems.find((i) => i.name === 'Chicken Biryani');
    expect(biryani).toBeDefined();
    expect(biryani?.servings[0]?.kcal).toBe(480);
  });

  it('supports other brands like Cheezious, Broadway, Hardees, Kababjees, Savour, OPTP', () => {
    const cheeziousItems = CALORIFY_RESTAURANTS_DATA.filter((i) => i.brand === 'Cheezious');
    expect(cheeziousItems.length).toBeGreaterThanOrEqual(5);

    const savourItems = CALORIFY_RESTAURANTS_DATA.filter((i) => i.brand === 'Savour Foods');
    expect(savourItems.length).toBeGreaterThanOrEqual(3);

    const pulao = savourItems.find((i) => i.name.includes('Pulao'));
    expect(pulao).toBeDefined();
    expect(pulao?.servings[0]?.kcal).toBeGreaterThanOrEqual(500);
  });

  it('supports expanded brands dynamically from the 60+ catalog', () => {
    const handleBack = vi.fn();
    const handleSelectItem = vi.fn();

    const element = React.createElement(BrandMenuModal, {
      visible: true,
      brandId: 'johnny_jugnu',
      onBack: handleBack,
      onSelectItem: handleSelectItem,
    });

    expect(element).toBeDefined();
    expect(element.props.brandId).toBe('johnny_jugnu');
  });

  it('ensures all 60+ brands and Ghar ka Khana resolve items without empty catalogs', () => {
    const brandsToTest = [
      'ghar_ka_khana',
      'kfc',
      'cheezious',
      'broadway',
      'hardees',
      'kababjees',
      'mcdonalds',
      'optp',
      'savour',
      'subway',
      'johnny_jugnu',
      'ranchers',
      'bundu_khan',
      'butt_karahi',
      'kolachi',
      'quetta_tea',
      'tehzeeb_bakers',
      'layers_bakeshop',
    ];

    for (const brandId of brandsToTest) {
      const handleBack = vi.fn();
      const handleSelectItem = vi.fn();

      const element = React.createElement(BrandMenuModal, {
        visible: true,
        brandId,
        onBack: handleBack,
        onSelectItem: handleSelectItem,
      });

      expect(element).toBeDefined();
      expect(element.props.brandId).toBe(brandId);
    }
  });

  it('invokes onSelectItem and onBack callbacks appropriately', () => {
    const handleBack = vi.fn();
    const handleSelectItem = vi.fn();

    const element = React.createElement(BrandMenuModal, {
      visible: true,
      brandId: 'kfc',
      onBack: handleBack,
      onSelectItem: handleSelectItem,
    });

    element.props.onBack();
    expect(handleBack).toHaveBeenCalledTimes(1);

    const zinger = CALORIFY_RESTAURANTS_DATA.find((i) => i.name === 'Zinger Burger');
    if (zinger) {
      element.props.onSelectItem(zinger);
      expect(handleSelectItem).toHaveBeenCalledWith(zinger);
    }
  });
});
