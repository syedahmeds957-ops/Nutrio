# Nutrition App — Build Instructions & API Setup

**For:** implementing developer
**From:** Syed Ahmed / eCube
**Date:** August 2026
**Read with:** `NUTRITION_APP_PLAN.md` (product plan + math) and `PUBLIC_APIS_AUDIT.md` (why these APIs)

---

## How to read this

- **Part 1–3** = get accounts and keys. Do this first, day one.
- **Part 4** = architecture rules. Read before writing code. Two of them are legal, not stylistic.
- **Part 5–8** = phase-by-phase tasks with acceptance criteria.

**Note on keys:** I cannot hand you key values — every one of these requires signing up under an eCube account. Part 1 lists exactly where to sign up, what plan, and what it costs. Register all Phase-0 accounts under a shared `dev@ecube...` mailbox, not a personal one, and put the secrets in a password manager the whole team can reach. Do not let one person hold them.

---

## Part 0 — Five rules that don't bend

1. **All nutrient values come from our database. Never from an LLM.** The model may identify a dish and estimate grams. It may never emit a calorie number. If you find yourself parsing kcal out of a model response, stop and rearchitect.
2. **All calorie/macro targets are computed in `nutrition-core` with unit tests.** No model call is involved in producing a target.
3. **No API key touches the client.** Every third-party call goes through a Supabase Edge Function. If a key appears in the React Native bundle, it is compromised — assume it will be extracted.
4. **Free-tier LLM keys never see user data.** Free Gemini/Groq keys are for local dev and synthetic-data testing only. Production uses paid keys. Enforce it in CI (Part 4.4).
5. **Open Food Facts data stays in its own database.** Never joined at rest with our own food tables. This is a licence obligation, not a preference. See Part 4.2.

---

## Part 1 — Account & key checklist

### Phase 0 (get these in week 1)

| # | Service | Sign up at | Plan | Cost | Used for |
|---|---|---|---|---|---|
| 1 | **USDA FoodData Central** | `fdc.nal.usda.gov/api-key-signup` (or `api.data.gov/signup`) | Free key | $0 | Base food composition data. **CC0 public domain.** |
| 2 | **Open Food Facts** | No signup — no key required | Open | $0 | Barcode / packaged products |
| 3 | **Groq** | `console.groq.com` | Free → Developer | $0 → pay-as-you-go | Coach chat, text meal parsing, plan narratives |
| 4 | **OCR.space** | `ocr.space/ocrapi` | Free | $0 | Nutrition-label scanning |
| 5 | **Supabase** | `supabase.com` | Free → Pro | $0 → $25/mo | DB, auth, storage, edge functions |
| 6 | **Anthropic** *or* **OpenAI** | `console.anthropic.com` / `platform.openai.com` | **Paid, from day one** | usage | Vision (photo→items+mass), assessment narrative |
| 7 | **Hugging Face** | `huggingface.co` → Settings → Access Tokens | Free | $0 | Embeddings for food-name matching |
| 8 | **Langfuse** | `langfuse.com` (or self-host) | Free tier | $0 | LLM tracing + cost tracking |

### Phase 1–2 (get when you reach them)

| # | Service | Sign up at | Cost | Used for |
|---|---|---|---|---|
| 9 | **OneSignal** | `onesignal.com` | Free tier | Meal reminders, weekly check-in push |
| 10 | **QuickChart** | `quickchart.io` — no key needed | $0 | Chart images for WhatsApp share / PDF reports |
| 11 | **wger** | `wger.de` → register → API key, **or self-host** | $0 | Exercise database |
| 12 | **Fitbit** | `dev.fitbit.com/apps/new` | $0 | Step/activity data → TDEE input |
| 13 | **RevenueCat** | `revenuecat.com` | Free < $2.5k MTR | Subscriptions |
| 14 | **Jina AI** | `jina.ai` | Free tier | Reranking (backup to HF) |

### Phase 2–3 (evaluate, may not need)

| # | Service | Why | Note |
|---|---|---|---|
| 15 | **Spoonacular** | Recipe content for Phase 2 | Free → $149/mo. Western-skewed. |
| 16 | **Edamam** | NLP fallback + Vision benchmark | Free tier usually needs a card |
| 17 | **FatSecret** | Gap-fill food lookups | ~5,000 calls/day free **but mandatory FatSecret branding in-app** — check that against our paid product before committing |
| 18 | **Roboflow Universe** | Benchmark open food-detection models | Free tier, evaluation only |
| 19 | **Clarifai** | Food identification model | Free tier, evaluation only |

