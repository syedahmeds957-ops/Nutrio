# Diet Food Expansion Plan

> **Status: complete (2026-09-29).** All 9 phases shipped. 97 foods added,
> 44 → 141 Diet & Basics items. Three planned items were deliberately dropped as
> duplicates of entries already in the catalogue — see *Deviations* at the end.

Phased expansion of the `Diet & Basics` catalogue. The existing 44 items in
`packages/food-db/src/data/diet-basics.data.ts` are **ingredients** (boiled egg,
grilled chicken breast, cucumber, plain rice). This plan adds the **composed
dishes, drinks and snacks** people actually log.

**~98 new items across 8 data phases + 1 UX phase.** Each phase is self-contained:
one new data file, its own tests, ends green. Do them in order — phase numbering
reflects impact, not dependency.

---

## Phase 0 — Groundwork (do once, before Phase 2)

Composed dishes have no USDA row. "Chicken Caesar Salad" is not a USDA food; it's
a sum of components. Two decisions to land first:

1. **New provenance value `verifiedBy: 'composed'`** — macros derived by summing
   USDA component figures. `verifiedBy` is `string?` so no type change is needed,
   but three test suites assert an allow-list and must be widened:
   - `packages/food-db/test/food-db-expanded.test.ts`
   - `packages/food-db/test/restaurant-catalog-2700.test.ts`
   - (check for others via `grep -rn "usda_reference" test/`)

   Do **not** reuse `dietitian_approved`. No dietitian has reviewed these.

2. **Atwater invariant holds automatically** — `kcal100g` must equal
   `P*4 + C*4 + F*9`. If every component satisfies it, so does any sum. Keep the
   existing catalogue-wide test as the guard.

**Also applies to every phase below:**
- Every item needs `nameUr` + `nameAr`.
- Every item needs **natural servings** ("1 katori", "1 bowl", "1 cup", "1 plate",
  "1 chai cup"), not gram-only. The serving formatter
  (`apps/src/tracker/formatServing.ts`) renders these correctly now.
- `category: 'Diet & Basics'` so items surface under the first filter pill.
- Region `GLOBAL` unless genuinely region-specific.
- **Append** to the region arrays in `data/index.ts`, never prepend — several
  callers resolve foods with fuzzy `find(f => f.name.includes(...))` and
  prepending silently repoints them.
- `cd packages/food-db && npm run build` after every phase — the app consumes
  `dist/`, not `src/`.

---

## Phase 1 — Beverages (18 items) ⭐ start here

**Why first:** zero beverages exist in `Diet & Basics`. A user drinking five cups
of doodh patti with sugar logs 0 kcal and consumes 400–600. This single phase
probably improves tracking accuracy more than any other.

> Existing chai/lassi/coffee entries live in `calorify-restaurants.data.ts` and are
> *branded dhaba* items ("Karak Chai", "Mixed Chai (half doodh)", "Lassi Meethi",
> "Green Tea / Qahwa", "Coffee (doodh wali)"). These new ones are the plain
> home-made versions. Name them distinctly to avoid fuzzy-match collisions.

File: `diet-beverages.data.ts`

| # | Item | Note |
|---|------|------|
| 1 | Water | 0 kcal — needed so it appears in search |
| 2 | Green Tea (No Sugar) | |
| 3 | Black Tea (No Milk, No Sugar) | |
| 4 | Black Coffee (No Sugar) | |
| 5 | Coffee with Milk & Sugar | |
| 6 | Home Chai (With Sugar) | 1 chai cup (150ml) serving |
| 7 | Home Chai (No Sugar) | |
| 8 | Doodh Patti (Full Milk, Sugar) | the high-calorie one |
| 9 | Home Chai (Sugar-Free Sweetener) | |
| 10 | Sweet Lassi (Home) | |
| 11 | Salted Lassi / Namkeen Lassi (Home) | |
| 12 | Laban / Ayran | SA |
| 13 | Arabic Qahwa (Unsweetened) | SA |
| 14 | Lemon Water (No Sugar) | |
| 15 | Fresh Lime Soda (Sweetened) | |
| 16 | Diet Soda / Zero Cola | |
| 17 | Regular Cola / Soft Drink | |
| 18 | Sugarcane Juice | PK, very high sugar |

**Done when:** 18 items added, Atwater test green, searching "chai" returns the
plain home versions ahead of restaurant ones, `npm run build` run.

---

## Phase 2 — Composed Salads (14 items)

**Why:** you asked for salad options specifically, and the catalogue currently has
only `Green Salad (No Dressing)` and `Lettuce / Salad Leaves`.

File: `diet-salads.data.ts` · provenance `composed`

