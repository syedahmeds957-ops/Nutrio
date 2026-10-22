/** What an exercise needs. An exercise lists every item it requires. */
export type Equipment =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'kettlebell'
  | 'bands'
  | 'cable'
  | 'machine'
  | 'bench'
  | 'pullup_bar'
  | 'ez_bar';

/**
 * The slot an exercise fills in a session. Plans are built from patterns, not
 * named exercises, so any exercise of the right pattern and equipment can fill
 * a slot or replace another in a swap.
 */
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'core'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'calves'
  | 'shoulders_iso'
  | 'conditioning';

/** A joint a user can ask to protect; exercises that load it are left out. */
export type JointLoad = 'knee' | 'lower_back' | 'shoulder' | 'wrist';

/** Expert-level exercises from the source are never included. */
export type ExerciseLevel = 'beginner' | 'intermediate';

/** Muscle names as the source dataset spells them; display names live in muscles.ts. */
export type Muscle =
  | 'abdominals'
  | 'abductors'
  | 'adductors'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'forearms'
  | 'glutes'
  | 'hamstrings'
  | 'lats'
  | 'lower back'
  | 'middle back'
  | 'neck'
  | 'quadriceps'
  | 'shoulders'
  | 'traps'
  | 'triceps';

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface Exercise {
  /** Our stable kebab-case id, e.g. 'goblet-squat'. */
  id: string;
  /** free-exercise-db id, kept for attribution and re-runs. */
  sourceId: string;
  name: LocalizedText;
  instructions: { en: string[]; ar: string[] };
  pattern: MovementPattern;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  level: ExerciseLevel;
  compound: boolean;
  jointLoads: JointLoad[];
  /** Held or done for time (planks, conditioning) rather than counted in reps. */
  timed: boolean;
  /** False for bodyweight, band and timed work: there is no weight to log. */
  tracksLoad: boolean;
  /** Bodyweight ladder: the next harder exercise of the same pattern. */
  harder?: string;
  easier?: string;
}
