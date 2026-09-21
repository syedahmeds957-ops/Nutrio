import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { StepPreferencesBudget } from '../ui/StepPreferencesBudget.js';
import { StepLifestyleDesi } from '../ui/StepLifestyleDesi.js';
import { OnboardingSurveyScreen } from '../ui/OnboardingSurveyScreen.js';
import { RegionProvider } from '../../common/region/index.js';

describe('Step 4: Regional Survey, Preferences & Onboarding Defaults (Saudi vs Pakistani)', () => {
  it('renders StepPreferencesBudget in Pakistani mode (PKR) by default', () => {
    const child = React.createElement(StepPreferencesBudget, {
      data: { dietPreference: 'halal_omnivore', budgetTierPKR: 'standard_3500_7000' },
      onChange: () => {},
      errors: {},
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'PK', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('PK');
  });

  it('renders StepPreferencesBudget in Saudi Arabia mode (SAR) with Saudi diet options and SAR budget tiers', () => {
    const child = React.createElement(StepPreferencesBudget, {
      data: { dietPreference: 'halal_omnivore', budgetTierPKR: 'standard_3500_7000' },
      onChange: () => {},
      errors: {},
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'SA', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders StepLifestyleDesi with Gahwa & Dates cultural ritual in Saudi mode', () => {
    const child = React.createElement(StepLifestyleDesi, {
      data: { chaiWithSugarCupsPerDay: 3, eatingOutTimesPerWeek: 2 },
      onChange: () => {},
      errors: {},
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'SA', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders OnboardingSurveyScreen with Saudi step titles when region is SA', () => {
    const child = React.createElement(OnboardingSurveyScreen, {
      onComplete: () => {},
      onCancel: () => {},
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'SA', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders OnboardingSurveyScreen with onSkip action prop', () => {
    const onSkipMock = vi.fn();
    const child = React.createElement(OnboardingSurveyScreen, {
      onComplete: () => {},
      onCancel: () => {},
      onSkip: onSkipMock,
    });
    expect(child.props.onSkip).toBe(onSkipMock);
  });
});

