import { getExercise } from './catalogue.js';
import { availableEquipment, FALLBACK_PATTERNS, isAllowed } from './select.js';
import { chooseSplit } from './split.js';
import {
  ImportedRoutine,
  MovementPattern,
  RoutineDay,
  SessionTemplateId,
  SplitId,
  Weekday,
  WeeklyWorkoutPlan,
  WorkoutSettings,
} from './types.js';

const WEEK: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ----- Patterns grouped the way people think about training -----

type Group = 'push' | 'pull' | 'lower';
const GROUP_OF: Partial<Record<MovementPattern, Group>> = {
  horizontal_push: 'push',
  vertical_push: 'push',
  triceps: 'push',
  shoulders_iso: 'push',
  horizontal_pull: 'pull',
  vertical_pull: 'pull',
  biceps: 'pull',
  squat: 'lower',
  hinge: 'lower',
  lunge: 'lower',
  glutes: 'lower',
  calves: 'lower',
};

/** Muscle groups for weekly volume, by the patterns that train them. */
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms';
const MUSCLE_OF: Partial<Record<MovementPattern, MuscleGroup>> = {
  horizontal_push: 'chest',
  horizontal_pull: 'back',
  vertical_pull: 'back',
  squat: 'legs',
  hinge: 'legs',
  lunge: 'legs',
  glutes: 'legs',
  calves: 'legs',
  vertical_push: 'shoulders',
  shoulders_iso: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
};

const DEFAULT_SETS = 3;

/** What a day of the routine trains, from its exercises' patterns. */
type DayKind = 'full' | 'lower' | 'upper' | 'push' | 'pull';

function kindOf(day: RoutineDay | undefined): DayKind {
  const groups = new Set((day?.exercises ?? []).map((e) => GROUP_OF[getExercise(e.exerciseId)?.pattern ?? 'core']).filter(Boolean));
  const lower = groups.has('lower');
  const push = groups.has('push');
  const pull = groups.has('pull');
  if (lower && (push || pull)) return 'full';
  if (lower) return 'lower';
  if (push && pull) return 'upper';
  if (push) return 'push';
  if (pull) return 'pull';
  return 'full';
}

const COVERS: Record<SessionTemplateId, readonly Group[]> = {
  full_a: ['push', 'pull', 'lower'],
  full_b: ['push', 'pull', 'lower'],
  full_c: ['push', 'pull', 'lower'],
  upper: ['push', 'pull'],
  lower: ['lower'],
  push: ['push'],
  pull: ['pull'],
  legs: ['lower'],
};

/** The user's days turned into our session templates, in the user's day order. */
function templatesFromKinds(kinds: readonly DayKind[]): SessionTemplateId[] {
  const hasPushOrPull = kinds.some((k) => k === 'push' || k === 'pull');
  const full: SessionTemplateId[] = ['full_a', 'full_b', 'full_c'];
  let f = 0;
  return kinds.map((kind) => {
    if (kind === 'full') return full[f++ % full.length];
    if (kind === 'lower') return hasPushOrPull ? 'legs' : 'lower';
    return kind;
  });
}

/**
 * More push-only days than pull-only days (chest day plus arms day, one back
 * day) leaves the week push-heavy. The surplus push days become upper-body
 * days, which add pulling work; the same the other way round.
 */
function balancePushPull(templates: SessionTemplateId[]): SessionTemplateId[] {
  const out = [...templates];
  const count = (t: SessionTemplateId) => out.filter((x) => x === t).length;
  while (count('push') >= 2 && count('push') > count('pull')) out[out.lastIndexOf('push')] = 'upper';
  while (count('pull') >= 2 && count('pull') > count('push')) out[out.lastIndexOf('pull')] = 'upper';
  return out;
}

function missingGroups(templates: readonly SessionTemplateId[]): Group[] {
  const covered = new Set(templates.flatMap((t) => COVERS[t]));
  return (['push', 'pull', 'lower'] as const).filter((g) => !covered.has(g));
}

