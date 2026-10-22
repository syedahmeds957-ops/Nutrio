# Phase 5: Set logging + progression with reasons

**Size:** M · **Blocked by:** 4 · Ends at **Checkpoint A**.

## Outcome

The user starts a workout, logs each set quickly with a rest timer, finishes with a how-did-it-feel rating, and the next session shows new targets, each with a one-line reason.

## Tasks

1. **Log types** (`workout-core/src/types.ts`):
   ```ts
   export interface LoggedSet { reps: number; loadKg?: number; done: boolean }
   export interface LoggedExercise { slotId: string; exerciseId: string; sets: LoggedSet[] }
   export interface WorkoutLog {
     dateKey: string; day: Weekday; template: SessionTemplateId;
     exercises: LoggedExercise[]; rating?: 'easy' | 'right' | 'hard';
     startedAt: string; finishedAt?: string;
   }
   export type ProgressReason =
     | 'first_time_pick_weight' | 'hit_top_add_load' | 'in_range_add_reps'
     | 'failed_twice_reduce' | 'felt_hard_hold' | 'ladder_step_up' | 'add_set' | 'hold';
   export interface Target {
     exerciseId: string; sets: number; repMin: number; repMax: number;
     loadKg?: number; reason: ProgressReason; reasonParams?: Record<string, number | string>;
   }
   ```
2. **`workout-core/src/progression.ts`**: `nextTarget(slot, history: WorkoutLog[], settings): Target`, where history is the logs containing this slot, newest first.
   - **No history** → `first_time_pick_weight`. Load is left blank for the user to pick (assumption 2).
   - **Load exercises:**
     - All sets at `repMax` last time → add one increment (`hit_top_add_load`).
     - Otherwise → same load, aim for +1 rep (`in_range_add_reps`).
     - Any set below `repMin` in each of the last 2 sessions → load × 0.9, rounded down to an increment (`failed_twice_reduce`).
     - Last rating `hard` → no load increase (`felt_hard_hold`).
   - **Increments:**
     - barbell, cable, machine, ez_bar: 2.5 kg
     - gym dumbbell: 2 kg
     - home dumbbell: the next weight in `dumbbellWeightsKg`, or hold with `hold` if none is heavier
     - kettlebell: 4 kg
   - **Bodyweight / bands:** all sets at `repMax` → step to `exercise.harder` and reset reps to `repMin` (`ladder_step_up`). With no `harder`, add a set up to 4 (`add_set`), then `hold`. `exerciseForWeek` respects the ladder by storing the stepped-up exercise in `plan.swaps[slotId]`.
3. **`apps/mobile/src/workout/workoutLogStorage.ts`**: one key `nutrio_workout_logs_<scope>` holding `WorkoutLog[]`, pruned to the last 365 days. Functions `loadWorkoutLogs()`, `saveWorkoutLog(log)` (replaces the same dateKey + template), `hydrateWorkoutLogs()` and `releaseWorkoutLogCache()`. Wired into `App.tsx` boot and logout.
4. **`workout/historyFor.ts`**: `historyForSlot(logs, slotId)` and `statusForDay(logs, dateKey)`. `buildWeekView` now gets real `done`/`missed`.
5. **Logging mode** in `WorkoutDayScreen`:
   - "Start workout" turns rows into set lists prefilled from `nextTarget` (reps = repMin; load = target or blank).
   - −/+ steppers for reps and kg (step = that exercise's increment); tap ✓ to complete a set.
   - When a set is checked, a rest-timer banner counts down `restSec` with skip and +30 s, and `expo-haptics` buzzes at zero.
   - "Finish" opens the rating sheet → `saveWorkoutLog` → back to the week, with the day shown as done.
   - Leaving mid-workout keeps an unsaved draft in memory and asks "Discard workout?".
6. **Reason lines.** Under each exercise: "62.5 kg × 8–12" and `t('workout.reason.hit_top_add_load', { inc: 2.5 })` → "+2.5 kg: you hit 12 on every set". Every `ProgressReason` gets EN + AR strings.
7. **Missed sessions.** A `missed` day card in the current week offers "Do it today", which opens that session for logging under today's date key.

## Tests

- `packages/workout-core/test/progression.test.ts`: every reason path; increments per equipment; a home dumbbell set with gaps (e.g. [4, 6, 10]) and at its maximum; ladder step-up and end of ladder; rounding of the 10% cut.
- `src/workout/__tests__/workout-log.test.ts`: save/replace/prune/scope/release.
- `src/workout/__tests__/week-view.test.ts` (extend): done/missed from logs.
- `src/workout/__tests__/logging-flow.test.ts`: start → check sets → finish → log saved; a second session shows the expected reason.

## Verify

```bash
npm run build
npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
npm test
```

## Checkpoint A demo

On web and one simulator:
- **Gym user:** 2 logged sessions show a load increase with a reason.
- **Home no-equipment user:** a ladder step-up.
- **Home dumbbell user** with a limited set: holds at their maximum.
- **Arabic RTL** throughout.
- **Reload** mid-week keeps logs.

## Done when

Commit: `feat(workout): set logging, rest timer and explained progression`.
