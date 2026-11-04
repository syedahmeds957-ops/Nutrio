# Phase 5: Set logging + progression with reasons

**Size:** M · **Blocked by:** 4 · Ends at **Checkpoint A**.

> **Status: done 2026-10-23, not committed (waiting for the user's command).** Checkpoint A passed on web and the iPhone simulator. See "Execution record" at the end.

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

## Execution record (2026-10-23)

### What shipped

- **`workout-core/progression.ts`:**
  - `nextTarget` covers double progression; a 10% cut after two sessions below the range, rounded down to a real step; a hold after a "hard" rating; home dumbbells that step through the weights the user owns; and the bodyweight ladder, which then adds sets up to 4, then holds.
  - `loadIncrement`, `stepLoad` and `startingLoad` drive the logger's steppers.
  - `applyLadder` stores a climbed move as a swap.
- **Mobile logic:**
  - `workoutLogStorage.ts`: per-user key, newest first, one log per session per date, pruned to 365 days, with hydrate and release wired into boot, guest entry and logout.
  - `historyFor.ts`, plus done/missed statuses in `buildWeekView`.
  - `workoutDraft.ts`: targets for a session, the draft model and edits, stats, and the in-memory active draft.
  - `recordWorkout` in `planActions.ts`.
- **Screens:**
  - Target panel with its reason line.
  - Set logger: typeable −/+ steppers that read Arabic digits; the weight on set 1 fills the later sets.
  - Rest timer: +30 s, Skip, and a haptic buzz at zero.
  - Discard dialog.
  - Finish sheet: time, sets, kg lifted and the rating; Save waits for a rating.
  - The day screen gains logging mode and a view of what was logged on a done day.
  - The week screen gains Done/Missed chips, "Do it today" and the "Workout saved" toast.
  - The Today card shows Done.
- **i18n:** English and Arabic for every reason, the logger, the finish sheet and the dialogs, with Arabic kg values and ranges kept left to right.

### Changes from the plan

1. **Three reasons added**, to keep every message true:
   - `first_time` for bodyweight moves, which have no weight to pick.
   - `top_dumbbell_hold`, for the spec's "Your heaviest dumbbell" copy.
   - `hold` also covers "already on your lightest dumbbell" when the 10% cut has nowhere to go.
2. **A target carries `reps`**, the number to aim for (one more than the lowest set last time). The logger starts from it instead of always from the bottom of the range.
3. **A log is identified by date + planned day, not date + template.** Upper body A and B share the template `upper`, so both done on one date would have overwritten each other.
4. **A climb never duplicates a move.** `nextTarget` takes the exercises the session's other slots already use. Found on web: Glute bridge climbed to Single-leg glute bridge while another slot already had it.
5. **Start works on any day of the week** and logs under today ("Today · moved from Mon"). "Do it today" on a missed day goes straight into logging.
6. **The draft is kept in memory, not in storage.** An edge swipe away doesn't lose it, and Back asks first. It is cleared on save, discard and logout.
7. **Ticked state is exposed with `aria-checked`** (and setup chips with `aria-selected`). react-native-web ignores `accessibilityState`, so screen readers and the web never saw which sets were done.
8. **Ramadan's "same weight while fasting" reason** stays in phase 7, as planned there.

### Startup hang (fixed alongside, from the phase 4 follow-up)

- **Fonts:** the splash waits at most 3 s, and not at all once loading fails. Before, a font error was ignored, so a failed font held the splash forever.
- **Network:** `restoreSession`'s Supabase read gets a 6 s limit; `hydrateUserDataFromCloud` and `fetchActivityHistory` get 8 s each. Each falls back to on-device data.
- **Backstop:** clears the splash after 15 s whatever happens. A restore that finishes later only navigates if the user is still on sign-in, which is checked against the live route rather than the one at mount.
- **Shared helper:** `common/withTimeout.ts`, with tests.
- **Proof** (fonts and Supabase requests held forever over the DevTools protocol, never answered):

| Build | Fonts held | Fonts + stalled session refresh |
|---|---|---|
| Before (phase 4 export) | still on splash after 30 s | still on splash after 30 s |
| After | sign-in after 3.3 s | sign-in after 6.6 s |

A cloud restore that misses its 8 s limit is no longer thrown away. When it lands, it fills in the survey or plan if the device has none, and never overwrites what the device has. (Seen on the simulator: a signed-in restore took over 8 s.)

**Also fixed at the user's request (not workout work):** restaurant menu labels were missing from both locale files. These were the PK "BBQ" filter pill (the files only had "Desi BBQ") plus 218 menu section names, which logged warnings and showed in English to Arabic users. All are now in `en.json` and `ar.json`, and `tracker/__tests__/brand-group-translations.test.ts` checks every PK and SA label in both languages. No food data or region lists changed, so each region still shows only its own items.

A normal boot still shows sign-in in 0.4 s, and the walkthrough below needed no reloads (phase 4 needed some).

### Verification evidence

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 111 pass (28 new progression tests: every reason, increments per equipment, home dumbbells with gaps and at the top, the 10% cut's rounding, ladder and end of ladder, no duplicate climbs) |
| `cd apps/mobile && npx vitest run src/workout` | all pass: log storage 7, week view done/missed 5 new (PK, SA, other weeks, moved sessions), logging flow 8 (start → tick → finish → saved → next target; ladder; screens; Arabic) |
| `npm test` (whole repo) | 1,189 tests, 0 failures |
| `npm run build`, `tsc --noEmit` (apps/mobile), CI key guard | pass |
| **Web, end to end** (headless Chrome, real clicks and typing; the clock moved forward a week at a time) | 30 / 30 checks pass: first-time targets; logging rows; Finish held until a set is ticked; elapsed clock; + from blank; set 1 fills later sets; rest timer with +30 s and Skip; discard dialog; finish sheet with Save held; toast; Done and count; **reload keeps logs**; **gym: next week +2.5 kg with its reason**; Missed and "Do it today" (moved from); discard; 360 px no overflow; **home with no equipment: Harder move**, no duplicate moves; **home dumbbells 4/6/10 kg: steppers go 4 → 6, hold at 10 with "Your heaviest dumbbell"**; **Arabic RTL** logging, rows mirrored, ranges read 10–15 |
| **iPhone 17 Pro Max simulator** | logging screen with +2.5 kg targets, reasons, a ticked set, steppers and the elapsed clock; via a temporary demo hook, removed afterwards (`App.tsx` restored, demo file deleted) |
