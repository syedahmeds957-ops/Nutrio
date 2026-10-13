# Addendum — Vision API: the free options, re-checked

**Supersedes:** the vision section of `BUILD_INSTRUCTIONS.md` Part 1 and Part 3.4
**Date:** August 2026

---

## I was too broad. Here's the correction.

I said "free keys can't touch user health data." That is true of **Gemini's free tier specifically**. It is **not** true of free tiers in general, and I shouldn't have generalised.

**Groq's no-training policy is account-wide, not tier-gated.** Groq's own terms state it is not permitted to use customer Inputs or Outputs to train or fine-tune any model unless you explicitly grant permission. Groq is an inference provider, not a foundation-model lab — it has no research-data pipeline that would consume your prompts. Inference data is **not retained by default**; temporary logs only for reliability troubleshooting or abuse investigation, kept up to 30 days, and **any customer can enable Zero Data Retention self-serve** in Data Controls. Free developer usage gets the same posture as paid.

So free Groq is privacy-safe. Gemini free is not. Different companies, different business models — Google monetises data, Groq monetises compute.

---

## But there's a second, bigger correction: my cost estimate was wrong

I quoted **$0.30–0.90/user/month** for vision. That figure assumed premium models. It's wrong for what we actually need.

Current cheap vision rates (per 1M tokens, in/out):

| Model | Input | Output | Vision |
|---|---|---|---|
| **GPT-5 Mini** | $0.25 | $2.00 | ✅ |
| **Gemini 3.1 Flash-Lite** | $0.25 | $1.50 | ✅ |
| Gemini 3 Flash | $0.50 | $3.00 | ✅ |
| Claude Haiku 4.5 | $1.00 | $5.00 | ✅ |
| Claude Sonnet 4.6 | $3.00 | $15.00 | ✅ |

**Per-scan math** (768px image ≈ ~1,200 image tokens + ~300 prompt tokens = ~1,500 in; JSON response ≈ 300 out):

```
GPT-5 Mini:      1,500 × $0.25/1M  +  300 × $2.00/1M   ≈ $0.00098
Gemini FL 3.1:   1,500 × $0.25/1M  +  300 × $1.50/1M   ≈ $0.00083
```

**≈ $0.001 per scan.** At 60 scans/user/month: **$0.06/user/month.**

At PKR 999 ARPU (~$3.50), that is **under 2% of revenue**. Batch API cuts it 50% again for non-realtime work; prompt caching cuts the system-prompt portion further.

We were about to spend a week of engineering time avoiding a six-cent cost. That's the wrong trade. The correct answer isn't "find free vision" — it's "stop using premium models for a task that doesn't need one."

---

## The genuinely free paths, ranked

### 1. Startup credits — free for year one, no compromises ⭐ **do this now**

- **Mistralship** — up to ~$30,000 in Mistral credits. Application-only.
- OpenAI, Anthropic, and Google Cloud all run startup programmes; Microsoft Founders Hub grants Azure OpenAI credits.

At $0.001/scan, $30k of credits is **30 million scans**. That covers years of runway at our projected scale, on paid-tier terms with proper data isolation. This is the best free option by a wide margin and it costs you one afternoon of applications.

**Action: apply to all of them this week.** eCube is an established software house with a real product — the applications are credible.

### 2. Mistral La Plateforme free tier — for development and benchmarking

Free "Experiment" tier with rate-limited access to all models including **Pixtral** (their vision model), roughly a 1-billion-token/month cap. Mistral advertises full data isolation with a free zero-retention option on the commercial tier.

⚠️ **Verify in the console before sending any real user data** whether zero-retention applies to the free Experiment tier or only to commercial. Mistral no longer publishes exact free rate numbers publicly — check Admin Console → Limits. Mistral's own framing is that the free tier is for experimentation and prototyping, and production traffic moves you to paid.

**Use it for:** the Phase 3 benchmark run, dev, and staging. Not launch traffic.

### 3. Self-host an open-weight VLM — free per call, but only above scale

**Pixtral 12B is Apache 2.0.** So are Qwen-VL and several Gemma variants. Download the weights, run them on your own GPU, and no data ever leaves your infrastructure. Zero per-call cost.

**The break-even math:**

```
GPU (L4 / A10 class, Runpod or Vast):  ~$150–350/month
Paid API equivalent:                    $0.001/scan

Break-even ≈ 150,000–350,000 scans/month
           ≈ 2,500–6,000 DAU at 2 scans/day
```

**Below ~5,000 DAU, self-hosting is more expensive than the API and adds a GPU to babysit.** Above it, self-hosting wins and wins big.

