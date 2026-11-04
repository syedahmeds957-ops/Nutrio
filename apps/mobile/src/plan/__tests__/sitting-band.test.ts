import { describe, it, expect } from 'vitest';
import en from '../../i18n/locales/en.json';
import ar from '../../i18n/locales/ar.json';
import { sittingBand, SITTING_ACTIVE_MAX_HOURS, SITTING_MOSTLY_SEATED_MIN_HOURS } from '../sittingBand.js';

describe('sittingBand', () => {
  it('names the band for the hours actually seated', () => {
    expect(sittingBand(0)).toBe('active');
    expect(sittingBand(SITTING_ACTIVE_MAX_HOURS)).toBe('active');
    expect(sittingBand(5)).toBe('moderate');
    expect(sittingBand(7)).toBe('moderate');
    expect(sittingBand(SITTING_MOSTLY_SEATED_MIN_HOURS)).toBe('sedentary');
    expect(sittingBand(14)).toBe('sedentary');
  });

  it('has a label in both languages for every band', () => {
    for (const band of ['active', 'moderate', 'sedentary'] as const) {
      expect(en.plan.analysis[band]).toBeTruthy();
      expect(ar.plan.analysis[band]).toBeTruthy();
    }
  });
});
