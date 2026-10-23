import { getExercise } from './catalogue.js';
import { isAllowed } from './select.js';
import {
  BreakLength,
  CurrentLift,
  Exercise,
  LoggedExercise,
  PlankAbility,
  PlannedSlot,
  PushUpAbility,
  Target,
  WeeklyWorkoutPlan,
  WorkoutLog,
  WorkoutSettings,
} from './types.js';

/** The most sets the bodyweight ladder adds up to once there is no harder move. */
const MAX_LADDER_SETS = 4;
/** Two sessions below the range cut the load by this share. */
const FAILURE_CUT = 0.9;

const round2 = (kg: number) => Math.round(kg * 100) / 100;

/** The kind of weight an exercise is loaded with, which sets its step size. */
type LoadKind = 'barbell' | 'machine' | 'kettlebell' | 'dumbbell';

function loadKind(exercise: Exercise): LoadKind | null {
  if (!exercise.tracksLoad) return null;
  const has = (item: Exercise['equipment'][number]) => exercise.equipment.includes(item);
  if (has('barbell') || has('ez_bar')) return 'barbell';
  if (has('machine') || has('cable')) return 'machine';
  if (has('kettlebell')) return 'kettlebell';
  if (has('dumbbell')) return 'dumbbell';
  return 'machine';
}

/** Home dumbbells the user owns, lightest first; empty means adjustable or unknown. */
function ownedDumbbells(exercise: Exercise, settings: WorkoutSettings): number[] {
  if (settings.location === 'gym' || loadKind(exercise) !== 'dumbbell') return [];
  return [...new Set(settings.dumbbellWeightsKg)].sort((a, b) => a - b);
}

/** One step of weight: 2.5 kg on bars, machines and cables, 2 kg on dumbbells, 4 kg on kettlebells. */
export function loadIncrement(exercise: Exercise): number {
  switch (loadKind(exercise)) {
    case 'kettlebell':
      return 4;
    case 'dumbbell':
      return 2;
    default:
      return 2.5;
  }
}

/** A sensible first weight when the user starts from a blank field: the empty bar, the lightest bell. */
export function startingLoad(exercise: Exercise, settings: WorkoutSettings): number {
  const owned = ownedDumbbells(exercise, settings);
  if (owned.length > 0) return owned[0];
  switch (loadKind(exercise)) {
    case 'barbell':
      return exercise.equipment.includes('ez_bar') ? 10 : 20;
    case 'kettlebell':
      return 8;
    case 'dumbbell':
      return 4;
    default:
      return 10;
  }
}

/**
 * The next weight up or down from `kg`. Home dumbbells move through the
 * weights the user owns; everything else moves by its increment. Returns
 * `kg` unchanged when there is nowhere to go.
 */
export function stepLoad(exercise: Exercise, settings: WorkoutSettings, kg: number, direction: 1 | -1): number {
  const owned = ownedDumbbells(exercise, settings);
  if (owned.length > 0) {
    if (direction === 1) return owned.find((w) => w > kg) ?? kg;
    return [...owned].reverse().find((w) => w < kg) ?? kg;
  }
  const inc = loadIncrement(exercise);
  return Math.max(0, round2(kg + direction * inc));
}

/** The lighter weight after two sessions below the range: 10% off, rounded down to a real step. */
function reducedLoad(exercise: Exercise, settings: WorkoutSettings, kg: number): number {
  const owned = ownedDumbbells(exercise, settings);
  const goal = kg * FAILURE_CUT;
  if (owned.length > 0) {
    const lighter = owned.filter((w) => w < kg);
    if (lighter.length === 0) return kg;
    return [...lighter].reverse().find((w) => w <= goal) ?? lighter[lighter.length - 1];
  }
  const inc = loadIncrement(exercise);
  return Math.max(inc, round2(Math.floor(round2(goal / inc)) * inc));
}

const doneSets = (entry: LoggedExercise) => entry.sets.filter((set) => set.done);

/** Share of an old lift to start from after time off. */
const BREAK_FACTOR: Record<BreakLength, number> = { under_1_month: 1, '1_to_6_months': 0.9, over_6_months: 0.8 };
/** Beginners' quick checks, read as a lift: reps of push-ups, seconds of plank. */
const PUSH_UP_REPS: Record<PushUpAbility, number> = { none: 0, '1_to_5': 4, '6_to_15': 10, '16_plus': 18 };
const PLANK_SECONDS: Record<PlankAbility, number> = { under_20: 20, '20_to_45': 35, over_45: 50 };

