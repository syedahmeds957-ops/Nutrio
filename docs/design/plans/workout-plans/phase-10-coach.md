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

## Execution record (2026-10-25)

### Decisions (user, 2026-10-25)

1. **The region bug is fixed here.** `CoachChatRequestSchema` had no `region`, and zod drops unknown keys, so Saudi users always got the Pakistan prompt. `region` is now an optional `PK | SA` field.
2. **Only the chip and the Apply card are added** to the current coach screen. The mockup's restyled header, bubbles and input bar are not built.
3. **I deployed** coach-chat (`npm run deploy:coach`).
4. **The coach sees each candidate's joint loads** (catalogue data, no health data), so a knee complaint can steer the pick.

### What shipped

- **nutrition-core:**
  - `CoachContext.workout` (`CoachWorkoutContext`).
  - `buildWorkoutSection()` adds a `WORKOUT PLAN` block only when a plan is sent. The block covers location, done and planned sessions this week, today's session and exercises, and Ramadan.
  - The block says never to give sets, reps, weights or loads, and to point to the day's targets.
  - Without a workout, the prompt is byte-identical to before (checked against a saved copy, and tested).
- **coach-chat:**
  - The request takes `region`, `context.workout` and `swapRequest` (`{ exerciseId, exerciseName, candidates: { id, name, jointLoads }[] }`, at most 8).
  - The response has an optional `proposedSwap: { toId, reason }`, with `reason` capped at 300 characters.
  - `buildSwapInstructions()` lists the only allowed alternatives with their joint loads, and handles the no-alternative and every-option-loads-the-joint cases. It allows a `SWAP:` line only after the user agrees.
  - `takeProposedSwap()` finds that line anywhere: before or after `SUGGESTIONS`, or inside a code fence. It strips the line from the reply and keeps the swap only if `toId` is a candidate. Otherwise it flags `SWAP_NOT_IN_CANDIDATES` and logs.
  - If the model sends only the SWAP line, its reason becomes the reply instead of the generic greeting.
  - No model change: `openai/gpt-oss-120b` is still current on Groq's deprecations page (checked 2026-10-25).
- **App:**
  - `workout/coachWorkout.ts`:
    - `coachWorkoutContext()` is built from `buildWeekView`, so the counts and the region's week start match the Workouts screen. Names are in the app language.
    - `coachSwapTopic()` is the slot's exercise this week plus `swapCandidates` (capped at 8, since cardio can have 11), with joint loads.
    - `applyCoachSwap()` re-reads the stored plan. It refuses when the slot changed since the chat opened or the id isn't safe (`InvalidSwap`), and otherwise saves through `planActions.swapExercise`, which sets the save time and syncs.
  - `ai-service.sendCoachMessage(…, swapRequest)` sends the topic and keeps a `proposedSwap` only if its id is one the request sent. Offline with a topic, a translated line points to the Swap menu.
  - **Entry points:** "Ask coach about this" in the ⋯ menu (Swap / Ask coach / View details / Cancel, per the spec) and in the details sheet. Both appear only where Swap does: not while logging, not on a done day, not for guests.
  - **`App.tsx`:**
    - `coachTopic` holds the exercise the chat opened on, and is cleared when the coach is opened from the dashboard.
    - The coach always gets the stored workout plan (never the sample).
    - `workoutDayKey` is set, so Back returns to that day.
    - A `workoutRevision` counter is bumped after an applied swap. That rebuilds the coach's picture of today's workout, so later messages name the new exercise.
  - **`CoachChatScreen`:**
    - The "Talking about: …" chip has a 44 px close button. The topic is sent with every message until the chip is closed.
    - `ApplySwapCard` shows Keep current / Apply swap. Applied shows a green "Swapped. X is now in {day}."; refused shows the amber notice. Keep current hides the card.
    - After Apply, the chip moves on to the new exercise and its own safe list.
    - A new proposal hides any earlier unanswered card (`appendCoachMessage`), so only one card is live.
  - **Copy:** `coach.topic.*`, `coach.swap.*`, `coach.fallback.swapTopic.*` and `workout.options.askCoach`, in both locales, using the mockup's Arabic.

### Evidence

