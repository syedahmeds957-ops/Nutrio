# Phase 9: Calorie target link

**Size:** S · **Blocked by:** 3

## Outcome

When a signed-in user with accepted targets saves or changes a workout plan that shifts their energy use by at least 50 kcal/day, they're asked whether to update their daily target. Nothing changes unless they accept, and repeated saves never stack.

## How the number is worked out

The current TDEE already includes an exercise estimate from the survey (`estimateWeeklyExerciseKcal` → `weeklyExerciseKcal` in `bridgeSurveyToNutritionCore`). The plan replaces that estimate rather than adding to it:

```
newTdee = tdee + round((planWeeklyKcal − countedWeeklyKcal) / 7)
countedWeeklyKcal = plan.userContext.trainingWeeklyKcal ?? surveyWeeklyExerciseKcal
```

After acceptance, `trainingWeeklyKcal = planWeeklyKcal`, so saving the same plan again gives a delta of 0. When a weekly recalibration has already measured TDEE, the delta still applies: it's the change in planned training.

## Tasks

1. **nutrition-core:**
   - Move `estimateWeeklyExerciseKcal` and its kcal/min table from `apps/mobile/src/survey/nutrition-bridge.ts` into `packages/nutrition-core/src/exercise.ts`, with the activity-type union. `survey/types.ts` `TrainingType` re-exports that union; the bridge imports the function.
   - Add `estimateWorkoutPlanWeeklyKcal(sessions: { minutes: number; style: 'resistance' | 'bodyweight' | 'conditioning' }[])`, reusing the table (resistance 6.5, bodyweight 5.5, conditioning 8.0 kcal/min). It takes plain numbers, so nutrition-core doesn't depend on workout-core.
   - Add `adjustTdeeForTraining(tdee, countedWeeklyKcal, nextWeeklyKcal)`.
2. **App types.** Add optional `trainingWeeklyKcal?: number` to `PlanUserContext` (`apps/mobile/src/plan/types.ts`). Old stored plans without it fall back to the survey estimate.
3. **`apps/mobile/src/workout/calorieLink.ts`**: `proposeTargetUpdate({ activePlan, workoutPlan, survey })` returns `null` or `{ currentKcal, proposedKcal, nextPlan }`.
   - Maps sessions to style: gym → resistance, home → bodyweight, finisher minutes → conditioning.
   - Builds `nextPlan` with `computePlan(newUserContext, goalSelection, narrative)`, so the safety floors in `calculateCalorieTarget` still apply.
   - Returns `null` for guests, no active plan, or |Δ| < 50 kcal/day.
4. **UI.** After `saveWorkoutPlan` in setup or edit, if there's a proposal, show `workout/ui/TargetUpdateSheet.tsx`: "Your workout plan changes your daily target from 1,850 to 1,960 kcal. Update?" [Update] [Not now].
   - Update takes the same path as the check-in's `onAcceptNewTargets` (`setActivePlan`, `savePersistedPlan`, `syncNutritionTargets`), so lift that into a shared `acceptPlan(next)` in `App.tsx`.
   - Not now leaves everything unchanged; it asks again only when the workout plan changes.
5. **i18n**: sheet strings in both locales.

## Tests

- `packages/nutrition-core/test/exercise.test.ts`: the moved function gives identical results; the plan estimate; adjust maths.
- Survey/plan regression: the existing `nutrition-bridge` and plan tests still pass unchanged (same targets as before).
- `src/workout/__tests__/calorie-link.test.ts`: below 50 → null; guest → null; accept → `trainingWeeklyKcal` set; saving the same plan again → null; the safety floor holds for a low-target user.

## Verify

```bash
npm run build
npx vitest run packages/nutrition-core
cd apps/mobile && npx vitest run src/workout src/plan src/survey
npm test
```

## Done when

Commit: `feat(workout): offer calorie target update from workout plan`.

## Execution record (2026-10-25)

### Decisions (user, 2026-10-25)

This file was written before phases 6b, 7 and 8b, so three questions were asked before building:

