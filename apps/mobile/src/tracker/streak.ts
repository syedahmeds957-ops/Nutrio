import type { Weekday } from '@nutrio/workout-core';
import { addDaysToKey } from '../common/dateKey.js';
import { dayIndexInWeek } from './weekStrip.js';

const DAYS_PER_WEEK = 7;
// A streak longer than this is reported as this; it bounds the backwards scan.
const MAX_STREAK_DAYS = 366;

export interface LoggingStreak {
  /** Consecutive logged days ending today, or yesterday if today is still empty. */
  streakDays: number;
  /** Logged days of the current week, 0 = the week's first day (Monday by default). */
  completedDays: number[];
  /** Today's position in the week, 0 = the week's first day (Monday by default). */
  currentDayIndex: number;
  /** Share of this week's days so far (today included) that have a log. */
  consistencyPct: number;
}

/**
 * The logging streak and this week's progress, read from which days have a log.
 * Today not being logged yet does not break the streak: the day isn't over.
 */
export function computeLoggingStreak(
  hasLog: (dateKey: string) => boolean,
  today: string,
  /** First day of the week: `weekStartFor(region)`. */
  weekStart: Weekday = 'mon'
): LoggingStreak {
  let cursor = hasLog(today) ? today : addDaysToKey(today, -1);
  let streakDays = 0;
  while (streakDays < MAX_STREAK_DAYS && hasLog(cursor)) {
    streakDays += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  const currentDayIndex = dayIndexInWeek(today, weekStart);
  const completedDays: number[] = [];
  for (let idx = 0; idx <= currentDayIndex; idx++) {
    if (hasLog(addDaysToKey(today, idx - currentDayIndex))) completedDays.push(idx);
  }

  const daysSoFar = Math.min(DAYS_PER_WEEK, currentDayIndex + 1);
  return {
    streakDays,
    completedDays,
    currentDayIndex,
    consistencyPct: Math.round((completedDays.length / daysSoFar) * 100),
  };
}
