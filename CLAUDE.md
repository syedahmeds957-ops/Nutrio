# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Nutrio is an AI nutrition and calorie coach (Pakistan first, Saudi Arabia second). It is an npm-workspaces monorepo: an Expo app plus two pure TypeScript packages and Supabase edge functions. `README.md` holds the product state and the index of planning docs in `docs/planning/`.

## Commands

```bash
npm install                 # also runs patch-package (patches/ fixes Expo 57 packages)
npm run web                 # Expo web; or npm run android / npm run ios
npm run build               # tsc for packages/* -> dist/
npm test                    # every workspace's vitest, then `vitest run supabase/`
node scripts/check-ci-keys.mjs   # the CI key guard (runs before build/test in CI)
npm run deploy:coach        # bundle + deploy coach-chat (needs `npx supabase login`)
npm run deploy:parse-food-text   # same, for parse-food-text
npm run deploy:dish-breakdown    # same, for dish-breakdown
```

Single test file / test name:

```bash
npx vitest run packages/nutrition-core/test/safety.test.ts
cd apps/mobile && npx vitest run src/tracker/__tests__/logging-streak.test.ts -t "<test name>"
npx vitest run supabase/functions/coach-chat
```

CI (`.github/workflows/ci.yml`, Node 24) runs: key guard → `npm run build` → `npm test`.

## Architecture

- **`packages/nutrition-core`**: pure, dependency-free maths: BMR, TDEE, targets, macros, safety floors, adaptive TDEE, meal-plan solver/swapper, coach context. Every calorie or macro *target* must be computed here, with unit tests. No model call ever produces one.
- **`packages/food-db`**: the local food catalogue (`src/data/*.data.ts`: diet basics, Pakistani and Saudi dishes, restaurant menus), search index and normalisation, meal customisation and variants. Every nutrient value comes from here (or from USDA for user-added dish ingredients, see Hard Rule 1). An LLM may identify a dish or estimate grams, but never emits calories.
- **`apps/mobile`**: Expo 57 / React Native 0.86 / React 19. There is no router library. `App.tsx` holds an `appState` union (`auth | survey | plan_flow | active_tracker | ...`), and the navigation decisions live as pure functions in `src/navigation/planFlowRouting.ts` (tested in `src/__tests__`). Features are folders under `src/` (`survey`, `plan`, `tracker`, `weight`, `coach`, `auth`, `sync`, `i18n`...), each with logic modules at the top and React screens in `ui/`.
- **`supabase/functions`**: Deno edge functions. `_shared/models.ts` is the only place model IDs live; no inline model strings in feature code. Deployed and called by the app: `coach-chat`, `parse-food-text` (splits a described meal into items) and `dish-breakdown` (one serving of an unknown dish as ingredients + grams, using Groq `browser_search`; ingredients the catalogue lacks are valued from USDA FoodData Central, secret `USDA_FDC_API_KEY`). All three require a signed-in user's JWT, since each call spends the shared Groq quota. None returns a model-produced nutrition number; `dish-breakdown` passes through USDA record values only. `assess`, `ocr-label`, `plan-generate` and `weekly-review` are built and tested but not wired up.
- **`supabase/migrations`**: `core` schema (app data) and `off` schema (Open Food Facts). OFF data must stay in its own schema, never merged into our tables (ODbL share-alike).

### How the pieces resolve each other (non-obvious)

- **Metro** (`apps/mobile/metro.config.js`) maps `@nutrio/*` to each package's `src/index.ts`, so the running app sees package edits live. It also strips `.js` from relative imports, because source files use NodeNext-style `./foo.js` imports pointing at `.ts` files. Keep writing imports that way.
- **Vitest and edge functions** resolve `@nutrio/*` through `node_modules` to `dist/` (the `main` field). **After changing a package, run `npm run build` before mobile or supabase tests see it.**
- Mobile tests run in a `node` environment with `react-native` aliased to `react-native-web`, and native modules (svg, async-storage, safe-area, phosphor icons) stubbed in `apps/mobile/test/stubs/` via anchored regex aliases in `vitest.config.ts`.
- Edge functions import workspace packages and `zod` Node-style, which Deno can't resolve. `scripts/build-edge-function.mjs` bundles one function with esbuild into `supabase/.build/` (zod kept external as an `npm:` specifier to keep the bundle small) and deploys from there. `food-db` is `"sideEffects": false` so a function importing one helper does not bundle the whole catalogue (keep its modules free of import-time side effects, or bundles jump to MBs and fail to deploy).

### Client data flow

- Storage modules (`tracker/activityStorage.ts`, `weight/weightStorage.ts`, `survey/surveyStorage.ts`, `tracker/mealPresets.ts`, `tracker/customDishes.ts`) keep a **synchronous in-memory cache** over AsyncStorage (localStorage on web). At boot, `App.tsx` awaits the `hydrate*` functions; after that, reads like `loadPersistedPlan()` are sync. On logout, the `release*Cache` functions must clear them so the next account on the device doesn't see stale data.
- `src/sync/` pushes and pulls the signed-in user's data to Supabase (`core` schema). Guests run local-only. Restore and sync failures fall back without blocking boot (see `recoverWith` in `App.tsx`).
- All AI goes through `src/ai/edgeFunctions.ts` → `supabase.functions.invoke`. Callers must have a deterministic offline fallback (the coach has a translated one; describe-your-meal falls back to food-db's `parseMealText`). Model output is names and grams only: the client prices everything from food-db (`analyzeMealItems`, `composeRecipeFood`), plus the USDA records `dish-breakdown` attached (`foodFromUsdaRecord`).
- Dishes a user adds (`tracker/customDishes.ts`) are stored per account on the device and shown only to that user; they are never written to the shared catalogue.

### i18n

English and Arabic (`src/i18n/locales/en.json`, `ar.json`), with RTL for Arabic and per-script fonts (Inter / IBM Plex Sans Arabic) patched onto every `Text` by `installFontPatch()`. Any new user-facing string needs a key in **both** locale files.

## Hard rules (from README / BUILD_INSTRUCTIONS Part 0)

1. Nutrient values come only from `food-db`, or (for a dish ingredient `food-db` lacks) from a USDA FoodData Central record fetched by `dish-breakdown`. Never from an LLM: a model may name foods, estimate grams and choose which USDA record matches, but every number is copied from the record. An ingredient with no trusted source is shown as not counted; a dish over 15% uncounted is refused.
2. Targets are computed only in `nutrition-core`, with tests.
3. No AI provider key or direct provider call in client code (`apps/*`, `packages/*/src`). `check-ci-keys.mjs` fails on provider hosts, `EXPO_PUBLIC_*` AI key names, or literal keys. `GROQ_API_KEY` is an edge-function secret set in the Supabase dashboard, never in `.env`.
4. No user health data to any endpoint that trains on inputs (Groq with ZDR is fine; Gemini free and OpenRouter `:free` are not).
5. Open Food Facts data stays in the `off` schema.

Project constraint: $0 spend (`docs/planning/ZERO_BUDGET_PLAN.md`). Groq deprecates models often; check `GROQ_OPENROUTER_FINDINGS.md` before touching AI code.

## Expo version

`apps/mobile/AGENTS.md`: Expo 57 APIs differ from older versions. Read https://docs.expo.dev/versions/v57.0.0/ before writing Expo code.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
