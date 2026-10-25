import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWeeklyPlan, getExercise } from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { addDaysToKey, localDateKey } from '../../common/dateKey.js';
import { sampleDays, samplePlan } from '../samplePlan.js';
import { buildWeekView, weekdayOf } from '../weekView.js';
import { flushWorkoutWrites, releaseWorkoutCache, saveWorkoutPlan } from '../workoutStorage.js';
import { TodayWorkoutCard } from '../ui/TodayWorkoutCard.js';
import { WorkoutDayScreen } from '../ui/WorkoutDayScreen.js';
import { WorkoutWeekScreen } from '../ui/WorkoutWeekScreen.js';
import { WorkoutsScreen } from '../ui/WorkoutsScreen.js';

initI18n('en');

const THURSDAY = '2026-10-22';
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const noop = () => {};

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('samplePlan', () => {
  it('is the same plan every time for a date, and always trains today', () => {
    expect(samplePlan(THURSDAY)).toEqual(samplePlan(THURSDAY));
    for (const today of ['2026-10-19', THURSDAY, '2026-10-24', '2026-10-25']) {
      const plan = samplePlan(today);
      expect(sampleDays(today)).toHaveLength(3);
      expect(plan.sessions.map((s) => s.day)).toContain(weekdayOf(today));
    }
  });

  it('is a beginner home plan with no equipment and no Ramadan caps', () => {
    const plan = samplePlan(THURSDAY);
    expect(plan.settings).toMatchObject({ location: 'home_none', experience: 'new', ramadan: { enabled: false } });
    const equipment = plan.sessions.flatMap((s) => s.slots.flatMap((slot) => getExercise(slot.exerciseId)!.equipment));
    expect(equipment.every((item) => item === 'bodyweight')).toBe(true);
  });

  it('has a session today for PK, SA and every other region, each with its own week start', () => {
    const plan = samplePlan(THURSDAY);
    for (const [region, firstDay] of [['PK', 'mon'], ['SA', 'sun'], [undefined, 'mon']] as const) {
      const week = buildWeekView(plan, THURSDAY, region);
      expect(week.days[0].weekday).toBe(firstDay);
      expect(week.today.session).not.toBeNull();
    }
  });
});

describe('guest week', () => {
  const plan = samplePlan(THURSDAY);
  const week = buildWeekView(plan, THURSDAY, 'PK');
  const props = { plan, week, onBack: noop, onEdit: noop, onOpenDay: noop, onDoToday: noop, onRequireAccount: noop };

  it('says it is a sample, offers an account, and has no Edit plan', () => {
    const html = render(React.createElement(WorkoutWeekScreen, props));
    expect(html).toContain('This is a sample plan');
    expect(html).toContain('Create free account');
    expect(html).toContain('I have an account');
    expect(html).toContain('SAMPLE WEEK');
    expect(html).toContain('3 workouts a week');
    expect(html).toContain('Start workout');
    expect(html).not.toContain('Edit plan');
    expect(html).not.toContain('WEEK 1');
  });

  it('shows no history: nothing done or missed, and no status on earlier days', () => {
    const html = render(React.createElement(WorkoutWeekScreen, props));
    expect(html).not.toMatch(/Missed|Do it today|workouts done|>Done</);
    // Today, plus one label per session still ahead this week.
    const ahead = week.days.filter((day) => day.session && day.dateKey > THURSDAY).length;
    expect(html.match(/Coming up/g) ?? []).toHaveLength(ahead);
  });

  it('renders in Arabic', async () => {
    await i18n.changeLanguage('ar');
    const html = render(React.createElement(WorkoutWeekScreen, { ...props, week: buildWeekView(plan, THURSDAY, 'SA') }));
    expect(html).toContain('هذه خطة تجريبية');
    expect(html).toContain('أسبوع تجريبي');
    expect(html).toContain('3 تمارين في الأسبوع');
    expect(html).toContain('إنشاء حساب مجاني');
  });

  it('leaves the signed-in week unchanged', () => {
    const html = render(React.createElement(WorkoutWeekScreen, { ...props, onRequireAccount: undefined }));
    expect(html).toContain('Edit plan');
    expect(html).toContain('WEEK 1');
    expect(html).not.toContain('This is a sample plan');
  });
});

describe('guest day', () => {
  const plan = samplePlan(THURSDAY);
  const week = buildWeekView(plan, THURSDAY, 'PK');
  const day = week.today as typeof week.today & { session: NonNullable<typeof week.today.session> };
  const props = { plan, day, weekIndex: week.weekIndex, todayKey: THURSDAY, logs: [], onBack: noop, onSaved: noop, onSwap: noop, onResetSwap: noop };

  it('is read-only: every exercise shows, but no options and no Start', () => {
    const html = render(React.createElement(WorkoutDayScreen, { ...props, onRequireAccount: noop }));
    for (const slot of day.session.slots) expect(html).toContain(getExercise(slot.exerciseId)!.name.en);
    expect(html).toContain('Sample session. Create an account to start it and log your sets.');
    expect(html).toContain('Create an account to start');
    expect(html).not.toContain('Start workout');
    expect(html).not.toContain('Options for');
  });

  it('keeps options and Start for a signed-in user', () => {
    const html = render(React.createElement(WorkoutDayScreen, props));
    expect(html).toContain('Start workout');
    expect(html).toContain('Options for');
  });
});

describe('guest dashboard card', () => {
  it('tags the sample session', () => {
    const html = render(
      React.createElement(TodayWorkoutCard, { plan: samplePlan(THURSDAY), todayKey: THURSDAY, onSetUp: noop, onOpenDay: noop, onSeeWeek: noop, sample: true })
    );
    expect(html).toContain('Sample');
    expect(html).toContain('Start');
  });
});

describe('guest Workouts route', () => {
  beforeEach(async () => {
    releaseWorkoutCache();
    await AsyncStorage.clear();
  });

  it('shows the sample, never a plan stored on the device, and writes nothing', async () => {
    // A gym plan a guest made before this change, still on the device: six days, today among them.
    const tomorrow = weekdayOf(addDaysToKey(localDateKey(), 1));
    const stored = generateWeeklyPlan(
      {
        goal: 'muscle', experience: 'some', location: 'gym', homeEquipment: [], dumbbellWeightsKg: [],
        trainingDays: (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).filter((d) => d !== tomorrow), sessionMinutes: 60, focus: [], protectedJoints: [],
        lowIntensity: false, ramadan: { enabled: false },
      },
      { seed: 1, today: localDateKey() }
    );
    saveWorkoutPlan(stored);
    await flushWorkoutWrites();
    releaseWorkoutCache();
    const keysBefore = [...(await AsyncStorage.getAllKeys())].sort();

    const html = render(React.createElement(WorkoutsScreen, { survey: null, activePlan: null, onBack: noop, isGuest: true }));

    expect(html).toContain('This is a sample plan');
    expect(html).not.toMatch(/Barbell|Machine|Cable/);
    expect([...(await AsyncStorage.getAllKeys())].sort()).toEqual(keysBefore);
  });
});