So: not now, but architect for it. The `VisionProvider` interface in Part 3.4 already makes this a one-file swap. Revisit at 5,000 DAU.

### 4. Groq free tier — privacy-safe, but check the vision catalogue ⚠️

Groq's data policy is fine. The problem is model availability: **Groq announced deprecation of `meta-llama/llama-4-scout-17b-16e-instruct` on 17 June 2026** — that was its multimodal option. The recommended migrations (`openai/gpt-oss-120b`) are text-only.

**Action for the developer:** check `console.groq.com/docs/models` for currently-served vision-capable models before assuming Groq covers this. If it doesn't, Groq stays as our **text** provider (coach, meal-text parsing, narratives) — which is what we already planned — and vision goes elsewhere.

Free-tier limits either way: ~30 RPM, ~1,000–14,400 RPD depending on model, **per organisation**.

### 5. Avoid vision entirely where possible — the cheapest call is the one you don't make

This is the one with the best return and it's already in the plan:

- **OCR label scanning** (OCR.space free, 25k/month) — packaged goods. Exact printed numbers, no estimation, no vision model.
- **Text/voice logging** via Groq — "do roti aur daal ka bowl." Faster than a photo, *more* accurate than a photo, costs a fraction of a cent.
- **Barcode** via local `db_off` index — free, instant, exact.
- **Perceptual-hash cache** — the same user photographs the same breakfast 200 times a year. Cache hit = $0.

Realistically **60–70% of logging events never need a vision call.** Photo is the fallback for home-cooked mixed plates, not the default path. Design the log sheet so barcode/text/recent are the fast paths and camera is one option among four — that's both cheaper and better UX.

---

## Recommended ladder

| Stage | Vision provider | Cost |
|---|---|---|
| Phase 0–2 | **None needed.** OCR + text + barcode only. | $0 |
| Phase 3 benchmark | Mistral free (Pixtral) or Nutrition5k offline eval | $0 |
| Phase 3 dev/staging | Mistral free / startup credits | $0 |
| Launch → 5k DAU | **GPT-5 Mini or Gemini 3.1 Flash-Lite, paid tier**, funded by startup credits | ~$0.06/user/mo, likely $0 net |
| >5k DAU | Re-evaluate self-hosted Pixtral 12B / Qwen-VL | GPU cost, falling per-user |

---

## Two things that don't change

**1. Rate limits still bite, independent of privacy.** Free tiers run ~30 RPM at the organisation level. Meal logging peaks hard at 1–2pm and 8–10pm — that's one request every two seconds shared across the entire userbase, exactly when everyone opens the app. Free tier is unusable for launch traffic on throughput grounds alone, even where the data policy is clean.

**2. Gemini's free tier is still out.** Its terms permit using submitted content and responses to improve Google products, with possible human review, and Google explicitly advises against sending sensitive or personal data to non-paid services. Separately, published food-photo benchmarks put older Gemini versions at 64–110% energy MAPE versus ~26–37% for GPT/Claude class — so it may be the wrong vision model here on accuracy grounds too. Benchmark before committing. Gemini **paid** is fine on policy and cheap on price; test it properly on Pakistani food rather than trusting either my caution or the benchmark.

---

## Revised cost model

| Item | Old estimate | Corrected |
|---|---|---|
| Vision | $0.30–0.90 | **$0.04–0.10** (cheap model, cache, 60–70% of logs avoid vision) |
| Coach chat (Groq) | $0.05–0.15 | $0.05–0.15 |
| Weekly narrative | $0.04–0.10 | $0.04–0.10 |
| Supabase + storage + push | $0.05–0.15 | $0.05–0.15 |
| **Total** | $0.45–1.30 | **$0.18–0.50/user/month** |

Roughly **5–14% of ARPU** at PKR 999. With startup credits, effectively zero for year one.

---

## Actions

1. **Apply to Mistralship and the OpenAI / Anthropic / Google / Microsoft startup credit programmes this week.** Highest-value hour anyone will spend on this project.
2. Register a Mistral free-tier key for Phase 3 development. Verify the free-tier retention setting in the console before it sees real user data.
3. Have the developer check Groq's current vision-capable model list; if empty, Groq remains text-only in the architecture.
4. Change the default vision model in the plan from premium to **GPT-5 Mini / Gemini 3.1 Flash-Lite class**. Benchmark both on 50 Nutrition5k images plus 50 real Pakistani plates before choosing.
5. Keep the `VisionProvider` abstraction strict — it's what makes points 1–4 cheap to change, and it's what lets you move to self-hosted Pixtral at 5k DAU without touching feature code.
