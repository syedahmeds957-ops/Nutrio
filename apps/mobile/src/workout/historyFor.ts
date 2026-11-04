import type { Weekday, WorkoutLog, WorkoutSession } from '@nutrio/workout-core';

/** The logs that contain this slot, newest first: the history `nextTarget` reads. */
export function historyForSlot(logs: readonly WorkoutLog[], slotId: string): WorkoutLog[] {
  return logs.filter((log) => log.exercises.some((exercise) => exercise.slotId === slotId));
}

/**
 * The log that completes a planned session in the week `[weekStartKey, weekEndKey]`,
 * whichever day of that week it was done on (a missed Tuesday done on Thursday counts for Tuesday).
 */
export function logForSession(
  logs: readonly WorkoutLog[],
  session: Pick<WorkoutSession, 'day' | 'template'>,
  weekStartKey: string,
  weekEndKey: string
): WorkoutLog | undefined {
  return logs.find(
    (log) =>
      log.day === session.day &&
      log.template === session.template &&
      log.dateKey >= weekStartKey &&
      log.dateKey <= weekEndKey
  );
}

/** Logs saved on a date for sessions planned on another day, e.g. "moved from Tue". */
export function movedFrom(log: Pick<WorkoutLog, 'day'>, performedOn: Weekday): Weekday | null {
  return log.day === performedOn ? null : log.day;
}
