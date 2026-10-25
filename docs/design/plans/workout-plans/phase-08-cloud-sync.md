# Phase 8: Cloud sync

**Size:** M · **Blocked by:** 5 · Ends at **Checkpoint B**. **Needs you:** OK to apply the migration to the live project.

> **Status: done 2026-10-25: tests green, migration applied, Checkpoint B 12/12 on web. Committed as `70b79f8`.** See "Execution record" at the end.

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

## Execution record (2026-10-25)

### What shipped

- **Migration** `supabase/migrations/20261025000000_workout_plans_and_logs.sql`: `core.workout_plans` (one row per user) and `core.workout_logs` (one row per user and date), both referencing `core.profiles(id)` like `activity_logs`.
  - RLS on both, one "users manage own rows" policy each, for `authenticated` only, with `(SELECT auth.uid())` so the advisors don't flag a per-row call.
  - Explicit grants to `authenticated`, nothing for `anon`. The 0921 migration's `GRANT SELECT … TO anon` was not copied.
  - **Applied 2026-10-25** with `supabase db push --linked` from this worktree, after a dry run listed only this file. It is recorded as version `20261025000000`, the same as the filename, like every earlier migration. A query confirmed RLS is on for both tables, each has one policy for `authenticated`, and `anon` has no grants. The security and performance advisors show the same findings as before the push, and none of them mention `workout_*`.
- **workout-core:** `WeeklyWorkoutPlan.updatedAt?`, the time the user last changed the plan. `upgradePlan` and `planForDate` keep it, as they keep `createdAt`. Tests are extended in `cardio.test.ts` and `ramadan.test.ts`.
- **`src/sync/workoutSync.ts`:**
  - `pushWorkoutPlan`, `pushWorkoutLogs(days)`, `fetchWorkoutPlan`, `fetchWorkoutLogs(since)`.
  - `fetchWorkoutBackup` and `applyWorkoutBackup` for the restore.
  - Guests and an unconfigured backend return before any request. Errors are logged and returned, never thrown.
- **`src/workout/workoutMerge.ts`** (pure):
  - `pickWorkoutPlan`: the newer save wins, compared as instants because Postgres returns `+00:00` and the device writes `Z`.
  - `mergeWorkoutLogs`: workout by workout on `dateKey + day`, the one finished last wins, the one-year cutoff applies, and it returns the dates the cloud lacks.
- **Storage:**
  - `planFromBackup` and `logsFromBackup` validate cloud data the same way as stored data, including the upgrade and the Ramadan date check.
  - `replaceWorkoutLogs` writes a merged set.
  - `loggedAt`, `sameWorkout`, `keptSince` and `newestFirst` are exported so the merge and storage share one definition of "the same workout".
- **`planActions.ts`:** create, edit, record, swap and reset go through `commitPlan`, which stamps `updatedAt`, saves, and pushes without awaiting. `recordWorkout` pushes that date's logs.
- **`App.tsx`:**
  - `restoreUserData` starts `fetchWorkoutBackup()` alongside the existing cloud restore, then merges after the local hydrate.
  - The merge is wrapped in `withTimeout(…, CLOUD_TIMEOUT_MS)` and `recoverWith('Restoring workouts')`.
  - A late backup still merges when it lands, and is dropped if the user signed out or switched account meanwhile.
  - Its time limit counts from when the fetch starts, so on a stalled network the sign-in spinner doesn't wait an extra 8 s after the other cloud steps.

### Changes from the written plan

- **Pushes fire from `planActions`, not from `saveWorkoutPlan`/`saveWorkoutLog`.** Storage also re-saves during render (the Ramadan catch-up in `loadWorkoutPlan`), on upgrade and on hydrate. Pushing there would mean network calls in render, an echo push of every restored plan, and automatic rebuilds looking like new edits.
- **The plan's save time is a new `updatedAt` field, and it is sent as the row's `updated_at`.** `createdAt` never moves on swaps, climbs or Ramadan rebuilds, so comparing it with the cloud would lose edits. Sending the device's own save time means both sides of the comparison come from the same clock.
- **Logs merge on `dateKey + day`, not `dateKey + template`.** This matches storage. Upper A and Upper B share a template, and a missed session done later lands on the same date as that day's own session.
- **`pushWorkoutLogs` takes a list of days and sends one upsert.** The first sign-in after this ships may need to back up many days at once.
- **`fetchWorkoutLogs(since)` fetches the year the device keeps, not the last 120 rows.** Otherwise older local days would look missing from the cloud and be pushed again on every sign-in.
- **A side whose fetch failed is left alone.** Otherwise a network error would make the device copy look newer and overwrite the cloud.

### Evidence

- `npx vitest run src/sync src/workout` (in `apps/mobile`): 17 files, 144 tests passed. The new files are `workout-sync.test.ts` (11 tests) and `workout-merge.test.ts` (8 tests).
- A mutation check confirmed that removing the account-switch guard or the failed-fetch guard turns their tests red.
- `npm run build`, `node scripts/check-ci-keys.mjs` and `npm test` are green. Mobile has 78 files and 543 tests, workout-core 177.

### Checkpoint B (web, 2026-10-25)

The run used two headless Chrome profiles (separate storage) against the live project, with a fresh test account signed up for the run (`talhatb466+nutrio-sync-…@gmail.com`). Two browsers on the same machine share one clock, which matches two phones that both keep network time. **12 / 12 pass**:

| Check | Result |
|---|---|
| A signs up, skips the survey, creates a plan; the plan is pushed to `workout_plans` | PASS |
| B signs in: a plan is there (no setup prompt), with the same week summary and the same exercises today | PASS ×3 |
| B swaps today's cardio (Stair machine → Elliptical trainer) | PASS |
| A, still on its older plan, reloads and takes B's newer swap | PASS ×2 |
| A logs today's session plus a missed Monday "done today" (2 of 4 done); logs pushed | PASS ×2 |
| B reloads and shows both sessions | PASS |
| A guest sets up a plan and logs a workout with zero `workout_*` requests among the 36 it made | PASS |
| SQL: one `workout_plans` row, `updated_at = plan->>'updatedAt'`, the swap in `swaps`; one `workout_logs` row for 2026-10-25 holding both sessions (`mon`, `sun`) | PASS |

Script fixes during the run were selectors only (the auth tabs are `tabindex` divs, the "Tell us more" step, "Do it today" starts the session directly). Earlier attempts that stopped part-way through left three more test accounts. All four are `talhatb466+nutrio-sync-*`.

### Still to do

1. ~~Apply the migration~~ Done (see above).
2. ~~Checkpoint B~~ Done (see below).
3. Commit, when the user says so.
