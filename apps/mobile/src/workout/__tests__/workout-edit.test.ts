import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, type WeeklyWorkoutPlan, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import { recordWorkout } from '../planActions.js';
import { buildWeekView, type DayView } from '../weekView.js';
import { loadWorkoutLogs, releaseWorkoutLogCache } from '../workoutLogStorage.js';
import { releaseWorkoutCache } from '../workoutStorage.js';
import { mergeWorkoutLogs } from '../workoutMerge.js';
import { setActiveDraft, setReps, toggleSet, targetsForSession } from '../workoutDraft.js';
import {
  addExercise,
  addExercises,
  addSet,
  addWalk,
  WALK_EXERCISE_ID,
  canSaveEdit,
  draftFromLog,
  editedLog,
  hasEdits,
  isAddedSlot,
  loggedSetCount,
  removeSet,
} from '../workoutEdit.js';
import { EditLogList } from '../ui/EditLogList.js';
import { ExercisePickerBody } from '../ui/ExercisePickerSheet.js';
import { isCardioSlot } from '../weekView.js';
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

const BENCH = 'upper-a:horizontal_push:0';
const CARDIO = 'upper-a:cardio:0';

function original(): WorkoutLog {
  return {
    dateKey: THURSDAY,
    day: 'thu',
    template: 'upper',
    exercises: [
      {
        slotId: BENCH,
        exerciseId: 'barbell-bench-press',
        sets: [
          { reps: 10, loadKg: 40, done: true },
          { reps: 8, loadKg: 40, done: true },
        ],
      },
      { slotId: CARDIO, exerciseId: 'brisk-walk', sets: [{ reps: 15, done: true }] },
    ],
    rating: 'right',
    startedAt: '2026-10-22T17:00:00.000Z',
    finishedAt: '2026-10-22T18:00:00.000Z',
  };
}

