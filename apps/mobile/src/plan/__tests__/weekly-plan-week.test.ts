import { describe, expect, it } from 'vitest';
import { planWeekFor } from '../weeklyPlanWeek.js';

// Wed 28 Oct 2026 (local noon: no time-zone edge).
const WED = new Date(2026, 9, 28, 12);
// Sun 25 Oct 2026.
const SUN = new Date(2026, 9, 25, 12);

describe('planWeekFor', () => {
  it('PK starts on Monday', () => {
    const w = planWeekFor('PK', WED);
    expect(w.weekdays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(w.dateKeys[0]).toBe('2026-10-26');
    expect(w.dateKeys[6]).toBe('2026-11-01');
    expect(w.todayIndex).toBe(2);
  });

  it('SA starts on Sunday', () => {
    const w = planWeekFor('SA', WED);
    expect(w.weekdays).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    expect(w.dateKeys[0]).toBe('2026-10-25');
    expect(w.dateKeys[6]).toBe('2026-10-31');
    expect(w.todayIndex).toBe(3);
  });

  it('defaults to Monday with no region', () => {
    const w = planWeekFor(undefined, WED);
    expect(w.weekdays[0]).toBe('mon');
    expect(w.dateKeys[0]).toBe('2026-10-26');
    expect(w.todayIndex).toBe(2);
  });

  it('on a Sunday: PK is the last day of the week, SA the first', () => {
    expect(planWeekFor('PK', SUN).todayIndex).toBe(6);
    expect(planWeekFor('PK', SUN).dateKeys[0]).toBe('2026-10-19');
    expect(planWeekFor('SA', SUN).todayIndex).toBe(0);
    expect(planWeekFor('SA', SUN).dateKeys[0]).toBe('2026-10-25');
  });

  it('keys line up with weekdays and today is inside the week', () => {
    for (const region of ['PK', 'SA', undefined]) {
      const w = planWeekFor(region, WED);
      expect(w.dateKeys).toHaveLength(7);
      expect(w.dateKeys[w.todayIndex]).toBe('2026-10-28');
    }
  });
});
