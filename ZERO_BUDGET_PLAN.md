# Zero-Budget Build Plan

**Constraint:** PKR 0 / $0 spend. No GPU. No self-hosting. No paid API tiers.
**Supersedes:** cost sections of `BUILD_INSTRUCTIONS.md` and `VISION_API_ADDENDUM.md`
**Date:** August 2026

---

## Verdict

**Yes, this is buildable at $0** — through development, internal testing, and a closed beta of roughly **300–500 daily active users**.

It is not shippable to the App Store at $0 (Apple charges $99/yr), and it breaks at ~500 DAU. Both are fine. You'll know whether the product works long before you hit either ceiling, and by then the first spend is ~$50, not ~$5,000.

There is exactly **one place where $0 costs you real quality**, and I'll be direct about it in §5.

---

## 1. The zero-cost stack

| Layer | Service | Free allowance | Enough for |
|---|---|---|---|
| Backend / DB | **Supabase Free** | 500 MB DB × 2 projects, 1 GB storage, 5 GB egress, 50k MAU, 500k edge invocations/mo | Yes, with §3 discipline |
| Vision (photo→food) | **Groq `qwen/qwen3.6-27b`** | 30 RPM · 1,000 RPD · 200k TPD | ~500 DAU at 2 scans/day |
| Text LLM | **Groq `gpt-oss-120b` / `gpt-oss-20b`** | 30 RPM · up to 14,400 RPD | Yes |
| Label OCR | **OCR.space Free** | 25,000/mo · 500/day · 1 MB/file | Yes |
| Food data | **USDA FDC** (CC0) + **INDB** (CC BY 4.0) + **Open Food Facts** (ODbL) | Free, bulk export | Yes |
| Embeddings | **Hugging Face Inference** free tier | Rate-limited | Yes (and mostly avoidable — see §3) |
| Exercise DB | **wger** public API | Free | Yes |
| Charts for sharing | **QuickChart** | Free, no key | Yes |
| Push | **OneSignal Free** | ~10k subscribers | Yes |
| Analytics | **PostHog Free** | ~1M events/mo | Yes |
| Error tracking | **Sentry Free** | Rate-limited | Yes |
| LLM tracing | **Langfuse Free** | Rate-limited | Yes |
| Code + CI + cron | **GitHub Free** | Private repos, Actions minutes | Yes |
| Web hosting | **Cloudflare Pages / Vercel / Netlify** free | Generous | Yes |
| Mobile builds | **Expo local builds** | Free (build on your own machine) | Yes |

Supabase explicitly permits **commercial use on the free tier** — you can serve real users, even paying ones, without upgrading. The constraints are operational, not legal.

---

## 2. Distribution — the one place $0 forces a real decision

Store fees are not free:

| Route | Cost | Verdict |
|---|---|---|
| Apple App Store | **$99/year** | ❌ Cut. Not in scope for the $0 phase. |
| Google Play | **$25 one-time** | ⚠️ The single cheapest real cost. Worth breaking $0 for when you're ready to launch — not before. |
| **Direct APK download** | **$0** | ✅ Host the APK on the free web page. Share via WhatsApp. |
| **PWA (installable web app)** | **$0** | ✅ Works on Android *and* iOS. Camera works via web APIs. No store, no fee, no review delay. |

**Recommendation: build the PWA first.**

Expo can target web. A PWA gets you camera capture, offline storage, push on Android, and an install-to-homescreen prompt — with zero store fees, zero review cycles, and instant updates. In Pakistan, WhatsApp-shared links are a legitimate primary distribution channel; you do not need the Play Store to get your first 500 users.

Keep the React Native codebase so a native build is a later step, not a rewrite. Ship native when you're ready to spend the $25.

---

## 3. Making 500 MB work

This is the real engineering constraint. It's solvable, and the solutions happen to be good design anyway.

### Skip USDA Branded Foods

Foundation + SR Legacy is ~10,000 lab-analysed foods — a few MB once normalised to per-100g with 10 nutrients. Branded Foods is 350,000+ rows of US packaged goods that are **useless in Lahore** and would eat your entire quota. Import `dataType=Foundation,SR Legacy` only.

### Filter Open Food Facts hard

The full OFF export is multiple GB. Do not import it.

