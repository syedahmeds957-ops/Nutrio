import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MealLogHubModal } from '../ui/MealLogHubModal.js';
import { CALORIFY_BRANDS, ALL_EXPANDED_PAKISTANI_FOODS } from '@nutrio/food-db';

describe('Phase 2: MealLogHubModal Component', () => {
  it('renders all Calorify restaurant brands when visible', () => {
    const handleClose = vi.fn();
    const handleSelectBrand = vi.fn();
    const handleSelectItem = vi.fn();

    const element = React.createElement(MealLogHubModal, {
      visible: true,
      onClose: handleClose,
      onSelectBrand: handleSelectBrand,
      onSelectItem: handleSelectItem,
    });

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
    expect(element.props.onClose).toBe(handleClose);
    expect(element.props.onSelectBrand).toBe(handleSelectBrand);
    expect(element.props.onSelectItem).toBe(handleSelectItem);
    expect(CALORIFY_BRANDS.length).toBeGreaterThanOrEqual(10);
  });

  it('exposes all 10 key Pakistani brands with expected item counts and IDs', () => {
    const brandIds = CALORIFY_BRANDS.map((b) => b.id);
    expect(brandIds).toContain('ghar_ka_khana');
    expect(brandIds).toContain('kfc');
    expect(brandIds).toContain('cheezious');
    expect(brandIds).toContain('broadway');
    expect(brandIds).toContain('hardees');
    expect(brandIds).toContain('kababjees');
    expect(brandIds).toContain('mcdonalds');
    expect(brandIds).toContain('optp');
    expect(brandIds).toContain('savour');
    expect(brandIds).toContain('subway');

    const ghar = CALORIFY_BRANDS.find((b) => b.id === 'ghar_ka_khana');
    expect(ghar?.tagline).toContain('191 home foods');

    const kfc = CALORIFY_BRANDS.find((b) => b.id === 'kfc');
    expect(kfc?.name).toBe('KFC Pakistan');
    expect(kfc?.tagline).toContain('25 items');

    const optp = CALORIFY_BRANDS.find((b) => b.id === 'optp');
    expect(optp?.name).toBe('OPTP');
    expect(optp?.tagline).toContain('24 items');

    const savour = CALORIFY_BRANDS.find((b) => b.id === 'savour');
    expect(savour?.name).toBe('Savour Foods');
    expect(savour?.tagline).toContain('12 items');
  });

  it('can search items across Pakistani brands and staples', () => {
    const q = 'zinger';
    const matches = ALL_EXPANDED_PAKISTANI_FOODS.filter((f) =>
      f.name.toLowerCase().includes(q)
    );
    expect(matches.length).toBeGreaterThanOrEqual(3);

    const zinger = matches.find((m) => m.name === 'Zinger Burger');
    expect(zinger).toBeDefined();
    expect(zinger?.brand).toBe('KFC Pakistan');
    expect(zinger?.servings[0]?.kcal).toBe(640);
  });

  it('can search home foods like Biryani and Chai', () => {
    const biryaniMatches = ALL_EXPANDED_PAKISTANI_FOODS.filter((f) =>
      f.name.toLowerCase().includes('biryani')
    );
    expect(biryaniMatches.length).toBeGreaterThanOrEqual(1);

    const chaiMatches = ALL_EXPANDED_PAKISTANI_FOODS.filter((f) =>
      f.name.toLowerCase().includes('chai')
    );
    expect(chaiMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('can invoke callbacks for brand selection and modal close', () => {
    const handleClose = vi.fn();
    const handleSelectBrand = vi.fn();
    const handleSelectItem = vi.fn();

    const element = React.createElement(MealLogHubModal, {
      visible: true,
      onClose: handleClose,
      onSelectBrand: handleSelectBrand,
      onSelectItem: handleSelectItem,
    });

    element.props.onSelectBrand('kfc');
    expect(handleSelectBrand).toHaveBeenCalledWith('kfc');

    element.props.onClose();
    expect(handleClose).toHaveBeenCalledTimes(1);

    const sampleFood = ALL_EXPANDED_PAKISTANI_FOODS[0];
    element.props.onSelectItem(sampleFood);
    expect(handleSelectItem).toHaveBeenCalledWith(sampleFood);
  });
});
