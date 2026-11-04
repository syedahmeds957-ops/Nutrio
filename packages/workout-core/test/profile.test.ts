import { describe, expect, it } from 'vitest';
import { cardioMinutes, cardioPool } from '../src/cardio.js';
import { getExercise } from '../src/catalogue.js';
import { generateWeeklyPlan } from '../src/generator.js';
import { nextTarget } from '../src/progression.js';
import { normalizeSearch, searchExercises } from '../src/search.js';
import { swapCandidates } from '../src/swapper.js';
import { availableEquipment } from '../src/select.js';
import { PlannedSlot, TrainingProfile, WorkoutSettings } from '../src/types.js';

function settings(overrides: Partial<WorkoutSettings> = {}, profile?: TrainingProfile): WorkoutSettings {
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
    ...(profile ? { profile } : {}),
  };
}
const make = (s: WorkoutSettings, seed = 4) => generateWeeklyPlan(s, { seed, today: '2026-10-19' });
const everyExercise = (s: WorkoutSettings) => {
  const p = make(s);
  return p.sessions.flatMap((session) => [
    ...session.slots.flatMap((slot) => [slot.exerciseId, ...slot.alternates, ...swapCandidates(p, slot.slotId, { limit: Infinity }).map((e) => e.id)]),
    ...(session.cardio ? [session.cardio.exerciseId, ...session.cardio.alternates] : []),
  ]);
};

describe('dislikes and likes', () => {
  it('never picks a disliked exercise: not in a slot, an alternate, a swap or cardio', () => {
    const base = make(settings());
    const disliked = [base.sessions[0].slots[0].exerciseId, base.sessions[1].slots[1].exerciseId, base.sessions[0].cardio!.exerciseId];
    const used = everyExercise(settings({}, { dislikes: disliked }));
    for (const id of disliked) expect(used).not.toContain(id);
  });

  it('keeps a liked exercise in a slot it fits', () => {
    const base = make(settings());
    const slot = base.sessions[0].slots.find((s) => s.role === 'accessory')!;
    const liked = swapCandidates(base, slot.slotId, { limit: Infinity }).find((e) => e.compound === getExercise(slot.exerciseId)!.compound)!;
    const p = make(settings({}, { likes: [liked.id] }));
    expect(p.sessions.flatMap((s) => s.slots.map((x) => x.exerciseId))).toContain(liked.id);
  });

  it('keeps exercises the user already lifts, like liked ones', () => {
    const p = make(settings({}, { lifts: [{ exerciseId: 'barbell-bench-press', loadKg: 60, reps: 8 }] }));
    expect(p.sessions.flatMap((s) => s.slots.map((x) => x.exerciseId))).toContain('barbell-bench-press');
  });

  it('never makes a liked isolation move a main lift', () => {
    expect(getExercise('pec-deck')!.compound).toBe(false);
    const p = make(settings({}, { likes: ['pec-deck'] }));
    const slots = p.sessions.flatMap((s) => s.slots);
    for (const slot of slots) {
      if (slot.role === 'main') expect(slot.exerciseId).not.toBe('pec-deck');
    }
  });
});

describe('sports days', () => {
  it('moves leg day off the day before cricket', () => {
    const s = settings({ trainingDays: ['mon', 'tue', 'thu', 'fri'] });
    expect(make(s).sessions.find((x) => x.day === 'fri')!.template).toBe('lower');
    const withCricket = make(settings({ trainingDays: ['mon', 'tue', 'thu', 'fri'] }, { sports: [{ kind: 'cricket', days: ['sat'] }] }));
    const friday = withCricket.sessions.find((x) => x.day === 'fri')!;
    expect(['lower', 'legs']).not.toContain(friday.template);
    expect(withCricket.sessions.filter((x) => x.template === 'lower')).toHaveLength(2);
  });

  it('lightens lower-body main lifts on a full-body day it cannot move', () => {
    const plain = make(settings());
    const withFootball = make(settings({}, { sports: [{ kind: 'football', days: ['fri'] }] }));
    const legMain = (p: ReturnType<typeof make>) => p.sessions.find((x) => x.day === 'fri')!.slots.find((x) => x.role === 'main' && ['squat', 'hinge', 'lunge'].includes(x.pattern))!;
    expect(legMain(plain)).toMatchObject({ repMin: 8, repMax: 12 });
    expect(legMain(withFootball)).toMatchObject({ repMin: 10, repMax: 15 });
    // Other days keep the full prescription.
    const monday = withFootball.sessions.find((x) => x.day === 'mon')!.slots.find((x) => x.role === 'main')!;
    expect(monday.repMin).toBe(8);
  });
});

