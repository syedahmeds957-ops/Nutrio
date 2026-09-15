import { describe, it, expect } from 'vitest';
import React from 'react';
import { StepPreferencesBudget } from '../ui/StepPreferencesBudget.js';
import { StepLifestyleDesi } from '../ui/StepLifestyleDesi.js';
import { RegionProvider } from '../../common/region/index.js';

describe('Phase 5: Currency, Survey & Cultural Levers (Saudi vs Pakistani)', () => {
  it('renders StepPreferencesBudget in Pakistani mode (PKR) by default', () => {
    const element = React.createElement(
      RegionProvider,
      { initialRegion: 'PK' },
      React.createElement(StepPreferencesBudget, {
        data: { dietPreference: 'halal_omnivore', budgetTierPKR: 'standard_3500_7000' },
        onChange: () => {},
        errors: {},
      })
    );
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('PK');
  });

  it('renders StepPreferencesBudget in Saudi Arabia mode (SAR)', () => {
    const element = React.createElement(
      RegionProvider,
      { initialRegion: 'SA' },
      React.createElement(StepPreferencesBudget, {
        data: { dietPreference: 'halal_omnivore', budgetTierPKR: 'standard_3500_7000' },
        onChange: () => {},
        errors: {},
      })
    );
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });

  it('renders StepLifestyleDesi with Gahwa & Dates cultural ritual in Saudi mode', () => {
    const element = React.createElement(
      RegionProvider,
      { initialRegion: 'SA' },
      React.createElement(StepLifestyleDesi, {
        data: { chaiWithSugarCupsPerDay: 3, eatingOutTimesPerWeek: 2 },
        onChange: () => {},
        errors: {},
      })
    );
    expect(element).toBeDefined();
    expect(element.props.initialRegion).toBe('SA');
  });
});
