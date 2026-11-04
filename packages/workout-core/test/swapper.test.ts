import { describe, expect, it } from 'vitest';
import { getExercise } from '../src/catalogue.js';
import { exerciseForWeek, generateWeeklyPlan, regeneratePlan } from '../src/generator.js';
import { nextTarget } from '../src/progression.js';
import { availableEquipment } from '../src/select.js';
import { applySwap, InvalidSwap, isUserSwap, resetSwap, swapCandidates } from '../src/swapper.js';
import { WeeklyWorkoutPlan, WorkoutLog, WorkoutSettings } from '../src/types.js';

function settings(overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
  return {
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
    ...overrides,
  };
}

const allSlots = (plan: WeeklyWorkoutPlan) => plan.sessions.flatMap((session) => session.slots.map((slot) => ({ session, slot })));

describe('swapCandidates', () => {
  const variants: [string, WorkoutSettings][] = [
    ['gym', settings()],
    ['home with dumbbells and bands', settings({ location: 'home_equipment', homeEquipment: ['dumbbell', 'bands'] })],
    ['home with no equipment', settings({ location: 'home_none' })],
    ['new lifter protecting knees and lower back', settings({ experience: 'new', protectedJoints: ['knee', 'lower_back'] })],
    ['low intensity', settings({ location: 'home_none', lowIntensity: true })],
  ];

  for (const [label, s] of variants) {
    it(`only offers safe, available, same-pattern moves not already in the session (${label})`, () => {
      const plan = generateWeeklyPlan(s, { seed: 9, today: '2026-10-19' });
      const available = availableEquipment(s);
      for (const { session, slot } of allSlots(plan)) {
        const inSession = new Set(session.slots.map((other) => exerciseForWeek(plan, other.slotId, 0)));
        for (const candidate of swapCandidates(plan, slot.slotId, { limit: Infinity })) {
          expect(candidate.pattern).toBe(slot.pattern);
          expect(candidate.equipment.every((item) => available.has(item))).toBe(true);
          expect(candidate.jointLoads.some((joint) => s.protectedJoints.includes(joint))).toBe(false);
          if (s.experience === 'new') expect(candidate.level).toBe('beginner');
          if (s.lowIntensity) expect(candidate.highImpact).toBe(false);
          expect(inSession.has(candidate.id)).toBe(false);
        }
      }
    });
  }

  it('ranks by shared primary muscles first and is stable', () => {
    const plan = generateWeeklyPlan(settings(), { seed: 9, today: '2026-10-19' });
    const { slot } = allSlots(plan).find(({ slot }) => slot.pattern === 'horizontal_push')!;
    const current = getExercise(slot.exerciseId)!;
    const list = swapCandidates(plan, slot.slotId);
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThanOrEqual(8);
    const overlap = list.map((e) => e.primaryMuscles.filter((m) => current.primaryMuscles.includes(m)).length);
    expect([...overlap].sort((a, b) => b - a)).toEqual(overlap);
    expect(swapCandidates(plan, slot.slotId).map((e) => e.id)).toEqual(list.map((e) => e.id));
  });

  it('returns nothing for an unknown slot', () => {
    const plan = generateWeeklyPlan(settings(), { seed: 9, today: '2026-10-19' });
    expect(swapCandidates(plan, 'nope:squat:0')).toEqual([]);
  });
});

