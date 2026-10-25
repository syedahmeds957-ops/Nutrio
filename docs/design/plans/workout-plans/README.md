# Workout plans: implementation plan

**Status:** approved 2026-10-22, split into phases. Phase 0 (designs) is done and approved; each later phase starts only on the user's command.
**Research behind it:** [`docs/planning/EXERCISE_APPS_RESEARCH.md`](../../../planning/EXERCISE_APPS_RESEARCH.md)
**Branch:** `feat/workout-plans`, branched from `diet-catalogue-and-plan-fixes` at `d8c41fc` (main is behind and lacks `apps/mobile`). It lives in a separate worktree at `../Nutrio-workouts` so work on the diet branch is never touched.

## Goal

A signed-in user or a guest can set up a weekly workout plan for home or gym. They see the whole week, follow each session, log sets, and get automatic progression where every change carries a one-line reason. They can swap exercises by hand or by agreeing a swap with the coach. A Ramadan mode shortens and softens sessions around suhoor and iftar. The plan can feed the user's calorie target. Everything works offline, in English and Arabic (RTL), at $0.

## How we work through it

1. One phase at a time, in the order below. Each phase has its own file with tasks, files, tests and a finish check.
2. A phase is done when its **Verify** commands pass and its **Demo** steps work. I then stop, report what changed with the evidence, and wait for "next".
3. Commits happen **only when the user says so** (one per phase, on `feat/workout-plans` in the `../Nutrio-workouts` worktree). Nothing is pushed and no PR is opened until you ask.
4. If a phase turns up a decision the plan didn't cover, I stop and ask instead of guessing, and record it in the decision log below.
5. After each phase: update the Progress table, run `graphify update .`, and keep `npm run build && npm test` green.

## Phases

| # | Phase | Size | Blocked by | File |
|---|---|---|---|---|
| 0 | Screen designs (spec + clickable mockups) | M | none | [phase-00](phase-00-screen-designs.md) |
| 1 | Exercise catalogue + bundled images | M | none | [phase-01](phase-01-catalogue-and-images.md) |
| 2 | Plan generator | M | 1 | [phase-02](phase-02-generator.md) |
| 3 | Setup screen, storage, navigation | M | 0, 2 | [phase-03](phase-03-setup-storage-navigation.md) |
| 4 | Week and day screens, Today card | M | 3 | [phase-04](phase-04-week-and-day-screens.md) |
| 5 | Set logging + progression with reasons | M | 4 | [phase-05](phase-05-logging-and-progression.md) |
| 6 | Manual exercise swap | S | 4 | [phase-06](phase-06-manual-swap.md) |
| 6b | Cardio block + rest-day walks (added 2026-10-23) | M | 5, 6 | [phase-06b](phase-06b-cardio.md) |
| 6c | "Tell us more" setup + improve an existing routine (added 2026-10-23; 3 slices) | L | 6b | [phase-06c](phase-06c-tell-us-more-and-routine-import.md) |
| 7 | Ramadan mode | S | 4 | [phase-07](phase-07-ramadan-mode.md) |
| 8 | Cloud sync | M | 5 | [phase-08](phase-08-cloud-sync.md) |
| 8b | Guests explore only: sample week, no building or logging (added 2026-10-25) | S | 8 | [phase-08b](phase-08b-guest-preview.md) |
| 9 | Calorie target link | S | 3 | [phase-09](phase-09-calorie-link.md) |
| 10 | Coach knows the plan + coach swaps | M | 6 | [phase-10](phase-10-coach.md) |
| 11 | Weekly check-in shows training | S | 5 | [phase-11](phase-11-checkin-adherence.md) |

Phase 0 runs alongside phases 1–2; Phase 3 waits for your design approval. Every UI phase builds to match the approved mockups, and its Demo step compares the built screen against them.

Phases 1–4 are the critical path. After phase 4, phases 5, 6, 7 and 9 are independent; the table order is the order we'll do them in.

**Checkpoint A** (after phase 5): a full local demo on web plus one phone simulator, home and gym, English and Arabic, before anything touches the cloud.
**Checkpoint B** (after phase 8): sync verified across two devices/browsers.

## Decisions

### Product (user, 2026-10-22)

