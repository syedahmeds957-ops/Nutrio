import { describe, expect, it } from 'vitest';
import type { DailyMealPlanResult } from '@nutrio/nutrition-core';
import { planMacroStatus } from '../planMacroStatus.js';

const plan = (p: number, c: number, f: number) =>
  ({
    actualProteinGrams: p,
    targetProteinGrams: 148,
    actualCarbGrams: c,
    targetCarbGrams: 115,
    actualFatGrams: f,
    targetFatGrams: 44,
  }) as DailyMealPlanResult;

describe('planMacroStatus', () => {
  it('flags a macro more than 15% off its target, either way', () => {
    const s = planMacroStatus(plan(67.3, 132.4, 70.2));
    expect(s.protein).toMatchObject({ isOff: true, gapGrams: -81 });
    expect(s.carbs).toMatchObject({ isOff: true, gapGrams: 17 }); // +15.1%
    expect(s.fat).toMatchObject({ isOff: true, gapGrams: 26 });
  });

  it('leaves macros within 15% unflagged', () => {
    const s = planMacroStatus(plan(140, 110, 48));
    expect(s.protein.isOff).toBe(false);
    expect(s.carbs.isOff).toBe(false);
    expect(s.fat.isOff).toBe(false);
  });
});
