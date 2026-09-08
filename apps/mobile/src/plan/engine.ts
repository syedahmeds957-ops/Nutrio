import {
  calculateBMI,
  calculateCalorieTarget,
  calculateMacros,
  GoalType,
} from '@nutrio/nutrition-core';
import {
  ComputedUserPlan,
  GoalSelectionState,
  PlanProjection,
  PlanUserContext,
  AssessmentNarrative,
} from './types.js';

export function computeProjection(
  currentWeightKg: number,
  goal: GoalType,
  rateKgPerWeek: number,
  targetWeightKg?: number
): PlanProjection {
  if (goal === 'maintain' || rateKgPerWeek <= 0 || !targetWeightKg) {
    return {
      currentWeightKg,
      targetWeightKg,
      weeklyRateKg: 0,
      isRealistic: true,
      pacingAdvice: 'Steady weight maintenance supporting metabolic recovery and athletic performance.',
    };
  }

  const diffKg = Math.abs(currentWeightKg - targetWeightKg);
  const estimatedWeeks = Math.max(1, Math.round(diffKg / rateKgPerWeek));

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + estimatedWeeks * 7);
  const projectedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Pacing advice
  const ratePctOfBW = (rateKgPerWeek / currentWeightKg) * 100;
  let isRealistic = true;
  let pacingAdvice = '';

  if (goal === 'lose') {
    if (ratePctOfBW > 1.0) {
      isRealistic = false;
      pacingAdvice = 'Aggressive pace (>1% bodyweight/week) increases risk of lean muscle and water loss.';
    } else if (ratePctOfBW >= 0.5) {
      pacingAdvice = 'Optimal fat loss pace (~0.5–1% BW/week). Strongly protects lean body mass.';
    } else {
      pacingAdvice = 'Gentle, sustainable deficit. Easiest for long-term lifestyle adherence.';
    }
  } else if (goal === 'gain') {
    if (rateKgPerWeek > 0.4) {
      pacingAdvice = 'Rapid mass gain. A significant portion of weight gained may be body fat.';
    } else {
      pacingAdvice = 'Lean hypertrophy pace (~0.25 kg/week). Maximizes muscle synthesis over fat storage.';
    }
  }

  return {
    currentWeightKg,
    targetWeightKg,
    totalKgToChange: Number(diffKg.toFixed(1)),
    weeklyRateKg: rateKgPerWeek,
    estimatedWeeks,
    projectedDate,
    isRealistic,
    pacingAdvice,
  };
}

export function computePlan(
  userContext: PlanUserContext,
  goalSelection: GoalSelectionState,
  narrative?: AssessmentNarrative
): ComputedUserPlan {
  // 1. Calculate calorie targets using deterministic nutrition-core engine
  const targetResult = calculateCalorieTarget({
    weightKg: userContext.weightKg,
    heightCm: userContext.heightCm,
    ageYears: userContext.ageYears,
    sex: userContext.sex,
    bmr: userContext.bmr,
    tdee: userContext.tdee,
    goal: goalSelection.goal,
    targetRateKgPerWeek: goalSelection.targetRateKgPerWeek,
    isPregnantOrBreastfeeding: userContext.isPregnantOrBreastfeeding,
    medicalConditions: userContext.medicalConditions,
  });

  // 2. Calculate macro distribution
  const macros = calculateMacros({
    kcalTarget: targetResult.kcalTarget,
    weightKg: userContext.weightKg,
    goal: goalSelection.goal,
    bodyFatPct: userContext.bodyFatPct,
  });

  // 3. Compute timeline projection
  const projection = computeProjection(
    userContext.weightKg,
    goalSelection.goal,
    targetResult.effectiveRateKgPerWeek,
    goalSelection.targetWeightKg
  );

  return {
    userContext,
    goalSelection,
    targetResult,
    macros,
    projection,
    narrative,
  };
}
