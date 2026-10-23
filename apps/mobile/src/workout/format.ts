import type { TFunction } from 'i18next';
import type { Exercise, LoggedSet, Prescription, Target } from '@nutrio/workout-core';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

/** "8–12", or "30–45 s" for timed holds. */
export function repsText(t: TFunction, p: Pick<Prescription, 'repMin' | 'repMax' | 'unit'>): string {
  return t(p.unit === 'seconds' ? 'workout.format.seconds' : 'workout.format.reps', { min: p.repMin, max: p.repMax });
}

/** The compact line on an exercise row: "3 × 8–12 · 90 s rest". */
export function prescriptionText(t: TFunction, p: Prescription): string {
  return t('workout.format.presc', { sets: p.sets, reps: repsText(t, p), rest: p.restSec });
}

/** "3 sets × 8–12", for the today list where the rest goes on its own line. */
export function setsRepsText(t: TFunction, p: Prescription): string {
  return t('workout.format.setsReps', { count: p.sets, reps: repsText(t, p) });
}

export function restText(t: TFunction, p: Pick<Prescription, 'restSec'>): string {
  return t('workout.format.restBetween', { rest: p.restSec });
}

/** How hard to push: "Stop with 2 reps left". Holds get a form cue instead. */
export function effortText(t: TFunction, p: Pick<Prescription, 'targetRir' | 'unit'>): string {
  if (p.unit === 'seconds') return t('workout.format.hold');
  return p.targetRir === 1 ? t('workout.format.rirOne') : t('workout.format.rir', { count: p.targetRir });
}

export function monthName(t: TFunction, month: number): string {
  return t(`workout.months.${MONTH_KEYS[month]}`);
}

/** "Thu 22 Oct" / "الخميس 22 أكتوبر". */
export function dateText(t: TFunction, weekday: string, dayOfMonth: number, month: number): string {
  return t('workout.format.date', { weekday: t(`workout.days.${weekday}`), day: dayOfMonth, month: monthName(t, month) });
}

/** "62.5", "60", "2.25": weights without trailing zeros. */
export function kgNumber(kg: number): string {
  return String(Math.round(kg * 100) / 100);
}

/** The target line: "62.5 kg × 8–12", "— kg × 8–12" when the user picks the weight, "Bodyweight × 8–12". */
export function targetText(t: TFunction, target: Target, unit: Prescription['unit'], tracksLoad: boolean): string {
  const reps = repsText(t, { repMin: target.repMin, repMax: target.repMax, unit });
  if (!tracksLoad) return t('workout.target.bodyweight', { reps });
  if (target.loadKg === undefined) return t('workout.target.pickWeight', { reps });
  return t('workout.target.load', { kg: kgNumber(target.loadKg), reps });
}

/** The one-line reason under a target, in the user's language. */
export function reasonText(t: TFunction, target: Target, tracksLoad: boolean): string {
  const params = { ...target.reasonParams, reps: target.reasonParams?.reps ?? target.repMax };
  const bodyweightVariant = !tracksLoad && (target.reason === 'in_range_add_reps' || target.reason === 'felt_hard_hold');
  return t(`workout.reason.${target.reason}${bodyweightVariant ? '_bodyweight' : ''}`, params);
}

export type ReasonTone = 'up' | 'same' | 'new' | 'down';

/** Green with an up arrow when the work goes up, a star the first time, grey otherwise. */
export function reasonTone(target: Target): ReasonTone {
  switch (target.reason) {
    case 'hit_top_add_load':
    case 'ladder_step_up':
    case 'add_set':
      return 'up';
    case 'first_time':
    case 'first_time_pick_weight':
      return 'new';
    case 'failed_twice_reduce':
      return 'down';
    default:
      return 'same';
  }
}

/** "1:05" for a countdown or elapsed time; hours only when there are some. */
export function clockText(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** A logged set for the done view: "60 kg × 12", "× 12" for bodyweight, "40 s" for holds. */
export function loggedSetText(t: TFunction, set: LoggedSet, unit: Prescription['unit']): string {
  if (unit === 'seconds') return t('workout.logged.seconds', { secs: set.reps });
  if (set.loadKg) return t('workout.logged.load', { kg: kgNumber(set.loadKg), reps: set.reps });
  return t('workout.logged.reps', { reps: set.reps });
}

/** What an exercise needs, for the swap list: "Dumbbells · Bench", or "Bodyweight". */
export function equipmentText(t: TFunction, exercise: Pick<Exercise, 'equipment'>): string {
  const items = exercise.equipment.filter((item) => item !== 'bodyweight');
  return (items.length ? items : ['bodyweight']).map((item) => t(`workout.equipmentName.${item}`)).join(' · ');
}

/** "15 min · moderate pace", or "8 min · 30 s on, 30 s off" for interval moves. */
export function cardioText(t: TFunction, cardio: { minutes: number; intensity: 'easy' | 'moderate' }, intervals: boolean): string {
  const pace = intervals ? t('workout.cardio.intervals') : t(`workout.cardio.pace.${cardio.intensity}`);
  return t('workout.cardio.presc', { count: cardio.minutes, pace });
}

/** How hard cardio should feel: the talk test, or a form cue for intervals. */
export function cardioCueText(t: TFunction, cardio: { intensity: 'easy' | 'moderate' }, intervals: boolean): string {
  return intervals ? t('workout.cardio.cue.intervals') : t(`workout.cardio.cue.${cardio.intensity}`);
}