### Explicitly NOT signing up for

- **Nutritionix** — public free tier discontinued; paid is $299–1,850/mo; its strength is US chain restaurants, useless for Lahore.
- **Gemini free tier** — its terms permit using submitted content (and responses) to improve Google products, with possible human review. We send meal photos + weight + medical flags. Not acceptable. If we ever use Gemini, it is a paid key.
- **Infermedica / ApiMedic** — symptom checkers. Medical-device regulatory risk. No.
- **openFDA drug data** — deferred indefinitely pending legal review.

---

## Part 2 — `.env` template

Create `.env.example` in the repo with **empty values**. Real values go in Supabase Edge Function secrets and your local `.env` (gitignored). Never commit a populated `.env`.

```bash
# ---------- Environment ----------
APP_ENV=                       # local | staging | production

# ---------- Supabase ----------
SUPABASE_URL=
SUPABASE_ANON_KEY=             # safe for client
SUPABASE_SERVICE_ROLE_KEY=     # SERVER ONLY. Never in the RN bundle.

# ---------- Food data ----------
USDA_FDC_API_KEY=              # https://fdc.nal.usda.gov/api-key-signup
OFF_USER_AGENT=                # e.g. "eCubeNutrition/1.0 (dev@ecube.example)"

# ---------- LLM: text ----------
GROQ_API_KEY=
GROQ_MODEL_CHAT=llama-3.3-70b-versatile
GROQ_MODEL_FAST=llama-3.1-8b-instant

# ---------- LLM: vision (PAID ONLY) ----------
VISION_PROVIDER=               # anthropic | openai
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
VISION_TIER=                   # must be "paid" in production — CI asserts this

# ---------- OCR ----------
OCRSPACE_API_KEY=

# ---------- Embeddings ----------
HUGGINGFACE_API_KEY=
JINA_API_KEY=

# ---------- Observability ----------
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# ---------- Phase 1+ ----------
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
WGER_API_KEY=
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
REVENUECAT_PUBLIC_KEY=
```

---

## Part 3 — Endpoint reference

### 3.1 USDA FoodData Central — the foundation

Base: `https://api.nal.usda.gov/fdc/v1` · Key passed as **query param**, not a header.

```bash
# search
curl "https://api.nal.usda.gov/fdc/v1/foods/search?query=chicken%20breast&pageSize=25&dataType=Foundation,SR%20Legacy&api_key=$USDA_FDC_API_KEY"

# single food
curl "https://api.nal.usda.gov/fdc/v1/food/173944?api_key=$USDA_FDC_API_KEY"

# batch, max 20 ids
curl -X POST "https://api.nal.usda.gov/fdc/v1/foods?api_key=$USDA_FDC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fdcIds":[173944,1750340]}'
```

**Limits:** ~1,000 requests/hour per IP. `DEMO_KEY` is throttled to roughly 30/hour — fine for a first curl, useless otherwise.

**Nutrient IDs you need** (in the `foodNutrients` array):

| ID | Nutrient |
|---|---|
| 1008 | Energy (kcal) |
| 1003 | Protein |
| 1004 | Total fat |
| 1005 | Carbohydrate, by difference |
| 1079 | Fiber |
| 2000 | Total sugars |
| 1093 | Sodium |
| 1258 | Saturated fat |

**Do not call this at runtime.** Download in bulk once during Phase 0, normalise to per-100g, store in `db_core`. Prefer `Foundation` and `SR Legacy` (lab-analysed, complete) over `Branded` (manufacturer-reported, patchy). Licence is CC0 — no attribution needed, no restrictions.

### 3.2 Open Food Facts — barcode only, isolated

```bash
curl "https://world.openfoodfacts.org/api/v2/product/737628064502.json" \
  -H "User-Agent: eCubeNutrition/1.0 (dev@ecube.example)"
```

**Limits:** 15 req/min/IP for product reads, 10 req/min/IP for search. They explicitly say **do not use it for search-as-you-type** — you will be IP-banned. A custom `User-Agent` is required.

**Do this instead:** download the daily JSONL/CSV export once, load into `db_off`, index locally, and query your own copy. That removes the rate limit entirely and is what they recommend for anything above a few hundred products. Refresh weekly via cron.

**Mandatory UI attribution** wherever OFF data is displayed:

> This record contains information from Open Food Facts, made available under the Open Database License.

