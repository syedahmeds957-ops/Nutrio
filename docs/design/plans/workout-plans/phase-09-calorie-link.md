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
