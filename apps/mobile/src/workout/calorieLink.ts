import {
  adjustTdeeForTraining,
  estimateWeeklyExerciseKcal,
  estimateWorkoutPlanWeeklyKcal,
  type WorkoutSegmentStyle,
} from '@nutrio/nutrition-core';
import { getExercise, planSettings, type WeeklyWorkoutPlan, type WorkoutSession } from '@nutrio/workout-core';
import { computePlan } from '../plan/engine.js';
import type { ComputedUserPlan } from '../plan/types.js';
import type { LifestyleSurveyPayload } from '../survey/types.js';

/** Below this change in daily energy use, the target is left alone without asking. */
export const MIN_TDEE_SHIFT_KCAL = 50;

export interface TargetUpdateProposal {
  currentKcal: number;
  proposedKcal: number;
  /** Training kcal a day the workout plan adds to what was counted (negative when it takes some away). */
  dailyTrainingKcal: number;
  /** The workout plan's weekly training kcal, recorded if the user says "Not now". */
  weeklyTrainingKcal: number;
  /** The nutrition plan to save if the user accepts. */
  nextPlan: ComputedUserPlan;
}

function sessionSegments(session: WorkoutSession, plan: WeeklyWorkoutPlan): { minutes: number; style: WorkoutSegmentStyle }[] {
  const { cardio, finisher } = session;
  const cardioMinutes = cardio?.minutes ?? 0;
  const finisherMinutes = finisher ? (finisher.rounds * (finisher.workSec + finisher.restSec)) / 60 : 0;
  const segments: { minutes: number; style: WorkoutSegmentStyle }[] = [
    {
      // `estimatedMinutes` includes the warm-up, the cardio block and any finisher.
      minutes: session.estimatedMinutes - cardioMinutes - finisherMinutes,
      style: plan.settings.location === 'gym' ? 'resistance' : 'bodyweight',
    },
  ];
  if (cardio) {
    const pattern = getExercise(plan.swaps[cardio.slotId] ?? cardio.exerciseId)?.pattern;
    const hard = pattern === 'conditioning' || cardio.intensity === 'moderate';
    segments.push({ minutes: cardioMinutes, style: hard ? 'conditioning' : 'walking' });
  }
  if (finisher) segments.push({ minutes: finisherMinutes, style: 'conditioning' });
  return segments;
}

/** The training a workout plan's week adds up to, in kcal. The optional rest-day walk isn't counted. */
export function workoutPlanWeeklyKcal(plan: WeeklyWorkoutPlan): number {
  return estimateWorkoutPlanWeeklyKcal(plan.sessions.flatMap((session) => sessionSegments(session, plan)));
}

/**
 * The calorie target a newly saved workout plan implies, to offer the user,
 * or null when there is nothing worth asking about. The plan's training
 * replaces the exercise the TDEE already counts (the survey's estimate, or the
 * last accepted plan's), so accepting and saving the same plan again never
 * stacks. Targets come from `computePlan`, so its safety floors still apply.
 */
export function proposeTargetUpdate({
  isGuest,
  activePlan,
  workoutPlan,
  survey,
}: {
  isGuest: boolean;
  activePlan: ComputedUserPlan | null;
  workoutPlan: WeeklyWorkoutPlan;
  survey: LifestyleSurveyPayload | null;
}): TargetUpdateProposal | null {
  if (isGuest || !activePlan) return null;
  // Ramadan sessions are short for a month; targets don't follow Ramadan (decision D3).
  if (planSettings(workoutPlan).ramadan.enabled) return null;

  const { userContext } = activePlan;
  const exercise = survey?.exercise;
  const counted =
    userContext.trainingWeeklyKcal ??
    (exercise
      ? estimateWeeklyExerciseKcal(exercise.trainingType, exercise.frequencyDaysPerWeek, exercise.sessionDurationMins, exercise.intensity)
      : null);
  // Without knowing what the TDEE already counts, any number would be a guess.
  if (counted === null) return null;

  const next = workoutPlanWeeklyKcal(workoutPlan);
  // "Not now" to this same training: asked again only once it changes.
  if (workoutPlan.targetOfferDeclinedKcal === next) return null;

  const tdee = adjustTdeeForTraining(userContext.tdee, counted, next);
  const dailyTrainingKcal = tdee - userContext.tdee;
  if (Math.abs(dailyTrainingKcal) < MIN_TDEE_SHIFT_KCAL) return null;

  const nextPlan: ComputedUserPlan = {
    ...computePlan({ ...userContext, tdee, trainingWeeklyKcal: next }, activePlan.goalSelection, activePlan.narrative),
    region: activePlan.region,
    recalibratedAt: activePlan.recalibratedAt,
    formulaTdee: activePlan.formulaTdee,
  };
  const currentKcal = Math.round(activePlan.targetResult.kcalTarget);
  const proposedKcal = Math.round(nextPlan.targetResult.kcalTarget);
  // A safety floor can hold the target where it is; then there's nothing to offer.
  if (proposedKcal === currentKcal) return null;

  return { currentKcal, proposedKcal, dailyTrainingKcal, weeklyTrainingKcal: next, nextPlan };
}
