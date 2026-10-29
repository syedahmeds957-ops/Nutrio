import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import { generateWeeklyPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import {
  canContinue,
  defaultLiftIds,
  liftRows,
  profileForSave,
  setLift,
  setTrainingNow,
  settingsForSave,
  toggleExercisePreference,
  toggleSport,
  toggleSportDay,
  updateProfile,
} from '../setupState.js';
import { supersetPlaces } from '../format.js';
import { buildWeekView, type DayView } from '../weekView.js';
import { ExercisePickerBody } from '../ui/ExercisePickerSheet.js';
import { TellUsMore } from '../ui/TellUsMore.js';
import { WorkoutDayScreen } from '../ui/WorkoutDayScreen.js';

initI18n('en');

const BASE: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'thu'],
  sessionMinutes: 60,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};
const noop = () => {};
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const more = (settings: WorkoutSettings, part: 1 | 2 | 3) => render(React.createElement(TellUsMore, { part, settings, update: noop }));

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('setup rules for "Tell us more"', () => {
  it('only step 3 can block Continue; the optional steps never do', () => {
    expect(canContinue(3, { ...BASE, trainingDays: ['mon'] })).toBe(false);
    for (const step of [4, 5, 6] as const) expect(canContinue(step, { ...BASE, trainingDays: ['mon'] })).toBe(true);
  });

  it('asks about the main lifts the equipment allows', () => {
    expect(defaultLiftIds(BASE)).toEqual(['barbell-bench-press', 'barbell-squat', 'wide-grip-lat-pulldown', 'dumbbell-shoulder-press']);
    expect(defaultLiftIds({ ...BASE, location: 'home_none' })).toEqual(['push-up', 'bodyweight-squat']);
    expect(defaultLiftIds({ ...BASE, location: 'home_none', protectedJoints: ['knee'] })).not.toContain('bodyweight-squat');
    const added = setLift(BASE, 'romanian-deadlift', {});
    expect(liftRows(added).at(-1)).toBe('romanian-deadlift');
  });

  it('keeps likes and dislikes apart', () => {
    let s = toggleExercisePreference(BASE, 'likes', 'barbell-row');
    s = toggleExercisePreference(s, 'dislikes', 'barbell-row');
    expect(s.profile).toMatchObject({ likes: [], dislikes: ['barbell-row'] });
  });

  it('saves only answers for the user’s own branch, and nothing when nothing was answered', () => {
    let s = updateProfile({ ...BASE, experience: 'new' }, { ability: { pushUps: '1_to_5' }, background: 'never' });
    s = setLift(s, 'barbell-bench-press', { loadKg: 60, reps: 8 });
    expect(profileForSave(s)).toEqual({ ability: { pushUps: '1_to_5' }, background: 'never' });
    // The same answers after switching to "some experience": lifts kept, beginner checks dropped.
    expect(profileForSave({ ...s, experience: 'some' })).toEqual({ lifts: [{ exerciseId: 'barbell-bench-press', loadKg: 60, reps: 8 }] });
    // A lift row with no reps and a sport with no days are left out.
    let blank = setLift(BASE, 'barbell-squat', { loadKg: 80 });
    blank = toggleSport(blank, 'cricket');
    expect(profileForSave(blank)).toBeUndefined();
    expect(settingsForSave(blank).profile).toBeUndefined();
    const cricket = toggleSportDay(toggleSport(BASE, 'cricket'), 'cricket', 'sat');
    expect(settingsForSave(cricket).profile).toEqual({ sports: [{ kind: 'cricket', days: ['sat'] }] });
  });
});

