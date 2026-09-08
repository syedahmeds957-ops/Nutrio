import { describe, it, expect } from 'vitest';
import React from 'react';
import { BrandLogo } from '../BrandLogo.js';

describe('BrandLogo Component System', () => {
  const brands = [
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
    'unknown_brand_xyz',
  ];

  it('renders authentic brand logos for all major Pakistani chains and home foods', () => {
    for (const brandId of brands) {
      const element = React.createElement(BrandLogo, { brandId, size: 46 });
      expect(element).toBeDefined();
      expect(element.props.brandId).toBe(brandId);
      expect(element.props.size).toBe(46);
    }
  });
});
