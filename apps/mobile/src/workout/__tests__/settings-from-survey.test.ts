import { describe, expect, it } from 'vitest';
import type { LifestyleSurveyPayload, SurveyExercise } from '../../survey/types.js';
import type { ComputedUserPlan } from '../../plan/types.js';
import { defaultWorkoutSettings } from '../settingsFromSurvey.js';

function survey(exercise: Partial<SurveyExercise> = {}, health: Partial<LifestyleSurveyPayload['healthClinical']> = {}) {
  return {
    exercise: { trainingType: 'gym_resistance', frequencyDaysPerWeek: 4, sessionDurationMins: 60, intensity: 'moderate', ...exercise },
    healthClinical: { medicalConditions: [], isPregnantOrBreastfeeding: false, medicalDisclaimerAccepted: true, ...health },
  } as unknown as LifestyleSurveyPayload;
}

const planWithGoal = (goal: 'lose' | 'maintain' | 'gain') => ({ goalSelection: { goal } }) as unknown as ComputedUserPlan;

describe('defaultWorkoutSettings', () => {
  it('maps the nutrition goal to a training goal', () => {
    expect(defaultWorkoutSettings({ plan: planWithGoal('lose') }).goal).toBe('fat_loss');
    expect(defaultWorkoutSettings({ plan: planWithGoal('gain') }).goal).toBe('muscle');
    expect(defaultWorkoutSettings({ plan: planWithGoal('maintain') }).goal).toBe('general');
    expect(defaultWorkoutSettings({}).goal).toBe('general');
  });

  it('puts gym-goers in the gym and everyone else at home with no equipment', () => {
    expect(defaultWorkoutSettings({ survey: survey() }).location).toBe('gym');
    for (const trainingType of ['home_calisthenics', 'cardio_running', 'sports_cricket_football', 'daily_brisk_walking', 'none'] as const) {
      expect(defaultWorkoutSettings({ survey: survey({ trainingType }) }).location, trainingType).toBe('home_none');
    }
  });

  it('spreads the surveyed number of days through the week, clamped to 2-6', () => {
    const days = (n: number) => defaultWorkoutSettings({ survey: survey({ frequencyDaysPerWeek: n }) }).trainingDays;
    expect(days(1)).toEqual(['mon', 'thu']);
    expect(days(2)).toEqual(['mon', 'thu']);
    expect(days(3)).toEqual(['mon', 'wed', 'fri']);
    expect(days(4)).toEqual(['mon', 'tue', 'thu', 'fri']);
    expect(days(5)).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
    expect(days(7)).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    expect(days(0)).toEqual(['mon', 'wed', 'fri']);
    expect(defaultWorkoutSettings({}).trainingDays).toEqual(['mon', 'wed', 'fri']);
  });

  it('snaps the session length to the nearest option', () => {
    const minutes = (m: number) => defaultWorkoutSettings({ survey: survey({ sessionDurationMins: m }) }).sessionMinutes;
    expect(minutes(10)).toBe(20);
    expect(minutes(35)).toBe(30);
    expect(minutes(50)).toBe(45);
    expect(minutes(90)).toBe(75);
    expect(minutes(0)).toBe(45);
    expect(defaultWorkoutSettings({}).sessionMinutes).toBe(45);
  });

  it('treats non-exercisers and light exercisers as new, and never assumes experienced', () => {
    expect(defaultWorkoutSettings({ survey: survey({ trainingType: 'none' }) }).experience).toBe('new');
    expect(defaultWorkoutSettings({ survey: survey({ intensity: 'light' }) }).experience).toBe('new');
    expect(defaultWorkoutSettings({ survey: survey({ intensity: 'moderate' }) }).experience).toBe('some');
    expect(defaultWorkoutSettings({ survey: survey({ intensity: 'high' }) }).experience).toBe('some');
    expect(defaultWorkoutSettings({}).experience).toBe('new');
  });

  it('caps intensity for pregnancy, breastfeeding or high blood pressure', () => {
    expect(defaultWorkoutSettings({ survey: survey({}, { isPregnantOrBreastfeeding: true }) }).lowIntensity).toBe(true);
    expect(defaultWorkoutSettings({ survey: survey({}, { medicalConditions: ['hypertension'] }) }).lowIntensity).toBe(true);
    expect(defaultWorkoutSettings({ survey: survey({}, { medicalConditions: ['diabetes_type_2'] }) }).lowIntensity).toBe(false);
    expect(defaultWorkoutSettings({}).lowIntensity).toBe(false);
  });

  it('starts with nothing optional selected and Ramadan mode off', () => {
    const s = defaultWorkoutSettings({ survey: survey() });
    expect(s.focus).toEqual([]);
    expect(s.protectedJoints).toEqual([]);
    expect(s.homeEquipment).toEqual([]);
    expect(s.ramadan).toEqual({ enabled: false });
  });
});
