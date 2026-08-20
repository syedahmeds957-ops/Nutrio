# public-apis Repo Audit → Nutrition App

**Source:** `github.com/public-apis/public-apis` (466k stars, MIT)
**Parsed:** 1,696 entries across 50 categories, pulled from `master` and filtered locally
**Date:** August 2026

---

## Verdict first

Your instinct is **half right**.

✅ **Right:** don't train or host your own model. Use managed APIs. Nothing in this project needs a GPU.

❌ **Wrong:** *free tiers* are not the way to run a production health app. Three specific reasons, each of which will bite you:

1. **Gemini's free tier trains on your data.** Google's terms state that content sent to non-paid services — and the generated responses — may be used to provide, improve, and develop Google products, and **human reviewers may see it**. Google explicitly tells developers not to submit sensitive or personal information to non-paid services. Your payload is a user's meal photo plus their weight, age, and medical flags. That is exactly the data you must not put through a free tier. Paid tier: prompts and responses are *not* used for training. If you ever serve EEA/Switzerland/UK users, Google's terms require paid services for them anyway.

2. **Rate limits are per-organisation, not per-user.** Groq's free tier is roughly 30 RPM and 1,000–14,400 RPD depending on model, and the limits apply at the org level — extra API keys do not raise them, and Groq's ToS prohibits multi-accounting to get around it. Gemini free is roughly 250–1,000 RPD depending on model. Now consider that **meal logging is the most bursty workload imaginable**: everyone in Lahore logs lunch between 1–2pm and dinner between 8–10pm. 30 RPM is one request every two seconds shared across your entire userbase. You'd be serving 429s to paying customers at exactly the moment they're using the app.

3. **The repo is stale in the places that matter most.** It still lists Nutritionix as a free `apiKey` API. Nutritionix's own developer portal now states they have discontinued the public free-access tier due to misuse of free trial accounts. Every entry below has been re-verified; assume anything not listed here needs checking before you build on it.

**Reframe:** use free tiers to *build and prototype*, and to permanently replace things you'd otherwise pay for that aren't user-data-sensitive. Budget ~$0.40–1.15/active user/month for the AI that touches user data. At PKR 999/mo pricing that's under 15% of ARPU. This is not the cost to optimise.

---

## Tier A — take these, they're genuinely free and production-viable

| API | Use in our app | Reality check |
|---|---|---|
| **USDA FoodData Central** (Health) | Base food composition layer — Foundation, SR Legacy, FNDDS, Branded | Free API key. **CC0 / public domain — no attribution, no share-alike, no restrictions.** The cleanest licence in the entire food space. Bulk-download, don't call live. **This is your foundation.** |
| **Open Food Facts** (Food & Drink) | Barcode scanning for packaged goods | Free, no key. **But: 15 req/min/IP for product reads, 10 req/min/IP for search — they explicitly say don't use it for search-as-you-type.** They ask for a descriptive custom User-Agent. For >a few hundred products, use the daily CSV/JSONL exports, not the API. **Licence trap — see §Traps.** |
| **Groq** (Machine Learning) | Coach chat, plan narrative generation, text-log parsing | Free key, no credit card, all models, ~30 RPM / 1,000–14,400 RPD per model. Open-source models only (Llama, Qwen, GPT-OSS) — no Claude/GPT/Gemini. **Free tier is worth ~$4–17/mo of paid traffic.** Speed is exceptional (300–1,000 tok/s), which matters for chat UX. Developer tier has no subscription fee, ~10× limits, pay-per-use. **Use free for dev, Developer tier for prod.** |
| **OCR.Space** (Documents) | **Nutrition-label scanning** — user photographs the back of a packet, we parse the panel | Free tier. This is a genuinely useful find that isn't obvious from the category name. Far more accurate than photo-calorie estimation, because the numbers are printed right there. Big win for packaged Pakistani goods (Nurpur, Olpers, Shan, National) that aren't in any western database. |
| **Hugging Face Inference** (Machine Learning) | Embeddings for food-name matching and RAG; optional food classifier | Free tier with API key. Use for `sentence-transformers` embeddings so you don't pay OpenAI for vector search. |
| **Jina AI** (Machine Learning) | Embeddings + reranking, free tier | Alternative/backup to HF for the same job. Reranking is genuinely useful when fuzzy-matching "chicken karahi" against 500 DB rows. |
| **Fitbit / Strava / Tredict** (Sports & Fitness) | Real activity + step data feeding the TDEE calculation | OAuth, free. **This directly improves your core algorithm.** Self-reported activity is the least reliable onboarding input; step count replaces a guess with a measurement. Also add HealthKit/Google Fit natively. |
| **wger** (Sports & Fitness) | Exercise database — names, muscles, equipment, images | Open-source workout manager with a public API. **Self-hostable**, so no rate limit and no dependency. Gives you the training side of "trainer" for free without curating exercises yourself. |
| **QuickChart** (Development) | Chart images for weekly-summary emails, WhatsApp shares, PDF reports | Free, no auth. Renders charts server-side as PNG. Useful because in-app charts don't survive being shared to WhatsApp — and WhatsApp sharing is how apps spread in Pakistan. |
| **OneSignal** (Development) | Push notifications | Free tier is generous. Meal-log reminders are a top-3 retention lever. |
| **Roboflow Universe** (Machine Learning) | Pre-trained food-detection CV models to benchmark against | Free tier. Worth 2 days of evaluation before committing to a paid vision API — there are public food-segmentation models here. |
| **Clarifai** (Machine Learning) | Food recognition model (identification only, not calories) | Has a dedicated food model; one of the open-source calorie trackers we found uses it exactly this way (Clarifai for detection, USDA for nutrients). Free tier for evaluation. |
| **LibreTranslate** (Text Analysis) | Urdu ⇄ English for the bilingual build | Free, **no auth**, self-hostable. ⚠️ Verify Urdu is in the language set on the instance you use — the hosted one advertises a limited set. Self-host with the Urdu Argos model if not. |

