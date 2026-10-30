import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  exerciseForWeek,
  generateWeeklyPlan,
  getExercise,
  swapCandidates,
  type WeeklyWorkoutPlan,
  type WorkoutSettings,
} from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import { equipmentText } from '../format.js';
import { resetExercise, swapExercise } from '../planActions.js';
import { buildWeekView, type DayView } from '../weekView.js';
import { flushWorkoutWrites, hydrateWorkoutPlan, loadWorkoutPlan, releaseWorkoutCache } from '../workoutStorage.js';
import { setActiveDraft } from '../workoutDraft.js';
import { SwapSheetBody } from '../ui/SwapSheet.js';
import { WorkoutDayScreen } from '../ui/WorkoutDayScreen.js';

initI18n('en');

const THURSDAY = '2026-10-22';
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

type SessionDay = DayView & { session: NonNullable<DayView['session']> };
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const noop = () => {};

function todayOf(plan: WeeklyWorkoutPlan) {
  const week = buildWeekView(plan, THURSDAY, 'PK', []);
  return { week, day: week.today as SessionDay };
}

const dayScreen = (plan: WeeklyWorkoutPlan, extra: Partial<React.ComponentProps<typeof WorkoutDayScreen>> = {}) => {
  const { week, day } = todayOf(plan);
  return render(
    React.createElement(WorkoutDayScreen, {
      plan, day, weekIndex: week.weekIndex, todayKey: THURSDAY, logs: [],
      onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop, ...extra,
    })
  );
};

beforeEach(async () => {
  releaseWorkoutCache();
  setActiveDraft(null);
  await AsyncStorage.clear();
  saveAuthSession({
    token: 'tok_swap',
    user: { id: 'swap_user', name: 'Swap', email: 'swap@nutrio.app', isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  });
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  await clearAuthSession();
});

describe('choosing a swap', () => {
  it('applies, saves for this user, survives a cold start, and reset restores the original', async () => {
    const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
    const { day } = todayOf(plan);
    const slot = day.session.slots[0];
    const choice = swapCandidates(plan, slot.slotId)[0].id;

    const swapped = swapExercise(plan, slot.slotId, choice, 0);
    expect(exerciseForWeek(swapped, slot.slotId, 0)).toBe(choice);
    await flushWorkoutWrites();
    releaseWorkoutCache();
    await hydrateWorkoutPlan();
    expect(loadWorkoutPlan()?.swaps[slot.slotId]).toBe(choice);

    const reset = resetExercise(swapped, slot.slotId);
    expect(exerciseForWeek(reset, slot.slotId, 0)).toBe(slot.exerciseId);
    expect(loadWorkoutPlan()?.swaps[slot.slotId]).toBeUndefined();
  });

  it('refuses an exercise that is not on the list', () => {
    const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
    const slot = todayOf(plan).day.session.slots[0];
    expect(() => swapExercise(plan, slot.slotId, slot.exerciseId, 0)).toThrow();
  });
});

describe('day screen', () => {
  const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
  const slot = todayOf(plan).day.session.slots[0];
  const choice = swapCandidates(plan, slot.slotId)[0];

  it('puts an options button on each exercise before the workout starts', () => {
    const html = dayScreen(plan);
    const name = getExercise(slot.exerciseId)!.name.en;
    expect(html).toContain(`aria-label="Options for ${name}"`);
    expect(html).not.toContain('Swapped');
    expect(html).not.toContain('Reset to original');
  });

  it('marks a swapped exercise and offers to reset it, with a fresh first-time target', () => {
    const swapped = { ...plan, swaps: { [slot.slotId]: choice.id } };
    const html = dayScreen(swapped);
    expect(html).toContain(choice.name.en);
    expect(html).toContain('Swapped');
    expect(html).toContain('Reset to original');
    expect(html).toContain('First time');
  });

  it('offers no swaps mid-workout', () => {
    const html = dayScreen(plan, { autoStart: true });
    expect(html).not.toContain('Options for');
  });
});

describe('SwapSheet', () => {
  const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
  const slot = todayOf(plan).day.session.slots[0];
  const current = getExercise(slot.exerciseId)!;
  const candidates = swapCandidates(plan, slot.slotId);

  it('lists candidates with their equipment', () => {
    const html = render(React.createElement(SwapSheetBody, { exercise: current, candidates, onChoose: noop, onClose: noop }));
    expect(html).toContain(`Swap ${current.name.en}`);
    expect(html).toContain('Same muscles, using your equipment');
    for (const candidate of candidates) {
      expect(html).toContain(candidate.name.en);
      expect(html).toContain(equipmentText(i18n.t, candidate));
    }
  });

  it('explains when there is nothing safe to swap to', () => {
    const html = render(React.createElement(SwapSheetBody, { exercise: current, candidates: [], onChoose: noop, onClose: noop }));
    expect(html).toContain('No other safe option with your equipment');
    expect(html).toContain('Add equipment in Edit plan to see more options');
  });

  it('renders in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const html = render(React.createElement(SwapSheetBody, { exercise: current, candidates, onChoose: noop, onClose: noop }));
    // Exercise names follow the app's region (set by I18nProvider); the end-to-end run covers them.
    expect(html).toContain('استبدال ');
    expect(html).toContain('العضلات نفسها، بالمعدات المتوفرة لديك');
    expect(equipmentText(i18n.t, { equipment: ['dumbbell', 'bench'] })).toBe('دمبل · مقعد');
    expect(equipmentText(i18n.t, { equipment: ['bodyweight'] })).toBe('وزن الجسم');
  });
});
