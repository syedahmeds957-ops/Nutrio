import type { WeighInEntry } from './types.js';

/** Id of the weigh-in made from the weight the user gave in the survey. */
export const SURVEY_BASELINE_ID = 'initial_weigh_in';

/** True for the entry that stands in for the survey weight (shown as "From your survey"). */
export function isSurveyBaseline(entry: Pick<WeighInEntry, 'id'>): boolean {
  return entry.id === SURVEY_BASELINE_ID;
}

/**
 * The weigh-in log with the survey weight as its first entry.
 *
 * One rule for the Today tile, the weight screen and its chart: a user who has
 * never weighed in starts from what they told us in the survey, so the screens
 * can't disagree (the tile said "No weigh-ins yet" while the screen listed 62 kg).
 * Stored entries always win; once there is any, the survey weight is not added
 * again. Pure: the caller passes the stored entries and the date to give the
 * baseline (a stable one, so it doesn't move forward every day).
 */
export function withSurveyBaseline(
  stored: readonly WeighInEntry[],
  surveyWeightKg: number | null | undefined,
  baselineDate: string,
  loggedAt: string = `${baselineDate}T00:00:00.000Z`
): WeighInEntry[] {
  if (stored.length > 0) return [...stored];
  if (typeof surveyWeightKg !== 'number' || !(surveyWeightKg >= 25 && surveyWeightKg <= 300)) return [];
  return [{ id: SURVEY_BASELINE_ID, date: baselineDate, weightKg: surveyWeightKg, loggedAt }];
}

/**
 * The survey weight as the starting point of a trend, for a user who already
 * has real weigh-ins. `withSurveyBaseline` leaves it out once any entry exists
 * (the screens list real entries only); the weekly check-in needs it so that
 * one real weigh-in plus the survey weight is already a trend.
 *
 * Never double-counted: nothing is added when a stored entry sits on the
 * baseline date or earlier (a real weigh-in is then the start of the trend), or
 * when the stored log already holds a baseline entry. Pure; oldest first.
 */
export function withSurveyTrendStart(
  stored: readonly WeighInEntry[],
  surveyWeightKg: number | null | undefined,
  baselineDate: string
): WeighInEntry[] {
  const sorted = [...stored].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return withSurveyBaseline(sorted, surveyWeightKg, baselineDate);
  if (sorted.some((w) => isSurveyBaseline(w) || w.date <= baselineDate)) return sorted;
  const [baseline] = withSurveyBaseline([], surveyWeightKg, baselineDate);
  return baseline ? [baseline, ...sorted] : sorted;
}
