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
  /** Jumping. Left out of Ramadan and low-intensity plans. */
  highImpact: boolean;
  /** False for bodyweight, band and timed work: there is no weight to log. */
  tracksLoad: boolean;
  /** Bodyweight ladder: the next harder exercise of the same pattern. */
  harder?: string;
  easier?: string;
}

// ----- Plans -----

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
  /** Only read for 'home_equipment'. Bodyweight is always available. */
  homeEquipment: Equipment[];
  /** Home dumbbells owned, for progression; empty means adjustable or unknown. */
  dumbbellWeightsKg: number[];
  /** 2 to 6 distinct days. */
  trainingDays: Weekday[];
  sessionMinutes: SessionMinutes;
  focus: FocusArea[];
  protectedJoints: JointLoad[];
  /** Set from pregnancy or hypertension answers: gentler effort, no jumping. */
  lowIntensity: boolean;
  ramadan: { enabled: boolean; slot?: RamadanSlot };
}

export interface Prescription {
  sets: number;
  repMin: number;
  repMax: number;
  /** 'seconds' for planks and other timed holds. */
  unit: 'reps' | 'seconds';
  restSec: number;
  /** Reps in reserve: stop with this many left. 1 is shown as "1–2". */
  targetRir: number;
}

export type SlotRole = 'main' | 'accessory';

export interface PlannedSlot extends Prescription {
  /** Stable across regenerations, e.g. 'upper-a:horizontal_push:0'. */
  slotId: string;
  /** The pattern of the chosen exercise (a fallback pattern when the planned one had no options). */
  pattern: MovementPattern;
  role: SlotRole;
  exerciseId: string;
  /** Accessories rotate through these every 4 weeks. Never overlaps another slot in the session. */
  alternates: string[];
}

export type SessionTemplateId = 'full_a' | 'full_b' | 'full_c' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';
export type SplitId =
  | 'full_body_2'
  | 'full_body_3'
  | 'full_body_4'
  | 'full_body_5'
  | 'full_body_6'
  | 'ppl_3'
  | 'upper_lower_4'
  | 'upper_lower_ppl_5'
  | 'ppl_6';

export interface Finisher {
  exerciseIds: string[];
  workSec: number;
  restSec: number;
  rounds: number;
}

export interface WorkoutSession {
  day: Weekday;
  template: SessionTemplateId;
  /** 'a' or 'b' when a template appears twice in the week (Upper body A / B). */
  variant: 'a' | 'b' | null;
  slots: PlannedSlot[];
  finisher?: Finisher;
  estimatedMinutes: number;
}

export interface WeeklyWorkoutPlan {
  version: 1;
  createdAt: string;
  /** Date key (YYYY-MM-DD); week numbers count from here. */
  blockStart: string;
  seed: number;
  settings: WorkoutSettings;
  split: SplitId;
  sessions: WorkoutSession[];
  /** slotId -> exerciseId chosen by the user or a confirmed coach swap. */
  swaps: Record<string, string>;
}
