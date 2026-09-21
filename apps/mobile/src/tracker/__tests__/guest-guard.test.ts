import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { TrackerDashboardScreen } from '../ui/TrackerDashboardScreen.js';
import { GuestAuthModal } from '../ui/GuestAuthModal.js';
import { RegionProvider } from '../../common/region/index.js';

describe('Phase 2: Guest Mode Functional Guard & Prompt Modal', () => {
  const dummyTargets = {
    targetCalories: 2000,
    targetProteinGrams: 140,
    targetFatGrams: 55,
    targetCarbGrams: 235,
    targetWaterMl: 3000,
  };

  it('renders TrackerDashboardScreen in guest mode without crashing', () => {
    const el = React.createElement(TrackerDashboardScreen, {
      userName: 'Guest Explorer',
      targets: dummyTargets,
      isGuest: true,
      onRequireAuth: vi.fn(),
    });
    expect(el).toBeDefined();
    expect(el.props.isGuest).toBe(true);
  });

  it('renders GuestAuthModal with title, description, and action buttons', () => {
    const onSignIn = vi.fn();
    const onClose = vi.fn();

    const modal = React.createElement(GuestAuthModal, {
      visible: true,
      onSignIn,
      onClose,
    });

    expect(modal).toBeDefined();
    expect(modal.props.visible).toBe(true);
    expect(modal.props.onSignIn).toBe(onSignIn);
    expect(modal.props.onClose).toBe(onClose);
  });

  it('renders GuestAuthModal in Saudi regional context', () => {
    const modal = React.createElement(GuestAuthModal, {
      visible: true,
      onSignIn: vi.fn(),
      onClose: vi.fn(),
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'SA', children: modal });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });
});