describe('training history and cardio habits', () => {
  it('gives over a year of training the volume of "some" experience', () => {
    const newbie = make(settings({ experience: 'new' }));
    const trained = make(settings({ experience: 'new' }, { trainingNow: { active: true, duration: 'over_a_year' } }));
    const mainSets = (p: ReturnType<typeof make>) => p.sessions[0].slots.find((s) => s.role === 'main')!.sets;
    expect(mainSets(newbie)).toBe(2);
    expect(mainSets(trained)).toBe(3);
  });

  it('puts cardio the user enjoys first and gives half an hour a day or more the next size up', () => {
    const cyclist = settings({}, { cardio: { likes: ['cycling'] } });
    expect(['stationary-bike', 'recumbent-bike']).toContain(cardioPool(cyclist)[0].id);
    expect(make(cyclist).sessions.every((s) => ['stationary-bike', 'recumbent-bike'].includes(s.cardio!.exerciseId))).toBe(true);
    expect(cardioMinutes(settings({ sessionMinutes: 45 }))).toBe(8);
    expect(cardioMinutes(settings({ sessionMinutes: 45 }, { cardio: { habit: '30_to_60', likes: [] } }))).toBe(10);
  });
});

describe('starting from current lifts', () => {
  const slot = (exerciseId: string, overrides: Partial<PlannedSlot> = {}): PlannedSlot => ({
    slotId: 'full_a:horizontal_push:0', pattern: 'horizontal_push', role: 'main', exerciseId, alternates: [exerciseId],
    sets: 3, repMin: 8, repMax: 12, unit: 'reps', restSec: 90, targetRir: 1, ...overrides,
  });

  it('turns a current lift into a starting weight for the range, rounded down to a real step', () => {
    const s = settings({}, { lifts: [{ exerciseId: 'barbell-bench-press', loadKg: 60, reps: 8 }] });
    expect(nextTarget(slot('barbell-bench-press'), [], s)).toMatchObject({ reason: 'from_current_lift', loadKg: 57.5, reasonParams: { kg: 60, reps: 8 } });
    // A heavy triple becomes a lighter weight for 8–12.
    const triple = settings({}, { lifts: [{ exerciseId: 'barbell-bench-press', loadKg: 80, reps: 3 }] });
    // 80 × 3 → estimated max 88 kg → 88 / (1 + 9/30) ≈ 67.7, rounded down to 67.5.
    expect(nextTarget(slot('barbell-bench-press'), [], triple).loadKg).toBe(67.5);
  });

  it('uses a weight the user owns at home', () => {
    const s = settings({ location: 'home_equipment', homeEquipment: ['dumbbell', 'bench'], dumbbellWeightsKg: [6, 10, 14] }, { lifts: [{ exerciseId: 'dumbbell-bench-press', loadKg: 15, reps: 10 }] });
    expect(nextTarget(slot('dumbbell-bench-press'), [], s).loadKg).toBe(14);
  });

  it('starts a bodyweight move from the reps the user can do', () => {
    const s = settings({ location: 'home_none' }, { lifts: [{ exerciseId: 'push-up', reps: 20 }] });
    expect(nextTarget(slot('push-up'), [], s)).toMatchObject({ reason: 'from_current_lift', reps: 12 });
  });

  it('lets logged history take over once there is some', () => {
    const s = settings({}, { lifts: [{ exerciseId: 'barbell-bench-press', loadKg: 60, reps: 8 }] });
    const log = {
      dateKey: '2026-10-19', day: 'mon' as const, template: 'full_a' as const, startedAt: '',
      exercises: [{ slotId: 'full_a:horizontal_push:0', exerciseId: 'barbell-bench-press', sets: [{ reps: 12, loadKg: 57.5, done: true }, { reps: 12, loadKg: 57.5, done: true }, { reps: 12, loadKg: 57.5, done: true }] }],
    };
    expect(nextTarget(slot('barbell-bench-press'), [log], s)).toMatchObject({ reason: 'hit_top_add_load', loadKg: 60 });
  });
});

