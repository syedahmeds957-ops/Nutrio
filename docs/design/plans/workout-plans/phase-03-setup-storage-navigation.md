# Phase 3: Setup screen, storage, navigation

**Size:** M · **Blocked by:** 0 (approved designs), 2 · Screens are built to match the Phase 0 mockups.

## Outcome

A "Workouts" pill on the dashboard opens a 3-step setup the first time, prefilled from the survey. Saving generates the plan, stores it on the device and shows a plain list of the week's sessions (phase 4 makes it look right). The plan survives a reload and is cleared on logout.

## Tasks

1. **`apps/mobile/src/workout/workoutStorage.ts`**, mirroring `weight/weightStorage.ts`:
   - key `nutrio_workout_plan_<userId|guest>`
   - functions `loadWorkoutPlan(): WeeklyWorkoutPlan | null` (sync), `saveWorkoutPlan(plan)`, `clearWorkoutPlan()`, `hydrateWorkoutPlan()` and `releaseWorkoutCache()`
   - writes through the same `enqueueDurable` + `authStorageAdapter` pattern
   - parse failures return `null`, never throw
2. **`apps/mobile/src/workout/settingsFromSurvey.ts`**, a pure function `defaultWorkoutSettings({ survey?, plan? }): WorkoutSettings`:
   - Goal from `plan.goalSelection.goal`: `lose → fat_loss`, `gain → muscle`, `maintain → general`; no plan → `general`.
   - Location from `survey.exercise.trainingType`: `gym_resistance → gym`; everything else → `home_none`.
   - Days: `frequencyDaysPerWeek` clamped to 2–6, spread by a fixed pattern (2: mon/thu; 3: mon/wed/fri; 4: mon/tue/thu/fri; 5: mon–fri; 6: mon–sat). Missing → 3.
   - `sessionDurationMins` snaps to the nearest of 20/30/45/60/75 (default 45).
   - Experience: `none` training or `light` intensity → `new`; otherwise `some`. Never infer `experienced`.
   - `lowIntensity` = pregnant/breastfeeding, or `hypertension` in `medicalConditions`.
   - `ramadan.enabled = false` (phase 7 adds the toggle).
3. **Route.** Add `'workouts'` to `AppRoute` in `src/navigation/planFlowRouting.ts`. In `App.tsx`:
   - render `<WorkoutsScreen>` for the route
   - add `hydrateWorkoutPlan()` to the boot `Promise.all` with `recoverWith('Restoring workout plan', undefined)`
   - add `releaseWorkoutCache()` to `onLogout`
   - pass `onOpenWorkouts={() => applyDestination({ route: 'workouts' })}` to the dashboard
4. **Dashboard pill.** In `TrackerDashboardScreen.tsx`, add an `onOpenWorkouts` prop and a pill after Meals using `Icon name="dumbbell"` and `t('tracker.dashboard.nav.workouts')`. It isn't guest-gated. Check the 5-pill row at 360 px width; if it clips, make the row horizontally scrollable rather than shrinking the text.
5. **`workout/ui/WorkoutsScreen.tsx`** (container): no plan → `WorkoutSetupScreen`; plan → `WorkoutWeekList`, a minimal list of day + template + exercise names, replaced in phase 4. Has a back header.
6. **`workout/ui/WorkoutSetupScreen.tsx`**, 3 steps in the survey's visual style (reuse the `ui/` primitives the survey steps use):
   - Step 1: goal, then experience.
   - Step 2: where you train. Home-with-equipment shows equipment chips (dumbbells, bands, kettlebell, bench, pull-up bar). Dumbbells shows a weight chip picker (2–30 kg in 2 kg steps, plus "adjustable").
   - Step 3: training days (weekday chips, 2–6 required), session length, focus (optional), areas to protect (optional).
   - The low-intensity note appears when `lowIntensity` is true.
   - Home-no-equipment shows the "a band unlocks pulling work" tip.
   - Save → `generateWeeklyPlan(settings, { seed: Date.now() % 2**31, today: localDateKey() })` → `saveWorkoutPlan`.
   - An "Edit plan" entry (used in phase 4) reopens it prefilled from `plan.settings` and saves through `regeneratePlan`.
7. **i18n.** Add a `workout` namespace (setup labels, options, templates, pattern names, notes, errors) plus `tracker.dashboard.nav.workouts` to **both** `en.json` and `ar.json`. Exercise names and instructions come from the catalogue, not i18n.

## Tests

- `src/workout/__tests__/workout-persistence.test.ts`: save → module reload → load is equal; two user scopes don't see each other's plan; `releaseWorkoutCache` clears memory; corrupt JSON → `null`.
- `src/workout/__tests__/settings-from-survey.test.ts`: each mapping rule above, including no survey and no plan.
- `src/__tests__/app-navigation-flow.test.ts` (extend): the Workouts pill opens `'workouts'`, Back returns to the dashboard, and a guest can open it.
- `src/workout/__tests__/workout-setup.test.ts`: Save is disabled with fewer than 2 days; saving stores a plan whose settings match the answers.
- i18n parity: if `src/i18n/__tests__` has a key-parity test it covers the new keys; otherwise add one for the `workout` namespace.

## Verify

```bash
npm run build
cd apps/mobile && npx vitest run src/workout src/__tests__
npm test
```

## Demo

`npm run web` as a guest and as a signed-in user: dashboard → Workouts → setup → week list → reload (plan still there) → log out and in as another account (no plan). Repeat in Arabic and check RTL.

## Done when

Commit: `feat(workout): setup flow, local storage and Workouts entry point`.
