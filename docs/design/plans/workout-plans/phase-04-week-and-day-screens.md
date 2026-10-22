# Phase 4: Week and day screens, Today card

**Size:** M · **Blocked by:** 3

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
