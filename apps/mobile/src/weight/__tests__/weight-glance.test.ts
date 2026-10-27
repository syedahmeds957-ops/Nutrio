import { describe, expect, it } from 'vitest';
import { sparklinePoints, weightGlance } from '../weightGlance.js';
import type { WeighInEntry } from '../types.js';

const entry = (date: string, weightKg: number): WeighInEntry => ({ id: date, date, weightKg, loggedAt: `${date}T08:00:00Z` });

describe('weightGlance', () => {
  it('is null with no weigh-ins', () => {
    expect(weightGlance([])).toBeNull();
  });

  it('has no weekly change from a single weigh-in', () => {
    const glance = weightGlance([entry('2026-10-26', 74.2)]);
    expect(glance).toMatchObject({ latestKg: 74.2, weekDeltaKg: null, series: [74.2] });
  });

  it('compares the latest weigh-in with the earliest one in the week before it', () => {
    const glance = weightGlance([entry('2026-10-10', 76), entry('2026-10-20', 74.6), entry('2026-10-23', 74.4), entry('2026-10-27', 74.2)]);
    expect(glance?.weekDeltaKg).toBe(-0.4);
  });

  it('ignores weigh-ins older than a week', () => {
    expect(weightGlance([entry('2026-10-01', 76), entry('2026-10-27', 74.2)])?.weekDeltaKg).toBeNull();
  });

  it('reads an unsorted log and keeps the last eight points', () => {
    const entries = Array.from({ length: 10 }, (_, i) => entry(`2026-10-${String(10 + i).padStart(2, '0')}`, 80 - i)).reverse();
    const glance = weightGlance(entries);
    expect(glance?.latestKg).toBe(71);
    expect(glance?.series).toHaveLength(8);
    expect(glance?.series[0]).toBe(78);
  });
});

describe('sparklinePoints', () => {
  it('draws nothing for fewer than two values', () => {
    expect(sparklinePoints([74], 100, 30)).toEqual([]);
  });
  it('maps the lowest value to the bottom and the highest to the top', () => {
    const [first, last] = sparklinePoints([75, 74], 100, 30, 3);
    expect(first.y).toBe(3);
    expect(last.y).toBe(27);
    expect(first.x).toBe(3);
    expect(last.x).toBe(97);
  });
  it('draws a flat series mid-height', () => {
    expect(sparklinePoints([74, 74, 74], 100, 30).every((p) => p.y === 15)).toBe(true);
  });
});
