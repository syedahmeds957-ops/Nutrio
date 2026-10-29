import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import { generateWeeklyPlan, getExercise, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { dateText, effortText, prescriptionText, setsRepsText } from '../format.js';
import { buildWeekView } from '../weekView.js';
import { TodayWorkoutCard } from '../ui/TodayWorkoutCard.js';
import { WorkoutDayScreen } from '../ui/WorkoutDayScreen.js';
import { WorkoutWeekScreen } from '../ui/WorkoutWeekScreen.js';

initI18n('en');

const SETTINGS: WorkoutSettings = {
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

const THURSDAY = '2026-10-22';
const SATURDAY = '2026-10-24';
const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const nameOf = (id: string) => getExercise(id)!.name.en;

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('formatting', () => {
  const slot = plan.sessions[0].slots[0];

  it('writes prescriptions, effort and dates in English and Arabic', async () => {
    expect(prescriptionText(i18n.t, slot)).toBe('3 × 8–12 · 90 s rest');
    expect(setsRepsText(i18n.t, slot)).toBe('3 sets × 8–12');
    expect(effortText(i18n.t, slot)).toBe('Stop with 1–2 reps left');
    expect(effortText(i18n.t, { ...slot, targetRir: 3 })).toBe('Stop with 3 reps left');
    expect(effortText(i18n.t, { ...slot, unit: 'seconds' })).toBe('Hold with good form the whole time');
    expect(prescriptionText(i18n.t, { ...slot, unit: 'seconds', repMin: 30, repMax: 45 })).toBe('3 × 30–45 s · 90 s rest');
    expect(dateText(i18n.t, 'thu', 22, 9)).toBe('Thu 22 Oct');

    await i18n.changeLanguage('ar');
    // Left-to-right marks keep the range reading 8–12 inside Arabic text instead of flipping to 12–8.
    expect(prescriptionText(i18n.t, slot)).toBe('3 × \u200e8–12\u200e · راحة 90 ث');
    expect(setsRepsText(i18n.t, { ...slot, sets: 2 })).toBe('مجموعتان × \u200e8–12\u200e');
    expect(effortText(i18n.t, { ...slot, targetRir: 2 })).toBe('توقف وقد بقي لديك تكراران');
    expect(dateText(i18n.t, 'thu', 22, 9)).toBe('الخميس 22 أكتوبر');
  });
});

describe('WorkoutWeekScreen', () => {
  it('opens on today with every exercise, then the week', () => {
    const week = buildWeekView(plan, THURSDAY, 'PK');
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: () => {}, onEdit: () => {}, onOpenDay: () => {}, onDoToday: () => {} }));
    expect(html).toContain("Today&#x27;s workout");
    for (const slot of week.today.session!.slots) expect(html).toContain(nameOf(slot.exerciseId));
    expect(html).toContain('Start workout');
    expect(html).toContain('This week');
    expect(html).toContain('Week 1');
    expect(html).toContain('Rest day');
    expect(html).not.toMatch(/Breakfast|kcal/);
  });

  it('shows a rest-day card with the next session when today is a rest day', () => {
    const week = buildWeekView(plan, SATURDAY, 'PK');
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: () => {}, onEdit: () => {}, onOpenDay: () => {}, onDoToday: () => {} }));
    expect(html).toContain('Rest day today');
    expect(html).toContain('Next: Full body A on Mon');
    expect(html).not.toContain('Start workout');
  });

  it('renders in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const week = buildWeekView(plan, THURSDAY, 'SA');
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: () => {}, onEdit: () => {}, onOpenDay: () => {}, onDoToday: () => {} }));
    expect(html).toContain('تمرين اليوم');
    expect(html).toContain('هذا الأسبوع');
    expect(html).toContain('ابدأ التمرين');
  });
});

const dayProps = { todayKey: THURSDAY, logs: [], onBack: () => {}, onSaved: () => {}, onSwap: () => {}, onResetSwap: () => {} };

describe('WorkoutDayScreen', () => {
  it('lists each exercise with prescription, effort and a first-time target, with Start ready', () => {
    const week = buildWeekView(plan, THURSDAY, 'PK');
    const day = week.today as typeof week.today & { session: NonNullable<typeof week.today.session> };
    const html = render(React.createElement(WorkoutDayScreen, { ...dayProps, plan, day, weekIndex: week.weekIndex }));
    expect(html).toContain('Thu 22 Oct');
    for (const slot of day.session.slots) expect(html).toContain(nameOf(slot.exerciseId));
    expect(html).toContain('3 × 8–12 · 90 s rest');
    expect(html).toContain('Stop with 1–2 reps left');
    expect(html).toContain('— kg × 8–12');
    expect(html).toContain('First time: pick a weight you could lift 12 times');
    expect(html).toContain('Start workout');
    expect(html).not.toContain('aria-disabled="true"');
  });

  it('ends a fat-loss session with the cardio block instead of a finisher', () => {
    const fatLoss = generateWeeklyPlan({ ...SETTINGS, goal: 'fat_loss', sessionMinutes: 45 }, { seed: 5, today: '2026-10-19' });
    const week = buildWeekView(fatLoss, THURSDAY, 'PK');
    const day = week.today as typeof week.today & { session: NonNullable<typeof week.today.session> };
    const html = render(React.createElement(WorkoutDayScreen, { ...dayProps, plan: fatLoss, day, weekIndex: 0 }));
    expect(html).toContain('Cardio');
    expect(html).toContain('15 min · moderate pace');
    expect(html).toContain('Moderate: you can talk in short sentences');
    expect(html).not.toContain('Finisher');
  });
});

describe('TodayWorkoutCard', () => {
  const props = { onSetUp: () => {}, onOpenDay: () => {}, onSeeWeek: () => {} };

  it('invites setup when there is no plan', () => {
    const html = render(React.createElement(TodayWorkoutCard, { ...props, plan: null, todayKey: THURSDAY }));
    expect(html).toContain('Get a weekly workout plan');
    expect(html).toContain('Set up workouts');
  });

  it('offers Start on a training day', () => {
    const html = render(React.createElement(TodayWorkoutCard, { ...props, plan, todayKey: THURSDAY }));
    expect(html).toContain('Full body C');
    expect(html).toContain('Start');
  });

  it('names the next session on a rest day', () => {
    const html = render(React.createElement(TodayWorkoutCard, { ...props, plan, todayKey: SATURDAY }));
    expect(html).toContain('Rest day');
    expect(html).toContain('Next: Full body A on Mon');
    expect(html).toContain('See the week');
  });
});
