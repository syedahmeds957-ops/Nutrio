import { EXERCISE_DATA } from './data/exercises.data.js';
import { Equipment, Exercise, ExerciseLevel, JointLoad, MovementPattern } from './types.js';

export const EXERCISES: readonly Exercise[] = EXERCISE_DATA;

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export interface ExerciseFilter {
  pattern?: MovementPattern;
  /** What the user has. Bodyweight is always available. */
  equipment?: readonly Equipment[];
  /** 'beginner' keeps intermediate exercises out. */
  maxLevel?: ExerciseLevel;
  excludeJoints?: readonly JointLoad[];
}

/** Exercises a user can do: every required item available, no protected joint loaded. */
export function exercisesFor(filter: ExerciseFilter): Exercise[] {
  const available = filter.equipment ? new Set<Equipment>(['bodyweight', ...filter.equipment]) : null;
  return EXERCISES.filter((exercise) => {
    if (filter.pattern && exercise.pattern !== filter.pattern) return false;
    if (available && !exercise.equipment.every((item) => available.has(item))) return false;
    if (filter.maxLevel === 'beginner' && exercise.level !== 'beginner') return false;
    if (filter.excludeJoints?.some((joint) => exercise.jointLoads.includes(joint))) return false;
    return true;
  });
}
