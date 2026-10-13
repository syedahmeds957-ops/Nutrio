# AI Nutrition & Calorie Coach — Full Build Plan

**Owner:** eCube (Lahore)
**Date:** August 2026
**Status:** Planning / pre-build

---

## 0. Two hard truths before we start

Read these first. They change the architecture.

### 0.1 Do not train your own "nutritionist model"

You asked for "an AI fully trained on this type of knowledge and dataset." You don't need one, and building one is the fastest way to burn 6 months and produce something worse than what you get for free.

Reasons:

- **Calorie targets are arithmetic, not intelligence.** BMR → TDEE → deficit → macro split is a closed-form formula validated over 30+ years. An LLM adds nothing except the risk of hallucinating a number. Compute it in code. Deterministic, testable, auditable, free.
- **The "professional nutritionist knowledge" part is a prompt + retrieval problem**, not a training problem. A frontier model already holds this knowledge. What it lacks is *your* guardrails, *your* Pakistani food context, and *your* user's data. That is solved by a system prompt + RAG over a curated knowledge base + tool calls into your own DB.
- **Fine-tuning is the last resort, not the first.** If after 6 months you find the model is bad at, e.g., Pakistani portion sizes, you fine-tune a small model on *your own accumulated user corrections*. That data doesn't exist yet. You can't fine-tune on nothing.

**Architecture rule: math in code, judgment in the LLM, never the reverse.**

### 0.2 "Exact calories from a photo" is not achievable

Peer-reviewed 2025–2026 evaluations of vision LLMs on food photos:

| Model | Energy MAPE (image only) | Notes |
|---|---|---|
| GPT-4o / GPT-5-class | ~26–36% | drops to ~14% when user supplies ingredients |
| Claude (Opus/Sonnet-class) | ~37% weight, ~36% energy | comparable to GPT |
| Gemini 1.5/2.x Pro | ~64–110% | worst; also sometimes refuses mass estimation |
| Human nutritionist | ~30–40% | *humans are also bad at this* |
| Crowd of 10 laypeople | beats the average expert | aggregation helps |

Consistent findings across studies:

1. **Food identification is easy (~93% precision). Portion/volume is the bottleneck.** Vision can tell it's biryani. It cannot tell you it's 340 g of biryani.
2. **All models systematically underestimate**, and underestimation gets worse as portions get bigger (bias slope −0.23 to −0.50). You must correct for this.
3. **A reference object in frame cuts error roughly in half** (mass MAPE ~17% with reference vs ~27% without).
4. **Adding text context beats better models.** "Chicken karahi, 1 medium bowl, cooked in ghee" + photo ≫ photo alone.

**Product implication:** never show a bare number as if it's fact. Show `~620 kcal` with a confidence band, a one-tap portion corrector (S / M / L / custom grams), and a visible "tap to fix" affordance. Users forgive an estimate they can correct. They abandon an app that confidently lies.

This is also your competitive wedge: Cal AI's known weakness is that its corrections don't persist and it has no coaching layer. Yours will.

---

## 1. Positioning

The market has split into two camps:

- **Photo-first, zero-coaching** (Cal AI and its ~40 clones). Fast, viral on TikTok, shallow, accuracy criticised, subscription-gated at onboarding.
- **Coaching-first, manual logging** (MacroFactor, Cronometer). Rigorous adaptive TDEE, no photo, slow logging, aimed at serious lifters.

Nobody has credibly done **both** for **South Asian food and South Asian users**. Every major tracker's database is a US/EU packaged-goods catalogue. A Lahore user logging *nihari*, *haleem*, *chapli kabab*, *paratha*, *lassi*, *chana chaat* gets garbage or nothing.

**Our position:** adaptive coaching (MacroFactor-grade math) + photo logging (Cal AI-grade UX) + a first-class Pakistani/South Asian food database and cultural meal planning. Priced for PKR, not USD.

Secondary market: Gulf/Saudi expat South Asians, and Indian/Bangladeshi diaspora. Same food graph.

---

## 2. Competitive scan

