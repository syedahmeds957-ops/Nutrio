import { describe, expect, it } from 'vitest';
import { generateWeeklyPlan, planForDate } from '../src/generator.js';
import { currentOrNextRamadan, isRamadan, planSettings, RAMADAN_DATES } from '../src/ramadan.js';
import { applySwap, swapCandidates } from '../src/swapper.js';
import { WeeklyWorkoutPlan, WorkoutSettings } from '../src/types.js';

function settings(overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
  return {
    goal: 'muscle',
    experience: 'some',
    location: 'gym',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: ['mon', 'wed', 'fri'],
    sessionMinutes: 75,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: true, slot: 'before_iftar' },
    ...overrides,
  };
}
const days = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5;

describe('Ramadan dates', () => {
  it('knows the first and last day', () => {
    expect(isRamadan('2026-02-17')).toBe(false);
    expect(isRamadan('2026-02-18')).toBe(true);
    expect(isRamadan('2026-03-19')).toBe(true);
    expect(isRamadan('2026-03-20')).toBe(false);
    expect(isRamadan('2026-10-23')).toBe(false);
  });

  it('finds the Ramadan happening now or coming next', () => {
    expect(currentOrNextRamadan('2026-10-23')).toMatchObject({ hijriYear: 1448, start: '2027-02-08' });
    expect(currentOrNextRamadan('2027-02-20')).toMatchObject({ hijriYear: 1448 });
    expect(currentOrNextRamadan('2041-01-01')).toBeNull();
  });

  it('has a sound table: 29 or 30 days each, about a lunar year apart, in order', () => {
    RAMADAN_DATES.forEach((r, i) => {
      expect([28, 29]).toContain(days(r.start, r.end));
      if (i > 0) {
        expect(r.hijriYear).toBe(RAMADAN_DATES[i - 1].hijriYear + 1);
        expect(days(RAMADAN_DATES[i - 1].start, r.start)).toBeGreaterThanOrEqual(353);
        expect(days(RAMADAN_DATES[i - 1].start, r.start)).toBeLessThanOrEqual(356);
      }
    });
  });
});

describe('Ramadan mode is only on during Ramadan', () => {
  it('builds a normal plan outside Ramadan and a gentler one inside, for the same settings', () => {
    const outside = generateWeeklyPlan(settings(), { seed: 2, today: '2026-10-19' });
    const inside = generateWeeklyPlan(settings(), { seed: 2, today: '2026-10-19', asOf: '2027-02-15' });
    expect(outside.fasting).toBe(false);
    expect(inside.fasting).toBe(true);
    expect(Math.max(...outside.sessions.map((s) => s.slots.length))).toBeGreaterThan(4);
    expect(inside.sessions.every((s) => s.slots.length <= 4 && s.estimatedMinutes <= 45)).toBe(true);
    expect(outside.settings.ramadan.enabled).toBe(true);
  });

  it('switches on the first day of Ramadan and off after it ends, keeping seed, swaps and creation time', () => {
    const before = generateWeeklyPlan(settings({ sessionMinutes: 60 }), { seed: 4, today: '2027-01-25', now: '2027-01-25T08:00:00.000Z' });
    const accessory = before.sessions[0].slots.find((s) => s.role === 'accessory')!;
    const withSwap = applySwap(before, accessory.slotId, swapCandidates(before, accessory.slotId)[0].id);
    expect(planForDate(withSwap, '2027-02-07')).toBe(withSwap);
    const fasting = planForDate(withSwap, '2027-02-08');
    expect(fasting.fasting).toBe(true);
    expect(fasting).toMatchObject({ seed: 4, blockStart: '2027-01-25', createdAt: '2027-01-25T08:00:00.000Z' });
    expect(planForDate(fasting, '2027-02-20')).toBe(fasting);
    const after = planForDate(fasting, '2027-03-09');
    expect(after.fasting).toBe(false);
    expect(after.sessions.map((s) => s.slots.length)).toEqual(withSwap.sessions.map((s) => s.slots.length));
    expect(after.swaps[accessory.slotId]).toBe(withSwap.swaps[accessory.slotId]);
  });

  it('never changes the plan of someone who has not turned Ramadan mode on', () => {
    const plan = generateWeeklyPlan(settings({ ramadan: { enabled: false } }), { seed: 4, today: '2027-01-25' });
    expect(planForDate(plan, '2027-02-15')).toBe(plan);
  });

  it('brings an older always-on plan back to normal outside Ramadan', () => {
    const old = generateWeeklyPlan(settings(), { seed: 4, today: '2026-10-19', asOf: '2027-02-15' });
    const legacy: WeeklyWorkoutPlan = { ...old };
    delete legacy.fasting;
    const now = planForDate(legacy, '2026-10-23');
    expect(now.fasting).toBe(false);
    expect(Math.max(...now.sessions.map((s) => s.slots.length))).toBeGreaterThan(4);
  });

  it('offers normal swaps outside Ramadan, fasting-safe ones inside', () => {
    const fat = settings({ goal: 'fat_loss', location: 'home_none' });
    const outside = generateWeeklyPlan(fat, { seed: 3, today: '2026-10-19' });
    const inside = generateWeeklyPlan(fat, { seed: 3, today: '2026-10-19', asOf: '2027-02-15' });
    expect(planSettings(outside).ramadan.enabled).toBe(false);
    expect(planSettings(inside).ramadan.enabled).toBe(true);
    const cardioOut = swapCandidates(outside, outside.sessions[0].cardio!.slotId, { limit: Infinity });
    const cardioIn = swapCandidates(inside, inside.sessions[0].cardio!.slotId, { limit: Infinity });
    expect(cardioOut.some((e) => e.pattern === 'conditioning')).toBe(true);
    expect(cardioIn.some((e) => e.pattern === 'conditioning')).toBe(false);
  });
});
