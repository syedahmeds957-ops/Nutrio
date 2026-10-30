import { describe, it, expect } from 'vitest';
import { looksLikeMealDescription } from '../looksLikeMealDescription.js';

describe('looksLikeMealDescription', () => {
  it.each([
    '2 rotis and daal',
    '2 roti aur daal',
    'eggs with toast',
    'roti, daal',
    'chai + biscuit',
    'rice & chicken',
    'breakfast: eggs',
    'lunch - daal chawal',
    'i had a roti',
    'ate two eggs',
    '200g chicken',
    '1.5 cups rice',
    '½ avocado',
    '3x eggs',
    'two eggs',
    'كبسة مع سلطة',
    'خبز و سلطة',
    '٢ خبز',
    'فطور: بيض',
  ])('reads %j as a meal description', (text) => {
    expect(looksLikeMealDescription(text)).toBe(true);
  });

  it.each([
    'biryani',
    'chicken karahi',
    'daal chawal',
    'zinger burger',
    'seekh kebab roll',
    '7up',
    'breakfast',
    'two',
    'كبسة',
    'كبسة دجاج',
  ])('reads %j as one dish', (text) => {
    expect(looksLikeMealDescription(text)).toBe(false);
  });

  it('is false for empty or whitespace-only text', () => {
    expect(looksLikeMealDescription('')).toBe(false);
    expect(looksLikeMealDescription('   \n ')).toBe(false);
  });

  it('is false while a joiner has nothing on one side yet', () => {
    expect(looksLikeMealDescription('daal and')).toBe(false);
    expect(looksLikeMealDescription('and')).toBe(false);
    expect(looksLikeMealDescription('daal,')).toBe(false);
  });

  it('does not take a joiner inside a word for a joiner', () => {
    expect(looksLikeMealDescription('sandwich')).toBe(false);
    expect(looksLikeMealDescription('candy bar')).toBe(false);
    expect(looksLikeMealDescription('android')).toBe(false);
  });

  it('offers the card for dishes named with "and", which the results still cover', () => {
    // Pinned on purpose: a wrong offer costs one extra row, a missed one hides the feature.
    expect(looksLikeMealDescription('fish and chips')).toBe(true);
    expect(looksLikeMealDescription('mac and cheese')).toBe(true);
  });

  it('ignores case and surrounding spaces', () => {
    expect(looksLikeMealDescription('  2 ROTIS And Daal  ')).toBe(true);
  });
});
