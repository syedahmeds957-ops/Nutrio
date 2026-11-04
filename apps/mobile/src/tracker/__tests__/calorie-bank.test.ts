import { describe, expect, it } from 'vitest';
import { weeklyCalorieBank } from '../calorieBank.js';

const day = (consumed: number, isLogged = true, isToday = false) => ({ consumed, target: 1447, isLogged, isToday });

describe('weeklyCalorieBank', () => {
  it('banks nothing from a day still in progress', () => {
    expect(weeklyCalorieBank([day(212, true, true)])).toEqual({ balanceKcal: 0, countedDays: 0 });
  });

  it('adds up finished, logged days, under and over', () => {
    const bank = weeklyCalorieBank([day(1300), day(1600), day(0, false), day(500, true, true)]);
    // (1447 - 1300) + (1447 - 1600) = 147 - 153
    expect(bank).toEqual({ balanceKcal: -6, countedDays: 2 });
  });

  it('ignores days nobody logged', () => {
    expect(weeklyCalorieBank([day(0, false), day(0, false)]).countedDays).toBe(0);
  });
});
