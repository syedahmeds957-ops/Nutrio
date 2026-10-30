import type { SessionMinutes, TrainingProfile, Weekday, WorkoutGoal, WorkoutSettings } from '@nutrio/workout-core';
import type { GoalType } from '@nutrio/nutrition-core';
import type { LifestyleSurveyPayload } from '../survey/types.js';
import type { ComputedUserPlan } from '../plan/types.js';

const GOAL_FOR_PLAN: Record<GoalType, WorkoutGoal> = {
  lose: 'fat_loss',
  gain: 'muscle',
  maintain: 'general',
};

/** Training days spread through the week for each count, so rest days fall between sessions. */
const DAY_PATTERNS: Record<number, Weekday[]> = {
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'fri'],
  5: ['mon', 'tue', 'wed', 'thu', 'fri'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

const SESSION_LENGTHS: readonly SessionMinutes[] = [20, 30, 45, 60, 75];
const DEFAULT_DAYS = 3;
const DEFAULT_MINUTES: SessionMinutes = 45;

export function daysForCount(count: number): Weekday[] {
  return DAY_PATTERNS[Math.min(6, Math.max(2, Math.round(count)))];
}

function nearestSessionLength(minutes: number | undefined): SessionMinutes {
  if (!minutes || minutes <= 0) return DEFAULT_MINUTES;
  return SESSION_LENGTHS.reduce((best, length) => (Math.abs(length - minutes) < Math.abs(best - minutes) ? length : best));
}

/**
 * What "Tell us more" would otherwise ask again: whether they train now and how
 * many days (when the survey said they do), or that they have not trained
 * (when it said they do not). Only what the survey already answered.
 */
function profileFromSurvey(survey: LifestyleSurveyPayload | null | undefined, experience: WorkoutSettings['experience']): TrainingProfile | undefined {
  const exercise = survey?.exercise;
  if (!exercise) return undefined;
  if (exercise.trainingType === 'none') return { background: 'never' };
  if (experience === 'new') return undefined;
  const days = exercise.frequencyDaysPerWeek > 0 ? Math.min(6, Math.max(1, Math.round(exercise.frequencyDaysPerWeek))) : undefined;
  return { trainingNow: { active: true, ...(days ? { daysPerWeek: days } : {}) } };
}

/**
 * The workout setup's starting answers, from what the user already told us,
 * so setup is mostly a confirmation. Only safe inferences: a gym-goer trains
 * at the gym, a light or non-exerciser is new; nobody is assumed experienced.
 */
export function defaultWorkoutSettings({
  survey,
  plan,
}: {
  survey?: LifestyleSurveyPayload | null;
  plan?: ComputedUserPlan | null;
}): WorkoutSettings {
  const exercise = survey?.exercise;
  const health = survey?.healthClinical;
  const trains = exercise && exercise.trainingType !== 'none';

  const experience: WorkoutSettings['experience'] = !trains || exercise.intensity === 'light' ? 'new' : 'some';
  const profile = profileFromSurvey(survey, experience);

  return {
    goal: plan ? GOAL_FOR_PLAN[plan.goalSelection.goal] : 'general',
    experience,
    location: exercise?.trainingType === 'gym_resistance' ? 'gym' : 'home_none',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: daysForCount(trains && exercise.frequencyDaysPerWeek > 0 ? exercise.frequencyDaysPerWeek : DEFAULT_DAYS),
    sessionMinutes: trains ? nearestSessionLength(exercise.sessionDurationMins) : DEFAULT_MINUTES,
    focus: [],
    protectedJoints: [],
    lowIntensity: Boolean(health?.isPregnantOrBreastfeeding || health?.medicalConditions.includes('hypertension')),
    ramadan: { enabled: false },
    ...(profile ? { profile } : {}),
  };
}