function splitIdFor(templates: readonly SessionTemplateId[], fallback: SplitId): SplitId {
  const set = new Set(templates);
  const n = templates.length;
  if ([...set].every((t) => t.startsWith('full'))) return `full_body_${n}` as SplitId;
  if ([...set].every((t) => t === 'upper' || t === 'lower') && n === 4) return 'upper_lower_4';
  if ([...set].every((t) => t === 'push' || t === 'pull' || t === 'legs')) return n === 6 ? 'ppl_6' : n === 3 ? 'ppl_3' : fallback;
  if (n === 5) return 'upper_lower_ppl_5';
  return fallback;
}

/** Days a sport needs fresh legs for: the day and the day before. */
function sportBlocked(settings: WorkoutSettings): Set<Weekday> {
  const blocked = new Set<Weekday>();
  for (const sport of settings.profile?.sports ?? []) {
    for (const day of sport.days) {
      blocked.add(day);
      blocked.add(WEEK[(WEEK.indexOf(day) + 6) % 7]);
    }
  }
  return blocked;
}

const consecutive = (a: Weekday, b: Weekday) => (WEEK.indexOf(a) + 1) % 7 === WEEK.indexOf(b);

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [items.slice()];
  const out: T[][] = [];
  items.forEach((item, i) => {
    for (const rest of permutations([...items.slice(0, i), ...items.slice(i + 1)])) out.push([item, ...rest]);
  });
  return out;
}

/**
 * Lays the templates over the days so the same muscles aren't trained hard on
 * back-to-back days and leg sessions miss sports days, moving as few of the
 * user's days as it can.
 */
function arrangeForRecovery(days: readonly Weekday[], templates: readonly SessionTemplateId[], settings: WorkoutSettings): SessionTemplateId[] {
  const blocked = sportBlocked(settings);
  const cost = (order: readonly SessionTemplateId[]) => {
    let c = 0;
    order.forEach((t, i) => {
      if (blocked.has(days[i]) && COVERS[t].includes('lower')) c += 3;
      if (t !== templates[i]) c += 0.5;
      const next = order[i + 1];
      if (next && consecutive(days[i], days[i + 1]) && COVERS[t].some((g) => COVERS[next].includes(g) && !(t.startsWith('full') && next.startsWith('full')))) c += 2;
    });
    return c;
  };
  let best = [...templates];
  let bestCost = cost(best);
  for (const order of permutations(templates)) {
    const c = cost(order);
    if (c < bestCost) {
      best = order;
      bestCost = c;
    }
  }
  return best;
}

export interface RoutineLayout {
  templates: SessionTemplateId[];
  split: SplitId;
  /** True when the user's routine left a muscle group out and our balanced split replaced it. */
  rebalanced: boolean;
  missing: Group[];
}

/** The plan's structure for a routine the user entered: their days, their kind of split where it trains everything. */
export function layoutForRoutine(days: readonly Weekday[], routine: ImportedRoutine, settings: WorkoutSettings): RoutineLayout {
  const byDay = new Map(routine.days.map((d) => [d.day, d]));
  const entered = templatesFromKinds(days.map((day) => kindOf(byDay.get(day))));
  // What their own week leaves out decides whether we keep its structure at all.
  const missing = missingGroups(entered);
  const chosen = chooseSplit(days.length, settings.experience, settings.location);
  const base = missing.length ? chosen.templates : balancePushPull(entered);
  const templates = arrangeForRecovery(days, base, settings);
  return { templates, split: missing.length ? chosen.split : splitIdFor(templates, chosen.split), rebalanced: missing.length > 0, missing };
}

/** The exercises the user does on a day, for the generator to keep where they fit. */
export function routineExercisesFor(routine: ImportedRoutine | undefined, day: Weekday): Set<string> {
  return new Set(routine?.days.find((d) => d.day === day)?.exercises.map((e) => e.exerciseId) ?? []);
}