---

## Tier B — conditional, verify before building on

| API | Use | Why it's Tier B |
|---|---|---|
| **Edamam Nutrition + Recipes** | NLP recipe→nutrition; Phase 2 recipe content | Free tier exists but typically requires a card, and it's split across three separate products. Scales to $999/mo. Fine as a gap-filler, bad as a foundation. Also has a Vision endpoint worth benchmarking. |
| **Spoonacular** | Phase 2 recipes, meal-plan endpoints, diet filters | ~365k recipes, free → $149/mo. Reasonable for recipe *content*, but western-skewed. Won't help you with desi food. |
| **Chomp** | Grocery/branded product data | `apiKey`, commercial. Fallback for barcode gaps only. |
| **TheMealDB** | Recipe images and structure for Phase 2 UI | Effectively free with a public test key, but the licensing for commercial use is unclear. Use for prototyping; verify before shipping. |
| **UPC Database** (Open Data) | Barcode fallback when OFF misses | 1.5M barcodes. Second-line only. |
| **Fruityvice** | Fruit nutrition | Free, no auth, but trivially small. Nice-to-have filler, not a data source. |
| **openFDA** (Health) | Drug data — theoretically for nutrient/drug interaction warnings | ⚠️ **Tempting and dangerous.** Surfacing drug-food interactions makes you look like a medical device. Do not ship this without legal review. Deferred indefinitely. |
| **Google Gemini** | Vision, coach | Excellent model, **but free tier is unusable for us on privacy grounds** (see §Traps). Use *paid* Gemini or a paid competitor. Note Gemini 3.x Pro has been paid-only since April 2026, and independent food-photo benchmarks put Gemini's error at 64–110% MAPE vs ~26–37% for GPT/Claude class — so it's likely the wrong vision model here regardless of tier. |

---

## Tier C — listed in the repo, don't use

| API | Why not |
|---|---|
| **Nutritionix** | **Public free tier discontinued.** Repo entry is stale. Paid is ~$299–1,850/mo, custom enterprise contracts, no self-serve mid tier, and free usage historically required in-app Nutritionix attribution. Its one real advantage is US chain-restaurant menus, which is worthless for Lahore. |
| **Infermedica / ApiMedic** (symptom checkers) | Medical triage. Straight into medical-device regulatory territory and app-store rejection. Absolutely not. |
| **Cure Cancer With AI, Clinical Trials, CMS.gov, NPPES, MedlinePlus, all COVID APIs** | Irrelevant to consumer nutrition. The Health category in this repo is ~60% COVID-era leftovers. |
| **Tallytopia** ("health calculators") | We compute BMR/TDEE ourselves in `nutrition-core`. Never outsource your core algorithm to a third-party calculator you can't audit or unit-test. |
| **Zestful** (ingredient parsing) | Paid, and Groq/Llama does ingredient parsing well enough at effectively zero marginal cost. |
| **Food Info (food-info.org)** | Listed as "nutrition data from six national food composition datasets" — sounds perfect, but I could not verify it exists as a live, reputable service. **Verify independently before touching it.** |
| **Food Standards Agency (UK)** | UK hygiene ratings. Wrong country. |

---

## The three traps

### Trap 1 — Free-tier LLM data policy

Free Gemini: content submitted may be used to develop Google products and machine-learning technologies, with human review possible. Google's own guidance says don't submit sensitive, confidential, or personal information to non-paid services.

Your payload: meal photos (often taken at home, with family and interiors in frame), plus weight, body-fat %, medical conditions, pregnancy status. This is health data belonging to identifiable people.

**Rule: any model call carrying user data goes through a paid key. No exceptions.** Free keys are for internal dev, load-testing with synthetic data, and benchmark harnesses only.

### Trap 2 — Org-level rate limits vs. bursty logging

Meal logging peaks hard at 1pm and 8pm. Free-tier ceilings (~30 RPM, ~1,000 RPD) are shared across your whole app. You reach a hard wall at roughly **300 daily active users** even on a modest 3-AI-calls-per-user-per-day assumption, and you'll be throttling during peaks long before that.

Mitigations that actually work: paid tier, aggressive caching by perceptual image hash, batching non-urgent calls (weekly narratives), and a queue with graceful degradation — but the real answer is that AI cost is ~15% of ARPU and not worth engineering around.

