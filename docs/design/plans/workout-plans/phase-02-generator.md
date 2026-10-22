# Phase 2: Plan generator

**Size:** M · **Blocked by:** 1

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