Filter to products actually sold in Pakistan plus major international brands available here — realistically 20,000–50,000 products. Store only `barcode, name, brand, 8 nutrients`. At ~300 bytes/row that's **~15 MB**. Fits comfortably in the second free project.

Refresh weekly via a GitHub Actions cron re-running the filter against the daily export.

### Never store meal photos ⭐

This is the most important line in this document.

```
capture → downscale to 768px in-app → send to Groq → get JSON back → DISCARD the image
```

Store the *structured result*, not the picture. Benefits, all at once:

- 1 GB storage limit becomes irrelevant
- Egress drops enormously
- **Privacy improves dramatically** — you're never holding photos of people's homes and families
- Your privacy policy gets much simpler and much more trustworthy

If you want a visual history, store a 100×100 thumbnail (~5 KB). 10,000 meals = 50 MB. Still fine.

### Archive old logs

`meal_items` is your growth driver. At 500 users × 5 items/day you'd add ~180 MB/year with indexes. Add a monthly job that rolls entries older than 6 months into a compact `meal_history_monthly` aggregate (daily totals only) and deletes the detail rows. Users almost never look at last February's individual items, and daily totals are what feed the adaptive TDEE anyway.

### Prefer Postgres FTS over embeddings

`pg_trgm` + full-text search handles "chicken karahi" → DB row for the overwhelming majority of queries at zero API cost and zero storage. Only reach for embeddings on the misses. A pgvector index over 12,000 foods also costs storage you don't have spare.

### Keep the project awake

Free projects **pause after 7 days of inactivity**. A paused project is unreachable until manually restored.

Fix: a GitHub Actions workflow that pings a trivial Supabase endpoint every 3 days. Twelve lines of YAML, runs free, solves it permanently.

```yaml
on:
  schedule:
    - cron: '0 6 */3 * *'
```

Also note: **no backups on the free tier.** Add a weekly GitHub Action that `pg_dump`s the database into a private repo or a free object store. Do this in week 1, not after you lose data.

---

## 4. Ceilings — know exactly when $0 breaks

| Limit | Ceiling | What happens | First fix |
|---|---|---|---|
| Groq vision 1,000 RPD | **~500 DAU** @ 2 scans/day | 429s | Paid vision ~$0.001/scan |
| Groq 30 RPM (all models) | Peak-hour bursts | 429s at 1pm & 8pm | Queue + retry, then paid |
| OCR.space 500/day | ~250 DAU @ 2 labels | 429s | Paid OCR or cache harder |
| Supabase 500 MB | ~400 MB with archival | Writes rejected | Pro, $25/mo |
| Supabase 5 GB egress | Moderate traffic | Errors | Pro |
| Supabase 500k edge invocations | ~16k/day | Throttle | Pro |
| Supabase 50k MAU | Far away | — | — |

**The binding constraint is Groq's 1,000 vision requests/day.** Everything else has more headroom.

Mitigations that buy you real room at $0:

- **Perceptual-hash cache** — the same user photographs the same breakfast 200 times a year. Cache hits cost nothing and can plausibly cut vision calls 30–40%.
- **Make photo the fallback, not the default.** Barcode, text/voice, and recents should be the fast paths in the log sheet. Realistically 60–70% of logging events never need a vision call.
- **Free tier: 2 photo scans/day/user.** Not 3. It's both a quota control and your future paywall, tested early.
- **Queue overflow.** If the daily quota is exhausted, queue the scan and process it after midnight UTC rather than showing an error. Users tolerate "we'll have this ready shortly" far better than a failure.

### When $0 breaks, the first spend is small

```
Supabase Pro          $25/month
Google Play           $25 one-time
Paid vision           ~$0.001/scan  →  ~$0.06/user/month
─────────────────────────────────────────────
~$50 to cross the line, then ~$25–40/month
```

At PKR 999/mo, **eight paying subscribers cover it.** That's the whole argument for not over-engineering around $0: the cliff is tiny.

---

## 5. What $0 actually costs you — read this

**The dietitian sign-off.** That's the real casualty, and I'm not going to pretend otherwise.

The plan called for a qualified Pakistani dietitian to review the 400–600 hand-built dishes. That's the moat, and it costs money.

$0 alternatives, honestly ranked:

