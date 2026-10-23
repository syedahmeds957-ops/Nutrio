import {
  generateWeeklyPlan,
  regeneratePlan,
  type WeeklyWorkoutPlan,
  type WorkoutSettings,
} from '@nutrio/workout-core';
import { localDateKey } from '../common/dateKey.js';
import { settingsForSave } from './setupState.js';
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
  const plan = regeneratePlan(previous, settingsForSave(settings), { now: now.toISOString() });
  saveWorkoutPlan(plan);
  return plan;
}
