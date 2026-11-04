# Phase 1: Exercise catalogue + bundled images

**Size:** M · **Blocked by:** none · **Risk:** highest (bundling ~400 images through Metro on web and native), so it goes first.

> **Status: done 2026-10-22, not committed (waiting for the user's command).** See "Execution record" at the end for what changed from this plan.

## Outcome

A new `@nutrio/workout-core` package holds about 200 curated exercises with English and Arabic text. The app bundles 2 compressed photos per exercise and can show them as a loop on web and phone.

## Source

`yuhonas/free-exercise-db`, pinned to one commit SHA recorded in the script. It has 876 exercises, of which 744 are non-expert strength/cardio/plyometric/stretching. Each has 2 JPGs at 850×567, about 55 KB each. The fields used are `id`, `name`, `level`, `mechanic`, `force`, `equipment`, `primaryMuscles`, `secondaryMuscles`, `instructions` and `images`.

## Tasks

1. **Package scaffold.** Create `packages/workout-core/` with:
   - `package.json`: name `@nutrio/workout-core`, `main ./dist/index.js`, `types ./dist/index.d.ts`, `sideEffects: false`, scripts `build: tsc` and `test: vitest run`.
   - `tsconfig.json`, extending `../../tsconfig.base.json` like `nutrition-core`.
   - `src/index.ts` and `test/`.

   Add `"@nutrio/workout-core": "*"` to `apps/mobile/package.json`, then run `npm install` to link the workspace (no new external packages).
2. **Metro.** In `apps/mobile/metro.config.js`, replace the two hard-coded `@nutrio/*` checks with one `WORKSPACE_PACKAGES` map covering all three packages, used by both `extraNodeModules` and `resolveRequest`.
3. **Types** in `src/types.ts`:
   ```ts
   export type Equipment = 'bodyweight' | 'dumbbell' | 'barbell' | 'kettlebell' | 'bands'
     | 'cable' | 'machine' | 'bench' | 'pullup_bar' | 'ez_bar';
   export type MovementPattern = 'squat' | 'hinge' | 'lunge' | 'horizontal_push' | 'horizontal_pull'
     | 'vertical_push' | 'vertical_pull' | 'core' | 'glutes' | 'biceps' | 'triceps' | 'calves'
     | 'shoulders_iso' | 'conditioning';
   export type JointLoad = 'knee' | 'lower_back' | 'shoulder' | 'wrist';
   export type ExerciseLevel = 'beginner' | 'intermediate';
   export interface Exercise {
     id: string;                 // our stable kebab-case id, e.g. 'goblet-squat'
     sourceId: string;           // free-exercise-db id, for attribution and re-runs
     name: { en: string; ar: string };
     instructions: { en: string[]; ar: string[] };
     pattern: MovementPattern;
     primaryMuscles: string[];
     secondaryMuscles: string[];
     equipment: Equipment[];     // all required, e.g. ['dumbbell', 'bench']
     level: ExerciseLevel;
     compound: boolean;
     jointLoads: JointLoad[];
     tracksLoad: boolean;        // false when equipment is bodyweight-only or bands
     harder?: string;            // bodyweight ladder: next exercise id
     easier?: string;
   }
   ```
4. **Curation inputs** (committed, hand-written):
   - `packages/workout-core/curation/curated.json`: one entry per kept exercise with `sourceId`, `id`, `pattern`, `equipment[]`, `jointLoads[]` and optional `harder`/`easier`. Equipment and joint loads are set by hand because the source's `equipment` is a single loose string ("other" or null on 169 records).
   - `packages/workout-core/curation/ar.json`: `{ [id]: { name, instructions[] } }`, written by me. You spot-check it before release.
5. **Coverage targets** for the curated list (tested in task 8):
   - Every main pattern (squat, hinge, lunge, horizontal and vertical push and pull, core) has at least 3 exercises for each of: bodyweight-only, home equipment (dumbbell/bands/kettlebell), and gym (barbell/cable/machine).
   - **Known gap:** pulling with no equipment at all. If free-exercise-db lacks enough, the bodyweight pool uses back-extension and prone-raise style moves, and the setup screen tells home-no-equipment users that a resistance band unlocks proper pulling work. No custom images are drawn.
   - Ladders for push, squat, hinge/glute and core, using only exercises that exist in the source.
6. **Build script** `scripts/build-exercise-catalogue.mjs` (macOS only, run by hand, never in CI):
   - Downloads `dist/exercises.json` at the pinned SHA and merges `curated.json` + `ar.json`.
   - Fails loudly on a missing source id, a missing Arabic entry or a missing image.
   - Writes `packages/workout-core/src/data/exercises.data.ts`.
   - Downloads both images per exercise, then runs `sips --resampleWidth 400 -s formatOptions 70` into `apps/mobile/assets/exercises/<id>-0.jpg` and `-1.jpg`.
   - Writes `apps/mobile/src/workout/exerciseImages.ts`: `export const EXERCISE_IMAGES: Record<string, [ImageSourcePropType, ImageSourcePropType]>`, built from static `require()` calls (Metro can't resolve dynamic requires).
7. **Catalogue API** in `src/catalogue.ts`: `EXERCISES` (readonly array), `getExercise(id)` and `exercisesFor({ pattern, equipment, maxLevel, excludeJoints })`. Export them from `src/index.ts`.
8. **Image loop component** `apps/mobile/src/workout/ui/ExerciseImageLoop.tsx`:
   - Props: `exerciseId`, `size`, `paused`.
   - Alternates the two frames every 900 ms with React Native `Image`.
   - Shows frame 0 only when `AccessibilityInfo.isReduceMotionEnabled()` is true or when `paused`.
   - Includes an `accessibilityLabel` from the exercise name.
9. **Test stub.** Add an anchored alias `/\.(jpg|png)$/` → `apps/mobile/test/stubs/image-asset.ts` in `apps/mobile/vitest.config.ts`, so modules that import `exerciseImages.ts` load under vitest.
10. **Attribution.** Add a line to the README's credits section: "Exercise data and images: free-exercise-db (public domain)." Attribution isn't required, but it's honest.

## Tests

- `packages/workout-core/test/catalogue.test.ts`:
  - Ids are unique and kebab-case.
  - Every exercise has non-empty EN and AR names and instructions.
  - No level is `expert`.
  - The coverage targets in task 5 hold.
  - Every `harder`/`easier` points to an existing id, ladders have no cycles, and `harder` is the same pattern.
  - `tracksLoad` is false exactly when equipment is bodyweight-only or bands.
- `apps/mobile/src/workout/__tests__/exercise-images.test.ts`: every catalogue id has 2 frames in `EXERCISE_IMAGES`, and there are no orphans.

## Verify

```bash
npm run build
npx vitest run packages/workout-core
cd apps/mobile && npx vitest run src/workout
du -sh apps/mobile/assets/exercises        # must be ≤ 12M
node scripts/check-ci-keys.mjs
npm test
```

## Demo (manual, before commit)

Temporarily mount `ExerciseImageLoop` for three exercises (bodyweight, dumbbell, barbell) in a scratch screen. Check it on `npm run web` and the iOS or Android simulator, with Arabic names in RTL. Remove the scratch mount before committing.

## Done when

- About 200 exercises, with every coverage target met or its gap documented in this file.
- Images total ≤ 12 MB, and the loop works on web and one native platform.
- Commit: `feat(workout-core): curated exercise catalogue with bundled images`.

## Execution record (2026-10-22)

### What shipped

- **`packages/workout-core`:** `Exercise` and related types, `EXERCISES`, `getExercise`, `exercisesFor`, `MUSCLE_NAMES`, and 37 tests.
- **The catalogue:** **169 exercises** (139 beginner, 30 intermediate, 0 expert).
  - 37 need no equipment or only a bench or pull-up bar.
  - 55 use dumbbells, bands or a kettlebell.
  - 77 are gym only.
- **Images:** 338 at 400 px JPEG, **10 MB** total (limit 12 MB). Source pinned at `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`.
- **App side:**
  - `scripts/build-exercise-catalogue.mjs`
  - the generated `apps/mobile/src/workout/exerciseImages.ts`
  - `ExerciseImageLoop` (2-frame loop; still frame under reduced motion)
  - an image-map test
  - a Metro `WORKSPACE_PACKAGES` map
- **README:** a repository-layout row with the free-exercise-db credit.

### Changes from the plan

1. **Our own instructions instead of the source's.** The source text didn't match its exercises in places:
   - its "Chair squat" is a Smith-machine squat
   - "Side bridge" has no steps
   - the floor back extension needs a partner

   It was also long and first-person ("my preference", "Tip:"). Every exercise now has 3–4 short steps written by us, in `curation/text/*.json`, with Arabic matching English step for step. The Arabic still needs a native speaker's spot-check before release.
2. **169 exercises, not "about 200".** Coverage targets drove the count. Two source entries were dropped after checking their photos (chair squat, floor back extension). Every photo was checked by eye against its exercise name on contact sheets.
3. **`Exercise.timed` added** for planks and conditioning (they're done for time, not reps). `tracksLoad` = has weighted equipment and isn't timed, with a `noLoad` override for the back-extension bench and the dip-station knee raise.
4. **Image stub:** a Vitest setup file (`apps/mobile/test/setup/image-assets.ts`) instead of an import alias. The image map uses `require()`, which goes to Node's loader, not Vite's, so an alias can't intercept it.
5. **Flutter kicks** in this dataset are done face-down on a bench, so the exercise is filed under `glutes` and needs a `bench`.

### Known gaps (pinned in `catalogue.test.ts`)

With no equipment at all, the public-domain dataset gives:
- 2 squats (bodyweight, jump)
- 2 hinges (glute bridge, single-leg bridge)
- **no** horizontal pull, vertical push or vertical pull.

Phase 2 must fall back to a related pattern for these slots (see phase-02 task 4). The setup screen already plans a "band unlocks pulling" tip.

### Verification evidence

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 37 / 37 pass |
| `cd apps/mobile && npx vitest run src/workout` | 2 / 2 pass |
| `npx tsc --noEmit` (workout-core, apps/mobile) | 0 errors |
| `npm run build` | all 3 packages build |
| `npm test` (whole repo) | 1,045 tests, 0 failures |
| `node scripts/check-ci-keys.mjs` | pass |
| `du -sh apps/mobile/assets/exercises` | 10M |
| `expo export --platform web` with a temporary demo screen | 338 JPEGs emitted as separate files; headless Chrome screenshots 0.9 s apart show the frames alternating, and the Arabic text renders |
| `expo export --platform ios` / `android` | both exit 0, each bundle carries 338 JPEGs |
| iPhone 17 Pro Max simulator (iOS 27.1, Expo Go 57.0.9) | app bundles (1,535 modules); screenshots half a frame apart show all three demos alternating frames; Arabic text renders |
| Android emulator | not run (none installed); the Android bundle export above passes |

The temporary demo screen was removed afterwards; `App.tsx` has no diff.
