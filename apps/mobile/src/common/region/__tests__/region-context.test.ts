import { describe, it, expect } from 'vitest';
import { detectRegionFromCountry, getCurrencyForRegion } from '../regionContext.js';

describe('Region Detection Logic', () => {
  it('maps SA and Gulf codes to SA region and SAR currency', () => {
    expect(detectRegionFromCountry('SA')).toBe('SA');
    expect(detectRegionFromCountry('sau')).toBe('SA');
    expect(detectRegionFromCountry('saudi arabia')).toBe('SA');
    expect(getCurrencyForRegion('SA')).toEqual({ code: 'SAR', symbol: 'ر.س' });
  });

  it('maps PK to PK region and PKR currency', () => {
    expect(detectRegionFromCountry('PK')).toBe('PK');
    expect(detectRegionFromCountry('pak')).toBe('PK');
    expect(detectRegionFromCountry('pakistan')).toBe('PK');
    expect(getCurrencyForRegion('PK')).toEqual({ code: 'PKR', symbol: 'Rs.' });
  });

  it('defaults unknown countries gracefully to PK while allowing manual override', () => {
    expect(detectRegionFromCountry('US')).toBe('PK');
    expect(detectRegionFromCountry('')).toBe('PK');
  });
});
