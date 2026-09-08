import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { HomeScreen } from '../ui/HomeScreen.js';

describe('HomeScreen Component', () => {
  it('defines the HomeScreen component and accepts navigation callbacks', () => {
    const onGetStarted = vi.fn();
    const onLogin = vi.fn();
    const onExploreGuest = vi.fn();

    const element = React.createElement(HomeScreen, {
      onGetStarted,
      onLogin,
      onExploreGuest,
    });

    expect(element).toBeDefined();
    expect(element.props.onGetStarted).toBe(onGetStarted);
    expect(element.props.onLogin).toBe(onLogin);
    expect(element.props.onExploreGuest).toBe(onExploreGuest);
  });
});
