import { describe, expect, it } from 'vitest';
import { PRICING_TIERS } from '../types.js';

describe('Monetisation & Localized Paywall Gate (Task 4.6)', () => {
  it('defines Pakistan-first localized PKR pricing tiers with annual savings', () => {
    const pkr = PRICING_TIERS.PKR;
    expect(pkr.monthly.priceAmount).toBe(999);
    expect(pkr.annual.priceAmount).toBe(6999);
    expect(pkr.annual.savingsNote).toContain('42%');
    expect(pkr.annual.displayPrice).toContain('PKR');
  });

  it('defines international USD pricing tiers for global / diaspora market', () => {
    const usd = PRICING_TIERS.USD;
    expect(usd.monthly.priceAmount).toBe(6.99);
    expect(usd.annual.priceAmount).toBe(49.99);
    expect(usd.annual.savingsNote).toContain('40%');
  });

});
