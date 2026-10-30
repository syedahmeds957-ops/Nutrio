# Phase 2: Plan generator

**Size:** M · **Blocked by:** 1

> **Status: done 2026-10-23, not committed (waiting for the user's command).** See "Execution record" at the end.

## Outcome

`generateWeeklyPlan(settings, options)` in `workout-core` returns a valid, stable weekly plan for any combination of the setup answers. It's pure and table-tested.

## Tasks

1. **Types** (add to `src/types.ts`):
   ```ts
   export type WorkoutGoal = 'muscle' | 'strength' | 'fat_loss' | 'general';
   export type Experience = 'new' | 'some' | 'experienced';
   export type TrainingLocation = 'home_none' | 'home_equipment' | 'gym';
   export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
   export type FocusArea = 'full_body' | 'upper' | 'lower_glutes' | 'core' | 'arms';
   export type SessionMinutes = 20 | 30 | 45 | 60 | 75;
   export type RamadanSlot = 'after_suhoor' | 'before_iftar' | 'after_taraweeh';

   export interface WorkoutSettings {
     goal: WorkoutGoal;
     experience: Experience;
     location: TrainingLocation;
     homeEquipment: Equipment[];        // only read for home_equipment
     dumbbellWeightsKg: number[];       // home dumbbells owned; empty = adjustable/unknown
     trainingDays: Weekday[];           // 2..6 distinct days
     sessionMinutes: SessionMinutes;
     focus: FocusArea[];
     protectedJoints: JointLoad[];
     lowIntensity: boolean;             // set from pregnancy / hypertension (phase 3)
     ramadan: { enabled: boolean; slot?: RamadanSlot };
   }

   export interface Prescription {
     sets: number; repMin: number; repMax: number; restSec: number; targetRir: number;
   }
   export interface PlannedSlot extends Prescription {
     slotId: string;                    // stable, e.g. 'upper-a:horizontal_push:0'
     pattern: MovementPattern;
     role: 'main' | 'accessory';
     exerciseId: string;
   }
   export interface WorkoutSession {
     day: Weekday;
     template: SessionTemplateId;       // 'full_a' | 'full_b' | 'full_c' | 'upper' | 'lower' | 'push' | 'pull' | 'legs'
     slots: PlannedSlot[];
     finisher?: { exerciseIds: string[]; workSec: number; restSec: number; rounds: number };
     estimatedMinutes: number;
   }
   export interface WeeklyWorkoutPlan {
     version: 1;
     createdAt: string;                 // ISO
     blockStart: string;                // date key; week index counts from here
     seed: number;
     settings: WorkoutSettings;
     split: SplitId;
     sessions: WorkoutSession[];
     swaps: Record<string, string>;     // slotId -> exerciseId (phase 6)
   }
   ```
2. **`src/split.ts`.** `chooseSplit(days, experience, location)` follows the README table:
   - 2 days: full body A/B
   - 3 days: full body A/B/C, or PPL for experienced + gym
   - 4 days: upper/lower ×2
   - 5 days: U/L/P/P/L
   - 6 days: PPL ×2

   Templates are ordered pattern-slot lists, with main slots first. The slot count comes from session length (20→3, 30→4, 45→5, 60→6, 75→7) by taking the first N. Each focus area promotes one accessory slot of its pattern (`lower_glutes` → `glutes`/`lunge`, `arms` → `biceps`/`triceps`, `core` → `core`, `upper` → push/pull accessory). `full_body` changes nothing.
3. **`src/prescription.ts`.** `prescribe(goal, experience, role, caps)` returns sets, reps, rest and RIR:

   | Goal | Main lifts | Accessories |
   |---|---|---|
   | Strength | 4 × 4–6, 150 s, RIR 2 | 3 × 8–10 |
   | Muscle | 3 × 8–12, 90 s, RIR 1–2 | 3 × 10–15 |
   | Fat loss / general | 3 × 10–15, 60 s, RIR 2 | 2 × 12–15 |

   New lifters get one less set (minimum 2) and RIR +1. **Caps** (low intensity or Ramadan) mean RIR ≥ 2 (≥ 3 for low intensity), no finisher, and rest ≥ 90 s.
4. **`src/select.ts`.** `pickExercise(slot, settings, usedIds, seed, weekIndex)`:
   - Filter by available equipment: bodyweight for `home_none`; bodyweight + `homeEquipment` for `home_equipment`; everything for `gym`.
   - Filter by level ≤ experience (new → beginner only) and drop any exercise whose `jointLoads` overlap `protectedJoints`.
   - Main slots prefer compound exercises.
   - Ties break by a stable hash of `seed + slotId` (no `Math.random`).
   - **Empty pools (from phase 1's known gaps).** When no exercise fits a slot, fall back in order: `horizontal_pull` → `hinge`; `vertical_pull` → `horizontal_pull` → `hinge`; `vertical_push` → `horizontal_push`; `squat` → `lunge`. Use the fallback pattern's prescription. Never leave a slot empty, and test this for `home_none`.
   - No repeats within a session; avoid repeats within the week unless the pool has one exercise.
   - Accessories rotate every 4 weeks (`Math.floor(weekIndex / 4)` shifts the pick); main slots never rotate.
   - `exerciseForWeek(plan, slotId, weekIndex)` applies `plan.swaps` first.
5. **Finisher** (fat loss and general only, never with caps): 2 `conditioning` exercises, 30 s on / 30 s off, rounds sized to fit the time left.
6. **Time fit.** `estimateMinutes(session)` = 5 min warm-up + Σ sets × (40 s work + rest) + finisher. While it's over `sessionMinutes + 5`, drop a set from the last accessory, then the last accessory itself.
7. **`src/generator.ts`.** `generateWeeklyPlan(settings, { seed, today })` validates the settings (throws `InvalidWorkoutSettings` on 0 or more than 6 days, duplicate days, etc.), builds the sessions and returns a `WeeklyWorkoutPlan` with `blockStart = today`.
8. **`regeneratePlan(previous, newSettings, today)`** keeps the seed, keeps `swaps` whose slotId still exists and whose exercise still passes the new filters, and keeps `blockStart`. Phase 3 (edit settings) and phase 7 (Ramadan toggle) use it.

## Tests (`packages/workout-core/test/generator.test.ts`, table-driven)

Over the grid of days 2–6 × 3 locations × 3 experience levels × 4 goals × {normal, Ramadan, lowIntensity}:
- session count = days, and session days = `trainingDays`
- every exercise's equipment ⊆ available
- no protected joint appears
- no expert or (for new lifters) intermediate exercise
- slot counts follow the length table, and `estimatedMinutes ≤ sessionMinutes + 5`
- no repeat within a session
- same seed → deep-equal plan, different seed → same structure
- caps hold: RIR ≥ 2, no finisher, Ramadan ≤ 4 slots and ≤ 45 min

Also: rotation changes accessories at week 4 and keeps main lifts; `regeneratePlan` keeps valid swaps and drops invalid ones; invalid settings throw.

## Verify

```bash
npm run build
npx vitest run packages/workout-core
npm test
```

## Done when

All grid cases pass. Commit: `feat(workout-core): deterministic weekly plan generator`.

## Execution record (2026-10-23)

### What shipped

- **New modules:**
  - `src/split.ts`: 8 session templates, split choice, focus promotion
  - `src/prescription.ts`
  - `src/select.ts`: filters, ranking, fallback patterns, rotation alternates
  - `src/generator.ts`: `generateWeeklyPlan`, `regeneratePlan`, `estimateMinutes`, `exerciseForWeek`, `weekIndexFor`, `validateSettings`
- **Plan types** added to `src/types.ts`.
- **46 new tests**, including the full grid: 5 day counts × 3 locations × 3 experience levels × 4 goals × 3 lengths (20/45/75 min) × 3 modes (normal / Ramadan / low intensity), which is 1,620 plans.

### Changes from the plan

1. **`Exercise.highImpact`.** Added to the 6 jumping moves (jump squat, split jump, star jumps, knee tuck jump, scissor jumps, fast skipping) so Ramadan and low-intensity plans can leave them out. Phase 1 hadn't kept the source's plyometric label.
2. **`Prescription.unit`** (`'reps' | 'seconds'`). Planks and other timed holds are prescribed as 30–45 s.
3. **No-equipment users get full-body days whatever the day count:** `full_body_4/5/6` rotate A/B/C. An upper/lower split had no pulling options at home, so "upper" days were push-ups plus glute bridges.
4. **Week repeats are ranked lower instead of avoided.** Each earlier use costs 1.5 points (a bodyweight-only option costs 2 at home and 4 at the gym). Strict avoidance swapped a home user's dumbbell Romanian deadlift for a glute bridge just because Monday used it. Now at most 2 uses per week when alternatives exist (tested).
5. **Time fit also trims main sets** once no accessories are left, evenly from the lift with the most sets, never below 2. A 20-minute strength session doesn't fit otherwise.
6. **Rotation lists are stored on each slot** (`alternates`, up to 4, never overlapping another slot in the same session), so `exerciseForWeek` needs no catalogue lookup.
7. **Ranking preferences:**
   - gym: weighted exercises first, barbell main lifts for some/experienced lifters, machines and dumbbells for new lifters
   - home: owned equipment before bodyweight
   - main slots: compound exercises first

### Verification evidence

| Check | Result |
|---|---|
| `npx vitest run packages/workout-core` | 83 / 83 pass (37 catalogue + 46 generator) |
| Deliberate bugs | turning off joint protection, the Ramadan jumping filter, or the no-repeat-in-session rule fails 1, 5 and 12 tests |
| `npm run build` | pass |
| `npm test` (whole repo) | 1,091 tests, 0 failures |
| `node scripts/check-ci-keys.mjs` | pass |
| `npx tsc --noEmit` (apps/mobile) | 0 errors |

Sample plans were also printed and read by eye (gym 4-day muscle, new lifter fat loss, home dumbbells, home no equipment, Ramadan, 20-minute strength).
