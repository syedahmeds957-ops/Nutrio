import type { AppRoute } from './planFlowRouting.js';

/**
 * Where the app is, and how it got there.
 *
 * Back used to be worked out per screen from whatever data happened to exist,
 * so a dashboard button that opened goal selection sent Back to page one of the
 * survey and then to the login screen. The history makes Back return to the
 * screen the user actually came from.
 */
export interface NavState {
  route: AppRoute;
  /** Screens behind the current one, oldest first. */
  history: AppRoute[];
  /**
   * The screen a dashboard button asked for when it had to detour through
   * goal setting first (Coach needs a plan, say). Accepting the plan finishes
   * the trip there instead of dropping the user on the dashboard.
   */
  afterPlan: AppRoute | null;
}

export const startAt = (route: AppRoute): NavState => ({ route, history: [], afterPlan: null });

/** Opens `route` on top of the current screen; Back returns here. */
export function navigateTo(state: NavState, route: AppRoute): NavState {
  if (route === state.route) return state;
  return { ...state, route, history: [...state.history, state.route] };
}

/**
 * Opens what a dashboard button resolved to. When that is a detour (goal
 * setting or the survey, because the wanted screen needs a plan), the wanted
 * screen is remembered for after the plan is accepted.
 */
export function openFromDashboard(state: NavState, resolved: AppRoute, wanted: AppRoute): NavState {
  return { ...navigateTo(state, resolved), afterPlan: resolved === wanted ? null : wanted };
}

/**
 * A plan was accepted: go to the screen the user was heading for, with the
 * dashboard behind it, or to the dashboard itself.
 */
export function finishPlan(state: NavState): NavState {
  return state.afterPlan
    ? { route: state.afterPlan, history: ['active_tracker'], afterPlan: null }
    : startAt('active_tracker');
}

/**
 * The previous screen, or `fallback` when nothing is behind this one (the
 * survey reached straight after sign-in). Landing back on the dashboard drops
 * any pending detour target: the user abandoned that trip.
 */
export function goBackFrom(state: NavState, fallback: AppRoute): NavState {
  const previous = state.history[state.history.length - 1];
  const route = previous ?? fallback;
  return {
    route,
    history: previous ? state.history.slice(0, -1) : [],
    afterPlan: route === 'active_tracker' ? null : state.afterPlan,
  };
}
