import { describe, expect, it } from 'vitest';
import { foodDisplayName } from '../foodDisplayName.js';

describe('foodDisplayName', () => {
  it('shows only the Arabic name in Arabic (Saudi Arabia)', () => {
    expect(foodDisplayName('Chicken Kabsa', 'كبسة دجاج', true)).toEqual({ primary: 'كبسة دجاج' });
  });

  it('shows only the English name otherwise (Pakistan), never Arabic', () => {
    expect(foodDisplayName('Chicken Kabsa', 'كبسة دجاج', false)).toEqual({ primary: 'Chicken Kabsa' });
  });

  it('falls back to English when there is no Arabic name', () => {
    expect(foodDisplayName('Banana', undefined, true)).toEqual({ primary: 'Banana' });
  });
});
