# Workout plans: implementation plan

**Status:** approved 2026-10-22, split into phases. Phase 0 (designs) is done and approved; each later phase starts only on the user's command.
**Research behind it:** [`docs/planning/EXERCISE_APPS_RESEARCH.md`](../../../planning/EXERCISE_APPS_RESEARCH.md)
**Branch:** `feat/workout-plans`, branched from `diet-catalogue-and-plan-fixes` at `d8c41fc` (main is behind and lacks `apps/mobile`). It lives in a separate worktree at `../Nutrio-workouts` so work on the diet branch is never touched.

## Goal

A signed-in user or a guest can set up a weekly workout plan for home or gym. They see the whole week, follow each session, log sets, and get automatic progression where every change carries a one-line reason. They can swap exercises by hand or by agreeing a swap with the coach. A Ramadan mode shortens and softens sessions around suhoor and iftar. The plan can feed the user's calorie target. Everything works offline, in English and Arabic (RTL), at $0.

## How we work through it

1. One phase at a time, in the order below. Each phase has its own file with tasks, files, tests and a finish check.
2. A phase is done when its **Verify** commands pass and its **Demo** steps work. I then stop, report what changed with the evidence, and wait for "next".
3. One commit per phase on `feat/workout-plans` (in the `../Nutrio-workouts` worktree). Nothing is pushed and no PR is opened until you ask.
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
| 7 | Ramadan mode | S | 4 | [phase-07](phase-07-ramadan-mode.md) |
| 8 | Cloud sync | M | 5 | [phase-08](phase-08-cloud-sync.md) |
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
| D5 | **Guests can use workouts**, stored on the device only |

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

**Out of scope:** reminders/notifications, Apple Health / Google Fit, heart rate, video, social, warm-up/stretching routines, automatic Ramadan date detection, Ramadan in the meal plan, Urdu.

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
| 2026-10-22 | all | Every workout feature works for PK, SA and global; region-specific behaviour only through a helper with a default, tested for all three | User's standing rule for the whole app |

## Progress

| Phase | Status | Commit |
|---|---|---|
| 0 Screen designs | done 2026-10-22, approved. [Mockups](https://claude.ai/artifact/7dEqPJ6ZK2bgkYL32owMRu) (English + Arabic pages), [spec](../../specs/2026-10-22-workout-screens-design.md) | see `git log feat/workout-plans` |
| 1 Catalogue + images | not started | |
| 2 Generator | not started | |
| 3 Setup, storage, navigation | not started | |
| 4 Week + day screens | not started | |
| 5 Logging + progression | not started | |
| 6 Manual swap | not started | |
| 7 Ramadan mode | not started | |
| 8 Cloud sync | not started | |
| 9 Calorie link | not started | |
| 10 Coach | not started | |
| 11 Check-in adherence | not started | |
