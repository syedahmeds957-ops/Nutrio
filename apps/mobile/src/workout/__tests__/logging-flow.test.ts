import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, getExercise, stepLoad, type WeeklyWorkoutPlan, type WorkoutSettings } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { clearAuthSession, saveAuthSession } from '../../auth/authStorage.js';
import { recordWorkout } from '../planActions.js';
import { reasonText } from '../format.js';
import { buildWeekView, type DayView } from '../weekView.js';
import { loadWorkoutLogs, releaseWorkoutLogCache } from '../workoutLogStorage.js';
import { releaseWorkoutCache } from '../workoutStorage.js';
import {
  createDraft,
  draftStats,
  draftToLog,
  setActiveDraft,
  setLoad,
  setReps,
  targetsForSession,
  toggleSet,
  type WorkoutDraft,
} from '../workoutDraft.js';
import { TodayWorkoutCard } from '../ui/TodayWorkoutCard.js';
import { WorkoutDayScreen } from '../ui/WorkoutDayScreen.js';
import { WorkoutWeekScreen } from '../ui/WorkoutWeekScreen.js';

initI18n('en');

const THURSDAY = '2026-10-22';
const NEXT_THURSDAY = '2026-10-29';

function settings(overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
  return {
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
    ...overrides,
  };
}

type SessionDay = DayView & { session: NonNullable<DayView['session']> };
const todayOf = (plan: WeeklyWorkoutPlan, todayKey: string, logs = loadWorkoutLogs()) => {
  const week = buildWeekView(plan, todayKey, 'PK', logs);
  return { week, day: week.today as SessionDay };
};

/** Ticks every set at `reps`, with `kg` on weighted moves. */
function completeAll(draft: WorkoutDraft, reps: (repMax: number) => number, kg: number): WorkoutDraft {
  let next = draft;
  next.exercises.forEach((exercise, i) => {
    if (getExercise(exercise.exerciseId)?.tracksLoad) next = setLoad(next, i, 0, kg);
    exercise.sets.forEach((_, s) => {
      next = setReps(next, i, s, reps(0));
      next = toggleSet(next, i, s);
    });
  });
  return next;
}

beforeEach(async () => {
  releaseWorkoutLogCache();
  releaseWorkoutCache();
  setActiveDraft(null);
  await AsyncStorage.clear();
  saveAuthSession({
    token: 'tok_flow',
    user: { id: 'flow_user', name: 'Flow', email: 'flow@nutrio.app', isRegistered: true, surveyCompleted: true },
    createdAt: new Date().toISOString(),
  });
});

afterEach(async () => {
  await i18n.changeLanguage('en');
  await clearAuthSession();
});

describe('start → tick sets → finish → saved', () => {
  it('saves the log, marks the day done and raises weights next session with a reason', () => {
    const plan = generateWeeklyPlan(settings(), { seed: 5, today: '2026-10-19' });
    const { week, day } = todayOf(plan, THURSDAY);
    const targets = targetsForSession(plan, day.session, week.weekIndex, []);
    expect(targets.every(({ target }) => target.reason === 'first_time_pick_weight' || target.reason === 'first_time')).toBe(true);

    let draft = createDraft(day.session, targets, THURSDAY, new Date('2026-10-22T17:00:00Z'));
    draft = completeAll(draft, () => 0, 60);
    // Every set at the top of its own range.
    draft.exercises.forEach((exercise, i) => {
      exercise.sets.forEach((_, s) => (draft = setReps(draft, i, s, targets[i].slot.repMax)));
    });
    expect(draftStats(draft).setsDone).toBe(targets.reduce((n, { target }) => n + target.sets, 0));

    const result = recordWorkout(plan, draftToLog(draft, 'right', new Date('2026-10-22T18:00:00Z')), targets.map((t) => t.slot));
    expect(result.logs).toHaveLength(1);
    expect(loadWorkoutLogs()[0]).toMatchObject({ dateKey: THURSDAY, day: 'thu', rating: 'right' });
    expect(todayOf(result.plan, THURSDAY).week.today.status).toBe('done');

    const next = todayOf(result.plan, NEXT_THURSDAY);
    const nextTargets = targetsForSession(result.plan, next.day.session, next.week.weekIndex, result.logs);
    const weighted = nextTargets.filter(({ slot, target }) => getExercise(target.exerciseId)?.tracksLoad && slot.role === 'main');
    expect(weighted.length).toBeGreaterThan(0);
    for (const { target } of weighted) {
      expect(target.reason).toBe('hit_top_add_load');
      expect(target.loadKg).toBe(stepLoad(getExercise(target.exerciseId)!, plan.settings, 60, 1));
    }
    const line = reasonText(i18n.t, weighted[0].target, true);
    expect(line).toMatch(/^\+\d+(\.\d+)? kg: you hit \d+ on every set last time$/);
  });

  it('climbs the bodyweight ladder and keeps the harder move in the plan', () => {
    const plan = generateWeeklyPlan(settings({ location: 'home_none' }), { seed: 3, today: '2026-10-19' });
    const { week, day } = todayOf(plan, THURSDAY);
    const targets = targetsForSession(plan, day.session, week.weekIndex, []);
    const climber = targets.find(({ slot }) => getExercise(slot.exerciseId)?.harder);
    expect(climber).toBeDefined();

    let draft = createDraft(day.session, targets, THURSDAY, new Date());
    draft.exercises.forEach((exercise, i) => {
      exercise.sets.forEach((_, s) => {
        draft = setReps(draft, i, s, targets[i].slot.repMax);
        draft = toggleSet(draft, i, s);
      });
    });
    const result = recordWorkout(plan, draftToLog(draft, 'easy', new Date()), targets.map((t) => t.slot));
    const harder = getExercise(climber!.slot.exerciseId)!.harder!;
    expect(result.plan.swaps[climber!.slot.slotId]).toBe(harder);

    const next = todayOf(result.plan, NEXT_THURSDAY);
    const after = targetsForSession(result.plan, next.day.session, next.week.weekIndex, result.logs);
    expect(after.find(({ slot }) => slot.slotId === climber!.slot.slotId)?.target).toMatchObject({ exerciseId: harder, reason: 'ladder_step_up' });
  });

  it('fills later unticked sets when the weight on set 1 changes', () => {
    const plan = generateWeeklyPlan(settings(), { seed: 5, today: '2026-10-19' });
    const { week, day } = todayOf(plan, THURSDAY);
    let draft = createDraft(day.session, targetsForSession(plan, day.session, week.weekIndex, []), THURSDAY, new Date());
    draft = toggleSet(draft, 0, 0);
    draft = setLoad(draft, 0, 1, 40);
    expect(draft.exercises[0].sets.map((s) => s.loadKg)).toEqual([undefined, 40, 40]);
  });
});

