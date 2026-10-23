import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, type WorkoutSettings } from '@nutrio/workout-core';
import i18n from 'i18next';
import { initI18n } from '../../i18n/config.js';

initI18n('en');
import { createWorkoutPlan, updateWorkoutPlan } from '../planActions.js';
import {
  canContinue,
  settingsForEdit,
  settingsForSave,
  toggleDay,
  toggleDumbbell,
  toggleEquipment,
} from '../setupState.js';
import { sessionTitle } from '../sessionTitle.js';
import { loadWorkoutPlan, releaseWorkoutCache } from '../workoutStorage.js';
import { WorkoutSetupScreen } from '../ui/WorkoutSetupScreen.js';
import { WorkoutWeekScreen } from '../ui/WorkoutWeekScreen.js';
import { buildWeekView } from '../weekView.js';

const BASE: WorkoutSettings = {
  goal: 'general',
  experience: 'new',
  location: 'home_none',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'fri'],
  sessionMinutes: 45,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};

describe('setup rules', () => {
  it('blocks "Create my plan" with fewer than two days', () => {
    expect(canContinue(3, BASE)).toBe(true);
    const oneDay = { ...BASE, trainingDays: ['mon' as const] };
    expect(canContinue(3, oneDay)).toBe(false);
    expect(canContinue(1, oneDay)).toBe(true);
    expect(canContinue(2, oneDay)).toBe(true);
  });

  it('stops at six training days', () => {
    let s = { ...BASE, trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as WorkoutSettings['trainingDays'] };
    s = toggleDay(s, 'sun');
    expect(s.trainingDays).toHaveLength(6);
    s = toggleDay(s, 'sat');
    expect(s.trainingDays).toHaveLength(5);
  });

  it('forgets dumbbell weights when dumbbells are deselected', () => {
    let s = toggleEquipment({ ...BASE, location: 'home_equipment' }, 'dumbbell');
    s = toggleDumbbell(toggleDumbbell(s, 10), 4);
    expect(s.dumbbellWeightsKg).toEqual([4, 10]);
    s = toggleEquipment(s, 'dumbbell');
    expect(s.dumbbellWeightsKg).toEqual([]);
  });

  it('saves only what applies to the chosen location, with "adjustable" as no fixed weights', () => {
    const atGym = settingsForSave({ ...BASE, location: 'gym', homeEquipment: ['dumbbell'], dumbbellWeightsKg: [4] });
    expect(atGym.homeEquipment).toEqual([]);
    expect(atGym.dumbbellWeightsKg).toEqual([]);

    const adjustable = settingsForSave({ ...BASE, location: 'home_equipment', homeEquipment: ['dumbbell'], dumbbellWeightsKg: [0, 6] });
    expect(adjustable.dumbbellWeightsKg).toEqual([6]);
    expect(settingsForEdit({ ...adjustable, dumbbellWeightsKg: [] }).dumbbellWeightsKg).toEqual([0]);
  });
});

describe('saving a plan from setup', () => {
  beforeEach(async () => {
    releaseWorkoutCache();
    await AsyncStorage.clear();
  });

  it('stores a plan whose settings match the answers', () => {
    const answers = { ...BASE, location: 'home_equipment' as const, homeEquipment: ['dumbbell' as const, 'bench' as const], dumbbellWeightsKg: [4, 8] };
    const plan = createWorkoutPlan(answers, new Date('2026-10-23T09:00:00Z'));
    expect(plan.settings).toEqual(answers);
    expect(plan.blockStart).toBe('2026-10-23');
    expect(plan.sessions.map((s) => s.day)).toEqual(['mon', 'wed', 'fri']);
    expect(loadWorkoutPlan()).toEqual(plan);
  });

  it('keeps the seed and start date when the plan is edited', () => {
    const first = createWorkoutPlan(BASE, new Date('2026-10-23T09:00:00Z'));
    const edited = updateWorkoutPlan(first, { ...BASE, sessionMinutes: 60 }, new Date('2026-11-02T09:00:00Z'));
    expect(edited.seed).toBe(first.seed);
    expect(edited.blockStart).toBe('2026-10-23');
    expect(edited.settings.sessionMinutes).toBe(60);
    expect(loadWorkoutPlan()?.settings.sessionMinutes).toBe(60);
  });
});

describe('workout screens render in English and Arabic', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows step 1 of setup with every goal', async () => {
    for (const [language, goal, cta] of [
      ['en', 'Build muscle', 'Continue'],
      ['ar', 'بناء العضل', ''],
    ] as const) {
      await i18n.changeLanguage(language);
      const html = renderToStaticMarkup(
        React.createElement(WorkoutSetupScreen, { mode: 'create', prefilled: true, initialSettings: BASE, onCancel: () => {}, onSave: () => {} })
      );
      expect(html, language).toContain(goal);
      expect(html, language).toContain(i18n.t('workout.setup.step', { current: 1, total: 3 }));
      expect(html, language).toContain(i18n.t('workout.setup.prefillNote'));
      if (cta) expect(html).toContain(cta);
    }
  });

  it('only claims the answers came from the survey when they did', () => {
    const render = (prefilled: boolean) =>
      renderToStaticMarkup(
        React.createElement(WorkoutSetupScreen, { mode: 'create', prefilled, initialSettings: BASE, onCancel: () => {}, onSave: () => {} })
      );
    expect(render(true)).toContain(i18n.t('workout.setup.prefillNote'));
    expect(render(false)).not.toContain(i18n.t('workout.setup.prefillNote'));
  });

  it('lists the saved week with session titles and exercise names', async () => {
    const plan = generateWeeklyPlan({ ...BASE, location: 'gym', trainingDays: ['mon', 'tue', 'thu', 'fri'] }, { seed: 3, today: '2026-10-19' });
    const week = buildWeekView(plan, '2026-10-19', 'PK');
    const html = renderToStaticMarkup(
      React.createElement(WorkoutWeekScreen, { plan, week, onBack: () => {}, onEdit: () => {}, onOpenDay: () => {}, onDoToday: () => {} })
    );
    expect(html).toContain('Upper body A');
    expect(html).toContain('Lower body B');
    expect(html).toContain('Edit plan');

    await i18n.changeLanguage('ar');
    expect(sessionTitle(i18n.t, plan.sessions[0])).toBe('الجزء العلوي A');
  });

  it('numbers a full-body day that runs twice in one week', () => {
    expect(sessionTitle(i18n.t, { template: 'full_a', variant: 'a' })).toBe('Full body A');
    expect(sessionTitle(i18n.t, { template: 'full_a', variant: 'b' })).toBe('Full body A 2');
    expect(sessionTitle(i18n.t, { template: 'push', variant: null })).toBe('Push');
  });
});
