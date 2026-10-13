import { describe, expect, it } from 'vitest';
import { computeLoggingStreak } from '../streak.js';

// 2026-10-14 is a Wednesday, so Mon 12 and Tue 13 are earlier this week.
const TODAY = '2026-10-14';
const logged = (...dates: string[]) => (date: string) => dates.includes(date);

describe('computeLoggingStreak', () => {
  it('reports nothing for a user who has never logged', () => {
    expect(computeLoggingStreak(logged(), TODAY)).toEqual({
      streakDays: 0,
      completedDays: [],
      currentDayIndex: 2,
      consistencyPct: 0,
    });
  });

  it('counts consecutive logged days ending today', () => {
    const result = computeLoggingStreak(
      logged('2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'),
      TODAY
    );
    expect(result.streakDays).toBe(4);
  });

  it('keeps yesterday’s streak alive before anything is logged today', () => {
    const result = computeLoggingStreak(logged('2026-10-12', '2026-10-13'), TODAY);
    expect(result.streakDays).toBe(2);
  });

  it('breaks the streak at the first missed day', () => {
    const result = computeLoggingStreak(
      logged('2026-10-10', '2026-10-12', '2026-10-13', '2026-10-14'),
      TODAY
    );
    expect(result.streakDays).toBe(3);
  });

  it('marks this week’s logged days, Monday first', () => {
    const result = computeLoggingStreak(
      // Sunday 11th belongs to last week and must not appear.
      logged('2026-10-11', '2026-10-12', '2026-10-14'),
      TODAY
    );
    expect(result.completedDays).toEqual([0, 2]);
    expect(result.currentDayIndex).toBe(2);
  });

  it('measures consistency over the days of this week so far', () => {
    // 2 of the 3 days so far (Mon, Tue, Wed).
    const result = computeLoggingStreak(logged('2026-10-12', '2026-10-14'), TODAY);
    expect(result.consistencyPct).toBe(67);
  });
});
