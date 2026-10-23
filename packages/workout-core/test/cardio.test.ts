import { describe, expect, it } from 'vitest';
import { cardioIntensity, cardioMinutes, cardioPool } from '../src/cardio.js';
import { getExercise } from '../src/catalogue.js';
import { exerciseForWeek, generateWeeklyPlan, regeneratePlan, upgradePlan } from '../src/generator.js';
import { applySwap, isUserSwap, swapCandidates } from '../src/swapper.js';
import { Experience, SessionMinutes, TrainingLocation, WeeklyWorkoutPlan, WorkoutGoal, WorkoutSettings } from '../src/types.js';

function settings(overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
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
    ...overrides,
  };
}
const make = (s: WorkoutSettings, seed = 7) => generateWeeklyPlan(s, { seed, today: '2026-10-19' });

const TABLE: Record<WorkoutGoal, number[]> = {
  fat_loss: [8, 10, 15, 20, 20],
  general: [5, 8, 10, 15, 15],
  muscle: [5, 5, 8, 10, 10],
  strength: [5, 5, 8, 10, 10],
};
const LENGTHS: SessionMinutes[] = [20, 30, 45, 60, 75];
const GOALS: WorkoutGoal[] = ['fat_loss', 'general', 'muscle', 'strength'];
const LOCATIONS: TrainingLocation[] = ['gym', 'home_none', 'home_equipment'];
const EXPERIENCE: Experience[] = ['new', 'some', 'experienced'];

describe('cardio block in every generated plan', () => {
  it('gives the table minutes, fits the session length, and never adds a finisher (every goal × length × location × caps)', () => {
    let checked = 0;
    for (const goal of GOALS)
      for (const [i, sessionMinutes] of LENGTHS.entries())
        for (const location of LOCATIONS)
          for (const caps of [{}, { lowIntensity: true }, { ramadan: { enabled: true, slot: 'before_iftar' as const } }]) {
            const s = settings({ goal, sessionMinutes, location, homeEquipment: location === 'home_equipment' ? ['dumbbell', 'bands'] : [], ...caps });
            const p = make(s);
            const expected = s.ramadan.enabled ? Math.min(TABLE[goal][i], 10) : TABLE[goal][i];
            const limit = s.ramadan.enabled ? 45 : sessionMinutes + 5;
            for (const session of p.sessions) {
              expect(session.cardio?.minutes).toBe(expected);
              expect(session.finisher).toBeUndefined();
              expect(session.estimatedMinutes).toBeLessThanOrEqual(limit);
              checked++;
            }
            expect(p.restDayWalk).toEqual({ minMinutes: 20, maxMinutes: 30 });
          }
    expect(checked).toBeGreaterThan(700);
  });

  it('only uses moves the user can do: no machines at home, walking only for low intensity', () => {
    for (const experience of EXPERIENCE) {
      const home = make(settings({ location: 'home_none', experience }));
      for (const session of home.sessions) {
        const pick = getExercise(session.cardio!.exerciseId)!;
        expect(pick.equipment).not.toContain('machine');
        expect(session.cardio!.alternates.every((id) => !getExercise(id)!.equipment.includes('machine'))).toBe(true);
      }
    }
    for (const location of LOCATIONS) {
      const low = make(settings({ location, lowIntensity: true }));
      for (const session of low.sessions) {
        expect(session.cardio!.alternates.every((id) => ['brisk-walk', 'treadmill-walk'].includes(id))).toBe(true);
        expect(session.cardio!.intensity).toBe('easy');
      }
    }
  });

  it('prefers machines in a gym and varies the move through the week', () => {
    const p = make(settings({ trainingDays: ['mon', 'tue', 'wed', 'thu', 'fri'] }));
    const picks = p.sessions.map((s) => s.cardio!.exerciseId);
    expect(picks.every((id) => getExercise(id)!.equipment.includes('machine'))).toBe(true);
    expect(new Set(picks).size).toBeGreaterThan(1);
  });

  it('sets the pace: moderate for fat loss and general, easy for muscle, strength, new lifters and caps', () => {
    expect(cardioIntensity(settings({ goal: 'fat_loss' }))).toBe('moderate');
    expect(cardioIntensity(settings({ goal: 'general' }))).toBe('moderate');
    expect(cardioIntensity(settings({ goal: 'muscle' }))).toBe('easy');
    expect(cardioIntensity(settings({ goal: 'strength' }))).toBe('easy');
    expect(cardioIntensity(settings({ goal: 'fat_loss', experience: 'new' }))).toBe('easy');
    expect(cardioIntensity(settings({ goal: 'fat_loss', lowIntensity: true }))).toBe('easy');
    expect(cardioMinutes(settings({ goal: 'fat_loss', sessionMinutes: 75, ramadan: { enabled: true } }))).toBe(10);
  });

  it('offers the interval moves only to non-new fat loss and general users without caps', () => {
    const hasIntervals = (s: WorkoutSettings) => cardioPool(s).some((e) => e.pattern === 'conditioning');
    expect(hasIntervals(settings({ goal: 'fat_loss' }))).toBe(true);
    expect(hasIntervals(settings({ goal: 'muscle' }))).toBe(false);
    expect(hasIntervals(settings({ goal: 'fat_loss', experience: 'new' }))).toBe(false);
    expect(hasIntervals(settings({ goal: 'general', lowIntensity: true }))).toBe(false);
    // Steady cardio always comes first, so it is the default pick.
    expect(cardioPool(settings({ goal: 'fat_loss' }))[0].pattern).toBe('cardio');
  });
});

