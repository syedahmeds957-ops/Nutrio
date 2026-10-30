import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { RegionProvider } from '../../common/region/index.js';
import { AnalysisView } from '../ui/AnalysisView.js';
import { planUserContextFromSurvey } from '../userContext.js';
import type { LifestyleSurveyPayload } from '../../survey/types.js';

const survey: LifestyleSurveyPayload = {
  version: 1,
  basics: { sex: 'female', ageYears: 28, heightCm: 165, weightKg: 62 },
  occupational: { jobCategory: 'desk_sedentary', workingHoursPerDay: 8, shiftPattern: 'regular_day', dailySittingHours: 8, commuteType: 'car_cab' },
  exercise: { trainingType: 'gym_resistance', frequencyDaysPerWeek: 3, sessionDurationMins: 60, intensity: 'moderate' },
  lifestyleDesi: { sleepHoursPerNight: 7, stressRating: 3, chaiWithSugarCupsPerDay: 2, eatingOutTimesPerWeek: 2, whoCooksAtHome: 'family_traditional', dailyWaterLitres: 2.5, lateNightEating: false, smoker: false },
  healthClinical: { medicalConditions: [], isPregnantOrBreastfeeding: false, medicalDisclaimerAccepted: true },
  preferencesBudget: { dietPreference: 'halal_omnivore', dislikedFoods: [] },
};

describe('energy screen back navigation', () => {
  it('has one Back button, not one at the top and another beside the main action', () => {
    initI18n('en');
    const html = renderToStaticMarkup(
      React.createElement(
        RegionProvider,
        null,
        React.createElement(AnalysisView, {
          context: planUserContextFromSurvey(survey),
          narrative: undefined as never,
          onProceedToGoal: () => {},
          onBack: () => {},
        })
      )
    );
    expect(html.match(/aria-label="Back"/g)?.length).toBe(1);
  });
});
