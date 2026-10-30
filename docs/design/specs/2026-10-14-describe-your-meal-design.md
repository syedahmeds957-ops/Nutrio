# Describe-Your-Meal Logging Design Specification

**Date:** 2026-10-14
**Status:** Phases 1–3 are built, and Phase 4 is built differently. Phase 5 is not built (updated 2026-10-25).
- **Phase 4:** an unknown dish is broken into ingredients by `dish-breakdown`, which values any the catalogue lacks from USDA. The dish is saved per account on the device (`tracker/customDishes.ts`), not in a shared `composed_dishes` table.
- **Phase 5:** the learning loop (misses report and promotion) isn't built.
**Topic:** Log a meal by describing it ("in breakfast I had 4 egg whites, 2 whole eggs and greek yogurt"), with AI-composed estimates for dishes not in the catalogue

---

## 1. Goal

A user types (or later, speaks) what they ate in English, Roman Urdu or Urdu. Nutrio splits it into items, matches each to the food catalogue, works out grams, shows a review screen, and logs it. Dishes the catalogue lacks get an estimate composed from ingredients, which is saved for next time.

The flow must never log a wrong food silently. Every number logged comes from the catalogue, never from a language model.

---

## 2. The failure this design exists to prevent

The existing `parse-food-text` function, run on the example sentence today:

| Typed | Matched to | Logged |
|---|---|---|
| "4 egg white" | White Shadi Korma (Chicken), 800g | 1,944 kcal |
| "2 whole egg" | Boiled Egg (Whole) | 155 kcal |
| "greek yogurt" | Greek Yogurt (Non-Fat), 150g | 89 kcal |
| **Total** | rated "medium" confidence | **2,188 kcal** (real ≈ 320) |

The root causes, each answered by a rule in §3:

| # | Cause | Where |
|---|---|---|
| C1 | Filler words kept in the item name ("in breakfast i had egg white") | `parseFoodTextFallback` splits on "and" but never strips filler |
| C2 | The matcher always returns a food; a zero-score match is floored to 0.2 | `nutrition-core/src/vision-resolver.ts` (since deleted) |
| C3 | Partial word overlap counts as a match ("white" in "White Shadi Korma") | `scoreFoodMatch` |
| C4 | A count multiplied a generic serving: 4 × "1 standard serving (200g)" = 800g | default-serving × quantity |
| C5 | Confidence reported "medium" for a garbage match | confidence ignores match quality and unit certainty |

Meal-photo logging, the resolver's other caller, has since been removed, and the resolver with it.

---

## 3. Accuracy rules (non-negotiable)

1. **R1. No model numbers.** The model returns names, counts, units and preparation only. Calories and macros are always computed from catalogue rows. *(The existing parser prompt already says this; keep it.)*
2. **R2. Every word must match.** An item matches a food only if every meaningful word of the item is in the food's name, after spelling folding and typo correction. This is the same rule as search (`keepFullMatches`), so "egg white" can never match "White Shadi Korma". *(C3)*
3. **R3. No match means unknown, never a guess.** Below the match threshold, the item status is `unknown`, and it goes to §5.4 or quick add. There is no fallback to the "closest" dish and no `foodPool[0]`. *(C2)*
4. **R4. Counts need a piece weight.** "4 egg white" multiplies a per-piece serving ("1 egg white (33g)"). If the matched food has no per-piece serving and the unit is a count, the row is marked `needs_portion` and the user picks the amount. It never multiplies a generic 200g serving. *(C4)*
5. **R5. Plausibility gates.** A single item over 1,500 kcal, a single piece over 400g, or a meal over 3,000 kcal is flagged on the review screen and cannot be logged without confirmation.
6. **R6. Honest confidence.** Each row's confidence is the minimum of its match certainty (exact / folded / typo-corrected / ambiguous) and its portion certainty (grams given / piece serving / default serving / user must choose). A low-confidence row is highlighted and requires a tap. *(C5)*
7. **R7. The user confirms.** Nothing from this flow is logged without the review screen.
8. **R8. A golden test set gates releases.** A fixture of real sentences with expected foods and calorie ranges runs in CI. Any wrong-food match fails the build (§7).

---

## 4. The flow

```
"in breakfast i had 4 egg white and 2 whole egg and greek yogurt"
        │
        ▼
 [1] Extract  (edge fn, LLM; deterministic fallback)
     → slot: breakfast
     → [{name:"egg white", qty:4, unit:"piece"},
        {name:"whole egg", qty:2, unit:"piece"},
        {name:"greek yogurt", qty:1, unit:null}]
        │
        ▼
 [2] Match each item  (food-db, deterministic, R2/R3)
     → matched | ambiguous (top 3 offered) | unknown
        │
        ▼
 [3] Portion  (food-db, R4)
     → grams + portion certainty
        │
        ▼
 [4] Unknown items → AI recipe → composed from catalogue (§5.4)
        │
        ▼
 [5] Review screen  (R5–R7) → user edits / confirms → log
        │
        ▼
 [6] Learn: record misses; save composed dishes (§5.5)
```

---

## 5. Components

### 5.1 Phase 1: Catalogue and search (prerequisite)

Matching is only as good as the catalogue. Before any flow work:

