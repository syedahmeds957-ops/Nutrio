import { afterEach, describe, expect, it } from 'vitest';
import i18n from 'i18next';
import {
  exerciseForWeek,
  generateWeeklyPlan,
  getExercise,
  swapCandidates,
  type WorkoutLog,
  type WorkoutSettings,
} from '@nutrio/workout-core';
import { initI18n } from '../../i18n/config.js';
import { computePlan } from '../../plan/engine.js';
import { buildCoachContext } from '../coachContext.js';
import { coachSwapTopic, coachWorkoutContext } from '../../workout/coachWorkout.js';
import { sessionTitle } from '../../workout/sessionTitle.js';
import { slotsForWeek } from '../../workout/weekView.js';

initI18n('en');

const SETTINGS: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'sat'],
  sessionMinutes: 60,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};
const SATURDAY = '2026-10-24';
const plan = generateWeeklyPlan(SETTINGS, { seed: 5, today: '2026-10-19' });
const t = i18n.t.bind(i18n);

// Monday's session, done on Sunday 18 October: inside a Sunday-start week (SA), before a Monday-start one.
const log = (dateKey: string): WorkoutLog => ({
  dateKey,
  day: 'mon',
  template: plan.sessions.find((s) => s.day === 'mon')!.template,
  exercises: [],
  startedAt: `${dateKey}T08:00:00.000Z`,
});

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('coachWorkoutContext', () => {
  it("lists today's session with every exercise as the day screen shows it", () => {
    const ctx = coachWorkoutContext({ plan, logs: [], todayKey: SATURDAY, region: 'PK', language: 'en', t });
    const session = plan.sessions.find((s) => s.day === 'sat')!;
    const strength = slotsForWeek(plan, session, 0).map((slot) => getExercise(slot.exerciseId)!.name.en);
    expect(ctx).toMatchObject({ location: 'gym', sessionsPlannedThisWeek: 3, sessionsDoneThisWeek: 0, ramadan: false });
    expect(ctx.today?.title).toBe(sessionTitle(t, session));
    expect(ctx.today?.exercises.slice(0, strength.length)).toEqual(strength);
  });

  it('counts done sessions in the region’s own week: Sunday start for SA, Monday for PK and everywhere else', () => {
    const logs = [log('2026-10-18')];
    const done = (region: string | undefined) =>
      coachWorkoutContext({ plan, logs, todayKey: SATURDAY, region, language: 'en', t }).sessionsDoneThisWeek;
    expect(done('SA')).toBe(1);
    expect(done('PK')).toBe(0);
    expect(done(undefined)).toBe(0);
    expect(done('AE')).toBe(0);
  });

  it('has no today on a rest day', () => {
    const ctx = coachWorkoutContext({ plan, logs: [], todayKey: '2026-10-22', region: 'PK', language: 'en', t });
    expect(ctx.today).toBeUndefined();
  });

  it('names exercises in Arabic for an Arabic user', async () => {
    await i18n.changeLanguage('ar');
    const ctx = coachWorkoutContext({ plan, logs: [], todayKey: SATURDAY, region: 'SA', language: 'ar', t: i18n.t.bind(i18n) });
    const first = slotsForWeek(plan, plan.sessions.find((s) => s.day === 'sat')!, 0)[0];
    expect(ctx.today?.exercises[0]).toBe(getExercise(first.exerciseId)!.name.ar);
  });

  it('reaches the coach context, and stays out when there is no workout plan', () => {
    const nutrition = computePlan(
      { weightKg: 80, heightCm: 178, ageYears: 30, sex: 'male', bmr: 1780, tdee: 2400, chaiSugarKcalPerDay: 130, weeklyChaiSugarKcal: 910, isNightShift: false, dailySittingHours: 8 },
      { goal: 'maintain', targetRateKgPerWeek: 0 }
    );
    const workout = coachWorkoutContext({ plan, logs: [], todayKey: SATURDAY, region: 'PK', language: 'en', t });
    expect(buildCoachContext({ plan: nutrition, displayName: 'A', region: 'PK', workout }).workout).toEqual(workout);
    expect('workout' in buildCoachContext({ plan: nutrition, displayName: 'A', region: 'PK' })).toBe(false);
  });
});

describe('coachSwapTopic', () => {
  const slot = plan.sessions[0].slots[0];

  it('is the exercise in the slot this week, with the swap sheet’s own safe list and joint loads', () => {
    const topic = coachSwapTopic(plan, slot.slotId, 0, 'en')!;
    const current = exerciseForWeek(plan, slot.slotId, 0)!;
    expect(topic.exerciseId).toBe(current);
    expect(topic.exerciseName).toBe(getExercise(current)!.name.en);
    expect(topic.candidates.map((c) => c.id)).toEqual(swapCandidates(plan, slot.slotId, { weekIndex: 0 }).map((e) => e.id));
    for (const c of topic.candidates) expect(c.jointLoads).toEqual(getExercise(c.id)!.jointLoads);
  });

  it('sends at most 8 options, even for a cardio block', () => {
    // Fat loss in a gym: 8 steady options plus interval moves.
    const fatLoss = generateWeeklyPlan({ ...SETTINGS, goal: 'fat_loss' }, { seed: 5, today: '2026-10-19' });
    const cardio = fatLoss.sessions.find((s) => s.cardio)!.cardio!;
    expect(swapCandidates(fatLoss, cardio.slotId).length).toBeGreaterThan(8);
    expect(coachSwapTopic(fatLoss, cardio.slotId, 0, 'en')!.candidates).toHaveLength(8);
  });

  it('is null for a slot the plan no longer has', () => {
    expect(coachSwapTopic(plan, 'gone:slot:0', 0, 'en')).toBeNull();
  });
});
