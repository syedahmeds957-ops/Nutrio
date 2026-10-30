import { describe, it, expect } from 'vitest';
import React from 'react';
import { BrandLogo } from '../BrandLogo.js';

describe('BrandLogo Component System', () => {
  const pakistaniBrands = [
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
    'dominos',
    'pizza_hut',
    'johnny_jugnu',
    'ranchers',
    'student_biryani',
    'chaaye_khana',
    'bundu_khan',
  ];

  const saudiBrands = [
    'albaik',
    'kudu',
    'al_tazaj',
    'shawarmer',
    'herfy',
    'al_romansiah',
    'mama_noura',
    'maestro_pizza',
    'hamburgini',
    'bait_al_shawarma',
    'barns',
    'half_million',
  ];

  it('renders authentic brand logos for all major Pakistani chains and home foods', () => {
    for (const brandId of pakistaniBrands) {
      const element = BrandLogo({ brandId, size: 46 }) as React.ReactElement<any>;
      expect(element).toBeDefined();
      // Should not be the fallback grey container
      const flatStyle = Array.isArray(element?.props?.style)
        ? Object.assign({}, ...element.props.style)
        : element?.props?.style;
      expect(flatStyle?.backgroundColor).not.toBe('#1F2937');
    }
  });

  it('renders dedicated distinctive vector logos for all 12 Saudi restaurant & cafe chains', () => {
    for (const brandId of saudiBrands) {
      const element = BrandLogo({ brandId, size: 46 }) as React.ReactElement<any>;
      expect(element).toBeDefined();

      const flatStyle = Array.isArray(element?.props?.style)
        ? Object.assign({}, ...element.props.style)
        : element?.props?.style;

      // Verify each brand does not fall back to generic fallback (#1F2937)
      expect(
        flatStyle?.backgroundColor,
        `Brand ${brandId} should have a custom background color`
      ).not.toBe('#1F2937');
    }
  });

  it('verifies signature Saudi brand identities and color schemes', () => {
    // AlBaik signature red
    const albaik = BrandLogo({ brandId: 'albaik', size: 46 }) as React.ReactElement<any>;
    const albaikStyle = Object.assign({}, ...(albaik?.props?.style || []));
    expect(albaikStyle.backgroundColor).toBe('#D62300');

    // Al Tazaj fresh charcoal green
    const tazaj = BrandLogo({ brandId: 'al_tazaj', size: 46 }) as React.ReactElement<any>;
    const tazajStyle = Object.assign({}, ...(tazaj?.props?.style || []));
    expect(tazajStyle.backgroundColor).toBe('#00843D');

    // Kudu vibrant orange
    const kudu = BrandLogo({ brandId: 'kudu', size: 46 }) as React.ReactElement<any>;
    const kuduStyle = Object.assign({}, ...(kudu?.props?.style || []));
    expect(kuduStyle.backgroundColor).toBe('#F48220');

    // Barn's rich coffee brown
    const barns = BrandLogo({ brandId: 'barns', size: 46 }) as React.ReactElement<any>;
    const barnsStyle = Object.assign({}, ...(barns?.props?.style || []));
    expect(barnsStyle.backgroundColor).toBe('#4E342E');

    // Half Million luxury obsidian black
    const halfMillion = BrandLogo({ brandId: 'half_million', size: 46 }) as React.ReactElement<any>;
    const halfMillionStyle = Object.assign({}, ...(halfMillion?.props?.style || []));
    expect(halfMillionStyle.backgroundColor).toBe('#111827');
  });

  it('falls back to elegant monogram for unknown brands', () => {
    const fallback = BrandLogo({ brandId: 'random_unknown_place', size: 46 }) as React.ReactElement<any>;
    const fallbackStyle = Object.assign({}, ...(fallback?.props?.style || []));
    expect(fallbackStyle.backgroundColor).toBe('#1F2937');
  });
});