/** A lift the user told us about, or one their beginner checks stand for. */
function liftFor(exerciseId: string, settings: WorkoutSettings): CurrentLift | undefined {
  const told = settings.profile?.lifts?.find((l) => l.exerciseId === exerciseId && l.reps > 0);
  if (told) return told;
  const ability = settings.profile?.ability;
  if (exerciseId === 'push-up' && ability?.pushUps && PUSH_UP_REPS[ability.pushUps] > 0) return { exerciseId, reps: PUSH_UP_REPS[ability.pushUps] };
  if (exerciseId === 'plank' && ability?.plank) return { exerciseId, reps: PLANK_SECONDS[ability.plank] };
  return undefined;
}

/**
 * A starting weight for the slot's range from a lift the user can do now:
 * their estimated one-rep max (Epley) brought down to the bottom of the
 * range with the slot's reps in reserve, rounded down to a real step.
 */
function loadFromLift(exercise: Exercise, settings: WorkoutSettings, slot: PlannedSlot, loadKg: number, reps: number): number {
  const oneRepMax = loadKg * (1 + reps / 30);
  const goal = oneRepMax / (1 + (slot.repMin + slot.targetRir) / 30);
  const owned = ownedDumbbells(exercise, settings);
  if (owned.length > 0) return [...owned].reverse().find((w) => w <= goal) ?? owned[0];
  const inc = loadIncrement(exercise);
  return Math.max(inc, round2(Math.floor(round2(goal / inc)) * inc));
}

/** This slot's entries, newest first, with the rating of the session each came from. */
function entriesFor(slotId: string, history: readonly WorkoutLog[]): { entry: LoggedExercise; log: WorkoutLog }[] {
  return history
    .map((log) => ({ log, entry: log.exercises.find((e) => e.slotId === slotId) }))
    .filter((item): item is { log: WorkoutLog; entry: LoggedExercise } => Boolean(item.entry && doneSets(item.entry).length > 0));
}

/**
 * Next session's target for one slot, from what the user logged before.
 * `slot` is the slot as it runs this week (swaps and rotation applied) and
 * `history` the logs that contain it, newest first. Double progression for
 * weights: fill the rep range, then add one step of weight. Bodyweight moves
 * climb a ladder of harder variations, then add sets. `taken` holds the
 * exercises other slots of the session already use, so a climb never puts
 * the same move in a session twice.
 */