// ----- What changed, and why -----

export type RoutineChange =
  | { kind: 'kept_days'; days: Weekday[] }
  | { kind: 'kept_exercises'; exerciseIds: string[] }
  | { kind: 'replaced'; from: string; to: string | null; why: 'equipment' | 'joint' | 'level' | 'jumping' | 'dislike' }
  | { kind: 'left_out'; day: Weekday; exerciseIds: string[]; fits: number }
  | { kind: 'rebalanced'; missing: Group[] }
  | { kind: 'moved'; from: Weekday; to: Weekday; template: SessionTemplateId }
  | { kind: 'balanced_push_pull'; fromPush: number; fromPull: number; toPush: number; toPull: number }
  | { kind: 'volume'; group: MuscleGroup; from: number; to: number }
  | { kind: 'goal_reps' }
  | { kind: 'added_cardio'; minutes: number }
  | { kind: 'start_weights' };

/** Kept, changed or added, for the "What we improved" sheet. */
export function changeGroup(change: RoutineChange): 'kept' | 'changed' | 'added' {
  switch (change.kind) {
    case 'kept_days':
    case 'kept_exercises':
      return 'kept';
    case 'added_cardio':
    case 'start_weights':
      return 'added';
    default:
      return 'changed';
  }
}

function whyNotAllowed(exerciseId: string, settings: WorkoutSettings): Extract<RoutineChange, { kind: 'replaced' }>['why'] {
  const exercise = getExercise(exerciseId)!;
  if (settings.profile?.dislikes?.includes(exerciseId)) return 'dislike';
  const available = availableEquipment(settings);
  if (!exercise.equipment.every((item) => available.has(item))) return 'equipment';
  if (exercise.jointLoads.some((j) => settings.protectedJoints.includes(j))) return 'joint';
  if (settings.experience === 'new' && exercise.level !== 'beginner') return 'level';
  return 'jumping';
}

/** Hard sets a week per muscle group, theirs (sets as entered, else 3) or the plan's. */
function weeklySets(entries: { exerciseId: string; sets: number }[]): Record<MuscleGroup, number> {
  const out: Record<MuscleGroup, number> = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0 };
  for (const e of entries) {
    const group = MUSCLE_OF[getExercise(e.exerciseId)?.pattern ?? 'core'];
    if (group) out[group] += e.sets;
  }
  return out;
}

const pushPull = (sets: Record<MuscleGroup, number>) => ({ push: sets.chest + sets.shoulders, pull: sets.back });

/** The weekly-set range per muscle the plan aims for, by goal. */
function volumeRange(settings: WorkoutSettings): [number, number] {
  return settings.goal === 'muscle' ? [10, 20] : [6, 16];
}

/**
 * Every difference between the routine the user entered and the plan made
 * from it, each with what it was and what it is now. Pure: the screen turns
 * each change into one line with its reason.
 */