- **Duplicate pass 2.** The first pass compared names. This pass compares across differently worded names and across staples vs Diet & Basics (e.g. "Hard Boiled Egg" with a 200g serving vs "Boiled Egg (Whole)" with 50g pieces). Same approach as before: retire through `RETIRED_DUPLICATE_IDS`, never delete.
- **Per-piece servings for countable foods.** These include egg, egg white, roti, paratha, naan, puri, samosa, pakora, kebab (seekh, shami, chapli), tikka piece, boti, slice of bread or pizza, biscuit, date, banana and apple. Each gets a "1 piece (Ng)" serving. Today many have only "1 standard serving (200g)".
- **Unit vocabulary.** piece, katori/bowl, plate, cup, glass, tbsp/chamach, tsp, slice, pao (250g) and aadha/half, each with gram defaults per food category. Plus Roman Urdu and Urdu number words.
- **Search.** Spelling folding, typo correction, all-words matching and variant grouping are done (`search-normalize.ts`, `search-index.ts`). Add a `matchMealItem(text, region)` API on top of the same index that returns `{status, food, alternatives, certainty}`. Unlike search, it never returns a partial match.

### 5.2 Extraction: `parse-food-text` v2

- The LLM returns zod-validated JSON: `{slot?, items:[{name, quantity, unit?, grams?, preparation?}]}`. It is prompted to strip filler, split compound sentences, and leave numbers out (R1).
- The deterministic fallback gains a filler list ("i had", "ate", "for/in breakfast", "khaya", "liya", "mein", "with my tea") and unit parsing. It is used when the model is unavailable.
- Matching moves out of the edge function. The function returns extracted items, and the client matches against its local catalogue, so the device and the server can never disagree.

### 5.3 Review screen (mobile)

- One row per item: matched food, amount, grams, kcal and a confidence marker.
- Tap a row to switch to an alternative match, change the amount (serving chips plus a grams field), choose the meat (variant chips), or remove it.
- `unknown` rows offer "Estimate with AI" (§5.4), "Quick add kcal", or "Search manually".
- Meal slot is pre-selected from the sentence and can be changed. "Log meal" stays disabled while any row needs a decision (R5–R7).

### 5.4 Unknown dishes: AI recipe composed from the catalogue

- The model returns a recipe for one serving as ingredients plus grams. It gives no nutrition values.
- Each ingredient must match a Diet & Basics food through `matchMealItem` (R2/R3). If any ingredient is unknown, the whole estimate is rejected and the user is offered quick add.
- Macros are summed from the matched rows (`verifiedBy: 'composed'`, `source: 'user'`), then gated by R5 and a per-category kcal/100g band (curry 80–300, rice 120–250, bread 220–380, drink 0–150).
- The user sees the ingredient breakdown and can edit it (e.g. less oil) before logging.

### 5.5 Saving for next time

- New table `core.composed_dishes`: `id, canonical_key, name, region, recipe jsonb, macros, status ('personal' | 'shared'), created_by, use_count, edit_count, created_at`. `canonical_key` uses `normalizeToken` so "tinday gosht" and "tinde ghosht" collide.
- **RLS:** a user reads their own rows plus `status = 'shared'` rows, and writes only their own.
- **Promotion to shared:** manual review only at first. An auto rule (e.g. 5 users log it with no edits) can come later, once there's data.
- The saved recipe is stored rather than just totals, so a corrected ingredient row corrects every dish built on it.
- New table `core.food_search_misses (query_key, region, count, last_seen)` feeds a weekly "most wanted dishes" list for proper catalogue additions.

### 5.6 Guardrails

- AI calls are rate-limited per user in the edge function, both extraction and recipes.
- Meal text goes to Groq, as coach chat already does. The text carries no identifiers.
- Timeouts: extraction at 4s, then the deterministic fallback. Recipe at 8s, then quick add.

---

## 6. Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **1. Catalogue & search** | Duplicate pass 2; per-piece servings; unit vocabulary; `matchMealItem` | Golden set: 0 wrong-food matches; every countable food has a piece serving |
| **2. Matcher swap** | Replace `resolveDetectedPlate` in parse-food-text with the food-db pipeline; delete `vision-resolver.ts` | Done: parse-food-text returns items only and the client analyses them |
| **3. Text logging** | parse-food-text v2; review screen; wired into the meal hub | Example sentence logs ≈ 312 kcal with three high-confidence rows |
| **4. Unknown dishes** | Recipe composition; `composed_dishes` + misses tables, migration, RLS | Unknown dish → reviewed estimate → found by search next time |
| **5. Learning loop** | Weekly misses report; promotion review | First batch of top misses added to the catalogue |

---

## 7. Testing

- **Golden set** (`packages/food-db/test/fixtures/meal-sentences.json`): about 60 sentences across English, Roman Urdu and Urdu, each with expected foods, grams ±10% and kcal ±15%. The §2 example is case 1. It runs in CI, and any wrong-food match fails (R8).
- **Unit tests:** `matchMealItem` statuses, portion resolution per unit, plausibility gates, filler stripping, recipe composition and its rejection paths.
- **Integration:** the edge function with a mocked model (valid JSON, malformed JSON, timeout).
- **E2E:** type the sentence → review → edit one row → log → diary totals.

---

## 8. Open questions

1. Promotion of composed dishes to shared: manual review only, or an automatic threshold later?
2. Should quick add (kcal only) be allowed, given it bypasses macro tracking?
3. Voice input in Phase 3, or later?