- **Tests:**
  - `coach-chat`: 24 tests (11 new). They cover the schema (region, workout, swap; bad region, unknown joint, 9 candidates), the Saudi prompt reaching the model, workout and swap blocks only when sent, and the no-alternative wording. Proposals before or after SUGGESTIONS and in a code fence are kept. Foreign and malformed ones are dropped and flagged. None come without a topic or from the offline fallback. A SWAP-only answer uses the reason.
  - nutrition-core `coach-context`: 3 new, covering the workout block format, rest day and Ramadan, and an unchanged prompt without a workout.
  - `src/coach/__tests__/coach-workout.test.ts` (8): the context from the plan and logs, done counts for SA, PK and the default region, rest day, Arabic names, the topic matching the swap sheet's list with joint loads, the cap at 8 for cardio, and a missing slot.
  - `src/coach/__tests__/apply-swap-card.test.ts` (14): Apply saves with a new `updatedAt` and survives a cold start. An unsafe id, a stale topic and no stored plan are each refused. The card renders in English and Arabic, applied and refused. `sendCoachMessage` sends the topic, drops foreign ids, ignores proposals without a topic, and falls back offline. Only the newest card is live.
- `npm run build`, the key guard and `npm test` are green. Mobile has 83 files and 598 tests, supabase 98, nutrition-core 69 and workout-core 178.
- **Deploy:** `git log feat/workout-plans..diet-catalogue-and-plan-fixes` shows nothing for coach-chat, `_shared`, nutrition-core or the bundler. The main checkout has no uncommitted changes there. coach-chat was deployed three times: once at first, then twice for the reply fix and the prompt wording below.
- **Web, live coach, the phase 8/9 test account** (no new account):
  1. Legs day → ⋯ on Barbell front squat → the menu matches the spec → Ask coach about this → chip "Talking about: Barbell front squat". One `POST coach-chat` per message.
  2. "my knee hurts with these, what else can I do?" → "Try a bodyweight squat or goblet squat to reduce knee strain." Both are on the slot's safe list.
  3. "Yes, swap it to the goblet squat." → a card "Swap to Goblet squat?" with both thumbnails and the plan note. **Found:** the model sent only the SWAP line, so the server showed its generic greeting. Fixed (reason as reply) and redeployed.
  4. Apply swap → "Swapped. Goblet squat is now in Legs.", the chip changes to Goblet squat, and one `POST workout_plans`. Back → the day shows Goblet squat tagged Swapped.
  5. "How many kg should I lift?" → "I can't assign a specific kilogram load; follow the weight targets set in your workout app…".
  6. **Found:** the coach called leg press "easier on the knee", but every squat alternative loads the knee in our catalogue. The prompt now says so when every option loads the joint. Redeployed. It then answered "None of the listed alternatives completely spare the knee; try using a very light weight or skip squats today…", and the agreed-swap reply was a full sentence. Keep current hid the card.
  7. Coach from the dashboard: no chip and no card. It answered with the day's workout in mind.
  9. **Found and fixed after review:** after Apply, later messages still listed the old exercise under "Today", because `context.workout` was built once per render and nothing re-rendered. Re-checked: View details → Ask coach about this (the details-sheet entry) → chip "Talking about: Goblet squat" → agreed swap → Apply → "Swapped. Bodyweight squat is now in Legs." The next `coach-chat` body has `context.workout.today.exercises` starting "Bodyweight squat", and `swapRequest.exerciseName` "Bodyweight squat".
  8. Arabic (SA): the chip, reply and card were all in Arabic and RTL, with the arrow mirrored and Arabic exercise names. The Saudi chips (kabsa, dates) show that `region` now reaches the server. In one run the model proposed before the user agreed, which left two cards. A new proposal now hides the unanswered one (tested). No overflow at 360 px.

### Known limits

- The model sometimes proposes before the user says yes. It's still safe, since nothing changes until Apply, and only one card is live.
- The test account's Legs day keeps the swap from the demo (now Bodyweight squat).
- **The live coach-chat runs this branch's code, which isn't committed yet.** Deploying coach-chat from the main checkout or the diet branch before this branch merges would undo the region fix and swaps.
- Not part of this phase, found while testing:
  - The coach screen renders its starting chips and never the follow-up questions the server returns (`suggestedChips` is set but not shown).
  - `MODELS.GROQ.VISION_PREVIEW` (`qwen/qwen3.6-27b`, used only by the unwired `ocr-label`) was shut down by Groq on 2026-09-14; the replacement is `qwen/qwen3.8-27b`.
