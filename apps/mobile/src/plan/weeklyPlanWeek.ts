import type { Weekday } from '@nutrio/workout-core';
import { localDateKey } from '../common/dateKey.js';
import { weekStripFor } from '../tracker/weekStrip.js';

export interface PlanWeek {
  /** The seven `YYYY-MM-DD` keys of the displayed week, first day of the region's week first. */
  dateKeys: string[];
  /** The weekday of each key, for labels. */
  weekdays: Weekday[];
  /** Today's position in `dateKeys`, the day the view opens on. */
  todayIndex: number;
}

/**
 * The week the meal-plan view shows. It starts on the region's first day
 * (SA Sunday, else Monday) via `weekStartFor`. The seven generated day plans
 * are positional (index 0 = first displayed day) and carry no weekday, so
 * nothing stored depends on which day the week starts on.
 */
export function planWeekFor(region: string | undefined, date: Date = new Date()): PlanWeek {
  return weekStripFor(localDateKey(date), region);
}
