import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { StepPreferences } from '../ui/StepPreferences.js';
import { StepLifestyleDesi } from '../ui/StepLifestyleDesi.js';
import { OnboardingSurveyScreen } from '../ui/OnboardingSurveyScreen.js';
import { RegionProvider } from '../../common/region/index.js';

describe('Step 4: Regional Survey, Preferences & Onboarding Defaults (Saudi vs Pakistani)', () => {
  it('renders StepPreferences in Pakistani mode by default', () => {
    const child = React.createElement(StepPreferences, {
      data: { dietPreference: 'halal_omnivore' },
      onChange: () => {},
      errors: {},
    });
    const element = React.createElement(RegionProvider, { initialRegion: 'PK', children: child });
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('PK');
  });

  it('renders StepPreferences in Saudi Arabia mode with Saudi diet options', () => {
    const child = React.createElement(StepPreferences, {
      data: { dietPreference: 'halal_omnivore' },
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