1. **Cardio block counted by its intensity.** Easy cardio uses the walking rate (4.0 kcal/min, the survey's brisk walking). Moderate cardio and interval moves use conditioning (8.0). A swapped cardio block is counted as the move actually in the slot.
2. **The optional rest-day walk isn't counted.** It's only a suggestion.
3. **No offer while Ramadan mode is shortening sessions.** Targets don't follow Ramadan (D3), and an offer would lower the target for a month and never raise it back.

### What shipped

- **`nutrition-core/src/exercise.ts`:**
  - `estimateWeeklyExerciseKcal`, its kcal/min table and the `TrainingType` and `WorkoutIntensity` unions moved here unchanged. `survey/types.ts` re-exports the types, and `nutrition-bridge.ts` imports the function and still exports it for survey callers.
  - `estimateWorkoutPlanWeeklyKcal(segments)` takes plain `{ minutes, style }` parts. The styles are `resistance` 6.5, `bodyweight` 5.5, `conditioning` 8.0 and `walking` 4.0, all taken from the same table.
  - `adjustTdeeForTraining(tdee, counted, next)`.
- **`PlanUserContext.trainingWeeklyKcal?`:** the weekly training already in `tdee`. When it's absent, the survey's estimate is what `tdee` counts.
- **`workout/calorieLink.ts`:**
  - `workoutPlanWeeklyKcal(plan)` splits each session. Strength time is `estimatedMinutes` minus cardio and finisher time, at the gym or home rate. Then come the cardio block and any old finisher.
  - `proposeTargetUpdate({ isGuest, activePlan, workoutPlan, survey })` returns `null` in any of these cases:
    - a guest;
    - no accepted targets;
    - the plan is fasting (Ramadan);
    - neither the survey nor an earlier plan says what `tdee` counts (no guess);
    - the user said "Not now" to this same weekly training (`WeeklyWorkoutPlan.targetOfferDeclinedKcal`);
    - a TDEE shift under 50 kcal/day;
    - a safety floor holds the target where it is.
  - Otherwise it returns `{ currentKcal, proposedKcal, dailyTrainingKcal, weeklyTrainingKcal, nextPlan }`. `nextPlan` comes from `computePlan`, so the floors apply, and it keeps `region`, `recalibratedAt` and `formulaTdee` from the active plan.
- **"Not now" is remembered on the workout plan:**
  - `targetOfferDeclinedKcal` (workout-core) holds the weekly kcal the user turned down. `regeneratePlan` carries it through edits and Ramadan rebuilds.
  - `planActions.recordTargetOffer` saves and backs it up on Not now, and clears it on Update, so the answer holds across screens, reloads and devices.
- **`workout/ui/TargetUpdateSheet.tsx`:** the approved mockup sheet.
  - Flame icon, title and reason ("adds about N kcal a day", or "N kcal a day less training" when the target goes down).
  - The struck-through old target, an arrow that mirrors in RTL, and the new target.
  - "You can change this any time in Targets", then Not now and Update target.
  - `TargetUpdateSheetBody` renders without the Modal, for tests.
- **`WorkoutsScreen`:**
  - Setup and Edit plan compute the proposal after saving. Swaps, ladder climbs, the Ramadan switch, upgrades and sync restores never do.
  - The sheet sits on the week and day screens, so it waits behind "What we improved".
  - Update calls the new `onAcceptPlan`; both buttons record the answer on the plan.
- **`App.tsx`:** `acceptPlan(next)` (set, persist and sync the targets) is shared by the weekly check-in and Workouts.
- **Copy:** `workout.calories.*` in `en.json` and `ar.json`. The Arabic reason lines have a `_few` form (3–10 after the hundreds: "سعرات").

### Evidence

- `packages/nutrition-core/test/exercise.test.ts` (6 tests): the moved function gives the bridge's old numbers, plus the plan estimate and the adjust maths.
- `src/workout/__tests__/calorie-link.test.ts` (20 tests):
  - the segment rates (gym, home, easy and moderate cardio, a swapped interval, an old finisher);
  - the survey estimate is replaced, not added to, and the target can go down;
  - the 50 kcal threshold, guests, no targets, and no baseline;
  - after accepting, the same plan gives `null`. After "Not now", it asks again only when the training changes. A plan never answered is offered on its first save, even with nothing changed;
  - recalibration and region carry over;
  - the safety floor (1,200 kcal) holds, and a floor-held target gives `null`;
  - nothing during Ramadan;
  - the sheet in English (up and down) and Arabic, including the plural for 106 and 103.
- workout-core `generator.test.ts`: `regeneratePlan` keeps a declined offer.
- The existing survey, plan and check-in tests pass unchanged.
- `npm run build`, the key guard and `npm test` are green. Mobile has 81 files and 576 tests, workout-core 178 and nutrition-core 66.
- **Web, signed in to the phase 8 test account** (`talhatb466+nutrio-sync-…`). No new account was created. The survey was taken (gym 2 × 30 min, counted as 390 kcal/week), and maintenance accepted at 2,177 kcal. Then:
  1. Edit plan saved with nothing changed: no sheet, no `targets` request. **This was wrong.** The phase 8 plan had never been answered, so it should have been offered. That run used the first version, which skipped any save whose training matched the plan before it. Fixed and re-checked in steps 8 and 9.
  2. A fifth training day: the sheet shows "adds about 146 kcal a day", 2,177 → 2,323, matching the mockup.
  3. Not now: the sheet closes, the dashboard stays 2,177, and there's no `targets` request. Saving again unchanged doesn't ask.
  4. Days changed again: the sheet shows 2,177 → 2,283 (+106). Update target sends one `POST /rest/v1/targets`. The dashboard shows 2,283, and the stored plan has `tdee` 2283 and `trainingWeeklyKcal` 1130 ((1130 − 390) / 7 = 106).
  5. Saved again unchanged: no sheet. After a reload, and after a fresh sign-in with storage cleared, the dashboard still shows 2,283.
  6. Arabic (SA), adding a day: no sheet. This is correct: against the accepted 1,130 kcal/week the change is about 40 kcal/day, under the threshold. It also shows that `trainingWeeklyKcal` came back from the cloud after the storage-cleared sign-in; with the survey's 390 as the baseline it would have offered +146.
  7. Arabic, 75-minute sessions (first version): the RTL sheet shows "تضيف نحو 101 سعرة يومياً", with the struck-through 2,283 on the right, a mirrored arrow and 2,384. At 360 px there's no horizontal overflow and no clipped button. ليس الآن closes it with no `targets` request.
  8. After the fix (English, PK), the plan from step 7 saved unchanged: offered 2,283 → 2,384 (+101).
  9. Not now: one `POST workout_plans` (the stored plan has `targetOfferDeclinedKcal` 1840) and no write to `targets`. Saved unchanged again: no sheet. After a reload, saved unchanged: no sheet. The target stays 2,283.

### Known limits

- Re-running the goal wizard builds the plan from the survey again, so `trainingWeeklyKcal` and the training shift are dropped. The next workout-plan save offers it again, unless the user said Not now to that same training.
- Near a floor, the target can move much less than the training does (a 1,768 kcal BMR-floor cut stays near 1,768 for +146 kcal/day). The sheet still asks whenever the target moves at all.
