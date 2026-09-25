import { describe, expect, it } from 'vitest';
import { PRICING_TIERS } from '../types.js';
import {
  canPerformPhotoScan,
  consumePhotoScan,
  getRemainingScans,
  initializeQuotaState,
} from '../../vision/quota.js';

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

  it('provides 100% free unlimited photo scans without requiring payment', () => {
    // 1. Initial state is 100% free and unlimited
    const state = initializeQuotaState('2026-09-03');
    expect(state.isPaid).toBe(true);
    expect(state.maxFreeLimit).toBe(Infinity);
    expect(canPerformPhotoScan(state, '2026-09-03')).toBe(true);
    expect(getRemainingScans(state, '2026-09-03')).toBe(Infinity);

    // 2. Even after consuming scans, it remains unlimited
    const afterScan = consumePhotoScan(state, '2026-09-03');
    expect(canPerformPhotoScan(afterScan, '2026-09-03')).toBe(true);
    expect(getRemainingScans(afterScan, '2026-09-03')).toBe(Infinity);
  });
});
