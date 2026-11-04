import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { loggedAt, newestFirst, sameWorkout } from './workoutLogStorage.js';

/** When the plan was last changed by the user; plans saved before sync only have `createdAt`. */
export const planSavedAt = (plan: WeeklyWorkoutPlan): string => plan.updatedAt ?? plan.createdAt;

/** Postgres returns `+00:00` where the device writes `Z`, so times compare as instants, not strings. */
const instant = (iso: string): number => Date.parse(iso) || 0;

/**
 * Which copy of the plan to keep: the newer save wins. `'local'` means the
 * device copy stands and the cloud lacks it; `'same'` means nothing to do.
 */
export function pickWorkoutPlan(
  local: WeeklyWorkoutPlan | null,
  remote: { plan: WeeklyWorkoutPlan; updatedAt: string } | null
): 'local' | 'remote' | 'same' {
  if (!remote) return local ? 'local' : 'same';
  if (!local) return 'remote';
  const localAt = instant(planSavedAt(local));
  const remoteAt = instant(remote.updatedAt);
  if (localAt === remoteAt) return 'same';
  return localAt > remoteAt ? 'local' : 'remote';
}

/**
 * Device and cloud logs as one list, newest first. A workout is one planned
 * session on one date; when both sides have it, the one finished last wins.
 * `pushDates` are the dates where the device holds something the cloud lacks.
 */
export function mergeWorkoutLogs(
  local: readonly WorkoutLog[],
  remote: readonly WorkoutLog[],
  cutoff: string
): { logs: WorkoutLog[]; pushDates: string[] } {
  const merged = remote.filter((log) => log.dateKey >= cutoff);
  const pushDates = new Set<string>();
  for (const log of local) {
    if (log.dateKey < cutoff) continue;
    const index = merged.findIndex((other) => sameWorkout(other, log));
    if (index === -1) merged.push(log);
    else if (loggedAt(log) > loggedAt(merged[index])) merged[index] = log;
    else continue;
    pushDates.add(log.dateKey);
  }
  return { logs: merged.sort(newestFirst), pushDates: [...pushDates].sort() };
}