describe('searchExercises', () => {
  it('finds by English name, nickname and Arabic', () => {
    expect(searchExercises('bench')[0].id).toBe('barbell-bench-press');
    expect(searchExercises('rdl').map((e) => e.id)).toContain('romanian-deadlift');
    expect(searchExercises('ohp').map((e) => e.id)).toContain('dumbbell-shoulder-press');
    expect(searchExercises('بنش')[0].id).toBe('barbell-bench-press');
    expect(searchExercises('سكوات').every((e) => e.pattern === 'squat' || /squat/i.test(e.name.en))).toBe(true);
    expect(searchExercises('ضغط').length).toBeGreaterThan(3);
    expect(searchExercises('')).toEqual([]);
  });

  it('only returns moves the user can do when given their settings', () => {
    const homeNone = settings({ location: 'home_none' }, { dislikes: ['push-up'] });
    const available = availableEquipment(homeNone);
    const results = searchExercises('press', { settings: homeNone, limit: 50 });
    expect(results.every((e) => e.equipment.every((item) => available.has(item)))).toBe(true);
    expect(searchExercises('push', { settings: homeNone }).map((e) => e.id)).not.toContain('push-up');
  });

  it('ignores Arabic diacritics and letter forms', () => {
    expect(normalizeSearch('إِضَغْط')).toBe('اضغط');
  });
});

describe('answers that depend on experience', () => {
  const pushSlot: PlannedSlot = {
    slotId: 'full_a:horizontal_push:0', pattern: 'horizontal_push', role: 'main', exerciseId: 'push-up', alternates: ['push-up'],
    sets: 3, repMin: 8, repMax: 12, unit: 'reps', restSec: 90, targetRir: 2,
  };

  it('starts a beginner who can do few push-ups on the easier variation', () => {
    const homeNew = settings({ location: 'home_none', experience: 'new' });
    const pushes = (s: WorkoutSettings) => make(s).sessions.flatMap((x) => x.slots).filter((x) => x.pattern === 'horizontal_push').map((x) => x.exerciseId);
    expect(pushes(homeNew)).toContain('push-up');
    const weak = pushes(settings({ location: 'home_none', experience: 'new' }, { ability: { pushUps: 'none' } }));
    expect(weak).not.toContain('push-up');
    expect(weak.every((id) => !getExercise(id)!.easier || getExercise(id)!.pattern !== 'horizontal_push')).toBe(true);
  });

  it('reads push-ups and plank answers as starting reps and seconds', () => {
    const s = settings({ location: 'home_none', experience: 'new' }, { ability: { pushUps: '6_to_15', plank: 'over_45' } });
    expect(nextTarget(pushSlot, [], s)).toMatchObject({ reason: 'from_current_lift', reps: 8 });
    const plank: PlannedSlot = { ...pushSlot, slotId: 'full_a:core:0', pattern: 'core', exerciseId: 'plank', alternates: ['plank'], unit: 'seconds', repMin: 30, repMax: 45 };
    expect(nextTarget(plank, [], s)).toMatchObject({ reason: 'from_current_lift', reps: 45 });
  });

  it('sizes cardio from how long a beginner can walk briskly', () => {
    expect(cardioMinutes(settings({ goal: 'fat_loss', sessionMinutes: 45 }, { ability: { walk: 'under_10' } }))).toBe(5);
    expect(cardioMinutes(settings({ goal: 'fat_loss', sessionMinutes: 45 }, { ability: { walk: 'over_40' } }))).toBe(20);
  });

  it('leaves out jumping when asked', () => {
    const used = everyExercise(settings({ location: 'home_none', goal: 'fat_loss' }, { avoidJumping: true }));
    expect(used.every((id) => !getExercise(id)!.highImpact)).toBe(true);
  });

  it('starts lighter after a break, by how long it was', () => {
    const bench: PlannedSlot = { ...pushSlot, exerciseId: 'barbell-bench-press', alternates: ['barbell-bench-press'], targetRir: 1 };
    const lift = { exerciseId: 'barbell-bench-press', loadKg: 60, reps: 8 };
    const now = nextTarget(bench, [], settings({}, { trainingNow: { active: true }, lifts: [lift] }));
    const longBreak = nextTarget(bench, [], settings({}, { trainingNow: { active: false, breakLength: 'over_6_months' }, lifts: [lift] }));
    expect(now.loadKg).toBe(57.5);
    expect(longBreak).toMatchObject({ reason: 'from_current_lift', reasonParams: { back: 1 } });
    expect(longBreak.loadKg).toBe(45);
  });
});
