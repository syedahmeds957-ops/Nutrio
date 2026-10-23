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

/** A fresh plan from setup answers, saved for this user. */
export function createWorkoutPlan(settings: WorkoutSettings, now: Date = new Date()): WeeklyWorkoutPlan {
  const plan = generateWeeklyPlan(settingsForSave(settings), {
    // Any stable number works; the time keeps two plans made the same day from matching exactly.
    seed: now.getTime() % 2 ** 31,
    today: localDateKey(now),
    now: now.toISOString(),
  });
  saveWorkoutPlan(plan);
  return plan;
}

/** The plan after "Edit plan": same seed and week numbering, swaps kept where they still fit. */
export function updateWorkoutPlan(previous: WeeklyWorkoutPlan, settings: WorkoutSettings, now: Date = new Date()): WeeklyWorkoutPlan {
  const plan = regeneratePlan(previous, settingsForSave(settings), { now: now.toISOString(), asOf: localDateKey(now) });
  saveWorkoutPlan(plan);
  return plan;
}

/**
 * Saves a finished workout, then lets bodyweight slots that topped out climb
 * to their harder move. Returns the logs and the plan as they now stand.
 */
export function recordWorkout(
  plan: WeeklyWorkoutPlan,
  log: WorkoutLog,
  slots: readonly PlannedSlot[]
): { plan: WeeklyWorkoutPlan; logs: WorkoutLog[] } {
  const logs = saveWorkoutLog(log);
  const next = applyLadder(plan, logs, slots);
  if (next !== plan) saveWorkoutPlan(next);
  return { plan: next, logs };
}

/** Puts a chosen safe alternative in a slot from now on, saved for this user. */
export function swapExercise(plan: WeeklyWorkoutPlan, slotId: string, exerciseId: string, weekIndex: number): WeeklyWorkoutPlan {
  const next = applySwap(plan, slotId, exerciseId, weekIndex);
  saveWorkoutPlan(next);
  return next;
}

/** Undoes a swap: the slot goes back to its own exercise. */
export function resetExercise(plan: WeeklyWorkoutPlan, slotId: string): WeeklyWorkoutPlan {
  const next = resetSwap(plan, slotId);
  if (next !== plan) saveWorkoutPlan(next);
  return next;
}

/**
 * Ramadan mode switched from the week: the plan regenerates with the fasting
 * caps (or without them), keeping its seed, week numbers and swaps that still
 * fit. Logs are separate and untouched.
 */
export function setRamadanMode(plan: WeeklyWorkoutPlan, ramadan: WorkoutSettings['ramadan'], now: Date = new Date()): WeeklyWorkoutPlan {
  return updateWorkoutPlan(plan, { ...plan.settings, ramadan }, now);
}
