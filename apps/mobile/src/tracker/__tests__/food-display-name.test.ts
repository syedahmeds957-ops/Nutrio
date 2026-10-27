import { describe, expect, it } from 'vitest';
import { foodDisplayName } from '../foodDisplayName.js';

describe('foodDisplayName', () => {
  it('puts the Arabic name first for Arabic readers', () => {
    expect(foodDisplayName('Chicken Kabsa', 'كبسة دجاج', true)).toEqual({
      primary: 'كبسة دجاج',
      secondary: 'Chicken Kabsa',
    });
  });

  it('shows English only when the reader is not Arabic', () => {
    expect(foodDisplayName('Chicken Kabsa', 'كبسة دجاج', false)).toEqual({
      primary: 'Chicken Kabsa',
    });
  });

  it('falls back to English when there is no Arabic name', () => {
    expect(foodDisplayName('Banana', undefined, true)).toEqual({ primary: 'Banana' });
  });
});
