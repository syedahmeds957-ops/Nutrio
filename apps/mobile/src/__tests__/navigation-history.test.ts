import { describe, expect, it } from 'vitest';
import {
  finishPlan,
  goBackFrom,
  navigateTo,
  openFromDashboard,
  startAt,
} from '../navigation/history.js';

describe('navigation history', () => {
  it('returns Back from a dashboard detour to the dashboard, not the survey or sign-in', () => {
    // No saved plan: the Coach button has to open goal setting first.
    const atGoal = openFromDashboard(startAt('active_tracker'), 'plan_flow', 'coach_chat');
    expect(atGoal.route).toBe('plan_flow');
    expect(goBackFrom(atGoal, 'auth').route).toBe('active_tracker');
  });

  it('finishes the trip at the screen the button asked for once a plan is accepted', () => {
    const atGoal = openFromDashboard(startAt('active_tracker'), 'plan_flow', 'coach_chat');
    const done = finishPlan(atGoal);
    expect(done.route).toBe('coach_chat');
    // and Back from there is the dashboard
    expect(goBackFrom(done, 'auth').route).toBe('active_tracker');
  });

  it('goes to the dashboard after accepting a plan opened from Targets', () => {
    const atTargets = openFromDashboard(startAt('active_tracker'), 'plan_flow', 'plan_flow');
    expect(finishPlan(atTargets)).toEqual(startAt('active_tracker'));
  });

  it('walks back through a survey opened from the dashboard', () => {
    let nav = openFromDashboard(startAt('active_tracker'), 'survey', 'weight_tracker');
    nav = navigateTo(nav, 'plan_flow');
    nav = goBackFrom(nav, 'auth');
    expect(nav.route).toBe('survey');
    nav = goBackFrom(nav, 'auth');
    expect(nav.route).toBe('active_tracker');
  });

  it('forgets an abandoned detour once the user is back on the dashboard', () => {
    const atGoal = openFromDashboard(startAt('active_tracker'), 'plan_flow', 'coach_chat');
    const back = goBackFrom(atGoal, 'auth');
    expect(back.afterPlan).toBeNull();
    // Accepting a plan later from Targets lands on the dashboard, not Coach.
    expect(finishPlan(navigateTo(back, 'plan_flow')).route).toBe('active_tracker');
  });

  it('opens Workouts from the dashboard with no detour, and Back returns to the dashboard', () => {
    // Workouts need no plan or survey, so the pill always opens the screen itself.
    const atWorkouts = openFromDashboard(startAt('active_tracker'), 'workouts', 'workouts');
    expect(atWorkouts.route).toBe('workouts');
    expect(atWorkouts.afterPlan).toBeNull();
    expect(goBackFrom(atWorkouts, 'auth').route).toBe('active_tracker');
  });

  it('uses the fallback when nothing is behind the current screen', () => {
    expect(goBackFrom(startAt('survey'), 'auth').route).toBe('auth');
  });

  it('does not stack the same screen twice', () => {
    const nav = navigateTo(startAt('active_tracker'), 'active_tracker');
    expect(nav.history).toEqual([]);
  });
});