| App | Model | Strength | Weakness we exploit |
|---|---|---|---|
| **MacroFactor** | Adaptive TDEE, manual log | Best-in-class algorithm; claims ~3× more accurate than static TDEE | No photo logging; small-ish DB; no desi food; USD pricing |
| **Cal AI** | Photo-first | Fastest logging; huge social growth | No coaching; estimates unreliable on mixed dishes; corrections don't persist; hard paywall at onboarding |
| **MyFitnessPal** | Huge crowdsourced DB | Coverage | 2026 redesign added friction; crowdsourced data quality; ads |
| **Cronometer** | 80+ micronutrients | Data depth | Overkill; weak photo; clinical feel |
| **Yazio / Lifesum** | Polished consumer UX | Design | Generic western meal plans |
| **Fitia** | LatAm-localised meal plans | Proves localisation works commercially | Not our region |
| **Noom** | Behavioural/psych | Retention | Expensive, human coaches, not scalable to PK pricing |
| **PlateLens / Nutrola / Intake** | New AI entrants | Adaptive + photo combined | Very new, no regional depth |

**Lesson from Fitia:** cultural localisation of *meal plans* (not just the food DB) is a proven moat. That's our Phase 2.

---

## 3. Recommended stack

Aligned with what eCube already runs, so we reuse existing muscle.

| Layer | Choice | Why |
|---|---|---|
| Mobile | **React Native (Expo, dev client)** | One codebase, camera + health-kit access, team already knows RN |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Edge Functions + RLS) | Already our default; pgvector built in for RAG; row-level security fits per-user health data |
| Search over food DB | **Postgres FTS + pg_trgm**, upgrade to pgvector hybrid later | Fast, no extra service |
| AI orchestration | **Supabase Edge Functions** (Deno) calling model APIs | Keys never touch the client. Non-negotiable. |
| Vision model | **GPT-5-class or Claude vision** via server-side proxy | Best measured accuracy; swap-able behind one interface |
| Coach model | Same provider, smaller/cheaper tier | Cost control |
| Analytics | PostHog (self-host or cloud) | Funnel + retention, GDPR-friendly |
| LLM observability | **Langfuse** | Already used on the drive-thru project. Reuse. |
| Charts | Victory Native XL / Skia | Weight-trend + macro rings |
| Payments | RevenueCat + Play/App Store; **JazzCash/Easypaisa via web checkout for PK** | Store fees kill PKR pricing; web checkout for local |
| Push | Expo Notifications | Meal-log reminders drive retention |

**Local-first requirement:** logging must work offline. Write to local SQLite/MMKV, sync to Supabase on reconnect. Pakistani mobile data is unreliable and a failed log = a lost user.

**Model abstraction layer:** wrap every model call in `/ai/providers/*.ts` with one interface. Prices and rankings shift every quarter. You want to swap providers in one file, and you want to A/B two providers on the same photo to measure real accuracy on *your* users' food.

---

## 4. Food data strategy — the real moat

This is where most clones die and where you should spend disproportionate effort.

### 4.1 Sources

| Source | Coverage | Cost | License | Verdict |
|---|---|---|---|---|
| **USDA FoodData Central** | ~300k US foods, lab-grade nutrients | Free (API key) | CC0 / public domain | **Take it.** Bulk-download, don't call live. Base layer. |
| **Open Food Facts** | ~2.5M+ packaged products, 180+ countries, barcodes | Free | ODbL (attribution + share-alike on the DB) | **Take it** for barcode scanning. Read the ODbL carefully. |
| **INDB / Anuvaad Indian Nutrient Databank** | ~500+ Indian foods & recipes | Free | CC BY 4.0 | **Take it.** Closest public proxy for desi food. |
| **Pakistan Food Composition Table (FCT)** | tiny, ~27 items, 2001 revision | Free | Government | Nearly useless alone — it's 25 years old and missing most macronutrients. Use only as a cross-check. |
| **FAO/INFOODS + regional (Bangladesh, India) FCTs** | recipe-level | Free | Varies | Use the FAO/INFOODS + EuroFIR recipe-calculation method to build composite dishes |
| **Nutritionix** | 1.9M items, restaurant chains, NLP | ~$299–$1,850/mo | Commercial | Only if we go big on US/chain data. Skip for now. |
| **Edamam** | NLP + Vision + 615k UPC | Free tier → $999/mo | Commercial | Fallback |
| **FatSecret** | 1.9M items, 56 countries, ~5,000 free calls/day | Free tier generous | Commercial | Good cheap fallback for gaps |
| **Spoonacular** | 365k recipes | Free → $149/mo | Commercial | Only for Phase 2 recipe content |
| **Passio / LogMeal / Calorie Mama / Spike** | Food-recognition SDKs | Commercial | — | Benchmark against, probably don't buy |

### 4.2 The build

Don't call third-party APIs at runtime for core lookups. **Own your data.**

