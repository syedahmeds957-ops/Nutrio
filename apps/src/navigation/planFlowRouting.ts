/**
 * Where the dashboard's nav pills go, and where `plan_flow` returns to.
 *
 * Extracted from App.tsx because these rules were inline ternaries that no test
 * could reach, and three separate bugs lived in them at once: a user with saved
 * targets was re-asked to choose a goal, Back from the dashboard landed on page
 * one of the survey, and a guest with no survey at all was shown a metabolic
 * analysis built from fallback defaults.
 *
 * Pure and data-free on purpose — it takes booleans, not the plan or survey
 * objects, so the routing rules can be read and tested on their own.
 */

export type AppRoute =
  | 'auth'
  | 'survey'
  | 'plan_flow'
  | 'active_tracker'
  | 'weight_tracker'
  | 'weekly_plan';

/**
 * Why `plan_flow` is open.
 *
 * 'create' runs the wizard from fresh survey answers: analysis, then goal
 * selection, then the reveal. 'review' opens straight on the accepted plan.
 */
export type PlanFlowMode = 'create' | 'review';

export interface PlanRoutingInput {
  hasActivePlan: boolean;
  hasSurveyData: boolean;
}

/**
 * Where the survey was opened from. Same reason `plan_flow` needs a mode:
 * cancelling has to return the user where they came from, and a dashboard user
 * who backs out of the survey was being dropped on the login screen as though
 * they had been signed out.
 */
export type SurveyEntry = 'onboarding' | 'dashboard';

export interface PlanDestination {
  route: AppRoute;
  /** Only set when `route` is 'plan_flow'. */
  planFlowMode?: PlanFlowMode;
  /** Only set when `route` is 'survey'. */
  surveyEntry?: SurveyEntry;
}

/**
 * The dashboard's "Targets" pill.
 *
 * An accepted plan is shown as-is. Survey answers without a plan mean the user
 * stopped before choosing a goal, so the wizard resumes. Neither means we know
 * nothing about this person — and the analysis screen would have invented a BMR
 * and TDEE for them — so they go to the survey instead.
 */
export function resolveTargetsDestination(input: PlanRoutingInput): PlanDestination {
  if (input.hasActivePlan) return { route: 'plan_flow', planFlowMode: 'review' };
  if (input.hasSurveyData) return { route: 'plan_flow', planFlowMode: 'create' };
  return { route: 'survey', surveyEntry: 'dashboard' };
}

/**
 * The dashboard's "Weight" pill. Weight tracking needs a target weight, which
 * only an accepted plan carries.
 */
export function resolveWeightTrackerDestination(input: PlanRoutingInput): PlanDestination {
  if (input.hasActivePlan) return { route: 'weight_tracker' };
  if (input.hasSurveyData) return { route: 'plan_flow', planFlowMode: 'create' };
  return { route: 'survey', surveyEntry: 'dashboard' };
}

/**
 * The dashboard's "Meals" pill. Suggestions need a known diet preference as
 * well as a plan — unlike weight, there is no safe default for what someone
 * eats, so a guess would mean recommending food they don't eat.
 */
export function resolveMealPlanDestination(
  input: PlanRoutingInput & { hasDietPreference: boolean }
): PlanDestination {
  if (input.hasActivePlan && input.hasDietPreference) return { route: 'weekly_plan' };
  if (input.hasSurveyData) return { route: 'plan_flow', planFlowMode: 'create' };
  return { route: 'survey', surveyEntry: 'dashboard' };
}

/**
 * Back out of `plan_flow`, to wherever it was opened from rather than to
 * whichever screen happens to hold data.
 */
export function resolvePlanFlowBack(input: {
  planFlowMode: PlanFlowMode;
  hasSurveyData: boolean;
}): AppRoute {
  if (input.planFlowMode === 'review') return 'active_tracker';
  return input.hasSurveyData ? 'survey' : 'auth';
}

/**
 * Whether the wizard should open on the saved plan instead of running analysis.
 * Reviewing a plan the user already accepted must never re-ask for the goal.
 */
export function shouldOpenSavedPlan(mode: PlanFlowMode): boolean {
  return mode === 'review';
}

/**
 * Back out of the survey. Cancelling from the dashboard returns to it; leaving
 * the onboarding survey goes back to auth, which is genuinely where it started.
 */
export function resolveSurveyBack(entry: SurveyEntry): AppRoute {
  return entry === 'dashboard' ? 'active_tracker' : 'auth';
}
