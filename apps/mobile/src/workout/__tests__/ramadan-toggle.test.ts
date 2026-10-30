import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExercise, swapCandidates, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import { reasonText } from '../format.js';
import { createWorkoutPlan, setRamadanMode, swapExercise } from '../planActions.js';
import { setRamadanSlot, toggleRamadan } from '../setupState.js';
import { buildWeekView, type DayView } from '../weekView.js';
import { loadWorkoutLogs, releaseWorkoutLogCache, saveWorkoutLog } from '../workoutLogStorage.js';
import { releaseWorkoutCache } from '../workoutStorage.js';
import { RamadanCard } from '../ui/RamadanCard.js';
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
/** Ramadan 1448 runs 2027-02-08 to 2027-03-08 (Umm al-Qura). */
const IN_RAMADAN = '2027-02-18';
const RAMADAN_NOW = new Date('2027-02-15T08:00:00Z');
const THURSDAY = '2026-10-22';
const noop = () => {};
const render = (element: React.ReactElement) => renderToStaticMarkup(element);

beforeEach(async () => {
  releaseWorkoutCache();
  releaseWorkoutLogCache();
  await AsyncStorage.clear();
  saveAuthSession({
    token: 'tok_ramadan',
    user: { id: 'ramadan_user', name: 'R', email: 'r@nutrio.app', isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  });
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  await clearAuthSession();
});

describe('switching Ramadan mode on the week', () => {
  it('regenerates within the fasting caps, keeps logs and swaps that still fit, and switching off restores the plan', () => {
    const plan = createWorkoutPlan(SETTINGS, RAMADAN_NOW);
    const accessory = plan.sessions[0].slots.find((s) => s.role === 'accessory')!;
    const choice = swapCandidates(plan, accessory.slotId)[0].id;
    const swapped = swapExercise(plan, accessory.slotId, choice, 0);
    const log: WorkoutLog = { dateKey: '2026-10-19', day: 'mon', template: plan.sessions[0].template, exercises: [], startedAt: '', rating: 'right' };
    saveWorkoutLog(log, THURSDAY);

    const fasting = setRamadanMode(swapped, { enabled: true, slot: 'before_iftar' }, RAMADAN_NOW);
    for (const session of fasting.sessions) {
      expect(session.slots.length).toBeLessThanOrEqual(4);
      expect(session.estimatedMinutes).toBeLessThanOrEqual(45);
      expect(session.finisher).toBeUndefined();
      expect(session.cardio!.minutes).toBeLessThanOrEqual(10);
      expect(session.cardio!.intensity).toBe('easy');
      for (const slot of session.slots) {
        expect(slot.targetRir).toBeGreaterThanOrEqual(2);
        expect(getExercise(slot.exerciseId)!.highImpact).toBe(false);
      }
    }
    expect(fasting.seed).toBe(plan.seed);
    expect(fasting.blockStart).toBe(plan.blockStart);
    expect(loadWorkoutLogs()).toHaveLength(1);

    const back = setRamadanMode(fasting, { enabled: false, slot: 'before_iftar' }, RAMADAN_NOW);
    expect(back.sessions.map((s) => s.slots.length)).toEqual(plan.sessions.map((s) => s.slots.length));
    if (fasting.sessions[0].slots.some((s) => s.slotId === accessory.slotId)) expect(fasting.swaps[accessory.slotId]).toBe(choice);
    expect(back.swaps[accessory.slotId]).toBe(choice);
  });

  it('starts at "before iftar" and remembers the timing picked last', () => {
    const on = toggleRamadan(SETTINGS);
    expect(on.ramadan).toEqual({ enabled: true, slot: 'before_iftar' });
    const taraweeh = setRamadanSlot(on, 'after_taraweeh');
    const off = toggleRamadan(taraweeh);
    expect(off.ramadan).toEqual({ enabled: false, slot: 'after_taraweeh' });
    expect(toggleRamadan(off).ramadan).toEqual({ enabled: true, slot: 'after_taraweeh' });
  });
});

describe('Ramadan on screen', () => {
  const plan = createWorkoutPlan({ ...SETTINGS, ramadan: { enabled: true, slot: 'before_iftar' } }, RAMADAN_NOW);

  it('shows the switch, and the timing choice once it is on', () => {
    const off = render(React.createElement(RamadanCard, { ramadan: { enabled: false }, todayKey: THURSDAY, onChange: noop }));
    expect(off).toContain('Ramadan mode');
    expect(off).toContain('Shorter, gentler sessions on Ramadan days only');
    expect(off).toContain('Next Ramadan starts 8 Feb 2027');
    expect(off).not.toContain('When will you train?');
    const on = render(React.createElement(RamadanCard, { ramadan: { enabled: true, slot: 'after_suhoor' }, todayKey: THURSDAY, onChange: noop }));
    expect(on).toContain('When will you train?');
    expect(on).toContain('After suhoor');
    expect(on).toContain('After taraweeh');
  });

  it('badges the week and labels each training day with the timing', () => {
    const week = buildWeekView(plan, IN_RAMADAN, 'SA');
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: noop, onEdit: noop, onOpenDay: noop, onDoToday: noop, onRamadanChange: noop }));
    expect(html).toContain('Ramadan mode · Before iftar');
    expect(html.match(/>Before iftar</g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('gives the day guidance for the chosen timing, with gentler effort', () => {
    const week = buildWeekView(plan, IN_RAMADAN, 'SA');
    const day = week.today as DayView & { session: NonNullable<DayView['session']> };
    const html = render(
      React.createElement(WorkoutDayScreen, {
        plan, day, weekIndex: week.weekIndex, todayKey: IN_RAMADAN, logs: [],
        onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop,
      })
    );
    expect(html).toContain('Before iftar: keep it light. Break your fast with water and dates afterwards.');
    expect(html).toContain('Stop with 2 reps left');
  });

  it('explains held weights in English and Arabic', async () => {
    const target = { exerciseId: 'barbell-squat', sets: 3, repMin: 8, repMax: 12, reps: 12, loadKg: 60, reason: 'ramadan_hold' as const };
    expect(reasonText(i18n.t, target, true)).toBe("Ramadan: same weight while you're fasting");
    expect(reasonText(i18n.t, target, false)).toBe("Ramadan: same move while you're fasting");
    await i18n.changeLanguage('ar');
    expect(reasonText(i18n.t, target, true)).toBe('رمضان: الوزن نفسه أثناء الصيام');
    const html = render(React.createElement(RamadanCard, { ramadan: { enabled: true, slot: 'after_taraweeh' }, todayKey: IN_RAMADAN, onChange: noop }));
    expect(html).toContain('بعد التراويح');
    expect(html).toContain('قبل الإفطار');
    expect(html).toContain('بعد السحور');
  });
});

describe('only during Ramadan', () => {
  const october = new Date('2026-10-19T08:00:00Z');

  it('keeps a normal plan the rest of the year, even with Ramadan mode on', () => {
    const plan = createWorkoutPlan({ ...SETTINGS, ramadan: { enabled: true, slot: 'before_iftar' } }, october);
    expect(plan.fasting).toBe(false);
    expect(plan.settings.ramadan.enabled).toBe(true);
    expect(Math.max(...plan.sessions.map((s) => s.slots.length))).toBeGreaterThan(4);
    const week = buildWeekView(plan, THURSDAY, 'PK');
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: noop, onEdit: noop, onOpenDay: noop, onDoToday: noop, onRamadanChange: noop }));
    expect(html).not.toContain('Ramadan mode · ');
    // Months away from Ramadan, the switch lives in Edit plan, not on the week.
    expect(html).not.toContain('Shorter, gentler sessions on Ramadan days only');
  });

  it('offers the switch on the week in the month before Ramadan', () => {
    const plan = createWorkoutPlan(SETTINGS, new Date('2027-01-20T08:00:00Z'));
    const week = buildWeekView(plan, '2027-01-20', 'PK');
    const html = render(React.createElement(WorkoutWeekScreen, { plan, week, onBack: noop, onEdit: noop, onOpenDay: noop, onDoToday: noop, onRamadanChange: noop }));
    expect(html).toContain('Next Ramadan starts 8 Feb 2027');
  });

  it('says when it turns on, or that it is on now', () => {
    const waiting = render(React.createElement(RamadanCard, { ramadan: { enabled: true, slot: 'before_iftar' }, todayKey: THURSDAY, onChange: noop }));
    expect(waiting).toContain('Turns on by itself on 8 Feb 2027, and off after Eid');
    const now = render(React.createElement(RamadanCard, { ramadan: { enabled: true, slot: 'before_iftar' }, todayKey: IN_RAMADAN, onChange: noop }));
    expect(now).toContain('On now · until 8 Mar 2027');
  });
});
