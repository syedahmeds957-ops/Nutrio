import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AuthScreen } from '../ui/AuthScreen.js';

describe('AuthScreen Component', () => {
  it('instantiates AuthScreen with login mode', () => {
    const onAuthSuccess = vi.fn();
    const onBackToHome = vi.fn();
    const onExploreGuest = vi.fn();

    const element = React.createElement(AuthScreen, {
      initialMode: 'login',
      onAuthSuccess,
      onBackToHome,
      onExploreGuest,
    });

    expect(element).toBeDefined();
    expect(element.props.initialMode).toBe('login');
    expect(element.props.onAuthSuccess).toBe(onAuthSuccess);
    expect(element.props.onBackToHome).toBe(onBackToHome);
  });

  it('instantiates AuthScreen with verify_otp mode', () => {
    const onAuthSuccess = vi.fn();
    const onBackToHome = vi.fn();

    const element = React.createElement(AuthScreen, {
      initialMode: 'verify_otp',
      onAuthSuccess,
      onBackToHome,
    });

    expect(element).toBeDefined();
    expect(element.props.initialMode).toBe('verify_otp');
  });

  it('instantiates AuthScreen with register mode', () => {
    const onAuthSuccess = vi.fn();
    const onBackToHome = vi.fn();

    const element = React.createElement(AuthScreen, {
      initialMode: 'register',
      onAuthSuccess,
      onBackToHome,
    });

    expect(element).toBeDefined();
    expect(element.props.initialMode).toBe('register');
  });
});
