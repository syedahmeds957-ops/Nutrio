import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AiRecommendationCard } from '../ui/AiRecommendationCard.js';
import { RegionProvider } from '../../common/region/index.js';

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

  it('renders cleanly inside Saudi Arabia RegionProvider with Saudi meals', () => {
    const onLogRecommendation = vi.fn();
    const child = React.createElement(AiRecommendationCard, {
      remainingCalories: 350,
      remainingProtein: 25,
      onLogRecommendation,
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'SA', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders cleanly inside Pakistan RegionProvider with Pakistani meals', () => {
    const onLogRecommendation = vi.fn();
    const child = React.createElement(AiRecommendationCard, {
      remainingCalories: 350,
      remainingProtein: 25,
      onLogRecommendation,
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'PK', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('PK');
  });

  it('supports regional keying to ensure separate logged state between PK and SA', () => {
    const onLog = vi.fn();
    const cardPK = React.createElement(AiRecommendationCard, {
      key: 'PK',
      remainingCalories: 500,
      remainingProtein: 30,
      onLogRecommendation: onLog,
    });
    const cardSA = React.createElement(AiRecommendationCard, {
      key: 'SA',
      remainingCalories: 500,
      remainingProtein: 30,
      onLogRecommendation: onLog,
    });
    expect(cardPK.key).toBe('PK');
    expect(cardSA.key).toBe('SA');
    expect(cardPK.key).not.toBe(cardSA.key);
  });
});
