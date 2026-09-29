import { describe, it, expect } from 'vitest';
import { formatServingLine } from '../formatServing.js';
import { TrackerEngine } from '../engine.js';

const targets = {
  targetCalories: 2000,
  targetProteinGrams: 120,
  targetFatGrams: 60,
  targetCarbGrams: 250,
};

describe('formatServingLine', () => {
  it('prints the weight once when the catalogue label already carries it', () => {
    expect(formatServingLine(1, '1 bazinga burger (200g)', 200)).toBe('1 bazinga burger (200g)');
    expect(formatServingLine(1, '1 standard serving (200g)', 200)).toBe('1 standard serving (200g)');
  });

  it('scales the printed weight with quantity instead of repeating the label figure', () => {
    expect(formatServingLine(2, '1 bazinga burger (200g)', 400)).toBe('2 × 1 bazinga burger (400g)');
  });

  it('leaves labels without an embedded weight alone', () => {
    expect(formatServingLine(1, '1 plate', 250)).toBe('1 plate (250g)');
  });

  it('falls back to a generic label rather than rendering "undefined"', () => {
    expect(formatServingLine(1, undefined, 100)).toBe('serving (100g)');
  });
});

describe('TrackerEngine.logCustomizedItem portion weight', () => {
  it('records the real portion weight rather than a 100g placeholder', () => {
    const engine = new TrackerEngine(targets);
    const item = engine.logCustomizedItem(
      'lunch',
      'Bazinga Burger',
      'بزینگا برگر',
      '1 bazinga burger (200g)',
      1,
      520,
      24,
      42,
      28,
      200
    );

    expect(item.totalGrams).toBe(200);
    expect(item.servingGrams).toBe(200);
    expect(formatServingLine(item.quantity, item.servingLabel, item.totalGrams)).toBe(
      '1 bazinga burger (200g)'
    );
  });

  it('splits a multi-portion total back into a per-serving weight', () => {
    const engine = new TrackerEngine(targets);
    const item = engine.logCustomizedItem('dinner', 'Roti', undefined, '1 roti', 3, 795, 21, 150, 9, 135);

    expect(item.totalGrams).toBe(135);
    expect(item.servingGrams).toBe(45);
  });
});
