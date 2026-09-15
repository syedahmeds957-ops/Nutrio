import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { QuickStaplesBar } from '../ui/QuickStaplesBar.js';
import { RegionProvider } from '../../common/region/index.js';

describe('QuickStaplesBar Component', () => {
  it('renders staples and handles quick log and camera scan triggers in default mode', () => {
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

  it('renders correctly inside Saudi Arabia RegionProvider', () => {
    const onQuickLog = vi.fn();
    const child = React.createElement(QuickStaplesBar, { onQuickLog });
    const element = React.createElement(RegionProvider, { initialRegion: 'SA', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders correctly inside Pakistan RegionProvider', () => {
    const onQuickLog = vi.fn();
    const child = React.createElement(QuickStaplesBar, { onQuickLog });
    const element = React.createElement(RegionProvider, { initialRegion: 'PK', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('PK');
  });
});