| # | Decision |
|---|---|
| P1 | Both home and gym in v1 |
| P2 | Show the whole week, not just today |
| P3 | The coach may swap exercises, only when the user discusses it and confirms |
| P4 | Differentiators: diet + training in one plan, Ramadan mode, home/bodyweight first with women-friendly options, Arabic + RTL, honest free tier, predictable week with explained changes |
| D1 | Exercise images are **bundled in the app** (about 10 MB) |
| D2 | A saved plan **offers** to update the calorie target; never silently |
| D3 | Ramadan mode covers **workouts only** in this plan |
| D4 | Setup runs **the first time Workouts is opened**, prefilled from the survey |
| D5 | ~~Guests can use workouts, stored on the device only~~ **Replaced 2026-10-25:** guest mode is for exploring. Guests see a sample week and need an account to build a plan or log (phase 8b) |

Assumptions accepted with the approval:
1. I write the Arabic exercise names and instructions in phase 1. You or another Arabic speaker spot-check them before release.
2. Starting weights are never guessed. The first session asks for a weight the user could lift for the top of the range with 2–3 reps to spare.
3. Pregnancy/breastfeeding or hypertension caps intensity and shows a "check with your doctor" note. Injury answers exclude exercises that load that joint. (The survey has no heart-condition flag, so the earlier mention of one is dropped.)
4. You apply the phase 8 migration, or approve me applying it, and run `npm run deploy:coach` in phase 10.

### Engineering

| # | Decision | Why |
|---|---|---|
| E1 | Exercise data and images from **`yuhonas/free-exercise-db`** (Unlicense), pinned to one commit, curated to about 200 beginner/intermediate exercises | Public domain. `hasaneyldrm/exercises-dataset` media is © Gym visual |
| E2 | New pure package **`@nutrio/workout-core`**: catalogue, generator, progression, swapper. No React, no I/O, `"sideEffects": false` | Prescriptions are deterministic and unit-tested; no model ever produces sets, reps or weights |
| E3 | `estimateWeeklyExerciseKcal` moves from `apps/mobile/src/survey/nutrition-bridge.ts` into **`nutrition-core`** | Hard Rule 2 |
| E4 | One-time script `scripts/build-exercise-catalogue.mjs` resizes images with macOS `sips` (no new dependency); its outputs are committed and CI never runs it | Reproducible without installs |
| E5 | Start and end photos play as a **2-frame loop**, or a still frame when the OS asks for reduced motion | "Animated" feel with free media |
| E6 | **Fixed weekly split**; progression and swaps adapt from logs; no per-session regeneration | Answers "random / repetitive" complaints |
| E7 | **Double progression** with real increments; bodyweight **variation ladders**; two failed sessions cut load by 10%; every change has a reason code | Safe and explainable |
| E8 | Coach swaps: the client sends deterministic candidates. The model may only pick one; the server rejects anything else; the user taps Apply | Same pattern as `dish-breakdown` choosing a USDA record |
| E9 | Storage modules follow `weightStorage.ts`: sync in-memory cache, `hydrate*` at boot, `release*Cache` on logout, scoped per user id | Documented client data-flow rule |
| E10 | Sync tables `core.workout_plans` and `core.workout_logs`, with the same RLS shape as `core.activity_logs` | Mirrors `activitySync.ts` |
| E11 | One new route `'workouts'`. The screen shows setup when there's no plan and the week when there is. A "Workouts" pill in the dashboard nav row and a Today card | No router library; there's no plan-dependent detour to resolve, so no new resolver function is needed |
| E12 | `PlanUserContext.trainingWeeklyKcal` records the exercise kcal already counted in `tdee`, so repeated plan saves never stack | Found while reading `plan/engine.ts` |

## Always / Never

**Always:** every part of the feature works in **every app version: Pakistan, Saudi Arabia and global** (any other region). Region differences go through one helper with a default for unknown regions (`weekStartFor(region)`: SA → Sunday, everything else → Monday), and tests cover PK, SA and the default. Every set, rep, weight and progression step comes from `workout-core`, with tests. Every new string goes into both `en.json` and `ar.json` under a new `workout` namespace. Each storage module gets hydrate + release. The app works offline. Every engine-made change carries a reason.