1. Bulk-ingest USDA + Open Food Facts + INDB into your own Postgres.
2. Normalise to a single schema: per-100g basis, with a `serving_units` table mapping human units ("1 roti", "1 katori", "1 medium naan", "1 bowl") to grams. *This gram-mapping table is 80% of the user experience.*
3. **Build the Pakistani layer by hand.** Target 400–600 dishes covering ~95% of what a Lahore/Karachi user actually eats.
   - Method: for each dish, write a standard recipe (ingredients + grams + cooking method), compute nutrients from USDA/INDB ingredient rows using the EuroFIR/INFOODS recipe method (apply yield + retention factors for cooking).
   - Have a qualified Pakistani dietitian review and sign off. Budget for this. It is the moat.
   - Store `oil_added_g` explicitly — desi cooking oil is the single largest hidden-calorie source and the reason western apps are 30% low on our food.
4. Tag every food with `source`, `confidence`, `verified_by`, `last_reviewed`. Show provenance in the UI. Trust is a feature.
5. **Capture user corrections.** Every time a user edits a photo estimate or a portion, log it. After 12 months this is a proprietary dataset nobody else has, and *that* is your eventual fine-tuning corpus.

### 4.3 Restaurant layer (Phase 2.5, high value in PK)

Nobody has calorie data for Student Biryani, Butt Karahi, Cheezious, Howdy, Optp, Kaybees. Menu items scraped + a dietitian estimate = enormous differentiation, and it directly leverages your existing restaurant/café client relationships at eCube. Several of those clients might even give you real recipes.

---

## 5. The math (implement exactly this)

All of this lives in a single pure module, `packages/nutrition-core`, with unit tests. No LLM touches it.

### 5.1 BMR

**Mifflin-St Jeor** (default — most accurate for general population):

```
male:   BMR = 10·W(kg) + 6.25·H(cm) − 5·A(yr) + 5
female: BMR = 10·W(kg) + 6.25·H(cm) − 5·A(yr) − 161
```

**Katch-McArdle** (use when body-fat % is known — better for lean/athletic users):

```
LBM = W · (1 − bodyfat%)
BMR = 370 + 21.6 · LBM(kg)
```

Also compute **Cunningham** and **Harris-Benedict** and store all four; you'll want them for later calibration analysis.

### 5.2 TDEE

```
TDEE = BMR × activity_factor + EAT + NEAT_adjustment
```

| Factor | Descriptor | Use when |
|---|---|---|
| 1.20 | Sedentary | desk job, <5k steps, no training |
| 1.375 | Light | 1–3 sessions/wk or 5–8k steps |
| 1.55 | Moderate | 3–5 sessions/wk or 8–12k steps |
| 1.725 | Very active | 6–7 sessions/wk, or physical job |
| 1.90 | Extra | 2-a-days, labourer + training |

Better: split it. `TDEE = BMR × occupational_factor + (weekly_exercise_kcal / 7)`. Ask for job type and training separately in onboarding — a Lahore rider or a construction worker is not a "sedentary office user," and lumping them into one slider is how western apps get PK users wrong.

Feed **step count from HealthKit / Google Fit** when available and use it to override the self-reported slider. Self-reported activity is the least reliable input in the entire onboarding.

### 5.3 Goal → calorie target

```
1 kg body mass ≈ 7700 kcal
daily_delta = (target_rate_kg_per_week × 7700) / 7
```

Safe rates:

| Goal | Rate | Notes |
|---|---|---|
| Fat loss | 0.5–1.0% bodyweight/week | >1%/wk risks lean mass loss; cap it |
| Maintenance | 0 | |
| Lean gain (novice) | 0.25–0.5% bodyweight/week | |
| Lean gain (advanced) | 0.125–0.25%/week | faster = mostly fat |

**Hard floors — enforce in code, not in the prompt:**

- Never below `max(BMR, 1200 kcal)` for women, `max(BMR, 1500 kcal)` for men.
- Never a deficit >25% of TDEE.
- If BMI < 18.5 → weight-loss goal is **disabled**, not discouraged. Show a message, offer maintenance or gain.
- Age < 18 → no cut goal, redirect to a paediatrician. (Also an app-store compliance issue.)
- Pregnancy/breastfeeding flag → maintenance + higher targets only, plus a "see your doctor" gate.
- Flags for diabetes / CKD / hypertension / thyroid → route to a restricted plan set and a stronger medical disclaimer. Do **not** let the LLM freestyle on renal or diabetic diets.

### 5.4 Macros

