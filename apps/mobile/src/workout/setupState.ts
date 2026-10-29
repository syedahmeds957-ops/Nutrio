import type {
  CurrentLift,
  Equipment,
  ImportedRoutine,
  RamadanSlot,
  FocusArea,
  JointLoad,
  SportKind,
  TrainingProfile,
  Weekday,
  WorkoutSettings,
} from '@nutrio/workout-core';
import { getExercise, isAllowed } from './core.js';

/**
 * The workout setup's rules, kept out of the screen so they can be tested
 * without rendering: what each step needs before Next works, and how each
 * answer changes the settings.
 */

/** Steps 1–3 are the plan; 4–6 are the optional "Tell us more". */
export type SetupStep = 1 | 2 | 3 | 4 | 5 | 6;
export const SETUP_STEPS = 3;
export const MORE_STEPS = 3;
export const LAST_STEP: SetupStep = 6;
/** Setup and "Tell us more" are one flow, counted as one: "Step 4 of 6". */
export const TOTAL_STEPS = SETUP_STEPS + MORE_STEPS;

/** The one step counter for the whole wizard; steps past the plan are the optional ones. */
export function stepProgress(step: SetupStep): { current: number; total: number; optional: boolean } {
  return { current: step, total: TOTAL_STEPS, optional: step > SETUP_STEPS };
}

/** Beginners get simple checks; anyone with some experience is asked about their training. */
export function isBeginner(settings: WorkoutSettings): boolean {
  return settings.experience === 'new';
}

export const MIN_TRAINING_DAYS = 2;
export const MAX_TRAINING_DAYS = 6;

/** Dumbbell weights offered at setup; 0 stands for "adjustable". */
export const DUMBBELL_CHOICES_KG: readonly number[] = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 30, 0];

/** Why Continue is off on a step, so the screen can say it; null when it is on. */
export function continueBlocker(step: SetupStep, settings: WorkoutSettings): 'days' | null {
  if (step !== 3) return null;
  const count = settings.trainingDays.length;
  return count >= MIN_TRAINING_DAYS && count <= MAX_TRAINING_DAYS ? null : 'days';
}

export function canContinue(step: SetupStep, settings: WorkoutSettings): boolean {
  return continueBlocker(step, settings) === null;
}

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** A seventh day is ignored rather than allowed: the plans go up to six. */
export function toggleDay(settings: WorkoutSettings, day: Weekday): WorkoutSettings {
  const selected = settings.trainingDays.includes(day);
  if (!selected && settings.trainingDays.length >= MAX_TRAINING_DAYS) return settings;
  return { ...settings, trainingDays: toggle(settings.trainingDays, day) };
}

export function toggleEquipment(settings: WorkoutSettings, item: Equipment): WorkoutSettings {
  const homeEquipment = toggle(settings.homeEquipment, item);
  // Dumbbell weights only mean something while dumbbells are selected.
  const dumbbellWeightsKg = homeEquipment.includes('dumbbell') ? settings.dumbbellWeightsKg : [];
  return { ...settings, homeEquipment, dumbbellWeightsKg };
}

/** Adjustable dumbbells (0) and fixed weights are kept apart in storage: adjustable means "any weight". */
export function toggleDumbbell(settings: WorkoutSettings, kg: number): WorkoutSettings {
  return { ...settings, dumbbellWeightsKg: toggle(settings.dumbbellWeightsKg, kg).sort((a, b) => a - b) };
}

export function toggleFocus(settings: WorkoutSettings, area: FocusArea): WorkoutSettings {
  return { ...settings, focus: toggle(settings.focus, area) };
}

export function toggleProtected(settings: WorkoutSettings, joint: JointLoad): WorkoutSettings {
  return { ...settings, protectedJoints: toggle(settings.protectedJoints, joint) };
}

/**
 * What the generator receives: home equipment only counts at home with
 * equipment, and "adjustable" is stored as no fixed weights at all.
 */
export function settingsForSave(settings: WorkoutSettings): WorkoutSettings {
  const atHomeWithEquipment = settings.location === 'home_equipment';
  const { profile: _profile, ...rest } = settings;
  const profile = profileForSave(settings);
  // A routine the user follows sets the training days.
  const trainingDays = profile?.routine ? profile.routine.days.map((d) => d.day) : settings.trainingDays;
  return {
    ...rest,
    trainingDays,
    ...(profile ? { profile } : {}),
    homeEquipment: atHomeWithEquipment ? settings.homeEquipment : [],
    dumbbellWeightsKg:
      atHomeWithEquipment && settings.homeEquipment.includes('dumbbell')
        ? settings.dumbbellWeightsKg.filter((kg) => kg > 0)
        : [],
  };
}

