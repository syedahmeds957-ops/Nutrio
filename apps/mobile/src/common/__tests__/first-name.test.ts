import { describe, expect, it } from 'vitest';
import { firstName } from '../firstName.js';

describe('firstName', () => {
  it('takes the first word of a full name', () => {
    expect(firstName('Talha Bhatti')).toBe('Talha');
    expect(firstName('  Ayesha   Khan  ')).toBe('Ayesha');
  });

  it('keeps a single name and handles Arabic', () => {
    expect(firstName('Talha')).toBe('Talha');
    expect(firstName('محمد العتيبي')).toBe('محمد');
  });

  it('returns undefined when there is no name', () => {
    expect(firstName('')).toBeUndefined();
    expect(firstName('   ')).toBeUndefined();
    expect(firstName(undefined)).toBeUndefined();
  });
});
