import { generateWeeklyPlan, type Weekday, type WeeklyWorkoutPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { addDaysToKey } from '../common/dateKey.js';
import { weekdayOf } from './weekView.js';

/** Any fixed number: the same date always shows a guest the same sample. */
const SAMPLE_SEED = 20261025;
const WEEK_ORDER: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Three days a week with a rest day between each, starting today, so today always has a session. */
export function sampleDays(todayKey: string): Weekday[] {
  return [0, 2, 4].map((offset) => weekdayOf(addDaysToKey(todayKey, offset))).sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));
}

/**
 * What a guest sees in Workouts: a beginner home plan with no equipment,
 * built by the same generator as a real plan. It is never saved; guests need
 * an account to make a plan of their own or log anything.
 */
export function samplePlan(todayKey: string): WeeklyWorkoutPlan {
  const settings: WorkoutSettings = {
    goal: 'general',
    experience: 'new',
    location: 'home_none',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: sampleDays(todayKey),
    sessionMinutes: 45,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: false },
  };
  return generateWeeklyPlan(settings, { seed: SAMPLE_SEED, today: todayKey, now: `${todayKey}T00:00:00.000Z` });
}
