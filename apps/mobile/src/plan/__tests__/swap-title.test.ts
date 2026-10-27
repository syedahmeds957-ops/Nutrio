import { describe, expect, it } from 'vitest';
import { swapTitleFor } from '../swapTitle.js';

const items = [
  { foodName: 'Boiled Rice', foodNameAr: 'أرز مسلوق' },
  { foodName: 'Grilled Chicken (Breast)', foodNameAr: 'دجاج مشوي (صدر)' },
];

describe('swapTitleFor', () => {
  it('keeps the planner title for English readers', () => {
    expect(swapTitleFor(items, 'en', 'Boiled Rice & Grilled Chicken')).toBe('Boiled Rice & Grilled Chicken');
  });

  it('builds the title from Arabic names for Arabic readers', () => {
    expect(swapTitleFor(items, 'ar', 'x')).toBe('أرز مسلوق ودجاج مشوي');
  });

  it('falls back when there are no Arabic names', () => {
    expect(swapTitleFor([{ foodName: 'Dahi' }], 'ar', 'Dahi')).toBe('Dahi');
  });
});
