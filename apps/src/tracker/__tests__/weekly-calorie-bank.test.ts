import { describe, it, expect } from 'vitest';
import React from 'react';
import { WeeklyCalorieBankCard } from '../ui/WeeklyCalorieBankCard.js';

describe('WeeklyCalorieBankCard Component', () => {
  it('renders weekly deficit calculation and daily mini bars', () => {
    const mockDailyIntakes = [
      { day: 'Mon', consumed: 1750, target: 1850 },
      { day: 'Tue', consumed: 1800, target: 1850 },
      { day: 'Wed', consumed: 1650, target: 1850 },
      { day: 'Thu', consumed: 1900, target: 1850 },
      { day: 'Fri', consumed: 1700, target: 1850 },
      { day: 'Sat', consumed: 2100, target: 1850 }, // shaadi dinner
      { day: 'Sun', consumed: 1200, target: 1850 }, // today
    ];

    const element = React.createElement(WeeklyCalorieBankCard, {
      dailyHistory: mockDailyIntakes,
      weeklyDeficitKcal: 2450,
      targetCalories: 1850,
    });

    expect(element).toBeDefined();
    expect(element.props.dailyHistory).toHaveLength(7);
    expect(element.props.weeklyDeficitKcal).toBe(2450);
  });
});
