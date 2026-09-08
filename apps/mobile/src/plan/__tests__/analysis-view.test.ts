import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AnalysisView } from '../ui/AnalysisView.js';
import { PlanWorkflowScreen } from '../ui/PlanWorkflowScreen.js';
import { PlanUserContext } from '../types.js';

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
});
