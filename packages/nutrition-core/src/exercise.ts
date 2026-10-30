/** The survey's answer for how someone trains now. */
export type TrainingType =
  | 'none'
  | 'gym_resistance'
  | 'cardio_running'
  | 'home_calisthenics'
  | 'sports_cricket_football'
  | 'daily_brisk_walking';

export type WorkoutIntensity = 'light' | 'moderate' | 'high';

/** Rough energy cost of each kind of training, kcal per minute. */
export const EXERCISE_KCAL_PER_MIN: Record<TrainingType, number> = {
  gym_resistance: 6.5,
  cardio_running: 10.0,
  sports_cricket_football: 8.0,
  home_calisthenics: 5.5,
  daily_brisk_walking: 4.0,
  none: 0,
};

/** The survey's exercise answers as kcal per week; this is what the onboarding TDEE counts. */
export function estimateWeeklyExerciseKcal(
  trainingType: TrainingType,
  frequencyDaysPerWeek: number,
  sessionDurationMins: number,
  intensity: WorkoutIntensity
): number {
  if (trainingType === 'none' || frequencyDaysPerWeek === 0) return 0;

  const kcalPerMin = EXERCISE_KCAL_PER_MIN[trainingType] ?? 5.0;

  const intensityMultiplier =
    intensity === 'light' ? 0.8 : intensity === 'high' ? 1.25 : 1.0;

  const kcalPerSession = sessionDurationMins * kcalPerMin * intensityMultiplier;
  return Math.round(kcalPerSession * frequencyDaysPerWeek);
}

/**
 * How a stretch of a planned workout is counted:
 * - resistance: gym weights
 * - bodyweight: home training
 * - conditioning: intervals and moderate cardio
 * - walking: easy cardio
 */
export type WorkoutSegmentStyle = 'resistance' | 'bodyweight' | 'conditioning' | 'walking';

const SEGMENT_KCAL_PER_MIN: Record<WorkoutSegmentStyle, number> = {
  resistance: EXERCISE_KCAL_PER_MIN.gym_resistance,
  bodyweight: EXERCISE_KCAL_PER_MIN.home_calisthenics,
  conditioning: EXERCISE_KCAL_PER_MIN.sports_cricket_football,
  walking: EXERCISE_KCAL_PER_MIN.daily_brisk_walking,
};

/**
 * A workout plan's weekly kcal, from the minutes of each part of each session.
 * Takes plain numbers so this package never depends on the workout engine.
 */
export function estimateWorkoutPlanWeeklyKcal(
  segments: readonly { minutes: number; style: WorkoutSegmentStyle }[]
): number {
  const total = segments.reduce(
    (sum, segment) => sum + Math.max(0, segment.minutes) * SEGMENT_KCAL_PER_MIN[segment.style],
    0
  );
  return Math.round(total);
}

/**
 * The TDEE with one weekly training estimate swapped for another. The old
 * estimate is taken out rather than the new one added on top, so saving the
 * same plan twice never counts it twice.
 */
export function adjustTdeeForTraining(
  tdee: number,
  countedWeeklyKcal: number,
  nextWeeklyKcal: number
): number {
  return tdee + Math.round((nextWeeklyKcal - countedWeeklyKcal) / 7);
}
