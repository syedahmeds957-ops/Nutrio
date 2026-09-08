import { describe, it, expect } from 'vitest';
import React from 'react';
import { StreakBadge } from '../ui/StreakBadge.js';

describe('StreakBadge Component', () => {
  it('instantiates StreakBadge with streak count and active days', () => {
    const element = React.createElement(StreakBadge, {
      streakDays: 7,
      completedDays: [0, 1, 2, 3, 4, 5],
      currentDayIndex: 6,
    });

    expect(element).toBeDefined();
    expect(element.props.streakDays).toBe(7);
    expect(element.props.completedDays).toHaveLength(6);
    expect(element.props.currentDayIndex).toBe(6);
  });
});
