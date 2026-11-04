# Nutrio — AI nutrition & calorie coach

**Project:** AI nutrition & calorie coach (Pakistan-first, Saudi Arabia second)
**Owner:** Syed Ahmed / eCube, Lahore
**Last updated:** October 2026
**Status:** MVP built and in testing. The planning documents below are kept as the design record.

---

## Current state (October 2026)

### What the app does

- Sign-in with email code (Supabase Auth), or explore as a guest. Guests can look around (a sample workout week, the dashboard), but logging meals, water or workouts, and building a plan, ask them to create a free account.
- Six-step onboarding survey → metabolic analysis → goal → personalised calorie and macro targets.
- Daily tracker: meal slots, a meal-logging hub (diet basics, Pakistani and Saudi restaurant menus, custom meals and saved presets), an item customiser, quick staples, water, a weekly calorie bank, a diary and a logging streak.
- Weight tracking with an adaptive TDEE that recalibrates from logged intake and weigh-ins.
- Weekly check-in that proposes a capped, safety-floored target adjustment from real logs, and shows how many planned workouts were done that week (for information only).
- 7-day meal plan with one-tap swaps, filtered by diet preference.
- AI coach (Groq `openai/gpt-oss-120b`, free tier) with a translated offline fallback. It knows the user's targets, today's food log and their workout week, answers in the user's region (Pakistan or Saudi Arabia), and never gives sets, reps or weights.
- Weekly workout plans (home or gym), built on the device with no AI and no internet:
  - **Setup:** three short steps (goal and experience, where you train, days and session length), then an optional "Tell us more" whose questions follow your answers. Beginners get simple checks (push-ups, plank, brisk walking); people already training give their routine and current lifts. Likes, dislikes and sports days are asked too.
  - **Your routine, improved:** someone who already follows a routine enters it day by day. The plan keeps their days, split and exercises where safe, fixes the gaps, and shows "What we improved" with a reason for each change.
  - **The week and each day:** today's workout lists every exercise with an animated demo, sets × reps and rest. Every session ends with a cardio block, and rest days suggest a walk. Exercises can be swapped for safe alternatives.
  - **Logging:** set-by-set, with a rest timer and a how-did-it-feel rating. Each next target (more weight, more reps, a harder variation) comes with a one-line reason.
  - **Ramadan mode** switches on by itself during Ramadan (Umm al-Qura dates) for shorter, gentler sessions timed after suhoor, before iftar or after taraweeh, and switches off after Eid.
  - **Ask the coach about an exercise:** "Ask coach about this" opens the chat on that exercise. The coach may suggest one of the app's own safe alternatives, and the swap happens only when the user taps Apply.
  - **Calorie target:** saving a plan whose training changes daily energy use by 50 kcal or more offers the updated target; nothing changes unless the user accepts.
  - **Synced:** a signed-in user's plan and logs are backed up to their account and restored on another device.
  - Pakistan, Saudi Arabia (week starts Sunday) and every other region; English and Arabic.
- English and Arabic, with right-to-left layout for Saudi Arabia; light and dark themes.

Removed on purpose: meal-photo scanning, the grocery list and the weekly grocery budget. The paywall component exists but is not shown until the paid version.

### Repository layout

| Path | Contents |
|---|---|
| `apps/mobile/` | Expo 57 / React Native app (`App.tsx` routes between screens). Future web and admin apps go alongside it in `apps/`. |
| `packages/nutrition-core/` | BMR, TDEE, targets, macros, safety, adaptive TDEE, meal-plan solver, coach prompt |
| `packages/food-db/` | Local food catalogue, restaurant menus, search index |
| `packages/workout-core/` | Workout plans: exercise catalogue (174 moves, English and Arabic), weekly plan generator, progression with reasons, swaps, cardio, routine improvement, Ramadan dates. Pure and deterministic: no AI produces sets, reps or weights. Exercise data and photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain |
| `supabase/migrations/` | Database schema (`core`, `off` and `usda` schemas, row-level security), including `core.workout_plans` and `core.workout_logs` |
| `supabase/functions/` | Edge functions; `coach-chat`, `parse-food-text` and `dish-breakdown` are deployed and used by the app |
| `scripts/` | CI key guard, edge-function bundler, catalogue builders |
| `docs/` | Planning documents, design specs, archive and brand assets |

### Commands

```bash
npm install
npm run web            # or: npm run android / npm run ios
npm test               # every workspace plus the edge-function tests
npm run deploy:coach   # bundle and deploy coach-chat (needs `npx supabase login`)
```

The Groq key is an Edge Function secret (`GROQ_API_KEY`), set in the Supabase dashboard. It never goes in the app or in `.env`. CI fails if client code calls an AI provider directly or ships a key.

### Pending

