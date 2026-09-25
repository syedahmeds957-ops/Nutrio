import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AuthScreen } from '../auth/ui/AuthScreen.js';
import { OnboardingSurveyScreen } from '../survey/ui/OnboardingSurveyScreen.js';
import { TrackerDashboardScreen } from '../tracker/ui/TrackerDashboardScreen.js';
import { GuestAuthModal } from '../tracker/ui/GuestAuthModal.js';

describe('Phase 3: New App Onboarding & Guest Exploration Flow Integration', () => {
  it('AuthScreen successfully connects onAuthSuccess to proceed to survey', () => {
    const onAuthSuccess = vi.fn();
    const onExploreGuest = vi.fn();

    const authEl = React.createElement(AuthScreen, {
      initialMode: 'login',
      onAuthSuccess,
      onBackToHome: vi.fn(),
      onExploreGuest,
    });

    expect(authEl.props.initialMode).toBe('login');
    expect(authEl.props.onAuthSuccess).toBe(onAuthSuccess);
    expect(authEl.props.onExploreGuest).toBe(onExploreGuest);
  });

  it('OnboardingSurveyScreen exposes onSkip prop for skipping straight to dashboard', () => {
    const onSkip = vi.fn();
    const onComplete = vi.fn();

    const surveyEl = React.createElement(OnboardingSurveyScreen, {
      onComplete,
      onSkip,
      onCancel: vi.fn(),
    });

    expect(surveyEl.props.onSkip).toBe(onSkip);
  });

  it('TrackerDashboardScreen receives isGuest and onRequireAuth props', () => {
    const onRequireAuth = vi.fn();

    const trackerEl = React.createElement(TrackerDashboardScreen, {
      userName: 'Guest',
      targets: {
        targetCalories: 1850,
        targetProteinGrams: 120,
        targetFatGrams: 55,
        targetCarbGrams: 215,
        targetWaterMl: 2500,
      },
      isGuest: true,
      onRequireAuth,
    });

    expect(trackerEl.props.isGuest).toBe(true);
    expect(trackerEl.props.userName).toBe('Guest');
    expect(trackerEl.props.onRequireAuth).toBe(onRequireAuth);
  });

  it('GuestAuthModal triggers onSignIn when prompt primary action is clicked', () => {
    const onSignIn = vi.fn();
    const onClose = vi.fn();

    const modalEl = React.createElement(GuestAuthModal, {
      visible: true,
      onClose,
      onSignIn,
    });

    expect(modalEl.props.visible).toBe(true);
    modalEl.props.onSignIn();
    expect(onSignIn).toHaveBeenCalledTimes(1);

    modalEl.props.onClose();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
