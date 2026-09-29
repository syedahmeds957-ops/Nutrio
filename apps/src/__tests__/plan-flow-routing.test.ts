import { describe, it, expect } from 'vitest';
import {
  resolveTargetsDestination,
  resolveWeightTrackerDestination,
  resolveMealPlanDestination,
  resolvePlanFlowBack,
  resolveSurveyBack,
  shouldOpenSavedPlan,
} from '../navigation/planFlowRouting.js';

const GUEST = { hasActivePlan: false, hasSurveyData: false };
const MID_ONBOARDING = { hasActivePlan: false, hasSurveyData: true };
const ESTABLISHED = { hasActivePlan: true, hasSurveyData: true };

describe('Targets pill', () => {
  it('opens the accepted plan for review instead of rebuilding it', () => {
    // The reported bug: a user who chose a goal during the survey was sent
    // back through analysis and asked to choose one again.
    expect(resolveTargetsDestination(ESTABLISHED)).toEqual({
      route: 'plan_flow',
      planFlowMode: 'review',
    });
  });

  it('resumes the wizard when answers exist but no goal was ever confirmed', () => {
    expect(resolveTargetsDestination(MID_ONBOARDING)).toEqual({
      route: 'plan_flow',
      planFlowMode: 'create',
    });
  });

  it('never shows a metabolic analysis for a user we know nothing about', () => {
    // The other reported bug: a guest who had filled no survey was shown a
    // BMR and a TDEE, both invented from fallback defaults.
    expect(resolveTargetsDestination(GUEST)).toEqual({
      route: 'survey',
      surveyEntry: 'dashboard',
    });
  });
});

describe('Back out of the survey', () => {
  it('returns to the dashboard when the survey was opened from it', () => {
    // The reported bug: cancelling the survey dropped the user on the login
    // screen, which looks exactly like having been signed out.
    expect(resolveSurveyBack('dashboard')).toBe('active_tracker');
  });

  it('returns to auth from the onboarding survey, where it actually started', () => {
    expect(resolveSurveyBack('onboarding')).toBe('auth');
  });

  it('marks every dashboard-originated survey trip as such', () => {
    const fromDashboard = [
      resolveTargetsDestination(GUEST),
      resolveWeightTrackerDestination(GUEST),
      resolveMealPlanDestination({ ...GUEST, hasDietPreference: false }),
    ];
    for (const destination of fromDashboard) {
      expect(destination.route).toBe('survey');
      expect(destination.surveyEntry, JSON.stringify(destination)).toBe('dashboard');
    }
  });
});

describe('Weight pill', () => {
  it('goes to the weight tracker once a plan gives it a target to track', () => {
    expect(resolveWeightTrackerDestination(ESTABLISHED)).toEqual({ route: 'weight_tracker' });
  });

  it('finishes the plan first when there is no target weight yet', () => {
    expect(resolveWeightTrackerDestination(MID_ONBOARDING)).toEqual({
      route: 'plan_flow',
      planFlowMode: 'create',
    });
  });

  it('sends a guest with no answers to the survey', () => {
    expect(resolveWeightTrackerDestination(GUEST)).toEqual({
      route: 'survey',
      surveyEntry: 'dashboard',
    });
  });
});

describe('Meals pill', () => {
  it('shows suggestions only when both a plan and a diet preference exist', () => {
    expect(
      resolveMealPlanDestination({ ...ESTABLISHED, hasDietPreference: true })
    ).toEqual({ route: 'weekly_plan' });
  });

  it('refuses to guess what someone eats', () => {
    // A plan alone is not enough: recommending food without knowing the diet
    // preference means recommending food they may not eat at all.
    expect(
      resolveMealPlanDestination({ ...ESTABLISHED, hasDietPreference: false })
    ).toEqual({ route: 'plan_flow', planFlowMode: 'create' });
  });

  it('sends a guest with no answers to the survey', () => {
    expect(resolveMealPlanDestination({ ...GUEST, hasDietPreference: false })).toEqual({
      route: 'survey',
      surveyEntry: 'dashboard',
    });
  });
});

describe('Back out of the plan flow', () => {
  it('returns to the dashboard when the flow was opened to review targets', () => {
    // The third reported bug: Back dropped the user on page one of the survey
    // even though they had tapped Targets on the dashboard.
    expect(resolvePlanFlowBack({ planFlowMode: 'review', hasSurveyData: true })).toBe(
      'active_tracker'
    );
    expect(resolvePlanFlowBack({ planFlowMode: 'review', hasSurveyData: false })).toBe(
      'active_tracker'
    );
  });

  it('returns to the survey when the flow was opened to build a plan', () => {
    expect(resolvePlanFlowBack({ planFlowMode: 'create', hasSurveyData: true })).toBe('survey');
  });

  it('falls back to auth when there is nowhere else to go', () => {
    expect(resolvePlanFlowBack({ planFlowMode: 'create', hasSurveyData: false })).toBe('auth');
  });
});

describe('Wizard entry point', () => {
  it('opens the saved plan only when reviewing', () => {
    expect(shouldOpenSavedPlan('review')).toBe(true);
    expect(shouldOpenSavedPlan('create')).toBe(false);
  });
});

describe('Mode is never inherited from an earlier navigation', () => {
  it('names a mode on every destination that lands in plan_flow', () => {
    const destinations = [
      resolveTargetsDestination(ESTABLISHED),
      resolveTargetsDestination(MID_ONBOARDING),
      resolveWeightTrackerDestination(MID_ONBOARDING),
      resolveMealPlanDestination({ ...ESTABLISHED, hasDietPreference: false }),
      resolveMealPlanDestination({ ...MID_ONBOARDING, hasDietPreference: false }),
    ];
    for (const destination of destinations) {
      if (destination.route === 'plan_flow') {
        expect(destination.planFlowMode, JSON.stringify(destination)).toBeDefined();
      }
    }
  });
});
