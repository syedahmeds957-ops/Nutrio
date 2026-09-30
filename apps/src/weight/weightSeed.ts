import { DailyIntakeLog, WeighInEntry } from './types.js';
import { loadWeighIns } from './weightStorage.js';
import { getOrInitHistoryStartDate, loadDailyActivities } from '../tracker/activityStorage.js';

/** The adaptive TDEE calibrates over 28 days, so there is no point reading more. */
export const CALIBRATION_WINDOW_DAYS = 28;

/**
 * The weigh-in log to open the weight screen with.
 *
 * Stored entries win. Only a user who has never weighed in gets the synthetic
 * baseline, and only so that "net change" has something to measure from — the
 * screen used to fabricate this entry on *every* mount, which is what made three
 * real weigh-ins collapse into one row reading 0 kg of change.
 */
export function buildWeighInSeed(
  surveyWeightKg: number,
  today: string = new Date().toISOString().split('T')[0]
): WeighInEntry[] {
  const stored = loadWeighIns();
  if (stored.length > 0) return stored;

  return [
    {
      id: 'initial_weigh_in',
      date: today,
      weightKg: surveyWeightKg,
      loggedAt: new Date().toISOString(),
    },
  ];
}

/** Every date from `start` to `end` inclusive, oldest first, ISO `YYYY-MM-DD`. */
export function datesInRange(start: string, end: string, maxDays: number): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${end}T00:00:00Z`);
  const first = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(first.getTime())) return dates;

  while (cursor >= first && dates.length < maxDays) {
    dates.push(cursor.toISOString().split('T')[0]);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates.reverse();
}

/**
 * What the user actually ate, per day, for the calibration window.
 *
 * Read from the diary the tracker already persists. The weight screen was being
 * handed an empty array, so its calibration bar sat at "0 / 28 days (0%)" and
 * it fell back to the formula TDEE no matter how long someone had been logging.
 *
 * Days with nothing logged are skipped rather than recorded as 0 kcal — a day
 * the user didn't log is missing data, not a day they ate nothing, and feeding
 * zeros into the calibration would drag the estimate down.
 */
export function collectIntakeLogs(
  region: 'PK' | 'SA',
  today: string = new Date().toISOString().split('T')[0]
): DailyIntakeLog[] {
  const start = getOrInitHistoryStartDate();
  const logs: DailyIntakeLog[] = [];

  for (const date of datesInRange(start, today, CALIBRATION_WINDOW_DAYS)) {
    const day = loadDailyActivities(date, region);
    if (!day || day.items.length === 0) continue;

    const kcal = day.items.reduce((sum, item) => sum + item.calories, 0);
    if (kcal > 0) logs.push({ date, kcal: Math.round(kcal) });
  }

  return logs;
}
