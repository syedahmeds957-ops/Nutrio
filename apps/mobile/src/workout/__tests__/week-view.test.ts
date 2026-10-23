import { describe, expect, it } from 'vitest';
import { generateWeeklyPlan, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';
import { buildWeekView, nextTrainingDay, slotsForWeek, weekdayOf, weekStartFor } from '../weekView.js';

const SETTINGS: WorkoutSettings = {
  goal: 'muscle',
  experience: 'some',
  location: 'gym',
  homeEquipment: [],
  dumbbellWeightsKg: [],
  trainingDays: ['mon', 'wed', 'fri'],
  sessionMinutes: 60,
  focus: [],
  protectedJoints: [],
  lowIntensity: false,
  ramadan: { enabled: false },
};

// 2026-10-22 is a Thursday.
const plan = generateWeeklyPlan(SETTINGS, { seed: 11, today: '2026-10-19' });

describe('week start for every app version', () => {
  it('starts Saudi weeks on Sunday and every other region on Monday', () => {
    expect(weekStartFor('SA')).toBe('sun');
    expect(weekStartFor('PK')).toBe('mon');
    expect(weekStartFor('AE')).toBe('mon');
    expect(weekStartFor(undefined)).toBe('mon');
  });

  it('lays the week out from that start day', () => {
    expect(buildWeekView(plan, '2026-10-22', 'PK').days.map((d) => d.weekday)).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(buildWeekView(plan, '2026-10-22', 'SA').days.map((d) => d.weekday)).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    expect(buildWeekView(plan, '2026-10-22', 'global').days[0].dateKey).toBe('2026-10-19');
    expect(buildWeekView(plan, '2026-10-22', 'SA').days[0].dateKey).toBe('2026-10-18');
  });

  it('keeps today inside its own week when today is the first or last day', () => {
    const monday = buildWeekView(plan, '2026-10-19', 'PK');
    expect(monday.days[0].dateKey).toBe('2026-10-19');
    const sunday = buildWeekView(plan, '2026-10-25', 'PK');
    expect(sunday.days[6].dateKey).toBe('2026-10-25');
    expect(sunday.today.dateKey).toBe('2026-10-25');
    const saudiSaturday = buildWeekView(plan, '2026-10-24', 'SA');
    expect(saudiSaturday.days[6].dateKey).toBe('2026-10-24');
  });
});

describe('buildWeekView', () => {
  it('marks training and rest days from the plan', () => {
    const week = buildWeekView(plan, '2026-10-22', 'PK');
    expect(week.days.filter((d) => d.session).map((d) => d.weekday)).toEqual(['mon', 'wed', 'fri']);
    expect(week.trainingDays).toBe(3);
  });

  it('marks past training days without a log as missed, and today and later as today and planned', () => {
    const week = buildWeekView(plan, '2026-10-22', 'PK');
    expect(week.today.weekday).toBe('thu');
    expect(week.days.map((d) => d.status)).toEqual(['missed', 'planned', 'missed', 'today', 'planned', 'planned', 'planned']);
    expect(week.doneDays).toBe(0);
  });

  it('counts weeks from the plan start, across a year boundary too', () => {
    expect(buildWeekView(plan, '2026-10-19', 'PK').weekIndex).toBe(0);
    expect(buildWeekView(plan, '2026-10-26', 'PK').weekIndex).toBe(1);
    const lateDecember = generateWeeklyPlan(SETTINGS, { seed: 1, today: '2026-12-28' });
    expect(buildWeekView(lateDecember, '2027-01-04', 'PK').weekIndex).toBe(1);
  });

  it('reads dates without the device time zone shifting them', () => {
    expect(weekdayOf('2026-10-22')).toBe('thu');
    expect(weekdayOf('2027-01-01')).toBe('fri');
    const week = buildWeekView(plan, '2026-10-22', 'PK');
    expect(week.today.dayOfMonth).toBe(22);
    expect(week.today.month).toBe(9);
  });
});

describe('slotsForWeek and nextTrainingDay', () => {
  it('rotates accessories in week 5 and keeps main lifts', () => {
    const session = plan.sessions[0];
    const first = slotsForWeek(plan, session, 0);
    const fifth = slotsForWeek(plan, session, 4);
    for (const [i, slot] of session.slots.entries()) {
      if (slot.role === 'main') expect(fifth[i].exerciseId).toBe(first[i].exerciseId);
    }
    expect(fifth.some((slot, i) => slot.exerciseId !== first[i].exerciseId)).toBe(true);
  });

  it('applies swaps', () => {
    const swapped = { ...plan, swaps: { [plan.sessions[0].slots[0].slotId]: 'dumbbell-bench-press' } };
    expect(slotsForWeek(swapped, swapped.sessions[0], 0)[0].exerciseId).toBe('dumbbell-bench-press');
  });

  it('finds the next training day after a rest day, wrapping into next week', () => {
    expect(nextTrainingDay(plan, '2026-10-22')).toMatchObject({ dateKey: '2026-10-23' });
    expect(nextTrainingDay(plan, '2026-10-24')).toMatchObject({ dateKey: '2026-10-26' });
  });
});

describe('done and missed from logs', () => {
  const logFor = (dateKey: string, day: WorkoutLog['day']): WorkoutLog => {
    const session = plan.sessions.find((s) => s.day === day)!;
    return { dateKey, day, template: session.template, exercises: [], startedAt: `${dateKey}T09:00:00.000Z`, rating: 'right' };
  };

  it('marks a logged session done and counts it', () => {
    const week = buildWeekView(plan, '2026-10-22', 'PK', [logFor('2026-10-19', 'mon')]);
    expect(week.days[0]).toMatchObject({ status: 'done', log: { dateKey: '2026-10-19' } });
    expect(week.days[2].status).toBe('missed');
    expect(week.doneDays).toBe(1);
  });

  it('counts a missed session done later in the week for its own day', () => {
    const week = buildWeekView(plan, '2026-10-22', 'PK', [logFor('2026-10-22', 'wed')]);
    expect(week.days[2].status).toBe('done');
    expect(week.today.status).toBe('today');
  });

  it('shows today as done once today is logged', () => {
    const week = buildWeekView(plan, '2026-10-23', 'PK', [logFor('2026-10-23', 'fri')]);
    expect(week.today.status).toBe('done');
  });

  it('ignores logs from another week and logs for a session the plan no longer has', () => {
    const lastWeek = logFor('2026-10-12', 'mon');
    const otherTemplate = { ...logFor('2026-10-19', 'mon'), template: 'legs' as const };
    const week = buildWeekView(plan, '2026-10-22', 'PK', [lastWeek, otherTemplate]);
    expect(week.days[0].status).toBe('missed');
  });

  it('uses the Saudi week (Sunday to Saturday) for the window', () => {
    // Saturday 2026-10-24 is outside the Saudi week that started Sunday 2026-10-25.
    const week = buildWeekView(plan, '2026-10-26', 'SA', [logFor('2026-10-24', 'mon')]);
    expect(week.days.find((d) => d.weekday === 'mon')!.status).toBe('today');
    const pk = buildWeekView(plan, '2026-10-26', 'PK', [logFor('2026-10-26', 'mon')]);
    expect(pk.today.status).toBe('done');
  });
});
