import type { Weekday } from '@nutrio/workout-core';
import { addDaysToKey } from '../common/dateKey.js';
import { weekStartKeyFor, weekdayOf } from '../workout/weekView.js';

const DAYS_PER_WEEK = 7;

/** Monday first: the order every week strip used before regions had their own. */
export const MONDAY_FIRST_WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export interface WeekStrip {
  /** The seven `YYYY-MM-DD` keys of the calendar week that contains today, in display order. */
  dateKeys: string[];
  /** The weekday of each key, for the day labels. */
  weekdays: Weekday[];
  /** Today's position in `dateKeys`. */
  todayIndex: number;
}

/**
 * The calendar week the Today screen's day strip and weekly calorie bank show.
 * It starts on the region's first day (`weekStartFor`: SA Sunday, else Monday)
 * and is derived from dates alone, so switching region only re-windows which
 * saved days are read: no week key is stored that a new boundary could shift.
 */
export function weekStripFor(todayKey: string, region: string | undefined): WeekStrip {
  const startKey = weekStartKeyFor(todayKey, region);
  const dateKeys = Array.from({ length: DAYS_PER_WEEK }, (_, i) => addDaysToKey(startKey, i));
  return {
    dateKeys,
    weekdays: dateKeys.map(weekdayOf),
    todayIndex: dateKeys.indexOf(todayKey),
  };
}

/** The seven weekdays in order from `start`. */
export function weekdaysFrom(start: Weekday): Weekday[] {
  const first = MONDAY_FIRST_WEEKDAYS.indexOf(start);
  return Array.from({ length: DAYS_PER_WEEK }, (_, i) => MONDAY_FIRST_WEEKDAYS[(first + i) % DAYS_PER_WEEK]);
}

/** Position of a day key in a week that starts on `start` (0 = the first day). */
export function dayIndexInWeek(dateKey: string, start: Weekday = 'mon'): number {
  const first = MONDAY_FIRST_WEEKDAYS.indexOf(start);
  const day = MONDAY_FIRST_WEEKDAYS.indexOf(weekdayOf(dateKey));
  return (day - first + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}
