import { calculateAdaptiveTDEE, calculateEWMA, EWMA_ALPHA } from '@nutrio/nutrition-core';
import { addDaysToKey, localDateKey } from '../common/dateKey.js';
import { computePlan } from '../plan/engine.js';
import type { ComputedUserPlan } from '../plan/types.js';
import { pairDailyLogs } from '../weight/engine.js';
import { CALIBRATION_WINDOW_DAYS } from '../weight/weightSeed.js';
import type { DailyIntakeLog, WeighInEntry } from '../weight/types.js';
import type { WeeklyWorkoutPlan, WorkoutLog } from '@nutrio/workout-core';
import { trainingInWindow } from '../workout/weekView.js';
import type { WeeklyCheckInMetrics } from './ui/WeeklyCheckInScreen.js';

const DAYS_PER_WEEK = 7;

/**
 * - needs_more_data: under 7 days of paired logs; the formula TDEE stands.
 * - under_logging: logs imply expenditure below 1.1x BMR, so meals are missing;
 *   the target is never cut on that evidence.
 * - adjusted: the trend disagrees with the plan; a capped correction is proposed.
 * - on_track: the trend matches the plan.
 */
export type WeeklyCheckInStatus = 'needs_more_data' | 'under_logging' | 'adjusted' | 'on_track';

export interface WeeklyCheckInInput {
  plan: ComputedUserPlan;
  weighIns: WeighInEntry[];
  intakeLogs: DailyIntakeLog[];
  /** Local day key; defaults to today. */
  today?: string;
  /** The workout plan and logs, when the user has a plan: shown, never used in the calorie maths. */
  workouts?: { plan: WeeklyWorkoutPlan; logs: readonly WorkoutLog[]; region: string | undefined };
}

export interface WeeklyCheckInResult {
  status: WeeklyCheckInStatus;
  metrics: WeeklyCheckInMetrics;
  /** The plan to save if the user accepts; the current plan when nothing changes. */
  proposedPlan: ComputedUserPlan;
}

const inRange = (date: string, from: string, to: string) => date >= from && date <= to;
const round1 = (n: number) => Number(n.toFixed(1));

/** Change in the smoothed weight over the week, or 0 with fewer than two weigh-ins. */
function weeklyWeightChange(weighIns: WeighInEntry[], weekStart: string): {
  currentEWMA: number;
  deltaKg: number;
} {
  if (weighIns.length === 0) return { currentEWMA: 0, deltaKg: 0 };
  const weights = weighIns.map((w) => w.weightKg);
  const ewma = calculateEWMA(weights, weights[0], EWMA_ALPHA);
  const currentEWMA = ewma[ewma.length - 1];

  // Baseline: the last smoothed value before the week began, else the first one in it.
  const lastBeforeWeek = weighIns.map((w) => w.date).filter((d) => d < weekStart).length - 1;
  const baseline = ewma[Math.max(0, lastBeforeWeek)];
  return { currentEWMA, deltaKg: weighIns.length < 2 ? 0 : round1(currentEWMA - baseline) };
}

/**
 * The weekly check-in, computed from what the user actually logged.
 *
 * Weekly figures (days logged, average intake, weight change) cover the last
 * 7 days. The TDEE recalibration uses days with both a weigh-in and a food log,
 * within the 28-day window and after the last accepted recalibration, under the
 * adaptive engine's own rules: at least 7 days of data, no cut on under-logged
 * weeks, and at most ±150 kcal per week. The new target comes from rerunning
 * the plan with the recalibrated TDEE, so goal pacing and safety floors still
 * apply, and accepting it makes that TDEE the baseline for next week.
 */
export function buildWeeklyCheckIn({
  plan,
  weighIns,
  intakeLogs,
  today = localDateKey(),
  workouts,
}: WeeklyCheckInInput): WeeklyCheckInResult {
  const weekStart = addDaysToKey(today, -(DAYS_PER_WEEK - 1));
  const windowStart = addDaysToKey(today, -(CALIBRATION_WINDOW_DAYS - 1));
  const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);

  const weighInsToDate = weighIns.filter((w) => w.date <= today).sort(byDate);
  const weekIntake = intakeLogs.filter((log) => inRange(log.date, weekStart, today));
  const daysLogged = weekIntake.length;
  const meanDailyIntake =
    daysLogged > 0 ? Math.round(weekIntake.reduce((sum, log) => sum + log.kcal, 0) / daysLogged) : 0;

  // Evidence for the recalibration: days after the last accepted one (those
  // before were already applied to the TDEE), within the calibration window,
  // where the user both weighed in and logged food.
  const evidenceStart =
    plan.recalibratedAt && plan.recalibratedAt >= windowStart
      ? addDaysToKey(plan.recalibratedAt, 1)
      : windowStart;
  const formulaTDEE = plan.userContext.tdee;
  const adaptive = calculateAdaptiveTDEE({
    formulaTDEE,
    bmr: plan.userContext.bmr,
    ...pairDailyLogs(
      weighInsToDate.filter((w) => w.date >= evidenceStart),
      intakeLogs.filter((log) => inRange(log.date, evidenceStart, today))
    ),
  });

  let status: WeeklyCheckInStatus;
  let tdeeDelta = 0;
  if (adaptive.daysLogged < DAYS_PER_WEEK) {
    status = 'needs_more_data';
  } else if (adaptive.isUnderLogging) {
    status = 'under_logging';
  } else {
    tdeeDelta = Math.round(adaptive.recommendedKcalDelta);
    status = tdeeDelta === 0 ? 'on_track' : 'adjusted';
  }

  const newTDEE = formulaTDEE + tdeeDelta;
  const proposedPlan =
    tdeeDelta === 0
      ? plan
      : {
          ...computePlan({ ...plan.userContext, tdee: newTDEE }, plan.goalSelection, plan.narrative),
          region: plan.region,
          recalibratedAt: today,
          formulaTdee: plan.formulaTdee ?? formulaTDEE,
        };

  const { currentEWMA, deltaKg } = weeklyWeightChange(weighInsToDate, weekStart);
  const oldKcalTarget = plan.targetResult.kcalTarget;
  const newKcalTarget = proposedPlan.targetResult.kcalTarget;
  const training = workouts ? trainingInWindow(workouts.plan, workouts.logs, weekStart, today, workouts.region) : null;

  return {
    status,
    proposedPlan,
    metrics: {
      daysLogged,
      meanDailyIntake,
      currentEWMAWeightKg: currentEWMA,
      weightDeltaKg: deltaKg,
      adherenceRatePct: Math.round((daysLogged / DAYS_PER_WEEK) * 100),
      oldTDEE: formulaTDEE,
      newTDEE,
      tdeeDelta,
      oldKcalTarget,
      newKcalTarget,
      targetDelta: newKcalTarget - oldKcalTarget,
      ...(training ? { training } : {}),
    },
  };
}