describe('the questions follow the user’s answers', () => {
  it('asks a beginner simple checks, never weights', () => {
    const html = more({ ...BASE, experience: 'new' }, 1);
    expect(html).toContain('Have you trained before?');
    expect(html).toContain('How many push-ups can you do in a row?');
    expect(html).toContain('How long can you hold a plank?');
    expect(html).not.toContain('Your current lifts');
    expect(html).not.toContain('Weight in kg');
  });

  it('offers a beginner who used to train regularly a step up', () => {
    const html = more(updateProfile({ ...BASE, experience: 'new' }, { background: 'used_to' }), 1);
    expect(html).toContain('Switch to &quot;Some experience&quot;');
  });

  it('asks someone training now about their routine and current lifts', () => {
    const html = more(setTrainingNow(BASE, { active: true }), 1);
    expect(html).toContain('How many days a week?');
    expect(html).toContain('What kind of routine?');
    expect(html).toContain('Your current lifts');
    expect(html).toContain('aria-label="Weight in kg for Barbell bench press"');
    expect(html).not.toContain('push-ups can you do');
  });

  it('asks someone who stopped how long ago, and what they used to lift', () => {
    const html = more(setTrainingNow(BASE, { active: false }), 1);
    expect(html).toContain('How long since you last trained?');
    expect(html).toContain('What you used to lift');
    expect(html).not.toContain('What kind of routine?');
  });

  it('asks cardio per day for people who train, and as a walking check for beginners', () => {
    const trained = more(BASE, 2);
    expect(trained).toContain('On a typical day, how much cardio do you do?');
    expect(trained).toContain('Exercises you like');
    const beginner = more({ ...BASE, experience: 'new' }, 2);
    expect(beginner).toContain('How long can you walk briskly without stopping?');
    expect(beginner).toContain('Leave out jumping exercises');
    expect(beginner).not.toContain('Exercises you like');
  });

  it('asks which days for each sport picked', () => {
    const html = more(toggleSport(BASE, 'cricket'), 3);
    expect(html).toContain('Cricket · which days?');
    expect(html).toContain('No heavy leg day on these days or the day before.');
    // A sport with no days is dropped on save, so the card says so until a day is picked.
    expect(html).toContain('Pick at least one day, or this won');
    expect(more(toggleSportDay(toggleSport(BASE, 'cricket'), 'cricket', 'sat'), 3)).not.toContain('Pick at least one day');
  });

  it('asks in Arabic', async () => {
    await i18n.changeLanguage('ar');
    expect(more({ ...BASE, experience: 'new' }, 1)).toContain('كم تمرين ضغط تستطيع متتالياً؟');
    expect(more(BASE, 2)).toContain('في يوم عادي، كم تمارس من الكارديو؟');
  });
});

describe('exercise picker', () => {
  it('finds exercises by name and marks ones already chosen', () => {
    const html = render(
      React.createElement(ExercisePickerBody, { title: 'Add a lift', settings: BASE, chosen: ['barbell-bench-press'], onPick: noop, onClose: noop, initialQuery: 'bench' })
    );
    expect(html).toContain('Barbell bench press');
    expect(html).toContain('Dumbbell bench press');
    expect(html).toContain('Added');
  });
});

describe('answers reach the plan', () => {
  it('starts the bench press from the user’s current lift', () => {
    const settings = settingsForSave(setLift(setTrainingNow(BASE, { active: true }), 'barbell-bench-press', { loadKg: 60, reps: 8 }));
    const plan = generateWeeklyPlan({ ...settings, trainingDays: ['mon', 'tue', 'thu', 'fri'] }, { seed: 2, today: '2026-10-19' });
    const benchDay = plan.sessions.find((s) => s.slots.some((slot) => slot.exerciseId === 'barbell-bench-press'));
    expect(benchDay).toBeDefined();
    const dates: Record<string, string> = { mon: '2026-10-19', tue: '2026-10-20', thu: '2026-10-22', fri: '2026-10-23' };
    const week = buildWeekView(plan, dates[benchDay!.day], 'PK');
    const day = week.today as DayView & { session: NonNullable<DayView['session']> };
    const html = render(
      React.createElement(WorkoutDayScreen, {
        plan, day, weekIndex: week.weekIndex, todayKey: day.dateKey, logs: [],
        onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop,
      })
    );
    expect(html).toContain('From your current lift: 60 kg × 8');
  });
});

