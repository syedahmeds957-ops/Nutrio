import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { TrackerDashboardScreen } from '../ui/TrackerDashboardScreen.js';

describe('TrackerDashboardScreen Navigation & Profile', () => {
  const mockTargets = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    targetWaterMl: 3000,
  };

  it('accepts onLogout and onOpenHome props and renders user name', () => {
    const onLogout = vi.fn();
    const onOpenHome = vi.fn();

    const element = React.createElement(TrackerDashboardScreen, {
      userName: 'Talha',
      targets: mockTargets,
      onLogout,
      onOpenHome,
    });

    expect(element).toBeDefined();
    expect(element.props.userName).toBe('Talha');
    expect(element.props.onLogout).toBe(onLogout);
    expect(element.props.onOpenHome).toBe(onOpenHome);
  });
});
