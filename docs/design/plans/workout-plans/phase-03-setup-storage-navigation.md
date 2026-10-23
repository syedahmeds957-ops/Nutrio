# Phase 3: Setup screen, storage, navigation

**Size:** M · **Blocked by:** 0 (approved designs), 2 · Screens are built to match the Phase 0 mockups.

> **Status: done 2026-10-23, not committed (waiting for the user's command).** See "Execution record" at the end.

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

## Execution record (2026-10-23)

### What shipped

- **Logic:**
  - `workout/workoutStorage.ts` (+ `flushWorkoutWrites` for tests)
  - `workout/settingsFromSurvey.ts`
  - `workout/setupState.ts`: step rules, toggles, save/edit mapping
  - `workout/planActions.ts`: create / update + save
  - `workout/sessionTitle.ts`
- **Screens:**
  - `workout/ui/WorkoutsScreen.tsx`: loads the plan itself, so guests' plans load on phones too
  - `WorkoutSetupScreen.tsx`
  - `WorkoutWeekList.tsx`: plain list, replaced in phase 4
- **Navigation:** the `'workouts'` route, wired into App boot hydration, logout, the back-swipe list and the dashboard.
- **Dashboard:** a Workouts pill with a "New" badge. The nav row is now a horizontal scroll of content-width, 44 px pills.
- **i18n:** a `workout` namespace in `en.json` and `ar.json`, with Arabic plural forms for days, exercises and minutes, plus `tracker.dashboard.nav.workouts`.
- **Theme contrast fixes** (design spec §2): light `textSecondary` `#556275`, dark `floatingBarInactive` `#9CA3AF`.
- **Icon:** a `building` icon (Phosphor Buildings), plus its test stub.

### Changes from the plan

1. **"Filled in from your survey" note** shows only when survey answers exist (`prefilled` prop). Guests have no survey, and the first build showed the note to them.
2. **Setup screen tests** render with `react-dom/server` through react-native-web, a first for this app's UI tests. `@types/react-dom` isn't installed, so `apps/mobile/test/react-dom-server.d.ts` declares the one function used. No dependency was added.
3. **"Adjustable" dumbbells** are picked as `0` during setup and saved as no fixed weights, because the generator rejects 0 kg. `settingsForEdit` turns that back into "adjustable" when editing.
4. **Ramadan toggle:** not added. It belongs to phase 7, as planned.

### Verification evidence

| Check | Result |
|---|---|
| `cd apps/mobile && npx vitest run src/workout src/__tests__` | all pass (26 new: storage 7, survey defaults 7, setup 8, navigation 1, guest pill 1, rendering 2) |
| `npm test` (whole repo) | 1,117 tests, 0 failures |
| `npm run build`, `npx tsc --noEmit` (apps/mobile), CI key guard | pass |
| **Web, end to end** (headless Chrome driven by real clicks over the DevTools protocol): guest → Workouts → 3 steps → plan → reload → Arabic | 13 / 13 checks pass: the pill and "New" badge; step 1 of 3; the dumbbell picker; one day shows "Pick at least 2 days" with the button disabled; the plan is saved under the guest key; it survives a reload; Arabic titles and setup copy |
| **iPhone 17 Pro Max simulator** | the dashboard shows the Workouts pill in the scrolling row (signed-in session); the setup step 1 and saved-week screens render, via a temporary demo flag that was removed afterwards (`App.tsx` restored) |