describe('session style', () => {
  it('is asked of people who are not beginners, and not of beginners', () => {
    const experienced = more(BASE, 1);
    expect(experienced).toContain('How do you like to structure your sets?');
    expect(experienced).toContain('Supersets');
    expect(more({ ...BASE, experience: 'new' }, 1)).not.toContain('How do you like to structure your sets?');
  });

  it('is saved only as supersets, and dropped for beginners', () => {
    expect(profileForSave(updateProfile(BASE, { sessionStyle: 'supersets' }))?.sessionStyle).toBe('supersets');
    expect(profileForSave(updateProfile(BASE, { sessionStyle: 'straight' }))).toBeUndefined();
    expect(profileForSave(updateProfile({ ...BASE, experience: 'new' }, { sessionStyle: 'supersets' }))?.sessionStyle).toBeUndefined();
  });

  it('shows each superset pair on the day screen, in English and Arabic', async () => {
    const settings = settingsForSave(updateProfile({ ...BASE, trainingDays: ['mon', 'tue', 'thu', 'fri'] }, { sessionStyle: 'supersets' }));
    const plan = generateWeeklyPlan(settings, { seed: 3, today: '2026-10-19' });
    const session = plan.sessions.find((s) => s.slots.some((slot) => slot.supersetWith))!;
    const dates: Record<string, string> = { mon: '2026-10-19', tue: '2026-10-20', thu: '2026-10-22', fri: '2026-10-23' };
    const week = buildWeekView(plan, dates[session.day], 'PK');
    const day = week.today as DayView & { session: NonNullable<DayView['session']> };
    const draw = () =>
      render(React.createElement(WorkoutDayScreen, { plan, day, weekIndex: week.weekIndex, todayKey: day.dateKey, logs: [], onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop }));
    const pairs = session.slots.filter((slot) => slot.supersetWith).length / 2;

    const en = draw();
    expect(en.match(/\(1 of 2\)/g)).toHaveLength(pairs);
    expect(en.match(/\(2 of 2\)/g)).toHaveLength(pairs);
    expect(en).toContain('Superset 1 (1 of 2): go straight to the next exercise');

    await i18n.changeLanguage('ar');
    const ar = draw();
    expect(ar).toContain('سوبرسِت 1 (1 من 2): انتقل مباشرة إلى التمرين التالي');
    expect(ar).toContain('سوبرسِت 1 (2 من 2): ارتح بعد هذا التمرين ثم كرّر');
  });

  it('makes a plan with supersets and the day screen groups them', () => {
    const settings = settingsForSave(updateProfile(BASE, { sessionStyle: 'supersets' }));
    const plan = generateWeeklyPlan(settings, { seed: 3, today: '2026-10-19' });
    const session = plan.sessions.find((s) => s.slots.some((slot) => slot.supersetWith))!;
    expect(session).toBeDefined();
    const places = supersetPlaces(session.slots);
    for (const slot of session.slots.filter((s) => s.supersetWith)) {
      const place = places.get(slot.slotId)!;
      expect(places.get(slot.supersetWith!)!.group).toBe(place.group);
      expect(places.get(slot.supersetWith!)!.first).toBe(!place.first);
    }
    expect(session.slots.filter((s) => !s.supersetWith).every((s) => !places.has(s.slotId))).toBe(true);
  });
});

describe('"Tell us more" chips', () => {
  it('shows what the survey already answered as the selected radio, and groups each question', () => {
    const answered = setTrainingNow(BASE, { active: true, daysPerWeek: 4 });
    const html = more(answered, 1);
    expect(html).toContain('role="radiogroup"');
    // "Yes" and "4 days" are picked; nothing uses the invalid aria-selected on a button.
    expect(html.match(/aria-checked="true"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain('aria-selected');
  });

  it('keeps pick-any questions as pressed buttons', () => {
    const html = more(BASE, 2);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-pressed="false"');
  });
});