```
Protein:  1.6–2.2 g/kg bodyweight   (cutting: up to 2.4 g/kg; obese: use LBM or adjusted BW)
Fat:      min 0.6 g/kg, and ≥20% of total kcal   (hormonal floor)
Carbs:    remainder
Fibre:    14 g per 1000 kcal
Water:    30–35 ml/kg (raise for Lahore summer — genuinely relevant here)
```

Adjust ratio by goal and by cultural pattern. A desi diet is naturally carb-heavy (roti/rice); a plan that demands 40% protein will be abandoned in a week. Plan **within** the user's existing eating pattern, don't replace it.

### 5.5 Adaptive TDEE — the differentiator

Static TDEE formulas are wrong for most people within weeks. This closed-loop algorithm is what makes MacroFactor good, and it's not hard to implement.

**Weekly (or rolling-daily) recalculation:**

1. Smooth bodyweight with an **exponentially-weighted moving average** (α ≈ 0.25, daily weigh-ins) to kill water-weight noise.
2. Over a window of *n* days:

```
Δweight_kg    = EWMA_weight(today) − EWMA_weight(today − n)
TDEE_observed = mean_daily_intake − (Δweight_kg × 7700) / n
```

3. Blend observed with the formula estimate, weighting observed more as data accumulates:

```
w = min(0.9, n_days_logged / 28)
TDEE_est = w · TDEE_observed + (1 − w) · TDEE_formula
```

4. Re-derive the calorie target from `TDEE_est` and the goal rate. Cap week-over-week target changes at ±150 kcal so it doesn't whipsaw.
5. Handle under-reporting: if `TDEE_observed` is implausibly low (<1.1 × BMR), the user is under-logging, not broken. Nudge logging quality; don't slash their calories.

A Kalman filter is the "proper" version of this. Start with EWMA + linear regression on the weight trend; upgrade later if it's worth it.

**This algorithm alone justifies the subscription.** Ship it in Phase 1.

---

## 6. AI architecture

Three distinct AI surfaces. Keep them separate — different prompts, different models, different cost profiles, different failure modes.

### 6.1 The Analyst (onboarding assessment) — Phase 1

**Input:** structured onboarding JSON + the deterministic outputs of §5.
**Job:** explain, contextualise, flag risks, recommend lifestyle changes. **Never** invent numbers.

Pattern:

```
1. Code computes: BMR, TDEE, target, macros, safety flags, projected timeline.
2. Those numbers are injected into the prompt as ground truth.
3. LLM writes the narrative: why this number, what your sleep/work pattern is doing
   to you, the 3 highest-leverage changes, what to expect week by week.
4. Output is a strict JSON schema, validated server-side before it reaches the client.
```

Use structured outputs / tool-calling so the response is parseable. If validation fails, retry once, then fall back to a templated non-LLM narrative. The app must never show a blank screen because a model call failed.

**Lifestyle analysis inputs worth collecting** (this is where you beat calculator apps):

- Working hours + shift pattern (night shift materially changes metabolic advice)
- Sleep duration & consistency
- Sitting hours/day, commute type
- Stress self-rating
- Meal timing, skipped meals, late-night eating
- Tea/chai count per day *with sugar* — in Pakistan this is often 300–600 hidden kcal/day and is the single highest-leverage intervention you will find
- Ramadan/fasting patterns
- Eating out frequency, who cooks at home
- Smoking, alcohol (handle discreetly), medication
- Water intake
- Previous diet attempts and what failed

### 6.2 The Coach (ongoing chat + weekly check-in) — Phase 1.5

RAG over:
- The user's own logged data (last 30 days) — via tool calls into Postgres, not stuffed in the prompt
- A curated knowledge base of nutrition guidance (WHO, dietary guidelines, position stands from ISSN/AND) in pgvector
- The Pakistani food DB

Guardrails in the system prompt **and** in code:
- Never diagnose
- Never prescribe or comment on medication
- Never set a target below the code-enforced floor
- Detect disordered-eating language → stop coaching, surface support resources, disable aggressive goals
- Always defer to a doctor on medical conditions

### 6.3 The Vision Estimator (photo → calories) — Phase 3

Pipeline, not a single call:

```
photo
 └─> [1] on-device: quality check (blur, darkness, no-food detection). Reject early, cheap.
 └─> [2] vision LLM: identify dish + ingredients + cooking method + estimated portion
         → structured JSON, no free text
 └─> [3] match each identified item against OUR food DB (fuzzy + embedding search)
 └─> [4] portion resolution:
         - reference object detected (plate, spoon, hand, phone)? → scale
         - dish has a known standard serving in our DB? → default to it
         - else → default to a MEDIUM serving and mark confidence LOW
 └─> [5] compute nutrients from OUR DB rows × grams  ← calories come from the DB, NOT the LLM
 └─> [6] apply calibration correction for known underestimation bias
 └─> [7] return: value + confidence band + editable item list
 └─> [8] user correction → stored → feeds calibration + future defaults for that user
```

