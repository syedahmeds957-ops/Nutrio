import { describe, expect, it } from 'vitest';
import { dishImageKey } from '../dishImage.js';

describe('dishImageKey', () => {
  it.each([
    ['Rice & Biryani', 'rice'],
    ['Rice & Meat', 'rice'],
    ['Gahwa & Drinks', 'drinks'],
    ['Beverages & Drinks', 'drinks'],
    ['Sweets & Desserts', 'desserts'],
    ['BBQ & Grills', 'bbq'],
    ['Nashta & Breakfast', 'breakfast'],
    ['Street Food & Chaat', 'breakfast'],
    ['Traditional Stews', 'stews'],
    ['Vegetables & Daal', 'stews'],
    ['Pakistani Fast Food', 'fast-food'],
  ])('%s -> %s', (category, key) => {
    expect(dishImageKey(category)).toBe(key);
  });

  it('gives generic buckets no photo, so they keep the plain row', () => {
    expect(dishImageKey('Diet & Basics')).toBeUndefined();
    expect(dishImageKey('Condiments')).toBeUndefined();
    expect(dishImageKey(undefined)).toBeUndefined();
  });
});