| # | Item | Note |
|---|------|------|
| 1 | Grilled Chicken Salad | |
| 2 | Chicken Caesar Salad (No Croutons) | |
| 3 | Caesar Salad (With Croutons & Dressing) | |
| 4 | Tuna Salad (Tuna in Water) | |
| 5 | Egg Salad | |
| 6 | Greek Salad | |
| 7 | Kachumber Salad | PK — onion, tomato, cucumber, lemon |
| 8 | Chana Chaat | PK — high protein, very common |
| 9 | Sprout Salad | |
| 10 | Quinoa Salad | |
| 11 | Russian Salad | include *because* it's mayo-heavy; people assume "salad = diet" |
| 12 | Fattoush | SA/Levantine |
| 13 | Tabbouleh | SA/Levantine |
| 14 | Coleslaw (Homemade, Light) | distinct from KFC "Coleslaw (Regular)" |

**Done when:** each item's macros equal the sum of its stated components, and the
component list is documented in a comment above each entry.

---

## Phase 3 — Dressings & Add-ons (11 items + modifier wiring)

**Why this matters more than another ten salads:** a salad's calories live almost
entirely in what gets poured on it. Currently only `Olive Oil` exists.

File: `diet-dressings.data.ts`

| # | Item | Note |
|---|------|------|
| 1 | Mayonnaise (Regular) | |
| 2 | Mayonnaise (Light) | |
| 3 | Ranch Dressing | |
| 4 | Caesar Dressing | |
| 5 | Italian Vinaigrette | |
| 6 | Balsamic Vinaigrette | |
| 7 | Yogurt-Mint Raita Dressing | PK |
| 8 | Tahini Sauce | SA |
| 9 | Lemon Juice | ~0 kcal |
| 10 | Ketchup | |
| 11 | Hot Sauce / Chilli Sauce | ~0 kcal |

**Second half of this phase — wire them as modifiers.** `ItemCustomizerModal`
already has a modifier system (`selectedModifiers`, `handleUpdateModifier`). Attach
these as `+1 tbsp` modifiers on the Phase 2 salads rather than forcing users to log
two separate rows. Serving unit should be `1 tbsp (15g)`.

**Done when:** opening a salad in the customizer offers dressing modifiers that
correctly move the calorie total.

---

## Phase 4 — Saudi / Arabic Diet Items (13 items)

**Why:** SA mode is essentially unserved in `Diet & Basics` — every current item is
PK-leaning or generic.

File: `diet-arabic.data.ts`

| # | Item | Note |
|---|------|------|
| 1 | Labneh | |
| 2 | Hummus | |
| 3 | Mutabbal / Baba Ganoush | |
| 4 | Foul Medames | |
| 5 | Grilled Kofta (Beef/Lamb) | |
| 6 | Halloumi (Grilled) | |
| 7 | Tahini Paste | plain paste, distinct from Phase 3 sauce |
| 8 | Arabic Salad | |
| 9 | Grilled Hammour | |
| 10 | Chicken Shawarma (No Bread) | |
| 11 | Saj / Arabic Flatbread | |
| 12 | Freekeh (Cooked) | |
| 13 | Dates (Generic Dried) | generic — Ajwa/Sukari/Khalas already in `saudi-traditional.data.ts` |

> **Skip:** Shakshuka — already exists as "Saudi Style Shakshuka".

---

## Phase 5 — Pakistani Diet Meals (14 items)

**Why:** what someone actually dieting in Pakistan eats. The catalogue has plain
grilled chicken but none of the culturally normal low-calorie preparations.

File: `diet-pakistani.data.ts`

| # | Item | Note |
|---|------|------|
| 1 | Chicken Tikka (No Naan) | only "Chicken Tikka Sub" (Subway) exists today |
| 2 | Chicken Boti (Grilled) | |
| 3 | Chicken Malai Boti | |
| 4 | Seekh Kebab (Beef) | |
| 5 | Chapli Kebab (Grilled) | |
| 6 | Fish Tikka | |
| 7 | Anda Bhurji | |
| 8 | Palak Paneer (Low Oil) | |
| 9 | Bhindi Sabzi (Low Oil) | |
| 10 | Karela Sabzi (Low Oil) | |
| 11 | Lauki / Bottle Gourd Sabzi | |
| 12 | Mixed Sabzi (Low Oil) | |
| 13 | Daal Chawal (Portion Controlled) | |
| 14 | Grilled Chicken + Salad Plate | `composed` |

---

## Phase 6 — Soups (7 items)

**Why:** none exist at all. High-volume, low-calorie — exactly what a diet
catalogue should surface.

File: `diet-soups.data.ts`

| # | Item |
|---|------|
| 1 | Chicken Yakhni / Clear Chicken Broth |
| 2 | Chicken Corn Soup |
| 3 | Hot & Sour Soup |
| 4 | Vegetable Soup |
| 5 | Chicken Vegetable Soup |
| 6 | Lentil Shorba / Daal Soup |
| 7 | Tomato Soup |

Serving unit: `1 bowl (250ml)`.

---

## Phase 7 — Breakfast Bowls (10 items)

**Why:** `Oats (Dry)` is the only breakfast item, and nobody eats dry oats.