**Step 5 is the key design decision.** The LLM identifies and estimates *mass*. Your database supplies the *nutrients*. This makes results consistent (same dish = same kcal/100g every time), auditable, correctable, and much cheaper to improve.

Cost control:
- Downscale images to ~768px before upload — negligible accuracy loss, large token saving
- Cache by perceptual hash: the same user photographs the same breakfast 200 times a year
- Free tier: 3 photo scans/day. Paid: unlimited. This is your natural paywall.

Accuracy improvements worth building:
- Prompt the user for one word of context ("ghee or oil?") when confidence is low — the research shows text context beats a better model
- Encourage a reference object (fork/spoon in frame) via a camera-overlay hint — cuts mass error nearly in half
- If the phone has LiDAR/depth (iPhone Pro), capture depth. Volume is the bottleneck; depth solves it directly.

---

## 7. Data model (Supabase / Postgres)

```sql
-- identity
profiles(id uuid pk, auth_uid, display_name, sex, dob, height_cm,
         locale, country, timezone, units_pref, created_at)

-- immutable log of body metrics
body_metrics(id, user_id, measured_at, weight_kg, bodyfat_pct,
             waist_cm, hip_cm, source enum('manual','healthkit','scale'))

-- onboarding + periodic re-survey; versioned, never overwritten
lifestyle_surveys(id, user_id, version, answered_at, payload jsonb)

-- one row per computed plan revision; full audit trail
targets(id, user_id, effective_from, effective_to,
        bmr, tdee_formula, tdee_adaptive, goal enum('lose','maintain','gain'),
        rate_kg_per_week, kcal_target, protein_g, carb_g, fat_g, fibre_g,
        water_ml, method text, safety_flags jsonb, generated_by enum('rule','adaptive'))

-- canonical food graph
foods(id, name, name_ur, brand, category, cuisine_tags text[],
      kcal_100g, protein_100g, carb_100g, fat_100g, fibre_100g,
      sugar_100g, sodium_mg_100g, sat_fat_100g, micros jsonb,
      source enum('usda','off','indb','pak_custom','user'),
      source_ref, verified_by, verified_at, confidence smallint,
      is_recipe bool, oil_added_g numeric)

food_servings(id, food_id, label, label_ur, grams, is_default)
-- e.g. ('1 roti (medium)', 45), ('1 katori daal', 150), ('1 cup chai w/ sugar', 200)

recipe_items(recipe_food_id, component_food_id, grams, yield_factor, retention_factor)

-- logging
meal_entries(id, user_id, logged_at, meal_slot enum('breakfast','lunch','dinner','snack'),
             source enum('search','barcode','photo','voice','recipe','quick'),
             photo_path, ai_job_id, note)

meal_items(id, meal_entry_id, food_id, grams, kcal, protein_g, carb_g, fat_g,
           confidence enum('high','med','low'), was_corrected bool,
           original_grams numeric)

-- AI audit — every model call is logged
ai_jobs(id, user_id, kind enum('assess','coach','vision','plan'),
        provider, model, prompt_tokens, completion_tokens, cost_usd,
        latency_ms, input_ref, output jsonb, validated bool, created_at)

-- proprietary training corpus
vision_corrections(id, user_id, ai_job_id, predicted jsonb, corrected jsonb, created_at)

-- phase 2
diet_plans(id, user_id, cuisine, diet_type, generated_at, kcal_target, payload jsonb, active bool)
plan_days(id, plan_id, day_index, meals jsonb)

-- knowledge base for RAG
kb_chunks(id, doc_title, source_url, chunk_text, embedding vector(1536), tags text[])
```

RLS on every user table: `auth.uid() = user_id`. Health data. No exceptions, no service-role shortcuts in client code.

---

## 8. Phase 1 — Assessment + Targets + Tracker

**Goal:** a user can onboard, get a credible personalised target with a real explanation, log food, and see their target adapt. Ship-able and monetisable on its own.

**Timeline: 8–10 weeks.**

### Screens