**Never:** model-produced sets, reps or weights. Silent calorie-target changes. Gym visual / ExerciseDB media. wger data in our tables. A paywall or trial on any workout feature. Session-to-session regeneration.

**Follow-up found during the build, fixed in phase 5 at the user's request:** the startup splash in `App.tsx` waited on `restoreSession()` and font loading with no timeout. Boot now has time limits on fonts and network steps, plus a 15 s backstop (see the phase 5 record).

**Follow-up agreed with the user (later):** a Ramadan date setting so a user whose country sights the moon locally (e.g. Pakistan, often a day later than Umm al-Qura) can shift the start and end.

**Out of scope:** reminders/notifications, Apple Health / Google Fit, heart rate, video, social, warm-up/stretching routines, Ramadan in the meal plan, Urdu.

## Decision log (changes during build)

| Date | Phase | Change | Why |
|---|---|---|---|
| 2026-10-22 | plan | Old phase 3 split into phases 3 and 4 (11 phases now) | It touched 12+ files across storage, navigation and three screens |
| 2026-10-22 | plan | No `resolveWorkoutsDestination`; workouts need no plan or survey | Nothing to resolve; a resolver would be dead indirection |
| 2026-10-22 | plan | Added Phase 0: all screens designed up front as clickable HTML mockups + a design spec, approved before Phase 3 | User chose mockups and up-front design so the look is settled before building |
| 2026-10-22 | 0 | The Workouts screen opens on today's workout with every exercise listed (animated demo, sets × reps, rest) above the week; no meal content there. The dashboard keeps a compact card | User's review |
| 2026-10-22 | 0 | An Arabic RTL page with every screen added to the mockups | User's review |
| 2026-10-22 | 0 | The week view shows the current calendar week (Mon start for PK, Sun for SA), not "7 days from today" | Done/missed days must stay visible; phase 4 updated |
| 2026-10-22 | 0 | Nav pills become content-width and scroll horizontally, 44 px tall | 5 equal-width pills clip at 360–390 px |
| 2026-10-22 | 0 | `textSecondary` (light) → `#556275`, `floatingBarInactive` (dark) → `#9CA3AF` in phase 3 | Existing values fail AA contrast on small labels |
| 2026-10-22 | 1 | Own EN/AR instructions, 169 exercises, `timed` field, Vitest image setup file, flutter kicks moved to glutes/bench | Source text didn't match its photos; see the phase 1 record |
| 2026-10-22 | 2 | Empty-pool fallback patterns for home with no equipment | Phase 1 known gaps |
| 2026-10-25 | 8b | Guest banner buttons stacked full width instead of side by side (the labels wrapped inside their pills at 360–390 px) | See the phase 8b record |
| 2026-10-25 | 8b | User: guest mode is just to explore the app. Guests can't build a plan or log; they preview a sample week, and every action asks them to sign up. Replaces D5 | Phase 8b file |
| 2026-10-25 | 8 | Pushes from `planActions` (user edits only), not storage. New `updatedAt` save time sent as the row's `updated_at`. Logs merge on `dateKey + day`. Logs are pushed as a batch of days and fetched for the year the device keeps. A failed fetch leaves that side untouched | See the phase 8 record |
| 2026-10-23 | 7 | User: Ramadan mode only during Ramadan. The switch means "use during Ramadan"; Umm al-Qura dates 2025–2040 stored as data; plans rebuild when Ramadan starts and ends (`planForDate`); the week shows the switch only near or during Ramadan. Automatic Ramadan dates moved from out of scope into phase 7 | See the phase 7 record |
| 2026-10-23 | 6c | User: questions follow earlier answers (beginner checks vs current lifts vs returning after a break); cardio asked per day. Routine stored in the profile so edits keep it; lifts count like likes; push-only surplus days become upper days; move up/down instead of drag | See the phase 6c record |
| 2026-10-23 | 6b | Cardio built as planned. Interval moves keep up to 3 places in the cardio swap list; stored plans gain cardio through `upgradePlan`; the finisher display was removed | See the phase 6b record |
| 2026-10-23 | 6b/6c | User: cardio as a block after every session plus rest-day walks, built next as 6b. Then 6c: an optional "Tell us more" step (current training and lifts, cardio habits, likes/dislikes, sports days), an existing routine entered by picking from our catalogue, improved as "keep it, fix the gaps" with a reason per change. Mockups first for both | Phase 6b and 6c files |
| 2026-10-23 | 6 | `swapCandidates(plan, slotId)`; ladder climbs aren't shown as swaps; step-up reason needs a real top-out; no device checks with hooks that save data while a real account is signed in on the simulator | See the phase 6 record |
| 2026-10-23 | 5 | Added reasons `first_time` and `top_dumbbell_hold`; a target carries the reps to aim for; logs keyed by date + planned day; climbs never duplicate a move; Start on any day logs under today; ticks use `aria-checked` | See the phase 5 record |
| 2026-10-23 | 4 | Demo sizes 68/72 px per the mockups; no options button until phases 6/10; Arabic rep ranges kept left-to-right with LRM marks | See the phase 4 record |
| 2026-10-23 | 3 | Prefill note only with survey answers; server-render tests with a local `react-dom/server` declaration; adjustable dumbbells stored as no fixed weights | See the phase 3 record |
| 2026-10-23 | 2 | `highImpact` flag, `unit` for timed holds, full-body splits for no-equipment users, ranked (not banned) week repeats, even main-set trimming | Found by reading generated plans; see the phase 2 record |
| 2026-10-22 | all | Every workout feature works for PK, SA and global; region-specific behaviour only through a helper with a default, tested for all three | User's standing rule for the whole app |

