# Phase 6: Manual exercise swap

**Size:** S · **Blocked by:** 4

> **Status: done 2026-10-23, not committed (waiting for the user's command).** See "Execution record" at the end.

## Outcome

Any exercise in a session can be swapped for a safe alternative. The swap sticks in later weeks and can be reset.

## Tasks

1. **`workout-core/src/swapper.ts`**: `swapCandidates(slot, plan, { limit = 8 }): Exercise[]`.
   - Same pattern.
   - Equipment, level and joint filters as in `select.ts`.
   - Excludes the current exercise and others already in that session.
   - Ranking: primary-muscle overlap, then same `compound`, then closest level, then name.
   - Phase 10 reuses this exact list as the coach's candidates.
2. **`applySwap(plan, slotId, exerciseId): WeeklyWorkoutPlan`** (pure) validates that the id is in `swapCandidates` and sets `plan.swaps[slotId]`. **`resetSwap(plan, slotId)`** removes it. The new exercise starts its own progression history (`first_time_pick_weight` unless it was logged before).
3. **UI.** A "Swap" action on each exercise row in `WorkoutDayScreen` (not during logging) opens `workout/ui/SwapSheet.tsx`: candidate rows with an image loop, name, and equipment icon. Choose → `applySwap` → `saveWorkoutPlan`. A swapped row shows a "Reset to original" link.
4. **i18n**: sheet title, empty state ("No other safe option with your equipment"), reset link.

## Tests

- `packages/workout-core/test/swapper.test.ts`: candidates never include unavailable equipment, protected joints, expert or above-experience level, or duplicates in the session; ranking is stable; `applySwap` rejects an id outside the candidates; a swap persists through `exerciseForWeek` in later weeks and through `regeneratePlan` when still valid.
- `src/workout/__tests__/swap-sheet.test.ts`: choosing applies and saves; reset restores.

## Verify

```bash
npm run build && npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
npm test
```

## Done when

Commit: `feat(workout): manual exercise swaps`.

## Execution record (2026-10-23)

### What shipped

- **`workout-core/swapper.ts`:**
  - `swapCandidates(plan, slotId, { limit = 8, weekIndex })`: same pattern; `isAllowed` filters (equipment, level, joints, intensity); excludes the slot's current exercise and every other exercise in that session for that week. Ranked by shared primary muscles, then same compound, then closest level, then name.
  - `applySwap` (throws `InvalidSwap` for anything off the full candidate list).
  - `resetSwap`.
  - `isUserSwap`, which tells a hand swap from a bodyweight ladder climb, since both live in `plan.swaps`.
- **Mobile:**
  - `swapExercise` and `resetExercise` in `planActions.ts` save the plan.
  - New `ExerciseOptionsSheet` (⋯ menu: Swap exercise / View details / Reset to original / Cancel).
  - New `SwapSheet` (candidates with demo, name, equipment and chevron; the empty state from the spec). Its body is exported separately so tests can render it.
  - `ExerciseDetailSheet` gains a Swap button when opened from a slot.
  - The day screen gains a ⋯ button per exercise (a sibling of the card's details button, not nested), a lime "Swapped" tag and a "Reset to original" link.
  - New `more` icon (Phosphor DotsThree).
- **i18n:** swap, options and a full equipment name list in English and Arabic.

### Changes from the plan

1. **The signature is `swapCandidates(plan, slotId, options)`**, not `(slot, plan, options)`. The session's other exercises have to be looked up anyway, and the coach (phase 10) will have a slot id.
2. **A ladder climb shows no "Swapped" tag.** `isUserSwap` follows the `harder` chain from the slot's own exercise and alternates.
3. **The step-up reason is checked against the last session.** "Harder move: you hit N on every set" now needs the previous move to have actually topped out. A hand swap to the harder move used to claim that falsely.
4. **No swaps mid-workout or on a done day.** The ⋯ button is replaced by the chevron there.
5. **"Ask coach about this"** in the ⋯ menu and detail sheet arrives with phase 10.

### Verification evidence

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 125 pass (14 new: safety filters across gym, home, no equipment, new lifter with protected joints and low intensity; ranking and stability; rejecting off-list ids; sticking across weeks 0–12 over rotation; surviving `regeneratePlan` when still valid; reset; fresh progression; ladder vs hand swap) |
| `cd apps/mobile && npx vitest run src/workout` | all pass (8 new in `swap-sheet.test.ts`: choose → saved → survives a cold start → reset; off-list refused; ⋯ per exercise; Swapped tag, reset link and first-time target; none mid-workout; sheet list and equipment; empty state; Arabic) |
| `npm test` (whole repo) | 1,214 tests, 0 failures |
| `npm run build`, `tsc --noEmit` (apps/mobile), CI key guard | pass |
| **Web, end to end** (headless Chrome, real clicks) | 18 / 18 pass: ⋯ on every exercise; options sheet; swap sheet titled with the exercise; up to 8 candidates with equipment, current exercise excluded; swap in place with Swapped, reset and first-time target; today's list updates; **survives reload**; **sticks 1 and 4 weeks later** (past the rotation point); detail sheet Swap; reset restores; none mid-workout; 360 px no overflow; Arabic sheet and equipment names |
| **iPhone simulator** | **not done.** The simulator is signed in to a real account and was in use. My temporary demo hook (and the phase 5 one) saved a demo plan and, in phase 5, a fake log into that account on the device. I stopped and reported it rather than retry. See the decision log. |