- `assess`, `ocr-label`, `plan-generate` and `weekly-review` edge functions are built and tested but not deployed or called by the app. `ocr-label` uses `qwen/qwen3.6-27b`, which Groq shut down on 14 September 2026; switch it to `qwen/qwen3.8-27b` before wiring it up.
- Workout plans are complete (phases 0–11). Still to come: a Ramadan date setting for countries that start a day later (such as Pakistan). Plan, decisions and an execution record per phase: [`docs/design/plans/workout-plans/`](docs/design/plans/workout-plans/README.md).
- The coach screen shows its starter questions but not the follow-up questions the coach suggests after each answer.

---

## Planning documents — read in this order

The planning documents were written in August 2026, before the build. Each one now opens with an **"As built"** note (2026-10-25) saying what shipped and what changed. For how the code works today, read `CLAUDE.md`.

| # | File | What it is | Read if you're… |
|---|---|---|---|
| 1 | **`README.md`** (this file) | Index + final decisions | Everyone. Start here. |
| 2 | **[`ZERO_BUDGET_PLAN.md`](docs/planning/ZERO_BUDGET_PLAN.md)** | The operating constraint: $0 spend. Overrides all cost/infra decisions. | Everyone |
| 3 | **[`BUILD_INSTRUCTIONS.md`](docs/planning/BUILD_INSTRUCTIONS.md)** | Phase-by-phase tasks, API signup checklist, `.env`, curl reference, acceptance criteria | The developer. Read its As built notes alongside `CLAUDE.md`. |
| 4 | **[`NUTRITION_APP_PLAN.md`](docs/planning/NUTRITION_APP_PLAN.md)** | Product plan, market analysis, the BMR/TDEE/macro math, DB schema, safety rules | The developer + anyone on product |
| 5 | **[`GROQ_OPENROUTER_FINDINGS.md`](docs/planning/GROQ_OPENROUTER_FINDINGS.md)** | Model IDs and Groq deprecations (re-checked 2026-10-25), OpenRouter verdict | The developer, before writing any AI code |
| 6 | **[`VISION_API_ADDENDUM.md`](docs/archive/VISION_API_ADDENDUM.md)** | Vision cost analysis, free vs paid, self-host break-even | Archived: the photo feature was removed. |
| 7 | **[`PUBLIC_APIS_AUDIT.md`](docs/planning/PUBLIC_APIS_AUDIT.md)** | Audit of the public-apis repo (1,696 entries) + the ODbL licence trap | Reference. Read §Traps before touching the food database. |
| 8 | **[`DIET_FOOD_EXPANSION_PLAN.md`](docs/planning/DIET_FOOD_EXPANSION_PLAN.md)** | Diet & Basics catalogue expansion plan | Anyone adding foods |
| 9 | **[`EXERCISE_APPS_RESEARCH.md`](docs/planning/EXERCISE_APPS_RESEARCH.md)** | Workout-app market research: how plans are generated, reviews, exercise-data licences | Anyone planning the exercise feature |
| 10 | **[`workout-plans/README.md`](docs/design/plans/workout-plans/README.md)** | The workout feature's plan (complete), decisions and progress, with an execution record per phase | Anyone working on workouts |

Feature design specs and implementation plans live in [`docs/design/`](docs/design/); documents for removed features are in [`docs/archive/`](docs/archive/).

**Minimum to start work:** files 1, 2, 3, and §5 of file 4.

---

## Decisions that are FINAL

These documents were written in sequence and later ones correct earlier ones. Where they disagree, **this table wins.**

| Topic | Decision | Superseded |
|---|---|---|
| **Budget** | $0. No paid tiers, no GPU, no self-hosting. | All cost tables in files 3, 4, 6 |
| **Vision model** | ~~Groq `qwen/qwen3.6-27b`~~ — superseded: meal-photo scanning was removed (Oct 2026). | "Paid Anthropic/OpenAI from day one" in file 3 |
| **Text models** | Groq `openai/gpt-oss-120b` (chat/narrative), `openai/gpt-oss-20b` (parsing) | `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` in file 3 — **both deprecated June 2026** |
| **Food database architecture** | **Two separate databases.** `db_core` (USDA CC0 + INDB CC BY 4.0 + our Pakistani dishes) and `db_off` (Open Food Facts only). Join in app layer only. | "single Postgres" in file 4 §4.2 |
| **USDA import scope** | `Foundation` + `SR Legacy` only. **Skip Branded Foods** (350k US rows, useless here, blows the 500 MB quota). | file 4 §4.2 |
| **Open Food Facts import** | Filter to PK-relevant products before importing (~20–50k rows, ~15 MB). Never import the full export. | — |
| **Meal photos** | Feature removed (Oct 2026). If it returns: never store photos; capture → downscale 768px → Groq → JSON → discard. | — |
| **Label OCR** | Phase 1, not Phase 3. OCR.space free tier. | file 4 Phase 3 |
| **Distribution** | **PWA first.** No Apple ($99/yr, cut). Google Play ($25) later. Keep the RN codebase for a later native build. | "store submission" in file 3 week 10 |
| **Nutritionix** | Not used. Public free tier was discontinued. | file 4 §12 |
| **Gemini free tier** | Not used. Its terms permit training on submitted content with human review. | — |
| **OpenRouter free tier** | Not used. `:free` endpoints require opting into training + prompt publication. | — |
| **OpenRouter paid** | Adopt later as gateway with ZDR-only ON and all four training toggles OFF. | — |
| **Dietitian sign-off** | Deferred. Dishes computed from INDB/USDA via the INFOODS/EuroFIR recipe method, flagged `verified_by: computed`, with a strengthened disclaimer. | file 4 §4.2 |
| **Paywall / RevenueCat** | Not in the $0 phase. Nothing to charge for during validation. | file 3 week 9 |

