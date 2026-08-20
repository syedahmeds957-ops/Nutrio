# Nutrition App — Documentation Set

**Project:** AI nutrition & calorie coach (Pakistan-first)
**Owner:** Syed Ahmed / eCube, Lahore
**Last updated:** August 2026
**Status:** Planning complete. Ready to build.

---

## Read in this order

| # | File | What it is | Read if you're… |
|---|---|---|---|
| 1 | **`README.md`** (this file) | Index + final decisions | Everyone. Start here. |
| 2 | **`ZERO_BUDGET_PLAN.md`** | The operating constraint: $0 spend. Overrides all cost/infra decisions. | Everyone |
| 3 | **`BUILD_INSTRUCTIONS.md`** | Phase-by-phase tasks, API signup checklist, `.env`, curl reference, acceptance criteria | The developer. This is your main document. |
| 4 | **`NUTRITION_APP_PLAN.md`** | Product plan, market analysis, the BMR/TDEE/macro math, DB schema, safety rules | The developer + anyone on product |
| 5 | **`GROQ_OPENROUTER_FINDINGS.md`** | Current model IDs, Groq's free vision model, OpenRouter verdict | The developer, before writing any AI code |
| 6 | **`VISION_API_ADDENDUM.md`** | Vision cost analysis, free vs paid, self-host break-even | Reference. Read when Phase 3 starts. |
| 7 | **`PUBLIC_APIS_AUDIT.md`** | Audit of the public-apis repo (1,696 entries) + the ODbL licence trap | Reference. Read §Traps before touching the food database. |

**Minimum to start work:** files 1, 2, 3, and §5 of file 4.

---

## Decisions that are FINAL

These documents were written in sequence and later ones correct earlier ones. Where they disagree, **this table wins.**

| Topic | Decision | Superseded |
|---|---|---|
| **Budget** | $0. No paid tiers, no GPU, no self-hosting. | All cost tables in files 3, 4, 6 |
| **Vision model** | Groq `qwen/qwen3.6-27b` (free, no training on data, JSON mode). Preview status — benchmark before trusting. | "Paid Anthropic/OpenAI from day one" in file 3 |
| **Text models** | Groq `openai/gpt-oss-120b` (chat/narrative), `openai/gpt-oss-20b` (parsing) | `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` in file 3 — **both deprecated June 2026** |
| **Food database architecture** | **Two separate databases.** `db_core` (USDA CC0 + INDB CC BY 4.0 + our Pakistani dishes) and `db_off` (Open Food Facts only). Join in app layer only. | "single Postgres" in file 4 §4.2 |
| **USDA import scope** | `Foundation` + `SR Legacy` only. **Skip Branded Foods** (350k US rows, useless here, blows the 500 MB quota). | file 4 §4.2 |
| **Open Food Facts import** | Filter to PK-relevant products before importing (~20–50k rows, ~15 MB). Never import the full export. | — |
| **Meal photos** | **Never stored.** Capture → downscale 768px → Groq → JSON → discard. Optional 100×100 thumbnail only. | — |
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
3. **Honest photo estimation** — confidence bands and one-tap correction that *persists*. Cal AI's known weakness is that corrections don't stick. Ours must, per user and in aggregate.

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
6. **Benchmark `qwen/qwen3.6-27b`** on 50 Nutrition5k images + 50 real Pakistani plates. This single experiment decides whether Phase 3 is viable at $0.
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