/** The reverse of settingsForSave: a saved plan with dumbbells but no fixed weights had "adjustable" picked. */
export function settingsForEdit(settings: WorkoutSettings): WorkoutSettings {
  const adjustable = settings.homeEquipment.includes('dumbbell') && settings.dumbbellWeightsKg.length === 0;
  return { ...settings, dumbbellWeightsKg: adjustable ? [0] : settings.dumbbellWeightsKg };
}

// ----- "Tell us more" -----

const profileOf = (settings: WorkoutSettings): TrainingProfile => settings.profile ?? {};

export function updateProfile(settings: WorkoutSettings, patch: Partial<TrainingProfile>): WorkoutSettings {
  return { ...settings, profile: { ...profileOf(settings), ...patch } };
}

export function setTrainingNow(settings: WorkoutSettings, patch: Partial<NonNullable<TrainingProfile['trainingNow']>>): WorkoutSettings {
  const current = profileOf(settings).trainingNow ?? { active: true };
  return updateProfile(settings, { trainingNow: { ...current, ...patch } });
}

/** The lifts asked about by default: main lifts the user's equipment allows. */
export function defaultLiftIds(settings: WorkoutSettings): string[] {
  const byLocation: Record<WorkoutSettings['location'], string[]> = {
    gym: ['barbell-bench-press', 'barbell-squat', 'wide-grip-lat-pulldown', 'dumbbell-shoulder-press'],
    home_equipment: ['dumbbell-bench-press', 'goblet-squat', 'one-arm-dumbbell-row', 'push-up'],
    home_none: ['push-up', 'bodyweight-squat', 'pull-up'],
  };
  return byLocation[settings.location].filter((id) => {
    const exercise = getExercise(id);
    return exercise ? isAllowed(exercise, settings) : false;
  });
}

/** Every lift row to show: the defaults, then any the user added. */
export function liftRows(settings: WorkoutSettings): string[] {
  const added = (profileOf(settings).lifts ?? []).map((lift) => lift.exerciseId);
  return [...new Set([...defaultLiftIds(settings), ...added])];
}

export function liftOf(settings: WorkoutSettings, exerciseId: string): CurrentLift | undefined {
  return profileOf(settings).lifts?.find((lift) => lift.exerciseId === exerciseId);
}

/** Sets a lift's weight or reps; a row left empty is kept so an added lift doesn't vanish while typing. */
export function setLift(settings: WorkoutSettings, exerciseId: string, patch: Partial<Omit<CurrentLift, 'exerciseId'>>): WorkoutSettings {
  const lifts = profileOf(settings).lifts ?? [];
  const current = lifts.find((lift) => lift.exerciseId === exerciseId) ?? { exerciseId, reps: 0 };
  const next = { ...current, ...patch };
  if (next.loadKg === undefined) delete next.loadKg;
  return updateProfile(settings, { lifts: [...lifts.filter((lift) => lift.exerciseId !== exerciseId), next] });
}

/** A like and a dislike cancel each other: adding to one list removes from the other. */
export function toggleExercisePreference(settings: WorkoutSettings, list: 'likes' | 'dislikes', exerciseId: string): WorkoutSettings {
  const profile = profileOf(settings);
  const other = list === 'likes' ? 'dislikes' : 'likes';
  const current = profile[list] ?? [];
  const next = current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId];
  return updateProfile(settings, { [list]: next, [other]: (profile[other] ?? []).filter((id) => id !== exerciseId) });
}

export function toggleSport(settings: WorkoutSettings, kind: SportKind): WorkoutSettings {
  const sports = profileOf(settings).sports ?? [];
  const has = sports.some((sport) => sport.kind === kind);
  return updateProfile(settings, { sports: has ? sports.filter((sport) => sport.kind !== kind) : [...sports, { kind, days: [] }] });
}

export function toggleSportDay(settings: WorkoutSettings, kind: SportKind, day: Weekday): WorkoutSettings {
  const sports = (profileOf(settings).sports ?? []).map((sport) =>
    sport.kind === kind ? { ...sport, days: toggle(sport.days, day) } : sport
  );
  return updateProfile(settings, { sports });
}

/**
 * The profile as saved: answers that belong to the other experience branch
 * are dropped (a beginner's push-up check is not kept for someone who then
 * said they train), empty lists and blank lifts go, and an empty profile is
 * removed altogether.
 */
