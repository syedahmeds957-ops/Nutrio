import { EXERCISES } from './catalogue.js';
import { capsApply } from './prescription.js';
import { Equipment, Exercise, MovementPattern, SlotRole, WorkoutSettings } from './types.js';

const ALL_EQUIPMENT: readonly Equipment[] = [
  'bodyweight',
  'dumbbell',
  'barbell',
  'kettlebell',
  'bands',
  'cable',
  'machine',
  'bench',
  'pullup_bar',
  'ez_bar',
];

/** Home equipment that makes an exercise "use what you own" rather than bodyweight. */
const OWNED_HOME_LOAD: ReadonlySet<Equipment> = new Set(['dumbbell', 'kettlebell', 'bands', 'pullup_bar']);

/**
 * Where a slot looks when its own pattern has nothing the user can do (the
 * no-equipment gaps from phase 1, or joints the user protects). Ordered by
 * how close the substitute trains the same muscles.
 */
export const FALLBACK_PATTERNS: Readonly<Partial<Record<MovementPattern, readonly MovementPattern[]>>> = {
  horizontal_pull: ['hinge', 'core'],
  vertical_pull: ['horizontal_pull', 'hinge', 'core'],
  vertical_push: ['horizontal_push', 'triceps'],
  horizontal_push: ['triceps'],
  squat: ['lunge', 'glutes'],
  lunge: ['squat', 'glutes'],
  hinge: ['glutes', 'core'],
  glutes: ['hinge', 'lunge'],
  biceps: ['horizontal_pull', 'vertical_pull', 'core'],
  triceps: ['horizontal_push'],
  shoulders_iso: ['vertical_push', 'horizontal_push', 'core'],
  calves: ['lunge', 'squat', 'core'],
};

export function availableEquipment(settings: WorkoutSettings): ReadonlySet<Equipment> {
  if (settings.location === 'gym') return new Set(ALL_EQUIPMENT);
  if (settings.location === 'home_equipment') return new Set<Equipment>(['bodyweight', ...settings.homeEquipment]);
  return new Set<Equipment>(['bodyweight']);
}

/** Whether this user can safely do this exercise at all. */
export function isAllowed(exercise: Exercise, settings: WorkoutSettings): boolean {
  const available = availableEquipment(settings);
  if (!exercise.equipment.every((item) => available.has(item))) return false;
  if (settings.experience === 'new' && exercise.level !== 'beginner') return false;
  if (exercise.jointLoads.some((joint) => settings.protectedJoints.includes(joint))) return false;
  const capped = capsApply({ ramadan: settings.ramadan.enabled, lowIntensity: settings.lowIntensity });
  if (capped && exercise.highImpact) return false;
  return true;
}

/** FNV-1a: a stable, seedable tie-breaker so the same seed always gives the same plan. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Lower is better. Location and role decide what "good" means before the hash breaks ties. */
function preference(exercise: Exercise, role: SlotRole, settings: WorkoutSettings): number {
  let score = 0;
  if (role === 'main' && !exercise.compound) score += 3;
  if (settings.location === 'gym') {
    if (!exercise.tracksLoad) score += 4;
    if (role === 'main') {
      const barbell = exercise.equipment.includes('barbell');
      // New lifters learn on machines and dumbbells; others build main lifts on the barbell.
      if (settings.experience === 'new' ? barbell : !barbell) score += 1;
    }
  } else if (settings.location === 'home_equipment') {
    if (!exercise.equipment.some((item) => OWNED_HOME_LOAD.has(item))) score += 2;
  }
  return score;
}

/**
 * What each earlier use of an exercise this week costs. One repeat is enough
 * to prefer a different exercise of equal quality but not a clearly worse one
 * (a bodyweight move over the dumbbell lift); a second repeat usually is.
 */
const WEEK_REPEAT_PENALTY = 1.5;

/** How many times each exercise has been used earlier in the week. */
export type WeekUsage = ReadonlyMap<string, number>;

export function rankCandidates(
  candidates: readonly Exercise[],
  role: SlotRole,
  settings: WorkoutSettings,
  seed: number,
  slotId: string,
  usedInWeek: WeekUsage = new Map()
): Exercise[] {
  return [...candidates]
    .map((exercise) => ({
      exercise,
      score: preference(exercise, role, settings) + WEEK_REPEAT_PENALTY * (usedInWeek.get(exercise.id) ?? 0),
      tie: hashString(`${seed}:${slotId}:${exercise.id}`),
    }))
    .sort((a, b) => a.score - b.score || a.tie - b.tie)
    .map((entry) => entry.exercise);
}

export interface Pick {
  exercise: Exercise;
  /** The pattern actually used: the slot's own, or a fallback. */
  pattern: MovementPattern;
}

export interface PickInput {
  pattern: MovementPattern;
  role: SlotRole;
  settings: WorkoutSettings;
  seed: number;
  slotId: string;
  /** Never repeated: exercises already in this session. */
  usedInSession: ReadonlySet<string>;
  /** Exercises used earlier in the week: allowed, but ranked lower each time they repeat. */
  usedInWeek: WeekUsage;
}

/** The best exercise for a slot, falling back to related patterns; null only when nothing at all fits. */
export function pickExercise(input: PickInput): Pick | null {
  const patterns = [input.pattern, ...(FALLBACK_PATTERNS[input.pattern] ?? [])];
  for (const pattern of patterns) {
    const pool = EXERCISES.filter(
      (exercise) =>
        exercise.pattern === pattern && !input.usedInSession.has(exercise.id) && isAllowed(exercise, input.settings)
    );
    if (pool.length === 0) continue;
    const ranked = rankCandidates(pool, input.role, input.settings, input.seed, input.slotId, input.usedInWeek);
    return { exercise: ranked[0], pattern };
  }
  return null;
}

/**
 * Rotation candidates for an accessory: the chosen exercise first, then up to
 * three more of the same pattern that no other slot in the session uses.
 */
export function alternatesFor(
  chosen: Exercise,
  settings: WorkoutSettings,
  seed: number,
  slotId: string,
  reserved: ReadonlySet<string>
): string[] {
  const pool = EXERCISES.filter(
    (exercise) =>
      exercise.pattern === chosen.pattern &&
      exercise.id !== chosen.id &&
      !reserved.has(exercise.id) &&
      isAllowed(exercise, settings)
  );
  const ranked = rankCandidates(pool, 'accessory', settings, seed, `${slotId}:rotation`);
  return [chosen.id, ...ranked.slice(0, 3).map((exercise) => exercise.id)];
}
