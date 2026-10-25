import {
  exerciseForWeek,
  type CardioIntensity,
  weekIndexFor,
  type PlannedSlot,
  type Weekday,
  type WeeklyWorkoutPlan,
  type WorkoutLog,
  type WorkoutSession,
} from '@nutrio/workout-core';
import { addDaysToKey } from '../common/dateKey.js';
import { logForSession } from './historyFor.js';

const WEEKDAY_BY_INDEX: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * The first day of the week shown to the user. Saudi Arabia's week starts on
 * Sunday; Pakistan's, and the default for any other region, on Monday. This is
 * the only place the workout feature looks at the region.
 */
export function weekStartFor(region: string | undefined): Weekday {
  return region === 'SA' ? 'sun' : 'mon';
}

/** Calendar weekday of a `YYYY-MM-DD` key, computed in UTC so the device time zone can't shift it. */
export function weekdayOf(dateKey: string): Weekday {
  return WEEKDAY_BY_INDEX[new Date(`${dateKey}T00:00:00Z`).getUTCDay()];
}

/** The first day of the calendar week (in the region's numbering) that contains `dateKey`. */
export function weekStartKeyFor(dateKey: string, region: string | undefined): string {
  const startIndex = WEEKDAY_BY_INDEX.indexOf(weekStartFor(region));
  const dayIndex = WEEKDAY_BY_INDEX.indexOf(weekdayOf(dateKey));
  return addDaysToKey(dateKey, -((dayIndex - startIndex + 7) % 7));
}

export type DayStatus = 'planned' | 'today' | 'done' | 'missed';

export interface DayView {
  dateKey: string;
  weekday: Weekday;
  /** Day of the month, for the date column. */
  dayOfMonth: number;
  /** 0-11, for a localised month name. */
  month: number;
  session: WorkoutSession | null;
  status: DayStatus;
  /** The finished workout for this day's session, when there is one this week. */
  log?: WorkoutLog;
}

export interface WeekView {
  /** Weeks since the plan started (0 in the first week); drives accessory rotation. */
  weekIndex: number;
  days: DayView[];
  today: DayView;
  trainingDays: number;
  doneDays: number;
}

/**
 * The current calendar week of a plan. A training day is done once its session
 * has a log this week (on any day), missed when it has passed without one,
 * and otherwise today or planned. Days before the plan began count only if
 * their session was done; they are never missed.
 */
export function buildWeekView(
  plan: WeeklyWorkoutPlan,
  todayKey: string,
  region: string | undefined,
  logs: readonly WorkoutLog[] = []
): WeekView {
  const weekStartKey = weekStartKeyFor(todayKey, region);
  const offset = (Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${weekStartKey}T00:00:00Z`)) / 86_400_000;
  const weekEndKey = addDaysToKey(weekStartKey, 6);
  const sessionByDay = new Map(plan.sessions.map((session) => [session.day, session]));

  const days = Array.from({ length: 7 }, (_, i): DayView => {
    const dateKey = addDaysToKey(weekStartKey, i);
    const date = new Date(`${dateKey}T00:00:00Z`);
    const weekday = weekdayOf(dateKey);
    const session = sessionByDay.get(weekday) ?? null;
    const log = session ? logForSession(logs, session, weekStartKey, weekEndKey) : undefined;
    const status: DayStatus = log
      ? 'done'
      : dateKey === todayKey
        ? 'today'
        : session && dateKey < todayKey && dateKey >= plan.blockStart
          ? 'missed'
          : 'planned';
    return {
      dateKey,
      weekday,
      dayOfMonth: date.getUTCDate(),
      month: date.getUTCMonth(),
      session,
      status,
      ...(log ? { log } : {}),
    };
  });

  return {
    weekIndex: weekIndexFor(plan.blockStart, todayKey),
    days,
    today: days[offset],
    trainingDays: days.filter((day) => day.session && (day.status === 'done' || day.dateKey >= plan.blockStart)).length,
    doneDays: days.filter((day) => day.status === 'done').length,
  };
}

/** A session's slots as they run in a given week: swaps applied, accessories rotated. */
export function slotsForWeek(plan: WeeklyWorkoutPlan, session: WorkoutSession, weekIndex: number): PlannedSlot[] {
  return session.slots.map((slot) => ({
    ...slot,
    exerciseId: exerciseForWeek(plan, slot.slotId, weekIndex) ?? slot.exerciseId,
  }));
}

/** The next training day after `todayKey` (within the coming week), for the rest-day line. */
export function nextTrainingDay(plan: WeeklyWorkoutPlan, todayKey: string): { dateKey: string; session: WorkoutSession } | null {
  const sessionByDay = new Map(plan.sessions.map((session) => [session.day, session]));
  for (let i = 1; i <= 7; i++) {
    const dateKey = addDaysToKey(todayKey, i);
    const session = sessionByDay.get(weekdayOf(dateKey));
    if (session) return { dateKey, session };
  }
  return null;
}

/** A session's cardio block as it runs in a given week (a swap applied). */
export interface CardioView {
  slotId: string;
  exerciseId: string;
  minutes: number;
  intensity: CardioIntensity;
}

export function cardioForWeek(plan: WeeklyWorkoutPlan, session: WorkoutSession, weekIndex: number): CardioView | null {
  if (!session.cardio) return null;
  const { slotId, minutes, intensity } = session.cardio;
  return { slotId, minutes, intensity, exerciseId: exerciseForWeek(plan, slotId, weekIndex) ?? session.cardio.exerciseId };
}

/** Exercises in a session as the user counts them: the strength moves plus the cardio block. */
export function exerciseCount(session: WorkoutSession): number {
  return session.slots.length + (session.cardio ? 1 : 0);
}

/** Cardio log entries use the block's slot id, e.g. 'upper-a:cardio:0'. */
export function isCardioSlot(slotId: string): boolean {
  return /:cardio:\d+$/.test(slotId);
}

/** Planned workouts in a span of days and how many were done, for the weekly check-in. */
export interface TrainingAdherence {
  planned: number;
  done: number;
  /** Sessions whose day has passed without a log, in date order. */
  missed: Pick<WorkoutSession, 'template' | 'variant'>[];
}

/**
 * Training over `[fromKey, todayKey]`, counted the way the week view counts:
 * a session is done once it has a log in its own calendar week (in the
 * region's numbering), on any day up to today. Days before the plan began
 * count only if their session was done. Null when no session counts.
 */
export function trainingInWindow(
  plan: WeeklyWorkoutPlan,
  logs: readonly WorkoutLog[],
  fromKey: string,
  todayKey: string,
  region: string | undefined
): TrainingAdherence | null {
  const sessionByDay = new Map(plan.sessions.map((session) => [session.day, session]));
  const loggedByToday = logs.filter((log) => log.dateKey <= todayKey);
  let planned = 0;
  let done = 0;
  const missed: TrainingAdherence['missed'] = [];
  for (let dateKey = fromKey; dateKey <= todayKey; dateKey = addDaysToKey(dateKey, 1)) {
    const session = sessionByDay.get(weekdayOf(dateKey));
    if (!session) continue;
    const weekStartKey = weekStartKeyFor(dateKey, region);
    if (logForSession(loggedByToday, session, weekStartKey, addDaysToKey(weekStartKey, 6))) {
      planned += 1;
      done += 1;
    } else if (dateKey >= plan.blockStart) {
      planned += 1;
      if (dateKey < todayKey) missed.push({ template: session.template, variant: session.variant });
    }
  }
  return planned > 0 ? { planned, done, missed } : null;
}