export function profileForSave(settings: WorkoutSettings): TrainingProfile | undefined {
  const p = settings.profile;
  if (!p) return undefined;
  const beginner = isBeginner(settings);
  const lifts = (p.lifts ?? []).filter((lift) => lift.reps > 0 && getExercise(lift.exerciseId));
  const sports = (p.sports ?? []).filter((sport) => sport.days.length > 0);
  const out: TrainingProfile = {
    ...(!beginner && p.trainingNow ? { trainingNow: p.trainingNow } : {}),
    ...(beginner && p.background ? { background: p.background } : {}),
    ...(beginner && p.ability ? { ability: p.ability } : {}),
    ...(!beginner && lifts.length ? { lifts } : {}),
    ...(!beginner && p.routine && routineReady(p.routine) ? { routine: p.routine } : {}),
    ...(p.cardio && (p.cardio.habit || p.cardio.likes.length) ? { cardio: p.cardio } : {}),
    ...(p.likes?.length ? { likes: p.likes } : {}),
    ...(p.dislikes?.length ? { dislikes: p.dislikes } : {}),
    ...(p.avoidJumping ? { avoidJumping: true } : {}),
    ...(sports.length ? { sports } : {}),
    // Straight sets are the default, so only supersets are kept; beginners are never asked.
    ...(!beginner && p.sessionStyle === 'supersets' ? { sessionStyle: 'supersets' as const } : {}),
  };
  return Object.keys(out).length ? out : undefined;
}

// ----- The routine builder -----

const WEEK_ORDER: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function routineOf(settings: WorkoutSettings): ImportedRoutine {
  return profileOf(settings).routine ?? { days: settings.trainingDays.map((day) => ({ day, exercises: [] })) };
}

function withRoutine(settings: WorkoutSettings, routine: ImportedRoutine): WorkoutSettings {
  const days = [...routine.days].sort((a, b) => WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day));
  return updateProfile(settings, { routine: { days } });
}

/** A routine is ready to improve with 2–6 training days, each with at least one exercise. */
export function routineReady(routine: ImportedRoutine): boolean {
  return routine.days.length >= MIN_TRAINING_DAYS && routine.days.length <= MAX_TRAINING_DAYS && routine.days.every((d) => d.exercises.length > 0);
}

export function toggleRoutineDay(settings: WorkoutSettings, day: Weekday): WorkoutSettings {
  const routine = routineOf(settings);
  const has = routine.days.some((d) => d.day === day);
  if (!has && routine.days.length >= MAX_TRAINING_DAYS) return settings;
  return withRoutine(settings, { days: has ? routine.days.filter((d) => d.day !== day) : [...routine.days, { day, exercises: [] }] });
}

function editDay(settings: WorkoutSettings, day: Weekday, edit: (exercises: ImportedRoutine['days'][number]['exercises']) => ImportedRoutine['days'][number]['exercises']): WorkoutSettings {
  const routine = routineOf(settings);
  return withRoutine(settings, { days: routine.days.map((d) => (d.day === day ? { ...d, exercises: edit(d.exercises) } : d)) });
}

/** Adds an exercise to a day once; entering the same move twice in a day means nothing new. */
export function addRoutineExercise(settings: WorkoutSettings, day: Weekday, exerciseId: string): WorkoutSettings {
  return editDay(settings, day, (list) => (list.some((e) => e.exerciseId === exerciseId) ? list : [...list, { exerciseId, sets: 3 }]));
}

export function removeRoutineExercise(settings: WorkoutSettings, day: Weekday, index: number): WorkoutSettings {
  return editDay(settings, day, (list) => list.filter((_, i) => i !== index));
}

export function moveRoutineExercise(settings: WorkoutSettings, day: Weekday, index: number, direction: -1 | 1): WorkoutSettings {
  return editDay(settings, day, (list) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
}

export function setRoutineExercise(settings: WorkoutSettings, day: Weekday, index: number, patch: { sets?: number; reps?: number }): WorkoutSettings {
  return editDay(settings, day, (list) => list.map((e, i) => (i === index ? { ...e, ...patch } : e)));
}

export function clearRoutine(settings: WorkoutSettings): WorkoutSettings {
  const { routine: _routine, ...profile } = profileOf(settings);
  return { ...settings, profile };
}

// ----- Ramadan mode -----

/** Before iftar is where the approved design starts; the user can change it. */
const DEFAULT_RAMADAN_SLOT: RamadanSlot = 'before_iftar';

/** Switching on keeps the timing picked last time, or starts before iftar. */
export function toggleRamadan(settings: WorkoutSettings): WorkoutSettings {
  const enabled = !settings.ramadan.enabled;
  return { ...settings, ramadan: { enabled, slot: settings.ramadan.slot ?? DEFAULT_RAMADAN_SLOT } };
}

export function setRamadanSlot(settings: WorkoutSettings, slot: RamadanSlot): WorkoutSettings {
  return { ...settings, ramadan: { enabled: true, slot } };
}
