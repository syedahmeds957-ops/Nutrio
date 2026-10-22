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