1. **Onboarding survey** — multi-step, one question per screen, progress bar, ~2.5 min total
   - Basics: sex, DOB, height, weight, (optional) body fat, waist
   - Activity: job type, working hours, shift, commute, sitting hours, steps
   - Training: type, frequency, duration, intensity
   - Lifestyle: sleep, stress, meal timing, chai/sugar, eating out, water, smoking
   - Health: conditions, medications, allergies, pregnancy — with the disclaimer gate
   - Preferences (collect now, use in Phase 2): veg/non-veg/halal-only, dislikes, budget band
2. **Analysis screen** — animated computation, then the report: BMR, TDEE, current trajectory, key risk flags, top 3 lifestyle levers
3. **Goal selection** — *only after* analysis, as specified. Lose / Maintain / Gain, with a rate slider showing the projected timeline and an honest note on what's realistic
4. **Plan reveal** — kcal + macro rings + weekly projection chart + the AI narrative
5. **Daily tracker** — rings, remaining kcal, macro bars, meal slots, water, weight widget
6. **Food search & log** — search, recents, favourites, frequently-used, barcode scan, quick-add kcal, custom food
7. **Weight log** — daily weigh-in prompt, EWMA trend chart vs. raw dots
8. **Weekly check-in** — adaptive TDEE recalculation, target update, "here's what changed and why"
9. **Profile / settings** — units, re-survey, export data, delete account

### Build order

| Wk | Work |
|---|---|
| 1 | Supabase schema + RLS + auth; Expo shell + navigation; design system |
| 2 | `nutrition-core` package: BMR/TDEE/macros/safety, full unit-test suite |
| 2–3 | Food DB ingestion pipeline: USDA + OFF + INDB → normalised Postgres; FTS indexes |
| 3–4 | Onboarding survey flow + persistence |
| 4 | Analysis Edge Function: deterministic compute → LLM narrative → schema validation |
| 5 | Goal selection + plan reveal + charts |
| 5–6 | Tracker: search, log, barcode, quick-add, offline queue + sync |
| 7 | Weight logging + EWMA + adaptive TDEE job (pg_cron weekly) |
| 8 | Pakistani food dataset v1 (400–600 dishes) + serving-size table + dietitian review |
| 9 | Notifications, onboarding polish, empty states, paywall, RevenueCat |
| 10 | QA, Langfuse dashboards, store submission |

### Phase 1 definition of done

- Targets computed in code, LLM never emits a number the code didn't produce
- Every safety floor enforced and unit-tested
- Offline logging works and syncs
- Adaptive TDEE recalculates and explains itself
- ≥500 Pakistani dishes searchable with correct default serving sizes
- Every AI call logged in `ai_jobs` with cost

---

## 9. Phase 2 — Cultural & lifestyle diet plans

**Timeline: 6–8 weeks after Phase 1.**

Cuisines: Pakistani, North Indian, South Indian, Middle Eastern/Saudi, American/Western, Mediterranean, Russian/Eastern European.
Diet types: non-veg, veg, vegan, halal-only, eggetarian, low-carb, high-protein, diabetic-friendly, PCOS-friendly, Ramadan (suhoor/iftar structured).

**Generation approach — hybrid, not pure LLM:**

```
1. Constraint solver (code) picks foods hitting kcal + macro targets within tolerance,
   from a cuisine-filtered candidate pool, respecting allergies/dislikes/budget.
   Greedy or knapsack-style; both are documented working approaches in this space.
2. LLM assembles them into culturally coherent MEALS with names, quantities in
   local units (roti, katori, plate), and simple cooking instructions.
3. Code re-verifies the final plan's totals against target. If off by >5%, regenerate
   or auto-adjust portions. NutriGen showed LLM+DB grounding hits ~1.5–3.7% error;
   ungrounded LLM plans are far worse.
4. Swap mechanism: any meal → 3 alternatives at matched macros, one tap.
```

Also ship:
- Grocery list generation from the week's plan
- Budget tier (PKR/week) — genuinely important in this market and nobody does it
- Family mode: the user eats what the household cooks; plan around the household menu instead of demanding separate meals. This is the #1 real-world adherence blocker in Pakistani homes.
- Ramadan mode: suhoor/iftar split, hydration windows, tarawih activity

---

## 10. Phase 3 — Photo calorie estimation

**Timeline: 5–7 weeks after Phase 2.**

Pipeline as specified in §6.3. Plus:

