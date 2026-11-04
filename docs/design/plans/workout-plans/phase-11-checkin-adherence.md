# Phase 11: Weekly check-in shows training

**Size:** S · **Blocked by:** 5

## Outcome

The weekly check-in shows how many planned workouts were done. It's informational only and doesn't change the calorie maths.

## Tasks

1. `apps/mobile/src/coach/weeklyCheckIn.ts`: `WeeklyCheckInInput` gains optional `workouts?: { plan: WeeklyWorkoutPlan; logs: WorkoutLog[] }`, and `WeeklyCheckInResult.metrics` gains optional `training?: { planned: number; done: number }`, counted over the same window the check-in already uses.
2. `App.tsx` passes `loadWorkoutPlan()` and `loadWorkoutLogs()` when a plan exists.
3. `coach/ui/WeeklyCheckInScreen.tsx`: a "Workouts: 3 of 4" row with a small progress bar, shown only when `training` is present.
4. i18n in both locales.

## Tests

- `src/coach/__tests__/weekly-checkin-builder.test.ts` (extend): counts over the window; no plan → no `training`; the calorie status and proposed plan are unchanged with or without workouts.

## Verify

```bash
cd apps/mobile && npx vitest run src/coach
npm test
```

## Done when

Commit: `feat(checkin): show weekly workout adherence`. Then archive this plan folder with an execution record (what shipped, deviations, evidence).

## Execution record (2026-10-25)

### Decision (user, 2026-10-25)

**Days before a workout plan was created count only if their session was done, and are never "Missed". This applies on both the check-in and the Workouts week.**
- The web run showed the problem. The Workouts week marked days before the plan existed as Missed ("1 of 5"), while the first check-in build skipped them ("0 of 1").
- This changes phase 4's week view, for the same reason.

### What shipped

- **`workout/weekView.ts`:**
  - `weekStartKeyFor(dateKey, region)` is now shared by the week view and the check-in.
  - `trainingInWindow(plan, logs, from, today, region)` returns `{ planned, done, missed }`, or null when no session counts.
    - It uses the week view's rule: a session is done once it has a log in its own calendar week (in the region's numbering), on any day up to today.
    - Days before `blockStart` (the plan's creation date) count only when done.
    - Today's undone session is planned but not missed.
  - `buildWeekView`: a day before the plan began is never missed, and counts in "x of y workouts done" only when its session was done.
- **`WorkoutWeekScreen`:** an earlier day that's neither done nor missed has no chip. The guest sample's "N workouts a week" now reads the plan's session count, so the new rule can't change it.
- **`coach/weeklyCheckIn.ts`:**
  - `workouts?: { plan, logs, region }` gives `metrics.training` over the check-in's own 7 days.
  - It is display only: status, proposed plan and every other metric are unchanged (tested deep-equal).
- **`coach/ui/TrainingCard.tsx`:** the mockup's Workouts card.
  - A lime border, dumbbell icon, "3 of 4", and one bar segment per planned session (`role="progressbar"` with `aria-value*`).
  - "Missed: Lower body B, …" joins the names with a translated separator ("، " in Arabic).
  - It sits below the 7-day stats and is shown only when `training` is present.
- **`App.tsx`:** the check-in gets the stored workout plan, logs and region when a plan exists.
- **Copy:**
  - `checkin.workouts.*` in both locales.
  - The hard-coded English "7-Day Progress Stats" heading above the card is now `checkin.progressStats` ("إحصاءات آخر 7 أيام").

### Evidence

- `weekly-checkin-builder.test.ts`, 6 new tests:
  - the week's sessions, with today's not missed;
  - a late "Do it today" credited, and next week's session started early not credited;
  - the region's week for SA, PK, unset and AE;
  - logs after today ignored, and pre-plan days counted only when done;
  - nothing without a plan or with no session in the window;
  - the calorie maths is identical with and without workouts.
- `week-view.test.ts`: 2 new tests. A pre-plan day is planned, not missed, and counts only when done, in the week and in `trainingInWindow`.
- `training-card.test.ts`: 3 tests. The value, segments, missed line, and Arabic with "، ".
- `npm run build`, the key guard and `npm test` are green. Mobile has 84 files and 609 tests.
- **Web, on the test account.** The plan was created today, Sunday 25 October. Its logs: Monday's session done today, and an older Sunday session.
  - PK: the check-in card shows "Workouts 1 of 2" (Monday done via "Do it today", plus today's session). The Workouts week now agrees, with "1 of 2 workouts done" and no Missed chips. Before the decision it showed "1 of 5" with three Missed.
  - SA (Arabic): "التمارين 0 من 1". In a Sunday-start week, Monday 19's session done on Sunday 25 falls in a different week, so it isn't credited. The heading is translated, RTL is correct, and nothing overflows at 360 px.
  - Metro didn't pick up the edits until it was restarted with `--clear`; the numbers above are from the rebuilt bundle.

### Plan folder

User, 2026-10-25: keep `docs/design/plans/workout-plans/` where it is, like the other finished plans, with its Status marked complete. It isn't moved to `docs/archive`, which holds dropped work.
