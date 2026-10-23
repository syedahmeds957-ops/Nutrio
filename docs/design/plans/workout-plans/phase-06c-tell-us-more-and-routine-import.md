# Phase 6c: "Tell us more" setup and improving an existing routine

**Size:** L, built as three slices (6c-1, 6c-2, 6c-3) · **Blocked by:** 6b · Added 2026-10-23 at the user's request.

## Outcome

Setup can learn much more about the user, without forcing it:
- what they train now and how much they lift
- their cardio habits
- exercises they like and dislike
- other sports or physical days

Someone who already follows a routine enters it by picking from our exercise list. Nutrio keeps what works (their days, split and favourite exercises, where safe), fixes the gaps, and shows a "What we improved" list with one reason per change. Every number still comes from `workout-core`, and no model is involved.

## Decisions (user, 2026-10-23)

1. **Extra questions, all four**, in an optional fourth step "Tell us more" that can be skipped:
   - current training and lifts
   - cardio habits
   - likes and dislikes
   - other sports and activity
2. **Routine entry by picking from our catalogue:** search by English or Arabic name and common nicknames ("bench", "lat pull"). Offline and $0.
3. **"Keep it, fix the gaps":** keep their structure and favourites, change only what's off, and explain each change.
4. **Order:** right after 6b (cardio), before Ramadan (phase 7).

## Design first

Before 6c-1 is built, add mockups to the phase 0 design artifact (English and Arabic, light and dark) for approval:
- the "Tell us more" step
- the routine builder
- the lift entry
- the "What we improved" sheet

The same applies to 6b's cardio card and rest-day walk row. They are small, and are added to the same artifact before 6b's UI work.

## Slices

### 6c-1: "Tell us more" (settings, no routine yet)

1. **`WorkoutSettings` gains optional `profile`:**
   ```ts
   profile?: {
     trainingNow?: { daysPerWeek: number; split: 'full_body' | 'upper_lower' | 'ppl' | 'body_part' | 'classes' | 'other'; months: number };
     lifts?: { exerciseId: string; loadKg?: number; reps: number }[];   // e.g. bench 60 kg × 8, push-ups × 20
     cardio?: { minutesPerWeek: number; likes: CardioKind[] };          // walk, bike, run, rower, elliptical, stairs, swim
     likes?: string[]; dislikes?: string[];                              // exercise ids
     sports?: { name: string; days: Weekday[] }[];                       // football, cricket, padel, physical job...
   }
   ```
   The current plan version is kept, and old plans read fine without `profile`.
2. **Generator uses it:**
   - **Dislikes:** never picked, not even as alternates or swap candidates.
   - **Likes:** preferred when they fit a slot's pattern and are allowed.
   - **Cardio:** likes pick the cardio move.
   - **Cardio volume:** someone who already does 150+ min a week gets the larger block for their goal.
   - **Sports days:** no lower-body main lifts the day before or the day of; the session swaps day order where it can.
   - **Training now:** six months or more counts as at least "some" experience for volume. The question is asked, never assumed.
3. **Progression uses lifts:** a slot whose exercise has a logged current lift starts from it ("Start at your current 60 kg") instead of "pick a weight". New reason `from_current_lift`.
4. **UI:** the optional step 4 in `WorkoutSetupScreen`, with a "Skip for now" option. It is also reachable later from Edit plan.

### 6c-2: Routine builder

1. **`workout-core/routine.ts`:**
   - `ImportedRoutine { days: { day: Weekday; exerciseIds: string[]; sets?: number; reps?: number }[] }`.
   - Exercise search: `searchExercises(query, settings)` over EN/AR names plus an alias table (`curation/aliases.json`), restricted to exercises the user can do.
2. **UI:** "I already have a routine" in the "Tell us more" step. For each training day: add exercises by search, with optional sets × reps. The list is reorderable, with remove.

### 6c-3: Improve the routine

1. **`improveRoutine(routine, settings) → { plan: WeeklyWorkoutPlan; changes: RoutineChange[] }`** (pure, deterministic):
   - **Keeps:**
     - their training days
     - their split, mapped to our templates when it is one of ours; otherwise the closest split with the same number of days
     - their exercises as the slot's chosen exercise (stored as swaps), when the exercise is allowed and fits a slot's pattern
   - **Fixes, each change with a reason code:**
     - unsafe or unavailable exercises → replaced, using swap candidates (`replaced_unsafe`)
     - missing movement patterns (no pull, no hinge, no single-leg) → added (`added_missing_pattern`)
     - push/pull imbalance over 1.5 : 1 in weekly sets → pull work added (`balanced_push_pull`)
     - weekly sets per muscle group outside 10–20 (muscle goal) or the goal's range → sets adjusted (`adjusted_volume`)
     - the same muscle trained hard on back-to-back days → reordered (`spread_recovery`)
     - sessions longer than the chosen length → trimmed (`fit_time`)
     - rep ranges and rest set for the goal (`goal_reps`)
     - no cardio → cardio added (`added_cardio`)
     - lifts → starting weights (`from_current_lift`)
2. **UI:**
   - The "What we improved" sheet after building, grouped as kept / changed / added, each item with its reason in EN and AR.
   - The user can open the plan and still swap anything (phase 6).

## Tests

- `workout-core`:
  - Profile:
    - dislikes are never chosen in any slot, alternate or candidate
    - likes win ties
    - sports days move lower-body work
    - current lifts seed targets
    - old plans without `profile` still load
  - `searchExercises`: aliases and Arabic names; never returns unavailable moves.
  - `improveRoutine`, over a set of real-world routines (bro split, push-heavy beginner, legs every day, 90-minute sessions, unsafe moves with a protected knee, home user with gym exercises):
    - every change has a reason
    - the result passes the same grid checks as generated plans (safety, time, no duplicates)
    - a good routine comes back nearly unchanged
- Mobile:
  - step 4 renders and saves
  - skip works
  - the routine builder adds, removes and reorders
  - the improvements sheet lists the changes
  - Arabic
- Web end to end: a user enters a push-heavy routine and gets pull work added with a reason; the plan keeps their favourite exercise; RTL; 360 px.

## Verify

```bash
npm run build && npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
npm test
```

## Done when

Three commits, one per slice:
1. `feat(workout): tell-us-more setup step`
2. `feat(workout): routine builder`
3. `feat(workout): improve an existing routine`
