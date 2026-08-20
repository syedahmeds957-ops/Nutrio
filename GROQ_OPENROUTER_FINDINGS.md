# Groq & OpenRouter — checked

**Updates:** `BUILD_INSTRUCTIONS.md` Part 2 (`.env`) and Part 3.3 · `VISION_API_ADDENDUM.md` §4
**Date:** August 2026

---

## Headline

**Groq has a free, privacy-safe vision model right now: `qwen/qwen3.6-27b`.** That's the free vision path you were asking for. It has real caveats, but it exists.

**OpenRouter's free tier is unusable for us** — not because of rate limits, but because using `:free` endpoints *requires you to opt into data training and prompt publication*. OpenRouter is still worth adopting, just as a paid gateway rather than a source of free tokens.

---

## Groq

### ✅ Current vision model: `qwen/qwen3.6-27b`

27B dense multimodal model (Alibaba Qwen). Accepts text **and image** input. Built for image analysis, OCR, and visual Q&A — exactly our use case.

Why it fits well:

- **JSON mode supported.** Critical — our whole vision pipeline depends on strict structured output.
- **Tool use supported.**
- **Thinking / non-thinking modes** in one model. Use non-thinking for speed on simple plates, thinking for complex mixed dishes.
- Strong multilingual support (relevant for Urdu later).
- Runs on Groq's LPUs, so it's fast.

**Free-plan limits** (as listed Aug 2026): **30 RPM · 1,000 RPD · 8,000 TPM · 200,000 TPD.**

**Constraints:**
- Max **20 MB** per request containing an image URL; over that returns 400.
- Groq's general vision guide says up to 5 images; **the Qwen3.6-27B model page says 3**. Use 3 — the stricter limit — to avoid rejections.

```python
from groq import Groq
client = Groq(api_key=os.environ["GROQ_API_KEY"])

completion = client.chat.completions.create(
    model="qwen/qwen3.6-27b",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "..."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
        ],
    }],
    response_format={"type": "json_object"},
)
```

### ⚠️ Three caveats

1. **It's a Preview model.** Groq states preview models are for evaluation and may be discontinued at short notice. Given Groq deprecated Llama 4 Scout — the previous vision option — in June 2026, this is not theoretical. **Do not hard-wire it.** The `VisionProvider` abstraction in Part 3.4 is what protects you here; keep it strict.
2. **1,000 RPD free ceiling.** At 2 scans/user/day that's ~500 DAU, and 30 RPM will throttle you at the dinner rush well before that. Fine for dev, staging, beta, and the first few hundred users. Not fine for launch scale.
3. **Unknown accuracy on food.** Qwen3.6-27B has no published food-photo benchmark. It may be excellent or poor at portion estimation. **Benchmark it before trusting it** — that's the whole point of the Nutrition5k eval.

### 🏢 Production path on Groq: `qwen/qwen3-vl-32b-instruct`

Qwen 3 VL Instruct (32B), a vision-language model Groq positions for **multimodal enterprise use cases**. Not self-serve — you contact your Groq account team for access. Worth a conversation once you have real volume.

### 🔴 Correction — our `.env` names deprecated models

On **17 June 2026** Groq announced deprecation of `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` (and separately `qwen/qwen3-32b`, `meta-llama/llama-4-scout-17b-16e-instruct`). Applies to free and developer tiers.

Update `.env`:

```diff
- GROQ_MODEL_CHAT=llama-3.3-70b-versatile
- GROQ_MODEL_FAST=llama-3.1-8b-instant
+ GROQ_MODEL_CHAT=openai/gpt-oss-120b        # coach chat, plan narratives
+ GROQ_MODEL_FAST=openai/gpt-oss-20b         # meal-text parsing, classification
+ GROQ_MODEL_VISION=qwen/qwen3.6-27b         # PREVIEW — verify before each release
```

**Standing instruction for the developer:** Groq's catalogue churns fast. Check `console.groq.com/docs/deprecations` at the start of every sprint. Pin model IDs in one config file, never inline.

### Privacy — confirmed good

Groq's terms: it is not permitted to use customer Inputs or Outputs to train or fine-tune any model unless you explicitly permit it. Inference data not retained by default; temporary logs only for reliability troubleshooting or abuse investigation, up to 30 days, and **Zero Data Retention is self-serve for all customers** in Data Controls. Account-wide, not tier-gated.

**Action: enable ZDR in Data Controls on day one.** It's a toggle, it's free, and it removes the 30-day log window entirely.

---

## OpenRouter

### 🔴 The free tier is disqualified

To call `:free` endpoints you must enable, in Settings → Privacy & Guardrails:

- *Enable free endpoints that may train on inputs*
- *Enable free endpoints that may publish prompts*

