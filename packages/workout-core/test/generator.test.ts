import { describe, expect, it } from 'vitest';
import { getExercise } from '../src/catalogue.js';
import {
  exerciseForWeek,
  generateWeeklyPlan,
  InvalidWorkoutSettings,
  regeneratePlan,
  WEEKDAYS,
  weekIndexFor,
} from '../src/generator.js';
import { prescribe } from '../src/prescription.js';
import { availableEquipment, isAllowed } from '../src/select.js';
import { chooseSplit, SLOTS_FOR_MINUTES } from '../src/split.js';
import {
  Experience,
  SessionMinutes,
  TrainingLocation,
  Weekday,
  WeeklyWorkoutPlan,
  WorkoutGoal,
  WorkoutSettings,
} from '../src/types.js';

const TODAY = '2026-10-19';

const DAY_SETS: Record<number, Weekday[]> = {
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'fri'],
  5: ['mon', 'tue', 'wed', 'thu', 'fri'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

function settings(overrides: Partial<WorkoutSettings> = {}): WorkoutSettings {
  return {
    goal: 'muscle',
    experience: 'some',
    location: 'gym',
    homeEquipment: [],
    dumbbellWeightsKg: [],
    trainingDays: DAY_SETS[4],
    sessionMinutes: 60,
    focus: [],
    protectedJoints: [],
    lowIntensity: false,
    ramadan: { enabled: false },
    ...overrides,
  };
}

/** A day inside Ramadan 1448, so plans that use Ramadan mode get its caps. */
const IN_RAMADAN = '2027-02-15';
const plan = (s: WorkoutSettings, seed = 7) => generateWeeklyPlan(s, { seed, today: TODAY, asOf: s.ramadan.enabled ? IN_RAMADAN : TODAY });

function targetMinutes(s: WorkoutSettings): number {
  return s.ramadan.enabled ? Math.min(s.sessionMinutes, 40) : s.sessionMinutes;
}

/** Every rule a generated plan must keep, whatever the settings. */
function expectValidPlan(p: WeeklyWorkoutPlan, s: WorkoutSettings): void {
  const label = JSON.stringify({ ...s, homeEquipment: undefined, dumbbellWeightsKg: undefined });
  const expectedDays = WEEKDAYS.filter((day) => s.trainingDays.includes(day));
  expect(p.sessions.map((session) => session.day), label).toEqual(expectedDays);

  const capped = s.ramadan.enabled || s.lowIntensity;
  const maxSlots = Math.min(SLOTS_FOR_MINUTES[s.sessionMinutes], s.ramadan.enabled ? 4 : Infinity);
  const available = availableEquipment(s);

  for (const session of p.sessions) {
    expect(session.slots.length, label).toBeGreaterThanOrEqual(2);
    expect(session.slots.length, label).toBeLessThanOrEqual(maxSlots);
    expect(session.estimatedMinutes, label).toBeLessThanOrEqual(targetMinutes(s) + 5);
    if (s.ramadan.enabled) expect(session.estimatedMinutes, label).toBeLessThanOrEqual(45);

    const ids = session.slots.map((slot) => slot.exerciseId);
    expect(new Set(ids).size, `${label} repeats within ${session.day}`).toBe(ids.length);

    const rotation = session.slots.flatMap((slot) => slot.alternates);
    expect(new Set(rotation).size, `${label} rotation overlaps in ${session.day}`).toBe(rotation.length);

    for (const slot of session.slots) {
      for (const id of slot.alternates) {
        const exercise = getExercise(id);
        expect(exercise, id).toBeDefined();
        expect(exercise!.equipment.every((item) => available.has(item)), `${label} ${id} equipment`).toBe(true);
        expect(isAllowed(exercise!, s), `${label} ${id} not allowed`).toBe(true);
        expect(exercise!.pattern, id).toBe(slot.pattern);
      }
      expect(slot.alternates[0]).toBe(slot.exerciseId);
      expect(slot.sets, label).toBeGreaterThanOrEqual(2);
      expect(slot.repMin, label).toBeLessThanOrEqual(slot.repMax);
      if (capped) {
        expect(slot.targetRir, label).toBeGreaterThanOrEqual(s.lowIntensity ? 3 : 2);
        expect(slot.restSec, label).toBeGreaterThanOrEqual(90);
      }
    }

    if (capped) expect(session.finisher, label).toBeUndefined();
    if (session.finisher) {
      for (const id of session.finisher.exerciseIds) {
        expect(getExercise(id)?.pattern).toBe('conditioning');
        expect(isAllowed(getExercise(id)!, s)).toBe(true);
      }
    }
  }
}

describe('generateWeeklyPlan over every combination of setup answers', () => {
  const locations: TrainingLocation[] = ['home_none', 'home_equipment', 'gym'];
  const experiences: Experience[] = ['new', 'some', 'experienced'];
  const goals: WorkoutGoal[] = ['muscle', 'strength', 'fat_loss', 'general'];
  const minutes: SessionMinutes[] = [20, 45, 75];
  const modes = [
    { name: 'normal', ramadan: false, lowIntensity: false },
    { name: 'ramadan', ramadan: true, lowIntensity: false },
    { name: 'low intensity', ramadan: false, lowIntensity: true },
  ];

  for (const days of [2, 3, 4, 5, 6]) {
    for (const location of locations) {
      it(`${days} days at ${location}: valid for every experience, goal, length and mode`, () => {
        let checked = 0;
        for (const experience of experiences) {
          for (const goal of goals) {
            for (const sessionMinutes of minutes) {
              for (const mode of modes) {
                const s = settings({
                  goal,
                  experience,
                  location,
                  homeEquipment: location === 'home_equipment' ? ['dumbbell', 'bands', 'bench'] : [],
                  dumbbellWeightsKg: location === 'home_equipment' ? [4, 6, 10] : [],
                  trainingDays: DAY_SETS[days],
                  sessionMinutes,
                  lowIntensity: mode.lowIntensity,
                  ramadan: { enabled: mode.ramadan, slot: mode.ramadan ? 'before_iftar' : undefined },
                });
                const p = plan(s);
                expectValidPlan(p, s);
                if (experience === 'new') {
                  for (const slot of p.sessions.flatMap((session) => session.slots)) {
                    expect(getExercise(slot.exerciseId)?.level).toBe('beginner');
                  }
                }
                if (mode.ramadan || mode.lowIntensity) {
                  for (const slot of p.sessions.flatMap((session) => session.slots)) {
                    expect(getExercise(slot.exerciseId)?.highImpact).toBe(false);
                  }
                }
                checked++;
              }
            }
          }
        }
        expect(checked).toBe(3 * 4 * 3 * 3);
      });
    }
  }
});

describe('determinism', () => {
  it('gives the same plan for the same seed', () => {
    const s = settings({ location: 'home_equipment', homeEquipment: ['dumbbell', 'bench'] });
    expect(plan(s, 99)).toEqual(plan(s, 99));
  });

  it('keeps the same structure for a different seed', () => {
    for (const location of ['home_none', 'home_equipment', 'gym'] as const) {
      const s = settings({ location, homeEquipment: location === 'home_equipment' ? ['dumbbell'] : [] });
      const a = plan(s, 1);
      const b = plan(s, 2);
      expect(b.split).toBe(a.split);
      expect(b.sessions.map((x) => [x.day, x.template, x.variant, x.slots.map((slot) => slot.role)])).toEqual(
        a.sessions.map((x) => [x.day, x.template, x.variant, x.slots.map((slot) => slot.role)])
      );
    }
  });

  it('orders sessions by weekday whatever order the days were picked in', () => {
    const p = plan(settings({ trainingDays: ['fri', 'mon', 'wed'] }));
    expect(p.sessions.map((s) => s.day)).toEqual(['mon', 'wed', 'fri']);
  });
});

describe('splits', () => {
  it('follows the days-per-week table', () => {
    expect(chooseSplit(2, 'some', 'gym').templates).toEqual(['full_a', 'full_b']);
    expect(chooseSplit(3, 'some', 'gym').split).toBe('full_body_3');
    expect(chooseSplit(3, 'experienced', 'gym').split).toBe('ppl_3');
    expect(chooseSplit(3, 'experienced', 'home_equipment').split).toBe('full_body_3');
    expect(chooseSplit(4, 'some', 'gym').templates).toEqual(['upper', 'lower', 'upper', 'lower']);
    expect(chooseSplit(5, 'some', 'gym').templates).toEqual(['upper', 'lower', 'push', 'pull', 'legs']);
    expect(chooseSplit(6, 'some', 'gym').split).toBe('ppl_6');
  });

  it('keeps no-equipment users on full-body days, which have something for every muscle', () => {
    expect(chooseSplit(4, 'some', 'home_none')).toEqual({ split: 'full_body_4', templates: ['full_a', 'full_b', 'full_c', 'full_a'] });
    expect(chooseSplit(6, 'experienced', 'home_none').templates).toEqual(['full_a', 'full_b', 'full_c', 'full_a', 'full_b', 'full_c']);
  });

  it('labels repeated templates A and B with distinct slot ids', () => {
    const p = plan(settings());
    expect(p.sessions.map((s) => `${s.template}-${s.variant}`)).toEqual(['upper-a', 'lower-a', 'upper-b', 'lower-b']);
    const slotIds = p.sessions.flatMap((s) => s.slots.map((slot) => slot.slotId));
    expect(new Set(slotIds).size).toBe(slotIds.length);
    expect(slotIds[0]).toBe('upper-a:horizontal_push:0');
  });
});

describe('exercise choice', () => {
  it('builds gym main lifts on loaded exercises, barbell first for experienced lifters', () => {
    const p = plan(settings({ experience: 'experienced' }));
    for (const slot of p.sessions.flatMap((s) => s.slots).filter((slot) => slot.role === 'main')) {
      const exercise = getExercise(slot.exerciseId)!;
      expect(exercise.tracksLoad, slot.exerciseId).toBe(true);
      expect(exercise.equipment, slot.exerciseId).toContain('barbell');
    }
  });

  it('starts new gym lifters on machines and dumbbells, not the barbell', () => {
    const p = plan(settings({ experience: 'new' }));
    for (const slot of p.sessions.flatMap((s) => s.slots).filter((slot) => slot.role === 'main')) {
      expect(getExercise(slot.exerciseId)!.equipment, slot.exerciseId).not.toContain('barbell');
    }
  });

  it('uses the equipment a home user owns for main lifts', () => {
    const p = plan(settings({ location: 'home_equipment', homeEquipment: ['dumbbell', 'bench'], trainingDays: DAY_SETS[3] }));
    const mains = p.sessions.flatMap((s) => s.slots).filter((slot) => slot.role === 'main');
    const usingDumbbells = mains.filter((slot) => getExercise(slot.exerciseId)!.equipment.includes('dumbbell'));
    expect(usingDumbbells.length).toBeGreaterThanOrEqual(mains.length - 1);
  });

  it('fills no-equipment gaps with a related pattern instead of leaving a slot empty', () => {
    const s = settings({ location: 'home_none', trainingDays: DAY_SETS[2], sessionMinutes: 60 });
    const p = plan(s);
    for (const session of p.sessions) expect(session.slots.length).toBe(6);
    const verticalPush = p.sessions[1].slots.find((slot) => slot.slotId.includes(':vertical_push:'));
    expect(verticalPush?.pattern).toBe('horizontal_push');
    const verticalPull = p.sessions[1].slots.find((slot) => slot.slotId.includes(':vertical_pull:'));
    expect(verticalPull).toBeDefined();
    expect(verticalPull!.pattern).not.toBe('vertical_pull');
  });

  it('never uses an exercise that loads a protected joint', () => {
    for (const location of ['home_none', 'home_equipment', 'gym'] as const) {
      for (const days of [2, 4, 6]) {
        const s = settings({
          location,
          homeEquipment: location === 'home_equipment' ? ['dumbbell', 'bands', 'kettlebell', 'bench', 'pullup_bar'] : [],
          trainingDays: DAY_SETS[days],
          protectedJoints: ['knee', 'shoulder'],
        });
        const p = plan(s);
        expectValidPlan(p, s);
        for (const id of p.sessions.flatMap((x) => x.slots.flatMap((slot) => slot.alternates))) {
          const joints = getExercise(id)!.jointLoads;
          expect(joints.includes('knee') || joints.includes('shoulder'), `${location} ${id}`).toBe(false);
        }
      }
    }
  });

  it('promotes a focus area so it survives in a short session', () => {
    const p = plan(settings({ sessionMinutes: 30, focus: ['arms'] }));
    const upper = p.sessions[0];
    expect(upper.slots.slice(0, 2).every((slot) => slot.role === 'main')).toBe(true);
    expect(['biceps', 'triceps']).toContain(upper.slots[2].pattern);
  });

  it('limits repeats within the week when there are alternatives', () => {
    const p = plan(settings({ location: 'home_equipment', homeEquipment: ['dumbbell', 'bench'], trainingDays: DAY_SETS[3] }));
    const counts = new Map<string, number>();
    for (const id of p.sessions.flatMap((s) => s.slots.map((slot) => slot.exerciseId))) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });
});

describe('time and finishers', () => {
  it('fits a 20-minute strength session by trimming accessories, then main sets evenly', () => {
    const p = plan(settings({ goal: 'strength', sessionMinutes: 20 }));
    for (const session of p.sessions) {
      expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
      expect(session.slots.every((slot) => slot.role === 'main')).toBe(true);
      const sets = session.slots.map((slot) => slot.sets);
      expect(Math.max(...sets) - Math.min(...sets)).toBeLessThanOrEqual(1);
    }
  });

  it('ends every session with a cardio block instead of the old finisher', () => {
    for (const goal of ['fat_loss', 'muscle'] as const) {
      const p = plan(settings({ goal, sessionMinutes: 45 }));
      expect(p.sessions.every((s) => s.cardio && !s.finisher)).toBe(true);
    }
  });

  it('caps Ramadan sessions at four exercises and 45 minutes', () => {
    const p = plan(settings({ sessionMinutes: 75, ramadan: { enabled: true, slot: 'after_taraweeh' } }));
    for (const session of p.sessions) {
      expect(session.slots.length).toBeLessThanOrEqual(4);
      expect(session.estimatedMinutes).toBeLessThanOrEqual(45);
    }
  });
});

describe('prescription', () => {
  const none = { ramadan: false, lowIntensity: false };

  it('follows the goal table', () => {
    expect(prescribe('strength', 'some', 'main', none, false)).toEqual({ sets: 4, repMin: 4, repMax: 6, restSec: 150, targetRir: 2, unit: 'reps' });
    expect(prescribe('muscle', 'some', 'main', none, false)).toMatchObject({ sets: 3, repMin: 8, repMax: 12, restSec: 90 });
    expect(prescribe('fat_loss', 'some', 'accessory', none, false)).toMatchObject({ sets: 2, repMin: 12, repMax: 15 });
  });

  it('gives new lifters one set fewer and more reps in reserve', () => {
    expect(prescribe('muscle', 'new', 'main', none, false)).toMatchObject({ sets: 2, targetRir: 2 });
    expect(prescribe('fat_loss', 'new', 'accessory', none, false).sets).toBe(2);
  });

  it('softens effort and lengthens rest under Ramadan or low intensity', () => {
    expect(prescribe('muscle', 'some', 'main', { ramadan: true, lowIntensity: false }, false)).toMatchObject({ targetRir: 2, restSec: 90 });
    expect(prescribe('fat_loss', 'some', 'main', { ramadan: false, lowIntensity: true }, false)).toMatchObject({ targetRir: 3, restSec: 90 });
  });

  it('prescribes holds in seconds', () => {
    expect(prescribe('muscle', 'some', 'accessory', none, true)).toMatchObject({ unit: 'seconds', repMin: 30, repMax: 45 });
  });
});

describe('weeks, rotation and swaps', () => {
  it('counts whole weeks from the block start', () => {
    expect(weekIndexFor('2026-10-19', '2026-10-19')).toBe(0);
    expect(weekIndexFor('2026-10-19', '2026-10-25')).toBe(0);
    expect(weekIndexFor('2026-10-19', '2026-10-26')).toBe(1);
    expect(weekIndexFor('2026-12-28', '2027-01-04')).toBe(1);
    expect(weekIndexFor('2026-10-19', '2026-10-01')).toBe(0);
  });

  it('rotates accessories every four weeks and keeps main lifts', () => {
    const p = plan(settings());
    const slots = p.sessions.flatMap((s) => s.slots);
    for (const slot of slots.filter((s) => s.role === 'main')) {
      for (let week = 0; week < 12; week++) expect(exerciseForWeek(p, slot.slotId, week)).toBe(slot.exerciseId);
    }
    const rotating = slots.filter((s) => s.role === 'accessory' && s.alternates.length > 1);
    expect(rotating.length).toBeGreaterThan(0);
    for (const slot of rotating) {
      expect(exerciseForWeek(p, slot.slotId, 3)).toBe(slot.exerciseId);
      expect(exerciseForWeek(p, slot.slotId, 4)).toBe(slot.alternates[1]);
    }
  });

  it('lets a swap override both the plan and the rotation', () => {
    const p = plan(settings());
    const slot = p.sessions[0].slots[0];
    p.swaps[slot.slotId] = 'dumbbell-bench-press';
    expect(exerciseForWeek(p, slot.slotId, 0)).toBe('dumbbell-bench-press');
    expect(exerciseForWeek(p, slot.slotId, 9)).toBe('dumbbell-bench-press');
  });

  it('regenerates with the same seed and block start, keeping swaps that still fit', () => {
    const original = plan(settings());
    const benchSlot = original.sessions[0].slots[0].slotId;
    original.swaps[benchSlot] = 'dumbbell-bench-press';

    const longer = regeneratePlan(original, settings({ sessionMinutes: 75 }));
    expect(longer.seed).toBe(original.seed);
    expect(longer.blockStart).toBe(original.blockStart);
    expect(longer.swaps[benchSlot]).toBe('dumbbell-bench-press');

    const atHome = regeneratePlan(original, settings({ location: 'home_none' }));
    expect(atHome.swaps[benchSlot]).toBeUndefined();
  });
});

describe('validation', () => {
  const cases: [string, Partial<WorkoutSettings>][] = [
    ['one day', { trainingDays: ['mon'] }],
    ['seven days', { trainingDays: [...WEEKDAYS] }],
    ['repeated days', { trainingDays: ['mon', 'mon', 'wed'] }],
    ['an unknown session length', { sessionMinutes: 50 as SessionMinutes }],
    ['gym equipment listed as home equipment', { homeEquipment: ['barbell'] }],
    ['a non-positive dumbbell', { dumbbellWeightsKg: [0] }],
  ];
  for (const [name, overrides] of cases) {
    it(`rejects ${name}`, () => {
      expect(() => plan(settings(overrides))).toThrow(InvalidWorkoutSettings);
    });
  }

  it('rejects a malformed start date', () => {
    expect(() => generateWeeklyPlan(settings(), { seed: 1, today: '19/10/2026' })).toThrow(InvalidWorkoutSettings);
  });
});