describe('swapping cardio', () => {
  const p = make(settings({ goal: 'fat_loss' }));
  const cardio = p.sessions[0].cardio!;

  it('lists the other cardio moves and applies a choice that sticks', () => {
    const candidates = swapCandidates(p, cardio.slotId, { limit: Infinity });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((e) => e.id === cardio.exerciseId)).toBe(false);
    const choice = candidates.find((e) => e.pattern === 'conditioning')!.id;
    const swapped = applySwap(p, cardio.slotId, choice);
    expect(exerciseForWeek(swapped, cardio.slotId, 0)).toBe(choice);
    expect(exerciseForWeek(swapped, cardio.slotId, 9)).toBe(choice);
    expect(isUserSwap(swapped, cardio.slotId)).toBe(true);
    expect(regeneratePlan(swapped, swapped.settings).swaps[cardio.slotId]).toBe(choice);
    expect(regeneratePlan(swapped, { ...swapped.settings, goal: 'muscle' }).swaps[cardio.slotId]).toBeUndefined();
  });

  it('keeps a place for intervals even when a full gym fills the steady list', () => {
    const list = swapCandidates(p, cardio.slotId);
    expect(list.filter((e) => e.pattern === 'cardio').length).toBeLessThanOrEqual(8);
    const intervals = list.filter((e) => e.pattern === 'conditioning');
    expect(intervals.length).toBeGreaterThan(0);
    expect(intervals.length).toBeLessThanOrEqual(3);
  });

  it('reads the cardio exercise for a week without a swap', () => {
    expect(exerciseForWeek(p, cardio.slotId, 3)).toBe(cardio.exerciseId);
  });
});

describe('upgradePlan', () => {
  it('adds cardio to a plan saved before phase 6b, keeping its seed, start, swaps and creation time', () => {
    const fresh = make(settings());
    const slotId = fresh.sessions[0].slots[0].slotId;
    const choice = swapCandidates(fresh, slotId)[0].id;
    const old: WeeklyWorkoutPlan = {
      ...applySwap(fresh, slotId, choice),
      createdAt: '2026-10-19T08:00:00.000Z',
      sessions: fresh.sessions.map(({ cardio: _cardio, ...session }) => session),
    };
    delete old.restDayWalk;
    const upgraded = upgradePlan(old);
    expect(upgraded.sessions.every((s) => s.cardio)).toBe(true);
    expect(upgraded.restDayWalk).toBeDefined();
    expect(upgraded).toMatchObject({ seed: old.seed, blockStart: old.blockStart, createdAt: old.createdAt });
    expect(upgraded.swaps[slotId]).toBe(choice);
    expect(upgradePlan(upgraded)).toBe(upgraded);
  });
});