export function describeRoutineChanges(routine: ImportedRoutine, plan: WeeklyWorkoutPlan): RoutineChange[] {
  const settings = plan.settings;
  const changes: RoutineChange[] = [];
  const planIds = new Set(plan.sessions.flatMap((s) => s.slots.map((slot) => plan.swaps[slot.slotId] ?? slot.exerciseId)));
  const routineIds = routine.days.flatMap((d) => d.exercises.map((e) => e.exerciseId));

  changes.push({ kind: 'kept_days', days: plan.sessions.map((s) => s.day) });
  const kept = [...new Set(routineIds.filter((id) => planIds.has(id)))];
  if (kept.length) changes.push({ kind: 'kept_exercises', exerciseIds: kept });

  const layout = layoutForRoutine(plan.sessions.map((s) => s.day), routine, settings);
  if (layout.rebalanced) changes.push({ kind: 'rebalanced', missing: layout.missing });

  // Unsafe or unavailable: replaced by what the plan has for that pattern on that day.
  for (const day of routine.days) {
    const session = plan.sessions.find((s) => s.day === day.day);
    const leftOut: string[] = [];
    const taken = new Set<string>();
    for (const { exerciseId } of day.exercises) {
      const exercise = getExercise(exerciseId);
      if (!exercise || planIds.has(exerciseId)) continue;
      if (!isAllowed(exercise, settings)) {
        // The slot that took its place: same movement, or the related one the plan fell back to.
        const patterns = [exercise.pattern, ...(FALLBACK_PATTERNS[exercise.pattern] ?? [])];
        const replacement = patterns
          .map((pattern) => session?.slots.find((slot) => slot.pattern === pattern && !routineIds.includes(slot.exerciseId) && !taken.has(slot.slotId)))
          .find(Boolean);
        if (replacement) taken.add(replacement.slotId);
        changes.push({ kind: 'replaced', from: exerciseId, to: replacement?.exerciseId ?? null, why: whyNotAllowed(exerciseId, settings) });
      } else if (exercise.pattern !== 'cardio' && exercise.pattern !== 'conditioning') {
        leftOut.push(exerciseId);
      }
    }
    if (leftOut.length && session) changes.push({ kind: 'left_out', day: day.day, exerciseIds: leftOut, fits: session.slots.length });
  }

  // Days whose session moved for recovery or a sports day.
  if (!layout.rebalanced) {
    const theirs = templatesFromKinds(plan.sessions.map((s) => kindOf(routine.days.find((d) => d.day === s.day))));
    plan.sessions.forEach((session, i) => {
      if (session.template !== theirs[i] && COVERS[theirs[i]].includes('lower') && !COVERS[session.template].includes('lower')) {
        const to = plan.sessions.find((s, j) => j !== i && s.template === theirs[i] && theirs[j] !== theirs[i]);
        if (to) changes.push({ kind: 'moved', from: session.day, to: to.day, template: theirs[i] });
      }
    });
  }

  const theirSets = weeklySets(routine.days.flatMap((d) => d.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets ?? DEFAULT_SETS }))));
  const planSets = weeklySets(plan.sessions.flatMap((s) => s.slots.map((slot) => ({ exerciseId: slot.exerciseId, sets: slot.sets }))));
  const theirPP = pushPull(theirSets);
  const planPP = pushPull(planSets);
  const unbalanced = (pp: { push: number; pull: number }) => Math.max(pp.push, pp.pull) > 1.5 * Math.max(1, Math.min(pp.push, pp.pull));
  // Only claimed when the plan really is balanced.
  if (unbalanced(theirPP) && !unbalanced(planPP)) {
    changes.push({ kind: 'balanced_push_pull', fromPush: theirPP.push, fromPull: theirPP.pull, toPush: planPP.push, toPull: planPP.pull });
  }
  const [low, high] = volumeRange(settings);
  for (const group of ['chest', 'back', 'legs', 'shoulders', 'arms'] as const) {
    const from = theirSets[group];
    const to = planSets[group];
    if ((from < low || from > high) && Math.abs(from - to) >= 4) changes.push({ kind: 'volume', group, from, to });
  }

  const ranges = plan.sessions.flatMap((s) => s.slots);
  const offRange = routine.days.some((d) =>
    d.exercises.some((e) => {
      const slot = ranges.find((r) => r.exerciseId === e.exerciseId);
      return e.reps !== undefined && slot && (e.reps < slot.repMin - 3 || e.reps > slot.repMax + 3);
    })
  );
  if (offRange) changes.push({ kind: 'goal_reps' });

  const cardio = plan.sessions.find((s) => s.cardio)?.cardio;
  if (cardio && !routineIds.some((id) => ['cardio', 'conditioning'].includes(getExercise(id)?.pattern ?? ''))) {
    changes.push({ kind: 'added_cardio', minutes: cardio.minutes });
  }
  if (settings.profile?.lifts?.some((l) => l.reps > 0)) changes.push({ kind: 'start_weights' });
  return changes;
}