- **Multi-item plates**: segment and itemise; users must be able to delete/edit individual items
- **Voice + text logging** shipped alongside — "two rotis and a bowl of daal" is faster than a photo and *more* accurate. Cheap to add once the parser exists. Do it.
- **Barcode** was already in Phase 1; unify all four entry paths into one logging sheet
- **Accuracy dashboard (internal)**: track predicted vs. corrected on every scan. This is your product metric. Target: median absolute % error under 20% on Pakistani dishes within 6 months of launch — better than any general model achieves, because your DB is doing the nutrient math.
- **Calibration loop**: per-dish correction factors learned from user edits. If 300 users all correct "biryani" upward by 25%, adjust the default.

Optional later: LiDAR depth capture on supported iPhones; a small on-device classifier (Food-101 / MobileNet-class) for instant common-food identification before the network call.

---

## 11. GitHub repos worth mining

None of these is a drop-in skeleton — nothing open-source combines adaptive TDEE + photo + desi food. Use them for reference architecture, schema ideas, and to avoid re-solving solved problems.

**Closest to a real skeleton:**

- `simonoppowa/OpenNutriTracker` — the most mature open-source tracker. Flutter, but its **backend repo (`OpenNutriTracker-Backend`) runs on Supabase** with a documented multi-source food import pipeline (USDA CC0 + Open Food Facts + BLS + Anuvaad INDB). **Study the import pipeline and schema in detail — it is exactly the problem you're about to solve.** Note it's GPL-family; use it as a reference, don't copy code into a closed product without checking the licence.
- `antomanc/simple-calorie-tracker` — React Native, OpenFoodFacts + USDA integration, clean diary UX. Good RN reference.
- `iliasradouche/AI-Calories-tracker` — RN Expo + Node + Prisma + GPT-4o vision + Supabase storage. Closest to your full stack; small project, but the wiring is instructive.
- `Alexis-Papazoglou/CalorieTracker` — RN, image analysis via backend, goal setup from weight/height/activity.

**AI / planning references:**

- `SamanKhamesian/NutriGen` — LLM meal-plan generation grounded in USDA. Reports ~1.55% (Llama 3.1 8B) and ~3.68% (GPT-3.5) deviation from caloric targets. **This is the paper/repo to copy the Phase 2 approach from.**
- `myselfshravan/AI-Meal-Planner` — BMR → knapsack ingredient selection → LLM for meal naming. Exactly the hybrid pattern in §9.
- `Priyansh6747/Nutrilio` — RN + voice logging + RAG chatbot + deficiency detection. Good feature-scope reference.
- `buriihenry/AI-Nutrition-Assistance` — RAG nutrition assistant with LLM-as-judge evaluation. Copy the **evaluation** methodology.
- `Shubhamsaboo/awesome-llm-apps` — includes an AI Health & Fitness agent; general agent patterns.

**Data / vision:**

- `google-research-datasets/Nutrition5k` — 5,006 plates, RGB + depth + video + per-ingredient weights. **CC BY 4.0, commercial use allowed.** Your benchmark set for measuring vision accuracy. Caveat: California cafeteria food only — no desi coverage, which is precisely the gap you'd be filling.
- Food-101 / UECFood — classic classification datasets if you ever want an on-device classifier.

**Also worth reading:** the Tanabe & Yanai 2025 result — bolting a volume-estimation module onto GPT-4o cut calorie MAE from ~78.8 kcal to ~64.3 kcal on Nutrition5k. Confirms: *vision is fine, volume is the bottleneck.*

---

## 12. API keys / accounts to obtain

| Service | Purpose | Priority |
|---|---|---|
| USDA FoodData Central | bulk food data | P0 — free, get today |
| Open Food Facts | barcode/packaged; bulk dumps, no key needed | P0 — free |
| Anthropic and/or OpenAI | assessment, coach, vision | P0 |
| Supabase | backend | P0 |
| RevenueCat | subscriptions | P1 |
| Langfuse | LLM tracing | P1 |
| FatSecret | gap-fill lookups, ~5k free calls/day | P2 |
| Edamam | NLP fallback | P3 |
| Passio / LogMeal | benchmark our vision pipeline against a specialist | P3 — evaluation only |
| JazzCash / Easypaisa merchant | PK payments | P1 |

---

## 13. Unit economics

Rough per-active-user monthly AI cost (assume 2 photo scans/day, 1 coach chat/week, 1 assessment ever):

| Item | Calls/mo | Est. cost |
|---|---|---|
| Vision (768px, structured output) | 60 | $0.30–0.90 |
| Coach chat | 4 | $0.05–0.15 |
| Weekly plan narrative | 4 | $0.04–0.10 |
| Onboarding assessment | ~0.1 amortised | negligible |
| **Total** | | **~$0.40–1.15/user/mo** |

