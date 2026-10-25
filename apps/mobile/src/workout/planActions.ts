import {
  applyLadder,
  applySwap,
  generateWeeklyPlan,
  regeneratePlan,
  resetSwap,
  type PlannedSlot,
  type WeeklyWorkoutPlan,
  type WorkoutLog,
  type WorkoutSettings,
} from '@nutrio/workout-core';
import { localDateKey } from '../common/dateKey.js';
import { settingsForSave } from './setupState.js';
import { saveWorkoutLog } from './workoutLogStorage.js';
import { saveWorkoutPlan } from './workoutStorage.js';
import { pushWorkoutLogs, pushWorkoutPlan } from '../sync/workoutSync.js';

/**
 * A change the user made: stamped with its save time, kept on the device and
 * backed up when signed in (not awaited; a failed push never blocks the app).
 * Rebuilds the user didn't ask for (upgrades, Ramadan start and end) are saved
 * by storage alone and keep the old save time.
 */
function commitPlan(plan: WeeklyWorkoutPlan, now: Date): WeeklyWorkoutPlan {
  const saved = { ...plan, updatedAt: now.toISOString() };
  saveWorkoutPlan(saved);
  void pushWorkoutPlan(saved);
  return saved;
}

/** A fresh plan from setup answers, saved for this user. */
export function createWorkoutPlan(settings: WorkoutSettings, now: Date = new Date()): WeeklyWorkoutPlan {
  const plan = generateWeeklyPlan(settingsForSave(settings), {
    // Any stable number works; the time keeps two plans made the same day from matching exactly.
    seed: now.getTime() % 2 ** 31,
    today: localDateKey(now),
    now: now.toISOString(),
  });
  return commitPlan(plan, now);
}

/** The plan after "Edit plan": same seed and week numbering, swaps kept where they still fit. */
export function updateWorkoutPlan(previous: WeeklyWorkoutPlan, settings: WorkoutSettings, now: Date = new Date()): WeeklyWorkoutPlan {
  const plan = regeneratePlan(previous, settingsForSave(settings), { now: now.toISOString(), asOf: localDateKey(now) });
  return commitPlan(plan, now);
}

/**
 * Saves a finished workout, then lets bodyweight slots that topped out climb
 * to their harder move. Returns the logs and the plan as they now stand.
 */
export function recordWorkout(
  plan: WeeklyWorkoutPlan,
  log: WorkoutLog,
  slots: readonly PlannedSlot[],
  now: Date = new Date()
): { plan: WeeklyWorkoutPlan; logs: WorkoutLog[] } {
  const logs = saveWorkoutLog(log);
  void pushWorkoutLogs([{ dateKey: log.dateKey, logs: logs.filter((other) => other.dateKey === log.dateKey) }]);
  const next = applyLadder(plan, logs, slots);
  return { plan: next !== plan ? commitPlan(next, now) : plan, logs };
}

/** Puts a chosen safe alternative in a slot from now on, saved for this user. */
export function swapExercise(
  plan: WeeklyWorkoutPlan,
  slotId: string,
  exerciseId: string,
  weekIndex: number,
  now: Date = new Date()
): WeeklyWorkoutPlan {
  return commitPlan(applySwap(plan, slotId, exerciseId, weekIndex), now);
}

/** Undoes a swap: the slot goes back to its own exercise. */
export function resetExercise(plan: WeeklyWorkoutPlan, slotId: string, now: Date = new Date()): WeeklyWorkoutPlan {
  const next = resetSwap(plan, slotId);
  return next !== plan ? commitPlan(next, now) : plan;
}

/**
 * Records the user's answer to a calorie-target offer: the weekly kcal they
 * turned down, or undefined once they accept one. Saved with the plan, so the
 * same offer isn't made again on this or another device.
 */
export function recordTargetOffer(plan: WeeklyWorkoutPlan, declinedKcal: number | undefined, now: Date = new Date()): WeeklyWorkoutPlan {
  if (plan.targetOfferDeclinedKcal === declinedKcal) return plan;
  const next: WeeklyWorkoutPlan = { ...plan, targetOfferDeclinedKcal: declinedKcal };
  if (declinedKcal === undefined) delete next.targetOfferDeclinedKcal;
  return commitPlan(next, now);
}

/**
 * Ramadan mode switched from the week: the plan regenerates with the fasting
 * caps (or without them), keeping its seed, week numbers and swaps that still
 * fit. Logs are separate and untouched.
 */
export function setRamadanMode(plan: WeeklyWorkoutPlan, ramadan: WorkoutSettings['ramadan'], now: Date = new Date()): WeeklyWorkoutPlan {
  return updateWorkoutPlan(plan, { ...plan.settings, ramadan }, now);
}
