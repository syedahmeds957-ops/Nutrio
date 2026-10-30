# Phase 6b: Cardio block and rest-day walks

**Size:** M · **Blocked by:** 5, 6 · Added 2026-10-23 at the user's request ("there is no cardio in the plan").

> **Status: done 2026-10-23, not committed (waiting for the user's command).** Mockups approved the same day. See "Execution record" at the end.

## Outcome

Every training session ends with a steady cardio block sized to the user's goal, inside the session length they picked. Rest days suggest an optional walk. Cardio is logged in minutes, can be swapped like any exercise, and works for home and gym, every region, English and Arabic.

## Decisions (user, 2026-10-23)

- **Shape:** a cardio block at the end of every session, plus an optional 20–30 min walk on rest days (not separate cardio days, not a setup step).
- **Order:** this phase runs next, before Ramadan (phase 7), so Ramadan can soften cardio too.

## Assumptions (correct me before the phase starts)

1. **Minutes by goal and session length.** Cardio is counted inside the session length, so strength work shrinks to make room.

   | Goal | 20 min | 30 min | 45 min | 60 min | 75 min |
   |---|---|---|---|---|---|
   | Fat loss | 8 | 10 | 15 | 20 | 20 |
   | General fitness | 5 | 8 | 10 | 15 | 15 |
   | Build muscle / Get stronger | 5 | 5 | 8 | 10 | 10 |

2. **Intensity:**
   - Fat loss: moderate ("you can talk in short sentences").
   - Muscle and strength: easy ("you could hold a conversation").
   - General fitness: moderate.
   - Low intensity (pregnancy, high blood pressure): always easy, walking only.
   - New lifters: easy for the first two weeks.
3. **The finisher is replaced by the cardio block** for fat loss and general fitness, so a session never has both. The 30 s on / 30 s off intervals survive as one cardio option for non-new, non-capped users.
4. **Cardio minutes are held steady in this phase.** Cardio progression (more minutes, or a brisker pace, with reasons) is a later improvement. With the session length fixed, more cardio would cut strength work.
5. **Cardio moves.** Images and data come from free-exercise-db (public domain), with our own English and Arabic instructions as in phase 1.
   - **Gym:** treadmill walk (incline), treadmill jog, stationary bike, recumbent bike, rowing machine, elliptical, stair machine.
   - **Home (no equipment):** brisk walk outdoors, march / jog in place, step-ups on a stair.
   - **Not added:** rope jumping. It needs a rope we don't track, and it's high impact.

## Design first

Before the UI tasks, add the cardio card and rest-day walk row to the phase 0 design artifact (English and Arabic) for approval.

## Tasks

1. **Catalogue** (`curation/curated.json`, `curation/text/*.json`, `scripts/build-exercise-catalogue.mjs`):
   - New `cardio` movement pattern, separate from `conditioning`, which stays for intervals.
   - Add the moves above with `timed: true`, `tracksLoad: false`, equipment and `highImpact`, plus their images.
2. **Types:**
   - `CardioBlock { exerciseId; minutes; intensity: 'easy' | 'moderate'; alternates: string[] }` on `WorkoutSession` (replacing `finisher` where it applies).
   - `restDayWalkMinutes` on the plan.
3. **Generator:**
   - Minutes from the table.
   - `fitToTime` counts cardio before trimming accessories.
   - The cardio move is picked by seed per session (varied through the week) from moves `isAllowed` for the user.
   - Low-intensity users get walking only.
   - Regeneration keeps the seed, so cardio stays stable.
4. **Swaps:** `swapCandidates` works for the cardio slot (same `cardio` pattern), so the user can pick bike instead of treadmill.
5. **Logging:**
   - The cardio card in logging mode has one minutes stepper and a tick, stored as a `LoggedExercise` with `slotId: '<session>:cardio:0'` and `sets: [{ reps: minutes, done }]`.
   - The finish sheet adds "Cardio: 15 min".
6. **Screens:**
   - Day screen: a cardio card (demo, "15 min · moderate pace", talk-test cue, ⋯ swap).
   - Week rows and the today list include cardio in the count and minutes.
   - Rest-day rows and the rest-day Today card show "Optional: 20–30 min walk".
   - Built to the existing card styles.
7. **i18n:** English and Arabic for the cardio card, intensity cues, the rest-day walk and the new move names and instructions.

## Tests

- `workout-core`:
  - Generator: every goal × length × location × caps gets the table's minutes, stays within the session length, and has no finisher where cardio replaces it.
  - Low-intensity users get walking only; home with no equipment gets no machines.
  - Swapping works for cardio.
  - The catalogue keeps its ids stable.
- Mobile:
  - The cardio card renders before and during logging.
  - Minutes are logged and shown on a done day.
  - The rest-day walk line appears.
  - Arabic.
- Web end to end: gym and home sessions show cardio; log cardio minutes; swap the cardio move; rest-day walk; 360 px; Arabic.

## Verify

```bash
npm run build && npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
npm test
```

## Done when

Commit: `feat(workout): cardio block and rest-day walks`.

## Execution record (2026-10-23)

### What shipped

- **Mockups:** added to the phase 0 design page and approved by the user before the UI was built:
  - Day: cardio block (gym and home)
  - Logging: cardio minutes
  - Swap sheet: cardio
  - walk lines on Week and the rest-day Dashboard
  - all in English and Arabic
- **Catalogue (174 moves):** new `cardio` pattern.
  - Treadmill jog, stationary bike, elliptical and rowing machine move to it.
  - New: incline treadmill walk, recumbent bike, stair machine, brisk walk, and step-ups on a stair.
  - Images come from free-exercise-db at the pinned commit; English and Arabic steps are our own.
- **`workout-core/cardio.ts`:** `cardioMinutes` (the table in this plan; at most 10 during Ramadan), `cardioIntensity`, `cardioPool` and `REST_DAY_WALK`.
- **Generator:**
  - Every session gets `cardio: CardioBlock` (slot `<session>:cardio:0`, move picked per session, alternates).
  - Strength work is fitted to the session length minus cardio.
  - No finisher.
  - `restDayWalk` on the plan.
  - `upgradePlan` adds cardio to plans saved earlier, keeping seed, week numbers, swaps and creation time.
  - `exerciseForWeek` and `regeneratePlan` understand the cardio slot.
- **Swaps:** the cardio slot swaps between steady cardio, then up to 3 interval moves for users they suit.
- **Mobile:**
  - Stored plans are upgraded when loaded.
  - `cardioForWeek`, `exerciseCount` and `isCardioSlot`.
  - The draft gets a cardio row (minutes); `draftStats.cardioMinutes`.
  - New `CardioCard`: before starting, while logging (minutes stepper and tick, no rest timer) and on a done day.
  - Cardio is last in today's list; counts include cardio.
  - Walk line on rest-day rows, the rest-day card and the dashboard card.
  - Finish sheet shows "Cardio: N min".
  - The swap sheet takes a cardio subtitle.
- **i18n:** `workout.cardio.*` in English and Arabic (Arabic walk range kept left to right). The finisher strings and the finisher display were removed: every stored plan now loads with cardio instead.

### Changes from the plan

1. **Interval moves get their own places in the cardio swap list** (up to 3, after up to 8 steady moves). Found on web: a full gym's steady cardio filled all 8 places and hid the intervals.
2. **New lifters get an easy pace and no intervals**, as assumption 2 says. Moves the source rates "intermediate" (elliptical, rower, stair machine) are hidden from new lifters, like any other exercise.
3. **"March / jog in place" was not added.** The source has no image for it; home cardio is the brisk walk and step-ups on a stair (plus intervals where allowed).

### Verification evidence

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 134 pass (9 new in `cardio.test.ts`: every goal × length × location × caps (720+ sessions) has the table's minutes, fits the length and has no finisher; no machines at home; walking only for low intensity; machines preferred and varied in a gym; pace rules; intervals only where allowed; cardio swaps stick and survive regeneration; intervals keep a place; `upgradePlan`) |
| `cd apps/mobile && npx vitest run src/workout` | all pass (8 new in `cardio-block.test.ts`: cardio card; logging row and tick; minutes counted apart from sets and shown on a done day; interval wording when swapped; today's list; rest-day walk on week and dashboard; Arabic; a stored pre-6b plan upgraded on cold start and saved back) |
| `npm test` (whole repo) | 1,231 tests, 0 failures |
| `npm run build`, `tsc --noEmit` (apps/mobile), CI key guard | pass |
| **Web, end to end** (headless Chrome) | 18 / 18 pass: cardio last in today's list; rest-day walk; cardio card with moderate pace and talk test; count includes cardio, no finisher; cardio swap lists steady moves and intervals; swap, then reset; minutes stepper; tick starts no rest timer; Finish with only cardio; finish sheet "Cardio: 16 min"; done day "Cardio · 16 min"; home with no equipment gets a brisk walk; rest-day dashboard walk; 360 px; Arabic week and cardio card |
| **iPhone simulator** | not run: a real account is signed in there (see phase 6). That account's plan will gain cardio automatically the next time it loads, through `upgradePlan`. |
