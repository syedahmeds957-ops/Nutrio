import type { ComputedUserPlan, GoalSelectionState } from '../plan/types.js';
import { computePlan } from '../plan/engine.js';
import { planUserContextFromSurvey } from '../plan/userContext.js';
import type { LifestyleSurveyPayload } from '../survey/types.js';

const DEFAULT_FIBRE_G = 25;
const DEFAULT_WATER_ML = 2500;

/**
 * One row of core.targets. The numeric columns summarise the plan for queries
 * and history; `plan` is the full plan, so a restore brings back exactly what
 * the user accepted instead of rebuilding it from the summary.
 */
export function buildTargetsRow(profileId: string, plan: ComputedUserPlan) {
  const isAdaptive = !!plan.recalibratedAt;
  const generatedBy = isAdaptive ? 'adaptive' : 'rule';
  return {
    user_id: profileId,
    effective_from: new Date().toISOString(),
    bmr: Math.round(plan.userContext.bmr),
    tdee_formula: Math.round(plan.formulaTdee ?? plan.userContext.tdee),
    tdee_adaptive: isAdaptive ? Math.round(plan.userContext.tdee) : null,
    goal: plan.goalSelection.goal,
    rate_kg_per_week: plan.goalSelection.targetRateKgPerWeek,
    kcal_target: Math.round(plan.targetResult.kcalTarget),
    protein_g: Math.round(plan.macros.proteinGrams),
    carb_g: Math.round(plan.macros.carbGrams),
    fat_g: Math.round(plan.macros.fatGrams),
    fibre_g: Math.round(plan.macros.fibreGrams ?? DEFAULT_FIBRE_G),
    water_ml: Math.round(plan.macros.waterMl ?? DEFAULT_WATER_ML),
    method: generatedBy,
    generated_by: generatedBy,
    safety_flags: {
      violations: plan.targetResult.safetyViolations ?? [],
      warnings: plan.targetResult.safetyWarnings ?? [],
    },
    plan,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

/**
 * The plan stored in a core.targets row, or null when the row has none or it
 * is incomplete. Never rebuilt from the summary columns: they lack sex, age and
 * height, and guessing those produced a plan for somebody else.
 */
export function planFromTargetsRow(row: unknown): ComputedUserPlan | null {
  if (!isObject(row) || !isObject(row.plan)) return null;
  const plan = row.plan;
  const complete =
    isObject(plan.userContext) &&
    isObject(plan.goalSelection) &&
    isObject(plan.targetResult) &&
    typeof plan.targetResult.kcalTarget === 'number' &&
    isObject(plan.macros) &&
    isObject(plan.projection);
  return complete ? (plan as unknown as ComputedUserPlan) : null;
}

const GOALS: ReadonlySet<string> = new Set(['lose', 'maintain', 'gain']);

/**
 * The plan for a targets row saved before rows carried the full plan (the
 * `plan` column was added on 2026-10-13; rows older than that build have only
 * the summary). Without this, a sign-in on a new device found no plan, and every
 * dashboard button sent the user back to goal selection.
 *
 * The summary columns alone are never enough — they lack sex, age and height —
 * so the plan is recomputed from the user's survey answers plus the goal and
 * rate the row records, through the same deterministic `computePlan` the wizard
 * used. It is accepted only if it reproduces the row's calorie target, which
 * proves the inputs are the ones the user accepted; anything else (answers
 * changed since, or a recalibrated TDEE the survey cannot reproduce) returns
 * null and the user picks a goal again.
 */
export function rebuildPlanFromTargetsRow(
  row: unknown,
  survey: LifestyleSurveyPayload | null | undefined
): ComputedUserPlan | null {
  if (!survey || !isObject(row)) return null;
  const { goal, rate_kg_per_week: rate, kcal_target: kcalTarget, tdee_adaptive: adaptive } = row;
  if (typeof goal !== 'string' || !GOALS.has(goal)) return null;
  if (typeof rate !== 'number' || typeof kcalTarget !== 'number') return null;
  // A recalibrated plan's TDEE came from logged intake, not the survey.
  if (adaptive !== null && adaptive !== undefined) return null;

  try {
    const plan = computePlan(planUserContextFromSurvey(survey), {
      goal: goal as GoalSelectionState['goal'],
      targetRateKgPerWeek: rate,
    });
    return Math.abs(Math.round(plan.targetResult.kcalTarget) - kcalTarget) <= 1 ? plan : null;
  } catch {
    // A survey too incomplete to compute from: the user picks a goal again.
    return null;
  }
}
