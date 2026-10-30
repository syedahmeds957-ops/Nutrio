# Phase 6c: "Tell us more" setup and improving an existing routine

**Size:** L, built as three slices (6c-1, 6c-2, 6c-3) · **Blocked by:** 6b · Added 2026-10-23 at the user's request.

> **Status: done 2026-10-23 (all three slices), not committed.** Mockups approved the same day. See "Execution record" at the end.

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

## Execution record (2026-10-23)

### Decisions added during the build (user)

1. **The questions follow earlier answers.**
   - **Beginners** ("New to training") get simple checks instead of weights: trained before?, push-ups in a row, plank hold, how long they can walk briskly, and "leave out jumping".
   - **"I used to train regularly"** offers a switch to "Some experience".
   - **People training now** get days, routine type, how long, and current lifts.
   - **"Not right now"** asks how long since they last trained. Their lifts become "What you used to lift", and they restart 10–20% lighter.
   - **Steps 2 and 3** add beginner hints: 2–3 days, 30–45 min, and machines first in a gym.
   - Mockups for the beginner and returning versions were added to the design page.
2. **Cardio is asked per day** ("On a typical day, how much cardio do you do?"), not per week. Half an hour a day or more gets the next-size cardio block.

### 6c-1 shipped

- **workout-core:**
  - `TrainingProfile` on `WorkoutSettings` (all optional).
  - Dislikes are excluded everywhere (`isAllowed`); likes and lifted exercises win ties; "avoid jumping" drops high-impact moves.
  - Few push-ups start pushing on an easier variation.
  - Cardio: liked kinds first; daily habit or walking time sizes the block; under 10 min of walking caps it at 5.
  - Sports days rotate the split so leg sessions miss the sport day and the day before; on unavoidable full-body days the leg main lifts get the lighter accessory prescription.
  - Over a year of training gives "some" volume.
  - `nextTarget` starts from a current lift (Epley estimate down to the slot's range, rounded to a real step or owned dumbbell), from push-up and plank checks, and lighter after a break (reason `from_current_lift`, with a "back after a break" variant).
  - `searchExercises` covers English and Arabic names plus nicknames ("ohp", "rdl", "بنش", "سكوات") and normalises Arabic.
- **Mobile:**
  - Setup steps 4–6, "Tell us more", each with "Skip for now". The questions branch by experience and by training now / not now.
  - Lift rows by equipment, with typeable weight and reps.
  - Likes and dislikes with an `ExercisePickerSheet` (search).
  - Sports with a day picker per sport.
  - `profileForSave` keeps only the user's own branch and drops blanks.
  - The shared `SetupChips`.
  - English and Arabic for everything.

### Verification evidence (6c-1)

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 154 pass (20 new in `profile.test.ts`) |
| `cd apps/mobile && npx vitest run src/workout` | all pass (13 new in `tell-us-more.test.ts`: setup rules, each branch's questions, picker, a lift reaching the day screen) |
| `npm test` (whole repo) | all pass |
| **Web, end to end** | 18 / 18 pass. Beginner: hints, simple checks, walking and avoid-jumping, sport days, an easier push move, 5 min cardio. Trained: "Are you training now?", lifts typed in, cardio per day, the bench press shows "From your current lift: 60 kg × 8" (found and fixed on web: a lift alone did not keep the exercise in the plan; lifts now count like likes), bike cardio for cycling. Returning: "What you used to lift". Skip for now; "I used to train regularly" switch; 360 px; Arabic. |

### 6c-2 and 6c-3 shipped (routine builder, and improving the routine)

- **workout-core `routine.ts`:**
  - The routine lives in `profile.routine`, so every regeneration (Edit plan) keeps it, with no separate import to fall out of date.
  - `layoutForRoutine` classifies each day (push, pull, legs, upper or full body) from its exercises and keeps that structure when it trains every group.
    - If the week leaves pushing, pulling or legs out, it uses our balanced split instead (`rebalanced`).
    - Push-only days outnumbering pull-only days (a chest day plus an arms day) turn the surplus into upper-body days.
    - It reorders days to avoid the same muscles on back-to-back days and leg sessions on or before sports days, moving as few days as it can.
  - `pickExercise` takes the user's own exercise for that day first when it fits a slot.
  - `describeRoutineChanges` lists every difference with what it was and is now:
    - kept days and exercises;
    - replaced moves, each with its own replacement (a related movement when the same one isn't safe) and a reason: equipment, joint, level, jumping or dislike;
    - moves left out for time;
    - rebalanced split; moved days;
    - push/pull balance (only claimed when the plan really is balanced);
    - weekly sets per muscle outside the goal's range;
    - reps for the goal; cardio added; starting weights from lifts.
- **Mobile:**
  - `RoutineBuilder` opens from "Tell us more" for people training now:
    - days, a tab per day, exercises from the picker with optional sets × reps;
    - move up/down, remove, "Clear my routine";
    - "Improve my routine" waits for 2–6 days that each have an exercise.
  - Saving sets the training days from the routine. `ImprovedScreen` ("What we improved": kept / changed / added, one reason per line) appears once after the plan is made, then "See my plan".
- **Change from the mockup:** move up/down buttons instead of drag-to-reorder. They work with screen readers and keyboards; drag can be added later.

### Verification evidence (6c-2, 6c-3)

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 165 pass. `routine.test.ts` (11) covers: a body-part split kept (days, most exercises), through an edit; push-only and legs-every-day weeks rebalanced with what was missing; a 90-minute day trimmed with what was left out; knee-loading moves replaced with the joint reason and a named replacement; gym moves for a home user replaced for equipment; a good routine comes back nearly unchanged; leg day moved off the day before cricket; push surplus becomes an upper day; no replacement named twice. Every plan passes the safety, time and no-duplicate checks. |
| `cd apps/mobile && npx vitest run src/workout` | 101 pass (7 new in `routine-builder.test.ts`) |
| `npm test` (whole repo) | 1,282 tests, 0 failures |
| **Web, end to end** | Builder 13 / 13 pass: opened from "Tell us more", Improve held then ready, four days with search-added exercises and sets × reps, "What we improved" keeps days and exercises and adds cardio, the week uses their days, Monday keeps the bench and incline press, the routine stays through Edit, knees protected → squat replaced with the reason, 360 px, Arabic. "Tell us more" 18 / 18 still pass. Two issues were found on screen and fixed: the same replacement was named for two moves, and the push/pull line claimed balance for a push-heavy result. |
