# Phase 10: Coach knows the plan + coach swaps

**Size:** M · **Blocked by:** 6 · **Needs you:** `npm run deploy:coach` (requires `npx supabase login`).

## Outcome

The coach can talk about the user's workouts. When the user discusses swapping an exercise, the coach can propose one alternative from a safe list, and the swap happens only when the user taps Apply.

## Read first

`docs/planning/GROQ_OPENROUTER_FINDINGS.md` (as CLAUDE.md requires before AI code), `supabase/functions/coach-chat/service.ts` (how the model reply and `suggestedPrompts` are parsed), `supabase/functions/_shared/models.ts` (no model change planned) and `apps/mobile/src/ai/ai-service.ts` (`sendCoachMessage`).

## Tasks

1. **Context.**
   - `packages/nutrition-core/src/coach-context.ts` and `supabase/functions/coach-chat/schema.ts` get an optional `workout`:
     ```ts
     workout?: {
       location: 'home_none' | 'home_equipment' | 'gym';
       sessionsPlannedThisWeek: number; sessionsDoneThisWeek: number;
       today?: { title: string; exercises: string[] };
       ramadan: boolean;
     }
     ```
   - The system prompt gets one short block about it.
   - `buildCoachContext` in the app fills it from `loadWorkoutPlan()` + `loadWorkoutLogs()`.
2. **Swap request.** The request schema gets optional `swapRequest: { exerciseId, exerciseName, candidates: { id, name }[] }`, with up to 8 candidates from `swapCandidates`. The response schema gets optional `proposedSwap: { toId, reason }`.
   - The prompt tells the model: only when the user agrees to a swap, return `proposedSwap` with a `toId` from `candidates`, and never state sets, reps or weights.
   - The service **drops** any `proposedSwap` whose `toId` isn't in the candidates, and logs a flag.
3. **Entry point.** An "Ask coach about this" action on each exercise row (in the same menu as Swap) opens the coach with the swap request attached. The chat shows a small "Talking about: Barbell squat" chip, and the request is sent with each message until the chip is closed.
   - Guests can't reach it, because the coach is already gated for guests.
4. **Apply card.** In `CoachChatScreen.tsx`, an assistant message with `proposedSwap` renders `ApplySwapCard`: "Swap Barbell squat → Goblet squat?" [Apply] [Keep current].
   - Apply → `applySwap` (which revalidates against the current candidates) → `saveWorkoutPlan` → confirmation line.
5. **Offline / fallback.** When the edge function fails, the existing translated fallback replies; no card appears; the manual Swap sheet still works.
6. **Deploy.** `npm run build`, then you run `npm run deploy:coach`.

## Tests

- `supabase/functions/coach-chat/__tests__`: schema accepts and rejects the new fields; a `proposedSwap` with a foreign id is dropped; the prompt includes the workout block only when present.
- `packages/nutrition-core/test/coach-context.test.ts` (extend): workout block formatting.
- `src/coach/__tests__/coach-context.test.ts` (extend): the app builds the workout context from stored plan and logs.
- `src/coach/__tests__/apply-swap-card.test.ts`: Apply saves the swap; a stale id (no longer a candidate) is refused with a message.

## Verify

```bash
npm run build
npx vitest run supabase/functions/coach-chat
cd apps/mobile && npx vitest run src/coach src/workout
node scripts/check-ci-keys.mjs
npm test
```

## Demo (after deploy)

Signed in on web: open a day → "Ask coach about this" on a squat → "my knee hurts with these, what else can I do?" → the coach suggests an alternative → Apply → the day shows the new exercise. Asking "how many kg should I lift?" gets an answer that defers to the plan's targets, not a number from the model.

## Done when

Commit: `feat(coach): workout-aware coach with confirm-to-apply swaps`.
