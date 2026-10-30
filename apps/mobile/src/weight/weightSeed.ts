import { DailyIntakeLog, WeighInEntry } from './types.js';
import { loadWeighIns } from './weightStorage.js';
import { getOrInitHistoryStartDate, loadDailyActivities } from '../tracker/activityStorage.js';
import { localDateKey } from '../common/dateKey.js';
import { withSurveyBaseline } from './surveyBaseline.js';

/** The adaptive TDEE calibrates over 28 days, so there is no point reading more. */
export const CALIBRATION_WINDOW_DAYS = 28;

/**
 * The date the survey weight counts from: the day the user first opened the
 * tracker, which never moves. (Dating it today re-dated it every morning and
 * collided with the user's first real weigh-in.)
 */
export function surveyBaselineDate(): string {
  try {
    return getOrInitHistoryStartDate();
  } catch {
    return localDateKey();
  }
}

/**
 * The weigh-in log every screen starts from: the stored entries, or, for a
 * user who has never weighed in, their survey weight as the first weigh-in
 * (see `withSurveyBaseline`). Stored entries win, so real weigh-ins are never
 * collapsed into the synthetic one.
 */
export function buildWeighInSeed(
  surveyWeightKg: number | null | undefined,
  baselineDate: string = surveyBaselineDate()
): WeighInEntry[] {
  return withSurveyBaseline(loadWeighIns(), surveyWeightKg, baselineDate);
}

export { SURVEY_BASELINE_ID, isSurveyBaseline, withSurveyBaseline, withSurveyTrendStart } from './surveyBaseline.js';

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
  today: string = localDateKey()
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
