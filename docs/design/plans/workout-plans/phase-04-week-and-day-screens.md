# Phase 4: Week and day screens, Today card

**Size:** M · **Blocked by:** 3

> **Status: done 2026-10-23, not committed (waiting for the user's command).** See "Execution record" at the end.

## Outcome

The user sees the whole week as day cards, opens a day to see each exercise with its image loop, sets × reps and instructions, and sees today's workout on the dashboard.

## Tasks

1. **`apps/mobile/src/workout/weekView.ts`**, a pure function `buildWeekView(plan, todayKey, logs = [])`:
   - Week start comes from `weekStartFor(region)` in `workout/weekView.ts`: SA → Sunday, PK and any other region (global) → Monday. No other region checks anywhere in the feature.
   - Returns 7 `DayView` entries for the current calendar week (from `weekStartFor(region)`; see the design spec): `{ dateKey, weekday, kind: 'training' | 'rest', session?, status: 'planned' | 'today' | 'done' | 'missed' }`.
   - The screen opens on **today's workout**: a card listing every exercise (looping demo, "3 sets × 8–12", rest) with a Start workout button, above a "This week" heading and the day rows. No meal content (design spec §3.3).
   - `done` and `missed` need logs (phase 5). Until then, past training days in the current week show `planned`.
   - Also returns `weekIndex` (weeks since `plan.blockStart`), used for accessory rotation.
2. **`workout/ui/WorkoutWeekScreen.tsx`** replaces `WorkoutWeekList`:
   - Header: "Week N" and an "Edit plan" button that opens setup prefilled.
   - Training-day cards show the template title (`t('workout.template.upper')`), exercise count, estimated minutes and a status chip. Rest days are a compact row.
   - Today's card is highlighted.
3. **`workout/ui/WorkoutDayScreen.tsx`**:
   - Back header, session title, minutes.
   - Exercise rows show `ExerciseImageLoop` (56 px, loop paused while scrolling), the name in the current language, "3 × 8–12 · 90 s rest" and the RIR hint ("stop with 2 reps left").
   - Tapping a row opens the detail sheet. A finisher block appears when present.
   - A disabled "Start workout" button is wired up in phase 5.
4. **`workout/ui/ExerciseDetailSheet.tsx`**: a large image loop, instructions (numbered) and the muscles worked, both in the current language.
5. **`workout/ui/TodayWorkoutCard.tsx`** on the Today tab, after `StreakBadge`. It shows one of:
   - no plan → "Set up your workouts" (opens Workouts)
   - training day → title + exercise count + "Start" (opens that day)
   - rest day → "Rest day · next: Upper body on Thu"

   `TrackerDashboardScreen` gets a `workoutPlan` prop. `App.tsx` passes `loadWorkoutPlan()` and handles an `onOpenWorkoutDay(dateKey)` callback.
6. **Internal navigation.** `WorkoutsScreen` holds `selectedDateKey` state for the week → day view. Back from the day returns to the week, and Back from the week returns to the dashboard. If `navigation/history.ts` can't express this without a new route, keep it as local state, like the plan wizard does.
7. **i18n**: template titles, statuses, the Today-card strings, and rest/RIR formats, in both locales.

## Tests

- `src/workout/__tests__/week-view.test.ts`: the week starts Monday for PK and for an unknown/global region, and Sunday for SA; rest vs training days match `trainingDays`; `weekIndex` is correct across the block start and year boundary.
- `src/workout/__tests__/today-workout-card.test.ts`: renders each of the three states (same render approach as `tracker/__tests__/streak-badge.test.ts`).
- `src/tracker/__tests__/tracker-dashboard-integration.test.ts` (extend): the card appears and Start calls `onOpenWorkoutDay`.

## Verify

```bash
cd apps/mobile && npx vitest run src/workout src/tracker
npm test
```

## Demo

`npm run web`: dashboard card → day → detail sheet → back → week → back. Check the gym and home-no-equipment plans and Arabic RTL, at 360 px and at desktop width.

## Done when

Commit: `feat(workout): week and day screens with exercise demos and Today card`.

## Execution record (2026-10-23)

### What shipped

- **Logic:**
  - `workout/weekView.ts`: `weekStartFor`, `weekdayOf`, `buildWeekView`, `slotsForWeek` (swaps and rotation applied), `nextTrainingDay`
  - `workout/format.ts`: prescription, sets × reps, rest, effort hint and date text in both languages
- **Screens:**
  - `WorkoutWeekScreen`: today's workout listing every exercise (72 px demo, sets × reps, rest, Start), then "This week" with the summary card and day rows; a rest-day card names the next session
  - `WorkoutDayScreen`: 68 px demos (paused while scrolling), prescription, effort hint, finisher, and a held Start button with a "logging arrives next" note
  - `ExerciseDetailSheet`: demo, muscles, numbered steps
  - `TodayWorkoutCard`: setup / training with thumbnails / rest
  - `WorkoutHeader`: the shared header
- **Removed:** `WorkoutWeekList`.
- **App wiring:**
  - the dashboard card's Start opens Workouts straight on that day (`initialDayKey`); Back from the day goes to the week
  - guests' plans are loaded when they choose "Continue as guest", so the card reads them on phones too
- **i18n:** months, statuses, split names, today/week/day/detail/card text, with Arabic plurals for sets and reps-left.

### Changes from the plan

1. **Bigger demos:** 68 px on day rows and 72 px in the today list (the approved mockup sizes), instead of 56 px.
2. **No ⋯ options button yet.** Tapping a row opens the detail sheet. The options menu (swap / ask coach) arrives with phases 6 and 10, so there's no dead menu.
3. **Arabic rep ranges** are wrapped in left-to-right marks (`\u200e10–15\u200e`). Without them the range displayed as "15–10" inside Arabic text. Measured afterwards: "10" now renders left of "15".

### Verification evidence

| Check | Result |
|---|---|
| `cd apps/mobile && npx vitest run src/workout src/tracker src/i18n` | all pass (20 new: week view 12, screens and formatting 7, dashboard card 1) |
| `npm test` (whole repo) | 1,137 tests, 0 failures |
| `npm run build`, `npx tsc --noEmit` (apps/mobile), CI key guard | pass |
| **Web, end to end** (headless Chrome, real clicks) | 17 / 17 checks pass: the card invites setup; Workouts opens on today with sets × reps and rest; no meal content; the day screen shows prescription and effort with Start held; the detail sheet opens and its X closes it; Back day → week → dashboard; the card's Start opens the day; no overflow at 360 px; a home no-equipment plan uses bodyweight moves; the Saudi week starts on Sunday; the Arabic detail sheet |
| **iPhone 17 Pro Max simulator** | the week (today's list) and day screens render, via a temporary demo flag that was removed afterwards (`App.tsx` restored) |

### Found, not fixed (outside this phase)

The app's startup splash waits for the session check and the fonts with no timeout. In headless Chrome on a flaky connection, the font load sometimes stalled and the splash never cleared. A reload always recovered it. This was already in the app before the workout work. Logged as a follow-up in the plan README.
