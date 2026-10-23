import { EXERCISES } from './catalogue.js';
import { capsApply } from './prescription.js';
import { hashString, isAllowed } from './select.js';
import { CardioIntensity, Exercise, SessionMinutes, WorkoutSettings } from './types.js';

/** Minutes of cardio at the end of a session, by goal and session length (inside that length). */
const CARDIO_MINUTES: Record<WorkoutSettings['goal'], Record<SessionMinutes, number>> = {
  fat_loss: { 20: 8, 30: 10, 45: 15, 60: 20, 75: 20 },
  general: { 20: 5, 30: 8, 45: 10, 60: 15, 75: 15 },
  muscle: { 20: 5, 30: 5, 45: 8, 60: 10, 75: 10 },
  strength: { 20: 5, 30: 5, 45: 8, 60: 10, 75: 10 },
};
/** While fasting, cardio stays short and easy (phase 7 adds the rest of Ramadan mode). */
const RAMADAN_MAX_MINUTES = 10;
/** Pregnancy or high blood pressure: walking only. */
const WALKING = new Set(['brisk-walk', 'treadmill-walk']);

export const REST_DAY_WALK = { minMinutes: 20, maxMinutes: 30 } as const;

export function cardioMinutes(settings: WorkoutSettings): number {
  const minutes = CARDIO_MINUTES[settings.goal][settings.sessionMinutes];
  return settings.ramadan.enabled ? Math.min(minutes, RAMADAN_MAX_MINUTES) : minutes;
}

/** Moderate ("you can talk in short sentences") for fat loss and general fitness; easy otherwise. */
export function cardioIntensity(settings: WorkoutSettings): CardioIntensity {
  const capped = capsApply({ ramadan: settings.ramadan.enabled, lowIntensity: settings.lowIntensity });
  if (capped || settings.experience === 'new') return 'easy';
  return settings.goal === 'fat_loss' || settings.goal === 'general' ? 'moderate' : 'easy';
}

/** Whether the 30 s on / 30 s off interval moves are offered as a cardio choice. */
function intervalsAllowed(settings: WorkoutSettings): boolean {
  const capped = capsApply({ ramadan: settings.ramadan.enabled, lowIntensity: settings.lowIntensity });
  return (settings.goal === 'fat_loss' || settings.goal === 'general') && settings.experience !== 'new' && !capped;
}

/**
 * Every cardio move this user can do, best first: machines in a gym, no
 * equipment at home, then intervals where they suit. `key` varies the order
 * per session so the week isn't the same treadmill five times.
 */
export function cardioPool(settings: WorkoutSettings, seed = 0, key = ''): Exercise[] {
  const steady = EXERCISES.filter(
    (e) => e.pattern === 'cardio' && isAllowed(e, settings) && (!settings.lowIntensity || WALKING.has(e.id))
  );
  const intervals = intervalsAllowed(settings) ? EXERCISES.filter((e) => e.pattern === 'conditioning' && isAllowed(e, settings)) : [];
  const atGym = settings.location === 'gym';
  const rank = (e: Exercise) => (atGym === e.equipment.includes('machine') ? 0 : 1);
  const byPreference = (a: Exercise, b: Exercise) =>
    rank(a) - rank(b) || hashString(`${seed}:${key}:${a.id}`) - hashString(`${seed}:${key}:${b.id}`);
  return [...steady.sort(byPreference), ...intervals.sort((a, b) => a.name.en.localeCompare(b.name.en))];
}
