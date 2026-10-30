# Phase 8b: Guests explore workouts, they don't build or log

**Size:** S · **Blocked by:** 8 · **Added:** 2026-10-25, replacing decision D5 at the user's request ("guest mode is just to explore the app").

> **Status: done 2026-10-25, committed as `17704fa`.** Mockups (design canvas row "Guest preview: explore only") approved by the user the same day. See "Execution record" at the end.

## Outcome

A guest can look around Workouts but can't make or change anything:

- They see a **sample week** and today's sample session with every exercise, its demo images and its detail sheet, in English and Arabic.
- Every action that would create or change data opens the guest sign-up prompt that Weight and AI coach already use. That covers set up, start, do it today, edit plan, swap, reset, the Ramadan toggle and logging.
- Nothing is saved for guests and nothing is sent.

Signed-in users are unchanged.

## Tasks

1. **Sample plan** `src/workout/samplePlan.ts`:
   - `samplePlan(todayKey)` calls `generateWeeklyPlan` from workout-core with fixed beginner settings: home, no equipment, three days with today among them, 45 min, a fixed seed.
   - Pure and never saved. The same date always gives the same plan.
   - It works for every region, because the week start comes from `weekStartFor(region)`.
2. **`WorkoutsScreen` gets `isGuest`.** When it is set:
   - show the week from `samplePlan` with a banner: "Sample plan · Sign up to make it yours". Show no setup;
   - any action calls `onRequireAuth` and opens the existing guest prompt;
   - the day screen opens read-only, with no Start, no set logger and no options menu. The detail sheet still opens.
3. **Dashboard Today card:** for guests it shows the sample session. "Start" opens the prompt.
4. **`App.tsx`:** `onExploreGuest` stops hydrating guest workout storage, and guests never read the `guest` workout keys. Any plan a guest made before this change stays on the device, unread. It isn't deleted, because deleting is a separate decision.
5. **i18n:** banner and prompt copy in `en.json` and `ar.json` under `workout.guest.*`.
6. **Mockup first**, like 6b and 6c: the guest week (banner) and the read-only day screen, in English and Arabic, approved before building.

## Tests

- `src/workout/__tests__/guest-preview.test.ts`:
  - the sample plan is deterministic and includes today;
  - the guest week renders the banner and no setup;
  - each action calls `onRequireAuth` and writes nothing to storage;
  - the day screen has no Start and no logger;
  - PK, SA and the default region each get the right week start.
- Update the tests that drove a guest through setup (`workout-setup`, `logging-flow`, and others) to sign in first, or move them to signed-in sessions.

## Verify

```bash
cd apps/mobile && npx vitest run src/workout
npm run build && npm test
```

## Demo

As a guest on web, at 390 and 360 px, in English and Arabic:

- the sample week and the day's exercises show;
- set up, start, swap and edit each open the sign-up prompt;
- local storage gains no `nutrio_workout_*` key;
- there are no `workout_*` requests.

Signed in, everything works as before.

## Open question for the user

Does "guest mode is just to explore" cover the **whole app**? Today guests can also log meals, water and staples on the device. If it does, that is a separate phase outside the workout plan.

## Done when

Commit: `feat(workout): guests preview a sample week; building and logging need an account`.

## Execution record (2026-10-25)

### What shipped

- **`src/workout/samplePlan.ts`:**
  - `samplePlan(todayKey)` builds a beginner home plan with no equipment, 45 min sessions and a fixed seed, using the real generator.
  - The training days are today, +2 and +4 (`sampleDays`), so today always has a session in every region.
  - The plan is never saved.
- **`WorkoutsScreen`:**
  - `isGuest` routes guests to a small `GuestWorkouts` component, so the signed-in path and its hooks are untouched.
  - `GuestWorkouts` never reads or writes storage.
  - It shows the sample week and its days. Edit plan, Start, Do it today and the day screen's button open the guest prompt (`GuestAuthModal`, which now takes an optional title and description). **Sign in / Register** goes to sign-in.
- **`WorkoutWeekScreen` with `onRequireAccount`:**
  - the "This is a sample plan" card, with Create free account and I have an account;
  - no Edit plan; "SAMPLE WEEK" and "3 workouts a week" in place of the week number and done count;
  - Start workout opens the prompt;
  - no status chip on earlier days, and nothing done or missed;
  - no Ramadan switch.
- **`WorkoutDayScreen` with `onRequireAccount`:**
  - read-only, with no draft, no options buttons and no Swap in the detail sheet;
  - the bottom bar shows the sample note and **Create an account to start**.
- **Dashboard:** the Today's workout card gets a **Sample** tag, and Start opens the workout prompt.
- **`App.tsx`:**
  - guests get `samplePlan` on the dashboard and `isGuest` on Workouts;
  - `onExploreGuest` no longer hydrates guest workout storage.
- **Copy:** `workout.guest.*` in `en.json` and `ar.json`, including the Arabic plural forms. There is also a new `eye` icon (Phosphor `Eye`) with its test stub.

### Change from the mockup

- Create free account and I have an account sit **stacked full width**, not side by side. Side by side, at 360–390 px the labels wrapped onto two lines inside their pills.

### Evidence

- `src/workout/__tests__/guest-preview.test.ts` has 11 tests:
  - the sample is deterministic and has a session today, with week starts for PK, SA and the default region;
  - the week and day render in guest and signed-in modes, in English and Arabic;
  - the guest route never shows a plan stored on the device and writes nothing.
  - A mutation check (sending guests down the signed-in path) turns that last test red.
- `npm run build`, the key guard and `npm test` are green. Mobile has 79 files and 554 tests.
- **Web, as a guest: 20 / 20 pass.**
  - Sample tag and dashboard Start → prompt → Continue exploring closes it.
  - Week: banner, SAMPLE WEEK, no Edit plan, nothing missed. Start workout → prompt.
  - Day: read-only, with no options. The details sheet opens without Swap. Create an account to start → prompt → Sign in / Register reaches sign-in.
  - No `nutrio_workout*` key in local storage, and no `workout_*` request among the 48 made.
  - No overflow at 360 px.
  - Arabic (SA): tag, banner, prompt, read-only day.
- Signed-in behaviour is covered by the existing tests plus the new signed-in render checks. No signed-in web run was done, so no new test accounts were created.
