import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import { describeRoutineChanges, generateWeeklyPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import {
  addRoutineExercise,
  clearRoutine,
  moveRoutineExercise,
  removeRoutineExercise,
  routineOf,
  routineReady,
  setRoutineExercise,
  setTrainingNow,
  settingsForSave,
  toggleRoutineDay,
} from '../setupState.js';
import { ImprovedScreen } from '../ui/ImprovedScreen.js';
import { RoutineBuilder } from '../ui/RoutineBuilder.js';
import { TellUsMore } from '../ui/TellUsMore.js';

initI18n('en');

const BASE: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'thu'],
  sessionMinutes: 60,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};
const noop = () => {};
const render = (element: React.ReactElement) => renderToStaticMarkup(element);

/** A two-day routine: Monday chest and arms, Thursday legs and back. */
function twoDays(settings: WorkoutSettings = setTrainingNow(BASE, { active: true })): WorkoutSettings {
  let s = addRoutineExercise(settings, 'mon', 'barbell-bench-press');
  s = addRoutineExercise(s, 'mon', 'barbell-curl');
  s = addRoutineExercise(s, 'thu', 'barbell-squat');
  s = addRoutineExercise(s, 'thu', 'seated-cable-row');
  return s;
}

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('routine builder rules', () => {
  it('starts from the training days and edits each day’s list', () => {
    let s = twoDays();
    expect(routineOf(s).days.map((d) => d.day)).toEqual(['mon', 'thu']);
    s = addRoutineExercise(s, 'mon', 'barbell-bench-press');
    expect(routineOf(s).days[0].exercises).toHaveLength(2);
    s = moveRoutineExercise(s, 'mon', 1, -1);
    expect(routineOf(s).days[0].exercises.map((e) => e.exerciseId)).toEqual(['barbell-curl', 'barbell-bench-press']);
    s = setRoutineExercise(s, 'mon', 0, { sets: 4, reps: 12 });
    expect(routineOf(s).days[0].exercises[0]).toMatchObject({ sets: 4, reps: 12 });
    s = removeRoutineExercise(s, 'mon', 0);
    expect(routineOf(s).days[0].exercises.map((e) => e.exerciseId)).toEqual(['barbell-bench-press']);
  });

  it('needs 2–6 days, each with an exercise, and keeps days in week order', () => {
    let s = twoDays();
    expect(routineReady(routineOf(s))).toBe(true);
    s = toggleRoutineDay(s, 'sat');
    expect(routineReady(routineOf(s))).toBe(false);
    s = toggleRoutineDay(s, 'tue');
    expect(routineOf(s).days.map((d) => d.day)).toEqual(['mon', 'tue', 'thu', 'sat']);
    for (const day of ['wed', 'fri', 'sun'] as const) s = toggleRoutineDay(s, day);
    expect(routineOf(s).days).toHaveLength(6);
  });

  it('saves the routine’s days as the training days, and drops the routine for beginners or when cleared', () => {
    let s = toggleRoutineDay(twoDays(), 'sat');
    s = addRoutineExercise(s, 'sat', 'romanian-deadlift');
    expect(settingsForSave(s).trainingDays).toEqual(['mon', 'thu', 'sat']);
    expect(settingsForSave(s).profile?.routine?.days).toHaveLength(3);
    expect(settingsForSave({ ...s, experience: 'new' }).profile?.routine).toBeUndefined();
    expect(settingsForSave(clearRoutine(s)).profile?.routine).toBeUndefined();
  });
});

describe('routine builder screen', () => {
  it('shows days, each day’s exercises with sets and reps, and holds Improve until ready', () => {
    const ready = render(React.createElement(RoutineBuilder, { settings: twoDays(), update: noop, onBack: noop, onImprove: noop }));
    expect(ready).toContain('Which days do you train?');
    expect(ready).toContain('Barbell bench press');
    expect(ready).toContain('aria-label="Sets for Barbell bench press"');
    expect(ready).toContain('Improve my routine');
    expect(ready).not.toContain('Add 2–6 days');
    const empty = render(React.createElement(RoutineBuilder, { settings: BASE, update: noop, onBack: noop, onImprove: noop }));
    expect(empty).toContain('Add 2–6 days, each with at least one exercise.');
    expect(empty).toMatch(/aria-disabled="true"[^>]*>[\s\S]*Improve my routine/);
  });

  it('is offered from "Tell us more" to people training now', () => {
    const html = render(React.createElement(TellUsMore, { part: 1, settings: setTrainingNow(BASE, { active: true }), update: noop, onOpenRoutine: noop }));
    expect(html).toContain('Already follow a routine?');
    const stopped = render(React.createElement(TellUsMore, { part: 1, settings: setTrainingNow(BASE, { active: false }), update: noop, onOpenRoutine: noop }));
    expect(stopped).not.toContain('Already follow a routine?');
  });
});

describe('What we improved', () => {
  const settings = settingsForSave(twoDays(setTrainingNow({ ...BASE, protectedJoints: ['knee'] }, { active: true })));
  const plan = generateWeeklyPlan(settings, { seed: 3, today: '2026-10-19' });
  const changes = describeRoutineChanges(settings.profile!.routine!, plan);

  it('lists what was kept, changed and added, each with its reason', () => {
    const html = render(React.createElement(ImprovedScreen, { plan, changes, onDone: noop }));
    expect(html).toContain('What we improved');
    expect(html).toContain('Kept');
    expect(html).toContain('Your days: Mon, Thu');
    expect(html).toContain('Changed');
    expect(html).toContain('Barbell back squat');
    expect(html).not.toContain('Left out: Barbell back squat');
    expect(html).toContain('Loads a joint you asked us to protect.');
    expect(html).toContain('Added');
    expect(html).toContain('min after each session');
    expect(html).toContain('See my plan');
  });

  it('reads in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const html = render(React.createElement(ImprovedScreen, { plan, changes, onDone: noop }));
    expect(html).toContain('ما الذي حسّنّاه');
    expect(html).toContain('يضغط على مفصل طلبت حمايته.');
  });
});