With these off, free models return `404 No endpoints found matching your data policy (Free model publication)`. **The prompts are the payment** — that's the business model, stated plainly.

For us that means meal photos, weights, and medical flags being used for training and potentially published. Same disqualification as Gemini free, for the same reason.

Secondary problems even if privacy weren't an issue:

- **20 RPM**, fixed — buying credits does not raise it.
- **50 requests/day**, rising to 1,000/day only after a lifetime purchase of $10+ in credits.
- **The free roster rotates and endpoints get delisted without notice** — eight went in a recent few-week window, including the entire free Llama and Qwen tiers. Never hard-wire a product feature to a `:free` endpoint.
- Best-effort capacity, no SLA. A model that answers at 9am may fail at 2pm — i.e. exactly at our logging peaks.

### ✅ But adopt OpenRouter as the paid gateway

This is where it earns its place, and it solves a real problem in our architecture:

| Feature | Why we want it |
|---|---|
| **One key, 500+ models, 60+ providers** | Swap vision models without new accounts, contracts, or billing setups |
| **Drop-in OpenAI compatibility** | Change `base_url` to `https://openrouter.ai/api/v1`; no refactor. Same shape as our Groq client. |
| **ZDR-only toggle** | Automatically refuses to route to any provider without Zero Data Retention. This mechanically enforces Part 0 Rule 4 at the network layer. |
| **Provider fallback & routing** | If Groq's preview model vanishes overnight — which it might — traffic fails over instead of the app breaking |
| **`:nitro` / `:floor` variants** | Route by speed or by price per request |
| **BYOK: ~1M free routing requests/month** | Use our own Anthropic/OpenAI keys through OpenRouter's router at no markup |

**Required settings** — all four training toggles OFF, ZDR-only ON:

```
Settings → Privacy & Guardrails
  ☐ Enable paid endpoints that may train on inputs      → OFF
  ☐ Enable free endpoints that may train on inputs      → OFF
  ☐ Enable free endpoints that may publish prompts      → OFF
  ☐ Enable 1% discount on all LLMs                      → OFF  (it's the data-sharing discount)
  ☑ ZDR Endpoints only                                  → ON
```

With ZDR-only on you lose access to free models entirely — which is correct and is the point.

---

## Revised vision ladder

| Stage | Provider | Model | Cost | Privacy |
|---|---|---|---|---|
| Benchmark (now) | Groq free | `qwen/qwen3.6-27b` | $0 | ✅ no training, ZDR available |
| Dev / staging | Groq free | `qwen/qwen3.6-27b` | $0 | ✅ |
| Closed beta (<500 DAU) | Groq free/Developer | `qwen/qwen3.6-27b` | ~$0 | ✅ |
| Launch | OpenRouter (ZDR-only) → GPT-5 Mini or Gemini 3.1 Flash-Lite | paid | ~$0.001/scan | ✅ |
| Scale (>5k DAU) | Self-hosted Pixtral 12B / Qwen-VL, **or** Groq `qwen3-vl-32b-instruct` enterprise | GPU or contract | falling per user | ✅ |

**Fund the launch stage with startup credits.** That recommendation stands and is still the highest-value action on the list.

---

## What to actually do

1. **Enable ZDR in Groq Data Controls today.** One toggle. Do it before any test data goes through.
2. **Fix the model IDs in `.env`** — `gpt-oss-120b` / `gpt-oss-20b` / `qwen3.6-27b`. The Llama models we specified are deprecated.
3. **Benchmark `qwen/qwen3.6-27b` on 50 Nutrition5k images + 50 real Pakistani plates.** Measure MAPE on energy and grams, with and without a reference object in frame. This one experiment decides whether the free path carries us to launch or not.
4. **Create an OpenRouter account, set all four training toggles OFF and ZDR-only ON.** Wire it as the fallback provider behind `VisionProvider` from the start — it's the insurance policy against a preview model disappearing.
5. **Add a sprint-start ritual:** check `console.groq.com/docs/deprecations`. Groq deprecated its entire Llama chat lineup *and* its previous vision model inside three months. Assume it will happen again.
6. **Keep every model ID in one config file.** No inline model strings anywhere in feature code.

---

## Bottom line

You were right that there should be a free way, and there is one: **Groq + Qwen3.6-27B, free tier, no training on your data, ZDR available.** It gets you through benchmarking, development, and a closed beta at zero cost.

It won't carry a public launch — 1,000 requests/day and Preview status are real ceilings, not paperwork. But paid vision is ~$0.001/scan, and startup credits likely cover year one, so the gap between "free" and "paid" here is small enough that it shouldn't shape the architecture. Build the abstraction properly and the decision stays reversible either way.
