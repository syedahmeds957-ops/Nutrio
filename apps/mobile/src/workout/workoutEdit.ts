import type { LoggedSet, WorkoutLog } from '@nutrio/workout-core';
import { getExercise } from './core.js';
import type { DraftExercise, WorkoutDraft } from './workoutDraft.js';
import { isCardioSlot } from './weekView.js';
import { loggedAt } from './workoutLogStorage.js';

/**
 * Editing a finished workout. The saved log is reopened as a draft, the user
 * corrects what they did or adds to it, and saving replaces the same log
 * (same date and planned day) with a newer finish time so sync keeps the edit.
 * Everything here records what the user says they did; nothing prescribes.
 */

/** Slot ids of exercises the user added to a finished workout, which are not in the plan. */
const ADDED_PREFIX = 'extra:';

export const isAddedSlot = (slotId: string): boolean => slotId.startsWith(ADDED_PREFIX);

/** The exercise logged as a walk session: no equipment, always allowed. */
export const WALK_EXERCISE_ID = 'brisk-walk';

/** Longest walk the log accepts, in minutes. */
export const MAX_WALK_MINUTES = 600;

/**
 * A slot id for an added exercise, unique within the draft (the same move can
 * be added twice). Cardio moves end in `:cardio:n` like the plan's cardio
 * block, so they are logged and shown as minutes.
 */
function addedSlotId(draft: WorkoutDraft, exerciseId: string): string {
  const taken = new Set(draft.exercises.map((exercise) => exercise.slotId));
  const cardio = getExercise(exerciseId)?.pattern === 'cardio';
  const make = (n: number) => `${ADDED_PREFIX}${exerciseId}${cardio ? ':cardio' : ''}:${n}`;
  let n = 1;
  while (taken.has(make(n))) n += 1;
  return make(n);
}

const copySet = (set: LoggedSet): LoggedSet => ({ ...set });

/** The logged session as an editable draft: every set as saved, ticks included. */
export function draftFromLog(log: WorkoutLog): WorkoutDraft {
  return {
    dateKey: log.dateKey,
    day: log.day,
    template: log.template,
    startedAt: log.startedAt,
    exercises: log.exercises.map(
      (exercise): DraftExercise => ({
        slotId: exercise.slotId,
        exerciseId: exercise.exerciseId,
        restSec: 0,
        sets: exercise.sets.map(copySet),
      })
    ),
    editing: true,
  };
}

/** True once the draft differs from the saved log in any exercise or set. */
export function hasEdits(draft: WorkoutDraft, log: WorkoutLog): boolean {
  const shape = (exercises: readonly { slotId: string; exerciseId: string; sets: readonly LoggedSet[] }[]) =>
    JSON.stringify(
      exercises.map(({ slotId, exerciseId, sets }) => [
        slotId,
        exerciseId,
        sets.map((set) => [set.reps, set.loadKg ?? null, set.done]),
      ])
    );
  return shape(draft.exercises) !== shape(log.exercises);
}

/** Sets (or cardio minutes) ticked in the draft. A workout must keep at least one. */
export function loggedSetCount(draft: Pick<WorkoutDraft, 'exercises'>): number {
  return draft.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.done).length, 0);
}

/** An edit can be saved only while something is still logged as done. */
export const canSaveEdit = (draft: WorkoutDraft): boolean => loggedSetCount(draft) > 0;

/** An exercise from the catalogue added to the session, with one empty set row for the user to fill. */
export function addExercise(draft: WorkoutDraft, exerciseId: string): WorkoutDraft {
  return {
    ...draft,
    exercises: [...draft.exercises, { slotId: addedSlotId(draft, exerciseId), exerciseId, restSec: 0, sets: [{ reps: 0, done: false }] }],
  };
}

/** Several catalogue exercises added in one go, each with its empty row. */
export function addExercises(draft: WorkoutDraft, exerciseIds: readonly string[]): WorkoutDraft {
  return exerciseIds.reduce(addExercise, draft);
}

/**
 * A walk session the user did, logged as minutes of cardio and ticked done.
 * Minutes are required (a whole number from 1 up); anything else leaves the draft as it was.
 */
export function addWalk(draft: WorkoutDraft, minutes: number): WorkoutDraft {
  if (!Number.isFinite(minutes) || minutes < 1) return draft;
  const reps = Math.min(MAX_WALK_MINUTES, Math.round(minutes));
  const added = addExercise(draft, WALK_EXERCISE_ID);
  const walk = added.exercises[added.exercises.length - 1];
  return { ...added, exercises: [...added.exercises.slice(0, -1), { ...walk, sets: [{ reps, done: true }] }] };
}

/** One more set on an exercise, starting from the last set's numbers and not yet ticked. */
export function addSet(draft: WorkoutDraft, exerciseIndex: number): WorkoutDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, i) => {
      if (i !== exerciseIndex) return exercise;
      const last = exercise.sets[exercise.sets.length - 1];
      return { ...exercise, sets: [...exercise.sets, { ...(last ?? { reps: 0 }), done: false }] };
    }),
  };
}

/** Takes one set out; an exercise left with no sets leaves the log. */
export function removeSet(draft: WorkoutDraft, exerciseIndex: number, setIndex: number): WorkoutDraft {
  return {
    ...draft,
    exercises: draft.exercises
      .map((exercise, i) => (i === exerciseIndex ? { ...exercise, sets: exercise.sets.filter((_, s) => s !== setIndex) } : exercise))
      .filter((exercise) => exercise.sets.length > 0),
  };
}

/** Whether a draft exercise is the session's cardio block (one row of minutes). */
export const isCardioEntry = (exercise: Pick<DraftExercise, 'slotId'>): boolean => isCardioSlot(exercise.slotId);

/**
 * The saved log after an edit. Same date, planned day, start time and rating
 * as before, so it replaces the original everywhere; `finishedAt` is the edit
 * time, always later than the log's last save, so the cloud merge (newest
 * finish wins) and progression treat it as the current version.
 */
export function editedLog(draft: WorkoutDraft, original: WorkoutLog, now: Date): WorkoutLog {
  const before = Date.parse(loggedAt(original)) || 0;
  const finishedAt = new Date(Math.max(now.getTime(), before + 1000)).toISOString();
  const { finishedAt: _old, ...rest } = original;
  return {
    ...rest,
    exercises: draft.exercises
      .filter((exercise) => exercise.sets.length > 0)
      .map(({ slotId, exerciseId, sets }) => ({ slotId, exerciseId, sets: sets.map(copySet) })),
    finishedAt,
  };
}