### 3.3 Groq — text LLM (OpenAI-compatible)

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role":"user","content":"..."}],
    "response_format": {"type":"json_object"},
    "temperature": 0.3
  }'
```

Because it's OpenAI-compatible, the `openai` SDK works with `baseURL` swapped — that makes provider switching trivial.

**Limits (free tier):** ~30 RPM and roughly 1,000–14,400 RPD depending on model. **These are per-organisation. Extra API keys do not raise them, and multi-accounting to get around them violates Groq's ToS.**

**Why this matters for us specifically:** meal logging peaks hard at 1–2pm and 8–10pm. 30 RPM is one request every two seconds across the entire app. Free tier will start throwing 429s at roughly 300 DAU, precisely at dinner time. Move to the Developer tier before public launch — no subscription fee, ~10× limits, pay only for usage.

### 3.4 Vision — paid provider, abstracted

Never call the provider SDK directly from feature code. One interface:

```ts
// ai/providers/types.ts
export interface VisionProvider {
  identifyMeal(imageBase64: string, context?: string): Promise<{
    items: Array<{
      name: string;
      estimatedGrams: number;
      cookingMethod?: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    referenceObjectDetected: boolean;
    notes?: string;
  }>;
}
```

Implement `anthropic.ts` and `openai.ts` against it. Select with `VISION_PROVIDER`. This lets you A/B two providers on the same photo and measure real accuracy on Pakistani food — which you will need, because published benchmarks are on western cafeteria food.

**Prompt rules:**
- Demand strict JSON. Validate with zod server-side. Retry once on failure, then fall back to manual entry — never show the user a crash.
- Ask for **grams**, never calories.
- Instruct it to use visible cutlery/plates/hands as scale references and to report whether it found one.
- Downscale images to ~768px before upload. Negligible accuracy loss, large token saving.

**Expect ~26–37% energy error** on image-only estimates, with systematic *under*estimation that worsens as portions grow. Build the correction UI accordingly (Part 8).

### 3.5 OCR.space — nutrition labels

```bash
curl -X POST https://api.ocr.space/parse/image \
  -F "apikey=$OCRSPACE_API_KEY" \
  -F "OCREngine=2" \
  -F "scale=true" \
  -F "isTable=true" \
  -F "file=@label.jpg"
```

**Limits (free):** 25,000 requests/month, 500/day per IP, **1 MB max file size via API** (the 5 MB figure is the web UI, not the API). Compress client-side before upload. `OCREngine=2` is the best speed/accuracy balance; Engine 3 is more capable but has a separate, smaller quota (~2,500/mo).

**Why this is in Phase 1 and not Phase 3:** the numbers are *printed on the packet*. No estimation, no error. It solves Shan, National, Olpers, Nurpur, Peek Freans, Tapal — packaged goods that appear in no western database. It is both more accurate and cheaper than photo-calorie estimation, and it ships months earlier.

Parse the returned `ParsedResults[0].ParsedText` with regex + the LLM as a fallback for messy layouts. Always show the user the parsed values for confirmation before saving.

### 3.6 Embeddings — Hugging Face

Used to match "chicken karahi" / "murgh karahi" / "karahi chicken" to one DB row. Store vectors in Supabase `pgvector`. Hybrid retrieval: Postgres full-text + trigram first, embeddings as the tiebreaker. Don't reach for embeddings when `pg_trgm` already answers it.

### 3.7 The rest

- **QuickChart** — `https://quickchart.io/chart?c={...}` returns a PNG. No auth. Use for weekly-summary images users can share to WhatsApp, which is how apps spread here.
- **wger** — `https://wger.de/api/v2/exercise/?format=json`. Self-host it (AGPL) and you have no rate limit and no dependency.
- **Fitbit / HealthKit / Google Fit** — OAuth. Step count replaces the self-reported activity slider, which is the least reliable input in the whole onboarding.

---

## Part 4 — Architecture rules

### 4.1 Repo layout

```
/apps/mobile              React Native (Expo dev client)
/packages/nutrition-core  BMR/TDEE/macros/safety — pure functions, no I/O, no network
/packages/food-db         ingestion + normalisation scripts
/supabase/functions       Edge Functions (all third-party calls live here)
/supabase/migrations      SQL
/docs
```

`nutrition-core` must have **zero dependencies on network or database**. It takes numbers, returns numbers. It is the most testable and most important code in the project.

### 4.2 Two databases — legal requirement ⚠️

```
db_core   USDA (CC0) + Anuvaad INDB (CC BY 4.0) + our Pakistani dishes
          → this is the company asset

db_off    Open Food Facts only
          → barcode lookup exclusively
```

Open Food Facts is ODbL: attribution **and share-alike**. Per their own FAQ, if you combine OFF data with other databases, **the resulting database must be released as open data too.** Merging OFF into `db_core` would legally oblige us to publish our Pakistani food database — the one asset we cannot give away.

**Rules:**
- Separate Postgres schemas. No foreign keys between them. No view or materialised table that joins them.
- Join in the application layer at query time only.
- When a user logs a barcode item, copy the *values* into `meal_items` as that user's personal record. Never insert an OFF row into `db_core.foods`.
- Render the attribution string in the UI wherever OFF data appears.

Legal review before launch. Cheap now, expensive later.

### 4.3 Edge Function pattern

Every third-party call:

```
client → supabase.functions.invoke('...') → Edge Function
                                              ├─ verify JWT, resolve user_id
                                              ├─ rate-limit per user
                                              ├─ call third party with server-side key
                                              ├─ validate response against zod schema
                                              ├─ write ai_jobs row (provider, tokens, cost, latency)
                                              └─ return validated result
```

If schema validation fails: retry once, then return a graceful fallback. Never surface a raw model error.

### 4.4 CI guard on free keys

Add a check that fails the build if `APP_ENV=production` and any of: `VISION_TIER != paid`, a known free-tier key prefix is present, or `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` is empty while `VISION_PROVIDER` is set. Rule 4 in Part 0 has to be mechanically enforced or it will be violated on a deadline.

### 4.5 Offline-first

Logging writes to local SQLite/MMKV first, then syncs. Pakistani mobile data is unreliable, and a failed log is a lost user. Queue with retry, conflict resolution last-write-wins on `meal_entries`.

---

## Part 5 — Phase 0: Setup (week 1)

| Task | Acceptance |
|---|---|
| Register accounts 1–8 (Part 1) | All keys in shared password manager; `.env.example` committed with empty values |
| Monorepo scaffold + Expo dev client boots on device | `npm run dev` runs on a physical Android phone |
| Supabase project, two schemas `core` and `off` | Migration applied; RLS enabled on every user table |
| USDA bulk download → normalised to per-100g | ≥7,000 Foundation + SR Legacy rows in `core.foods` |
| OFF daily export → `off` schema, barcode index | Barcode lookup returns in <50ms locally |
| `nutrition-core` implemented with tests | 100% branch coverage on formulas + every safety floor |
| Langfuse wired to a hello-world Edge Function | A trace with token count and cost appears in the dashboard |

**`nutrition-core` must implement** (formulas in `NUTRITION_APP_PLAN.md` §5): Mifflin-St Jeor, Katch-McArdle, Harris-Benedict, Cunningham; activity multipliers 1.2–1.9 with occupational/exercise split; goal→delta at 7,700 kcal/kg; macro allocation; and every safety rule — floors of 1,200 kcal (F) / 1,500 kcal (M), never below BMR, deficit capped at 25% of TDEE, weight-loss disabled below BMI 18.5, no cut goal under age 18, pregnancy/breastfeeding → maintenance only.

**Write the safety tests first.** They are the part that must never regress.

---

## Part 6 — Phase 1: Assessment + Targets + Tracker (weeks 2–10)

Ship-able and monetisable on its own.

### Week 2–3 — Onboarding survey

Multi-step, one question per screen, ~2.5 minutes. Persist to `lifestyle_surveys` as versioned JSONB — never overwrite, always append a new version.

Sections: basics (sex, DOB, height, weight, optional body fat/waist) · activity (job type, working hours, shift, commute, sitting hours) · training (type, frequency, duration) · lifestyle (sleep, stress, meal timing, **chai count with sugar**, eating out, water, smoking) · health (conditions, medications, allergies, pregnancy) · preferences (veg/non-veg, dislikes, budget band — collected now, used in Phase 2).

The chai question is not a joke. Sweetened chai is routinely 300–600 kcal/day here and is usually the single highest-leverage intervention the app will find.

### Week 4 — Assessment Edge Function

```
compute in code (nutrition-core)
  → inject those numbers into the prompt as ground truth
  → Groq generates the narrative: why this number, what the lifestyle
    data implies, the 3 highest-leverage changes, week-by-week expectation
  → validate JSON schema
  → on failure: retry once, then serve a templated non-LLM narrative
```

The model explains. It does not calculate. If the narrative contains a number the code didn't produce, that's a bug.

### Week 5 — Goal selection + plan reveal

Goal is chosen **after** the analysis, as specified. Rate slider showing projected timeline and an honest note on what's realistic. Safety flags may disable options — show why, don't silently hide them.

### Week 5–6 — Tracker

Search (Postgres FTS + trigram over `db_core`), recents, favourites, frequently-used, barcode scan (local `db_off` index), quick-add kcal, custom food. Rings, remaining kcal, macro bars, water, weight widget. Offline queue.

### Week 7 — Weight log + adaptive TDEE

EWMA smoothing (α ≈ 0.25). Weekly `pg_cron` job recomputes:

```
Δweight_kg    = EWMA(today) − EWMA(today − n)
TDEE_observed = mean_daily_intake − (Δweight_kg × 7700) / n
w             = min(0.9, days_logged / 28)
TDEE_est      = w · TDEE_observed + (1 − w) · TDEE_formula
```

Cap target changes at ±150 kcal/week. If `TDEE_observed < 1.1 × BMR`, the user is under-logging — nudge logging quality, **do not cut their calories**.

**This algorithm is the product's main differentiator. Do not skip it to hit a date.**

### Week 8 — Pakistani food dataset v1 + label OCR

400–600 dishes. For each: standard recipe with ingredient grams and cooking method → compute nutrients from USDA/INDB rows using EuroFIR/INFOODS yield + retention factors → dietitian review and sign-off.

Store `oil_added_g` explicitly on every cooked dish. Desi cooking oil is the largest hidden-calorie source and the main reason western apps read ~30% low on our food.

Build `food_servings` in local units: `1 roti (medium) = 45g`, `1 katori daal = 150g`, `1 cup chai with sugar = 200g`, `1 medium naan`, `1 plate biryani`. **This table is most of the UX.** Getting it right matters more than the model.

Ship OCR label scanning in the same week. Test on 20 real Pakistani packets and record the parse rate.

### Week 9–10 — Polish, paywall, ship

Notifications, empty states, RevenueCat, QA, Langfuse dashboards, store submission.

**Pricing:** PK free tier = 3 photo scans/day + basic tracker + static target. Premium PKR 799–1,299/mo or PKR 6,999/yr. **Do not copy Cal AI's hard paywall at onboarding — in Pakistan it kills you.** The assessment is free. It's the wow moment, it's cheap to serve, and it's what people screenshot and forward.

### Phase 1 definition of done

- [ ] LLM never emits a number the code didn't produce
- [ ] Every safety floor enforced and unit-tested
- [ ] Offline logging works and syncs
- [ ] Adaptive TDEE recalculates and explains its change to the user
- [ ] ≥500 Pakistani dishes searchable with correct default servings
- [ ] Label OCR parses ≥80% of tested Pakistani packets
- [ ] Every AI call logged in `ai_jobs` with provider, tokens, cost, latency
- [ ] OFF attribution rendered; `db_off` provably isolated
- [ ] Production build fails CI if a free-tier key is configured

---

## Part 7 — Phase 2: Cultural diet plans (6–8 weeks)

**Hybrid generation. Not pure LLM.**

```
1. Constraint solver (code) selects foods hitting kcal + macro targets within
   5% tolerance, from a cuisine-filtered pool, respecting allergies/dislikes/budget.
   Greedy or knapsack — both are documented working approaches.
2. LLM assembles them into culturally coherent meals: names, quantities in local
   units (roti, katori, plate), simple cooking instructions.
3. Code re-verifies totals against target. Off by >5% → regenerate or auto-adjust
   portions. Grounded LLM meal plans hit ~1.5–3.7% error; ungrounded ones are far worse.
4. Swap: any meal → 3 macro-matched alternatives, one tap.
```

Cuisines: Pakistani, North Indian, South Indian, Middle Eastern/Saudi, Western, Mediterranean, Russian/Eastern European.
Diet types: non-veg, veg, vegan, halal-only, eggetarian, low-carb, high-protein, diabetic-friendly, PCOS-friendly, Ramadan.

Also ship:
- **Grocery list** generated from the week's plan
- **Budget tier in PKR/week** — nobody else does this, and here it matters
- **Family mode** — plan *around* the household menu rather than demanding separate meals. This is the single biggest real-world adherence blocker in Pakistani homes.
- **Ramadan mode** — suhoor/iftar split, hydration windows

Route diabetic/renal/PCOS plans through a restricted, dietitian-approved template set. Do not let the model freestyle on clinical diets.

---

## Part 8 — Phase 3: Photo calories (5–7 weeks)

### Pipeline

```
photo
 1. on-device quality gate (blur / dark / no food) — reject cheaply, before spending a call
 2. vision LLM → dish + ingredients + cooking method + estimated GRAMS (strict JSON)
 3. match each item against db_core (trigram + embedding hybrid)
 4. portion resolution:
      reference object detected → scale from it
      known standard serving    → use it
      otherwise                 → MEDIUM serving, confidence = LOW
 5. compute nutrients from db_core rows × grams   ← calories come from the DB
 6. apply learned per-dish calibration correction
 7. return value + confidence band + fully editable item list
 8. user correction → vision_corrections → feeds calibration and that user's defaults
```

### Non-negotiable UX

Never show a bare number as fact. Show `~620 kcal`, a confidence band, and an obvious one-tap portion corrector (S / M / L / custom grams). Users forgive an estimate they can fix. They delete an app that confidently lies.

Cal AI's known weakness is that corrections don't persist. Ours must — per user *and* in aggregate.

### Ship alongside

**Voice and text logging.** "Do roti aur daal ka bowl" is faster than a photo *and* more accurate. Groq parses it cheaply. Do not treat this as secondary — for many users it will be the primary path.

### Cost control

Downscale to 768px. Cache by perceptual hash — the same user photographs the same breakfast 200 times a year. Free tier: 3 scans/day. Paid: unlimited. That cap is the natural paywall.

### Internal accuracy dashboard

Track predicted vs. corrected on every scan. Target: median absolute error under 20% on Pakistani dishes within 6 months — beatable *only* because our DB does the nutrient math. Track correction rate; it should fall over time.

Before writing any Phase 3 app code, run 50 Nutrition5k images (CC BY 4.0, commercial use allowed) through both vision providers and measure baseline MAPE. That tells you whether this is a 5-week or a 15-week project.

---

## Part 9 — Cost expectations

Per active user per month, at ~2 photo scans/day:

| Item | Cost |
|---|---|
| Vision (768px, structured output) | $0.30–0.90 |
| Coach chat (Groq Developer) | $0.05–0.15 |
| Weekly narrative | $0.04–0.10 |
| Supabase + storage + push | $0.05–0.15 |
| **Total** | **~$0.45–1.30** |

At PKR 999/mo that's under 15% of ARPU. **Do not spend engineering time trying to get this to zero.** Cap free-tier scans hard instead — an abusive free user costs more than a paying one contributes.

---

## Part 10 — Traps

| Trap | What happens | Avoid by |
|---|---|---|
| Merging OFF into `db_core` | Legally obliged to open-source our Pakistani DB | Two schemas, app-layer joins only |
| Free LLM key in production | User health data used for model training, human review possible | Paid keys + CI guard |
| Calling USDA/OFF live at runtime | Rate-limited into failure at launch | Bulk ingest, own the data |
| Search-as-you-type against OFF API | IP ban | Local index |
| LLM emits calorie numbers | Inconsistent, unauditable, uncorrectable | DB supplies nutrients, always |
| Skipping adaptive TDEE to hit a date | Product becomes another commodity calculator | It ships in Phase 1 |
| Shipping photo estimates without correction UI | Users catch the errors and churn | Confidence band + one-tap fix |
| No `oil_added_g` on desi dishes | Systematically ~30% low, exactly like the western apps | Explicit field, dietitian-reviewed |
| Onboarding paywall | Kills PK conversion | Assessment is free |
| One person holding all keys | Bus factor 1 | Shared password manager, day one |

---

## Part 11 — First five actions

1. Register USDA FDC key; start the bulk download today.
2. Pull the Open Food Facts daily export; stand up `db_off` with a local barcode index.
3. Register Groq + OCR.space; prototype label scanning on 20 Pakistani packets this week.
4. Write `nutrition-core` with the safety tests first. It's about a day's work and de-risks everything downstream.
5. Identify and budget the dietitian who signs off the Pakistani food data. Week 1, not week 8.

**Open decisions from the main plan that block schema work** — confirm with Syed before week 3: launch market (PK-only vs PK+Gulf), Urdu in Phase 1 or 2, standalone product vs eCube clinic-services channel, wearable integration timing.
