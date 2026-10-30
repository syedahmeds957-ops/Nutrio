import { describe, expect, it } from 'vitest';
import { estimateMinutes, exerciseForWeek, generateWeeklyPlan, InvalidWorkoutSettings, regeneratePlan } from '../src/generator.js';
import { supersetsApply } from '../src/superset.js';
import { PlannedSlot, SessionStyle, WorkoutSettings } from '../src/types.js';

const TODAY = '2026-10-19';

function settings(style?: SessionStyle, overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
  return {
    goal: 'muscle',
    experience: 'some',
    location: 'gym',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: ['mon', 'tue', 'thu', 'fri'],
    sessionMinutes: 60,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: false },
    ...(style ? { profile: { sessionStyle: style } } : {}),
    ...overrides,
  };
}

const plan = (s: WorkoutSettings) => generateWeeklyPlan(s, { seed: 7, today: TODAY });
const slotsOf = (s: WorkoutSettings) => plan(s).sessions.flatMap((session) => session.slots);

describe('session style: supersets', () => {
  it('leaves a plan with no style, or straight sets, exactly as it was', () => {
    expect(plan(settings('straight')).sessions).toEqual(plan(settings()).sessions);
    expect(slotsOf(settings()).some((slot) => slot.supersetWith)).toBe(false);
  });

  it('pairs only accessories, both ways, side by side', () => {
    const sessions = plan(settings('supersets')).sessions;
    const paired = sessions.flatMap((session) => session.slots.filter((slot) => slot.supersetWith));
    expect(paired.length).toBeGreaterThan(0);
    for (const session of sessions) {
      session.slots.forEach((slot, i) => {
        if (!slot.supersetWith) return;
        const mate = session.slots.find((other) => other.slotId === slot.supersetWith)!;
        expect(slot.role).toBe('accessory');
        expect(mate.role).toBe('accessory');
        expect(mate.supersetWith).toBe(slot.slotId);
        expect(Math.abs(session.slots.indexOf(mate) - i)).toBe(1);
        expect(mate.sets).toBe(slot.sets);
      });
    }
  });

  it('pairs opposing patterns', () => {
    const slots = plan(settings('supersets')).sessions.flatMap((session) => session.slots);
    const pairs = slots.filter((slot) => slot.supersetWith).map((slot) => [slot.pattern, slots.find((s) => s.slotId === slot.supersetWith)!.pattern].sort().join('+'));
    const allowed = new Set([
      'horizontal_push+horizontal_pull', 'horizontal_pull+vertical_push', 'horizontal_push+vertical_pull', 'vertical_pull+vertical_push',
      'biceps+triceps', 'biceps+horizontal_push', 'horizontal_pull+triceps', 'triceps+vertical_pull', 'biceps+vertical_push',
      'horizontal_pull+shoulders_iso', 'shoulders_iso+vertical_pull', 'biceps+shoulders_iso',
      'hinge+lunge', 'glutes+lunge', 'glutes+squat', 'hinge+squat', 'calves+core',
    ]);
    for (const pair of pairs) expect(allowed.has(pair), pair).toBe(true);
  });

  it('does the same sets in less time than straight sets', () => {
    const sets = (s: WorkoutSettings) => slotsOf(s).reduce((sum, slot) => sum + slot.sets, 0);
    const minutes = (s: WorkoutSettings) => plan(s).sessions.reduce((sum, session) => sum + session.estimatedMinutes, 0);
    for (const sessionMinutes of [30, 45, 60, 75] as const) {
      const [straight, supersets] = [settings('straight', { sessionMinutes }), settings('supersets', { sessionMinutes })];
      expect(sets(supersets)).toBe(sets(straight));
      expect(minutes(supersets)).toBeLessThan(minutes(straight));
    }
  });

  it('counts a pair\'s rest once per round', () => {
    const base = { pattern: 'biceps', role: 'accessory', exerciseId: 'x', alternates: [], sets: 3, repMin: 10, repMax: 15, unit: 'reps', restSec: 60, targetRir: 1 } as const;
    const a: PlannedSlot = { ...base, slotId: 'a', supersetWith: 'b' };
    const b: PlannedSlot = { ...base, slotId: 'b', pattern: 'triceps', supersetWith: 'a' };
    const straight = estimateMinutes([{ ...a, supersetWith: undefined }, { ...b, supersetWith: undefined }]);
    // 3 rounds save one 60 s rest each, over two exercises: 3 minutes.
    expect(straight - estimateMinutes([a, b])).toBe(3);
  });

  it('never leaves a slot pointing at a partner trimmed away', () => {
    for (const sessionMinutes of [20, 30, 45, 60, 75] as const) {
      for (const session of plan(settings('supersets', { sessionMinutes })).sessions) {
        for (const slot of session.slots) {
          if (!slot.supersetWith) continue;
          expect(session.slots.some((other) => other.slotId === slot.supersetWith && other.supersetWith === slot.slotId)).toBe(true);
        }
      }
    }
  });

  it('keeps the pairing through a swap-preserving rebuild and the 4-week rotation', () => {
    const first = plan(settings('supersets'));
    const again = regeneratePlan(first, first.settings);
    expect(again.sessions).toEqual(first.sessions);
    const slot = first.sessions.flatMap((s) => s.slots).find((s) => s.supersetWith && s.alternates.length > 1)!;
    expect(exerciseForWeek(first, slot.slotId, 4)).toBeDefined();
  });

  it('is ignored for beginners, low-intensity and Ramadan plans', () => {
    expect(supersetsApply(settings('supersets'))).toBe(true);
    // Ramadan mode only takes effect on Ramadan dates, so those plans are built then.
    const RAMADAN = '2027-02-10';
    for (const override of [{ experience: 'new' as const }, { lowIntensity: true }, { ramadan: { enabled: true, slot: 'after_taraweeh' as const } }]) {
      const s = settings('supersets', override);
      const build = (userSettings: WorkoutSettings) => generateWeeklyPlan(userSettings, { seed: 7, today: RAMADAN }).sessions;
      expect(build(s).some((session) => session.slots.some((slot) => slot.supersetWith))).toBe(false);
      expect(build(s)).toEqual(build({ ...s, profile: undefined }));
    }
    expect(supersetsApply(settings('supersets', { ramadan: { enabled: true, slot: 'after_taraweeh' } }))).toBe(false);
  });

  it('rejects an unknown style', () => {
    expect(() => plan(settings('circuit' as SessionStyle))).toThrow(InvalidWorkoutSettings);
  });
});