Supabase + storage + push: ~$0.05–0.15/user/mo at scale.

**Pricing:**

| Market | Free | Premium |
|---|---|---|
| Pakistan | 3 scans/day, basic tracker, static target | **PKR 799–1,299/mo** (~$3–4.5) or PKR 6,999/yr |
| Gulf / diaspora | same | $6.99/mo or $49.99/yr |

Margin holds comfortably. But **cap free-tier scans hard** — an abusive free user costs you more than a PK subscriber pays.

Do **not** copy Cal AI's hard paywall-at-onboarding. In Pakistan that kills you. Give the assessment away free — it's the wow moment, it's cheap to serve, and it's what people will screenshot and share.

---

## 14. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Photo accuracy disappoints users | High | Confidence bands, one-tap correction, honest copy, voice/text logging as the accurate path |
| App Store / Play health-app rejection | High | Disclaimers, no diagnosis claims, no medical device claims, age gate |
| Someone with an eating disorder uses this | **Critical** | Hard calorie floors in code, BMI gate, disordered-eating language detection, no "goal weight" below BMI 18.5, resources surfaced. Get this right before launch, not after. |
| LLM hallucinates a calorie number | High | LLM never emits nutrient values; DB does. Schema validation on every output. |
| Pakistani food data is wrong | High | Dietitian sign-off, provenance shown in UI, user correction loop |
| Model provider price/policy change | Medium | Provider abstraction layer; A/B two providers |
| Health data breach | **Critical** | RLS everywhere, no PII in prompts (use user_id references + server-side hydration), encrypted storage, documented retention & deletion, clear privacy policy |
| Retention collapse after week 2 | High | This is the real killer in this category. Streaks, weekly check-in with a *changing* target, meal reminders, family mode. Instrument the week-1/week-4 funnel from day one. |
| Open Food Facts ODbL obligations | Medium | Legal read before launch; attribution + share-alike apply to the *database*, not your app code |

**Non-negotiable disclaimer**, shown at onboarding and in settings:

> This app provides general nutrition information for healthy adults. It is not medical advice, diagnosis, or treatment, and it is not a substitute for a qualified doctor or registered dietitian. Consult a healthcare professional before starting any diet, especially if you are pregnant, breastfeeding, under 18, or have a medical condition.

---

## 15. Metrics that matter

- **D1 / D7 / D30 retention** — the only number that predicts survival
- **Logs per active day** (target ≥2.0)
- **Onboarding completion rate** (target ≥70%)
- **Assessment → goal-set conversion**
- **Free → paid conversion** (target 3–6%)
- **Median absolute % error, photo scan** (predicted vs. user-corrected) — your accuracy moat, tracked per cuisine
- **Correction rate** (% of scans edited) — falling over time = improving
- **AI cost per active user** — must stay under ~35% of ARPU
- **Adaptive TDEE convergence** — how many weeks until targets stabilise

---

## 16. Open decisions — need your call

1. **Launch market:** Pakistan-only first, or Pakistan + Gulf simultaneously? Affects pricing, payment rails, and food DB priority.
2. **Urdu language support** — Phase 1 or Phase 2? Voice logging in Urdu would be a genuine differentiator and plays directly to the Whisper/TTS work already done on the drive-thru project.
3. **Standalone product or eCube service offering?** The clinic/doctor services business is an obvious distribution channel — dietitians and GPs prescribing the app to patients, with a practitioner dashboard. That's a different product with different economics. Decide before the schema hardens.
4. **Dietitian partner** — who signs off the Pakistani food data and the plan templates? Budget and identify this person in week 1, not week 8.
5. **Wearable integration** — HealthKit/Google Fit in Phase 1 or later? Step data materially improves TDEE accuracy.
6. **Do we open-source the Pakistani food database?** Costs the moat, buys enormous credibility and free crowdsourced corrections. Arguable both ways.

---

## 17. Immediate next actions

1. Register for a USDA FoodData Central API key; start the bulk download.
2. Clone and read `OpenNutriTracker-Backend`'s Supabase schema and import pipeline end to end.
3. Download Nutrition5k; run 50 images through Claude vision and GPT vision with the §6.3 prompt and measure your own baseline MAPE. **Do this before writing any app code** — it tells you whether Phase 3 is a 5-week or a 15-week project.
4. Write `nutrition-core` with the §5 formulas and a full test suite. It's a day's work and it de-risks everything downstream.
5. Draft the onboarding survey question set; run it past a dietitian.
6. Decide items 1–4 in §16.