beforeEach(async () => {
  releaseWorkoutLogCache();
  releaseWorkoutCache();
  setActiveDraft(null);
  await AsyncStorage.clear();
  saveAuthSession({
    token: 'tok_edit',
    user: { id: 'edit_user', name: 'Edit', email: 'edit@nutrio.app', isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  });
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  await clearAuthSession();
});

describe('editing a finished workout: the draft', () => {
  it('opens the log as an editable draft with every set as saved and the original start time', () => {
    const log = original();
    const draft = draftFromLog(log);
    expect(draft).toMatchObject({ dateKey: THURSDAY, day: 'thu', template: 'upper', startedAt: log.startedAt, editing: true });
    expect(draft.exercises[0].sets).toEqual(log.exercises[0].sets);
    // A copy: editing the draft never touches the saved log.
    const edited = setReps(draft, 0, 0, 12);
    expect(edited.exercises[0].sets[0].reps).toBe(12);
    expect(log.exercises[0].sets[0].reps).toBe(10);
    expect(hasEdits(draftFromLog(log), log)).toBe(false);
    expect(hasEdits(edited, log)).toBe(true);
  });

  it('corrects reps and ticks, adds a set from the last one, and removes a set', () => {
    const log = original();
    let draft = setReps(draftFromLog(log), 0, 1, 9);
    draft = addSet(draft, 0);
    expect(draft.exercises[0].sets).toHaveLength(3);
    expect(draft.exercises[0].sets[2]).toEqual({ reps: 9, loadKg: 40, done: false });
    draft = toggleSet(draft, 0, 2);
    expect(draft.exercises[0].sets[2].done).toBe(true);
    draft = removeSet(draft, 0, 0);
    expect(draft.exercises[0].sets.map((s) => s.reps)).toEqual([9, 9]);
  });

  it('adds an exercise from the catalogue with one empty row, marked as added by the user', () => {
    let draft = addExercise(draftFromLog(original()), 'goblet-squat');
    const added = draft.exercises[draft.exercises.length - 1];
    expect(isAddedSlot(added.slotId)).toBe(true);
    expect(added.exerciseId).toBe('goblet-squat');
    expect(added.sets).toEqual([{ reps: 0, done: false }]);
    // The same move added twice gets its own slot.
    draft = addExercise(draft, 'goblet-squat');
    const slots = draft.exercises.map((e) => e.slotId);
    expect(new Set(slots).size).toBe(slots.length);
    expect(isAddedSlot(BENCH)).toBe(false);
  });

  it('drops an exercise whose last set is removed', () => {
    let draft = draftFromLog(original());
    draft = removeSet(removeSet(draft, 0, 1), 0, 0);
    expect(draft.exercises.map((e) => e.slotId)).toEqual([CARDIO]);
  });

  it('blocks saving a workout with nothing ticked', () => {
    let draft = draftFromLog(original());
    expect(canSaveEdit(draft)).toBe(true);
    expect(loggedSetCount(draft)).toBe(3);
    draft = toggleSet(toggleSet(toggleSet(draft, 0, 0), 0, 1), 1, 0);
    expect(loggedSetCount(draft)).toBe(0);
    expect(canSaveEdit(draft)).toBe(false);
    // Only an unticked, added row is not enough either.
    expect(canSaveEdit(addExercise(draft, 'goblet-squat'))).toBe(false);
  });
});

describe('editing a finished workout: the saved log', () => {
  it('keeps date, day, start time and rating, and finishes later than the original', () => {
    const log = original();
    const draft = setReps(draftFromLog(log), 0, 0, 12);
    const saved = editedLog(draft, log, new Date('2026-10-22T19:30:00.000Z'));
    expect(saved).toMatchObject({ dateKey: THURSDAY, day: 'thu', template: 'upper', rating: 'right', startedAt: log.startedAt });
    expect(saved.finishedAt).toBe('2026-10-22T19:30:00.000Z');
    expect(saved.exercises[0].sets[0].reps).toBe(12);
  });

  it('is still newer than the original when the device clock is behind it', () => {
    const log = original();
    const saved = editedLog(setReps(draftFromLog(log), 0, 0, 12), log, new Date('2026-10-22T10:00:00.000Z'));
    expect(Date.parse(saved.finishedAt!)).toBeGreaterThan(Date.parse(log.finishedAt!));
  });

  it('replaces the original on the device and in the cloud push, with progression reading the edit', () => {
    const plan: WeeklyWorkoutPlan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
    const week = buildWeekView(plan, THURSDAY, 'PK', []);
    const day = week.today as DayView & { session: NonNullable<DayView['session']> };
    const slots = targetsForSession(plan, day.session, week.weekIndex, []).map(({ slot }) => slot);
    const first = slots[0];
    const log: WorkoutLog = {
      dateKey: THURSDAY,
      day: 'thu',
      template: day.session.template,
      exercises: [{ slotId: first.slotId, exerciseId: first.exerciseId, sets: [{ reps: first.repMin, loadKg: 20, done: true }] }],
      rating: 'right',
      startedAt: '2026-10-22T17:00:00.000Z',
      finishedAt: '2026-10-22T18:00:00.000Z',
    };
    recordWorkout(plan, log, slots);
    expect(loadWorkoutLogs()).toHaveLength(1);

    let draft = draftFromLog(loadWorkoutLogs()[0]);
    draft = setReps(draft, 0, 0, first.repMax);
    draft = addExercise(draft, 'goblet-squat');
    draft = setReps(toggleSet(draft, 1, 0), 1, 0, 8);
    const edited = editedLog(draft, log, new Date('2026-10-22T20:00:00.000Z'));
    const result = recordWorkout(plan, edited, slots);

    // One log for that date and day, now holding the edit and the added exercise.
    expect(result.logs).toHaveLength(1);
    expect(loadWorkoutLogs()[0].exercises[0].sets[0].reps).toBe(first.repMax);
    expect(loadWorkoutLogs()[0].exercises.map((e) => e.exerciseId)).toContain('goblet-squat');
    expect(loadWorkoutLogs()[0].startedAt).toBe(log.startedAt);
    expect(buildWeekView(result.plan, THURSDAY, 'PK', result.logs).today.status).toBe('done');

    // Next targets are built from the edited log, deterministically, with a reason code.
    const next = buildWeekView(result.plan, '2026-10-29', 'PK', result.logs);
    const nextDay = next.today as DayView & { session: NonNullable<DayView['session']> };
    const a = targetsForSession(result.plan, nextDay.session, next.weekIndex, result.logs);
    const b = targetsForSession(result.plan, nextDay.session, next.weekIndex, result.logs);
    expect(a).toEqual(b);
    expect(a.every(({ target }) => typeof target.reason === 'string' && target.reason.length > 0)).toBe(true);
    // The added exercise has no plan slot, so it never becomes a target.
    expect(a.some(({ slot }) => isAddedSlot(slot.slotId))).toBe(false);
  });

  it('wins the cloud merge over the unedited log, from either side', () => {
    const log = original();
    const edited = editedLog(setReps(draftFromLog(log), 0, 0, 12), log, new Date('2026-10-22T19:00:00.000Z'));
    const cutoff = '2025-10-22';

    const deviceEdited = mergeWorkoutLogs([edited], [log], cutoff);
    expect(deviceEdited.logs).toEqual([edited]);
    expect(deviceEdited.pushDates).toEqual([THURSDAY]);

    const cloudEdited = mergeWorkoutLogs([log], [edited], cutoff);
    expect(cloudEdited.logs).toEqual([edited]);
    expect(cloudEdited.pushDates).toEqual([]);
  });
});

describe('editing a finished workout: screens', () => {
  const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
  const render = (element: React.ReactElement) => renderToStaticMarkup(element);

  it('offers Edit workout and Add exercise on a finished day', () => {
    const week0 = buildWeekView(plan, THURSDAY, 'PK', []);
    const day0 = week0.today as DayView & { session: NonNullable<DayView['session']> };
    const log: WorkoutLog = { ...original(), template: day0.session.template, exercises: [{ slotId: BENCH, exerciseId: 'barbell-bench-press', sets: [{ reps: 8, done: true }] }] };
    const week = buildWeekView(plan, THURSDAY, 'PK', [log]);
    const day = week.today as DayView & { session: NonNullable<DayView['session']> };
    const html = render(
      React.createElement(WorkoutDayScreen, {
        plan,
        day,
        weekIndex: week.weekIndex,
        todayKey: THURSDAY,
        logs: [log],
        onBack: () => {},
        onSaved: () => {},
        onSwap: () => {},
        onResetSwap: () => {},
      })
    );
    expect(html).toContain('Edit workout');
    expect(html).toContain('Add exercise');
    expect(html).toContain('Done · Thu 22 Oct');
  });

  it('does not offer them to a guest looking at the sample', () => {
    const week = buildWeekView(plan, THURSDAY, 'PK', []);
    const day = week.today as DayView & { session: NonNullable<DayView['session']> };
    const html = render(
      React.createElement(WorkoutDayScreen, {
        plan,
        day,
        weekIndex: week.weekIndex,
        todayKey: THURSDAY,
        logs: [],
        onBack: () => {},
        onSaved: () => {},
        onSwap: () => {},
        onResetSwap: () => {},
        onRequireAccount: () => {},
      })
    );
    expect(html).not.toContain('Edit workout');
    expect(html).not.toContain('Add exercise');
  });

  it('renders the edit list with set rows, add/remove set and the added tag, in English and Arabic', async () => {
    const draft = addExercise(draftFromLog(original()), 'goblet-squat');
    const props = {
      draft,
      settings: SETTINGS,
      unitForSlot: () => undefined,
      onReps: () => {},
      onLoad: () => {},
      onToggle: () => {},
      onAddSet: () => {},
      onRemoveSet: () => {},
      onDetails: () => {},
      paused: true,
    };
    const en = render(React.createElement(EditLogList, props));
    expect(en).toContain('Added by you');
    expect(en).toContain('Add set');
    expect(en).toContain('Remove last set');
    await i18n.changeLanguage('ar');
    const ar = render(React.createElement(EditLogList, props));
    expect(ar).toContain('أضفته أنت');
    expect(ar).toContain('إضافة مجموعة');
  });
});

describe('adding more: several exercises and a walk session', () => {
  it('adds several exercises in one go, each with its own slot', () => {
    const draft = addExercises(draftFromLog(original()), ['goblet-squat', 'dumbbell-row']);
    const added = draft.exercises.filter((e) => isAddedSlot(e.slotId));
    expect(added.map((e) => e.exerciseId)).toEqual(['goblet-squat', 'dumbbell-row']);
  });

  it('logs a walk as ticked cardio minutes, marked as added, without touching the plan', () => {
    const log = original();
    const draft = addWalk(draftFromLog(log), 30);
    const walk = draft.exercises[draft.exercises.length - 1];
    expect(walk.exerciseId).toBe(WALK_EXERCISE_ID);
    expect(isAddedSlot(walk.slotId)).toBe(true);
    expect(isCardioSlot(walk.slotId)).toBe(true);
    expect(walk.sets).toEqual([{ reps: 30, done: true }]);
    expect(loggedSetCount(draft)).toBe(loggedSetCount(draftFromLog(log)) + 1);
    // A second walk gets its own slot.
    const twice = addWalk(draft, 10);
    expect(new Set(twice.exercises.map((e) => e.slotId)).size).toBe(twice.exercises.length);
  });

  it('needs whole minutes of at least 1, and caps absurd values', () => {
    const draft = draftFromLog(original());
    expect(addWalk(draft, 0)).toBe(draft);
    expect(addWalk(draft, -5)).toBe(draft);
    expect(addWalk(draft, Number.NaN)).toBe(draft);
    expect(addWalk(draft, 12.6).exercises.at(-1)?.sets[0].reps).toBe(13);
    expect(addWalk(draft, 99999).exercises.at(-1)?.sets[0].reps).toBe(600);
  });

  it('lets a walk alone satisfy the keep-one-set rule and wins the cloud merge', () => {
    const log = original();
    let draft = draftFromLog(log);
    draft = toggleSet(toggleSet(toggleSet(draft, 0, 0), 0, 1), 1, 0);
    expect(canSaveEdit(draft)).toBe(false);
    draft = addWalk(draft, 20);
    expect(canSaveEdit(draft)).toBe(true);
    const edited = editedLog(draft, log, new Date('2026-10-22T19:00:00.000Z'));
    expect(edited.exercises.at(-1)).toMatchObject({ exerciseId: WALK_EXERCISE_ID, sets: [{ reps: 20, done: true }] });
    const merged = mergeWorkoutLogs([log], [edited], '2025-10-22');
    expect(merged.logs).toEqual([edited]);
  });

  it('shows the walk row, and finds a plain walk by search even when it was disliked', () => {
    const disliked: WorkoutSettings = { ...SETTINGS, profile: { dislikes: [WALK_EXERCISE_ID] } };
    const noop = () => {};
    const html = renderToStaticMarkup(
      React.createElement(ExercisePickerBody, { title: 'Add an exercise', settings: disliked, chosen: [], onConfirm: noop, onAddWalk: noop, onClose: noop, initialQuery: 'walking' })
    );
    expect(html).toContain('Add a walk session');
    expect(html).toContain('Walking');
  });

  it('shows the walk row and cardio group in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const noop = () => {};
    const html = renderToStaticMarkup(
      React.createElement(ExercisePickerBody, { title: 'x', settings: SETTINGS, chosen: [], onConfirm: noop, onAddWalk: noop, onClose: noop })
    );
    expect(html).toContain('إضافة جلسة مشي');
    expect(html).toContain('الكارديو');
  });
});
