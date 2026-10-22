# Phase 6: Manual exercise swap

**Size:** S · **Blocked by:** 4

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