describe('logging screens', () => {
  const plan = generateWeeklyPlan(settings(), { seed: 5, today: '2026-10-19' });
  const render = (element: React.ReactElement) => renderToStaticMarkup(element);
  const dayProps = { plan, todayKey: THURSDAY, onBack: () => {}, onSaved: () => {}, onSwap: () => {}, onResetSwap: () => {} };

  it('shows set rows, ticks and Finish once started', () => {
    const { week, day } = todayOf(plan, THURSDAY, []);
    const html = render(React.createElement(WorkoutDayScreen, { ...dayProps, day, weekIndex: week.weekIndex, logs: [], autoStart: true }));
    // Every strength set, plus one tick for the cardio block.
    const totalSets = day.session.slots.reduce((n, slot) => n + slot.sets, 0) + (day.session.cardio ? 1 : 0);
    expect(html.match(/role="checkbox"/g)?.length).toBe(totalSets);
    // Screen readers (and the web) need the ticked state itself, not just the role.
    expect(html.match(/aria-checked="false"/g)?.length).toBe(totalSets);
    expect(html).toContain('Finish');
    expect(html).toContain('Today · 0:00');
    expect(html).not.toContain('Start workout');
  });

  it('says a missed session is being done today', () => {
    const { week } = todayOf(plan, THURSDAY, []);
    const monday = week.days.find((d) => d.weekday === 'mon') as SessionDay;
    expect(monday.status).toBe('missed');
    const html = render(React.createElement(WorkoutDayScreen, { ...dayProps, day: monday, weekIndex: week.weekIndex, logs: [], autoStart: true }));
    expect(html).toContain('Today · moved from Mon');
  });

  it('shows what was logged on a done day instead of Start', () => {
    const { week, day } = todayOf(plan, THURSDAY, []);
    const targets = targetsForSession(plan, day.session, week.weekIndex, []);
    let draft = createDraft(day.session, targets, THURSDAY, new Date());
    draft = setLoad(draft, 0, 0, 60);
    draft = setReps(draft, 0, 0, 12);
    draft = toggleSet(draft, 0, 0);
    const logs = [draftToLog(draft, 'right', new Date())];
    const done = todayOf(plan, THURSDAY, logs);
    const html = render(React.createElement(WorkoutDayScreen, { ...dayProps, day: done.day, weekIndex: done.week.weekIndex, logs }));
    expect(html).toContain('Done · Thu 22 Oct');
    expect(html).toContain('60 kg × 12');
    expect(html).toContain('Not done this time');
    expect(html).not.toContain('Start workout');
  });

  it('offers "Do it today" on a missed day, a Done chip for today, and the saved toast', () => {
    const today = todayOf(plan, THURSDAY, []);
    const missedHtml = render(
      React.createElement(WorkoutWeekScreen, { plan, week: today.week, onBack: () => {}, onEdit: () => {}, onOpenDay: () => {}, onDoToday: () => {} })
    );
    expect(missedHtml).toContain('Missed');
    expect(missedHtml).toContain('Do it today');

    const log = { dateKey: THURSDAY, day: 'thu' as const, template: today.day.session.template, exercises: [], startedAt: '', rating: 'right' as const };
    const done = todayOf(plan, THURSDAY, [log]);
    const doneHtml = render(
      React.createElement(WorkoutWeekScreen, { plan, week: done.week, saved: true, onBack: () => {}, onEdit: () => {}, onOpenDay: () => {}, onDoToday: () => {} })
    );
    expect(doneHtml).toContain('See what you logged');
    expect(doneHtml).toContain('Workout saved');
    expect(doneHtml).toContain('1 of 3 workouts done');

    const card = render(React.createElement(TodayWorkoutCard, { plan, logs: [log], todayKey: THURSDAY, onSetUp: () => {}, onOpenDay: () => {}, onSeeWeek: () => {} }));
    expect(card).toContain('Done');
    expect(card).not.toContain('>Start<');
  });

  it('renders the logger and reasons in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const { week, day } = todayOf(plan, THURSDAY, []);
    const html = render(React.createElement(WorkoutDayScreen, { ...dayProps, day, weekIndex: week.weekIndex, logs: [], autoStart: true }));
    expect(html).toContain('إنهاء');
    expect(html).toContain('المجموعة');
    expect(html).toContain('أول مرة');
    const up = reasonText(i18n.t, { exerciseId: 'barbell-squat', sets: 3, repMin: 8, repMax: 12, reps: 8, loadKg: 62.5, reason: 'hit_top_add_load', reasonParams: { inc: 2.5, reps: 12 } }, true);
    expect(up).toBe('‎+2.5‎ كغ: وصلت إلى 12 في كل مجموعة آخر مرة');
  });
});
