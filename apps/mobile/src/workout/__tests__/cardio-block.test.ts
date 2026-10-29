import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, getExercise, type WeeklyWorkoutPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import { cardioText } from '../format.js';
import { buildWeekView, cardioForWeek, type DayView } from '../weekView.js';
import { createDraft, draftStats, draftToLog, setActiveDraft, setReps, targetsForSession, toggleSet } from '../workoutDraft.js';
import { flushWorkoutWrites, hydrateWorkoutPlan, loadWorkoutPlan, releaseWorkoutCache } from '../workoutStorage.js';
import { TodayWorkoutCard } from '../ui/TodayWorkoutCard.js';
import { WorkoutDayScreen } from '../ui/WorkoutDayScreen.js';
import { WorkoutWeekScreen } from '../ui/WorkoutWeekScreen.js';

initI18n('en');

const THURSDAY = '2026-10-22';
const SATURDAY = '2026-10-24';
const SETTINGS: WorkoutSettings = {
  goal: 'fat_loss',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'thu'],
  sessionMinutes: 45,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};

type SessionDay = DayView & { session: NonNullable<DayView['session']> };
const noop = () => {};
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });

function today(p: WeeklyWorkoutPlan, key = THURSDAY, logs: Parameters<typeof buildWeekView>[3] = []) {
  const week = buildWeekView(p, key, 'PK', logs);
  return { week, day: week.today as SessionDay };
}
const dayScreen = (p: WeeklyWorkoutPlan, extra: Partial<React.ComponentProps<typeof WorkoutDayScreen>> = {}) => {
  const { week, day } = today(p);
  return render(
    React.createElement(WorkoutDayScreen, {
      plan: p, day, weekIndex: week.weekIndex, todayKey: THURSDAY, logs: [],
      onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop, ...extra,
    })
  );
};

beforeEach(async () => {
  releaseWorkoutCache();
  setActiveDraft(null);
  await AsyncStorage.clear();
  saveAuthSession({
    token: 'tok_cardio',
    user: { id: 'cardio_user', name: 'Cardio', email: 'cardio@nutrio.app', isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  });
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  await clearAuthSession();
});

describe('day screen', () => {
  const cardio = today(plan).day.session.cardio!;
  const name = getExercise(cardio.exerciseId)!.name.en;

  it('ends the session with the cardio card: move, minutes, pace, talk test and a swap menu', () => {
    const html = dayScreen(plan);
    expect(html).toContain('Cardio');
    expect(html).toContain(name);
    expect(html).toContain('15 min · moderate pace');
    expect(html).toContain('Moderate: you can talk in short sentences');
    expect(html).toContain(`aria-label="Options for ${name}"`);
    expect(html).toContain('6 exercises');
  });

  it('logs cardio as one row of minutes with its own tick', () => {
    const html = dayScreen(plan, { autoStart: true });
    expect(html).toContain('aria-label="Cardio minutes"');
    expect(html).toContain('aria-label="Cardio done"');
    expect(html).not.toContain(`Options for ${name}`);
  });

  it('counts cardio minutes apart from sets, and shows them on a done day', () => {
    const { week, day } = today(plan);
    const targets = targetsForSession(plan, day.session, week.weekIndex, []);
    let draft = createDraft(day.session, targets, THURSDAY, new Date(), cardioForWeek(plan, day.session, week.weekIndex));
    const last = draft.exercises.length - 1;
    draft = setReps(draft, last, 0, 18);
    draft = toggleSet(draft, last, 0);
    expect(draftStats(draft)).toMatchObject({ setsDone: 0, cardioMinutes: 18 });

    const logs = [draftToLog(draft, 'right', new Date())];
    const done = today(plan, THURSDAY, logs);
    const html = render(
      React.createElement(WorkoutDayScreen, {
        plan, day: done.day, weekIndex: done.week.weekIndex, todayKey: THURSDAY, logs,
        onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop,
      })
    );
    expect(html).toContain('Cardio · 18 min');
  });

  it('shows interval moves as 30 s on, 30 s off once swapped to them', () => {
    const intervals = cardio.alternates.find((id) => getExercise(id)!.pattern === 'conditioning')!;
    const html = dayScreen({ ...plan, swaps: { [cardio.slotId]: intervals } });
    expect(html).toContain('15 min · 30 s on, 30 s off');
    expect(html).toContain('Swapped');
  });
});

describe('week and dashboard', () => {
  it("lists cardio last in today's workout", () => {
    const { week } = today(plan);
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: noop, onEdit: noop, onOpenDay: noop, onDoToday: noop }));
    expect(html).toContain('15 min · moderate pace');
    expect(html).toContain('Optional: 20–30 min walk');
  });

  it('suggests a walk on rest days, on the week and the dashboard card', () => {
    const { week } = today(plan, SATURDAY);
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: noop, onEdit: noop, onOpenDay: noop, onDoToday: noop }));
    expect(html).toContain('Rest day today');
    expect(html).toContain('Optional: 20–30 min walk');
    const card = render(React.createElement(TodayWorkoutCard, { plan, todayKey: SATURDAY, onSetUp: noop, onOpenDay: noop, onSeeWeek: noop }));
    expect(card).toContain('Optional: 20–30 min walk');
  });

  it('reads cardio in Arabic', async () => {
    await i18n.changeLanguage('ar');
    expect(cardioText(i18n.t, { minutes: 15, intensity: 'moderate' }, false)).toBe('15 دقيقة · وتيرة متوسطة');
    expect(i18n.t('workout.cardio.walk', { min: 20, max: 30 })).toBe('اختياري: مشي ‎20–30‎ دقيقة');
  });
});

describe('plans saved before the cardio block', () => {
  it('come back with cardio after a cold start, saved for next time', async () => {
    const old = { ...plan, sessions: plan.sessions.map(({ cardio: _cardio, ...session }) => session) } as WeeklyWorkoutPlan;
    delete old.restDayWalk;
    await AsyncStorage.setItem('nutrio_workout_plan_cardio_user', JSON.stringify(old));

    await hydrateWorkoutPlan();
    const loaded = loadWorkoutPlan()!;
    expect(loaded.sessions.every((s) => s.cardio)).toBe(true);
    expect(loaded.seed).toBe(old.seed);
    await flushWorkoutWrites();
    const stored = JSON.parse((await AsyncStorage.getItem('nutrio_workout_plan_cardio_user'))!) as WeeklyWorkoutPlan;
    expect(stored.restDayWalk).toBeDefined();
  });
});