---

## The five rules that never bend

Copied from `BUILD_INSTRUCTIONS.md` Part 0 because they matter more than anything else in this set:

1. **All nutrient values come from our database. Never from an LLM.** The model identifies a dish and estimates grams. It never emits a calorie number.
2. **All targets are computed in `nutrition-core` with unit tests.** No model call produces a target.
3. **No API key touches the client.** Everything goes through a Supabase Edge Function.
4. **No user health data through any endpoint that trains on inputs.** Groq is safe (account-wide no-training + self-serve ZDR). Gemini free and OpenRouter `:free` are not.
5. **Open Food Facts data stays in its own database.** ODbL share-alike means merging it with our data would legally oblige us to publish our Pakistani food database. This is a licence obligation, not a style preference.

---

## What makes this product defensible

Three things, none of which cost money:

1. **Pakistani food database** with correct local serving units (`1 roti = 45g`, `1 katori daal = 150g`) and an explicit `oil_added_g` field. Desi cooking oil is why every western app reads ~30% low on our food.
2. **Adaptive TDEE** — closed-loop recalculation from logged intake and weight trend. This is what separates a real coach from a calculator. Formula in `NUTRITION_APP_PLAN.md` §5.5.
3. **Honest estimation** — calories always come from our database, never from a model, and the adaptive weekly check-in corrects targets from real logs instead of trusting a formula forever. (Photo estimation was planned here and has been removed.)

No free API gives you any of these. That's the good news.

---

## Known ceilings

$0 works to roughly **300–500 daily active users**. Binding constraint is Groq's 1,000 vision requests/day.

Crossing it costs about **$50** (Supabase Pro $25/mo + Play $25 one-time) plus ~$0.001 per vision scan. Eight subscribers at PKR 999/mo covers it.

Full ceiling table in `ZERO_BUDGET_PLAN.md` §4.

---

## Do these in week 1

1. Enable **Zero Data Retention** in Groq Data Controls — before any test data goes through.
2. Register free accounts under a shared `dev@` mailbox: Supabase, Groq, OCR.space, USDA, GitHub, Langfuse, PostHog, Sentry, OneSignal.
3. Set up the **keep-alive cron** (Supabase free projects pause after 7 days idle) **and a weekly `pg_dump` backup Action** (free tier has no backups).
4. Write `nutrition-core` — safety tests first. One day's work, de-risks everything downstream.
5. Import USDA Foundation + SR Legacy. Confirm the DB stays under 50 MB.
6. ~~Benchmark `qwen/qwen3.6-27b` on meal photos~~ — no longer needed; photo scanning was removed.
7. Apply to **Mistralship** and every startup credit programme eCube qualifies for. Up to ~$30k in credits would erase the ceiling entirely.

---

## Standing instructions

- **Check `console.groq.com/docs/deprecations` at the start of every sprint.** Groq killed its entire Llama chat lineup *and* its previous vision model within three months. Assume it happens again.
- **Every model ID lives in one config file.** No inline model strings in feature code.
- **Keep the `VisionProvider` abstraction strict.** It's what makes provider changes a one-file swap — and it's the insurance policy against a preview model disappearing overnight.

---

## Open questions for Syed — these block schema work

Answer before week 3:

1. **Launch market** — Pakistan only, or Pakistan + Gulf? Affects food data priority and payment rails.
2. **Urdu support** — Phase 1 or Phase 2? Urdu voice logging would be a real differentiator and reuses the Whisper/TTS work from the drive-thru project.
3. **Standalone product or eCube clinic-services channel?** Dietitians and GPs prescribing the app to patients is a different product with a practitioner dashboard and different economics. Decide before the schema hardens.
4. **Wearables** — HealthKit / Google Fit / Fitbit in Phase 1 or later? Step data materially improves TDEE accuracy over the self-reported slider.
5. **Dietitian** — who eventually signs off the Pakistani food data, and when do we pay for it?