export function nextTarget(
  slot: PlannedSlot,
  history: readonly WorkoutLog[],
  settings: WorkoutSettings,
  taken: ReadonlySet<string> = new Set()
): Target {
  const exercise = getExercise(slot.exerciseId);
  const base = { exerciseId: slot.exerciseId, sets: slot.sets, repMin: slot.repMin, repMax: slot.repMax, reps: slot.repMin };
  if (!exercise) return { ...base, reason: 'first_time' };

  const all = entriesFor(slot.slotId, history);
  const own = all.filter((item) => item.entry.exerciseId === exercise.id);

  if (own.length === 0) {
    // The move the slot just climbed to from its easier version (not a hand swap to it).
    const previous = all[0] ? getExercise(all[0].entry.exerciseId) : undefined;
    const previousSets = all[0] ? doneSets(all[0].entry) : [];
    const climbed = previousSets.length >= slot.sets && previousSets.every((set) => set.reps >= slot.repMax);
    if (previous?.harder === exercise.id && climbed) return { ...base, reason: 'ladder_step_up', reasonParams: { reps: slot.repMax } };
    // What they told us they can lift now beats a guess.
    const lift = liftFor(exercise.id, settings);
    if (lift && exercise.tracksLoad && lift.loadKg && lift.loadKg > 0) {
      // Back after a break: start lighter than they used to lift.
      const back = BREAK_FACTOR[settings.profile?.trainingNow?.active === false ? (settings.profile.trainingNow.breakLength ?? 'under_1_month') : 'under_1_month'];
      const loadKg = loadFromLift(exercise, settings, slot, lift.loadKg * back, lift.reps);
      return { ...base, loadKg, reason: 'from_current_lift', reasonParams: { kg: lift.loadKg, reps: lift.reps, ...(back < 1 ? { back: 1 } : {}) } };
    }
    if (lift && !exercise.tracksLoad) {
      const reps = Math.min(slot.repMax, Math.max(slot.repMin, lift.reps - slot.targetRir));
      return { ...base, reps, reason: 'from_current_lift', reasonParams: { reps: lift.reps } };
    }
    return { ...base, reason: exercise.tracksLoad ? 'first_time_pick_weight' : 'first_time' };
  }

  const last = doneSets(own[0].entry);
  const lowestReps = Math.min(...last.map((set) => set.reps));
  const allAtTop = last.length >= slot.sets && lowestReps >= slot.repMax;
  const aimOneMore = Math.min(slot.repMax, Math.max(slot.repMin, lowestReps + 1));

  if (!exercise.tracksLoad) {
    if (own[0].log.rating === 'hard') {
      return { ...base, sets: Math.max(slot.sets, last.length), reps: Math.min(slot.repMax, Math.max(slot.repMin, lowestReps)), reason: 'felt_hard_hold' };
    }
    if (allAtTop) {
      const harder = exercise.harder ? getExercise(exercise.harder) : undefined;
      if (harder && isAllowed(harder, settings) && !taken.has(harder.id)) {
        return { ...base, exerciseId: harder.id, reason: 'ladder_step_up', reasonParams: { reps: slot.repMax } };
      }
      if (last.length < MAX_LADDER_SETS) {
        return { ...base, sets: last.length + 1, reps: slot.repMax, reason: 'add_set', reasonParams: { sets: last.length + 1 } };
      }
      return { ...base, sets: Math.max(slot.sets, last.length), reps: slot.repMax, reason: 'hold' };
    }
    return { ...base, sets: Math.max(slot.sets, last.length), reps: aimOneMore, reason: 'in_range_add_reps' };
  }

  const loads = last.map((set) => set.loadKg).filter((kg): kg is number => typeof kg === 'number' && kg > 0);
  if (loads.length === 0) return { ...base, reason: 'first_time_pick_weight' };
  const lastLoad = Math.max(...loads);

  const belowRange = (entry: LoggedExercise) => doneSets(entry).some((set) => set.reps < slot.repMin);
  if (own.length >= 2 && belowRange(own[0].entry) && belowRange(own[1].entry)) {
    const loadKg = reducedLoad(exercise, settings, lastLoad);
    // Already on the lightest dumbbell they own: nothing lighter to drop to.
    if (loadKg === lastLoad) return { ...base, loadKg, reason: 'hold' };
    return { ...base, loadKg, reason: 'failed_twice_reduce', reasonParams: { kg: loadKg } };
  }

  if (own[0].log.rating === 'hard') {
    return { ...base, loadKg: lastLoad, reps: Math.max(slot.repMin, Math.min(slot.repMax, lowestReps)), reason: 'felt_hard_hold' };
  }

  if (allAtTop) {
    const heavier = stepLoad(exercise, settings, lastLoad, 1);
    if (heavier > lastLoad) {
      return {
        ...base,
        loadKg: heavier,
        reason: 'hit_top_add_load',
        reasonParams: { inc: round2(heavier - lastLoad), reps: slot.repMax },
      };
    }
    return { ...base, loadKg: lastLoad, reps: slot.repMax, reason: 'top_dumbbell_hold' };
  }

  return { ...base, loadKg: lastLoad, reps: aimOneMore, reason: 'in_range_add_reps' };
}

/**
 * The plan after a saved workout climbs the bodyweight ladder: each slot whose
 * next target is a harder move keeps that move from now on (stored as a swap,
 * which `exerciseForWeek` reads before rotation). Returns the same plan object
 * when nothing climbs.
 */
export function applyLadder(plan: WeeklyWorkoutPlan, history: readonly WorkoutLog[], slots: readonly PlannedSlot[]): WeeklyWorkoutPlan {
  const climbs: Record<string, string> = {};
  const inSession = new Map(slots.map((slot) => [slot.slotId, slot.exerciseId]));
  for (const slot of slots) {
    const taken = new Set([...inSession].filter(([slotId]) => slotId !== slot.slotId).map(([, id]) => id));
    const target = nextTarget(slot, history, plan.settings, taken);
    if (target.reason === 'ladder_step_up' && target.exerciseId !== slot.exerciseId) {
      climbs[slot.slotId] = target.exerciseId;
      inSession.set(slot.slotId, target.exerciseId);
    }
  }
  if (Object.keys(climbs).length === 0) return plan;
  return { ...plan, swaps: { ...plan.swaps, ...climbs } };
}
