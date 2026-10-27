import type {
  LoggedSet,
  PlannedSlot,
  SessionRating,
  Target,
  WeeklyWorkoutPlan,
  WorkoutLog,
  WorkoutSession,
} from '@nutrio/workout-core';
import { getExercise, nextTarget, planSettings } from './core.js';
import { historyForSlot } from './historyFor.js';
import { isCardioSlot, slotsForWeek, type CardioView } from './weekView.js';

/** One slot as it runs today: the week's exercise and next target, from workout-core. */
export interface SlotTarget {
  slot: PlannedSlot;
  target: Target;
}

/** Each slot of a session with its target, read from the user's logs. */
export function targetsForSession(
  plan: WeeklyWorkoutPlan,
  session: WorkoutSession,
  weekIndex: number,
  logs: readonly WorkoutLog[]
): SlotTarget[] {
  const slots = slotsForWeek(plan, session, weekIndex);
  return slots.map((slot) => ({
    slot,
    target: nextTarget(
      slot,
      historyForSlot(logs, slot.slotId),
      planSettings(plan),
      new Set(slots.filter((other) => other.slotId !== slot.slotId).map((other) => other.exerciseId))
    ),
  }));
}

export interface DraftExercise {
  slotId: string;
  exerciseId: string;
  restSec: number;
  sets: LoggedSet[];
}

/** A workout in progress: not saved until the user finishes and rates it. */
export interface WorkoutDraft {
  /** The date it is being done on: today, even for a missed session. */
  dateKey: string;
  day: WorkoutSession['day'];
  template: WorkoutSession['template'];
  startedAt: string;
  exercises: DraftExercise[];
}

/**
 * Set rows prefilled from each target (its reps, and its weight when there is
 * one), then the cardio block as one row of minutes.
 */
export function createDraft(
  session: WorkoutSession,
  targets: readonly SlotTarget[],
  todayKey: string,
  now: Date,
  cardio: CardioView | null = null
): WorkoutDraft {
  return {
    dateKey: todayKey,
    day: session.day,
    template: session.template,
    startedAt: now.toISOString(),
    exercises: [
      ...targets.map(({ slot, target }) => ({
        slotId: slot.slotId,
        exerciseId: target.exerciseId,
        restSec: slot.restSec,
        sets: Array.from({ length: target.sets }, () => ({
          reps: target.reps,
          ...(target.loadKg !== undefined ? { loadKg: target.loadKg } : {}),
          done: false,
        })),
      })),
      ...(cardio ? [{ slotId: cardio.slotId, exerciseId: cardio.exerciseId, restSec: 0, sets: [{ reps: cardio.minutes, done: false }] }] : []),
    ],
  };
}

function withExercise(draft: WorkoutDraft, index: number, update: (exercise: DraftExercise) => DraftExercise): WorkoutDraft {
  return { ...draft, exercises: draft.exercises.map((exercise, i) => (i === index ? update(exercise) : exercise)) };
}

/** New reps for one set. */
export function setReps(draft: WorkoutDraft, exerciseIndex: number, setIndex: number, reps: number): WorkoutDraft {
  return withExercise(draft, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, i) => (i === setIndex ? { ...set, reps: Math.max(0, Math.round(reps)) } : set)),
  }));
}

/**
 * A new weight for one set. Sets after it that are not ticked yet follow, so
 * picking the weight on set 1 fills in the rest.
 */
export function setLoad(draft: WorkoutDraft, exerciseIndex: number, setIndex: number, loadKg: number | undefined): WorkoutDraft {
  const value = loadKg === undefined || !(loadKg >= 0) ? undefined : Math.round(loadKg * 100) / 100;
  return withExercise(draft, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, i) => {
      if (i !== setIndex && (i < setIndex || set.done)) return set;
      const { loadKg: _old, ...rest } = set;
      return value === undefined ? rest : { ...rest, loadKg: value };
    }),
  }));
}

/** Ticks a set done, or unticks it. */
export function toggleSet(draft: WorkoutDraft, exerciseIndex: number, setIndex: number): WorkoutDraft {
  return withExercise(draft, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, i) => (i === setIndex ? { ...set, done: !set.done } : set)),
  }));
}

export interface DraftStats {
  /** Strength sets ticked; the cardio row is counted in minutes instead. */
  setsDone: number;
  /** Weight × reps over every ticked set that has a weight. */
  kgLifted: number;
  cardioMinutes: number;
}

export function draftStats(draft: WorkoutDraft): DraftStats {
  let setsDone = 0;
  let kgLifted = 0;
  let cardioMinutes = 0;
  for (const exercise of draft.exercises) {
    if (isCardioSlot(exercise.slotId)) {
      for (const set of exercise.sets) if (set.done) cardioMinutes += set.reps;
      continue;
    }
    for (const set of exercise.sets) {
      if (!set.done) continue;
      setsDone += 1;
      if (set.loadKg && getExercise(exercise.exerciseId)?.tracksLoad) kgLifted += set.loadKg * set.reps;
    }
  }
  return { setsDone, kgLifted: Math.round(kgLifted), cardioMinutes };
}

/** The saved record: every set as logged, ticked or not, with the rating. */
export function draftToLog(draft: WorkoutDraft, rating: SessionRating, finishedAt: Date): WorkoutLog {
  return {
    dateKey: draft.dateKey,
    day: draft.day,
    template: draft.template,
    exercises: draft.exercises.map(({ slotId, exerciseId, sets }) => ({ slotId, exerciseId, sets })),
    rating,
    startedAt: draft.startedAt,
    finishedAt: finishedAt.toISOString(),
  };
}

// The one workout in progress, kept in memory so leaving the screen (an edge
// swipe, the dashboard) doesn't lose it. It is dropped on save, on discard
// and on logout; it is never written to storage.
let activeDraft: WorkoutDraft | null = null;

export function getActiveDraft(): WorkoutDraft | null {
  return activeDraft;
}

export function setActiveDraft(draft: WorkoutDraft | null): void {
  activeDraft = draft;
}
