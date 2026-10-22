# Phase 8: Cloud sync

**Size:** M · **Blocked by:** 5 · Ends at **Checkpoint B**. **Needs you:** OK to apply the migration to the live project.

## Outcome

A signed-in user's workout plan and logs back up to Supabase and restore on another device. Guests never touch the network. A sync failure never blocks the app.

## Tasks

1. **Read first:** `supabase/migrations/20260921000000_activity_logs_and_core_exposure.sql`, to copy its exact `user_id` reference, RLS policy and grants, and `src/sync/__tests__` for how activity sync is tested.
2. **Migration** `supabase/migrations/<timestamp>_workout_plans_and_logs.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS core.workout_plans (
     user_id UUID PRIMARY KEY REFERENCES <same target as activity_logs.user_id> ON DELETE CASCADE,
     plan JSONB NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE TABLE IF NOT EXISTS core.workout_logs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES <same> ON DELETE CASCADE,
     log_date DATE NOT NULL,
     logs JSONB NOT NULL DEFAULT '[]'::jsonb,   -- that day's WorkoutLog[]
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (user_id, log_date)
   );
   -- RLS enabled + "users manage own rows" policies and grants, copied from activity_logs
   ```
3. **`apps/mobile/src/sync/workoutSync.ts`**, mirroring `activitySync.ts`:
   - `pushWorkoutPlan(plan)`, `fetchWorkoutPlan()`, `pushWorkoutLogs(dateKey, logs)` and `fetchWorkoutLogs(limit = 120)`.
   - All return early for guests or unconfigured Supabase.
   - Errors are logged and returned, never thrown.
4. **Wiring:**
   - `saveWorkoutPlan` and `saveWorkoutLog` fire a push when signed in (not awaited, like activity).
   - On sign-in hydrate in `App.tsx`, after the local hydrate: fetch the cloud plan and logs. The plan takes whichever copy has the newer `updated_at` versus the local `createdAt`/save time; logs merge by `dateKey + template`, newest `finishedAt` wins.
   - Wrapped in `recoverWith('Restoring workouts', undefined)`.
5. **Apply.** After you OK it, apply the migration with the Supabase MCP `apply_migration`, then run `get_advisors` (security) and fix anything it flags about the new tables.

## Tests

- `src/sync/__tests__/workout-sync.test.ts`: guest → no calls; push shapes the row correctly (`onConflict`); fetch maps rows back; Supabase errors return `success: false`.
- `src/workout/__tests__/workout-merge.test.ts`: the plan-newest-wins and log-merge rules.

## Verify

```bash
cd apps/mobile && npx vitest run src/sync src/workout
npm test
# after applying: Supabase advisors show no new security warnings for core.workout_*
```

## Checkpoint B demo

Sign in on web in two browsers: create a plan and log a session in one, reload the other, and both show the same week and done state. As a guest, the network tab shows no `workout_*` requests.

## Done when

Commit: `feat(workout): sync workout plans and logs to Supabase`.
