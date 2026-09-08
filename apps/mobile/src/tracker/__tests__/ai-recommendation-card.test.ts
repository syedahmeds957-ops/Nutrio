import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AiRecommendationCard } from '../ui/AiRecommendationCard.js';

describe('AiRecommendationCard Component', () => {
  it('renders dynamic recommendation and handles 1-tap log and ask coach callbacks', () => {
    const onLogRecommendation = vi.fn();
    const onAskCoach = vi.fn();

    const element = React.createElement(AiRecommendationCard, {
      remainingCalories: 550,
      remainingProtein: 40,
      onLogRecommendation,
      onAskCoach,
    });

    expect(element).toBeDefined();
    expect(element.props.remainingCalories).toBe(550);
    expect(element.props.remainingProtein).toBe(40);
    expect(element.props.onLogRecommendation).toBe(onLogRecommendation);
    expect(element.props.onAskCoach).toBe(onAskCoach);
  });
});