### Trap 3 — Open Food Facts ODbL share-alike ⚠️ **This corrects the previous plan**

Open Food Facts is ODbL. Attribution *and* share-alike. Critically, per their own FAQ: **if you combine OFF data with other databases, the resulting database must be released as open data as well** — and you may only combine it with sources whose licences permit that redistribution.

My earlier plan said "bulk-ingest USDA + Open Food Facts + INDB into your own Postgres." **As written, that would drag your proprietary Pakistani food database into ODbL and oblige you to publish it.** That's the one asset you cannot afford to give away.

**Fix — physical isolation:**

```
db_off        ← Open Food Facts only. Separate schema/database. Never joined at rest.
                Used exclusively for barcode lookup. Attribution rendered in the UI.
db_core       ← USDA (CC0) + INDB (CC BY 4.0) + our proprietary Pakistani dishes.
                This is the asset. Never contaminated with OFF rows.
```

Join them in the **application layer** at query time, never in a materialised table. When a barcode scan hits OFF, copy the resulting log entry's *values* into `meal_items` as a user's personal record (a produced work), not into `db_core` as a new food row.

Also required in the UI wherever OFF data appears: *"This record contains information from Open Food Facts, made available under the Open Database License."*

Get a lawyer's read on this before launch. It's cheap now and expensive later.

---

## What this repo does NOT give you

Worth stating plainly, because it's the whole point of the exercise:

- **There is not a single food-photo→calorie API in all 1,696 entries.** Not one. The category is entirely commercial (Passio, LogMeal, Calorie Mama, Spike) or DIY on a general vision model. Phase 3 cannot be solved from this list.
- **No South Asian food composition data whatsoever.** No Pakistani, Indian, or Bangladeshi nutrient database. Your moat is precisely the thing free APIs don't cover — which is the good news, not the bad news.
- **No adaptive TDEE / coaching logic.** Nobody gives that away. That's `nutrition-core`, which you write yourself in a day.
- **No portion/serving-size mapping** ("1 roti" → 45 g). That table is hand-built and it's most of the UX.

The three things that make this product defensible are exactly the three things you can't get from a free API. That's a good position to be in — it just means the free APIs save you money on commodity layers, not on the product.

---

## Recommended final stack

| Layer | Choice | Monthly cost |
|---|---|---|
| Food composition base | USDA FDC bulk (CC0) | $0 |
| Regional base | Anuvaad INDB (CC BY 4.0) | $0 |
| Barcode | Open Food Facts, isolated DB, bulk export + local index | $0 |
| Nutrition label scan | OCR.Space free tier | $0 |
| Pakistani dishes | **Hand-built, dietitian-verified, 400–600 items** | one-off ~PKR 150–250k |
| Coach chat + narratives | Groq Developer tier (Llama 3.3 70B / GPT-OSS 120B) | ~$0.05–0.15/user |
| Vision (photo→items+mass) | **Paid** GPT-5-class or Claude vision | ~$0.30–0.90/user |
| Nutrient math | Our own DB, always | $0 |
| Embeddings | HF Inference or Jina free tier | $0 |
| Activity data | HealthKit / Google Fit / Fitbit OAuth | $0 |
| Exercise DB | wger, self-hosted | $0 |
| Push | OneSignal free | $0 |
| Charts for sharing | QuickChart | $0 |
| Backend | Supabase | ~$0.05–0.15/user |

**Free APIs cover roughly 70% of the surface area.** The 30% that isn't free is the 30% that touches user data — and that's the part where paying is a feature, not a cost.

---

## Changes to the main plan

1. **§4.2 step 1 is now wrong.** Do not merge OFF into a single Postgres with USDA/INDB/proprietary. Split into `db_off` and `db_core`, join in the app layer only. Update the schema.
2. **Add `db_off` isolation and an OFF attribution component** to the Phase 1 build order (week 3).
3. **Remove Nutritionix from the P2 API list** in §12 — free tier is gone. FatSecret becomes the commercial gap-filler (~5,000 calls/day free, but mandatory FatSecret branding in-app; check whether that's acceptable for a paid product).
4. **Add nutrition-label OCR to Phase 1**, not Phase 3. It's cheap, it's accurate, and it solves packaged Pakistani goods that no database has. Ships before photo-calorie and is more useful.
5. **Add a `PAID_KEYS_ONLY` lint rule / env split** so a free-tier key can never be configured in production. Enforce in CI.
6. **Budget line:** AI is ~$0.40–1.15/active user/month. Stop trying to get it to zero.

---

## Next actions

1. Register USDA FoodData Central key. Start the bulk download today.
2. Download the Open Food Facts daily export; stand up `db_off` as an isolated schema with a local index (avoids the 15 req/min ceiling entirely).
3. Register Groq free key; build the coach + text-parsing prototype on it this week.
4. Register OCR.Space; test on 20 Pakistani packaged-goods labels (Shan, National, Olpers, Nurpur, Peek Freans) and measure the parse rate.
5. Get a legal read on ODbL share-alike against the two-database architecture.
6. Set up paid keys for anything touching user data before the first real user exists.