describe('applySwap and resetSwap', () => {
  const plan = generateWeeklyPlan(settings(), { seed: 9, today: '2026-10-19' });
  const { slot } = allSlots(plan).find(({ slot }) => slot.role === 'accessory' && swapCandidates(plan, slot.slotId).length > 0)!;
  const choice = swapCandidates(plan, slot.slotId)[0].id;

  it('rejects an exercise that is not a candidate', () => {
    expect(() => applySwap(plan, slot.slotId, slot.exerciseId)).toThrow(InvalidSwap);
    expect(() => applySwap(plan, slot.slotId, 'not-an-exercise')).toThrow(InvalidSwap);
    const wrongPattern = allSlots(plan).find(({ slot: other }) => other.pattern !== slot.pattern)!.slot.exerciseId;
    expect(() => applySwap(plan, slot.slotId, wrongPattern)).toThrow(InvalidSwap);
  });

  it('sticks in later weeks, over the accessory rotation', () => {
    const swapped = applySwap(plan, slot.slotId, choice);
    for (const week of [0, 1, 4, 8, 12]) expect(exerciseForWeek(swapped, slot.slotId, week)).toBe(choice);
    expect(isUserSwap(swapped, slot.slotId)).toBe(true);
    expect(plan.swaps[slot.slotId]).toBeUndefined();
  });

  it('survives an edit that still allows it, and is dropped when it no longer fits', () => {
    const swapped = applySwap(plan, slot.slotId, choice);
    expect(regeneratePlan(swapped, { ...swapped.settings, sessionMinutes: 75 }).swaps[slot.slotId]).toBe(choice);
    const homeNone = regeneratePlan(swapped, { ...swapped.settings, location: 'home_none' });
    if (getExercise(choice)!.equipment.some((item) => item !== 'bodyweight')) expect(homeNone.swaps[slot.slotId]).toBeUndefined();
  });

  it('reset puts the slot back on its own exercise and rotation', () => {
    const reset = resetSwap(applySwap(plan, slot.slotId, choice), slot.slotId);
    expect(reset.swaps[slot.slotId]).toBeUndefined();
    expect(exerciseForWeek(reset, slot.slotId, 0)).toBe(exerciseForWeek(plan, slot.slotId, 0));
    expect(resetSwap(plan, slot.slotId)).toBe(plan);
  });

  it('starts the new exercise on its own progression', () => {
    const swapped = applySwap(plan, slot.slotId, choice);
    const log: WorkoutLog = {
      dateKey: '2026-10-19',
      day: 'mon',
      template: 'full_a',
      exercises: [{ slotId: slot.slotId, exerciseId: slot.exerciseId, sets: [{ reps: 15, loadKg: 20, done: true }] }],
      startedAt: '2026-10-19T10:00:00.000Z',
    };
    const target = nextTarget({ ...slot, exerciseId: exerciseForWeek(swapped, slot.slotId, 0)! }, [log], swapped.settings);
    expect(['first_time_pick_weight', 'first_time']).toContain(target.reason);
  });
});

describe('isUserSwap', () => {
  it('treats a bodyweight ladder climb as progress, not a swap', () => {
    const plan = generateWeeklyPlan(settings({ location: 'home_none' }), { seed: 3, today: '2026-10-19' });
    const { slot } = allSlots(plan).find(({ slot }) => getExercise(slot.exerciseId)?.harder)!;
    const climbed = { ...plan, swaps: { [slot.slotId]: getExercise(slot.exerciseId)!.harder! } };
    expect(isUserSwap(climbed, slot.slotId)).toBe(false);
    expect(isUserSwap(plan, slot.slotId)).toBe(false);
  });

  it('does not call a hand swap to the harder move a climb in the reason line', () => {
    const s = settings({ location: 'home_none' });
    const slot = {
      slotId: 'full_a:horizontal_push:0', pattern: 'horizontal_push' as const, role: 'main' as const, exerciseId: 'feet-elevated-push-up',
      alternates: [], sets: 3, repMin: 8, repMax: 12, unit: 'reps' as const, restSec: 90, targetRir: 1,
    };
    const log: WorkoutLog = {
      dateKey: '2026-10-19', day: 'mon', template: 'full_a', startedAt: '',
      exercises: [{ slotId: slot.slotId, exerciseId: 'push-up', sets: [{ reps: 8, done: true }, { reps: 8, done: true }, { reps: 8, done: true }] }],
    };
    expect(nextTarget(slot, [log], s).reason).toBe('first_time');
  });
});
