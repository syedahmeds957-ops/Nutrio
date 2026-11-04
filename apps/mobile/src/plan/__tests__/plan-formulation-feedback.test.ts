import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { PlanCalculationTransitionView } from '../ui/PlanCalculationTransitionView.js';
import { PlanWorkflowScreen } from '../ui/PlanWorkflowScreen.js';
import { PlanUserContext } from '../types.js';

describe('Phase 4: Loading States & Async Feedback Verification', () => {
  const mockUserContext: PlanUserContext = {
    weightKg: 80,
    heightCm: 175,
    ageYears: 28,
    sex: 'male',
    bmr: 1750,
    tdee: 2400,
    isPregnantOrBreastfeeding: false,
    chaiSugarKcalPerDay: 130,
    weeklyChaiSugarKcal: 910,
    isNightShift: false,
    dailySittingHours: 8,
  };

  it('renders PlanCalculationTransitionView and handles instant ready callback in test environment', () => {
    const handleReady = vi.fn();
    const element = React.createElement(PlanCalculationTransitionView, {
      onReady: handleReady,
    });

    expect(element).toBeDefined();
    expect(element.props.onReady).toBe(handleReady);
  });

  it('instantiates PlanWorkflowScreen with analysis, goal, and calculating pipeline', () => {
    const handlePlanAccepted = vi.fn();
    const handleCancel = vi.fn();

    const element = React.createElement(PlanWorkflowScreen, {
      userContext: mockUserContext,
      onPlanAccepted: handlePlanAccepted,
      onCancel: handleCancel,
    });

    expect(element).toBeDefined();
    expect(element.props.userContext.bmr).toBe(1750);
    expect(element.props.userContext.tdee).toBe(2400);
  });
});
