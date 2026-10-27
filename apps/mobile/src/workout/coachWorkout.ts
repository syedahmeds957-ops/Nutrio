import type { TFunction } from 'i18next';
import type { CoachWorkoutContext } from '@nutrio/nutrition-core';
import type {
  JointLoad,
  WeeklyWorkoutPlan,
  WorkoutLog,
} from '@nutrio/workout-core';
import { exerciseForWeek, getExercise, isInvalidSwap, planSettings, swapCandidates } from './core.js';
import { swapExercise } from './planActions.js';
import { sessionTitle } from './sessionTitle.js';
import { buildWeekView, cardioForWeek, slotsForWeek } from './weekView.js';
import { loadWorkoutPlan } from './workoutStorage.js';

type Language = 'en' | 'ar';

/** The coach-chat schema takes at most this many alternatives. */
const MAX_COACH_CANDIDATES = 8;

/**
 * What the coach is told about the user's training this week, from the same
 * week view the Workouts screen shows (so counts and the week start match).
 */
export function coachWorkoutContext({
  plan,
  logs,
  todayKey,
  region,
  language,
  t,
}: {
  plan: WeeklyWorkoutPlan;
  logs: readonly WorkoutLog[];
  todayKey: string;
  region: string | undefined;
  language: Language;
  t: TFunction;
}): CoachWorkoutContext {
  const week = buildWeekView(plan, todayKey, region, logs);
  const session = week.today.session;
  const name = (id: string) => getExercise(id)?.name[language] ?? id;
  const cardio = session ? cardioForWeek(plan, session, week.weekIndex) : null;
  return {
    location: plan.settings.location,
    sessionsPlannedThisWeek: week.trainingDays,
    sessionsDoneThisWeek: week.doneDays,
    ...(session
      ? {
          today: {
            title: sessionTitle(t, session),
            exercises: [
              ...slotsForWeek(plan, session, week.weekIndex).map((slot) => name(slot.exerciseId)),
              ...(cardio ? [name(cardio.exerciseId)] : []),
            ],
          },
        }
      : {}),
    ramadan: planSettings(plan).ramadan.enabled,
  };
}

/** One exercise the user asked the coach about, with the only swaps the app allows for it. */
export interface CoachSwapTopic {
  slotId: string;
  weekIndex: number;
  exerciseId: string;
  exerciseName: string;
  candidates: { id: string; name: string; jointLoads: JointLoad[] }[];
}

/** The topic for a slot as the plan stands now, or null when the slot is gone. */
export function coachSwapTopic(plan: WeeklyWorkoutPlan, slotId: string, weekIndex: number, language: Language): CoachSwapTopic | null {
  const exerciseId = exerciseForWeek(plan, slotId, weekIndex);
  const exercise = exerciseId ? getExercise(exerciseId) : undefined;
  if (!exercise) return null;
  return {
    slotId,
    weekIndex,
    exerciseId: exercise.id,
    exerciseName: exercise.name[language],
    candidates: swapCandidates(plan, slotId, { weekIndex })
      .slice(0, MAX_COACH_CANDIDATES)
      .map((candidate) => ({ id: candidate.id, name: candidate.name[language], jointLoads: candidate.jointLoads })),
  };
}

export type CoachSwapResult =
  | { applied: true; plan: WeeklyWorkoutPlan; dayTitle: string; topic: CoachSwapTopic | null }
  | { applied: false };

/**
 * Applies a swap the coach proposed and the user accepted. It reads the plan
 * as stored now (it may have changed since the chat opened) and goes through
 * the same checked, saved and synced path as the Swap sheet; a choice that is
 * no longer safe is refused.
 */
export function applyCoachSwap(topic: CoachSwapTopic, toId: string, language: Language, t: TFunction, now: Date = new Date()): CoachSwapResult {
  const plan = loadWorkoutPlan();
  if (!plan || exerciseForWeek(plan, topic.slotId, topic.weekIndex) !== topic.exerciseId) return { applied: false };
  try {
    const next = swapExercise(plan, topic.slotId, toId, topic.weekIndex, now);
    const session = next.sessions.find(
      (s) => s.cardio?.slotId === topic.slotId || s.slots.some((slot) => slot.slotId === topic.slotId)
    );
    return {
      applied: true,
      plan: next,
      dayTitle: session ? sessionTitle(t, session) : '',
      topic: coachSwapTopic(next, topic.slotId, topic.weekIndex, language),
    };
  } catch (err) {
    if (isInvalidSwap(err)) return { applied: false };
    throw err;
  }
}
