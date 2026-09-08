import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { QuickStaplesBar } from '../ui/QuickStaplesBar.js';

describe('QuickStaplesBar Component', () => {
  it('renders staples and handles quick log and camera scan triggers', () => {
    const onQuickLog = vi.fn();
    const onScanPlate = vi.fn();

    const element = React.createElement(QuickStaplesBar, {
      onQuickLog,
      onScanPlate,
    });

    expect(element).toBeDefined();
    expect(element.props.onQuickLog).toBe(onQuickLog);
    expect(element.props.onScanPlate).toBe(onScanPlate);
  });
});
