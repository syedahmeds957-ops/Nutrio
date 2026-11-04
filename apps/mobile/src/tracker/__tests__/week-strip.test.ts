import { describe, expect, it } from 'vitest';
import { dayIndexInWeek, weekdaysFrom, weekStripFor } from '../weekStrip.js';
import { weeklyCalorieBank } from '../calorieBank.js';

// 2026-10-25 is a Sunday, 2026-10-28 a Wednesday, 2026-10-31 a Saturday.
const SUNDAY = '2026-10-25';
const WEDNESDAY = '2026-10-28';
const SATURDAY = '2026-10-31';

describe('weekStripFor', () => {
  it('PK: Monday first, so Sunday is the last day of its week', () => {
    const strip = weekStripFor(SUNDAY, 'PK');
    expect(strip.dateKeys).toEqual([
      '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
    ]);
    expect(strip.weekdays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(strip.todayIndex).toBe(6);
  });

  it('SA: Sunday first, so Sunday opens a new week', () => {
    const strip = weekStripFor(SUNDAY, 'SA');
    expect(strip.dateKeys).toEqual([
      '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31',
    ]);
    expect(strip.weekdays).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    expect(strip.todayIndex).toBe(0);
  });

  it('defaults to Monday first for any other or missing region', () => {
    expect(weekStripFor(SUNDAY, undefined)).toEqual(weekStripFor(SUNDAY, 'PK'));
    expect(weekStripFor(WEDNESDAY, 'AE')).toEqual(weekStripFor(WEDNESDAY, 'PK'));
  });

  it('places a mid-week day by region', () => {
    expect(weekStripFor(WEDNESDAY, 'PK').todayIndex).toBe(2);
    expect(weekStripFor(WEDNESDAY, 'PK').dateKeys[0]).toBe('2026-10-26');
    expect(weekStripFor(WEDNESDAY, 'SA').todayIndex).toBe(3);
    expect(weekStripFor(WEDNESDAY, 'SA').dateKeys[0]).toBe('2026-10-25');
  });

  it('puts Saturday last in SA and sixth in PK', () => {
    expect(weekStripFor(SATURDAY, 'SA').todayIndex).toBe(6);
    expect(weekStripFor(SATURDAY, 'SA').dateKeys[0]).toBe('2026-10-25');
    expect(weekStripFor(SATURDAY, 'PK').todayIndex).toBe(5);
    expect(weekStripFor(SATURDAY, 'PK').dateKeys[0]).toBe('2026-10-26');
  });
});

describe('weekly bank across the region week boundary', () => {
  // Saved days are looked up by date; the week window decides which count.
  const consumedByDate: Record<string, number> = {
    '2026-10-19': 1500, // Mon
    '2026-10-20': 2000, // Tue
    '2026-10-24': 1800, // Sat
  };
  const bankFor = (todayKey: string, region: string) => {
    const strip = weekStripFor(todayKey, region);
    return weeklyCalorieBank(
      strip.dateKeys.map((date, idx) => ({
        consumed: consumedByDate[date] ?? 0,
        target: 1850,
        isLogged: date in consumedByDate && idx < strip.todayIndex,
        isToday: idx === strip.todayIndex,
      }))
    );
  };

  it('PK on Sunday banks Monday to Saturday of the same week', () => {
    // (1850-1500) + (1850-2000) + (1850-1800)
    expect(bankFor(SUNDAY, 'PK')).toEqual({ balanceKcal: 250, countedDays: 3 });
  });

  it('SA on Sunday starts a fresh week: nothing banked yet', () => {
    expect(bankFor(SUNDAY, 'SA')).toEqual({ balanceKcal: 0, countedDays: 0 });
  });

  it('SA on Saturday banks the days since Sunday only', () => {
    expect(bankFor('2026-10-24', 'SA')).toEqual({ balanceKcal: 200, countedDays: 2 });
  });
});

describe('weekdaysFrom / dayIndexInWeek', () => {
  it('orders the week from its first day', () => {
    expect(weekdaysFrom('mon')).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(weekdaysFrom('sun')).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
  });

  it('indexes a day within a Monday (default) or Sunday week', () => {
    expect(dayIndexInWeek(SUNDAY)).toBe(6);
    expect(dayIndexInWeek(SUNDAY, 'sun')).toBe(0);
    expect(dayIndexInWeek(SATURDAY, 'sun')).toBe(6);
    expect(dayIndexInWeek(WEDNESDAY, 'mon')).toBe(2);
  });
});
