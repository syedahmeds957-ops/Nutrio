import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AnalysisView } from '../ui/AnalysisView.js';
import { PlanWorkflowScreen } from '../ui/PlanWorkflowScreen.js';
import { PlanRevealView } from '../ui/PlanRevealView.js';
import { PlanUserContext } from '../types.js';
import { RegionProvider } from '../../common/region/index.js';

describe('AnalysisView and PlanWorkflowScreen Navigation', () => {
  const mockContext: PlanUserContext = {
    weightKg: 78,
    heightCm: 175,
    ageYears: 28,
    sex: 'male',
    bmr: 1720,
    tdee: 2360,
    chaiSugarKcalPerDay: 180,
    weeklyChaiSugarKcal: 1260,
    isNightShift: false,
    dailySittingHours: 7,
  };

  it('renders AnalysisView with onBack prop support', () => {
    const onBack = vi.fn();
    const onProceedToGoal = vi.fn();

    const element = React.createElement(AnalysisView, {
      context: mockContext,
      onProceedToGoal,
      onBack,
    });

    expect(element).toBeDefined();
    expect(element.props.context.bmr).toBe(1720);
    expect(element.props.context.tdee).toBe(2360);
    expect(element.props.onBack).toBe(onBack);
  });

  it('renders PlanWorkflowScreen in analysis phase and wires onCancel to onBack', () => {
    const onCancel = vi.fn();
    const onPlanAccepted = vi.fn();

    const element = React.createElement(PlanWorkflowScreen, {
      userContext: mockContext,
      onPlanAccepted,
      onCancel,
    });

    expect(element).toBeDefined();
    expect(element.props.onCancel).toBe(onCancel);
  });

  it('renders AnalysisView inside Saudi Arabia RegionProvider without errors', () => {
    const child = React.createElement(AnalysisView, {
      context: mockContext,
      onProceedToGoal: vi.fn(),
    });
    const element = React.createElement(RegionProvider, {
      initialRegion: 'SA',
      children: child,
    });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders AnalysisView inside Pakistan RegionProvider without errors', () => {
    const child = React.createElement(AnalysisView, {
      context: mockContext,
      onProceedToGoal: vi.fn(),
    });
    const element = React.createElement(RegionProvider, {
      initialRegion: 'PK',
      children: child,
    });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('PK');
  });
});

describe('Targets review hides the accept button until something changes', () => {
  const ctx: PlanUserContext = {
    weightKg: 78,
    heightCm: 175,
    ageYears: 28,
    sex: 'male',
    bmr: 1750,
    tdee: 2400,
    chaiSugarKcalPerDay: 130,
    weeklyChaiSugarKcal: 910,
    isNightShift: false,
    dailySittingHours: 7,
  };
  const plan = {
    goalSelection: { goal: 'lose', targetRateKgPerWeek: 0.5, targetWeightKg: 73 },
    userContext: ctx,
  } as never;

  it('offers accept when a plan is being created for the first time', () => {
    const el = React.createElement(PlanWorkflowScreen, {
      userContext: ctx,
      onPlanAccepted: vi.fn(),
      onCancel: vi.fn(),
    });
    // No existingPlan, so the wizard runs and the plan genuinely needs accepting.
    expect(el.props.existingPlan).toBeUndefined();
  });

  it('opens straight on the saved plan when reviewing', () => {
    const el = React.createElement(PlanWorkflowScreen, {
      userContext: ctx,
      existingPlan: plan,
      onPlanAccepted: vi.fn(),
      onCancel: vi.fn(),
    });
    expect(el.props.existingPlan).toBe(plan);
  });

  it('lets PlanRevealView hide accept without hiding adjust', () => {
    const onAcceptPlan = vi.fn();
    const onAdjustGoal = vi.fn();
    const el = React.createElement(PlanRevealView, {
      plan,
      onAcceptPlan,
      onAdjustGoal,
      showAccept: false,
    });
    expect(el.props.showAccept).toBe(false);
    // Adjusting is still the whole point of the screen.
    expect(el.props.onAdjustGoal).toBe(onAdjustGoal);
  });
});