## Progress

| Phase | Status | Commit |
|---|---|---|
| 0 Screen designs | done 2026-10-22, approved. [Mockups](https://claude.ai/artifact/7dEqPJ6ZK2bgkYL32owMRu) (English + Arabic pages), [spec](../../specs/2026-10-22-workout-screens-design.md) | see `git log feat/workout-plans` |
| 1 Catalogue + images | done 2026-10-22: 169 exercises, 10 MB images, all checks green ([record](phase-01-catalogue-and-images.md#execution-record-2026-10-22)) | `2f33d0b` |
| 2 Generator | done 2026-10-23: 1,620-plan grid green ([record](phase-02-generator.md#execution-record-2026-10-23)) | `60a15ca` |
| 3 Setup, storage, navigation | done 2026-10-23: web flow 13/13, iPhone checked ([record](phase-03-setup-storage-navigation.md#execution-record-2026-10-23)) | `bf96773` |
| 4 Week + day screens | done 2026-10-23: web flow 17/17, iPhone checked ([record](phase-04-week-and-day-screens.md#execution-record-2026-10-23)) | `c88f8a2` (one commit for 4–6b, built on top of each other) |
| 5 Logging + progression | done 2026-10-23: Checkpoint A, web flow 30/30, iPhone checked; startup hang fixed ([record](phase-05-logging-and-progression.md#execution-record-2026-10-23)) | `c88f8a2` (one commit for 4–6b, built on top of each other) |
| 6 Manual swap | done 2026-10-23: web flow 18/18; iPhone check skipped, a real account is signed in there ([record](phase-06-manual-swap.md#execution-record-2026-10-23)) | `c88f8a2` (one commit for 4–6b, built on top of each other) |
| 6b Cardio | done 2026-10-23: mockups approved, web flow 18/18 ([record](phase-06b-cardio.md#execution-record-2026-10-23)) | `c88f8a2` (one commit for 4–6b, built on top of each other) |
| 6c Tell us more + routine import | done 2026-10-23: questions follow experience, routine builder, "What we improved"; web 18/18 + 13/13 ([record](phase-06c-tell-us-more-and-routine-import.md#execution-record-2026-10-23)) | `ed98d43` |
| 7 Ramadan mode | done 2026-10-23: web 14/14 ([record](phase-07-ramadan-mode.md#execution-record-2026-10-23)) | `a9828f3` |
| 8 Cloud sync | done 2026-10-25: migration applied, Checkpoint B 12/12 on web ([record](phase-08-cloud-sync.md#execution-record-2026-10-25)) | |
| 8b Guest preview | done 2026-10-25: mockups approved, web guest run 20/20 ([record](phase-08b-guest-preview.md#execution-record-2026-10-25)) | |
| 9 Calorie link | not started | |
| 10 Coach | not started | |
| 11 Check-in adherence | not started | |
