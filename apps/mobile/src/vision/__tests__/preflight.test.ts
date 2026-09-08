import { describe, expect, it } from 'vitest';
import {
  computeImageHash,
  PerceptualVisionCache,
  validateImageQuality,
} from '../preflight.js';
import {
  canPerformPhotoScan,
  consumePhotoScan,
  getRemainingScans,
  initializeQuotaState,
} from '../quota.js';

describe('Vision Preflight Quality Gate & Caching (Task 3.4)', () => {
  it('rejects corrupt or too-small image data', () => {
    const res = validateImageQuality('data:image/jpeg;base64,ABC');
    expect(res.passed).toBe(false);
    expect(res.reason).toBe('too_small');
  });

  it('rejects pitch black uniform image data', () => {
    const pitchBlack = 'data:image/jpeg;base64,' + 'A'.repeat(200);
    const res = validateImageQuality(pitchBlack);
    expect(res.passed).toBe(false);
    expect(res.reason).toBe('too_dark');
  });

  it('generates consistent perceptual hash and supports cache hit retrieval', () => {
    const realisticBase64 =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const res = validateImageQuality(realisticBase64);
    expect(res.passed).toBe(true);
    expect(res.perceptualHash).toBeDefined();

    const hash1 = computeImageHash(realisticBase64);
    const hash2 = computeImageHash(realisticBase64);
    expect(hash1).toBe(hash2);

    const cache = new PerceptualVisionCache(10);
    cache.set({
      hash: hash1,
      dishDetected: 'Chicken Karahi',
      cookingMethod: 'Desi wok',
      resolution: {
        totalCalories: 450,
        calorieBand: { min: 400, max: 500, displayEstimate: '~450 kcal' },
        totalProteinGrams: 35,
        totalFatGrams: 20,
        totalCarbGrams: 15,
        totalFibreGrams: 2,
        totalOilAddedG: 18,
        confidence: 'high',
        items: [],
      },
      cachedAt: new Date().toISOString(),
    });

    const cached = cache.get(hash1);
    expect(cached).toBeDefined();
    expect(cached?.dishDetected).toBe('Chicken Karahi');
  });

  it('enforces 3 scans/day free-tier quota and resets on next day', () => {
    let state = initializeQuotaState('2026-09-03', false);
    expect(canPerformPhotoScan(state, '2026-09-03')).toBe(true);
    expect(getRemainingScans(state, '2026-09-03')).toBe(3);

    // 1st scan
    state = consumePhotoScan(state, '2026-09-03');
    expect(getRemainingScans(state, '2026-09-03')).toBe(2);

    // 2nd scan
    state = consumePhotoScan(state, '2026-09-03');
    expect(getRemainingScans(state, '2026-09-03')).toBe(1);

    // 3rd scan
    state = consumePhotoScan(state, '2026-09-03');
    expect(getRemainingScans(state, '2026-09-03')).toBe(0);
    expect(canPerformPhotoScan(state, '2026-09-03')).toBe(false);

    // Date change to next day resets count
    expect(canPerformPhotoScan(state, '2026-09-04')).toBe(true);
    expect(getRemainingScans(state, '2026-09-04')).toBe(3);
  });

  it('grants unlimited scans to paid users', () => {
    let paidState = initializeQuotaState('2026-09-03', true);
    for (let i = 0; i < 10; i++) {
      paidState = consumePhotoScan(paidState, '2026-09-03');
    }
    expect(canPerformPhotoScan(paidState, '2026-09-03')).toBe(true);
    expect(getRemainingScans(paidState, '2026-09-03')).toBe(Infinity);
  });
});