File: `diet-breakfast.data.ts` · mostly `composed`

| # | Item | Note |
|---|------|------|
| 1 | Oatmeal (Cooked in Water) | |
| 2 | Oatmeal (Cooked in Milk) | |
| 3 | Overnight Oats (With Milk) | |
| 4 | Greek Yogurt & Fruit Bowl | |
| 5 | Egg White Veg Omelette | |
| 6 | Banana Smoothie | |
| 7 | Mango Smoothie | PK seasonal |
| 8 | Protein Shake (With Water) | |
| 9 | Protein Shake (With Milk) | |
| 10 | Fruit Chaat (No Sugar) | PK |

---

## Phase 8 — Snacks (11 items)

**Why:** only nuts and whole fruit exist. Snacking is where diets quietly fail.

File: `diet-snacks.data.ts`

| # | Item |
|---|------|
| 1 | Roasted Chana |
| 2 | Makhana / Fox Nuts |
| 3 | Air-Popped Popcorn |
| 4 | Rice Cakes |
| 5 | Protein Bar |
| 6 | Boiled Corn |
| 7 | Veg Sticks (Carrot & Cucumber) |
| 8 | Dark Chocolate (85%) |
| 9 | Greek Yogurt Cup (Single Serve) |
| 10 | Boiled Egg Snack (2 Eggs) |
| 11 | Mixed Nuts (Portion Pack) |

---

## Phase 9 — UX (no new data)

Worth more than any single data phase above.

1. **"Save this combo" / meal presets.** The custom-meal basket already exists.
   Let a user save an assembled stack as "My usual breakfast" and re-log it in one
   tap. Makes the catalogue self-extending per user — beats adding 100 more foods.
2. **Recent & most-logged pinned to the top** of the `Diet & Basics` pill. People
   eat the same ~15 things. Requires a small usage counter in activity storage.
3. **Verify the ranking boost still holds.** `DIET_BASIC_RANK_BOOST = 50` in
   `search-index.ts` was tuned against 44 items. With ~140 it may need retuning —
   re-run the both-directions check: "egg"/"chicken"/"yogurt"/"salad"/"milk" must
   return plain foods first, while "biryani"/"chicken karahi"/"zinger burger" must
   still return the real dishes.

---

## Running tally

| Phase | Scope | Planned | Delivered | File |
|-------|-------|---------|-----------|------|
| 0 | Groundwork — `composed` provenance, test widening | — | ✅ | — |
| 1 | Beverages ⭐ | 18 | **18** | `diet-beverages.data.ts` |
| 2 | Composed Salads | 14 | **14** | `diet-salads.data.ts` |
| 3 | Dressings & Add-ons (+ modifier wiring) | 11 | **11** | `diet-dressings.data.ts` |
| 4 | Saudi / Arabic | 13 | **13** | `diet-arabic.data.ts` |
| 5 | Pakistani Diet Meals | 14 | **13** | `diet-pakistani.data.ts` |
| 6 | Soups | 7 | **7** | `diet-soups.data.ts` |
| 7 | Breakfast Bowls | 10 | **10** | `diet-breakfast.data.ts` |
| 8 | Snacks | 11 | **11** | `diet-snacks.data.ts` |
| 9 | UX — presets, recents, ranking retune | — | ✅ | `apps/src/tracker/mealPresets.ts` |
| — | **Total new foods** | 98 | **97** | — |

Catalogue went from **44 → 141** `Diet & Basics` items.
Provenance split: 83 `usda_reference`, 58 `composed`. Zero `dietitian_approved`.

## Deviations from the plan

Three planned items were dropped rather than added, each because the catalogue
already owned the name and a second entry would have shadowed the first in the
fuzzy `name.includes` lookups several callers use:

- **Shakshuka** — `saudi-traditional.data.ts` has "Saudi Style Shakshuka". Flagged
  before starting; never written.
- **Chicken Malai Boti** — `bbq-grills.data.ts` has it at 227 kcal/100g, close
  enough to a home-grilled version that a diet duplicate added nothing. Caught by
  the name-collision test, not by review. This is the -1 against plan.
- **Hot & Sour Soup** — kept, but renamed to "Hot & Sour Soup (Light)" because
  `street-food-chaat.data.ts` owns the plain name. Also caught by the test.

Nine kcal figures were raised to their Atwater-derived values (tahini, ranch, and
seven snacks — all high-fibre or high-fat items where USDA's food-specific energy
factors diverge most). The catalogue-wide rule is the derived form so a user's
calorie total always reconciles with their macro totals.

## Verification

- `packages/food-db`: **72 tests** across 9 files.
- `apps`: **224 tests** across 45 files.
- `npx tsc --noEmit` clean in both.
- `test/diet-catalog.test.ts` is the standing guard for every phase: Atwater
  balance, provenance allow-list, bilingual names, one natural default serving,
  unique prefixed ids, cross-catalogue name collisions, and search ranking in
  both directions.
