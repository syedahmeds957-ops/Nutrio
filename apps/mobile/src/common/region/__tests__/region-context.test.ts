import { describe, it, expect } from 'vitest';
import { detectRegionFromCountry, getCurrencyForRegion } from '../regionContext.js';
import { detectRegionFromDevice } from '../deviceRegion.js';

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

describe('Device region detection', () => {
  it('trusts the timezone over the display language', () => {
    expect(detectRegionFromDevice('Asia/Riyadh', ['en-US'])).toBe('SA');
    expect(detectRegionFromDevice('Asia/Karachi', ['ar-SA'])).toBe('PK');
  });

  it('falls back to the locale region, then to nothing', () => {
    expect(detectRegionFromDevice('Europe/London', ['en-GB', 'ar-SA'])).toBe('SA');
    expect(detectRegionFromDevice(undefined, ['ur_PK'])).toBe('PK');
    expect(detectRegionFromDevice('Europe/London', ['en-US'])).toBeNull();
  });
});
