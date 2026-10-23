import type { Equipment, FocusArea, JointLoad, Weekday, WorkoutSettings } from '@nutrio/workout-core';

/**
 * The workout setup's rules, kept out of the screen so they can be tested
 * without rendering: what each step needs before Next works, and how each
 * answer changes the settings.
 */

export type SetupStep = 1 | 2 | 3;
export const SETUP_STEPS = 3;

export const MIN_TRAINING_DAYS = 2;
export const MAX_TRAINING_DAYS = 6;

/** Dumbbell weights offered at setup; 0 stands for "adjustable". */
export const DUMBBELL_CHOICES_KG: readonly number[] = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 30, 0];

export function canContinue(step: SetupStep, settings: WorkoutSettings): boolean {
  if (step < 3) return true;
  return settings.trainingDays.length >= MIN_TRAINING_DAYS && settings.trainingDays.length <= MAX_TRAINING_DAYS;
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
  return {
    ...settings,
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
