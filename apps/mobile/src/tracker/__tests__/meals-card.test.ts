import { describe, expect, it } from 'vitest';
import { chipsThatFit, defaultSlotForHour, mealSegments, nextSlotToLog } from '../mealsCard.js';

const kcal = (b: number, l: number, d: number, s: number) => ({ breakfast: b, lunch: l, dinner: d, snacks_chai: s });

describe('defaultSlotForHour', () => {
  it('follows the day', () => {
    expect(defaultSlotForHour(7)).toBe('breakfast');
    expect(defaultSlotForHour(12)).toBe('lunch');
    expect(defaultSlotForHour(17)).toBe('snacks_chai');
    expect(defaultSlotForHour(21)).toBe('dinner');
  });
});

describe('nextSlotToLog', () => {
  const counts = (b: number, l: number, d: number, s: number) => ({ breakfast: b, lunch: l, dinner: d, snacks_chai: s });
  it('tags the slot for now while it is empty', () => {
    expect(nextSlotToLog('lunch', counts(1, 0, 0, 0))).toBe('lunch');
  });
  it('tags nothing once that slot has food', () => {
    expect(nextSlotToLog('lunch', counts(1, 2, 0, 0))).toBeNull();
  });
});

describe('mealSegments', () => {
  it('sizes each logged slot against the day target and skips empty ones', () => {
    const segments = mealSegments(kcal(400, 600, 0, 0), 2000);
    expect(segments.map((s) => s.slot)).toEqual(['breakfast', 'lunch']);
    expect(segments[0].fraction).toBeCloseTo(0.2);
    expect(segments[1].fraction).toBeCloseTo(0.3);
  });
  it('stands for what was eaten once the day is over target, so it never overflows', () => {
    const segments = mealSegments(kcal(1500, 1000, 500, 0), 2000);
    expect(segments.reduce((sum, s) => sum + s.fraction, 0)).toBeCloseTo(1);
  });
  it('copes with no target and with nothing eaten', () => {
    expect(mealSegments(kcal(300, 0, 0, 0), 0)).toEqual([{ slot: 'breakfast', kcal: 300, fraction: 1 }]);
    expect(mealSegments(kcal(0, 0, 0, 0), 0)).toEqual([]);
    expect(mealSegments(kcal(0, 0, 0, 0), 2000)).toEqual([]);
  });
});

describe('chipsThatFit', () => {
  it('keeps adding chips while they fit on the line', () => {
    expect(chipsThatFit([90, 90, 90, 90], 328, 6)).toBe(3);
    expect(chipsThatFit([90, 90, 90, 90], 400, 6)).toBe(4);
  });
  it('always keeps at least one chip', () => {
    expect(chipsThatFit([500, 90], 328, 6)).toBe(1);
    expect(chipsThatFit([], 328, 6)).toBe(0);
  });
});
