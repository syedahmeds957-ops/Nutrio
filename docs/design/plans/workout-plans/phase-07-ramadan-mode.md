# Phase 7: Ramadan mode

**Size:** S · **Blocked by:** 4

> **Status: done 2026-10-23, not committed (waiting for the user's command).** Built to the approved phase 0 mockups (Setup 3, Week, Day: Ramadan). See "Execution record" at the end.

## Outcome

The user can switch on Ramadan mode and pick when they train. The week regenerates with shorter, gentler sessions labelled with that timing. Switching it off restores the normal plan, keeping logs and valid swaps.

## Tasks

1. **Setup step 3** gets a "Ramadan mode" switch, off by default. When on, it shows the timing choice: after suhoor · before iftar · after taraweeh.
2. **Week screen** gets a quick toggle in the header menu. Toggling calls `regeneratePlan(plan, { ...settings, ramadan }, today)` → `saveWorkoutPlan`.
3. **Badges.** With Ramadan on, day cards show a crescent badge and the timing label ("Before iftar"), and the day screen shows guidance for the chosen slot:
   - before iftar: keep it light, break the fast with water and dates afterwards
   - after taraweeh: finish at least 1 hour before sleep
   - after suhoor: drink water during suhoor
4. **Generator caps** were already built in phase 2. This phase only checks they reach the UI: at most 4 exercises, ≤ 45 min, no finisher, RIR ≥ 2 shown in the hints.
5. **Progression while fasting.** While Ramadan is on, `nextTarget` never raises load (`hold`), so a tired fasting session doesn't count as failing. **This changes `progression.ts`; add the case and its test.** The ten-percent cut still applies.
6. **i18n**: switch label, slot names, guidance lines, badge. Arabic uses the standard terms (سحور، إفطار، تراويح).

## Tests

- `packages/workout-core/test/progression.test.ts` (extend): Ramadan on → no load increase; the failure cut still works.
- `src/workout/__tests__/ramadan-toggle.test.ts`: toggling on regenerates within caps and keeps logs; toggling off restores the normal slot count and keeps valid swaps.

## Verify

```bash
npm run build && npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
npm test
```

## Done when

Commit: `feat(workout): Ramadan mode with timed, gentler sessions`.

## Execution record (2026-10-23)

### What shipped

- **workout-core:**
  - `nextTarget` gets reason `ramadan_hold`. While fasting, load never rises and the bodyweight ladder neither climbs nor adds sets; reps can still creep up inside the range. The 10% cut after two failed sessions still applies.
  - The existing caps (at most 4 exercises, 45 min, RIR ≥ 2, no jumping, cardio at most 10 easy minutes) are unchanged and now visible on screen.
- **Mobile:**
  - `RamadanCard` (switch, then "When will you train?" with after suhoor / before iftar / after taraweeh), used both in setup step 3 and as the quick toggle on the week. The plan said "header menu"; the week has no menu, so the toggle sits under the week summary.
  - Turning it on starts at "before iftar" and remembers the last timing.
  - `setRamadanMode` regenerates through `updateWorkoutPlan`: seed, week numbers and fitting swaps kept; logs untouched.
  - The week summary shows "Ramadan mode · {timing}" with a crescent; training days show the timing.
  - The day screen opens with the guidance for the chosen timing.
  - New `moon` icon (Phosphor Moon).
  - English and Arabic use the approved copy: سحور، إفطار، تراويح.

### Notes

- The app already has unused meal-side Ramadan strings ("Shifts eating window between Maghrib and Fajr"), but no meal Ramadan feature is wired, so the two are not linked. Linking them is a follow-up once the meal side exists.

### Verification evidence

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 169 pass (4 new: no load increase at the top of the range, reps still creep, the cut still works, no ladder or extra set while fasting) |
| `cd apps/mobile && npx vitest run src/workout` | all pass (6 new in `ramadan-toggle.test.ts`: on → within caps, logs kept, seed and start kept; off → full slot counts back, swap kept; default and remembered timing; card, week badge and day labels, day guidance and gentle effort; English and Arabic reasons and timings) |
| `npm test` (whole repo) | 1,292 tests, 0 failures |
| **Web, end to end** | 14 / 14 pass: switch off by default in setup; on asks the timing; week badge and day labels; taraweeh guidance; a 75-minute plan capped to 4 strength moves and ~37 min; gentle effort; week toggle off removes badges and restores full sessions; on again remembers the timing; 360 px; Arabic badge and guidance |

### Changed at the user's request: Ramadan mode only during Ramadan

The user asked for Ramadan mode to apply only in Ramadan, not all year.

- **The switch now means "use Ramadan mode during Ramadan".**
  - `workout-core/ramadan.ts` holds Ramadan start and end dates for 1446–1462 AH (2025–2040). They were worked out once with ICU's Umm al-Qura calendar and are stored as data, so phones need no calendar support.
  - Helpers: `isRamadan`, `currentOrNextRamadan`, `settingsOn(settings, date)` and `planSettings(plan)`.
- **The generator** applies the fasting caps only when the plan's date (`asOf`) is in Ramadan. It records `plan.fasting`, while `plan.settings.ramadan.enabled` stays the user's choice.
  - `planForDate` rebuilds the plan when Ramadan starts or ends, keeping seed, week numbers, swaps and creation time.
  - Storage calls it on every load, so an app left open across the start or end of Ramadan catches up.
  - Swaps, targets and the ladder read the plan as it was applied (`planSettings`).
- **Screens:**
  - Badges, timing labels and guidance show only while `plan.fasting`.
  - The Ramadan card has a status line: "Turns on by itself on 8 Feb 2027, and off after Eid" / "On now · until 8 Mar 2027" / "Next Ramadan starts …".
  - The week shows the card only during Ramadan and in the 30 days before it; otherwise it stays in Edit plan.
- **Caveat:** the dates follow Umm al-Qura (Saudi). Pakistan may start or end a day later by local moon sighting.
- **Older always-on plans** go back to normal outside Ramadan on their next load.

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 177 pass (8 new in `ramadan.test.ts`: first and last day, next Ramadan, table soundness, normal vs fasting plan for the same settings, switching on the first day and off after Eid with seed, swaps and creation time kept, no change without opt-in, older always-on plans brought back, swaps follow the applied mode) |
| `cd apps/mobile && npx vitest run src/workout` | all pass (`ramadan-toggle.test.ts` rewritten around real dates, plus "only during Ramadan" cases) |
| `npm test` (whole repo) | 1,303 tests, 0 failures |
| **Web, end to end** (browser clock moved) | 15 / 15 pass. Oct 2026 with the mode on: "Turns on by itself on 8 Feb 2027", normal plan, no badges, no week switch. 15 Feb 2027: badge and labels by themselves, "On now · until 8 Mar 2027", taraweeh guidance, 4 moves at ~37 min. 10 Mar 2027: normal again. Arabic in Ramadan. |