1. **Compute from published sources and label it clearly.** Use INDB (CC BY 4.0) and USDA ingredient rows with the FAO/INFOODS + EuroFIR recipe method, including yield and retention factors for cooking. Mark every dish `verified_by: computed` and show provenance in the UI. This is defensible and honest — it just isn't clinically reviewed.
2. **Find a nutrition student or intern.** Final-year dietetics students at Lahore universities will often review data for credit, a reference, or co-authorship on a write-up. Genuinely viable and costs nothing but outreach.
3. **Crowdsource corrections.** Ship with visible confidence flags and a "this looks wrong" button. Your own users become the review layer over time — which is also how you build the proprietary dataset.
4. **Defer.** Get the sign-off with the first revenue. It's a few hundred dollars, not thousands.

**What you must do regardless:** strengthen the disclaimer. If the data isn't professionally verified, say so plainly in-app. Do not imply clinical authority you haven't paid for. The safety floors in `nutrition-core` are code and cost nothing — they stay exactly as specified, non-negotiable.

**Everything else survives $0 intact:** the adaptive TDEE algorithm, the safety system, offline logging, the Pakistani serving-size table, `oil_added_g`, OCR label scanning, the whole assessment flow. The differentiators are engineering, not spend.

---

## 6. Free money that isn't a compromise ⭐

Apply this week. Costs an afternoon, may erase the ceiling entirely:

- **Mistralship** — up to ~$30,000 in Mistral credits, application-only. At ~$0.001/scan that's 30 million scans.
- **OpenAI, Anthropic, Google Cloud startup programmes**
- **Microsoft Founders Hub** — Azure OpenAI credits
- **GitHub Student / Education pack** — if anyone on the team qualifies

eCube is a real software house with a real product. These applications are credible. Credits are paid-tier terms at $0 cost — strictly better than free tiers on limits, privacy, and SLA.

---

## 7. Revised phase plan for $0

### Phase 0 — Setup (week 1)
Register: Supabase, Groq, OCR.space, USDA key, GitHub, Langfuse, PostHog, Sentry, OneSignal. All free.
**Enable Zero Data Retention in Groq Data Controls immediately.**
Set up keep-alive cron + weekly `pg_dump` backup Action.
Write `nutrition-core` with the safety tests first.

### Phase 1 — Assessment + Tracker (weeks 2–10)
As specified in `BUILD_INSTRUCTIONS.md`, with these changes:
- Ship as **PWA**, not native. Expo web target.
- Import USDA Foundation + SR Legacy only
- Filter OFF to PK-relevant products before importing
- Pakistani dishes: computed from INDB/USDA, flagged as unverified
- Groq `gpt-oss-120b` for narratives, `gpt-oss-20b` for parsing
- **No RevenueCat, no paywall yet** — nothing to charge for while you're validating

### Phase 2 — Diet plans (weeks 11–18)
Unchanged. Constraint solver in code + Groq for assembly. Costs nothing.

### Phase 3 — Photo calories (weeks 19–25)
Groq `qwen/qwen3.6-27b`, free tier. 2 scans/day cap.
**Benchmark first** on 50 Nutrition5k images + 50 real Pakistani plates before building the UI.

### Phase 4 — Monetise
This is where you spend $50. By then you'll have real retention data telling you whether it's worth it.

---

## 8. What to do this week

1. **Enable ZDR in Groq Data Controls.** One toggle, before any test data.
2. Register all Phase-0 free accounts under a shared `dev@` mailbox.
3. Set up the keep-alive cron **and the weekly backup Action** — free tier has no backups.
4. Import USDA Foundation + SR Legacy. Confirm the DB stays under 50 MB.
5. Apply to Mistralship and every startup credit programme you qualify for.
6. **Benchmark `qwen/qwen3.6-27b` on food photos.** This single experiment determines whether Phase 3 is viable at $0 or needs credits.
7. Decide: PWA-first (recommended) or spend the $25 on Play now.

---

## Bottom line

$0 gets you a real product in front of 300–500 real users. That is more than enough to learn whether people keep logging after week two — which is the only question that matters at this stage.

The binding constraints are Groq's 1,000 vision requests/day and Supabase's 500 MB. Both are avoidable for months with caching, aggressive archival, and not storing photos — and "don't store photos" makes the product better on privacy anyway.

Design so that crossing the line costs $50 and one afternoon, not a rewrite. The `VisionProvider` abstraction and the two-database split already do that. Keep them strict.
